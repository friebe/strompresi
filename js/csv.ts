/**
 * Strompresi – CSV-Export für Dokumentation (Excel, Numbers, Sheets)
 */

import type { HistoryEntry, StoredData } from './types.js';

const CSV_SEP = ';'; // Deutsche Locale: Semikolon statt Komma

function escapeCsv(val: string): string {
  if (!/["\n\r;]/.test(val)) return val;
  return `"${val.replace(/"/g, '""')}"`;
}

function formatDate(month: string, recordedDay?: number): string {
  const [y, m] = month.split('-').map(Number);
  const day = recordedDay ?? 1;
  const d = String(day).padStart(2, '0');
  const mo = String(m).padStart(2, '0');
  return `${d}.${mo}.${y}`;
}

function formatNumCsv(val: number, decimals = 1): string {
  return val.toFixed(decimals).replace('.', ',');
}

function formatEuroCsv(val: number): string {
  return val.toFixed(2).replace('.', ',') + ' €';
}

/**
 * Erzeugt CSV-Zeile aus Werten (Strings werden escaped)
 */
function csvRow(...values: (string | number)[]): string {
  return values
    .map((v) => (typeof v === 'number' ? String(v) : escapeCsv(String(v))))
    .join(CSV_SEP);
}

/**
 * Konvertiert Historie-Einträge zu CSV-Zeilen
 */
function historyToCsvRows(
  history: HistoryEntry[],
  typ: 'Strom' | 'Gas' | 'Wasser',
  unit: string
): string[] {
  const rows: string[] = [];
  for (const e of history) {
    const ablesedatum = formatDate(e.month, e.recordedDay);
    const zaehlerstand = formatNumCsv(e.reading ?? 0, 2);
    const verbrauch = formatNumCsv(e.verbrauch ?? 0);
    const abschlag = e.abschlag != null && e.abschlag > 0 ? formatEuroCsv(e.abschlag) : '';
    const kosten = e.kosten != null ? formatEuroCsv(e.kosten) : '';
    const jahreskosten = e.jahreskosten != null ? formatEuroCsv(e.jahreskosten) : '';
    rows.push(csvRow(typ, e.monthName, ablesedatum, zaehlerstand, verbrauch, unit, abschlag, kosten, jahreskosten));
  }
  return rows;
}

/**
 * Erzeugt CSV-String aus Strom-, Gas- und Wasser-Daten
 * Erzeugt CSV-String aus Strom-, Gas- und Wasser-Daten
 */
export function toCsv(strom: StoredData, gas: StoredData, wasser: StoredData = {}): string {
  const header = csvRow(
    'Typ',
    'Monat',
    'Ablesedatum',
    'Zählerstand',
    'Verbrauch',
    'Einheit',
    'Abschlag',
    'Kosten',
    'Voraussichtl. Jahreskosten'
  );

  const stromRows = historyToCsvRows(strom.history ?? [], 'Strom', 'kWh');
  const gasRows = historyToCsvRows(gas.history ?? [], 'Gas', 'm³');
  const wasserRows = historyToCsvRows(wasser.history ?? [], 'Wasser', 'm³');

  const lines = [header, ...stromRows, ...gasRows, ...wasserRows];
  return lines.join('\n');
}

/**
 * Löst CSV-Download aus (reine Funktion, kein DOM-Zugriff außer Download)
 */
export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
