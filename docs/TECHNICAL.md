# PrintScale

A free, browser-only poster printing studio built with React + TypeScript + Vite.

## Run locally

Requires Node.js 22.13+ (Node.js 24 is recommended).

```sh
npm ci
npm run dev
```

```sh
npm test
npm run build
npm run preview
```

The deployable output is `dist/`. No backend, login, API keys, image uploads or analytics are used. All app modules, PDF.js and its worker are served by the same origin. System fonts need no remote font service. Language preferences and named printer profiles are the only data stored in localStorage. Images and exports exist only in the open page; a refresh clears them.

## Included in V1 + printer calibration

- Traditional Chinese, English and Japanese; responsive desktop and mobile layout.
- PNG/JPEG/WebP, drag and drop, EXIF-aware browser decoding, rotation, nondestructive graphical crop with percentage fine-tuning. Transparent pixels are flattened onto white for printing.
- Physical dimensions in mm/cm/in, ratio lock. Unlocked sizes use explicit contain/white-space or fill/central-crop; there is no nonuniform stretch.
- A3/A4/A5/Letter/Legal/Tabloid and custom paper. One safe margin applies to all four edges. User-controlled overlap, orientation, and start/centre/end placement of unused space.
- Local printer profiles, including paper, safe margin, overlap, and orientation.
- Precision mode minimizes total internal seam length, then sheet count. Paper saver minimizes sheet count, then waste. Both compare the same portrait/landscape candidates and preserve the exact requested poster size, margin and overlap. Manual direction applies to both modes. Equal results are reported honestly.
- Overlap/glue and butt-joint crop marks, registration marks at common poster coordinates, page numbers and separate localized assembly instructions.
- Interactive assembly maps list every sheet (up to 200), highlight the selected position, show row/column coordinates and adjacent sheet numbers, and support direct jumps and arrow-key navigation. Standard, corrected and assembly-guide maps use the same row-major numbering.
- When page numbers are enabled, tiled PDFs include a top-right miniature map, top-left upright arrow and a larger page/row/column label in unused margins. Printed hints need at least 12 mm margins and 40 mm printable width; otherwise the UI explains their omission. Poster content and paper geometry are unchanged.
- Actual exported PDF previews: tiled overview, single page, full poster and a trimmed reconstruction obtained by cropping rendered PDF pages.
- Tiled PDF uses a full sheet for every page. Original-size single PDF uses the poster dimensions, for a print shop or a large-format printer.
- After serialization, every PDF is reopened and checked for explicit MediaBox/CropBox, image transformation matrices, clip coordinates and page count. Download remains disabled for an invalid, stale or unfinished result.

## Graphical image crop

Click **Crop image** to open a graphical editor over the full rotated original. Drag the frame to move it; drag any of eight corner/edge handles to resize; drag outside the selection to draw a new region. Reset restores the full image. The source file is never modified. Cancel or Escape discards uncommitted changes, and reopening the editor shows the original with the saved selection, not a crop of the cropped image.

Pointer Events support mouse, touch and pen with pointer capture. Coordinates are percentages of the rotated source so resizing the screen does not change the selected pixels. Each edge is constrained to the image and selections remain at least 1% wide and high, matching the original input limits. Arrow keys adjust the focused frame/handle by one source pixel, or ten with Shift. Numeric percentages remain under **Fine-tune percentages** and invalid entries disable Apply.

Dragging updates only local editor state and CSS. Image normalization and PDF regeneration run after **Apply crop**. The editor previews cropped pixel dimensions and resulting finished dimensions before applying: with finished-size ratio locked, the width is retained and height follows the new crop ratio; with it unlocked, both finished dimensions remain unchanged and the selected fit/fill rule still applies.

## Geometry

All layout coordinates are millimetres; convert only at the PDF boundary using `72 / 25.4` points/mm. No screen pixel dimensions enter the layout engine.

For length `L`, printable length `P`, and overlap `O`:

```
count = max(1, ceil((L - O) / (P - O)))
stride = P - O
coverage = count * P - (count - 1) * O
```

A small numerical tolerance avoids adding an extra page at an exact floating-point boundary. Shared trim seams are at the midpoint of each repeated strip. Rectangles after butt trimming partition the poster with no gaps and no area growth. For overlap assembly the full repeated strip is retained; right sheets cover left sheets and lower sheets cover upper sheets.

The specified acceptance case is **350 × 466.7 mm**, **A4**, **15 mm margins** and **10 mm overlap**:

- Printable rectangle: 180 × 267 mm.
- Portrait: 2 × 2 = 4 sheets, with strides of 170 mm and 257 mm.
- Landscape: 2 × 3 = 6 sheets.
- Both modes select four portrait sheets. Height coverage is 524 mm; unused 57.3 mm stays blank, split equally with centre alignment.
- Every tiled page has explicit MediaBox and CropBox `[0, 0, 595.2755905511812, 841.8897637795277]` points, equivalent to 210 × 297 mm.
- The full-size original PDF is a single 350 × 466.7 mm page.

## Printer calibration

The optional calibration panel prints an **uncompensated** 100 mm X/Y ruler, accepts separately measured lengths, and stores up to 20 named calibration profiles locally under `printscale-calibrations-v1`. Existing paper profiles remain compatible. The factors are computed at full precision as `kx = 100 / measuredX` and `ky = 100 / measuredY`; only displayed percentages are rounded. Measurements must be 80–120 mm. Larger discrepancies require checking 100% printing, orientation and measurement before applying compensation.

