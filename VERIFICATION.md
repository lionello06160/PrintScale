# PrintScale V1 verification

Test date: 2026-10-29, Asia/Taipei.

## Automated checks

- TypeScript strict build and Vite production build pass.
- Vitest: **60/60 tests passed**, covering the geometry engine and actual serialized PDFs.
- Stock paper sweep: six sizes × three alignments × four overlap values × three poster sizes × two directions. Trim areas partition the finished poster exactly; both modes retain requested dimensions.
- The PDF verifier rejects a changed CropBox and a changed image-size expectation. It inspects decoded content streams and does not trust app metadata.
- Dependency audit: no known vulnerabilities after updating PDF.js and Vitest.

## Required acceptance case

Poster **350 × 466.7 mm**, A4 **210 × 297 mm**, safe margin **15 mm on all sides**, overlap **10 mm**:

| Item                                      | Result                             |
| ----------------------------------------- | ---------------------------------- |
| Printable region                          | 180 × 267 mm                       |
| Recommended layout, precision             | 2 columns × 2 rows, 4 pages        |
| Recommended layout, paper saver           | 2 columns × 2 rows, 4 pages        |
| Horizontal / vertical stride              | 170 / 257 mm                       |
| Alternate landscape layout                | 2 × 3, 6 pages                     |
| Every tiled MediaBox and CropBox          | 210 × 297 mm, explicitly written   |
| Original-size single PDF                  | 1 page, 350 × 466.7 mm             |
| Finished dimensions after trimming        | 350 × 466.7 mm                     |
| Scale difference between assembly methods | None; image matrices are identical |

The source sample has exactly 3500 × 4667 pixels so its aspect ratio matches the acceptance dimensions. PDFs are downloaded through the actual UI and checked independently with pypdf (`tests/verify-export.py`). The JSON measurement report is in the ignored `output/pdf/verification.json`. Poppler renders of all four pages and the original-size output are visually inspected for crop ticks, image coverage and page labels.

## Browser checks

Tested in Chromium using a real browser, with these paths:

- Load sample; actual PDF.js render of all four exported pages.
- Download both assembly PDFs and the full-size single PDF.
- Compare precision/paper saver and confirm unchanged target dimensions.
- mm → cm → in → mm conversions.
- Invalid margin and invalid image block export, including stale previous results.
- Full-poster preview and trimmed reconstruction from actual rendered PDF pages.
- English and Japanese language selection and localized headings.
- 320, 390, 768, 1024 and 1440 px widths: no horizontal document overflow in English or Japanese.
- Profile save, edit, restore, delete; browser persistence contains settings only.
- Assembly dialog open, keyboard Escape close and focus return.
- JPEG EXIF orientation 6: decoded 200 × 300 instead of raw 300 × 200.
- Manual 90° rotation and percentage crop, with correct processed pixel dimensions.
- WebP decoding and transparent PNG flattened to opaque white for printing.
- Invalid fake PNG rejected. Image processing produced no non-GET network requests.
- No browser console errors during these checks.

Desktop/mobile screenshots and image fixtures are retained in `output/`, which is excluded from the deployment source repository.

## Remaining limits

This verifies PDF file geometry and browser behavior. **No physical printer has been measured.** Real Safari, Firefox, iOS and Android devices have not been tested. Browser viewport emulation does not certify those engines or hardware.

Inputs are capped at 40 MB, 40 megapixels and a 16,000 px edge; layouts at 200 pages and 5,080 mm per edge. Large image work is local but can occupy the browser’s main thread. Overview previews show the first 16 pages, while individual navigation and PDF export include all pages. Printer profiles are generic and local; they do not auto-detect printer capabilities. See README for the exact layout-ranking and fitting rules. Additional V2 features beyond printer calibration remain excluded.

## Printer calibration extension

