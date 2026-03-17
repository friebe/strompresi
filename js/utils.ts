/**
 * Strompresi – Hilfsfunktionen (rein, ohne DOM)
 */

/**
 * Formatiert einen Wert für type="number" Inputs (Punkt als Dezimaltrennzeichen)
 */
export function toNumInputVal(val: unknown): string {
  if (val == null || val === '') return '';
  const str = String(val).trim().replace(',', '.');
  return isNaN(parseFloat(str)) ? '' : str;
}

/**
 * Parst einen String zu einer Zahl – deutsches Format (4.523,5) und englisch (4523.5)
 */
export function parseNumFromString(str: string | null | undefined): number {
  if (!str || typeof str !== 'string') return 0;
  let val = str.trim().replace(/\s/g, '');
  if (val.includes(',')) {
    val = val.replace(/\./g, '').replace(',', '.');
  } else if (val.includes('.')) {
    const parts = val.split('.');
    if (parts.length > 2) {
      val = parts.slice(0, -1).join('') + '.' + (parts[parts.length - 1] || '0');
    }
  }
  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
}

export function formatEuro(val: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

export function formatNum(val: number, decimals = 1): string {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val);
}

/**
 * Rundet auf glatte Summe (5er/10er)
 */
export function roundGlatt(val: number): number {
  const abs = Math.abs(val);
  if (abs < 0.01) return 0;
  if (abs < 10) return Math.round(abs) || 5;
  if (abs < 100) return Math.round(abs / 5) * 5;
  return Math.round(abs / 10) * 10;
}
