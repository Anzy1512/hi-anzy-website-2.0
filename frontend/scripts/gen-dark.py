# -*- coding: utf-8 -*-
"""Generate the night-mode override layer from the colours actually in use.

The palette is applied as Tailwind arbitrary values — ~780 occurrences drawn
from only ~81 distinct utilities, with no use of the theme tokens at all. So
night mode is a set of generated rules keyed to those utilities rather than
780 hand edits, and re-running this is how it stays correct when someone adds
a colour.

Why this cannot be a blind hex swap: one hex serves several roles. #232A2A is
body text on paper AND the background of a dark chip sitting on paper.
Flipping both to a light value would turn the chips inside out. The mapping is
therefore keyed on the utility *prefix*, which is what encodes the role.

    python scripts/gen-dark.py
"""
import io
import os
import re

SRC = "src"
OUT = os.path.join("src", "dark.generated.css")

# ── role-keyed mapping ───────────────────────────────────────────────────────
FOREGROUND = {           # text / fill / decoration / placeholder / caret
    "232A2A": "E9E7E0",  # ink on paper -> light ink
    "1D2424": "E9E7E0",
    "1F2525": "E9E7E0",
    "F7F5EE": "F7F5EE",  # already light, sits on dark -> unchanged
    "E0D8C1": "E9E7E0",
    "F19020": "FFA94D",  # accent as text -> on-dark variant
    "E54A25": "FF7A52",  # signal as text -> on-dark variant
    "844B0A": "FFA94D",
    "A8351A": "FF7A52",
    "D6CCB2": "C9C5BA",
    "D8CFB4": "C9C5BA",
    "A85A12": "FFA94D",  # deepened accent text on paper -> on-dark variant
    "FF7A52": "FF7A52",  # already an on-dark value; unchanged, but declared
    "EFEAD8": "E9E7E0",
}
SURFACE = {              # bg / gradient stops
    "E0D8C1": "121717",  # paper ground -> deep ground
    "F7F5EE": "1A2020",  # white card -> dark card
    "232A2A": "394343",  # dark chip on paper -> lifted dark surface, so its
                         # own light label stays readable
    "1D2424": "222A2A",
    "1F2525": "222A2A",
    "F19020": "F19020",  # accent fills keep their hue
    "E54A25": "E54A25",
    "D6CCB2": "2A3232",
    "D8CFB4": "1E2525",  # paper tint used by the builder summary panel
    "EFEAD8": "1E2525",  # pale card ground -> dark card
    "A85A12": "A85A12",
    "FF7A52": "FF7A52",
}
LINE = {                 # border / ring / outline / divide / stroke
    "232A2A": "E9E7E0",
    "1D2424": "E9E7E0",
    "F7F5EE": "F7F5EE",
    "E0D8C1": "E9E7E0",
    "F19020": "FFA94D",
    "E54A25": "FF7A52",
    "A85A12": "FFA94D",
    "FF7A52": "FF7A52",
    "EFEAD8": "E9E7E0",
    "D8CFB4": "E9E7E0",
}

FG_PREFIXES = ("text", "fill", "decoration", "placeholder", "caret")
BG_PREFIXES = ("bg", "from", "to", "via")
LINE_PREFIXES = ("border", "ring", "outline", "divide", "stroke")

UTIL_RE = re.compile(
    r"(?:text|bg|border|from|to|via|fill|stroke|decoration|placeholder|ring|outline|divide|caret)"
    r"-\[#[0-9A-Fa-f]{6}\](?:/[0-9]{1,3})?"
)
ATTR_RE = re.compile(r'(?:fill|stroke)="#[0-9A-Fa-f]{6}"')


def sources():
    for root, _dirs, files in os.walk(SRC):
        for f in files:
            if f.endswith((".js", ".jsx", ".ts", ".tsx")):
                yield os.path.join(root, f)


def read(path):
    try:
        return io.open(path, encoding="utf-8", errors="ignore").read()
    except Exception:
        return ""


def hex_to_rgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def esc(cls):
    """Escape a Tailwind class the way it appears in the generated stylesheet."""
    out = cls
    for ch in ("[", "]", "#", "/", "."):
        out = out.replace(ch, "\\" + ch)
    return out


