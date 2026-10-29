export const PT = 72 / 25.4;
export const PAPERS = {
  A3: [297, 420],
  A4: [210, 297],
  A5: [148, 210],
  Letter: [215.9, 279.4],
  Legal: [215.9, 355.6],
  Tabloid: [279.4, 431.8],
} as const;
export type Unit = "mm" | "cm" | "in";
export type Mode = "precision" | "saver";
export type Assembly = "overlap" | "butt";
export type Alignment = "start" | "center" | "end";
export interface Settings {
  width: number;
  height: number;
  paperWidth: number;
  paperHeight: number;
  margin: number;
  overlap: number;
  alignment: Alignment;
  orientation: "auto" | "portrait" | "landscape";
}
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface Tile {
  index: number;
  row: number;
  col: number;
  source: Rect;
  trim: Rect;
}
export interface Plan {
  calibration?: { x: number; y: number };
  id: string;
  orientation: "portrait" | "landscape";
  paperWidth: number;
  paperHeight: number;
  usableWidth: number;
  usableHeight: number;
  cols: number;
  rows: number;
  pages: number;
  overlap: number;
  margin: number;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  waste: number;
  seams: number;
  tiles: Tile[];
}
export class GeometryError extends Error {}
const EPS = 1e-7;
export const toMm = (n: number, unit: Unit) =>
  n * (unit === "cm" ? 10 : unit === "in" ? 25.4 : 1);
export const fromMm = (n: number, unit: Unit) =>
  n / (unit === "cm" ? 10 : unit === "in" ? 25.4 : 1);
export const fmt = (n: number, digits = 2) =>
  Number(n.toFixed(digits)).toString();