- Eighteen new automated tests cover inverse per-axis factors; invalid, non-finite and implausible measurements; schema-safe local storage; measured paper/orientation matching; exact 100 mm reference axes; standard output isolation; factor extremes; safe retiled clips; composed PDF transforms; both assembly methods; and a corrected-original-size export guard.
- Browser flow: reference download without an image, simulated X=98 / Y=102, live percentages 102.0408% / 98.0392%, named save, image upload, six-page corrected export, six actual rendered PDF previews, both assembly methods, matching assembly guide, invalid-input and changed-paper/orientation blocking, reload restoration and persistent deletion.
- Standard output after calibration remains four pages of 210 × 297 mm. The original-size PDF remains one 350 × 466.7 mm page. These are independent downloads from the real interface.
- pypdf independently confirms effective image matrices of approximately 357.142857 × 457.549020 mm in the corrected file; applying the simulated printer factors 0.98 / 1.02 returns exactly 350 × 466.7 mm within numerical tolerance. Every clip remains within the 15 mm safe boundary, and every corrected MediaBox/CropBox remains 210 × 297 mm.
- Reference ruler axes are 100 mm each and remain uncompensated even when a calibration is saved. The runtime rereads serialized reference lines and page boxes before downloading.
- Calibration UI checked at 320, 390, 768, 1024 and 1440 px in Traditional Chinese, English and Japanese. All have no horizontal document overflow.
- Calibration is software compensation from user-entered measurements. No physical printer has been measured or certified by this work. Users must test a corrected sheet and remeasure using consistent printer, paper, orientation and driver settings.

## Assembly position hints

- Eleven new tests cover row/column identity, first/last edges, no row wrap, neighbour symmetry for all 200 sheets, invalid indices, printed locator identity, no locator on single-page output, page-label off/low-margin omission, and corrected output.
- Real-browser tests generated a 20-page layout and jumped directly to page 18, checked row 4/4 and column 3/5, followed neighbour links, used arrow keys, jumped to page 20 and opened the complete guide map.
- A 192-page layout was tested by directly selecting page 192 (row 16/16, column 12/12), rendering its real PDF page, then returning to a four-page plan without stale-selection errors.
- The 192-sheet map was checked at 320, 390, 768, 1024 and 1440 px in all three languages. Internal map scrolling does not cause horizontal document overflow.
- A six-page corrected layout uses its own six-sheet map and selected page 6 correctly at row 2/2, column 3/3. Both corrected assembly methods were downloaded and independently checked.
- The 20-page PDF was inspected with pypdf via tests/verify-positions.py. All 20 MediaBox/CropBox values are A4; every printed page/row/column label and highlighted cell matches its true position. No additional image coordinate transform was introduced.
- Position hints are drawn in unused physical paper margins after any calibration graphics state. Existing crop/registration coordinates, image scale, target dimensions and paper boxes remain unchanged.

## Graphical crop extension

- Ten new automated tests cover moving, all eight handles, fixed opposite edges, boundary/minimum constraints, drawing in all four directions, old invalid-data normalization, screen-scale independence, source-pixel keyboard movement and numeric input validation.
- Chromium browser tests verified corner drag, frame move, outside-frame redraw, Reset, Cancel, Escape, one/ten-pixel keyboard actions, invalid numeric Apply blocking, applied pixel dimensions and reopening the saved selection on the full original.
- A 400 × 300 four-colour image was rotated clockwise and its upper-left quarter selected. The result was exactly 150 × 200 pixels of the expected original lower-left colour. tests/verify-crop.py independently checked the actual PDF image XObject dimensions and pixel colour, plus its 350 × 466.666667 mm page and image matrix.
- Chromium CDP touch emulation generated actual touch Pointer Events and successfully resized a corner at a 390 × 844 viewport. Touch Cancel preserved the committed selection. This is browser touch emulation, not a physical phone test.
- The crop dialog was checked at 320, 390, 768 and 1280 px in Traditional Chinese, English and Japanese without horizontal overflow.
- With finished-size ratio unlocked, applying a new crop left both output dimensions unchanged. Locked-ratio height changes are shown in the modal before Apply.
- Images remain local. The existing PDF, calibration and assembly-position test suites still pass.
