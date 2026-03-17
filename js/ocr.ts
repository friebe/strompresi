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
 * Führt OCR auf einem Bild (Canvas/Blob) aus
 */
export async function recognizeMeterReading(
  imageSource: HTMLCanvasElement | Blob
): Promise<string | null> {
  const Tesseract: any = await import(
    // @ts-ignore
    'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.esm.min.js'
  );
  const worker = await Tesseract.createWorker('eng', 1, { logger: () => {} });
  try {
    const {
      data: { text },
    } = await worker.recognize(imageSource);
    await worker.terminate();
    return extractMeterReading(text);
  } catch (e) {
    await worker.terminate();
    throw e;
  }
}
