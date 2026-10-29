import type { Plan } from "./geometry";
export type Direction = "up" | "left" | "right" | "down";
export function tilePosition(
  plan: Pick<Plan, "rows" | "cols" | "pages">,
  index: number,
) {
  if (!Number.isInteger(index) || index < 0 || index >= plan.pages)
    throw new Error("Invalid page position");
  const row = Math.floor(index / plan.cols),
    col = index % plan.cols;
  return {
    index,
    row,
    col,
    neighbors: {
      up: row > 0 ? index - plan.cols : null,
      left: col > 0 ? index - 1 : null,
      right: col < plan.cols - 1 ? index + 1 : null,
      down: row < plan.rows - 1 ? index + plan.cols : null,
    },
  };
}
export function canPrintPositionHints(
  plan: Pick<Plan, "paperWidth" | "margin">,
) {
  return plan.margin >= 12 && plan.paperWidth - 2 * plan.margin >= 40;
}
