import { describe, it, expect } from "vitest";
import {
  PDFDocument,
  PDFArray,
  PDFRawStream,
  decodePDFRawStream,
} from "pdf-lib";
import { tilePosition, canPrintPositionHints } from "../src/positions";
import { makePlan, PT } from "../src/geometry";
import { exportPdf } from "../src/pdf";
import { calibratedPlan } from "../src/calibration";
const settings = {
  width: 800,
  height: 1000,
  paperWidth: 210,
  paperHeight: 297,
  margin: 15,
  overlap: 10,
  alignment: "center" as const,
  orientation: "portrait" as const,
};
const options = {
  assembly: "overlap" as const,
  cropMarks: true,
  registration: true,
  pageNumbers: true,
  fit: "contain" as const,
};
const png = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==",
    "base64",
  ),
);
function content(doc: PDFDocument, index: number) {
  const c = doc.getPage(index).node.Contents() as PDFArray;
  return c
    .asArray()
    .map((ref) =>
      new TextDecoder().decode(
        decodePDFRawStream(doc.context.lookup(ref) as PDFRawStream).decode(),
      ),
    )
    .join("\n");
}
const words = (s: string) =>
  [...s.matchAll(/<([0-9A-Fa-f]+)> Tj/g)]
    .map((m) => Buffer.from(m[1], "hex").toString("latin1"))
    .join("\n");
describe("paper location and neighbour identity", () => {
  it("locates a late page and its four neighbouring sheets without row wrap", () => {
    const plan = makePlan(settings, "portrait");
    expect([plan.cols, plan.rows, plan.pages]).toEqual([5, 4, 20]);
    expect(tilePosition(plan, 17)).toEqual({
      index: 17,
      row: 3,
      col: 2,
      neighbors: { left: 16, right: 18, up: 12, down: null },
    });
    expect(tilePosition(plan, 4).neighbors.right).toBeNull();
    expect(tilePosition(plan, 5).neighbors.left).toBeNull();
  });
  it("handles a single sheet, a single column and a single row", () => {
    expect(
      Object.values(tilePosition({ cols: 1, rows: 1, pages: 1 }, 0).neighbors),
    ).toEqual([null, null, null, null]);
    expect(
      tilePosition({ cols: 1, rows: 200, pages: 200 }, 199).neighbors,
    ).toEqual({ up: 198, left: null, right: null, down: null });
    expect(
      tilePosition({ cols: 200, rows: 1, pages: 200 }, 199).neighbors,
    ).toEqual({ up: null, left: 198, right: null, down: null });
  });
  it("keeps all 200 pages reachable and neighbour relationships symmetric", () => {
    const p = { cols: 20, rows: 10, pages: 200 };
    for (let index = 0; index < 200; index++) {
      const n = tilePosition(p, index).neighbors;
      if (n.right !== null)
        expect(tilePosition(p, n.right).neighbors.left).toBe(index);
      if (n.down !== null)
        expect(tilePosition(p, n.down).neighbors.up).toBe(index);
    }
    expect(tilePosition(p, 199)).toMatchObject({ row: 9, col: 19 });
  });
  it.each([-1, 200, NaN, 1.5])("rejects invalid sheet index %s", (index) =>
    expect(() =>
      tilePosition({ cols: 20, rows: 10, pages: 200 }, index),
    ).toThrow(),
  );
});
describe("printed locator preserves image and paper geometry", () => {
  it("identifies page 18 of 20 and highlights only its top-right locator cell", async () => {
    const p = makePlan(settings, "portrait"),
      r = await exportPdf(png, p, options),
      pdf = await PDFDocument.load(r.bytes),
      c = content(pdf, 17);
    expect(words(c)).toContain("PAGE 18/20  |  R4/4 C3/5");
    expect(words(c)).toContain("TOP");
    const filled = [
      ...c.matchAll(/([-\d.eE]+) ([-\d.eE]+) ([-\d.eE]+) ([-\d.eE]+) re\s*f/g),
    ];
    expect(filled).toHaveLength(1);
    const [x, y, w, h] = filled[0].slice(1).map((v) => Number(v) / PT);
    expect(x).toBeGreaterThan(195);
    expect(y).toBeGreaterThan(282);
    expect(x + w).toBeLessThanOrEqual(205.000001);
    expect(y + h).toBeLessThanOrEqual(292.000001);
    expect(r.maxErrorMm).toBeLessThan(0.01);
    expect(pdf.getPage(17).getWidth() / PT).toBe(210);
    expect(pdf.getPage(17).getHeight() / PT).toBe(297);
  });
  it("omits printed hints with page labels disabled or insufficient margin", async () => {
    const p = makePlan(settings, "portrait");
    const a = await exportPdf(png, p, { ...options, pageNumbers: false });
    expect(words(content(await PDFDocument.load(a.bytes), 0))).not.toContain(
      "PAGE",
    );
    const low = makePlan({ ...settings, margin: 5 }, "portrait");
    expect(canPrintPositionHints(low)).toBe(false);
    const b = await exportPdf(png, low, options);
    expect(words(content(await PDFDocument.load(b.bytes), 0))).not.toContain(
      "TOP",
    );
  });
  it("keeps the locator in physical paper corners even with X/Y compensation", async () => {
    const p = calibratedPlan(
        { ...settings, width: 350, height: 466.7 },
        {
          id: "qa",
          name: "QA",
          measuredX: 98,
          measuredY: 102,
          paperWidth: 210,
          paperHeight: 297,
          updatedAt: "2026-10-29T00:00:00Z",
        },
      ),
      r = await exportPdf(png, p, options),
      pdf = await PDFDocument.load(r.bytes);
    for (let i = 0; i < p.pages; i++) {
      const c = content(pdf, i);
      expect(words(c)).toContain(`PAGE ${i + 1}/${p.pages}`);
      expect(c.lastIndexOf("Q")).toBeGreaterThan(c.indexOf("/Poster-"));
      expect(r.maxErrorMm).toBeLessThan(0.01);
    }
    expect(p.pages).toBe(6);
  });
  it("adds no locator to a full-size single-page PDF", async () => {
    const r = await exportPdf(
      png,
      makePlan(settings, "portrait"),
      options,
      "single",
    );
    const pdf = await PDFDocument.load(r.bytes);
    expect(words(content(pdf, 0))).not.toContain("PAGE");
    expect(pdf.getPage(0).getWidth() / PT).toBeCloseTo(800, 10);
  });
});
