import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  Ruler,
  Download,
  Save,
  Trash2,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Grid2X2,
  LoaderCircle,
  CheckCircle2,
  TriangleAlert,
} from "lucide-react";
import {
  CALIBRATION_KEY,
  calibratedPlan,
  calibrationScale,
  calibrationReference,
  paperMatchesCalibration,
  parseCalibrations,
} from "./calibration";
import type { Calibration, CalibrationStore } from "./calibration";
import { checkTestPaper } from "./calibration";
import { fmt, fromMm, toMm } from "./geometry";
import type { Settings, Plan, Unit } from "./geometry";
import type { ProcessedImage } from "./image";
import type { ExportOptions, PdfResult } from "./pdf";
import { translate } from "./i18n";
import type { CopyKey, Language } from "./i18n";
import AssemblyMap from "./AssemblyMap";
import Numeric from "./Numeric";
import RoundedSelect from "./RoundedSelect";
const PdfPreview = lazy(() => import("./PdfPreview"));
interface Props {
  settings: Settings;
  unit: Unit;
  standardPlan?: Plan;
  image?: ProcessedImage;
  options: ExportOptions;
  language: Language;
}
function readSaved(): CalibrationStore {
  try {
    return parseCalibrations(localStorage.getItem(CALIBRATION_KEY));
  } catch {
    return parseCalibrations(null);
  }
}
function download(bytes: Uint8Array, name: string, mime = "application/pdf") {
  const url = URL.createObjectURL(
    new Blob([new Uint8Array(bytes)], { type: mime }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
const geometryErrors: Record<string, CopyKey> = {
  calMeasurementError: "calMeasurementError",
  calPaperMismatch: "calPaperMismatch",
  calPaperTooSmall: "calPaperTooSmall",
  pages: "pagesError",
  overlap: "overlapError",
  finite: "finite",
  margin: "marginError",
  size: "sizeError",
  negative: "negative",
};
export default function CalibrationPanel({
  settings,
  unit,
  standardPlan,
  image,
  options,
  language,
}: Props) {
  const length = (mm: number) => fmt(fromMm(mm, unit), 4);
  const nextReferenceMm = calibrationReference(unit);
  const referenceLength = `${length(nextReferenceMm)} ${unit}`;
  const copy = translate(language);
  const [saved, setSaved] = useState(readSaved);
  const initial = saved.profiles.find((p) => p.id === saved.activeId);
  const [active, setActive] = useState<Calibration | undefined>(initial),
    [name, setName] = useState(initial?.name ?? ""),
    [x, setX] = useState(initial ? String(initial.measuredX) : ""),
    [y, setY] = useState(initial ? String(initial.measuredY) : "");
  const [reference, setReference] = useState<
    { width: number; height: number; referenceMm: number } | undefined
  >(
    initial
      ? { width: initial.paperWidth, height: initial.paperHeight, referenceMm: initial.referenceMm ?? 100 }
      : undefined,
  );
  const measurementReferenceMm = reference?.referenceMm ?? nextReferenceMm;
  const t = (key: CopyKey) => copy(key)
    .replaceAll("{length}", key === "calFormula" ? `${length(measurementReferenceMm)} ${unit}` : referenceLength)
    .replaceAll("{range}", `${length(measurementReferenceMm * 0.8)}–${length(measurementReferenceMm * 1.2)} ${unit}`)
    .replaceAll("{area}", `${length(nextReferenceMm + 14)} × ${length(nextReferenceMm + 40)} ${unit}`);
  const [message, setMessage] = useState<CopyKey>(),
    [busy, setBusy] = useState(false),
    [exportError, setExportError] = useState(false),
    [result, setResult] = useState<{ pdf: PdfResult; signature: string }>(),
    [pageIndex, setPageIndex] = useState<number | null>(null);
  const orientation =
    settings.orientation === "auto"
      ? (standardPlan?.orientation ?? "portrait")
      : settings.orientation;
  const w = Math.min(settings.paperWidth, settings.paperHeight),
    h = Math.max(settings.paperWidth, settings.paperHeight);
  const testPaper = {
    width: orientation === "portrait" ? w : h,
    height: orientation === "portrait" ? h : w,
    margin: settings.margin,
    referenceMm: nextReferenceMm,
  };
  let testError: CopyKey | undefined;
  try {
    checkTestPaper(testPaper);
  } catch {
    testError = "calPaperTooSmall";
  }
  let factor: { x: number; y: number } | undefined;
  let measurementError = false;
  if (x !== "" || y !== "") {
    try {
      factor = calibrationScale(Number(x), Number(y), measurementReferenceMm);
    } catch {
      measurementError = true;
    }
  }
  const draftMatches =
    !!active &&
    name.trim() === active.name &&
    Number(x) === active.measuredX &&
    Number(y) === active.measuredY &&
    reference?.width === active.paperWidth &&
    reference?.height === active.paperHeight &&
    reference?.referenceMm === (active.referenceMm ?? 100);
  const layout = useMemo(() => {
    if (!active) return {};
    try {
      return { plan: calibratedPlan(settings, active) };
    } catch (e) {
      return {
        error:
          geometryErrors[e instanceof Error ? e.message : ""] ??
          ("coverage" as CopyKey),
      };
    }
  }, [settings, active]);
  const signature = JSON.stringify([active, image?.url, settings, options]);
  const plan = layout.plan;
  useEffect(() => {
    setExportError(false);
    setPageIndex(null);
    if (!image || !plan || !draftMatches) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      void import("./pdf")
        .then(({ exportPdf }) => exportPdf(image.bytes, plan, options))
        .then((pdf) => {
          if (!cancelled) setResult({ pdf, signature });
        })
        .catch(() => {
          if (!cancelled) setExportError(true);
        });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [signature, image, plan, draftMatches]);
  const ready =
    !!image &&
    !!plan &&
    !!result &&
    result.signature === signature &&
    draftMatches &&
    !layout.error;
  function persist(profiles: Calibration[], activeId: string) {
    const next: CalibrationStore = { version: 1, profiles, activeId };
    try {
      localStorage.setItem(CALIBRATION_KEY, JSON.stringify(next));
      setSaved(next);
      return true;
    } catch {
      setMessage("storageError");
      return false;
    }
  }
  async function ruler() {
    if (busy || testError) return;
    setBusy(true);
    setMessage(undefined);
    try {
      const { calibrationSheet } = await import("./calibration-pdf");
      const bytes = await calibrationSheet(testPaper, unit);
      download(
        bytes,
        `PrintScale-calibration-${length(testPaper.width)}x${length(testPaper.height)}${unit}-${length(nextReferenceMm)}${unit}.pdf`,
      );
      setReference({ width: testPaper.width, height: testPaper.height, referenceMm: nextReferenceMm });
      setX("");
      setY("");
      setMessage("calNewReference");
    } catch (e) {
      setMessage(
        geometryErrors[e instanceof Error ? e.message : ""] ?? "error",
      );
    } finally {
      setBusy(false);
    }
  }
  function save() {
    if (!reference || !factor || !name.trim()) return;
    const sameName = saved.profiles.find((p) => p.name === name.trim());
    if (saved.profiles.length >= 20 && !sameName) {
      setMessage("calStorageFull");
      return;
    }
    const record: Calibration = {
      id: sameName?.id ?? crypto.randomUUID(),
      name: name.trim(),
      measuredX: Number(x),
      measuredY: Number(y),
      referenceMm: reference.referenceMm,
      paperWidth: reference.width,
      paperHeight: reference.height,
      updatedAt: new Date().toISOString(),
    };
    const profiles = [
      ...saved.profiles.filter((p) => p.id !== record.id),
      record,
    ];
    if (persist(profiles, record.id)) {
      setActive(record);
      setName(record.name);
      setMessage("calSaved");
    }
  }
  function load(id: string) {
    const c = saved.profiles.find((p) => p.id === id);
    if (!persist(saved.profiles, c?.id ?? "")) return;
    setActive(c);
    setName(c?.name ?? "");
    setX(c ? String(c.measuredX) : "");
    setY(c ? String(c.measuredY) : "");
    setReference(
      c ? { width: c.paperWidth, height: c.paperHeight, referenceMm: c.referenceMm ?? 100 } : undefined,
    );
    setMessage(undefined);
  }
  function remove() {
    if (!active) return;
    if (
      persist(
        saved.profiles.filter((p) => p.id !== active.id),
        "",
      )
    ) {
      setActive(undefined);
      setName("");
      setX("");
      setY("");
      setReference(undefined);
      setMessage(undefined);
    }
  }
  const draftPaperMatches = reference
    ? paperMatchesCalibration(settings, {
        paperWidth: reference.width,
        paperHeight: reference.height,
      } as Calibration)
    : true;
  function guide() {
    if (!active || !plan) return;
    download(
      new TextEncoder().encode(
        `PrintScale | ${t("calApplied")}\n${active.name}\n${t("size")}: ${length(plan.width)} x ${length(plan.height)} ${unit}\n${t("outputPage")}: ${length(plan.paperWidth)} x ${length(plan.paperHeight)} ${unit}\n${plan.cols} x ${plan.rows} = ${plan.pages} ${t("sheets")}\n${t("calReferenceLength")}: ${length(active.referenceMm ?? 100)} ${unit}\n${t("calMeasured")}: X ${length(active.measuredX)} ${unit} / Y ${length(active.measuredY)} ${unit}\nX ${((active.referenceMm ?? 100) * 100 / active.measuredX).toFixed(4)}% / Y ${((active.referenceMm ?? 100) * 100 / active.measuredY).toFixed(4)}%\n${t("margin")}: ${length(plan.margin)} ${unit} | ${t("overlap")}: ${length(plan.overlap)} ${unit}\n\n${Array.from(
          { length: plan.rows },
          (_, r) =>
            plan.tiles
              .filter((p) => p.row === r)
              .map((p) => `[${p.index + 1}: R${r + 1} C${p.col + 1}]`)
              .join(" "),
        ).join(
          "\n",
        )}\n\n${t("calSameSettings")}\n\n${t("guide1")}\n\n${t(options.assembly === "overlap" ? "guideOverlap" : "guideButt")}\n\n${t("cutSymbol")}: ${t("cutSymbolHelp")}\n${t("registrationSymbol")}: ${t("registrationSymbolHelp")}\n\n${t("calPhysicalLimit")}`,
      ),
      "PrintScale-CALIBRATED-assembly.txt",
      "text/plain;charset=utf-8",
    );
  }
  return (
    <section className="calibration-panel" aria-labelledby="calibration-title">
      <div className="calibration-heading">
        <span className="calibration-icon">
          <Ruler size={22} />
        </span>
        <div>
          <h2 id="calibration-title">
            {t("calTitle")} <small>{t("calOptional")}</small>
          </h2>
          <p>{t("calIntro")}</p>
        </div>
        <span className="calibration-local">
          <ShieldCheck size={14} />
          {t("private")}
        </span>
      </div>
      <p className="calibration-instructions">{t("calSameSettings")}</p>
      <div className="calibration-workflow">
        <div className="calibration-reference">
          <h3>{t("calStep1")}</h3>
          <div className="ruler-illustration" aria-hidden="true">
            <span>0</span>
            <i />
            <span>{referenceLength}</span>
          </div>
          <p>
            {length(testPaper.width)} × {length(testPaper.height)} {unit} ·{" "}
            {t(orientation)}
          </p>
          <button
            className="small-button"
            disabled={busy || !!testError}
            onClick={() => void ruler()}
          >
            {busy ? (
              <LoaderCircle size={15} className="spin" />
            ) : (
              <Download size={15} />
            )}{" "}
            {t("calRuler")}
          </button>
          <p className="help">{t("calUncompensated")}</p>
          {testError && (
            <p className="warning" role="alert">
              {t(testError)}
            </p>
          )}
        </div>
        <div className="calibration-measure">
          <h3>{t("calStep2")}</h3>
          {saved.profiles.length > 0 && (
            <div className="calibration-profile-select">
              <div className="field">
                <span>{t("calLoad")}</span>
                <RoundedSelect
                  label={t("calLoad")}
                  value={active?.id ?? ""}
                  onChange={load}
                  options={[{ value: "", label: t("calNone") }, ...saved.profiles.map((p) => ({ value: p.id, label: `${p.name} · ${length(p.paperWidth)} × ${length(p.paperHeight)} ${unit}` }))]}
                />
              </div>
              <button
                className="icon-button"
                aria-label={t("calDelete")}
                disabled={!active}
                onClick={remove}
              >
                <Trash2 size={15} />
              </button>
            </div>
          )}
          <label className="field">
            {t("calName")}
            <input
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <div className="two-fields calibration-inputs">
            {[
              { label: "calMeasuredX" as const, value: x, set: setX },
              { label: "calMeasuredY" as const, value: y, set: setY },
            ].map((field) => (
              <Numeric
                key={`${field.label}-${unit}`}
                label={t(field.label)}
                value={field.value === "" ? NaN : fromMm(Number(field.value), unit)}
                min={fromMm(measurementReferenceMm * 0.8, unit)}
                max={fromMm(measurementReferenceMm * 1.2, unit)}
                suffix={unit}
                precision={8}
                disabled={!reference}
                onChange={(n) => field.set(Number.isFinite(n) ? String(toMm(n, unit)) : "")}
              />
            ))}
          </div>
          {reference ? (
            <p className="help">
              {t("calReference")}: {length(reference.width)} ×{" "}
              {length(reference.height)} {unit}
              <br />{t("calReferenceLength")}: {length(reference.referenceMm)} {unit}
            </p>
          ) : (
            <p className="help">{t("calNeedRuler")}</p>
          )}
          {measurementError && (
            <p className="warning" role="alert">
              {t("calMeasurementError")}
            </p>
          )}
          {!draftPaperMatches && (
            <p className="warning" role="alert">
              {t("calPaperMismatch")}
            </p>
          )}
          <div className="calibration-factors">
            <span>
              {t("calFactorX")}{" "}
              <strong>{factor ? fmt(factor.x * 100, 4) : "—"}%</strong>
            </span>
            <span>
              {t("calFactorY")}{" "}
              <strong>{factor ? fmt(factor.y * 100, 4) : "—"}%</strong>
            </span>
          </div>
          <p className="help">{t("calFormula")}</p>
          <button
            className="small-button calibration-save"
            disabled={
              !reference || !factor || !name.trim() || !draftPaperMatches
            }
            onClick={save}
          >
            <Save size={14} />
            {t("calSave")}
          </button>
          {message && (
            <p className="help" role="status">
              {t(message)}
            </p>
          )}
        </div>
        <div className="calibration-output">
          <h3>{t("calStep3")}</h3>
          <p className="help">{t("calStandardSafe")}</p>
          {active && draftMatches ? (
            <>
              <div className="calibration-summary">
                <span>
                  <CheckCircle2 size={14} />
                  {t("calApplied")}: {active.name}
                </span>
                <strong>
                  {plan
                    ? `${plan.cols} × ${plan.rows} = ${plan.pages} ${t("sheets")}`
                    : "—"}
                </strong>
                <span>
                  {plan
                    ? `${length(plan.paperWidth)} × ${length(plan.paperHeight)} ${unit} · ${t(plan.orientation)}`
                    : ""}
                </span>
                <span>
                  {t("size")}: {length(settings.width)} × {length(settings.height)} {unit}
                </span>
              </div>
              {layout.error && (
                <p className="warning" role="alert">
                  {t(layout.error)}
                </p>
              )}
              {!image && !layout.error && (
                <p className="help">{t("calNeedImage")}</p>
              )}
            </>
          ) : (
            <p className="calibration-empty">
              {t(active ? "calDraft" : "calNoCalibration")}
            </p>
          )}
          <p className="help">{t("calRetile")}</p>
          {exportError && (
            <p className="warning" role="alert">
              {t("error")}
            </p>
          )}
          <button
            className="primary-button"
            disabled={!ready}
            onClick={() => {
              if (ready)
                download(
                  result!.pdf.bytes,
                  `PrintScale-CALIBRATED-${fmt(settings.width)}x${fmt(settings.height)}mm-X${fmt((active!.referenceMm ?? 100) * 100 / active!.measuredX, 4)}-Y${fmt((active!.referenceMm ?? 100) * 100 / active!.measuredY, 4)}-${plan!.pages}pages.pdf`,
                );
            }}
          >
            {image &&
            active &&
            draftMatches &&
            plan &&
            !ready &&
            !exportError ? (
              <LoaderCircle size={15} className="spin" />
            ) : (
              <Download size={15} />
            )}{" "}
            {t("calDownload")}
          </button>
          <button className="text-button" onClick={guide} disabled={!ready}>
            {t("calGuide")}
          </button>
        </div>
      </div>
      {ready && (
        <details className="calibration-preview">
          <summary>
            {t("calPreview")}
            <span className="verified">
              <CheckCircle2 size={14} />
              {t("verified")}
            </span>
          </summary>
          <AssemblyMap
            plan={plan!}
            selected={pageIndex}
            onSelect={setPageIndex}
            t={t}
          />
          <div className="preview-canvas">
            <Suspense fallback={<LoaderCircle className="spin" />}>
              <PdfPreview
                tiled={result!.pdf}
                single={result!.pdf}
                plan={plan!}
                view="tiled"
                pageIndex={pageIndex}
                onPage={setPageIndex}
                t={t}
              />
            </Suspense>
            {pageIndex !== null ? (
              <div className="page-navigation">
                <button
                  className="icon-button"
                  aria-label={t("previous")}
                  disabled={pageIndex === 0}
                  onClick={() => setPageIndex((n) => (n ?? 1) - 1)}
                >
                  <ChevronLeft size={15} />
                </button>
                <span>
                  {pageIndex + 1} / {plan!.pages}
                </span>
                <button
                  className="icon-button"
                  aria-label={t("next")}
                  disabled={pageIndex === plan!.pages - 1}
                  onClick={() => setPageIndex((n) => (n ?? 0) + 1)}
                >
                  <ChevronRight size={15} />
                </button>
                <button
                  className="icon-button"
                  aria-label={t("tiled")}
                  onClick={() => setPageIndex(null)}
                >
                  <Grid2X2 size={15} />
                </button>
              </div>
            ) : (
              plan!.pages > 16 && (
                <button
                  className="small-button preview-open-next"
                  onClick={() => setPageIndex(16)}
                >
                  {t("page")} 17
                  <ChevronRight size={14} />
                </button>
              )
            )}
          </div>
        </details>
      )}
      <p className="calibration-caution">
        <TriangleAlert size={14} />
        {t("calPhysicalLimit")}
      </p>
    </section>
  );
}
