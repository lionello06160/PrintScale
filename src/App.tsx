import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Crop as CropIcon,
  Expand,
  FileImage,
  FileText,
  Globe2,
  Grid2X2,
  Leaf,
  LoaderCircle,
  LockKeyhole,
  Maximize2,
  Printer,
  RotateCw,
  Ruler,
  Scissors,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
  Link2,
  Unlink2,
  TriangleAlert,
  Save,
  Trash2,
} from "lucide-react";
import {
  candidates,
  choosePlan,
  fmt,
  fromMm,
  toMm,
  PAPERS,
  GeometryError,
} from "./geometry";
import type {
  Settings,
  Unit,
  Mode,
  Plan,
  Assembly,
  Alignment,
} from "./geometry";
import { FULL_CROP, processImage, readImage, sampleImage } from "./image";
import type { SourceImage, ProcessedImage, Crop } from "./image";
import { translate } from "./i18n";
import type { Language, CopyKey } from "./i18n";
import type { ExportOptions, PdfResult } from "./pdf";
import type { View } from "./PdfPreview";
import AssemblyMap from "./AssemblyMap";
import Numeric from "./Numeric";
import PrintMarkLegend from "./PrintMarkLegend";
import { canPrintPositionHints } from "./positions";
const CalibrationPanel = lazy(() => import("./CalibrationPanel"));
const CropEditor = lazy(() => import("./CropEditor"));
const PdfPreview = lazy(() => import("./PdfPreview"));
const DEFAULT: Settings = {
  width: 350,
  height: 466.7,
  paperWidth: 210,
  paperHeight: 297,
  margin: 15,
  overlap: 10,
  alignment: "center",
  orientation: "auto",
};
type Output = { tiled: PdfResult; single: PdfResult; signature: string };
type Profile = {
  name: string;
  paper: string;
  paperWidth: number;
  paperHeight: number;
  margin: number;
  overlap: number;
  orientation: Settings["orientation"];
};
function savedLanguage(): Language {
  try {
    const v = localStorage.getItem("printscale-language");
    if (v === "en" || v === "ja" || v === "zh-Hant") return v;
  } catch {
    /* Preferences are optional. */
  }
  return navigator.language.startsWith("ja")
    ? "ja"
    : navigator.language.startsWith("zh")
      ? "zh-Hant"
      : "en";
}
function loadProfiles(): Profile[] {
  try {
    const raw = JSON.parse(
      localStorage.getItem("printscale-profiles-v1") || "[]",
    );
    return Array.isArray(raw)
      ? raw
          .filter(
            (p) =>
              p &&
              typeof p.name === "string" &&
              typeof p.paper === "string" &&
              [p.paperWidth, p.paperHeight, p.margin, p.overlap].every(
                Number.isFinite,
              ) &&
              ["auto", "portrait", "landscape"].includes(p.orientation),
          )
          .slice(0, 20)
      : [];
  } catch {
    return [];
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
export default function App() {
  const [language, setLanguage] = useState<Language>(savedLanguage),
    t = translate(language);
  const [source, setSource] = useState<SourceImage>(),
    [processed, setProcessed] = useState<ProcessedImage & { key: string }>();
  const [rotation, setRotation] = useState(0),
    [crop, setCrop] = useState<Crop>(FULL_CROP),
    [cropOpen, setCropOpen] = useState(false),
    [fileBusy, setFileBusy] = useState(false),
    [fileError, setFileError] = useState<CopyKey>(),
    [processError, setProcessError] = useState<CopyKey>();
  const [settings, setSettings] = useState<Settings>(DEFAULT),
    [unit, setUnit] = useState<Unit>("mm"),
    [locked, setLocked] = useState(true),
    [paper, setPaper] = useState("A4"),
    [mode, setMode] = useState<Mode>("precision"),
    [fit, setFit] = useState<"contain" | "cover">("contain");
  const [assembly, setAssembly] = useState<Assembly>("overlap"),
    [cropMarks, setCropMarks] = useState(true),
    [registration, setRegistration] = useState(true),
    [pageNumbers, setPageNumbers] = useState(true);
  const [output, setOutput] = useState<Output>(),
    [pdfError, setPdfError] = useState(false),
    [view, setView] = useState<View>("tiled"),
    [pageIndex, setPageIndex] = useState<number | null>(null),
    [modal, setModal] = useState<"guide" | "privacy" | null>(null),
    [dragging, setDragging] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>(loadProfiles),
    [profileName, setProfileName] = useState(""),
    [selectedProfile, setSelectedProfile] = useState(""),
    [profileMessage, setProfileMessage] = useState<CopyKey>();
  const fileInput = useRef<HTMLInputElement>(null),
    readSequence = useRef(0),
    modalRef = useRef<HTMLDialogElement>(null),
    opener = useRef<HTMLElement | null>(null);
  const patch = (p: Partial<Settings>) => {
    if (
      Object.keys(p).some((k) =>
        [
          "paperWidth",
          "paperHeight",
          "margin",
          "overlap",
          "orientation",
        ].includes(k),
      )
    )
      setSelectedProfile("");
    setSettings((s) => ({ ...s, ...p }));
  };
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = `PrintScale — ${t("tagline")}`;
    try {
      localStorage.setItem("printscale-language", language);
    } catch {
      /* Storage is optional. */
    }
  }, [language]); // eslint-disable-line
  useEffect(
    () => () => {
      if (source) URL.revokeObjectURL(source.url);
    },
    [source],
  );
  const processKey = JSON.stringify([source?.url, rotation, crop]);
  useEffect(() => {
    if (!source) return;
    let cancelled = false;
    let local: ProcessedImage | undefined;
    setProcessError(undefined);
    processImage(source, rotation, crop)
      .then((result) => {
        local = result;
        if (cancelled) {
          URL.revokeObjectURL(result.url);
          return;
        }
        setProcessed({ ...result, key: processKey });
      })
      .catch((e) => {
        if (!cancelled)
          setProcessError(
            e.message === "cropError" ? "cropError" : "fileLarge",
          );
      });
    return () => {
      cancelled = true;
      if (local) URL.revokeObjectURL(local.url);
    };
  }, [source, rotation, crop, processKey]);
  const imageReady =
    processed?.key === processKey && !fileBusy && !processError && !fileError;
  const calculation = useMemo(() => {
    try {
      const all = candidates(settings);
      return {
        all,
        precision: choosePlan(all, "precision", settings.orientation),
        saver: choosePlan(all, "saver", settings.orientation),
      };
    } catch (e) {
      const codes: Record<string, CopyKey> = {
        size: "sizeError",
        margin: "marginError",
        overlap: "overlapError",
        pages: "pagesError",
        finite: "finite",
        negative: "negative",
        coverage: "coverage",
      };
      return {
        error:
          codes[e instanceof GeometryError ? e.message : "coverage"] ||
          "coverage",
      };
    }
  }, [settings]);
  const plan = calculation[mode];
  const exportOptions: ExportOptions = {
    assembly,
    cropMarks,
    registration,
    pageNumbers,
    fit,
  };
  const signature = JSON.stringify([processKey, settings, mode, exportOptions]);
  useEffect(() => {
    setPdfError(false);
    setPageIndex(null);
    if (!plan || !processed || !imageReady) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const { exportPdf } = await import("./pdf");
          const tiled = await exportPdf(processed.bytes, plan, exportOptions);
          if (cancelled) return;
          const single = await exportPdf(
            processed.bytes,
            plan,
            exportOptions,
            "single",
          );
          if (!cancelled) setOutput({ tiled, single, signature });
        } catch {
          if (!cancelled) setPdfError(true);
        }
      })();
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [signature, processed, imageReady, plan]); // exportOptions is included in signature.
  const ready =
    !!output &&
    output.signature === signature &&
    !!imageReady &&
    !!plan &&
    !calculation.error;
  useEffect(() => {
    const dialog = modalRef.current;
    if (modal && dialog) {
      opener.current = document.activeElement as HTMLElement;
      dialog.showModal();
    } else if (dialog?.open) {
      dialog.close();
      opener.current?.focus();
    }
  }, [modal]);
  async function addFile(file?: File) {
    if (!file) return;
    const sequence = ++readSequence.current;
    setFileBusy(true);
    setFileError(undefined);
    try {
      const next = await readImage(file);
      if (sequence !== readSequence.current) {
        URL.revokeObjectURL(next.url);
        return;
      }
      setSource(next);
      setRotation(0);
      setCrop({ ...FULL_CROP });
      if (locked)
        patch({ height: (settings.width * next.height) / next.width });
    } catch (e) {
      if (sequence === readSequence.current)
        setFileError(
          e instanceof Error && e.message === "fileLarge"
            ? "fileLarge"
            : "fileError",
        );
    } finally {
      if (sequence === readSequence.current) setFileBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }
  async function addSample() {
    const sequence = ++readSequence.current;
    setFileBusy(true);
    setFileError(undefined);
    try {
      const next = await sampleImage(t("demoName"));
      if (sequence !== readSequence.current) {
        URL.revokeObjectURL(next.url);
        return;
      }
      setSource(next);
      setRotation(0);
      setCrop({ ...FULL_CROP });
      setSettings({ ...DEFAULT });
      setPaper("A4");
      setMode("precision");
    } catch {
      setFileError("fileError");
    } finally {
      if (sequence === readSequence.current) setFileBusy(false);
    }
  }
  const ratio = source
    ? ((rotation % 180 ? source.height : source.width) * crop.width) /
      ((rotation % 180 ? source.width : source.height) * crop.height)
    : DEFAULT.width / DEFAULT.height;
  function dimension(axis: "width" | "height", n: number) {
    const mm = toMm(n, unit);
    patch(
      locked && Number.isFinite(ratio)
        ? axis === "width"
          ? { width: mm, height: mm / ratio }
          : { height: mm, width: mm * ratio }
        : { [axis]: mm },
    );
  }
  function changeCrop(next: Crop) {
    setCrop(next);
    if (locked && source) {
      const r =
        ((rotation % 180 ? source.height : source.width) * next.width) /
        ((rotation % 180 ? source.width : source.height) * next.height);
      patch({ height: settings.width / r });
    }
  }
  function rotate() {
    setRotation((r) => (r + 90) % 360);
    setCrop({ ...FULL_CROP });
    if (locked && source) {
      const newRatio =
        rotation % 180
          ? source.width / source.height
          : source.height / source.width;
      patch({ height: settings.width / newRatio });
    }
  }
  const placement = ready ? output!.tiled.placement : undefined;
  const ppi =
    processed && placement
      ? Math.min(
          processed.width / (placement.width / 25.4),
          processed.height / (placement.height / 25.4),
        )
      : 0;
  const errorKey = fileError || processError || calculation.error;
  function saveProfile() {
    if (!profileName.trim()) return;
    const next = [
      ...profiles.filter((p) => p.name !== profileName.trim()),
      {
        name: profileName.trim().slice(0, 60),
        paper,
        paperWidth: settings.paperWidth,
        paperHeight: settings.paperHeight,
        margin: settings.margin,
        overlap: settings.overlap,
        orientation: settings.orientation,
      },
    ].slice(-20);
    try {
      candidates(settings);
      localStorage.setItem("printscale-profiles-v1", JSON.stringify(next));
      setProfiles(next);
      setSelectedProfile(profileName.trim());
      setProfileMessage("profileSaved");
    } catch {
      setProfileMessage("storageError");
    }
  }
  function applyProfile(name: string) {
    setSelectedProfile(name);
    const p = profiles.find((p) => p.name === name);
    if (!p) return;
    try {
      const next = {
        ...settings,
        paperWidth: p.paperWidth,
        paperHeight: p.paperHeight,
        margin: p.margin,
        overlap: p.overlap,
        orientation: p.orientation,
      };
      candidates(next);
      setSettings(next);
      setPaper(p.paper);
      setProfileMessage(undefined);
    } catch {
      setProfileMessage("profileInvalid");
    }
  }
  function deleteProfile() {
    try {
      const next = profiles.filter((p) => p.name !== selectedProfile);
      localStorage.setItem("printscale-profiles-v1", JSON.stringify(next));
      setProfiles(next);
      setSelectedProfile("");
    } catch {
      setProfileMessage("storageError");
    }
  }
  function guideText(p: Plan) {
    return `PrintScale — ${t("guide")}\n\n${t("size")}: ${fmt(p.width)} × ${fmt(p.height)} mm\n${t("outputPage")}: ${fmt(p.paperWidth)} × ${fmt(p.paperHeight)} mm\n${p.cols} × ${p.rows} = ${p.pages} ${t("sheets")}\n${t("margin")}: ${p.margin} mm | ${t("overlap")}: ${p.overlap} mm\n${t("assembly")}: ${t(assembly === "overlap" ? "overlapMethod" : "buttMethod")}\n\n${Array.from(
      { length: p.rows },
      (_, r) =>
        p.tiles
          .filter((x) => x.row === r)
          .map((x) => `[${x.index + 1}: R${r + 1} C${x.col + 1}]`)
          .join("  "),
    ).join(
      "\n",
    )}\n\n1. ${t("printHelp")}\n2. ${t("guide1")}\n3. ${t(assembly === "overlap" ? "guideOverlap" : "guideButt")}\n4. ${t("guide3")}\n\n${t("cutSymbol")}: ${t("cutSymbolHelp")}\n${t("registrationSymbol")}: ${t("registrationSymbolHelp")}\n\n${t("size")} ${fmt(p.width)} × ${fmt(p.height)} mm. 100%.`;
  }
  const modeCard = (m: Mode) => {
    const p = calculation[m];
    return (
      <button
        className={`mode-card ${mode === m ? "active" : ""}`}
        onClick={() => setMode(m)}
        aria-pressed={mode === m}
      >
        {m === "precision" ? <Expand size={20} /> : <Leaf size={20} />}
        <span className="mode-name">{t(m)}</span>
        <span className="radio-dot">{mode === m && <span />}</span>
        <span className="mode-description">
          {t(m === "precision" ? "precisionDesc" : "saverDesc")}
        </span>
        <strong>
          {p?.pages ?? "—"} <small>{t("sheets")}</small>
        </strong>
        <span className="mode-spec">
          {p ? `${p.cols} × ${p.rows} · ${t(p.orientation)}` : "—"}
        </span>
      </button>
    );
  };
  return (
    <>
      <header className="header">
        <a className="brand" href="#" aria-label="PrintScale">
          <span className="brand-icon">
            <Grid2X2 size={25} />
          </span>
          PrintScale
        </a>
        <span className="header-tagline">{t("tagline")}</span>
        <div className="header-right">
          <span className="privacy-badge">
            <ShieldCheck size={15} />
            {t("private")}
          </span>
          <label className="language">
            <Globe2 size={16} />
            <select
              aria-label="Language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
            >
              <option value="zh-Hant">繁體中文</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
            </select>
            <ChevronDown size={12} />
          </label>
        </div>
      </header>
      <main>
        <section className="hero">
          <div>
            <div className="eyebrow">
              <span />
              {t("eyebrow")}
            </div>
            <h1>
              {t("title1")}
              <br />
              <em>{t("title2")}</em>
            </h1>
            <p>{t("intro")}</p>
            <div className="hero-meta">
              <span>
                <Check size={14} />
                {t("free")}
              </span>
              <span>
                <LockKeyhole size={13} />
                {t("saved")}
              </span>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <span className="art-measure horizontal">350 mm</span>
            <div className="art-poster">
              <div className="art-sun" />
              <span className="art-text">
                Make
                <br />
                <i>it big.</i>
              </span>
              <div className="art-leaf l1" />
              <div className="art-leaf l2" />
              <div className="art-leaf l3" />
              <div className="art-seam v" />
              <div className="art-seam h" />
              <span className="art-tick tl">+</span>
              <span className="art-tick br">+</span>
            </div>
            <div className="art-note">
              <Ruler size={16} />
              <span>
                100%<small>TRUE TO SIZE</small>
              </span>
            </div>
          </div>
        </section>
        <nav className="steps" aria-label={t("workspace")}>
          {(["step1", "step2", "step3"] as const).map((key, i) => (
            <div key={key}>
              <span
                className={`step-number ${source || i === 0 ? "complete" : ""}`}
              >
                {i === 0 && source ? (
                  <Check size={14} />
                ) : (
                  String(i + 1).padStart(2, "0")
                )}
              </span>
              <span>{t(key)}</span>
              {i < 2 && <ArrowRight size={16} />}
            </div>
          ))}
        </nav>
        <div className="studio-heading">
          <h2>{t("workspace")}</h2>
          <span>
            <span className="status-dot" />
            {t("saved")}
          </span>
        </div>
        <div className="studio">
          <aside className="settings-panel">
            <section className="setting-section">
              <h3>
                <span>01</span>
                {t("image")}
                <FileImage size={17} />
              </h3>
              <input
                className="sr-only"
                ref={fileInput}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                aria-label={t("upload")}
                onChange={(e) => void addFile(e.target.files?.[0])}
              />
              {!source ? (
                <div
                  className={`upload-zone ${dragging ? "dragging" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    void addFile(e.dataTransfer.files[0]);
                  }}
                >
                  <button
                    className="upload-action"
                    disabled={fileBusy}
                    onClick={() => fileInput.current?.click()}
                  >
                    <span className="upload-icon">
                      {fileBusy ? (
                        <LoaderCircle className="spin" />
                      ) : (
                        <Upload />
                      )}
                    </span>
                    <strong>{t("upload")}</strong>
                    <span>{t("browse")}</span>
                  </button>
                  <p>{t("formats")}</p>
                  <button
                    className="text-button sample-button"
                    onClick={() => void addSample()}
                    disabled={fileBusy}
                  >
                    <Sparkles size={14} />
                    {t("sample")}
                    <ArrowRight size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <div
                    className="image-summary"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      void addFile(e.dataTransfer.files[0]);
                    }}
                  >
                    <img
                      src={imageReady ? processed!.url : source.url}
                      alt=""
                    />
                    <div>
                      <strong title={source.name}>{source.name}</strong>
                      <span>
                        {imageReady
                          ? `${processed!.width} × ${processed!.height}`
                          : `${source.width} × ${source.height}`}{" "}
                        px
                      </span>
                      <button
                        className="text-button"
                        disabled={fileBusy}
                        onClick={() => fileInput.current?.click()}
                      >
                        {t("replace")}
                      </button>
                    </div>
                  </div>
                  <div className="image-tools">
                    <button onClick={rotate} disabled={fileBusy}>
                      <RotateCw size={14} />
                      {t("rotate")}
                    </button>
                    <button
                      onClick={() => setCropOpen(true)}
                      disabled={fileBusy}
                      aria-expanded={cropOpen}
                      aria-haspopup="dialog"
                    >
                      <CropIcon size={14} />
                      {t("edit")}
                    </button>
                  </div>
                </>
              )}
            </section>
            <section className="setting-section">
              <h3>
                <span>02</span>
                {t("size")}
                <Ruler size={17} />
              </h3>
              <div className="unit-row">
                <label>{t("unit")}</label>
                <div className="segmented units">
                  {(["mm", "cm", "in"] as const).map((u) => (
                    <button
                      key={u}
                      className={u === unit ? "active" : ""}
                      aria-pressed={u === unit}
                      onClick={() => setUnit(u)}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              <div className="dimension-fields">
                <Numeric
                  id="poster-width"
                  label={t("width")}
                  value={fromMm(settings.width, unit)}
                  min={fromMm(1, unit)}
                  suffix={unit}
                  onChange={(n) => dimension("width", n)}
                />
                <button
                  className={`lock-button ${locked ? "locked" : ""}`}
                  aria-label={t(locked ? "unlock" : "lock")}
                  aria-pressed={locked}
                  onClick={() => {
                    if (!locked && source)
                      patch({ height: settings.width / ratio });
                    setLocked((v) => !v);
                  }}
                >
                  {locked ? <Link2 size={18} /> : <Unlink2 size={18} />}
                </button>
                <Numeric
                  id="poster-height"
                  label={t("height")}
                  value={fromMm(settings.height, unit)}
                  min={fromMm(1, unit)}
                  suffix={unit}
                  onChange={(n) => dimension("height", n)}
                />
              </div>
              <p className="help lock-help">
                <Link2 size={12} />
                {t(locked ? "lock" : "noStretch")}
              </p>
              {!locked && (
                <label className="field fit-field">
                  {t("fit")}
                  <select
                    value={fit}
                    onChange={(e) =>
                      setFit(e.target.value as "contain" | "cover")
                    }
                  >
                    <option value="contain">{t("contain")}</option>
                    <option value="cover">{t("cover")}</option>
                  </select>
                </label>
              )}
            </section>
            <section className="setting-section">
              <h3>
                <span>03</span>
                {t("paper")}
                <Printer size={17} />
              </h3>
              <div className="two-fields">
                <label className="field">
                  {t("paperSize")}
                  <select
                    value={paper}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPaper(value);
                      if (value !== "custom") {
                        const [paperWidth, paperHeight] =
                          PAPERS[value as keyof typeof PAPERS];
                        patch({ paperWidth, paperHeight });
                      }
                    }}
                  >
                    {Object.entries(PAPERS).map(([key]) => (
                      <option key={key}>{key}</option>
                    ))}
                    <option value="custom">{t("custom")}</option>
                  </select>
                </label>
                <label className="field">
                  {t("orientation")}
                  <select
                    value={settings.orientation}
                    onChange={(e) =>
                      patch({
                        orientation: e.target.value as Settings["orientation"],
                      })
                    }
                  >
                    <option value="auto">{t("auto")}</option>
                    <option value="portrait">{t("portrait")}</option>
                    <option value="landscape">{t("landscape")}</option>
                  </select>
                </label>
              </div>
              {paper === "custom" && (
                <div className="two-fields custom-fields">
                  <Numeric
                    label={t("width")}
                    value={settings.paperWidth}
                    suffix="mm"
                    min={1}
                    max={5080}
                    onChange={(n) => patch({ paperWidth: n })}
                  />
                  <Numeric
                    label={t("height")}
                    value={settings.paperHeight}
                    suffix="mm"
                    min={1}
                    max={5080}
                    onChange={(n) => patch({ paperHeight: n })}
                  />
                </div>
              )}
              <div className="two-fields spacing-fields">
                <Numeric
                  label={t("margin")}
                  value={settings.margin}
                  suffix="mm"
                  min={0}
                  onChange={(n) => patch({ margin: n })}
                />
                <Numeric
                  label={t("overlap")}
                  value={settings.overlap}
                  suffix="mm"
                  min={0}
                  onChange={(n) => patch({ overlap: n })}
                />
              </div>
              <p className="help">{t("marginHelp")}</p>
              <label className="field alignment-field">
                {t("alignment")}
                <select
                  value={settings.alignment}
                  onChange={(e) =>
                    patch({ alignment: e.target.value as Alignment })
                  }
                >
                  {(["center", "start", "end"] as const).map((a) => (
                    <option key={a} value={a}>
                      {t(a)}
                    </option>
                  ))}
                </select>
              </label>
              <details className="profiles">
                <summary>
                  {t("profile")}
                  <ChevronDown size={13} />
                </summary>
                <div className="profile-body">
                  <label className="field">
                    {t("profileName")}
                    <input
                      value={profileName}
                      maxLength={60}
                      onChange={(e) => setProfileName(e.target.value)}
                    />
                  </label>
                  <button
                    className="small-button"
                    onClick={saveProfile}
                    disabled={!profileName.trim() || !!calculation.error}
                  >
                    <Save size={13} />
                    {t("saveProfile")}
                  </button>
                  {profiles.length > 0 && (
                    <div className="profile-load">
                      <select
                        aria-label={t("loadProfile")}
                        value={selectedProfile}
                        onChange={(e) => applyProfile(e.target.value)}
                      >
                        <option value="">{t("loadProfile")}</option>
                        {profiles.map((p) => (
                          <option key={p.name}>{p.name}</option>
                        ))}
                      </select>
                      <button
                        className="icon-button"
                        aria-label={t("deleteProfile")}
                        disabled={!selectedProfile}
                        onClick={deleteProfile}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                  {profileMessage && (
                    <p className="help" role="status">
                      {t(profileMessage)}
                    </p>
                  )}
                </div>
              </details>
            </section>
          </aside>
          <div className="workspace-main">
            <section className="layout-section">
              <div className="section-title">
                <h3>{t("compare")}</h3>
                <span className="true-size-badge">
                  <LockKeyhole size={12} />
                  100% TRUE SIZE
                </span>
              </div>
              <div className="mode-grid">
                {modeCard("precision")}
                {modeCard("saver")}
              </div>
              <p className="comparison-note">
                <CheckCircle2 size={14} />
                {t(
                  calculation.precision?.id === calculation.saver?.id
                    ? "same"
                    : "different",
                )}
              </p>
              {calculation.all && (
                <details className="alternatives">
                  <summary>
                    {t("alternatives")}
                    <ChevronDown size={13} />
                  </summary>
                  <div>
                    {calculation.all.map((p) => (
                      <button
                        key={p.id}
                        aria-pressed={plan?.id === p.id}
                        onClick={() => patch({ orientation: p.orientation })}
                      >
                        <span>
                          {t(p.orientation)} · {fmt(p.paperWidth)} ×{" "}
                          {fmt(p.paperHeight)} mm
                        </span>
                        <strong>
                          {p.cols} × {p.rows} = {p.pages} {t("sheets")}
                        </strong>
                      </button>
                    ))}
                  </div>
                </details>
              )}
            </section>
            <section className="preview-section">
              <div className="preview-toolbar">
                <div>
                  <h3>{t("preview")}</h3>
                  <span>
                    <span className="status-dot" />
                    {t("actualPdf")}
                  </span>
                </div>
                <div className="segmented view-tabs">
                  {(["tiled", "whole", "trimmed"] as const).map((v) => (
                    <button
                      key={v}
                      className={v === view ? "active" : ""}
                      aria-pressed={v === view}
                      onClick={() => {
                        setView(v);
                        setPageIndex(null);
                      }}
                    >
                      {v === "tiled" ? (
                        <Grid2X2 size={13} />
                      ) : v === "whole" ? (
                        <Maximize2 size={13} />
                      ) : (
                        <Scissors size={13} />
                      )}
                      <span>{t(v)}</span>
                    </button>
                  ))}
                </div>
              </div>
              {ready && plan && view !== "whole" && (
                <AssemblyMap
                  plan={plan}
                  selected={pageIndex}
                  onSelect={setPageIndex}
                  t={t}
                />
              )}
              <div
                className={`preview-canvas ${source ? "has-image" : ""}`}
                aria-busy={!!source && !ready && !errorKey && !pdfError}
              >
                {errorKey ? (
                  <div className="preview-message error" role="alert">
                    <TriangleAlert />
                    <p>{t(errorKey)}</p>
                  </div>
                ) : pdfError ? (
                  <div className="preview-message error" role="alert">
                    <TriangleAlert />
                    <p>{t("error")}</p>
                  </div>
                ) : !source ? (
                  <div className="empty-preview">
                    <div className="empty-pages">
                      <FileImage size={34} />
                      <span>+</span>
                    </div>
                    <h4>{t("noImage")}</h4>
                    <p>{t("noImageDesc")}</p>
                    <button
                      onClick={() => void addSample()}
                      disabled={fileBusy}
                    >
                      {t("sample")}
                      <ArrowRight size={15} />
                    </button>
                  </div>
                ) : !ready ? (
                  <div className="preview-message">
                    <LoaderCircle className="spin" />
                    <p>{t(imageReady ? "generating" : "processing")}</p>
                  </div>
                ) : (
                  <Suspense
                    fallback={
                      <div className="preview-message">
                        <LoaderCircle className="spin" />
                      </div>
                    }
                  >
                    <PdfPreview
                      tiled={output!.tiled}
                      single={output!.single}
                      plan={plan!}
                      view={view}
                      pageIndex={view === "whole" ? null : pageIndex}
                      onPage={(n) => {
                        if (view !== "whole") setPageIndex(n);
                      }}
                      t={t}
                    />
                  </Suspense>
                )}
                {ready && plan && (
                  <>
                    <span className="preview-width">
                      {view === "tiled"
                        ? `${fmt(plan.paperWidth)} × ${fmt(plan.paperHeight)} mm / ${t("page")}`
                        : `${fmt(plan.width)} × ${fmt(plan.height)} mm`}
                    </span>
                    {view !== "whole" && pageIndex !== null && (
                      <div className="page-navigation">
                        <button
                          className="icon-button"
                          aria-label={t("previous")}
                          disabled={pageIndex === 0}
                          onClick={() =>
                            setPageIndex((n) => Math.max(0, (n ?? 0) - 1))
                          }
                        >
                          <ChevronLeft size={15} />
                        </button>
                        <span>
                          {pageIndex + 1} / {plan.pages}
                        </span>
                        <button
                          className="icon-button"
                          aria-label={t("next")}
                          disabled={pageIndex === plan.pages - 1}
                          onClick={() =>
                            setPageIndex((n) =>
                              Math.min(plan.pages - 1, (n ?? 0) + 1),
                            )
                          }
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
                    )}
                    {view !== "whole" &&
                      pageIndex === null &&
                      plan.pages > 16 && (
                        <button
                          className="preview-open-next small-button"
                          onClick={() => setPageIndex(16)}
                        >
                          {t("page")} 17 <ChevronRight size={14} />
                        </button>
                      )}
                  </>
                )}
              </div>
              <div className="preview-caption">
                <span>{t("previewScale")}</span>
                {ready && (
                  <span className="verified">
                    <CheckCircle2 size={13} />
                    {t("verified")}
                  </span>
                )}
              </div>
            </section>
            <section className="assembly-section">
              <div className="section-title">
                <h3>{t("assembly")}</h3>
                <button
                  className="text-button"
                  onClick={() => setModal("guide")}
                  disabled={!plan}
                >
                  <FileText size={14} />
                  {t("guide")}
                  <ArrowRight size={13} />
                </button>
              </div>
              <div className="assembly-grid">
                {(["overlap", "butt"] as const).map((a) => (
                  <button
                    key={a}
                    className={`assembly-card ${assembly === a ? "active" : ""}`}
                    onClick={() => setAssembly(a)}
                    aria-pressed={assembly === a}
                  >
                    <span
                      className={`assembly-diagram ${a}`}
                      aria-hidden="true"
                    >
                      <i />
                      <i />
                      <b />
                    </span>
                    <span>
                      <strong>
                        {t(a === "overlap" ? "overlapMethod" : "buttMethod")}
                      </strong>
                      <small>
                        {t(a === "overlap" ? "overlapDesc" : "buttDesc")}
                      </small>
                    </span>
                    <span className="radio-dot">
                      {assembly === a && <span />}
                    </span>
                  </button>
                ))}
              </div>
              <div className="mark-options">
                {[
                  {
                    name: "marks" as const,
                    value: cropMarks,
                    set: setCropMarks,
                  },
                  {
                    name: "registration" as const,
                    value: registration,
                    set: setRegistration,
                  },
                  {
                    name: "numbers" as const,
                    value: pageNumbers,
                    set: setPageNumbers,
                  },
                ].map((o) => (
                  <label key={o.name}>
                    <input
                      type="checkbox"
                      checked={o.value}
                      onChange={(e) => o.set(e.target.checked)}
                    />
                    {t(o.name)}
                  </label>
                ))}
              </div>
              <PrintMarkLegend t={t} />
              <p className="help position-pdf-help">{t("positionPdfHelp")}</p>
              {pageNumbers && plan && !canPrintPositionHints(plan) && (
                <p className="warning compact">{t("positionMargin")}</p>
              )}
              {settings.margin < 4 && (
                <p className="warning compact">
                  <TriangleAlert size={15} />
                  {t("marksWarning")}
                </p>
              )}
              {settings.overlap === 0 && (
                <p className="warning compact">
                  <TriangleAlert size={15} />
                  {t("zeroOverlap")}
                </p>
              )}
            </section>
          </div>
        </div>
        <section className="export-panel">
          <div className="export-heading">
            <div>
              <span className="eyebrow">FROM SCREEN TO PAPER</span>
              <h2>{t("export")}</h2>
            </div>
            {ready && (
              <span className="verified export-verified">
                <CheckCircle2 size={15} />
                {t("verified")}
              </span>
            )}
          </div>
          <div className="export-body">
            <div className="stats">
              <div>
                <span>{t("size")}</span>
                <strong>
                  {fmt(settings.width)} <small>×</small> {fmt(settings.height)}{" "}
                  <small>mm</small>
                </strong>
              </div>
              <div>
                <span>{t("paperSize")}</span>
                <strong>
                  {plan?.pages ?? "—"}{" "}
                  <small>
                    {t("sheets")} {paper === "custom" ? t("custom") : paper}
                  </small>
                </strong>
                <small>
                  {plan
                    ? `${plan.cols} × ${plan.rows} · ${fmt(plan.paperWidth)} × ${fmt(plan.paperHeight)} mm`
                    : ""}
                </small>
              </div>
              <div>
                <span>{t("scale")}</span>
                <strong>
                  100<small>%</small>
                </strong>
              </div>
              <div>
                <span>{t("ppi")}</span>
                <strong>
                  {ppi ? Math.round(ppi) : "—"} <small>PPI</small>
                </strong>
              </div>
            </div>
            <div className="download-actions">
              <button
                className="primary-button"
                disabled={!ready}
                onClick={() =>
                  ready &&
                  download(
                    output!.tiled.bytes,
                    `PrintScale-${fmt(settings.width)}x${fmt(settings.height)}mm-${paper}-${plan!.pages}pages.pdf`,
                  )
                }
              >
                {source && !ready && !errorKey && !pdfError ? (
                  <LoaderCircle size={17} className="spin" />
                ) : (
                  <ArrowDownToLine size={17} />
                )}
                <span>{t("download")}</span>
                <ArrowRight size={17} />
              </button>
              <button
                className="single-button"
                disabled={!ready}
                onClick={() =>
                  ready &&
                  download(
                    output!.single.bytes,
                    `PrintScale-${fmt(settings.width)}x${fmt(settings.height)}mm-full.pdf`,
                  )
                }
              >
                <FileText size={14} />
                {t("single")}
              </button>
            </div>
          </div>
          {ready && (
            <div className={`resolution-note ${ppi < 150 ? "low" : ""}`}>
              <span>
                {ppi < 150 ? (
                  <TriangleAlert size={14} />
                ) : (
                  <CheckCircle2 size={14} />
                )}{" "}
                {t(ppi < 150 ? "lowPpi" : ppi < 300 ? "mediumPpi" : "highPpi")}
              </span>
              <span>{t("limitHint")} &lt; 0.01 mm</span>
            </div>
          )}
        </section>
        <Suspense fallback={null}>
          <CalibrationPanel
            settings={settings}
            standardPlan={plan}
            image={imageReady ? processed : undefined}
            options={exportOptions}
            language={language}
          />
        </Suspense>
        <aside className="print-notice">
          <span className="notice-icon">
            <Printer size={20} />
          </span>
          <div>
            <strong>{t("printTitle")}</strong>
            <p>{t("printHelp")}</p>
          </div>
          <span className="hundred">
            100<span>%</span>
          </span>
        </aside>
      </main>
      <footer>
        <a href="#" className="brand footer-brand">
          <Grid2X2 size={20} />
          PrintScale
        </a>
        <span>{t("footer")}</span>
        <button className="text-button" onClick={() => setModal("privacy")}>
          {t("privacy")}
          <ArrowRight size={13} />
        </button>
        <small>© {new Date().getFullYear()} PrintScale</small>
      </footer>
      {cropOpen && source && (
        <Suspense fallback={null}>
          <CropEditor
            source={source}
            rotation={rotation}
            crop={crop}
            width={settings.width}
            height={settings.height}
            locked={locked}
            language={language}
            onApply={(next) => {
              changeCrop(next);
              setCropOpen(false);
            }}
            onClose={() => setCropOpen(false)}
          />
        </Suspense>
      )}
      <dialog
        ref={modalRef}
        onCancel={(e) => {
          e.preventDefault();
          setModal(null);
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) setModal(null);
        }}
        aria-labelledby="modal-title"
      >
        <div className="modal-heading">
          <h2 id="modal-title">
            {t(modal === "privacy" ? "privacy" : "guide")}
          </h2>
          <button
            className="icon-button"
            aria-label={t("close")}
            onClick={() => setModal(null)}
          >
            <X size={20} />
          </button>
        </div>
        {modal === "privacy" ? (
          <p>{t("privacyText")}</p>
        ) : (
          plan && (
            <>
              <div className="guide-summary">
                <strong>
                  {fmt(plan.width)} × {fmt(plan.height)} mm
                </strong>
                <span>
                  {plan.cols} × {plan.rows} · {plan.pages} {t("sheets")} ·{" "}
                  {t(assembly === "overlap" ? "overlapMethod" : "buttMethod")}
                </span>
              </div>
              <AssemblyMap
                plan={plan}
                selected={pageIndex}
                onSelect={setPageIndex}
                t={t}
              />
              <PrintMarkLegend t={t} />
              <ol className="guide-steps">
                <li>{t("printHelp")}</li>
                <li>{t("guide1")}</li>
                <li>
                  {t(assembly === "overlap" ? "guideOverlap" : "guideButt")}
                </li>
                <li>{t("guide3")}</li>
              </ol>
              <p className="help">{t("guideKeep")}</p>
              <button
                className="primary-button"
                onClick={() =>
                  download(
                    new TextEncoder().encode(guideText(plan)),
                    "PrintScale-assembly.txt",
                    "text/plain;charset=utf-8",
                  )
                }
              >
                <ArrowDownToLine size={16} />
                {t("downloadGuide")}
              </button>
            </>
          )
        )}
      </dialog>
    </>
  );
}
