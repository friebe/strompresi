/**
 * Strompresi – OCR für Zählerstand-Erkennung (Tesseract.js)
 */

/**
 * Extrahiert die wahrscheinlichste Zählerstand-Zahl aus OCR-Text
 * Zählerstände: 4-8 Ziffern, optional Komma/Punkt für Dezimalstellen
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
 * Konvertiert Canvas zu Graustufen und erhöht den Kontrast.
 * Verbessert die Erkennungsgenauigkeit für Ziffern deutlich.
 */
function preprocessCanvas(src: HTMLCanvasElement): HTMLCanvasElement {
  const dst = document.createElement('canvas');
  dst.width = src.width;
  dst.height = src.height;
  const ctx = dst.getContext('2d')!;
  ctx.drawImage(src, 0, 0);
  const img = ctx.getImageData(0, 0, dst.width, dst.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    const v = Math.max(0, Math.min(255, (gray - 128) * 1.6 + 128));
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  return dst;
}

/**
 * Führt OCR auf einem Bild (Canvas/Blob) aus.
 * Wirft einen beschreibenden Fehler wenn offline.
 */
export async function recognizeMeterReading(
  imageSource: HTMLCanvasElement | Blob
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
    await worker.setParameters({ tessedit_char_whitelist: '0123456789.,' });
    const src = imageSource instanceof HTMLCanvasElement ? preprocessCanvas(imageSource) : imageSource;
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
