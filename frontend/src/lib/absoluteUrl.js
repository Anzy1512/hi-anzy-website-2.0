/**
 * Absolute URLs for structured data.
 *
 * schema.org consumers resolve `item` and `@id` as identifiers, not as browser
 * hrefs — a relative path is not reliably resolvable and several validators
 * treat it as invalid outright. Every BreadcrumbList and mainEntityOfPage on
 * this site was emitting site-relative paths.
 *
 * The origin comes from the browser because CRA only inlines REACT_APP_* names,
 * so the build-time SITE_URL never reaches the bundle. The fallback keeps this
 * safe under the string-render that scripts/check-seo-output.js performs, where
 * there is no window at all.
 */
const FALLBACK_ORIGIN = "https://hianzy.com";

export const siteOrigin = () =>
  (typeof window !== "undefined" && window.location && window.location.origin) ||
  FALLBACK_ORIGIN;

/** `/work/foo` → `https://origin/work/foo`. Absolute input is passed through. */
export const abs = (path) => {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteOrigin()}${path.startsWith("/") ? "" : "/"}${path}`;
};
