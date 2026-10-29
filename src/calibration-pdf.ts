import {
  PDFDocument,
  StandardFonts,
  rgb,
  PDFArray,
  PDFRawStream,
  decodePDFRawStream,
  degrees,
} from "pdf-lib";
import { PT } from "./geometry";
import { checkTestPaper } from "./calibration";
import type { TestPaper } from "./calibration";
export async function calibrationSheet(p: TestPaper): Promise<Uint8Array> {
  checkTestPaper(p);
  const pdf = await PDFDocument.create();
  pdf.setTitle("PrintScale | UNCOMPENSATED 100 mm calibration ruler");
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
  const x = (p.width - 100) / 2,
    y = (p.height - 100) / 2;
  label(
    "PrintScale | PRINTER CALIBRATION",
    p.margin,
    p.height - p.margin - 4,
    10,
    true,
  );
  label(
    `${p.width} x ${p.height} mm | UNCOMPENSATED | Print at 100%`,
    p.margin,
    p.height - p.margin - 9,
    7,
  );
  page.drawRectangle({
    x: x * PT,
    y: y * PT,
    width: 100 * PT,
    height: 100 * PT,
    borderColor: light,
    borderWidth: 0.4,
  });
  line(x, y, x + 100, y, 0.9);
  line(x, y, x, y + 100, 0.9);
  for (let i = 0; i <= 100; i++) {
    const major = i % 10 === 0,
      length = major ? 2 : i % 5 === 0 ? 1.5 : 0.8;
    line(x + i, y, x + i, y + length, 0.3);
    line(x, y + i, x + length, y + i, 0.3);
    if (major) {
      label(String(i), x + i - (i === 100 ? 2.7 : 1.3), y - 3.6, 6);
      label(String(i), x - 5, y + i - 0.7, 6);
    }
  }
  label("X - 100 mm", x + 35, y - 8, 9, true);
  page.drawText("Y - 100 mm", {
    x: (x - 7) * PT,
    y: (y + 35) * PT,
    size: 9,
    font: bold,
    color: ink,
    rotate: degrees(90),
  });
  line(x + 47, y + 50, x + 53, y + 50, 0.4);
  line(x + 50, y + 47, x + 50, y + 53, 0.4);
  page.drawCircle({
    x: (x + 50) * PT,
    y: (y + 50) * PT,
    size: 7 * PT,
    borderColor: light,
    borderWidth: 0.5,
  });
  label("Measure from 0 to 100 on each axis.", x + 10, y + 65, 7);
  label("Do not use Fit or borderless enlargement.", p.margin, p.margin + 6, 7);
  label(
    "Use the SAME printer, paper, orientation and print settings.",
    p.margin,
    p.margin + 2,
    7,
  );
  const bytes = await pdf.save({ useObjectStreams: false });
  await verifyCalibrationSheet(bytes, p);
  return bytes;
}
export async function verifyCalibrationSheet(bytes: Uint8Array, p: TestPaper) {
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
  const x = (p.width - 100) / 2,
    y = (p.height - 100) / 2;
  const has = (values: number[]) =>
    spans.some((span) =>
      span.every((v, i) => Math.abs(v / PT - values[i]) < 0.001),
    );
  if (!has([x, y, x + 100, y]) || !has([x, y, x, y + 100]))
    throw new Error("100 mm reference lines missing");
}
