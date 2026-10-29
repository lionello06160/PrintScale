import type { Crop } from "./image";
export type CropHandle =
  "move" | "n" | "s" | "e" | "w" | "nw" | "ne" | "sw" | "se";
const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));
export function validCrop(c: Crop) {
  return (
    [c.x, c.y, c.width, c.height].every(Number.isFinite) &&
    c.x >= 0 &&
    c.y >= 0 &&
    c.width >= 1 &&
    c.height >= 1 &&
    c.x + c.width <= 100.000001 &&
    c.y + c.height <= 100.000001
  );
}
export function normalizeCrop(c: Crop): Crop {
  if (![c.x, c.y, c.width, c.height].every(Number.isFinite))
    return { x: 0, y: 0, width: 100, height: 100 };
  const width = clamp(c.width, 1, 100),
    height = clamp(c.height, 1, 100);
  return {
    x: clamp(c.x, 0, 100 - width),
    y: clamp(c.y, 0, 100 - height),
    width,
    height,
  };
}
export function dragCrop(
  start: Crop,
  handle: CropHandle,
  dx: number,
  dy: number,
): Crop {
  const c = normalizeCrop(start);
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) return c;
  if (handle === "move")
    return {
      ...c,
      x: clamp(c.x + dx, 0, 100 - c.width),
      y: clamp(c.y + dy, 0, 100 - c.height),
    };
  let left = c.x,
    top = c.y,
    right = c.x + c.width,
    bottom = c.y + c.height;
  if (handle.includes("w")) left = clamp(left + dx, 0, right - 1);
  if (handle.includes("e")) right = clamp(right + dx, left + 1, 100);
  if (handle.includes("n")) top = clamp(top + dy, 0, bottom - 1);
  if (handle.includes("s")) bottom = clamp(bottom + dy, top + 1, 100);
  return { x: left, y: top, width: right - left, height: bottom - top };
}
export function drawCrop(ax: number, ay: number, bx: number, by: number): Crop {
  const a = { x: clamp(ax, 0, 100), y: clamp(ay, 0, 100) },
    b = { x: clamp(bx, 0, 100), y: clamp(by, 0, 100) };
  return normalizeCrop({
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.max(1, Math.abs(b.x - a.x)),
    height: Math.max(1, Math.abs(b.y - a.y)),
  });
}
