import React from "react";

/**
 * Every brand PNG/JPG has a .webp and a .avif sibling sitting next to it
 * (scripts/convert-images.py) — this is the one place that reaches for them,
 * so a raw `<img src="/brand/foo.png">` never has to become three lines of
 * <picture> markup at the call site. Falls through to the original for the
 * (now rare) browser that supports neither newer format; <picture> already
 * does that fallback natively; nothing here has to detect anything.
 */
export const Picture = ({ src, alt = "", ...imgProps }) => {
  const match = /\.(png|jpe?g)$/i.exec(src);
  if (!match) return <img src={src} alt={alt} {...imgProps} />;
  const base = src.slice(0, match.index);
  return (
    <picture>
      <source srcSet={`${base}.avif`} type="image/avif" />
      <source srcSet={`${base}.webp`} type="image/webp" />
      <img src={src} alt={alt} {...imgProps} />
    </picture>
  );
};

export default Picture;
