# Self-hosted fonts

`src/app/[locale]/layout.tsx` loads these files with `next/font/local`. Before,
`next/font/google` downloaded the fonts from Google Fonts during every
`next build`. Sometimes Google answered with CSS that `next/font` could not
parse, and the build failed with
`TypeError: Cannot read properties of null (reading '1')` (backlog row 54).
With the files committed, a build needs no network access for fonts.

## Files

| File                                        | Font                                      | Coverage                                    | Axis                               | Bytes  | Licence             |
| ------------------------------------------- | ----------------------------------------- | ------------------------------------------- | ---------------------------------- | ------ | ------------------- |
| `inter/inter-variable-latin-cyrillic.woff2` | Inter 4.1 (`Version 4.001;git-9221beed3`) | Google Fonts' `latin` and `cyrillic` ranges | `wght` 100–900, `opsz` fixed at 14 | 59,100 | `inter/LICENSE.txt` |
| `geist/geist-variable-latin.woff2`          | Geist (`Version 1.800`)                   | Google Fonts' `latin` range                 | `wght` 100–900                     | 28,276 | `geist/OFL.txt`     |

Inter is the body font (`globals.css`). Its file includes Cyrillic because the
`ru` locale renders in Inter; Google Fonts served Cyrillic to those pages on
demand. Geist comes second in the font stack. Geist Mono was loaded too, but no
style used `--font-geist-mono`, so it is not shipped.

## Sources (retrieved 2026-11-11)

- **Inter 4.1.** Official release by Rasmus Andersson, published 2024-11-16:
  <https://github.com/rsms/inter/releases/tag/v4.1>.
  - Asset: `Inter-4.1.zip`, SHA-256
    `9883fdd4a49d4fb66bd8177ba6625ef9a64aa45899767dde3d36aa425756b11e`.
  - Used from it: `InterVariable.ttf` and `LICENSE.txt`.
- **Geist.** Official repository by Vercel, tag `v1.9.2` (2026-11-06).
  - Font: <https://github.com/vercel/geist-font/blob/v1.9.2/fonts/Geist/variable/Geist%5Bwght%5D.ttf>,
    SHA-256 `73894e0448cae90a92b6c2f8732b7bb9acb7b94c418bff559dad4a18e1de9659`.
    It is the file Google Fonts serves Geist from: `ofl/geist/METADATA.pb`
    in `google/fonts` takes this path at commit `a6d260e6`, and the file there
    has the same Git blob (`f63f0afc`).
  - Licence: <https://github.com/vercel/geist-font/blob/v1.9.2/OFL.txt>.

## Licence

Both fonts are under the SIL Open Font License 1.1. Neither declares a
Reserved Font Name, so a subset may keep its name (OFL condition 3).

The licence text sits next to each font, and every file keeps its copyright
and licence records in its `name` table (OFL condition 2). The files are
modified versions (subset, and for Inter an instance) and stay under the OFL
(condition 5).

## How the files were made

`scripts/fonts/build-self-hosted-fonts.py` rebuilds them byte for byte; usage
is in its header. It downloads the sources above and checks their SHA-256.
Then it cuts each font to match what Google Fonts served for the same family:

- the same Unicode ranges;
- the same OpenType features;
- for Inter, the optical-size axis fixed at its default, and the `gasp` and
  `prep` tables that Google adds to unhinted fonts.

We compared the result with Google's own files, at every weight the app uses.
For every code point both files map, two checks found no difference:

- HarfBuzz shaped every pair of those code points: advances, kerning and mark
  positions are identical.
- The glyph outlines are identical.

There are three exceptions:

- Inter's `э` (U+044D) has a different outline at weights 500 and 600. The 4.1
  release build is later than the one Google serves.
- Some General Punctuation characters (U+2000–206F) are in these files but not
  in Google's: 59 for Inter, 5 for Geist. Examples: U+202F narrow no-break
  space, U+2010 hyphen, U+2030 per mille. They render in Inter now, where
  before they fell back to Arial.
- Characters that Google served only from its other subsets (Latin Extended,
  Cyrillic Extended, Greek, Vietnamese) now render in the fallback font. No
  app locale needs them; user text such as a Polish or Czech deck name can.

`next/font/local` also computes the Arial fallback's metric overrides from the
file, while `next/font/google` used precomputed ones. For Inter, `size-adjust`
moves from 107.12% to 107.89%. That only shows while the font loads.
