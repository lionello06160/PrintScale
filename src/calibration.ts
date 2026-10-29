import { makePlan } from "./geometry";
import type { Plan, Settings } from "./geometry";
export interface Calibration {
  id: string;
  name: string;
  measuredX: number;
  measuredY: number;
  paperWidth: number;
  paperHeight: number;
  updatedAt: string;
}
export interface Scale {
  x: number;
  y: number;
}
export interface CalibrationStore {
  version: 1;
  profiles: Calibration[];
  activeId: string;
}
export const CALIBRATION_KEY = "printscale-calibrations-v1";
export function calibrationScale(x: number, y: number): Scale {
  if (![x, y].every((v) => Number.isFinite(v) && v >= 80 && v <= 120))
    throw new Error("calMeasurementError");
  return { x: 100 / x, y: 100 / y };
}
export function validCalibration(v: unknown): v is Calibration {
  if (!v || typeof v !== "object") return false;
  const c = v as Calibration;
  return (
    typeof c.id === "string" &&
    c.id.length > 0 &&
    typeof c.name === "string" &&
    c.name.trim().length > 0 &&
    c.name.length <= 60 &&
    typeof c.updatedAt === "string" &&
    Number.isFinite(Date.parse(c.updatedAt)) &&
    [c.measuredX, c.measuredY].every(
      (n) => Number.isFinite(n) && n >= 80 && n <= 120,
    ) &&
    [c.paperWidth, c.paperHeight].every(
      (n) => Number.isFinite(n) && n >= 1 && n <= 5080,
    )
  );
}
export function parseCalibrations(raw: string | null): CalibrationStore {
  const empty: CalibrationStore = { version: 1, profiles: [], activeId: "" };
  try {
    const value = JSON.parse(raw || "null");
    if (value?.version !== 1 || !Array.isArray(value.profiles)) return empty;
    const profiles: Calibration[] = value.profiles
      .filter(validCalibration)
      .slice(0, 20);
    const unique = profiles.filter(
      (p, i) => profiles.findIndex((q) => q.id === p.id) === i,
    );
    return {
      version: 1,
      profiles: unique,
      activeId: unique.some((p) => p.id === value.activeId)
        ? value.activeId
        : "",
    };
  } catch {
    return empty;
  }
}
export function paperMatchesCalibration(s: Settings, c: Calibration) {
  const [w, h] = [
    Math.min(s.paperWidth, s.paperHeight),
    Math.max(s.paperWidth, s.paperHeight),
  ];
  const portrait = c.paperWidth <= c.paperHeight;
  return (
    Math.abs(w - Math.min(c.paperWidth, c.paperHeight)) < 0.001 &&
    Math.abs(h - Math.max(c.paperWidth, c.paperHeight)) < 0.001 &&
    (s.orientation === "auto" ||
      s.orientation === (portrait ? "portrait" : "landscape"))
  );
}
export function calibratedPlan(s: Settings, c: Calibration): Plan {
  if (!validCalibration(c)) throw new Error("calMeasurementError");
  if (!paperMatchesCalibration(s, c)) throw new Error("calPaperMismatch");
  return makePlan(
    s,
    c.paperWidth <= c.paperHeight ? "portrait" : "landscape",
    calibrationScale(c.measuredX, c.measuredY),
  );
}

export interface TestPaper {
  width: number;
  height: number;
  margin: number;
}
export function checkTestPaper(p: TestPaper) {
  if (
    ![p.width, p.height, p.margin].every(Number.isFinite) ||
    p.width < 1 ||
    p.height < 1 ||
    p.width > 5080 ||
    p.height > 5080 ||
    p.margin < 0 ||
    p.width - 2 * p.margin < 114 ||
    p.height - 2 * p.margin < 140
  )
    throw new Error("calPaperTooSmall");
}
