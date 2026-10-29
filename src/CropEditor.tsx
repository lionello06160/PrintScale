import { useEffect, useRef, useState } from "react";
import type {
  PointerEvent as ReactPointerEvent,
  KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Crop as CropIcon, X, Check, RotateCcw, Move } from "lucide-react";
import type { SourceImage, Crop } from "./image";
import { FULL_CROP } from "./image";
import { dragCrop, drawCrop, normalizeCrop, validCrop } from "./crop-geometry";
import type { CropHandle } from "./crop-geometry";
import Numeric from "./Numeric";
import { fmt } from "./geometry";
import { translate } from "./i18n";
import type { Language, CopyKey } from "./i18n";
interface Props {
  source: SourceImage;
  rotation: number;
  crop: Crop;
  width: number;
  height: number;
  locked: boolean;
  language: Language;
  onApply: (crop: Crop) => void;
  onClose: () => void;
}
interface Gesture {
  id: number;
  mode: CropHandle | "draw";
  start: Crop;
  x: number;
  y: number;
}
const handles: CropHandle[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
export default function CropEditor({
  source,
  rotation,
  crop,
  width,
  height,
  locked,
  language,
  onApply,
  onClose,
}: Props) {
  const t = translate(language),
    dialog = useRef<HTMLDialogElement>(null),
    surface = useRef<HTMLDivElement>(null),
    gesture = useRef<Gesture | null>(null),
    [draft, setDraft] = useState(() => normalizeCrop(crop)),
    [dragging, setDragging] = useState(false);
  const safe = normalizeCrop(draft),
    valid = validCrop(draft),
    swap = rotation % 180 !== 0,
    iw = swap ? source.height : source.width,
    ih = swap ? source.width : source.height;
  const px = Math.max(1, Math.round((iw * safe.width) / 100)),
    py = Math.max(1, Math.round((ih * safe.height) / 100)),
    plannedHeight = locked
      ? width / ((iw * safe.width) / (ih * safe.height))
      : height;
  useEffect(() => {
    const d = dialog.current,
      opener = document.activeElement as HTMLElement | null;
    if (d && !d.open) d.showModal();
    return () => {
      d?.close();
      opener?.focus({ preventScroll: true });
    };
  }, []);
  function position(e: ReactPointerEvent) {
    const r = surface.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    };
  }
  function start(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 0 || !e.isPrimary || gesture.current) return;
    const target =
      e.target instanceof Element
        ? e.target.closest<HTMLElement>("[data-crop-action]")
        : null;
    const mode = (target?.dataset.cropAction ?? "draw") as CropHandle | "draw";
    const p = position(e);
    gesture.current = { id: e.pointerId, mode, start: safe, x: p.x, y: p.y };
    e.preventDefault();
    target?.focus({ preventScroll: true });
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    if (mode === "draw") setDraft(drawCrop(p.x, p.y, p.x, p.y));
  }
  function move(e: ReactPointerEvent<HTMLDivElement>) {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    const p = position(e);
    setDraft(
      g.mode === "draw"
        ? drawCrop(g.x, g.y, p.x, p.y)
        : dragCrop(g.start, g.mode, p.x - g.x, p.y - g.y),
    );
  }
  function end(e: ReactPointerEvent<HTMLDivElement>) {
    if (gesture.current?.id !== e.pointerId) return;
    move(e);
    gesture.current = null;
    setDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
  }
  function cancel(e: ReactPointerEvent<HTMLDivElement>) {
    if (gesture.current?.id !== e.pointerId) return;
    setDraft(gesture.current.start);
    gesture.current = null;
    setDragging(false);
  }
  function keyboard(e: ReactKeyboardEvent, handle: CropHandle) {
    const d: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const vector = d[e.key];
    if (!vector) return;
    e.preventDefault();
    const step = e.shiftKey ? 10 : 1;
    setDraft(
      dragCrop(
        safe,
        handle,
        ((vector[0] * 100) / iw) * step,
        ((vector[1] * 100) / ih) * step,
      ),
    );
  }
  return (
    <dialog
      ref={dialog}
      className="graphic-crop-dialog"
      aria-labelledby="graphic-crop-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="graphic-crop-content">
        <header className="graphic-crop-heading">
          <div>
            <span className="graphic-crop-icon">
              <CropIcon size={20} />
            </span>
            <div>
              <h2 id="graphic-crop-title">{t("edit")}</h2>
              <p title={source.name}>{source.name}</p>
            </div>
          </div>
          <button
            className="icon-button"
            aria-label={t("close")}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        <div className="graphic-crop-intro">
          <p>{t("cropGraphicHelp")}</p>
          <button
            className="small-button"
            onClick={() => setDraft({ ...FULL_CROP })}
          >
            <RotateCcw size={14} />
            {t("resetCrop")}
          </button>
        </div>
        <div className={`crop-workarea ${dragging ? "is-dragging" : ""}`}>
          <div
            ref={surface}
            className="crop-stage"
            style={{
              aspectRatio: `${iw}/${ih}`,
              width: `min(100%, ${(iw / ih) * 52}vh)`,
            }}
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={cancel}
            onLostPointerCapture={() => {
              gesture.current = null;
              setDragging(false);
            }}
          >
            <div className="crop-image-layer">
              <img
                src={source.url}
                alt={source.name}
                draggable={false}
                style={{
                  width: `${(source.width / iw) * 100}%`,
                  height: `${(source.height / ih) * 100}%`,
                  transform: `translate(-50%,-50%) rotate(${rotation}deg)`,
                }}
              />
              <div
                className="crop-mask"
                style={{ left: 0, top: 0, width: "100%", height: `${safe.y}%` }}
              />
              <div
                className="crop-mask"
                style={{
                  left: 0,
                  top: `${safe.y + safe.height}%`,
                  width: "100%",
                  bottom: 0,
                }}
              />
              <div
                className="crop-mask"
                style={{
                  left: 0,
                  top: `${safe.y}%`,
                  width: `${safe.x}%`,
                  height: `${safe.height}%`,
                }}
              />
              <div
                className="crop-mask"
                style={{
                  left: `${safe.x + safe.width}%`,
                  top: `${safe.y}%`,
                  right: 0,
                  height: `${safe.height}%`,
                }}
              />
            </div>
            <div
              className="crop-selection"
              style={{
                left: `${safe.x}%`,
                top: `${safe.y}%`,
                width: `${safe.width}%`,
                height: `${safe.height}%`,
              }}
            >
              <button
                className="crop-move"
                data-crop-action="move"
                aria-label={t("cropMove")}
                onKeyDown={(e) => keyboard(e, "move")}
              >
                <span className="crop-thirds" aria-hidden="true" />
                <Move size={20} aria-hidden="true" />
              </button>
              {handles.map((handle) => (
                <button
                  key={handle}
                  type="button"
                  className={`crop-handle handle-${handle}`}
                  data-crop-action={handle}
                  aria-label={t(
                    ("cropHandle" + handle.toUpperCase()) as CopyKey,
                  )}
                  onKeyDown={(e) => keyboard(e, handle)}
                >
                  <span />
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="graphic-crop-summary" aria-live="polite">
          <span>
            {t("cropPixels")}
            <strong>
              {px} × {py} px
            </strong>
          </span>
          <span>
            {t("size")}
            <strong>
              {fmt(width)} × {fmt(plannedHeight)} mm
            </strong>
          </span>
        </div>
        <p className="graphic-crop-size-help">
          {t(locked ? "cropOutputLocked" : "cropOutputUnlocked")}
        </p>
        <details className="graphic-crop-advanced">
          <summary>{t("cropFineTune")}</summary>
          <p className="help">{t("cropHelp")}</p>
          <div className="graphic-crop-fields">
            {(["x", "y", "width", "height"] as const).map((k) => (
              <Numeric
                key={k}
                label={t(k === "x" ? "left" : k === "y" ? "top" : k)}
                value={draft[k]}
                suffix="%"
                min={k === "x" || k === "y" ? 0 : 1}
                max={100}
                onChange={(n) => setDraft((d) => ({ ...d, [k]: n }))}
              />
            ))}
          </div>
          {!valid && (
            <p className="warning" role="alert">
              {t("cropError")}
            </p>
          )}
        </details>
        <p className="graphic-crop-keyboard">{t("cropKeyboard")}</p>
        <footer className="graphic-crop-actions">
          <button className="small-button" onClick={onClose}>
            {t("cropCancel")}
          </button>
          <button
            className="primary-button"
            disabled={!valid}
            onClick={() => onApply(draft)}
          >
            <Check size={16} />
            {t("cropApply")}
          </button>
        </footer>
      </div>
    </dialog>
  );
}
