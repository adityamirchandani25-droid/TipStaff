"""Generate dark-mode CSS overrides for globals.css / product-polish.css /
marketplace.css, which style with hardcoded hex colors rather than the
themeable CSS custom properties (those live in theme.css and are handled
by hand, not by this script).

For each rule, finds color-bearing declarations and emits a
[data-theme="dark"] scoped override with each color run through a
perceptual lightness transform (light surfaces invert to dark, dark text
inverts to light, mid-tone/saturated colors are brightened in place to
stay visible on a dark background). Skips :root and @media/@keyframes
blocks.

Run from src/app/:  python3 ../../scripts/generate-dark-mode.py
Re-run whenever the source CSS files change meaningfully — this is not
watched automatically. Spot-check the diff afterward, especially any new
component that pairs light foreground text/icons with a saturated
background color (buttons, badges, map pins): FOREGROUND_PROPS below is
a heuristic, not a guarantee, for keeping that contrast correct.
"""

import re, colorsys, sys, functools

# Properties where a light/white value is almost always foreground text or
# an icon sitting on a saturated brand-color surface (button labels, filled
# checkmarks, map pins) rather than a light page/card background. Those
# should stay light in dark mode instead of inverting to near-black.
FOREGROUND_PROPS = {"color", "fill", "stroke"}
SOFT_WHITE = "#eef1f6"

COLOR_PROPS = re.compile(
    r"(?:^|(?<=;)|(?<=\{))\s*("
    r"background(?:-color)?|color|border(?:-[a-z]+)?-color|border(?:-[a-z]+)?|"
    r"box-shadow|fill|stroke|outline(?:-color)?|background-image"
    r")\s*:\s*([^;{}]+)(?=;)",
    re.IGNORECASE,
)

HEX_RE = re.compile(r"#[0-9a-fA-F]{3,8}\b")
RGB_SPACE_RE = re.compile(r"rgb\(\s*(\d+)\s+(\d+)\s+(\d+)\s*/\s*([\d.]+)\s*\)")
NAMED = {"white": "#ffffff", "black": "#000000"}


def hex_to_rgb(h):
    h = h.lstrip("#")
    if len(h) in (3, 4):
        h = "".join(c * 2 for c in h)
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    alpha = h[6:8] if len(h) == 8 else None
    return (r, g, b), alpha


def rgb_to_hex(rgb):
    return "#" + "".join(f"{max(0, min(255, round(c))):02x}" for c in rgb)


_cache = {}


def transform_rgb(r, g, b):
    key = (r, g, b)
    if key in _cache:
        return _cache[key]
    h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    if l > 0.75:
        # Steeper slope near white so subtle light-mode elevation cues
        # (page bg vs card vs border, often within 1-3% lightness of each
        # other) stay visually distinguishable once compressed into a
        # dark palette, instead of collapsing into one flat dark gray.
        new_l = 0.07 + (1 - l) * 0.85
        new_s = min(1.0, s * 0.9)
    elif l < 0.35:
        new_l = 0.92 - l * 0.25
        new_s = min(1.0, s * 0.9)
    else:
        new_l = min(0.78, l + 0.12)
        new_s = s
    nr, ng, nb = colorsys.hls_to_rgb(h, new_l, new_s)
    result = (nr * 255, ng * 255, nb * 255)
    _cache[key] = result
    return result


def transform_hex(match):
    token = match.group(0)
    (r, g, b), alpha = hex_to_rgb(token)
    nr, ng, nb = transform_rgb(r, g, b)
    out = rgb_to_hex((nr, ng, nb))
    if alpha:
        out += alpha
    return out


def transform_rgbspace(match):
    r, g, b, a = match.groups()
    nr, ng, nb = transform_rgb(int(r), int(g), int(b))
    return f"rgb({round(nr)} {round(ng)} {round(nb)} / {a})"


COMBINED_RE = re.compile(
    r"#[0-9a-fA-F]{3,8}\b|\b(?:white|black)\b|rgb\(\s*\d+\s+\d+\s+\d+\s*/\s*[\d.]+\s*\)",
    re.IGNORECASE,
)


def is_light(r, g, b, threshold=0.88):
    _, l, _ = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    return l >= threshold


