import {
  rgb,
  pushGraphicsState,
  popGraphicsState,
  rectangle,
  setFillingColor,
  fill,
} from "pdf-lib";
import type { PDFPage, PDFFont } from "pdf-lib";
import { PT } from "./geometry";
import type { Plan } from "./geometry";
import { canPrintPositionHints, tilePosition } from "./positions";
// Draw outside the calibrated graphics state: labels locate sheets, not image coordinates.
// The corner boxes sit beyond crop/registration marks, without using any poster area.
export function drawPositionHints(
  page: PDFPage,
  font: PDFFont,
  plan: Plan,
  index: number,
) {
  if (!canPrintPositionHints(plan)) return;
  const { row, col } = tilePosition(plan, index),
    m = plan.margin,
    pw = plan.paperWidth,
    ph = plan.paperHeight;
  const ink = rgb(0.13, 0.24, 0.18),
    muted = rgb(0.5, 0.58, 0.46);
  const line = (x: number, y: number, x2: number, y2: number) =>
    page.drawLine({
      start: { x: x * PT, y: y * PT },
      end: { x: x2 * PT, y: y2 * PT },
      thickness: 0.6,
      color: muted,
    });
  const max = m - 7,
    cell = max / Math.max(plan.cols, plan.rows),
    width = cell * plan.cols,
    height = cell * plan.rows;
  const x = pw - m + 2 + (max - width) / 2,
    y = ph - m + 2 + (max - height) / 2;
  const bx = x + col * cell,
    by = y + (plan.rows - row - 1) * cell;
  page.pushOperators(
    pushGraphicsState(),
    setFillingColor(ink),
    rectangle(bx * PT, by * PT, cell * PT, cell * PT),
    fill(),
    popGraphicsState(),
  );
  for (let c = 0; c <= plan.cols; c++)
    line(x + c * cell, y, x + c * cell, y + height);
  for (let r = 0; r <= plan.rows; r++)
    line(x, y + r * cell, x + width, y + r * cell);
  const ax = m / 2,
    tip = ph - 5.5,
    base = ph - m + 4;
  line(ax, base, ax, tip);
  line(ax, tip, ax - 1.2, tip - 1.8);
  line(ax, tip, ax + 1.2, tip - 1.8);
  const top = "TOP",
    topSize = 7;
  page.drawText(top, {
    x: ax * PT - font.widthOfTextAtSize(top, topSize) / 2,
    y: (ph - m + 1) * PT,
    size: topSize,
    font,
    color: ink,
  });
  const text = `PAGE ${index + 1}/${plan.pages}  |  R${row + 1}/${plan.rows} C${col + 1}/${plan.cols}`;
  const size = Math.min(
    11,
    ((pw - 2 * m - 8) * PT) / font.widthOfTextAtSize(text, 1),
  );
  page.drawText(text, {
    x: (m + 4) * PT,
    y: (m - 3.5) * PT,
    size,
    font,
    color: ink,
  });
}
