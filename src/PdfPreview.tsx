import { useEffect, useState } from "react";
import { LoaderCircle, TriangleAlert } from "lucide-react";
import type { PdfResult } from "./pdf";
import type { Plan } from "./geometry";
import { PT } from "./geometry";
import type { CopyKey } from "./i18n";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
export type View = "tiled" | "whole" | "trimmed";
interface Props {
  tiled: PdfResult;
  single: PdfResult;
  plan: Plan;
  view: View;
  pageIndex: number | null;
  onPage: (n: number) => void;
  t: (key: CopyKey) => string;
}
export default function PdfPreview({
  tiled,
  single,
  plan,
  view,
  pageIndex,
  onPage,
  t,
}: Props) {
  const [images, setImages] = useState<{ url: string; index: number }[]>([]),
    [error, setError] = useState(false),
    [busy, setBusy] = useState(true);
  useEffect(() => {
    let cancelled = false;
    let document: import("pdfjs-dist").PDFDocumentProxy | undefined;
    let loading: import("pdfjs-dist").PDFDocumentLoadingTask | undefined;
    let activeRender: import("pdfjs-dist").RenderTask | undefined;
    setBusy(true);
    setError(false);
    setImages([]);
    (async () => {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
      if (cancelled) return;
      loading = pdfjs.getDocument({
        data: (view === "whole" ? single.bytes : tiled.bytes).slice(),
      });
      document = await loading.promise;
      if (cancelled) {
        await loading.destroy();
        return;
      }
      const indices =
        view === "whole"
          ? [0]
          : pageIndex !== null
            ? [pageIndex]
            : Array.from({ length: Math.min(plan.pages, 16) }, (_, i) => i);
      const results: { url: string; index: number }[] = [];
      for (const index of indices) {
        if (cancelled) break;
        const page = await document.getPage(index + 1),
          base = page.getViewport({ scale: 1 }),
          scale =
            (view === "whole" || pageIndex !== null ? 1000 : 440) / base.width;
        const viewport = page.getViewport({ scale }),
          canvas = window.document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        activeRender = page.render({ canvas, viewport });
        await activeRender.promise;
        let result = canvas;
        if (view === "trimmed") {
          const tile = plan.tiles[index],
            trim = tile.trim,
            s = PT * scale;
          const crop = window.document.createElement("canvas");
          crop.width = Math.max(1, Math.round(trim.width * s));
          crop.height = Math.max(1, Math.round(trim.height * s));
          crop
            .getContext("2d")!
            .drawImage(
              canvas,
              (plan.margin + trim.x - tile.source.x) * s,
              (plan.margin + trim.y - tile.source.y) * s,
              trim.width * s,
              trim.height * s,
              0,
              0,
              crop.width,
              crop.height,
            );
          result = crop;
        }
        results.push({ url: result.toDataURL("image/png"), index });
        page.cleanup();
        canvas.width = 0;
        canvas.height = 0;
      }
      if (!cancelled) {
        setImages(results);
        setBusy(false);
      }
      await loading.destroy();
      document = undefined;
    })().catch(() => {
      if (!cancelled) {
        setError(true);
        setBusy(false);
      }
    });
    return () => {
      cancelled = true;
      activeRender?.cancel();
      void loading?.destroy();
    };
  }, [tiled, single, plan, view, pageIndex]);
  if (error)
    return (
      <div className="preview-message" role="alert">
        <TriangleAlert />
        <p>{t("error")}</p>
      </div>
    );
  if (busy)
    return (
      <div className="preview-message">
        <LoaderCircle className="spin" />
        <p>{t("generating")}</p>
      </div>
    );
  const joined = view === "trimmed" && pageIndex === null;
  return (
    <div
      className={`pdf-images ${joined ? "joined" : ""} ${view === "whole" ? "whole" : ""} ${pageIndex !== null ? "detail" : ""}`}
      style={
        joined
          ? {
              gridTemplateColumns: plan.tiles
                .slice(0, plan.cols)
                .map((x) => `${x.trim.width}fr`)
                .join(" "),
              maxWidth: 500,
            }
          : view === "tiled" && pageIndex === null
            ? { gridTemplateColumns: `repeat(${plan.cols}, minmax(0, 1fr))` }
            : undefined
      }
    >
      {images.map(({ url, index }) => (
        <button
          className="pdf-sheet"
          key={index}
          onClick={() => onPage(index)}
          aria-label={`${t("page")} ${index + 1}`}
        >
          <img src={url} alt={`${t("page")} ${index + 1}`} draggable={false} />
          {view === "tiled" && (
            <span className="sheet-label">
              {String(index + 1).padStart(2, "0")}
            </span>
          )}
        </button>
      ))}
      {plan.pages > 16 && pageIndex === null && view !== "whole" && (
        <p className="preview-limit">
          1–16 / {plan.pages} · {t("next")}
        </p>
      )}
    </div>
  );
}
