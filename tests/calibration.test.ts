import { describe, it, expect } from "vitest";
import {
  PDFDocument,
  PDFArray,
  PDFRawStream,
  decodePDFRawStream,
} from "pdf-lib";
import {
  calibrationScale,
  calibrationReference,
  checkTestPaper,
  calibratedPlan,
  parseCalibrations,
  paperMatchesCalibration,
} from "../src/calibration";
import type { Calibration } from "../src/calibration";
import { makePlan, PT, validatePlan } from "../src/geometry";
import type { Settings } from "../src/geometry";
import {
  calibrationSheet,
  verifyCalibrationSheet,
} from "../src/calibration-pdf";
import { exportPdf, verifyPdf } from "../src/pdf";
const settings: Settings = {
  width: 350,
  height: 466.7,
  paperWidth: 210,
  paperHeight: 297,
  margin: 15,
  overlap: 10,
  alignment: "center",
  orientation: "auto",
};
const record: Calibration = {
  id: "printer-1",
  name: "Test printer A4",
  measuredX: 98,
  measuredY: 102,
  paperWidth: 210,
  paperHeight: 297,
  updatedAt: "2026-10-29T01:00:00.000Z",
};
const png = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==",
    "base64",
  ),
);
const options = {
  assembly: "overlap" as const,
  cropMarks: true,
  registration: true,
  pageNumbers: true,
  fit: "contain" as const,
};
function stream(doc: PDFDocument, index = 0) {
  const contents = doc.getPage(index).node.Contents() as PDFArray;
  return contents
    .asArray()
    .map((ref) =>
      new TextDecoder().decode(
        decodePDFRawStream(doc.context.lookup(ref) as PDFRawStream).decode(),
      ),
    )
    .join("\n");
}
describe("printer measurement and storage", () => {
  it("uses a true four-inch reference and the matching correction factors", () => {
    expect(calibrationReference("in")).toBe(101.6);
    expect(calibrationReference("cm")).toBe(100);
    expect(calibrationScale(101.6, 101.6, 101.6)).toEqual({ x: 1, y: 1 });
    const scale = calibrationScale(3.92 * 25.4, 4.08 * 25.4, 101.6);
    expect(scale.x).toBeCloseTo(4 / 3.92, 12);
    expect(scale.y).toBeCloseTo(4 / 4.08, 12);
    expect(() => calibrationScale(3 * 25.4, 101.6, 101.6)).toThrow();
  });
  it("keeps legacy profiles at 100 mm and round-trips new 4 in profiles", () => {
    const inch = { ...record, id: "inch", referenceMm: 101.6, measuredX: 101.6, measuredY: 101.6 };
    const store = parseCalibrations(JSON.stringify({ version: 1, profiles: [record, inch], activeId: "inch" }));
    expect(store.profiles).toEqual([record, inch]);
    expect(calibratedPlan(settings, store.profiles[0]).calibration).toEqual(calibrationScale(98, 102));
    expect(calibratedPlan(settings, store.profiles[1]).calibration).toEqual({ x: 1, y: 1 });
    expect(calibratedPlan(settings, store.profiles[1]).pages).toBe(4);
    expect(parseCalibrations(JSON.stringify({ version: 1, profiles: [{...inch,referenceMm:4}],activeId:"inch" })).profiles).toEqual([]);
  });
  it("requires enough printable space for the longer four-inch ruler", () => {
    expect(() => checkTestPaper({ width: 114, height: 140, margin: 0 })).not.toThrow();
    expect(() => checkTestPaper({ width: 114, height: 140, margin: 0, referenceMm: 101.6 })).toThrow();
    expect(() => checkTestPaper({ width: 148, height: 210, margin: 15, referenceMm: 101.6 })).not.toThrow();
  });
  it("uses the inverse measured scale independently without premature rounding", () => {
    const f = calibrationScale(98, 102);
    expect(f.x).toBe(100 / 98);
    expect(f.y).toBe(100 / 102);
    expect(f.x * 98).toBeCloseTo(100, 12);
    expect(f.y * 102).toBeCloseTo(100, 12);
  });
  it.each([0, -1, NaN, Infinity, 79.99, 120.01])(
    "rejects invalid or implausible measurements %s",
    (n) => {
      expect(() => calibrationScale(n, 100)).toThrow();
      expect(() => calibrationScale(100, n)).toThrow();
    },
  );
  it("round-trips measurements, identity, date, and reference paper", () => {
    const store = parseCalibrations(
      JSON.stringify({ version: 1, profiles: [record], activeId: record.id }),
    );
    expect(store.profiles).toEqual([record]);
    expect(store.activeId).toBe(record.id);
  });
  it("ignores corrupt and incompatible storage instead of applying unsafe factors", () => {
    for (const raw of [
      "bad",
      "{}",
      '{"version":2,"profiles":[]}',
      JSON.stringify({
        version: 1,
        profiles: [{ ...record, measuredX: 0 }],
        activeId: record.id,
      }),
    ])
      expect(parseCalibrations(raw).activeId).toBe("");
    expect(
      parseCalibrations(
        JSON.stringify({
          version: 1,
          profiles: [record, record],
          activeId: "missing",
        }),
      ).profiles,
    ).toHaveLength(1);
  });
  it("binds correction to the measured paper and orientation", () => {
    expect(paperMatchesCalibration(settings, record)).toBe(true);
    expect(
      paperMatchesCalibration(
        { ...settings, paperWidth: 297, paperHeight: 210 },
        record,
      ),
    ).toBe(true);
    expect(() =>
      calibratedPlan(
        { ...settings, paperWidth: 215.9, paperHeight: 279.4 },
        record,
      ),
    ).toThrow("calPaperMismatch");
    expect(() =>
      calibratedPlan({ ...settings, orientation: "landscape" }, record),
    ).toThrow("calPaperMismatch");
  });
});
describe("calibrated tiling", () => {
  it("retiles rather than clipping enlarged content, leaving standard output alone", () => {
    const standard = makePlan(settings, "portrait"),
      before = JSON.stringify(standard),
      p = calibratedPlan(settings, record);
    expect(p.pages).toBe(6);
    expect(p.cols).toBe(3);
    expect(p.rows).toBe(2);
    expect(p.width).toBe(350);
    expect(p.height).toBe(466.7);
    expect(p.usableWidth).toBeCloseTo(176.4, 10);
    expect(p.usableHeight).toBeCloseTo(272.34, 10);
    expect(p.overlap).toBe(10);
    expect(p.margin).toBe(15);
    expect(JSON.stringify(standard)).toBe(before);
    expect(standard.pages).toBe(4);
    expect(standard.calibration).toBeUndefined();
  });
  it("keeps four pages when measurements are exactly 100 mm", () => {
    const p = calibratedPlan(settings, {
      ...record,
      measuredX: 100,
      measuredY: 100,
    });
    expect(p.pages).toBe(4);
    expect(p.calibration).toEqual({ x: 1, y: 1 });
  });
  it("covers and partitions the target for all supported compensation extremes", () => {
    for (const measuredX of [80, 98, 100, 102, 120])
      for (const measuredY of [80, 98, 100, 102, 120])
        for (const alignment of ["start", "center", "end"] as const) {
          const p = calibratedPlan(
            { ...settings, alignment },
            { ...record, measuredX, measuredY },
          );
          expect(() => validatePlan(p)).not.toThrow();
          expect(p.usableWidth * p.calibration!.x).toBeCloseTo(180, 10);
          expect(p.usableHeight * p.calibration!.y).toBeCloseTo(267, 10);
          expect(
            p.tiles.reduce((a, t) => a + t.trim.width * t.trim.height, 0),
          ).toBeCloseTo(350 * 466.7, 7);
        }
  });
});
describe("calibration PDF artifacts", () => {
  it.each(["cm", "in"] as const)("prints the exact %s reference and matching native ticks", async (unit) => {
    const paper = { width: 148, height: 210, margin: 15, referenceMm: calibrationReference(unit) };
    const bytes = await calibrationSheet(paper, unit);
    await expect(verifyCalibrationSheet(bytes, paper)).resolves.toBeUndefined();
    const doc = await PDFDocument.load(bytes), text = stream(doc);
    const words = [...text.matchAll(/<([0-9A-Fa-f]+)> Tj/g)]
      .map((m) => Buffer.from(m[1], "hex").toString("latin1")).join("\n");
    const endpoint = unit === "cm" ? "10 cm" : "4 in";
    expect(words).toContain(`X - ${endpoint}`);
    expect(words).toContain(`Y - ${endpoint}`);
    expect(doc.getPage(0).getWidth() / PT).toBe(148);
    expect(doc.getPage(0).getHeight() / PT).toBe(210);
    if (unit === "in") {
      // Verify a real 1/16-inch tick rather than merely relabelling mm ticks.
      const x = (paper.width - 101.6) / 2, y = (paper.height - 101.6) / 2;
      const spans = [...text.matchAll(/([-+\d.eE]+) ([-+\d.eE]+) m\s*([-+\d.eE]+) ([-+\d.eE]+) l/g)]
        .map((m) => m.slice(1).map((n) => Number(n) / PT));
      expect(spans.some((v) => v.every((n,i) => Math.abs(n-[x+25.4/16,y,x+25.4/16,y+0.8][i])<1e-8))).toBe(true);
      expect(words).toContain("1/16 in ticks; measure the full 4 in reference.");
    }
  });
  it("exports an uncompensated 100 mm X and Y ruler on exact A4", async () => {
    const paper = { width: 210, height: 297, margin: 15 },
      bytes = await calibrationSheet(paper);
    await expect(verifyCalibrationSheet(bytes, paper)).resolves.toBeUndefined();
    const doc = await PDFDocument.load(bytes),
      page = doc.getPage(0);
    expect(page.getCropBox().width / PT).toBe(210);
    expect(page.getMediaBox().height / PT).toBe(297);
    expect(doc.getTitle()).toContain("UNCOMPENSATED");
    const text = stream(doc);
    for (const m of text.matchAll(
      /([-\d.eE]+) ([-\d.eE]+) ([-\d.eE]+) ([-\d.eE]+) ([-\d.eE]+) ([-\d.eE]+) cm/g,
    ))
      expect(m.slice(1, 5).map(Number)).toEqual([1, 0, 0, 1]);
    page.scaleContent(1.02, 1);
    await expect(
      verifyCalibrationSheet(await doc.save(), paper),
    ).rejects.toThrow("uncompensated");
    page.setCropBox(0, 0, 200 * PT, 297 * PT);
    await expect(
      verifyCalibrationSheet(await doc.save(), paper),
    ).rejects.toThrow();
  });
  it("also supports A5 portrait and A4 landscape, and rejects a ruler that cannot fit", async () => {
    await expect(
      calibrationSheet({ width: 148, height: 210, margin: 15 }),
    ).resolves.toBeInstanceOf(Uint8Array);
    await expect(
      calibrationSheet({ width: 297, height: 210, margin: 15 }),
    ).resolves.toBeInstanceOf(Uint8Array);
    await expect(
      calibrationSheet({ width: 100, height: 120, margin: 5 }),
    ).rejects.toThrow("calPaperTooSmall");
  });
  it("keeps paper boxes physical and transforms image, crop and registration together", async () => {
    const plan = calibratedPlan(settings, record),
      r = await exportPdf(png, plan, options);
    expect(r.maxErrorMm).toBeLessThan(0.00001);
    expect(r.pages).toBe(6);
    const doc = await PDFDocument.load(r.bytes);
    expect(doc.getTitle()).toContain("CALIBRATED");
    doc.getPages().forEach((page) => {
      expect(page.getMediaBox().width / PT).toBe(210);
      expect(page.getCropBox().height / PT).toBe(297);
    });
    const text = stream(doc),
      matrix = text.match(
        /q\s*([-\d.eE]+) 0 0 ([-\d.eE]+) ([-\d.eE]+) ([-\d.eE]+) cm\s*q/,
      )!;
    expect(Number(matrix[1])).toBeCloseTo(100 / 98, 12);
    expect(Number(matrix[2])).toBeCloseTo(100 / 102, 12);
    expect(Number(matrix[3]) / PT).toBeCloseTo(15 * (1 - 100 / 98), 10);
    expect(Number(matrix[4]) / PT).toBeCloseTo(15 * (1 - 100 / 102), 10);
    await expect(
      verifyPdf(
        r.bytes,
        { ...plan, calibration: { x: 1, y: 1 } },
        "tiled",
        r.placement,
      ),
    ).rejects.toThrow();
  });
  it("can export extreme factors with safe clips in both assembly methods", async () => {
    for (const measuredX of [80, 120])
      for (const measuredY of [80, 120]) {
        const plan = calibratedPlan(settings, {
          ...record,
          measuredX,
          measuredY,
        });
        for (const assembly of ["overlap", "butt"] as const) {
          const r = await exportPdf(png, plan, { ...options, assembly });
          expect(r.maxErrorMm).toBeLessThan(0.01);
        }
      }
  });
  it("never applies calibration to original-size single-page exports", async () => {
    const p = calibratedPlan(settings, record);
    await expect(exportPdf(png, p, options, "single")).rejects.toThrow();
    const standard = await exportPdf(
      png,
      makePlan(settings, "portrait"),
      options,
      "single",
    );
    const doc = await PDFDocument.load(standard.bytes);
    expect(doc.getPage(0).getWidth() / PT).toBe(350);
    expect(doc.getPage(0).getHeight() / PT).toBeCloseTo(466.7, 10);
    expect(doc.getTitle()).not.toContain("CALIBRATED");
  });
});
