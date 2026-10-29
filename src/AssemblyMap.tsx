import { useEffect, useId, useRef } from "react";
import {
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  Grid2X2,
} from "lucide-react";
import { tilePosition } from "./positions";
import type { Direction } from "./positions";
import type { Plan } from "./geometry";
import type { CopyKey } from "./i18n";
import RoundedSelect from "./RoundedSelect";
interface Props {
  plan: Plan;
  selected: number | null;
  onSelect: (index: number | null) => void;
  t: (key: CopyKey) => string;
}
export default function AssemblyMap({
  plan,
  selected: requested,
  onSelect,
  t,
}: Props) {
  const selected =
    requested !== null &&
    Number.isInteger(requested) &&
    requested >= 0 &&
    requested < plan.pages
      ? requested
      : null;
  const id = useId(),
    buttons = useRef<(HTMLButtonElement | null)[]>([]),
    scroll = useRef<HTMLDivElement>(null);
  const current = selected === null ? null : tilePosition(plan, selected);
  const label = (index: number) => {
    const p = tilePosition(plan, index);
    return `${t("page")} ${index + 1} · ${t("positionRow")} ${p.row + 1}/${plan.rows} · ${t("positionCol")} ${p.col + 1}/${plan.cols}`;
  };
  useEffect(() => {
    if (selected === null) return;
    const cell = buttons.current[selected],
      box = scroll.current;
    if (!cell || !box) return;
    const reveal = () => {
      const left = cell.offsetLeft,
        top = cell.offsetTop;
      if (left < box.scrollLeft) box.scrollLeft = left;
      else if (left + cell.offsetWidth > box.scrollLeft + box.clientWidth)
        box.scrollLeft = left + cell.offsetWidth - box.clientWidth;
      if (top < box.scrollTop) box.scrollTop = top;
      else if (top + cell.offsetHeight > box.scrollTop + box.clientHeight)
        box.scrollTop = top + cell.offsetHeight - box.clientHeight;
    };
    reveal();
    const observer = new ResizeObserver(reveal);
    observer.observe(box);
    return () => observer.disconnect();
  }, [selected]);
  return (
    <section className="assembly-locator" aria-labelledby={id}>
      <div className="locator-heading">
        <h4 id={id}>
          <Grid2X2 size={15} />
          {t("positionMap")}
        </h4>
        <span>
          {plan.cols} {t("positionCols")} × {plan.rows} {t("positionRows")} ·{" "}
          {plan.pages} {t("sheets")}
        </span>
      </div>
      <div className="locator-controls">
        <span className="locator-up">
          <ArrowUp size={14} />
          {t("positionTop")}
        </span>
        <RoundedSelect
          id={id + "-select"}
          label={t("positionJump")}
          value={selected === null ? "" : String(selected)}
          onChange={(value) => onSelect(value === "" ? null : Number(value))}
          options={[{ value: "", label: t("positionOverview") }, ...plan.tiles.map((tile) => ({ value: String(tile.index), label: label(tile.index), searchText: String(tile.index + 1) }))]}
        />
      </div>
      <div ref={scroll} className="locator-scroll">
        <div
          className="locator-grid"
          role="group"
          aria-label={t("positionMap")}
          style={{
            gridTemplateColumns: `repeat(${plan.cols},minmax(30px,1fr))`,
          }}
        >
          {plan.tiles.map((tile) => (
            <button
              ref={(el) => {
                buttons.current[tile.index] = el;
              }}
              key={tile.index}
              className={selected === tile.index ? "current" : ""}
              onClick={() => onSelect(tile.index)}
              aria-label={label(tile.index)}
              aria-pressed={selected === tile.index}
              title={label(tile.index)}
              tabIndex={tile.index === (selected ?? 0) ? 0 : -1}
              onKeyDown={(e) => {
                const direction: Direction | undefined = (
                  {
                    ArrowUp: "up",
                    ArrowLeft: "left",
                    ArrowRight: "right",
                    ArrowDown: "down",
                  } as Record<string, Direction>
                )[e.key];
                if (direction) {
                  e.preventDefault();
                  const next = tilePosition(plan, tile.index).neighbors[
                    direction
                  ];
                  if (next !== null) {
                    onSelect(next);
                    buttons.current[next]?.focus({ preventScroll: true });
                  }
                }
              }}
            >
              <span>{tile.index + 1}</span>
              {selected === tile.index && <i aria-hidden="true" />}
            </button>
          ))}
        </div>
      </div>
      {current ? (
        <>
          <p className="locator-current" role="status">
            <strong>
              {t("positionHere")}: {t("page")} {current.index + 1}
            </strong>
            <span>
              {t("positionRow")} {current.row + 1} / {plan.rows} ·{" "}
              {t("positionCol")} {current.col + 1} / {plan.cols}
            </span>
          </p>
          <div
            className="locator-neighbors"
            aria-label={t("positionNeighbors")}
          >
            {[
              { direction: "left" as const, icon: ArrowLeft },
              { direction: "up" as const, icon: ArrowUp },
              { direction: "right" as const, icon: ArrowRight },
              { direction: "down" as const, icon: ArrowDown },
            ].map(({ direction, icon: Icon }) => {
              const n = current.neighbors[direction];
              return (
                <button
                  key={direction}
                  disabled={n === null}
                  onClick={() => {
                    if (n !== null) onSelect(n);
                  }}
                  aria-label={`${t(("position" + direction[0].toUpperCase() + direction.slice(1)) as CopyKey)}: ${n === null ? t("positionEdge") : `${t("page")} ${n + 1}`}`}
                >
                  <Icon size={13} />
                  <span>
                    {t(
                      ("position" +
                        direction[0].toUpperCase() +
                        direction.slice(1)) as CopyKey,
                    )}
                  </span>
                  <strong>{n === null ? "—" : n + 1}</strong>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <p className="locator-help">{t("positionHelp")}</p>
      )}
    </section>
  );
}