export function checkSettings(s: Settings) {
  if (
    Object.values(s).some((v) => typeof v === "number" && !Number.isFinite(v))
  )
    throw new GeometryError("finite");
  if (
    [s.width, s.height, s.paperWidth, s.paperHeight].some(
      (n) => n < 1 || n > 5080,
    )
  )
    throw new GeometryError("size");
  if (s.margin < 0 || s.overlap < 0) throw new GeometryError("negative");
  const minUsable = Math.min(s.paperWidth, s.paperHeight) - 2 * s.margin;
  if (minUsable < 1) throw new GeometryError("margin");
  if (s.overlap >= minUsable) throw new GeometryError("overlap");
}
function count(length: number, usable: number, overlap: number) {
  return Math.max(1, Math.ceil((length - overlap - EPS) / (usable - overlap)));
}
export function makePlan(
  s: Settings,
  orientation: Plan["orientation"],
  calibration?: { x: number; y: number },
): Plan {
  if (
    calibration &&
    ![calibration.x, calibration.y].every(
      (n) => Number.isFinite(n) && n >= 100 / 120 && n <= 100 / 80,
    )
  )
    throw new GeometryError("calMeasurementError");
  checkSettings(s);
  const [short, long] = [
    Math.min(s.paperWidth, s.paperHeight),
    Math.max(s.paperWidth, s.paperHeight),
  ];
  const [pw, ph] = orientation === "portrait" ? [short, long] : [long, short];
  const uw = (pw - 2 * s.margin) / (calibration?.x ?? 1),
    uh = (ph - 2 * s.margin) / (calibration?.y ?? 1);
  if (s.overlap >= Math.min(uw, uh)) throw new GeometryError("overlap");
  const cols = count(s.width, uw, s.overlap),
    rows = count(s.height, uh, s.overlap);
  if (cols * rows > 200) throw new GeometryError("pages");
  const factor =
    s.alignment === "start" ? 0 : s.alignment === "center" ? 0.5 : 1;
  const offsetX = (cols * uw - (cols - 1) * s.overlap - s.width) * factor;
  const offsetY = (rows * uh - (rows - 1) * s.overlap - s.height) * factor;
  const xs = Array.from(
    { length: cols },
    (_, c) => c * (uw - s.overlap) - offsetX,
  );
  const ys = Array.from(
    { length: rows },
    (_, r) => r * (uh - s.overlap) - offsetY,
  );
  const cutsX = [0, ...xs.slice(1).map((x) => x + s.overlap / 2), s.width];
  const cutsY = [0, ...ys.slice(1).map((y) => y + s.overlap / 2), s.height];
  const tiles: Tile[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      tiles.push({
        index: tiles.length,
        row: r,
        col: c,
        source: { x: xs[c], y: ys[r], width: uw, height: uh },
        trim: {
          x: cutsX[c],
          y: cutsY[r],
          width: cutsX[c + 1] - cutsX[c],
          height: cutsY[r + 1] - cutsY[r],
        },
      });
  const plan: Plan = {
    ...(calibration ? { calibration } : {}),
    id: orientation,
    orientation,
    paperWidth: pw,
    paperHeight: ph,
    usableWidth: uw,
    usableHeight: uh,
    cols,
    rows,
    pages: tiles.length,
    overlap: s.overlap,
    margin: s.margin,
    width: s.width,
    height: s.height,
    offsetX,
    offsetY,
    waste: 1 - (s.width * s.height) / (tiles.length * pw * ph),
    seams: (cols - 1) * s.height + (rows - 1) * s.width,
    tiles,
  };
  validatePlan(plan);
  return plan;
}
export function candidates(s: Settings): Plan[] {
  checkSettings(s);
  const plans: Plan[] = [];
  for (const orientation of ["portrait", "landscape"] as const) {
    try {
      plans.push(makePlan(s, orientation));
    } catch (e) {
      if (!(e instanceof GeometryError) || e.message !== "pages") throw e;
    }
  }
  if (!plans.length) throw new GeometryError("pages");
  return plans;
}
export function choosePlan(
  plans: Plan[],
  mode: Mode,
  orientation: Settings["orientation"] = "auto",
): Plan {
  const eligible =
    orientation === "auto"
      ? plans
      : plans.filter((p) => p.orientation === orientation);
  if (!eligible.length) throw new GeometryError("pages");
  return [...eligible].sort((a, b) =>
    mode === "saver"
      ? a.pages - b.pages || a.waste - b.waste || a.seams - b.seams
      : a.seams - b.seams ||
        a.pages - b.pages ||
        (a.orientation === "portrait" ? -1 : 1),
  )[0];
}
export function validatePlan(p: Plan) {
  const close = (a: number, b: number) => Math.abs(a - b) < 1e-5;
  if (p.pages !== p.cols * p.rows || p.tiles.length !== p.pages)
    throw new GeometryError("coverage");
  let area = 0;
  p.tiles.forEach((t, i) => {
    if (
      ![
        t.source.x,
        t.source.y,
        t.trim.x,
        t.trim.y,
        t.trim.width,
        t.trim.height,
      ].every(Number.isFinite)
    )
      throw new GeometryError("coverage");
    if (
      t.trim.width <= 0 ||
      t.trim.height <= 0 ||
      t.trim.x < -EPS ||
      t.trim.y < -EPS ||
      t.trim.x + t.trim.width > p.width + EPS ||
      t.trim.y + t.trim.height > p.height + EPS
    )
      throw new GeometryError("coverage");
    if (
      t.trim.x < t.source.x - EPS ||
      t.trim.y < t.source.y - EPS ||
      t.trim.x + t.trim.width > t.source.x + t.source.width + EPS ||
      t.trim.y + t.trim.height > t.source.y + t.source.height + EPS
    )
      throw new GeometryError("coverage");
    if (
      t.col &&
      !close(p.tiles[i - 1].source.x + p.usableWidth - t.source.x, p.overlap)
    )
      throw new GeometryError("coverage");
    if (
      t.row &&
      !close(
        p.tiles[i - p.cols].source.y + p.usableHeight - t.source.y,
        p.overlap,
      )
    )
      throw new GeometryError("coverage");
    if (
      t.col &&
      !close(p.tiles[i - 1].trim.x + p.tiles[i - 1].trim.width, t.trim.x)
    )
      throw new GeometryError("coverage");
    if (
      t.row &&
      !close(
        p.tiles[i - p.cols].trim.y + p.tiles[i - p.cols].trim.height,
        t.trim.y,
      )
    )
      throw new GeometryError("coverage");
    area += t.trim.width * t.trim.height;
  });
  if (!close(area, p.width * p.height)) throw new GeometryError("coverage");
}
// Uniform scale only. A mismatched aspect ratio is either contained or explicitly cropped.
export function imagePlacement(
  iw: number,
  ih: number,
  width: number,
  height: number,
  fit: "contain" | "cover",
): Rect {
  const scale = (fit === "contain" ? Math.min : Math.max)(
    width / iw,
    height / ih,
  );
  return {
    x: (width - iw * scale) / 2,
    y: (height - ih * scale) / 2,
    width: iw * scale,
    height: ih * scale,
  };
}
export function cutRect(p: Plan, t: Tile, assembly: Assembly): Rect {
  if (assembly === "butt") return t.trim;
  // Each later page lies over its left/top neighbour. Keep the entire repeat on its leading edges.
  const x = Math.max(0, t.source.x),
    y = Math.max(0, t.source.y);
  return {
    x,
    y,
    width: Math.min(p.width, t.source.x + p.usableWidth) - x,
    height: Math.min(p.height, t.source.y + p.usableHeight) - y,
  };
}
