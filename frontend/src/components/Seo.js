import { useEffect } from "react";
import { SITE_CONTACT } from "@/data/site";

const ORG_JSONLD = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "hiAnzy",
  description: "Business Systems & Transformation Consultancy. We build brand operating systems. From ABC to ROI.",
  slogan: "From ABC to ROI",
  email: SITE_CONTACT.email,
  telephone: SITE_CONTACT.phone,
  contactPoint: [{ "@type": "ContactPoint", contactType: "customer support", email: SITE_CONTACT.email, telephone: SITE_CONTACT.phone }],
  knowsAbout: ["Business Systems Consulting", "Business Transformation", "Business Audit", "Brand Strategy", "Digital Transformation", "AI Automation Consulting", "E-commerce Consulting", "Growth Strategy", "Technology Advisory"],
  // TODO(hiAnzy): add real profile URLs and uncomment. `sameAs` is how a search
  // engine ties this site to the entity behind it, and it is the single
  // biggest schema gap left. Left commented rather than filled with guesses.
  // sameAs: [
  //   "https://www.linkedin.com/company/REPLACE-ME",
  //   "https://www.instagram.com/REPLACE-ME",
  // ],
};

/** Finds-or-creates a <meta> by the given attribute/value pair and sets its content. */
const upsertMeta = (attr, value, content) => {
  let el = document.head.querySelector(`meta[${attr}="${value}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, value);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

const upsertLink = (rel, href) => {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

/** Keep metadata current during client-side navigation; builds also generate it in raw HTML. */
export const Seo = ({ title, description, jsonLd, image, noIndex }) => {
  useEffect(() => {
    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", noIndex ? "noindex,follow" : "index,follow");

    const url = window.location.origin + window.location.pathname;
    upsertLink("canonical", url);

    upsertMeta("property", "og:site_name", "hiAnzy");
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:url", url);

    // Every page gets a share card. No caller was passing `image`, so og:image
    // was never emitted and twitter:card silently degraded to "summary" — a
    // shared link rendered as a text stub on LinkedIn and WhatsApp, which is
    // where this business actually gets shared. og-default.png is a composed
    // 1200x630 card in the brand palette, not a stretched wordmark; a
    // per-page generated card is still the better answer and still open work.
    const ogImage = new URL(image || "/og-default.png", window.location.origin).href;
    upsertMeta("property", "og:image", ogImage);
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", ogImage);

    // JSON-LD is a variable-length list rather than one tag per key, so it
    // cannot be upserted the same way — clear whatever the previous page (or
    // this page's previous render) left, then write the current set fresh.
    // The marker attribute scopes the removal to tags Seo itself wrote.
    document.head.querySelectorAll("script[data-seo-jsonld]").forEach((s) => s.remove());
    const blocks = [ORG_JSONLD, ...(Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [])];
    blocks.forEach((b) => {
      const s = document.createElement("script");
      s.type = "application/ld+json";
      s.setAttribute("data-seo-jsonld", "true");
      s.textContent = JSON.stringify(b);
      document.head.appendChild(s);
    });
  }, [title, description, jsonLd, image, noIndex]);

  return null;
};

export default Seo;
