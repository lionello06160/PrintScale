export interface SourceImage {
  name: string;
  image: HTMLImageElement;
  url: string;
  width: number;
  height: number;
}
export interface ProcessedImage {
  bytes: Uint8Array;
  url: string;
  width: number;
  height: number;
}
export interface Crop {
  x: number;
  y: number;
  width: number;
  height: number;
}
export const FULL_CROP: Crop = { x: 0, y: 0, width: 100, height: 100 };
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("fileError"));
    image.src = url;
  });
}
export async function readImage(file: File): Promise<SourceImage> {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
    throw new Error("fileError");
  if (file.size > 40 * 1024 * 1024) throw new Error("fileLarge");
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!(
    (header[0] === 137 &&
      header[1] === 80 &&
      header[2] === 78 &&
      header[3] === 71) ||
    (header[0] === 255 && header[1] === 216) ||
    (new TextDecoder().decode(header.slice(0, 4)) === "RIFF" &&
      new TextDecoder().decode(header.slice(8, 12)) === "WEBP")
  ))
    throw new Error("fileError");
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    if (
      image.naturalWidth * image.naturalHeight > 40e6 ||
      Math.max(image.naturalWidth, image.naturalHeight) > 16000
    )
      throw new Error("fileLarge");
    return {
      name: file.name,
      image,
      url,
      width: image.naturalWidth,
      height: image.naturalHeight,
    };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}
function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("fileLarge"))),
      "image/png",
    ),
  );
}
export async function processImage(
  source: SourceImage,
  rotation: number,
  crop: Crop,
): Promise<ProcessedImage> {
  if (
    ![crop.x, crop.y, crop.width, crop.height].every(Number.isFinite) ||
    crop.x < 0 ||
    crop.y < 0 ||
    crop.width < 1 ||
    crop.height < 1 ||
    crop.x + crop.width > 100.000001 ||
    crop.y + crop.height > 100.000001
  )
    throw new Error("cropError");
  const swap = rotation % 180 !== 0,
    w = swap ? source.height : source.width,
    h = swap ? source.width : source.height;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round((w * crop.width) / 100));
  canvas.height = Math.max(1, Math.round((h * crop.height) / 100));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("fileLarge");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.translate((-w * crop.x) / 100, (-h * crop.y) / 100);
  ctx.translate(w / 2, h / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.drawImage(source.image, -source.width / 2, -source.height / 2);
  const blob = await canvasBlob(canvas),
    bytes = new Uint8Array(await blob.arrayBuffer());
  canvas.width = 0;
  canvas.height = 0;
  return {
    bytes,
    url: URL.createObjectURL(blob),
    width: Math.max(1, Math.round((w * crop.width) / 100)),
    height: Math.max(1, Math.round((h * crop.height) / 100)),
  };
}
export async function sampleImage(name: string): Promise<SourceImage> {
  const c = document.createElement("canvas");
  c.width = 3500;
  c.height = 4667;
  const g = c.getContext("2d")!;
  g.scale(2.5, 4667 / 1867);
  g.fillStyle = "#eae7d8";
  g.fillRect(0, 0, 1400, 1867);
  g.fillStyle = "#254e41";
  g.font = "30px Georgia";
  g.fillText("A COLLECTION OF EVERYDAY WONDERS", 110, 145);
  g.font = "170px Georgia";
  g.fillText("Field", 100, 360);
  g.fillText("Notes.", 100, 535);
  g.strokeStyle = "#bd6c42";
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(110, 615);
  g.lineTo(1290, 615);
  g.stroke();
  // Original geometric botanical artwork, drawn locally.
  g.save();
  g.translate(750, 1170);
  g.rotate(-0.2);
  g.strokeStyle = "#365e46";
  g.lineWidth = 10;
  g.beginPath();
  g.moveTo(-140, 410);
  g.bezierCurveTo(20, 170, -50, -200, 150, -390);
  g.stroke();
  for (let i = 0; i < 9; i++) {
    const y = 300 - i * 78,
      x = -100 + i * 22,
      side = i % 2 ? 1 : -1;
    g.save();
    g.translate(x, y);
    g.rotate(side * 0.6);
    g.fillStyle = i % 3 === 0 ? "#8b9b65" : "#446447";
    g.beginPath();
    g.ellipse(side * 100, -65, 145, 48, side * 0.35, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
  g.restore();
  g.fillStyle = "#c88157";
  g.beginPath();
  g.arc(340, 1060, 135, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#eae7d8";
  g.beginPath();
  g.arc(365, 1028, 118, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#254e41";
  g.font = "28px Georgia";
  g.fillText("SLOW DOWN. LOOK CLOSER.", 110, 1690);
  g.font = "23px Georgia";
  g.fillText("BOTANICAL STUDIES     /     NO. 028", 110, 1745);
  g.textAlign = "right";
  g.fillText("PRINTSCALE STUDIO", 1290, 1745);
  const url = URL.createObjectURL(await canvasBlob(c)),
    image = await loadImage(url);
  return { name, image, url, width: c.width, height: c.height };
}
