/**
 * Strompresi – OCR für Zählerstand-Erkennung (Tesseract.js)
 */

export interface CropRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Extrahiert die wahrscheinlichste Zählerstand-Zahl aus OCR-Text.
 * Zählerstände: 4-8 Ziffern, optional Komma/Punkt für Dezimalstellen.
 */
export function extractMeterReading(text: string | null | undefined): string | null {
  if (!text || typeof text !== 'string') return null;
  const cleaned = text.replace(/\s/g, '').replace(/[^\d.,]/g, ' ');
  const matches = cleaned.match(/\d{3,}[.,]?\d*/g);
  if (!matches || matches.length === 0) return null;
  const parsed = matches
    .map((m) => {
      const num = parseFloat(m.replace(',', '.'));
      return isNaN(num) ? 0 : num;
    })
    .filter((n) => n >= 100 && n < 99999999);
  return parsed.length > 0 ? String(Math.max(...parsed)) : null;
}

/**
 * Schneidet einen Bereich aus dem Canvas aus und gibt einen neuen Canvas zurück.
 */
function cropCanvas(src: HTMLCanvasElement, rect: CropRect): HTMLCanvasElement {
  const dst = document.createElement('canvas');
  dst.width = rect.width;
  dst.height = rect.height;
  const ctx = dst.getContext('2d')!;
  ctx.drawImage(src, rect.left, rect.top, rect.width, rect.height, 0, 0, rect.width, rect.height);
  return dst;
}

/**
 * Bereitet das Bild für OCR vor:
 * – 2× Hochskalierung (schärfere Kanten für Tesseract)
 * – Graustufen-Konvertierung
 * – Binärisierung mit Mittelwert als Schwellwert
 * – Auto-Invertierung: Zähler mit hellen Ziffern auf dunklem Hintergrund
 *   werden invertiert, damit Tesseract dunkle Zeichen auf weißem Grund liest.
 */
function preprocessCanvas(src: HTMLCanvasElement): HTMLCanvasElement {
  const scale = 2;
  const dst = document.createElement('canvas');
  dst.width = src.width * scale;
  dst.height = src.height * scale;
  const ctx = dst.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, 0, 0, dst.width, dst.height);

  const img = ctx.getImageData(0, 0, dst.width, dst.height);
  const d = img.data;

  // Grayscale
  for (let i = 0; i < d.length; i += 4) {
    const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    d[i] = d[i + 1] = d[i + 2] = gray;
  }

  // Calculate mean brightness before binarization
  let sum = 0;
  for (let i = 0; i < d.length; i += 4) sum += d[i];
  const mean = sum / (d.length / 4);

  // Binarize using mean as threshold
  for (let i = 0; i < d.length; i += 4) {
    d[i] = d[i + 1] = d[i + 2] = d[i] >= mean ? 255 : 0;
  }

  // If image was mostly dark (e.g. roller display: light digits on black),
  // invert so digits become dark on white — Tesseract works better this way.
  if (mean < 100) {
    for (let i = 0; i < d.length; i += 4) {
      d[i] = d[i + 1] = d[i + 2] = 255 - d[i];
    }
  }

  ctx.putImageData(img, 0, 0);
  return dst;
}

/**
 * Führt OCR auf einem Bild (Canvas/Blob) aus.
 * Wirft einen beschreibenden Fehler wenn offline.
 * cropRect: optionaler Ausschnitt aus dem Canvas der erkannt werden soll.
 */
export async function recognizeMeterReading(
  imageSource: HTMLCanvasElement | Blob,
  cropRect?: CropRect
): Promise<string | null> {
  if (!navigator.onLine) {
    throw new Error('OCR benötigt eine Internetverbindung (Tesseract.js wird nachgeladen).');
  }
  const Tesseract: any = await import(
    // @ts-ignore
    'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.esm.min.js'
  );
  const worker = await Tesseract.createWorker('eng', 1, { logger: () => {} });
  try {
    // PSM 7 = single text line — ideal for one row of meter digits
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789.,',
      tessedit_pageseg_mode: '7',
    });

    let src: HTMLCanvasElement | Blob;
    if (imageSource instanceof HTMLCanvasElement) {
      const cropped = cropRect ? cropCanvas(imageSource, cropRect) : imageSource;
      src = preprocessCanvas(cropped);
    } else {
      src = imageSource;
    }

    const {
      data: { text },
    } = await worker.recognize(src);
    await worker.terminate();
    return extractMeterReading(text);
  } catch (e) {
    await worker.terminate();
    throw e;
  }
}
