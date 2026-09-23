import React from "react";
import { Link } from "react-router-dom";

/**
 * Inline links inside article prose: [label](/site-relative/path).
 *
 * The knowledge articles cross-reference each other, the service pages, the
 * disciplines and the case studies from inside paragraphs, the way an
 * encyclopedia does. Only site-relative hrefs are honoured — anything not
 * starting with "/" is left as literal text — so article data can never
 * inject an external or javascript: destination.
 */
const LINK = /\[([^\]]+)\]\((\/[^)\s]*)\)/g;

export const renderInline = (text, keyPrefix = "inline") => {
  if (typeof text !== "string" || !text.includes("](/")) return text;
  const out = [];
  let last = 0;
  let i = 0;
  LINK.lastIndex = 0;
  let m;
  while ((m = LINK.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(
      <Link
        key={`${keyPrefix}-${i++}`}
        to={m[2]}
        className="border-b border-[#F19020]/70 font-medium text-[#232A2A] transition-colors hover:border-[#F19020] hover:text-[#A85A12]"
      >
        {m[1]}
      </Link>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
};

/** Plain text for structured data and previews: the label, without the link. */
export const stripInline = (text) => (typeof text === "string" ? text.replace(LINK, "$1") : text);
