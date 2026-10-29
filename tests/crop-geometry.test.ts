import { describe, it, expect } from "vitest";
import {
  dragCrop,
  drawCrop,
  normalizeCrop,
  validCrop,
} from "../src/crop-geometry";
import type { CropHandle } from "../src/crop-geometry";
const crop = { x: 20, y: 25, width: 50, height: 40 };
describe("graphical crop coordinates", () => {
  it("moves the frame without changing its dimensions", () => {
    expect(dragCrop(crop, "move", 10, -5)).toEqual({
      x: 30,
      y: 20,
      width: 50,
      height: 40,
    });
    expect(dragCrop(crop, "move", 1000, -1000)).toEqual({
      x: 50,
      y: 0,
      width: 50,
      height: 40,
    });
  });
  it("keeps opposite corner anchored when resizing", () => {
    expect(dragCrop(crop, "nw", 5, 10)).toEqual({
      x: 25,
      y: 35,
      width: 45,
      height: 30,
    });
    expect(dragCrop(crop, "se", 10, 5)).toEqual({
      x: 20,
      y: 25,
      width: 60,
      height: 45,
    });
  });
  it("resizes each edge independently", () => {
    expect(dragCrop(crop, "n", 40, 10)).toEqual({
      x: 20,
      y: 35,
      width: 50,
      height: 30,
    });
    expect(dragCrop(crop, "e", 10, 40)).toEqual({
      x: 20,
      y: 25,
      width: 60,
      height: 40,
    });
    expect(dragCrop(crop, "s", -50, 10)).toEqual({
      x: 20,
      y: 25,
      width: 50,
      height: 50,
    });
    expect(dragCrop(crop, "w", 10, -40)).toEqual({
      x: 30,
      y: 25,
      width: 40,
      height: 40,
    });
  });
  it("never flips, escapes the source or becomes smaller than one percent", () => {
    for (const handle of [
      "move",
      "n",
      "s",
      "e",
      "w",
      "nw",
      "ne",
      "sw",
      "se",
    ] as CropHandle[])
      for (const dx of [-1000, -30, 0, 25, 1000])
        for (const dy of [-1000, -30, 0, 25, 1000]) {
          const next = dragCrop(crop, handle, dx, dy);
          expect(validCrop(next)).toBe(true);
          expect(next.x + next.width).toBeLessThanOrEqual(100.000001);
          expect(next.y + next.height).toBeLessThanOrEqual(100.000001);
        }
  });
  it("draws a new region in every drag direction", () => {
    expect(drawCrop(10, 20, 70, 80)).toEqual({
      x: 10,
      y: 20,
      width: 60,
      height: 60,
    });
    expect(drawCrop(70, 80, 10, 20)).toEqual({
      x: 10,
      y: 20,
      width: 60,
      height: 60,
    });
    expect(drawCrop(70, 20, 10, 80)).toEqual({
      x: 10,
      y: 20,
      width: 60,
      height: 60,
    });
    expect(drawCrop(10, 80, 70, 20)).toEqual({
      x: 10,
      y: 20,
      width: 60,
      height: 60,
    });
  });
  it("clamps drawing beyond the image and handles clicks at all four corners", () => {
    expect(drawCrop(-10, -20, 120, 140)).toEqual({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    });
    for (const x of [0, 100])
      for (const y of [0, 100])
        expect(validCrop(drawCrop(x, y, x, y))).toBe(true);
  });
  it("normalizes old invalid data for graphical recovery without mutating the original", () => {
    const old = { x: 99, y: -4, width: 120, height: 0 };
    expect(normalizeCrop(old)).toEqual({ x: 0, y: 0, width: 100, height: 1 });
    expect(old).toEqual({ x: 99, y: -4, width: 120, height: 0 });
    expect(normalizeCrop({ ...crop, width: NaN })).toEqual({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    });
  });
  it("preserves crop geometry across screen scales because all gestures use source percentages", () => {
    const a = dragCrop(crop, "se", (15 / 300) * 100, (20 / 400) * 100),
      b = dragCrop(crop, "se", (30 / 600) * 100, (40 / 800) * 100);
    expect(a).toEqual(b);
  });
  it("supports pixel-accurate keyboard movement and rejects non-finite motion", () => {
    const next = dragCrop(crop, "move", 100 / 3500, 100 / 4667);
    expect(((next.x - crop.x) * 3500) / 100).toBeCloseTo(1, 10);
    expect(((next.y - crop.y) * 4667) / 100).toBeCloseTo(1, 10);
    expect(dragCrop(crop, "se", NaN, 10)).toEqual(crop);
  });
  it("validates numeric fine-tuning before applying", () => {
    expect(validCrop(crop)).toBe(true);
    for (const value of [
      { ...crop, x: -1 },
      { ...crop, width: 0 },
      { ...crop, height: NaN },
      { ...crop, x: 60 },
      { ...crop, y: 90 },
    ])
      expect(validCrop(value)).toBe(false);
  });
});