The reference PDF uses the current paper and orientation and needs at least 114 × 140 mm of printable area. It contains exact 100 mm vector lines regardless of any saved calibration. Paper and explicit orientation must match the measured profile; automatic orientation for corrected output preserves the measured orientation. Changes to printer drivers, paper handling or print settings require fresh physical measurements.

Corrected output is a separate, visibly labelled tiled PDF with a separate assembly guide and actual PDF preview. The standard tiled PDF and original-size single-page PDF receive no calibration. The corrected PDF deliberately changes image coordinates in the inverse direction of the measured printer error. Paper MediaBox and CropBox remain unchanged. The same transform is applied to images, clipping, crop ticks, registration marks and page labels.

To avoid clipping, the engine recomputes the grid in logical millimetres using printable width `(paperWidth - 2*margin) / kx` and height `(paperHeight - 2*margin) / ky`. The transform maps this area back into the physical safe margins, using translations `margin*(1-kx)` and `margin*(1-ky)` in bottom-left PDF coordinates. The target finished size and intended final overlap remain unchanged, but the corrected sheet count can increase. For the acceptance poster, simulated measurements X=98 mm / Y=102 mm produce six corrected A4 pages while the standard output stays at four. This is a software test, not a real measurement of any user printer.

`tests/verify-calibration.py` independently reads browser-downloaded test PDFs using pypdf, composes every PDF transformation matrix, checks safe clip bounds and ruler lengths, and simulates the measured scaling to recover 350 × 466.7 mm. It expects test files under `output/calibration/`.

## Verification

`npm test` runs 62 geometry, graphical-crop, calibration, page-location and serialized-PDF tests. The geometry sweep includes all six stock papers, all three unused-space alignments, four overlap sizes and three poster sizes in both directions. Tests cover exact boundaries, unit conversions, image aspect preservation, invalid/oversized settings, alternate layouts, both assembly methods, actual PDF transforms and deliberate PDF box/matrix corruption.

Browser QA uses the Playwright CLI, with screenshots and downloaded PDFs under the ignored `output/` directory. See [VERIFICATION.md](../VERIFICATION.md) for tested paths and limitations. `tests/verify-export.py` independently checks the three browser-downloaded acceptance PDFs with pypdf. Run it after producing the PDFs in `output/pdf/`; it writes the measured result to `output/pdf/verification.json`.

## Limits

- Images: 40 MB, 40 million decoded pixels, 16,000 px maximum edge. These are acceptance limits, not a memory guarantee on every mobile device. PNG normalization and PDF generation run locally and may briefly occupy the main thread for large images.
- Poster and custom paper dimensions: 1–5,080 mm per edge (the standard 200-inch PDF page limit). At most 200 tiled pages.
- Overlap must be smaller than the shortest printable paper edge. Margin and overlap remain identical in both modes; this version does not optimize mixed paper, staggered tiles or variable per-edge margins.
- Overview previews show the first 16 pages. All pages remain in the downloadable PDF; use the complete assembly map or page selector to jump directly to any page. The whole-poster view always shows the full original-size PDF.
- For margins below 4 mm registration marks are omitted; below 3 mm page labels are omitted. Crop marks may be incomplete near the paper edge. The UI warns about this. The image geometry remains unchanged.
- Physical printer measurements, Safari/Firefox and real mobile devices have not been verified. Chromium desktop and mobile viewport checks do not replace device tests. Colour-managed CMYK, PWA/offline install and advanced automatic seam placement are out of scope for V1.
- A geometrically correct PDF cannot control driver scaling or mechanical printer tolerances. Print from a PDF reader with Actual size / 100%, matching paper, no Fit and no borderless enlargement. Test one sheet first.

## Architecture

- `src/geometry.ts`: units, paper sizes, candidate layouts, selection, coverage and trim validation.
- `src/image.ts`: bounded file checks, local decode/rotation/crop/white background, original sample artwork.
- `src/pdf.ts`: exact PDF coordinate mapping, vector marks and post-serialization verification.
- `src/PdfPreview.tsx`: lazy-loaded PDF.js rendering of exported bytes.
- `src/calibration.ts`: measurement validation, factors, paper compatibility and local-profile schema.
- `src/calibration-pdf.ts`: uncompensated 100 mm reference PDF and serialized-line verification.
- `src/CalibrationPanel.tsx`: optional measurement, save/load/delete, corrected export and PDF preview.
- `src/positions.ts`, `src/AssemblyMap.tsx`, `src/positions-pdf.ts`: shared row/column and neighbour identity, interactive maps and printed margin locators.
- `src/crop-geometry.ts`, `src/CropEditor.tsx`, `src/Numeric.tsx`: bounded graphical selection, draft/apply modal and shared numeric fields.
- `src/i18n.ts`: all application language strings.
- `src/App.tsx`: workflow, validated inputs, output invalidation, local profiles and downloads.

Library references: [pdf-lib page boxes](https://pdf-lib.js.org/docs/api/classes/pdfpage), [PDF.js examples](https://mozilla.github.io/pdf.js/examples/).

## Readability update

Interface controls and helper text use 14–16 px, with 18 px section headings and responsive reflow. Cut ticks use black 0.85 pt strokes, up to 5 mm long; registration marks use distinct black crosshair targets up to 4.4 mm across. Spare-margin placement and physical poster/paper dimensions are preserved. A trilingual symbol legend appears beside the print options and in the assembly guide. Printed sheet-position text is also larger.
