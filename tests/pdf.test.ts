import { describe, it, expect } from "vitest";
import {
  PDFDocument,
  PDFName,
  PDFArray,
  PDFRawStream,
  decodePDFRawStream,
} from "pdf-lib";
import { makePlan, PT, imagePlacement } from "../src/geometry";
import { exportPdf, verifyPdf } from "../src/pdf";
import type { Settings } from "../src/geometry";
const png = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==",
    "base64",
  ),
);
const s: Settings = {
  width: 350,
  height: 466.7,
  paperWidth: 210,
  paperHeight: 297,
  margin: 15,
  overlap: 10,
  alignment: "center",
  orientation: "auto",
};
const options = {
  assembly: "overlap" as const,
  cropMarks: true,
  registration: true,
  pageNumbers: true,
  fit: "contain" as const,
};
describe("serialized PDF evidence", () => {
  it("has four explicit 210 × 297 mm MediaBoxes and CropBoxes", async () => {
    const plan = makePlan(s, "portrait"),
      result = await exportPdf(png, plan, options);
    expect(result.pages).toBe(4);
    expect(result.maxErrorMm).toBeLessThan(0.00001);
    const doc = await PDFDocument.load(result.bytes);
    expect(doc.getPageCount()).toBe(4);
    doc.getPages().forEach((page) => {
      for (const name of ["MediaBox", "CropBox"]) {
        const box = page.node.get(PDFName.of(name)) as PDFArray;
        expect(box).toBeInstanceOf(PDFArray);
        expect(box.asArray().map((x) => Number(x.toString()) / PT)).toEqual([
          0, 0, 210, 297,
        ]);
      }
    });
  });
  it("full-size output is one 350 × 466.7 mm page", async () => {
    const r = await exportPdf(png, makePlan(s, "portrait"), options, "single");
    const doc = await PDFDocument.load(r.bytes);
    expect(doc.getPageCount()).toBe(1);
    expect(doc.getPage(0).getWidth() / PT).toBe(350);
    expect(doc.getPage(0).getHeight() / PT).toBeCloseTo(466.7, 10);
  });
  it("verifies actual image matrices and exact overlap, not just metadata", async () => {
    const p = makePlan(s, "portrait"),
      r = await exportPdf(png, p, options);
    const doc = await PDFDocument.load(r.bytes);
    const transforms = doc.getPages().map((page) => {
      const arr = page.node.Contents() as PDFArray;
      const decoded = arr
        .asArray()
        .map((ref) =>
          new TextDecoder().decode(
            decodePDFRawStream(
              doc.context.lookup(ref) as PDFRawStream,
            ).decode(),
          ),
        )
        .join("\n");
      const matrix = decoded.match(
        /([-\d.eE]+) 0 0 ([-\d.eE]+) ([-\d.eE]+) ([-\d.eE]+) cm\s*\/Poster-/,
      )!;
      return matrix.slice(1).map(Number);
    });
    expect((transforms[0][2] - transforms[1][2]) / PT).toBeCloseTo(170, 8);
    expect((transforms[2][3] - transforms[0][3]) / PT).toBeCloseTo(257, 8);
    doc.getPage(0).setCropBox(0, 0, 200 * PT, 297 * PT);
    await expect(
      verifyPdf(await doc.save(), p, "tiled", r.placement),
    ).rejects.toThrow();
    await expect(
      verifyPdf(r.bytes, p, "tiled", {
        ...r.placement,
        width: r.placement.width + 1,
      }),
    ).rejects.toThrow();
  });
  it("supports custom landscape and zero-margin/zero-overlap pages", async () => {
    const p = makePlan(
      { ...s, paperWidth: 240, paperHeight: 300, margin: 0, overlap: 0 },
      "landscape",
    );
    const r = await exportPdf(png, p, {
      ...options,
      assembly: "butt",
      fit: "cover",
    });
    expect(r.maxErrorMm).toBeLessThan(0.01);
    expect(r.placement).toEqual(
      imagePlacement(1, 1, s.width, s.height, "cover"),
    );
  });
  it("both assembly methods keep identical image transforms but different crop ticks", async () => {
    const p = makePlan(s, "portrait"),
      a = await exportPdf(png, p, options),
      b = await exportPdf(png, p, { ...options, assembly: "butt" });
    expect(a.placement).toEqual(b.placement);
    expect(a.bytes).not.toEqual(b.bytes);
    expect(a.pages).toBe(b.pages);
  });
  it("adds black bullseye targets without changing image transforms or clips", async () => {
    const p = makePlan(s, "portrait");
    const read = async (registration: boolean) => {
      const result = await exportPdf(png, p, { ...options, registration, pageNumbers: false });
      const doc = await PDFDocument.load(result.bytes);
      return doc.getPages().map((page) =>
        (page.node.Contents() as PDFArray).asArray().map((ref) =>
          new TextDecoder().decode(decodePDFRawStream(doc.context.lookup(ref) as PDFRawStream).decode()),
        ).join("\n"),
      );
    };
    const marked = await read(true), plain = await read(false);
    marked.forEach((stream, i) => {
      // Four margin targets per corner tile, four exact Bezier arcs per ring.
      expect(stream.match(/ c\n/g)).toHaveLength(16);
      expect(stream).toContain("0 0 0 RG");
      expect(stream).toContain("0.85 w");
      expect(stream.match(/[^\n]+ cm/g)).toEqual(plain[i].match(/[^\n]+ cm/g));
      expect(stream.match(/[^\n]+ re\nW/g)).toEqual(plain[i].match(/[^\n]+ re\nW/g));
      expect(plain[i].match(/ c\n/g)).toBeNull();
    });
  });
  it("fits shortened cut ticks and targets at 4 mm margins, omitting targets below 4 mm", async () => {
    for (const margin of [0, 3.9, 4, 15]) {
      const p = makePlan({ ...s, margin }, "portrait");
      const r = await exportPdf(png, p, { ...options, pageNumbers: false });
      const doc = await PDFDocument.load(r.bytes);
      const stream = (doc.getPage(0).node.Contents() as PDFArray).asArray().map((ref) =>
        new TextDecoder().decode(decodePDFRawStream(doc.context.lookup(ref) as PDFRawStream).decode()),
      ).join("\n");
      expect((stream.match(/ c\n/g) ?? []).length).toBe(margin >= 4 ? 16 : 0);
      expect(r.maxErrorMm).toBeLessThan(0.01);
      if (margin === 4) expect(stream).toContain("0.85 w");
    }
  });
});