def rule_for(util):
    m = re.match(r"^([a-z]+)-\[#([0-9A-Fa-f]{6})\](?:/([0-9]{1,3}))?$", util)
    if not m:
        return None
    prefix, hexv, alpha = m.group(1), m.group(2).upper(), m.group(3)

    if prefix in FG_PREFIXES:
        table = FOREGROUND
        prop = "fill" if prefix == "fill" else "color"
    elif prefix in BG_PREFIXES:
        table, prop = SURFACE, "background-color"
    elif prefix in LINE_PREFIXES:
        table = LINE
        prop = "stroke" if prefix == "stroke" else "border-color"
    else:
        return None

    dest = table.get(hexv)
    if not dest or dest.upper() == hexv:
        return None  # unchanged in dark — emit nothing

    r, g, b = hex_to_rgb(dest)
    if alpha:
        a = int(alpha) / 100.0
        # Alpha does not carry across an inversion. Light-on-dark *lines* read
        # heavier than dark-on-light at equal alpha, so they are pulled back;
        # light-on-dark *text* reads weaker and drops under 4.5:1, so it is
        # lifted. Measured: #E9E7E0 at 0.50 over #1A2020 is 4.35, a fail.
        if prop == "border-color":
            a = min(1.0, a * 0.72)
        elif prop in ("color", "fill"):
            a = min(1.0, a * 1.35)
        txt = ("%.3f" % a).rstrip("0").rstrip(".")
        value = "rgb(%d %d %d / %s)" % (r, g, b, txt)
    else:
        value = "#%s" % dest

    sel = '[data-theme="dark"] .%s' % esc(util)
    if prefix == "placeholder":
        sel += "::placeholder"
    return "%s { %s: %s !important; }" % (sel, prop, value)


def svg_attr_rules(found):
    rules = []
    for item in sorted(found):
        m = re.match(r'^(fill|stroke)="#([0-9A-Fa-f]{6})"$', item)
        if not m:
            continue
        attr, raw = m.group(1), m.group(2)
        table = FOREGROUND if attr == "fill" else LINE
        dest = table.get(raw.upper())
        if not dest or dest.upper() == raw.upper():
            continue
        rules.append('[data-theme="dark"] [%s="#%s"] { %s: #%s; }' % (attr, raw, attr, dest))
    return rules


def main():
    utils, attrs = set(), set()
    for path in sources():
        text = read(path)
        utils.update(UTIL_RE.findall(text))
        attrs.update(ATTR_RE.findall(text))

    utils = sorted(utils)
    rules = [r for r in (rule_for(u) for u in utils) if r]
    svg = svg_attr_rules(attrs)

    # Anything the maps do not know about passes straight through into dark
    # mode wearing its daylight colour. That is how #D8CFB4 at 60% ended up
    # compositing to a muddy mid-tone over the dark ground. Unmapped is a
    # decision, so it has to be an explicit one.
    known = set(FOREGROUND) | set(SURFACE) | set(LINE)
    unmapped = sorted({
        re.match(r"^[a-z]+-\[#([0-9A-Fa-f]{6})\]", u).group(1).upper()
        for u in utils
    } - known)
    if unmapped:
        print("")
        print("UNMAPPED COLOURS - these keep their daylight value at night:")
        for h in unmapped:
            users = [u for u in utils if h.lower() in u.lower()]
            print("  #%s  used by: %s" % (h, ", ".join(users[:4])))
        print("  Add each to FOREGROUND / SURFACE / LINE, or confirm it should")
        print("  stay put, then re-run.")
        print("")

    header = (
        "/* GENERATED - do not edit by hand.\n"
        " * Regenerate:  python scripts/gen-dark.py\n"
        " *\n"
        " * Night mode for a palette applied as Tailwind arbitrary values. The site\n"
        " * uses %d distinct colour utilities across roughly 780 call sites, so this\n"
        " * remaps the utilities rather than editing every use.\n"
        " *\n"
        " * Keyed on the utility prefix, not the hex, because one hex has several\n"
        " * jobs: #232A2A is body text on paper *and* the background of a dark chip.\n"
        " * Swapping both to a light value would turn the chips inside out.\n"
        " *\n"
        " * !important is load-bearing: these selectors and Tailwind's own utilities\n"
        " * have identical specificity, and the build does not guarantee which file\n"
        " * lands last.\n"
        " */\n\n" % len(utils)
    )

    body = "\n".join(rules)
    tail = (
        "\n\n/* Inline SVG presentation attributes. They have lower precedence than\n"
        "   any CSS rule, so an attribute selector reaches them without touching\n"
        "   the call sites. */\n" + "\n".join(svg) + "\n"
    )

    io.open(OUT, "w", encoding="utf-8").write(header + body + tail)
    print("utilities found : %d" % len(utils))
    print("class rules     : %d" % len(rules))
    print("svg attr rules  : %d" % len(svg))
    print("-> %s" % OUT)


if __name__ == "__main__":
    main()
