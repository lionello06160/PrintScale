import { describe, it, expect } from "vitest";
import {
  candidates,
  choosePlan,
  makePlan,
  validatePlan,
  toMm,
  fromMm,
  PAPERS,
  imagePlacement,
  cutRect,
} from "../src/geometry";
import type { Settings } from "../src/geometry";
const base: Settings = {
  width: 350,
  height: 466.7,
  paperWidth: 210,
  paperHeight: 297,
  margin: 15,
  overlap: 10,
  alignment: "center",
  orientation: "auto",
};
describe("physical tiling", () => {
  it("350 × 466.7 mm is exactly four A4 portrait pages, and six landscape", () => {
    const plans = candidates(base);
    const p = plans[0];
    expect([p.cols, p.rows, p.pages]).toEqual([2, 2, 4]);
    expect([p.usableWidth, p.usableHeight]).toEqual([180, 267]);
    expect(p.tiles[1].source.x - p.tiles[0].source.x).toBe(170);
    expect(p.tiles[2].source.y - p.tiles[0].source.y).toBe(257);
    expect(plans[1].pages).toBe(6);
    for (const mode of ["precision", "saver"] as const) {
      const selected = choosePlan(plans, mode);
      expect([
        selected.cols,
        selected.rows,
        selected.width,
        selected.height,
      ]).toEqual([2, 2, 350, 466.7]);
    }
  });
  it("handles exact boundaries without an extra page", () => {
    expect(makePlan({ ...base, width: 350.000000001 }, "portrait").cols).toBe(
      2,
    );
    expect(makePlan({ ...base, width: 350.001 }, "portrait").cols).toBe(3);
  });
  it("converts units without changing physical size", () => {
    expect(toMm(35, "cm")).toBe(350);
    expect(toMm(fromMm(466.7, "in"), "in")).toBeCloseTo(466.7, 10);
  });
  it("provides a real saver difference when a shorter seam takes more paper", () => {
    let found = false;
    for (let width = 180; width < 800; width += 25)
      for (let height = 180; height < 800; height += 25) {
        const c = candidates({ ...base, width, height });
        const p = choosePlan(c, "precision"),
          s = choosePlan(c, "saver");
        if (p.pages > s.pages) {
          found = true;
          expect(p.width).toBe(s.width);
          expect(p.height).toBe(s.height);
        }
      }
    expect(found).toBe(true);
  });
  it("covers all stock papers, alignments and overlaps with no missing or enlarged area", () => {
    for (const [paperWidth, paperHeight] of Object.values(PAPERS))
      for (const alignment of ["start", "center", "end"] as const)
        for (const overlap of [0, 5, 10, 25])
          for (const [width, height] of [
            [60, 80],
            [350, 466.7],
            [900, 1200],
          ])
            for (const p of candidates({
              ...base,
              width,
              height,
              paperWidth,
              paperHeight,
              alignment,
              overlap,
            })) {
              expect(() => validatePlan(p)).not.toThrow();
              expect(p.width).toBe(width);
              expect(p.height).toBe(height);
              const total = p.tiles.reduce(
                (a, t) => a + t.trim.width * t.trim.height,
                0,
              );
              expect(total).toBeCloseTo(width * height, 5);
              for (const t of p.tiles) {
                const cut = cutRect(p, t, "overlap");
                expect(cut.x).toBeGreaterThanOrEqual(0);
                expect(cut.y).toBeGreaterThanOrEqual(0);
                expect(cut.x + cut.width).toBeLessThanOrEqual(width + 1e-7);
                expect(cut.y + cut.height).toBeLessThanOrEqual(height + 1e-7);
                expect(cutRect(p, t, "butt")).toEqual(t.trim);
              }
            }
  });
  it.each([
    { width: NaN },
    { height: 0 },
    { paperWidth: 0 },
    { width: 5081 },
    { margin: 110 },
    { margin: -1 },
    { overlap: -1 },
    { overlap: 180 },
    {
      width: 5080,
      height: 5080,
      paperWidth: 10,
      paperHeight: 10,
      margin: 1,
      overlap: 1,
    },
  ])("rejects impossible settings %j", (override) =>
    expect(() => candidates({ ...base, ...override })).toThrow(),
  );
  it("detects tampered geometry", () => {
    const p = makePlan(base, "portrait");
    p.tiles[1].source.x += 1;
    expect(() => validatePlan(p)).toThrow();
  });
  it("preserves image aspect in both fitting modes", () => {
    for (const fit of ["cover", "contain"] as const) {
      const r = imagePlacement(1000, 500, 350, 466.7, fit);
      expect(r.width / r.height).toBe(2);
    }
    expect(imagePlacement(1000, 500, 350, 466.7, "contain").height).toBe(175);
  });
});
