import React from "react";
import { PROVENANCE_STYLES } from "@/data/content";

/**
 * The tag's `value` does double duty: it's the style-lookup key AND the label
 * the reader sees, and it arrives from the backend as `relationshipType`
 * ("HI ANZY DIRECT", "HI ANZY + COLLABORATOR"). The key has to stay
 * byte-identical or the lookup misses and the API contract breaks — so the
 * brand mark is substituted at render time only. The chip still reads as an
 * uppercase system label; only the mark itself is set the way it's written.
 */
const renderLabel = (value) =>
  value
    .split(/(HI ANZY)/)
    .filter(Boolean)
    .map((part, i) =>
      part === "HI ANZY" ? (
        <span key={i} className="brand-mark">
          hiAnzy
        </span>
      ) : (
        part
      )
    );

export const ProvenanceTag = ({ value, dark = false, testId }) => {
  const s = PROVENANCE_STYLES[value] || PROVENANCE_STYLES.NETWORK;
  return (
    <span
      data-testid={testId || "provenance-tag"}
      className={`prov-tag sys-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1 ${dark && (value === "HI ANZY" || value === "HI ANZY DIRECT") ? "bg-[#F7F5EE] text-[#232A2A]" : s.cls}`}
    >
      {s.bar && <span className="red-bar" style={{ width: 8 }} />}
      {/* One wrapper keeps the label a single flex item. Splitting the brand
          into its own span makes each fragment an item, which adds the chip's
          6px gap on top of the space already present in the text. */}
      <span>{renderLabel(value)}</span>
    </span>
  );
};
