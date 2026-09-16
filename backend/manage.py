"""Local operations console. Requires access to backend/.env and its database.

Run `python backend/manage.py --help`. Newsletter mail is never sent without --send. The retry command queues an enquiry notification for the API worker.
"""
import argparse
import asyncio
import hashlib
import json
from pathlib import Path

import server
from operations import pending_delivery, deliver_record


async def run(args):
    db = server.db
    if args.command == "status":
        print(json.dumps({"database": db.name, "mailConfigured": server.mail_configured(),
            "adminConfigured": bool(server.os.environ.get("ADMIN_EMAILS")),
            "notificationRecipientConfigured": bool(server.os.environ.get("CONTACT_NOTIFY_EMAIL")),
            "newEnquiries": await db.contact_submissions.count_documents({"reviewStatus": {"$in": ["new", None]}}),
            "failedNotifications": await db.contact_submissions.count_documents({"delivery.status": "failed"}),
            "confirmedSubscribers": await db.subscribers.count_documents({"confirmed": True, "unsubscribed": False})}, indent=2))
    elif args.command == "enquiries":
        query = {} if args.status == "all" else {"reviewStatus": {"$in": ["new", None]} if args.status == "new" else args.status}
        records = await db.contact_submissions.find(query, {"_id": 0, "ip": 0}).sort("createdAt", -1).skip(args.offset).limit(50).to_list(50)
        print(json.dumps(records, indent=2, ensure_ascii=False))
    elif args.command == "review":
        result = await db.contact_submissions.update_one({"id": args.id}, {"$set": {
            "reviewStatus": args.status, "reviewedAt": server.now_iso(), "reviewedBy": "local-operator"}})
        if not result.matched_count:
            raise ValueError("Enquiry not found")
        print("Review status updated.")
    elif args.command == "retry":
        result = await db.contact_submissions.update_one({"id": args.id, "$or": [
            {"delivery.status": {"$in": ["failed", "retry", "pending"]}}, {"delivery": {"$exists": False}}]},
            {"$set": {"delivery": pending_delivery()}})
        if not result.matched_count:
            raise ValueError("Enquiry missing, already sent, or currently sending")
        print("Notification queued. The API worker will retry when mail is configured.")
    elif args.command == "newsletter":
        subject = " ".join(args.subject.splitlines())
        body = Path(args.body_file).read_text(encoding="utf-8")
        signature = hashlib.sha256((subject + "\n" + body).encode()).hexdigest()
        existing = await db.newsletter_campaigns.find_one({"_id": args.campaign})
        if existing and existing["signature"] != signature:
            raise ValueError("This campaign ID already has different content; use a new ID")
        count = await db.subscribers.count_documents({"confirmed": True, "unsubscribed": False})
        if not args.send:
            print(f"Preview only: {count} confirmed recipients. Review the subject/body, then add --send to deliver.")
            return
        if not server.mail_configured():
            raise ValueError("Configure an email provider before sending")
        await db.newsletter_campaigns.update_one({"_id": args.campaign}, {"$setOnInsert": {
            "signature": signature, "subject": subject, "createdAt": server.now_iso()}}, upsert=True)
        await db.newsletter_deliveries.create_index("id", unique=True)
        if args.retry_failed:
            await db.newsletter_deliveries.update_many({"campaign": args.campaign, "delivery.status": "failed"}, {"$set": {"delivery": pending_delivery()}})
        sent = 0
        async for subscriber in db.subscribers.find({"confirmed": True, "unsubscribed": False}):
            record_id = hashlib.sha256((args.campaign + ':' + subscriber['id']).encode()).hexdigest()
            await db.newsletter_deliveries.update_one({"id": record_id}, {"$setOnInsert": {
                "id": record_id, "campaign": args.campaign, "subscriberId": subscriber['id'], "delivery": pending_delivery()}}, upsert=True)
            async def send(record):
                # Recheck consent immediately before each delivery, including retries.
                recipient = await db.subscribers.find_one({"id": record['subscriberId'], "confirmed": True, "unsubscribed": False})
                if not recipient:
                    return True
                unsubscribe = f"{server.public_api_url()}/api/newsletter/unsubscribe?token={recipient['unsubscribeToken']}"
                return await server.send_email(subject, f"{body}\n\nUnsubscribe from hiAnzy notes:\n{unsubscribe}", recipient['email'])
            if await deliver_record(db.newsletter_deliveries, record_id, send):
                sent += 1
        print(f"Delivered {sent} notes. Rerun the same campaign after the retry interval to retry failures; sent records are skipped.")


def parser():
    p = argparse.ArgumentParser(description=__doc__)
    commands = p.add_subparsers(dest="command", required=True)
    commands.add_parser("status")
    enquiries = commands.add_parser("enquiries")
    enquiries.add_argument("--status", choices=["all", "new", "in_progress", "replied", "closed"], default="all")
    enquiries.add_argument("--offset", type=int, default=0)
    review = commands.add_parser("review")
    review.add_argument("id")
    review.add_argument("status", choices=["new", "in_progress", "replied", "closed"])
    retry = commands.add_parser("retry")
    retry.add_argument("id")
    newsletter = commands.add_parser("newsletter")
    newsletter.add_argument("--campaign", required=True)
    newsletter.add_argument("--subject", required=True)
    newsletter.add_argument("--body-file", required=True)
    newsletter.add_argument("--send", action="store_true")
    newsletter.add_argument("--retry-failed", action="store_true")
    return p


if __name__ == "__main__":
    try:
        asyncio.run(run(parser().parse_args()))
    finally:
        server.client.close()
