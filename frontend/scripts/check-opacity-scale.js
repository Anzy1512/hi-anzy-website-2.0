/**
 * Guard for the invisible-text bug.
 *
 * Tailwind resolves a colour modifier like `text-[#F7F5EE]/78` against the
 * theme's opacity scale. If the step isn't declared, Tailwind emits NO rule —
 * the class silently does nothing and the element falls back to inherited
 * colour. On a charcoal panel that meant ink-on-ink at 1.08:1: text that was
 * present in the DOM, passed every "does the element exist" check, and was
 * invisible on screen.
 *
 * Nothing in the normal build fails when that happens, so this script checks
 * every colour modifier in src/ against the configured scale.
 *
 *   node scripts/check-opacity-scale.js     (exit 1 = a step is missing)
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const cfg = require(path.join(root, "tailwind.config.js"));
const scale = new Set(Object.keys(cfg.theme.extend.opacity));

// Anchored on real colour-utility prefixes so that arbitrary values containing
// a slash (`aspect-[16/9.5]`, `w-1/2`) don't register as false positives.
const UTIL =
  /\b(?:[a-z-]+:)*(?:text|bg|border|ring|ring-offset|from|via|to|divide|outline|placeholder|decoration|accent|caret|fill|stroke|shadow)-(?:\[[^\]\s"'`]+\]|[a-z0-9-]+)\/(\d{1,3})\b/g;

const files = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (/\.(jsx?|tsx?)$/.test(entry.name)) files.push(p);
  }
})(path.join(root, "src"));

const missing = new Map();
let total = 0;

for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  let m;
  while ((m = UTIL.exec(src))) {
    total += 1;
    const step = m[1];
    if (scale.has(step)) continue;
    if (!missing.has(step)) missing.set(step, []);
    const line = src.slice(0, m.index).split("\n").length;
    missing.get(step).push(`${path.relative(root, file)}:${line}  ${m[0]}`);
  }
}

console.log(`scanned ${files.length} files, ${total} colour modifiers`);

if (!missing.size) {
  console.log("OK — every modifier resolves to a configured opacity step");
  process.exit(0);
}

console.error(
  `\nFAIL — ${missing.size} opacity step(s) used but not declared in tailwind.config.js:`
);
for (const step of [...missing.keys()].sort((a, b) => a - b)) {
  const hits = missing.get(step);
  console.error(`\n  /${step}  (${hits.length} usage${hits.length > 1 ? "s" : ""})`);
  hits.slice(0, 5).forEach((h) => console.error(`      ${h}`));
  if (hits.length > 5) console.error(`      …and ${hits.length - 5} more`);
}
console.error("\nAdd the step(s) to OPACITY_STEPS in tailwind.config.js.\n");
process.exit(1);
