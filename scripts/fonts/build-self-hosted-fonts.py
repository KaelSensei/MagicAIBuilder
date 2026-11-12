"""Rebuild the self-hosted web fonts in `src/styles/fonts/` from their official sources.

`next/font/google` downloaded the fonts from Google Fonts during every
`next build`, and an occasional bad answer from Google failed the build
(backlog row 54). The app now loads committed files with `next/font/local`.
This script is the record of how those files were made, so anyone can
check or repeat it. `src/styles/fonts/README.md` lists the sources and the
licences.

Each output reproduces what Google Fonts served for the same family:
- the same font build, pinned by SHA-256;
- the same Unicode ranges (the `unicode-range` of Google's css2 answer);
- the same OpenType features (the ones Google's subsets kept);
- the same `gasp` and `prep` tables.

Usage (Python 3.12):
    python3 -m venv /tmp/fonts-venv
    /tmp/fonts-venv/bin/pip install fonttools==4.55.3 brotli==1.1.0
    /tmp/fonts-venv/bin/python -I scripts/fonts/build-self-hosted-fonts.py
"""

import hashlib
import io
import sys
import urllib.request
import zipfile
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont, newTable
from fontTools.ttLib.tables import ttProgram
from fontTools.varLib import instancer

OUT = Path(__file__).resolve().parents[2] / "src" / "styles" / "fonts"

# The `unicode-range` values in Google Fonts' css2 answers for Inter and Geist
# (fonts.googleapis.com/css2, fetched 2026-11-11).
LATIN = (
    "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, "
    "U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, "
    "U+2212, U+2215, U+FEFF, U+FFFD"
)
CYRILLIC = "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116"

# The OpenType features left in Google's subsets of both families: the
# default-on shaping features, plus fractions and the figure-width features
# (`tabular-nums` is used by the app).
LAYOUT_FEATURES = [
    "calt", "ccmp", "dnom", "frac", "kern", "liga",
    "locl", "mark", "mkmk", "numr", "pnum", "tnum",
]


def download(url: str, sha256: str) -> bytes:
    """Fetch `url` and refuse it unless its SHA-256 is the pinned one."""
    with urllib.request.urlopen(url) as response:
        data = response.read()
    actual = hashlib.sha256(data).hexdigest()
    if actual != sha256:
        sys.exit(f"{url}: SHA-256 {actual}, expected {sha256}")
    return data


def unicodes(*ranges: str) -> set[int]:
    """Expand CSS `unicode-range` lists into a set of code points."""
    points: set[int] = set()
    for item in ", ".join(ranges).split(","):
        first, _, last = item.strip().removeprefix("U+").partition("-")
        points.update(range(int(first, 16), int(last or first, 16) + 1))
    return points


def add_unhinted_smoothing(font: TTFont) -> None:
    """Add the `gasp` and `prep` tables Google Fonts gives every unhinted font.

    They are what `gftools fix-unhinted` writes: smooth at every size, with
    dropout control. Google's Inter has them; the release build does not.
    """
    gasp = newTable("gasp")
    gasp.gaspRange = {0xFFFF: 0x000F}
    font["gasp"] = gasp
    prep = newTable("prep")
    prep.program = ttProgram.Program()
    prep.program.fromBytecode([0xB8, 0x01, 0xFF, 0x85, 0xB0, 0x04, 0x8D])
    font["prep"] = prep


def write_subset(font: TTFont, points: set[int], target: Path) -> None:
    """Keep `points` and LAYOUT_FEATURES, keep every name record, write WOFF2."""
    options = subset.Options()
    options.layout_features = LAYOUT_FEATURES
    options.name_IDs = ["*"]  # keeps the copyright and licence records (OFL 2)
    options.name_languages = ["*"]
    options.notdef_outline = True
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=points)
    subsetter.subset(font)
    font.flavor = "woff2"
    font.save(target)
    print(f"{target.relative_to(OUT.parents[2])}: {target.stat().st_size} bytes")


def build_inter() -> None:
    """Inter 4.1, Latin and Cyrillic (the scripts of every app locale)."""
    archive = download(
        "https://github.com/rsms/inter/releases/download/v4.1/Inter-4.1.zip",
        "9883fdd4a49d4fb66bd8177ba6625ef9a64aa45899767dde3d36aa425756b11e",
    )
    (OUT / "inter").mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(io.BytesIO(archive)) as zipped:
        source = zipped.read("InterVariable.ttf")
        (OUT / "inter" / "LICENSE.txt").write_bytes(zipped.read("LICENSE.txt"))
    font = TTFont(io.BytesIO(source), recalcTimestamp=False)
    # Google serves Inter without its optical-size axis, fixed at the default
    # (14). Left in, browsers would apply it by font size (font-optical-sizing:
    # auto) and headings would change shape.
    font = instancer.instantiateVariableFont(font, {"opsz": 14})
    add_unhinted_smoothing(font)
    # Compile and parse again: the subsetter fails on the instancer's
    # half-loaded `gvar` (KeyError on a glyph it has not read yet).
    compiled = io.BytesIO()
    font.save(compiled)
    write_subset(
        TTFont(io.BytesIO(compiled.getvalue()), recalcTimestamp=False),
        unicodes(LATIN, CYRILLIC),
        OUT / "inter" / "inter-variable-latin-cyrillic.woff2",
    )


def build_geist() -> None:
    """Geist 1.800, Latin: the same file Google Fonts builds its Geist from."""
    base = "https://raw.githubusercontent.com/vercel/geist-font/v1.9.2"
    source = download(
        f"{base}/fonts/Geist/variable/Geist%5Bwght%5D.ttf",
        "73894e0448cae90a92b6c2f8732b7bb9acb7b94c418bff559dad4a18e1de9659",
    )
    licence = download(
        f"{base}/OFL.txt",
        "021caa749f89fecd7c2e40a50499de29e84d2bc19251659b47d499c2fbfffc17",
    )
    (OUT / "geist").mkdir(parents=True, exist_ok=True)
    (OUT / "geist" / "OFL.txt").write_bytes(licence)
    font = TTFont(io.BytesIO(source), recalcTimestamp=False)
    write_subset(font, unicodes(LATIN), OUT / "geist" / "geist-variable-latin.woff2")


if __name__ == "__main__":
    build_inter()
    build_geist()