def transform_token(m, prop=None):
    token = m.group(0)
    is_foreground = prop in FOREGROUND_PROPS

    if token.lower() in NAMED:
        (r, g, b), _ = hex_to_rgb(NAMED[token.lower()])
        if is_foreground and is_light(r, g, b):
            return SOFT_WHITE
        nr, ng, nb = transform_rgb(r, g, b)
        return rgb_to_hex((nr, ng, nb))

    if token.startswith("#"):
        (r, g, b), alpha = hex_to_rgb(token)
        if is_foreground and is_light(r, g, b):
            return SOFT_WHITE + (alpha or "")
        return transform_hex(m)

    rgbm = RGB_SPACE_RE.match(token)
    if rgbm:
        r, g, b, a = rgbm.groups()
        if is_foreground and is_light(int(r), int(g), int(b)):
            return f"rgb(238 241 246 / {a})"
        return transform_rgbspace(rgbm)
    return token


def transform_value(value, prop=None):
    # Single combined pass so a substituted output is never re-matched/re-transformed.
    return COMBINED_RE.sub(functools.partial(transform_token, prop=prop), value)


def strip_at_blocks(text, at_name):
    """Remove balanced-brace blocks starting with @at_name(...) { ... }, return (stripped_text, [removed_blocks])"""
    out = []
    removed = []
    i = 0
    pattern = re.compile(r"@" + at_name + r"[^{]*\{")
    while True:
        m = pattern.search(text, i)
        if not m:
            out.append(text[i:])
            break
        out.append(text[i:m.start()])
        depth = 1
        j = m.end()
        while depth > 0 and j < len(text):
            if text[j] == "{":
                depth += 1
            elif text[j] == "}":
                depth -= 1
            j += 1
        removed.append(text[m.start():j])
        i = j
    return "".join(out), removed


RULE_RE = re.compile(r"([^{}]+)\{([^{}]*)\}")


COMMENT_RE = re.compile(r"/\*.*?\*/", re.DOTALL)


def gen_dark_rules(css_text):
    css_text = COMMENT_RE.sub("", css_text)
    stripped, _ = strip_at_blocks(css_text, "media")
    stripped, _ = strip_at_blocks(stripped, "keyframes")
    # Drop any remaining @-rules without blocks (e.g. @import) — not relevant here.
    out_rules = []
    for m in RULE_RE.finditer(stripped):
        selector, body = m.group(1).strip(), m.group(2)
        if not selector or selector.startswith("@"):
            continue
        if ":root" in selector:
            continue  # handled separately by hand
        decls = []
        for pm in COLOR_PROPS.finditer(body if body.strip().endswith(";") else body + ";"):
            prop, val = pm.group(1).strip(), pm.group(2).strip()
            if "var(--product" in val or "var(--color" in val:
                continue  # tokenized already; handled via :root override
            if not (HEX_RE.search(val) or RGB_SPACE_RE.search(val) or re.search(r"\b(white|black)\b", val, re.I)):
                continue
            new_val = transform_value(val, prop=prop.lower())
            if new_val != val:
                decls.append(f"{prop}: {new_val};")
        if decls:
            # Scope each selector in a (possibly comma-separated) list under [data-theme="dark"]
            parts = [p.strip() for p in selector.split(",")]
            scoped = ", ".join(f'[data-theme="dark"] {p}' for p in parts)
            out_rules.append(f"{scoped} {{ {' '.join(decls)} }}")
    return out_rules


if __name__ == "__main__":
    files = ["globals.css", "product-polish.css", "marketplace.css"]
    for fname in files:
        with open(fname) as f:
            text = f.read()
        rules = gen_dark_rules(text)
        out_name = fname.replace(".css", ".dark.css")
        header = (
            f"/* Auto-generated dark-mode overrides for {fname}.\n"
            f"   Regenerate with scripts/generate-dark-mode.py (run from src/app/) if {fname} changes\n"
            f"   significantly — do not hand-edit color values here. */\n"
        )
        with open(out_name, "w") as f:
            f.write(header + "\n".join(rules) + "\n")
        print(f"{fname}: {len(rules)} dark rules -> {out_name}", file=sys.stderr)
