# PrintScale V1 verification

Test date: 2026-10-29, Asia/Taipei.

## Automated checks

- TypeScript strict build and Vite production build pass.
- Vitest: **67/67 tests passed**, covering the geometry engine and actual serialized PDFs.
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

## Readability and print-mark update (v1.0.1)

- Interface helper text and controls formerly sized 7–13 px now use 14–16 px; primary section headings use 18 px and physical dimension inputs 16 px. Tablet/mobile layouts reflow to preserve readable text. Existing labels, colours and workflow are retained.
- Cut ticks are black, 0.85 pt thick (previously 0.35 pt), up to 5 mm long, shortened to fit the page when margins are small. The cut coordinates are unchanged. Registration marks now use a 0.85 pt black circle with crosshairs, up to 4.4 mm across, in the existing spare-margin positions. Calibration limits their radius to fit physical page bounds.
- Printed position labels increase from 8 to 11 pt and TOP from 4.5 to 7 pt where the existing margin requirements permit. The interface and assembly guides explain the two symbols in all three languages.
- Two additional serialized-PDF tests verify bullseye paths, monochrome strokes, the unchanged image matrices/clips, and 0/3.9/4/15 mm margins. Existing calibration, tiling and position suites remain passing: 62 tests total.
- Chromium checks across Traditional Chinese, English and Japanese at widths 320, 390, 768, 1024 and 1440 px show no horizontal document overflow or clipped visible controls. Dimension inputs measure 16 px and help text 14 px. The 320 px crop dialog and assembly guide remain usable. No browser errors or warnings were recorded.
- Actual browser downloads for overlap and butt assembly each contain four explicit 210 × 297 mm MediaBoxes/CropBoxes, with identical image transforms. Original-size output remains one 350 × 466.7 mm page. pypdf independently verifies boxes, transforms and target paths; the rendered PDF and updated interface screenshots were visually inspected. Artifacts are under ignored `output/readability/`.
- This update does not establish physical printer accuracy; the existing physical-device verification limits remain.

## Compact introduction area

- Reduced only the introductory hero spacing, headline line height and decorative illustration scale. The previously enlarged font sizes and the printing workflow remain unchanged.
- At a 1200 px viewport in English, hero height decreases from 404.47 to 234.70 px (about 42%). The title remains 42 px and introductory copy 16 px.
- Chromium checks in all three languages at 320, 390, 768, 1024, 1200 and 1440 px show no horizontal page overflow. Desktop and mobile screenshots were visually reviewed. Production build passes.
- This is a CSS-only adjustment; PDF geometry, export code, controls and image processing are unchanged. Evidence is under ignored `output/compact-hero/`.

## Calibration unit consistency (v1.0.3)

- The finished-size unit now drives the ruler illustration, localized download text, PDF labels/ticks, measurement inputs, range messages, formula, calibration paper/summary and corrected assembly guide. The reference axes remain exactly 100 mm in every unit.
- Two new serialized-PDF tests verify cm/in labels on A5, native 1/16-inch tick placement, unchanged physical paper boxes and uncompensated axes. Total: 64 tests.
- Browser checks save 9.8/10.2 cm as canonical 98/102 mm, switch through in/mm/cm/in without modifying persisted profiles or factors, restore the profile after reload, and save exact equivalent inch measurements as 100/100 mm with 100% factors. Invalid inch measurements block Save and show an inch range.
- All three languages × mm/cm/in × 320/390/768/1440 px have no horizontal overflow, clipped ruler/buttons or raw translation tokens. No browser errors or warnings. Existing local profile schema is preserved.
- pypdf independently verifies browser-downloaded cm/in reference labels, exact 100 mm X/Y lines, A4 boxes and an additional A5 inch artifact. Rendered PDFs were visually checked, including endpoint labels that avoid the axis/border lines. The standard poster remains four A4 pages; the simulated 98/102 mm correction remains six A4 pages; the corrected guide uses cm measurements. Artifacts: ignored `output/calibration-units/`.

## Rounded language menu and integer inch reference (v1.0.4)

- Replaced only the header language select with a rounded custom menu using the existing colours, 16 px option text, selected checkmark and 44 px touch targets. Existing paper/profile selects are unchanged.
- Browser verification covers Arrow keys, wrapping, Home/End, Enter/Space, Escape and focus return, Tab/Shift+Tab, outside dismissal, resize, rapid toggles, reduced motion, actual touch-event emulation and language persistence after reload. All three languages at 320/390/768/1024/1440 px keep the menu in the viewport without horizontal overflow. No console errors or warnings.
- New inch rulers are exactly 4 in (101.6 mm), with 1/16 in ticks and matching PDF labels, formula and download names. mm/cm references remain 100 mm/10 cm. Measurements, limits and correction factors use the captured reference. Saved records retain referenceMm; legacy records default to 100 mm without changing old correction factors.
- Three new tests verify true four-inch factors, old/new storage compatibility, unity correction and required printable area. Existing PDF unit tests now check exact 4 in axes and tick positions. Total: 67 tests.
- Actual browser-downloaded ruler was independently checked with pypdf for exact 101.6 mm axes and X/Y 4 in labels, then rendered and visually reviewed. Entering 4/4 in saves 101.6/101.6 mm with referenceMm=101.6 and gives 100% factors. Both standard and corrected sample PDFs remain four explicit 210 × 297 mm A4 pages. Artifacts: ignored output/language-menu/.
