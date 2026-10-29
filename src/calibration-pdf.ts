import {
  PDFDocument,
  StandardFonts,
  rgb,
  PDFArray,
  PDFRawStream,
  decodePDFRawStream,
  degrees,
} from "pdf-lib";
import { PT, fmt, fromMm } from "./geometry";
import type { Unit } from "./geometry";
import { checkTestPaper, calibrationReference } from "./calibration";
import type { TestPaper } from "./calibration";
export async function calibrationSheet(p: TestPaper, unit: Unit = "mm"): Promise<Uint8Array> {
  const referenceMm = p.referenceMm ?? calibrationReference(unit);
  checkTestPaper({ ...p, referenceMm });
  const length = (mm: number) => fmt(fromMm(mm, unit), 4),
    endpoint = length(referenceMm),
    rulerLabel = `${endpoint} ${unit}`;
  const pdf = await PDFDocument.create();
  pdf.setTitle(`PrintScale | UNCOMPENSATED ${rulerLabel} calibration ruler`);
  pdf.setCreator("PrintScale");
  pdf.setSubject(
    "UNCOMPENSATED reference. Actual size / 100%. Measure X and Y separately.",
  );
  const page = pdf.addPage([p.width * PT, p.height * PT]);
  page.setMediaBox(0, 0, p.width * PT, p.height * PT);
  page.setCropBox(0, 0, p.width * PT, p.height * PT);
  const font = await pdf.embedFont(StandardFonts.Helvetica),
    bold = await pdf.embedFont(StandardFonts.HelveticaBold),
    ink = rgb(0.14, 0.25, 0.2),
    light = rgb(0.76, 0.8, 0.74);
  const label = (
    text: string,
    x: number,
    y: number,
    size = 8,
    strong = false,
  ) =>
    page.drawText(text, {
      x: x * PT,
      y: y * PT,
      size,
      font: strong ? bold : font,
      color: ink,
    });
  const line = (
    x: number,
    y: number,
    x2: number,
    y2: number,
    thickness = 0.5,
    color = ink,
  ) =>
    page.drawLine({
      start: { x: x * PT, y: y * PT },
      end: { x: x2 * PT, y: y2 * PT },
      thickness,
      color,
    });
  const x = (p.width - referenceMm) / 2,
    y = (p.height - referenceMm) / 2;
  label(
    "PrintScale | PRINTER CALIBRATION",
    p.margin,
    p.height - p.margin - 4,
    10,
    true,
  );
  label(
    `${length(p.width)} x ${length(p.height)} ${unit} | UNCOMPENSATED | Print at 100%`,
    p.margin,
    p.height - p.margin - 9,
    7,
  );
  page.drawRectangle({
    x: x * PT,
    y: y * PT,
    width: referenceMm * PT,
    height: referenceMm * PT,
    borderColor: light,
    borderWidth: 0.4,
  });
  line(x, y, x + referenceMm, y, 0.9);
  line(x, y, x, y + referenceMm, 0.9);
  // Inch ticks are native 1/16-inch intervals; mm/cm ticks share 1 mm spacing.
  const step = unit === "in" ? 25.4 / 16 : 1;
  for (let i = 0; i * step <= referenceMm + 1e-8; i++) {
    const mm = i * step,
      major = i % (unit === "in" ? 16 : 10) === 0,
      tick = major ? 2 : i % (unit === "in" ? 8 : 5) === 0 ? 1.5 : 0.8;
    line(x + mm, y, x + mm, y + tick, 0.3);
    line(x, y + mm, x + tick, y + mm, 0.3);
    if (major) {
      const text = length(mm);
      label(text, x + mm - font.widthOfTextAtSize(text, 6) / PT / 2, y - 3.6, 6);
      if (mm > 0)
        label(text, x + 3.5, y + mm + (Math.abs(mm - referenceMm) < 1e-8 ? 1.2 : -0.7), 6);
    }
  }
  const xLabel = `X - ${rulerLabel}`, yLabel = `Y - ${rulerLabel}`;
  label(xLabel, x + referenceMm / 2 - bold.widthOfTextAtSize(xLabel, 9) / PT / 2, y - 8, 9, true);
  page.drawText(yLabel, {
    x: (x + 12) * PT,
    y: (y + referenceMm / 2) * PT - bold.widthOfTextAtSize(yLabel, 9) / 2,
    size: 9,
    font: bold,
    color: ink,
    rotate: degrees(90),
  });
  line(x + referenceMm / 2 - 3, y + referenceMm / 2, x + referenceMm / 2 + 3, y + referenceMm / 2, 0.4);
  line(x + referenceMm / 2, y + referenceMm / 2 - 3, x + referenceMm / 2, y + referenceMm / 2 + 3, 0.4);
  page.drawCircle({
    x: (x + referenceMm / 2) * PT,
    y: (y + referenceMm / 2) * PT,
    size: 7 * PT,
    borderColor: light,
    borderWidth: 0.5,
  });
  label(`Measure from 0 to ${rulerLabel} on each axis.`, x + 19, y + 65, 7);
  if (unit === "in")
    label("1/16 in ticks; measure the full 4 in reference.", x + 19, y + 61, 6);
  label("Do not use Fit or borderless enlargement.", p.margin, p.margin + 6, 7);
  label(
    "Use the SAME printer, paper, orientation and print settings.",
    p.margin,
    p.margin + 2,
    7,
  );
  const bytes = await pdf.save({ useObjectStreams: false });
  await verifyCalibrationSheet(bytes, { ...p, referenceMm });
  return bytes;
}
export async function verifyCalibrationSheet(bytes: Uint8Array, p: TestPaper) {
  const referenceMm = p.referenceMm ?? 100;
  const pdf = await PDFDocument.load(bytes);
  if (pdf.getPageCount() !== 1)
    throw new Error("Calibration test page count mismatch");
  const page = pdf.getPage(0);
  for (const b of [page.getMediaBox(), page.getCropBox()])
    if (
      Math.max(
        Math.abs(b.x),
        Math.abs(b.y),
        Math.abs(b.width / PT - p.width),
        Math.abs(b.height / PT - p.height),
      ) > 0.001
    )
      throw new Error("Calibration paper mismatch");
  const contents = page.node.Contents();
  const streams =
    contents instanceof PDFArray
      ? contents.asArray().map((r) => pdf.context.lookup(r))
      : [contents];
  const text = streams
    .map((s) =>
      s instanceof PDFRawStream
        ? new TextDecoder().decode(decodePDFRawStream(s).decode())
        : "",
    )
    .join("\n");
  for (const matrix of text.matchAll(
    /([-+\d.eE]+) ([-+\d.eE]+) ([-+\d.eE]+) ([-+\d.eE]+) ([-+\d.eE]+) ([-+\d.eE]+) cm/g,
  )) {
    if (
      matrix
        .slice(1, 5)
        .map(Number)
        .some((value, i) => Math.abs(value - [1, 0, 0, 1][i]) > 1e-10)
    )
      throw new Error("Calibration ruler must remain uncompensated");
  }
  const spans = [
    ...text.matchAll(
      /([-+\d.eE]+) ([-+\d.eE]+) m\s*([-+\d.eE]+) ([-+\d.eE]+) l/g,
    ),
  ].map((m) => m.slice(1).map(Number));
  const x = (p.width - referenceMm) / 2,
    y = (p.height - referenceMm) / 2;
  const has = (values: number[]) =>
    spans.some((span) =>
      span.every((v, i) => Math.abs(v / PT - values[i]) < 0.001),
    );
  if (!has([x, y, x + referenceMm, y]) || !has([x, y, x, y + referenceMm]))
    throw new Error("Calibration reference lines missing");
}
