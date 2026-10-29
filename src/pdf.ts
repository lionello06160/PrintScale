import {
  PDFDocument,
  StandardFonts,
  rgb,
  pushGraphicsState,
  popGraphicsState,
  rectangle,
  clip,
  endPath,
  concatTransformationMatrix,
  drawObject,
  decodePDFRawStream,
  PDFRawStream,
  PDFArray,
  PDFNumber,
  moveTo,
  appendBezierCurve,
  setLineWidth,
  setStrokingColor,
  stroke,
} from "pdf-lib";
import { PT, cutRect, imagePlacement, validatePlan } from "./geometry";
import type { Plan, Assembly, Rect } from "./geometry";
import { drawPositionHints } from "./positions-pdf";
export interface ExportOptions {
  assembly: Assembly;
  cropMarks: boolean;
  registration: boolean;
  pageNumbers: boolean;
  fit: "contain" | "cover";
}
export interface PdfResult {
  bytes: Uint8Array;
  pages: number;
  maxErrorMm: number;
  placement: Rect;
  kind: "tiled" | "single";
}
const ink = rgb(0.16, 0.28, 0.24);
export async function exportPdf(
  imageBytes: Uint8Array,
  plan: Plan,
  options: ExportOptions,
  kind: "tiled" | "single" = "tiled",
): Promise<PdfResult> {
  validatePlan(plan);
  if (plan.calibration && kind === "single")
    throw new Error("Calibrated output is tiled only");
  const scale = plan.calibration;
  const doc = await PDFDocument.create();
  doc.setTitle(
    `PrintScale | ${plan.width} x ${plan.height} mm | ${kind}${scale ? " | CALIBRATED" : ""}`,
  );
  doc.setCreator("PrintScale - local processing");
  doc.setSubject(
    `Print at Actual size / 100%. Disable Fit and borderless enlargement.${scale ? ` CALIBRATED X=${scale.x} Y=${scale.y}. Only for the measured printer and settings.` : ""}`,
  );
  const image =
    imageBytes[0] === 0xff
      ? await doc.embedJpg(imageBytes)
      : await doc.embedPng(imageBytes);
  const placement = imagePlacement(
    image.width,
    image.height,
    plan.width,
    plan.height,
    options.fit,
  );
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const hintFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const tiles =
    kind === "single"
      ? [
          {
            index: 0,
            row: 0,
            col: 0,
            source: { x: 0, y: 0, width: plan.width, height: plan.height },
            trim: { x: 0, y: 0, width: plan.width, height: plan.height },
          },
        ]
      : plan.tiles;
  for (const tile of tiles) {
    const single = kind === "single",
      pw = single ? plan.width : plan.usableWidth + 2 * plan.margin,
      ph = single ? plan.height : plan.usableHeight + 2 * plan.margin,
      m = single ? 0 : plan.margin;
    const actualPW = single ? plan.width : plan.paperWidth,
      actualPH = single ? plan.height : plan.paperHeight;
    const page = doc.addPage([actualPW * PT, actualPH * PT]);
    page.setMediaBox(0, 0, actualPW * PT, actualPH * PT);
    page.setCropBox(0, 0, actualPW * PT, actualPH * PT);
    if (scale)
      page.pushOperators(
        pushGraphicsState(),
        concatTransformationMatrix(
          scale.x,
          0,
          0,
          scale.y,
          m * (1 - scale.x) * PT,
          m * (1 - scale.y) * PT,
        ),
      );
    const left = Math.max(0, tile.source.x),
      top = Math.max(0, tile.source.y);
    const right = Math.min(plan.width, tile.source.x + tile.source.width),
      bottom = Math.min(plan.height, tile.source.y + tile.source.height);
    const cx = m + left - tile.source.x,
      cy = ph - m - (bottom - tile.source.y);
    const x = m + placement.x - tile.source.x,
      y = ph - m - (placement.y - tile.source.y) - placement.height;
    const name = page.node.newXObject("Poster", image.ref);
    page.pushOperators(
      pushGraphicsState(),
      rectangle(cx * PT, cy * PT, (right - left) * PT, (bottom - top) * PT),
      clip(),
      endPath(),
      concatTransformationMatrix(
        placement.width * PT,
        0,
        0,
        placement.height * PT,
        x * PT,
        y * PT,
      ),
      drawObject(name),
      popGraphicsState(),
    );
    if (single) continue;
    const markInk = rgb(0, 0, 0);
    const line = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      thickness = 0.85,
      color = markInk,
    ) =>
      page.drawLine({
        start: { x: x1 * PT, y: (ph - y1) * PT },
        end: { x: x2 * PT, y: (ph - y2) * PT },
        thickness,
        color,
      });
    const r = cutRect(plan, tile, options.assembly);
    const x1 = m + r.x - tile.source.x,
      y1 = m + r.y - tile.source.y,
      x2 = x1 + r.width,
      y2 = y1 + r.height;
    if (options.cropMarks) {
      // Ticks extend into discarded material, never across the finished image.
      const gap = 0.8,
        len = 5;
      [
        [x1, y1, -1, -1],
        [x2, y1, 1, -1],
        [x1, y2, -1, 1],
        [x2, y2, 1, 1],
      ].forEach(([a, b, dx, dy]) => {
        const horizontal = Math.min(len, (dx < 0 ? a : pw - a) - gap - 0.2),
          vertical = Math.min(len, (dy < 0 ? b : ph - b) - gap - 0.2);
        if (horizontal > 0.3)
          line(a + dx * gap, b, a + dx * (horizontal + gap), b);
        if (vertical > 0.3)
          line(a, b + dy * gap, a, b + dy * (vertical + gap));
      });
    }
    if (options.registration && m >= 4 && plan.overlap > 0) {
      // Mark the SAME poster-coordinate seam on each adjacent page, outside the image.
      const cross = (a: number, b: number) => {
        // A bullseye is distinguishable from cut ticks, including in monochrome.
        // All paths use page coordinates: no extra image transforms are introduced.
        const edgeClearance = Math.min(
            ...[scale?.x ?? 1, scale?.y ?? 1].map((factor) => m / factor - m / 2),
          ),
          radius = Math.min(2.2, m / 2 - 0.6, edgeClearance - 0.2),
          ring = radius * 0.72,
          x = a * PT,
          y = (ph - b) * PT,
          r = ring * PT,
          k = r * 0.5522847498;
        page.pushOperators(
          pushGraphicsState(),
          setStrokingColor(markInk),
          setLineWidth(0.85),
          moveTo(x + r, y),
          appendBezierCurve(x + r, y + k, x + k, y + r, x, y + r),
          appendBezierCurve(x - k, y + r, x - r, y + k, x - r, y),
          appendBezierCurve(x - r, y - k, x - k, y - r, x, y - r),
          appendBezierCurve(x + k, y - r, x + r, y - k, x + r, y),
          stroke(),
          popGraphicsState(),
        );
        line(a - radius, b, a + radius, b);
        line(a, b - radius, a, b + radius);
      };
      const sx = [
        tile.col ? tile.trim.x : null,
        tile.col < plan.cols - 1 ? tile.trim.x + tile.trim.width : null,
      ];
      const sy = [
        tile.row ? tile.trim.y : null,
        tile.row < plan.rows - 1 ? tile.trim.y + tile.trim.height : null,
      ];
      sx.forEach((a) => {
        if (a !== null) {
          cross(m + a - tile.source.x, m / 2);
          cross(m + a - tile.source.x, ph - m / 2);
        }
      });
      sy.forEach((b) => {
        if (b !== null) {
          cross(m / 2, m + b - tile.source.y);
          cross(pw - m / 2, m + b - tile.source.y);
        }
      });
    }
    if ((options.pageNumbers || scale) && m >= 3)
      page.drawText(
        `PrintScale  |  ${options.pageNumbers ? `${tile.index + 1}/${plan.pages}  R${tile.row + 1} C${tile.col + 1}  |  ` : ""}${options.assembly === "butt" ? "BUTT CUT" : "OVERLAP"}${scale ? ` | CAL X${(scale.x * 100).toFixed(2)}% Y${(scale.y * 100).toFixed(2)}%` : ""} | 100%`,
        {
          x: Math.max(2, m) * PT,
          y: Math.max(0.8, m / 2 - 1) * PT,
          size: Math.min(scale ? 5.5 : 7, m * PT * 0.45),
          font,
          color: ink,
        },
      );
    if (scale) page.pushOperators(popGraphicsState());
    if (options.pageNumbers)
      drawPositionHints(page, hintFont, plan, tile.index);
  }
  const bytes = await doc.save({ useObjectStreams: false });
  const maxErrorMm = await verifyPdf(bytes, plan, kind, placement);
  return { bytes, pages: tiles.length, maxErrorMm, placement, kind };
}
// Reopen actual serialized bytes. Check both boxes, every clip rectangle and every image transform.
export async function verifyPdf(
  bytes: Uint8Array,
  p: Plan,
  kind: "tiled" | "single",
  placement: Rect,
): Promise<number> {
  const parsed = await PDFDocument.load(bytes);
  if (parsed.getPageCount() !== (kind === "tiled" ? p.pages : 1))
    throw new Error("PDF page count mismatch");
  let max = 0;
  const expect = (a: number, b: number) => {
    const e = Math.abs(a - b);
    max = Math.max(max, e);
    if (!Number.isFinite(e) || e > 0.01)
      throw new Error("PDF geometry verification failed");
  };
  parsed.getPages().forEach((page, i) => {
    const single = kind === "single",
      pw = single ? p.width : p.paperWidth,
      ph = single ? p.height : p.paperHeight,
      virtualPH = single ? p.height : p.usableHeight + 2 * p.margin,
      m = single ? 0 : p.margin;
    const t = single
      ? { source: { x: 0, y: 0, width: p.width, height: p.height } }
      : p.tiles[i];
    for (const box of [page.getMediaBox(), page.getCropBox()]) {
      expect(box.x / PT, 0);
      expect(box.y / PT, 0);
      expect(box.width / PT, pw);
      expect(box.height / PT, ph);
    }
    const contents = page.node.Contents();
    const streams =
      contents instanceof PDFArray
        ? contents.asArray().map((ref) => parsed.context.lookup(ref))
        : [contents];
    const text = streams
      .map((s) =>
        s instanceof PDFRawStream
          ? new TextDecoder().decode(decodePDFRawStream(s).decode())
          : "",
      )
      .join("\n");
    const number = "([-+\\d.eE]+)";
    const transforms = [
      ...text.matchAll(
        new RegExp(Array(6).fill(number).join(" ") + " cm", "g"),
      ),
    ];
    if (transforms.length !== (p.calibration ? 2 : 1))
      throw new Error("Unexpected PDF coordinate transform");
    const matrix = text.match(
      new RegExp(Array(6).fill(number).join(" ") + " cm\\s*/Poster-[^\\s]+ Do"),
    );
    if (!matrix) throw new Error("PDF image matrix missing");
    const a = matrix.slice(1).map(Number);
    expect(a[0] / PT, placement.width);
    expect(a[1], 0);
    expect(a[2], 0);
    expect(a[3] / PT, placement.height);
    expect(a[4] / PT, m + placement.x - t.source.x);
    expect(
      a[5] / PT,
      virtualPH - m - placement.y + t.source.y - placement.height,
    );
    const clipRect = text.match(
      new RegExp(Array(4).fill(number).join(" ") + " re\\s*W\\s*n"),
    );
    if (!clipRect) throw new Error("PDF clipping rectangle missing");
    const c = clipRect.slice(1).map(Number);
    const l = Math.max(0, t.source.x),
      top = Math.max(0, t.source.y),
      r = Math.min(p.width, t.source.x + t.source.width),
      b = Math.min(p.height, t.source.y + t.source.height);
    [
      m + l - t.source.x,
      virtualPH - m - b + t.source.y,
      r - l,
      b - top,
    ].forEach((v, j) => expect(c[j] / PT, v));
    if (p.calibration) {
      const outer = text.match(
        new RegExp(
          "q\\s*" +
            Array(6).fill(number).join(" ") +
            " cm\\s*q\\s*" +
            Array(4).fill(number).join(" ") +
            " re\\s*W",
        ),
      );
      if (!outer) throw new Error("PDF calibration matrix missing");
      const o = outer.slice(1, 7).map(Number),
        k = p.calibration;
      [k.x, 0, 0, k.y, m * (1 - k.x) * PT, m * (1 - k.y) * PT].forEach((v, j) =>
        expect(o[j], v),
      );
      const actualLeft = (c[0] * k.x) / PT + m * (1 - k.x),
        actualBottom = (c[1] * k.y) / PT + m * (1 - k.y);
      if (
        actualLeft < m - 0.01 ||
        actualBottom < m - 0.01 ||
        actualLeft + (c[2] * k.x) / PT > pw - m + 0.01 ||
        actualBottom + (c[3] * k.y) / PT > ph - m + 0.01
      )
        throw new Error("Calibrated clip exceeds safe area");
    }
    // Explicit boxes must exist; inherited defaults are not sufficient.
    if (
      !(page.node.MediaBox().lookup(2) instanceof PDFNumber) ||
      !page.node.CropBox()
    )
      throw new Error("PDF boxes missing");
  });
  return max;
}
