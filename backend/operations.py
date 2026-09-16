"""Durable notification delivery and enquiry follow-up.

Delivery state lives on the saved record, so a process restart cannot lose an
enquiry between saving it and scheduling its notification.
"""
import asyncio
import logging
import time

from pymongo import ReturnDocument

logger = logging.getLogger("hi-anzy.operations")
MAX_ATTEMPTS = 5


def pending_delivery():
    return {"status": "pending", "attempts": 0, "nextAttemptAt": 0}


async def deliver_record(collection, record_id, send):
    now = time.time()
    record = await collection.find_one_and_update(
        {"id": record_id, "$or": [
            {"delivery.status": {"$in": ["pending", "retry"]}, "delivery.nextAttemptAt": {"$lte": now}},
            {"delivery.status": "sending", "delivery.leaseUntil": {"$lte": now}},
        ]},
        {"$set": {"delivery.status": "sending", "delivery.leaseUntil": now + 120},
         "$inc": {"delivery.attempts": 1}},
        return_document=ReturnDocument.AFTER,
    )
    if not record:
        return False
    try:
        sent = bool(await send(record))
    except Exception as error:
        logger.warning("Notification attempt failed: %s", type(error).__name__)
        sent = False
    attempts = record["delivery"]["attempts"]
    status = "sent" if sent else ("failed" if attempts >= MAX_ATTEMPTS else "retry")
    await collection.update_one(
        {"id": record_id, "delivery.leaseUntil": now + 120},
        {"$set": {"delivery.status": status, "delivery.lastAttemptAt": time.time(),
                  "delivery.nextAttemptAt": time.time() + min(3600, 60 * 2 ** attempts)},
         "$unset": {"delivery.leaseUntil": ""}},
    )
    if status == "failed":
        logger.error("Notification needs manual review: record %s", record_id)
    return sent


async def process_pending(collection, send):
    now = time.time()
    records = await collection.find({"$or": [
        {"delivery.status": {"$in": ["pending", "retry"]}, "delivery.nextAttemptAt": {"$lte": now}},
        {"delivery.status": "sending", "delivery.leaseUntil": {"$lte": now}},
    ]}, {"id": 1}).limit(20).to_list(length=20)
    for record in records:
        await deliver_record(collection, record["id"], send)


async def notification_loop(db, contact_sender, subscriber_sender, configured):
    while True:
        try:
            # Missing credentials should not exhaust retries before setup.
            if configured():
                await process_pending(db.contact_submissions, contact_sender)
                await process_pending(db.subscribers, subscriber_sender)
        except Exception as error:
            logger.error("Notification worker unavailable: %s", type(error).__name__)
        await asyncio.sleep(30)
