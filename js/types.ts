/**
 * Strompresi – gemeinsame Typdefinitionen
 */

export interface ExampleData {
  readingNow: string;
  readingMonthAgo: string;
  pricePerUnit: string;
  baseFee: string;
  currentAbschlag: string;
}

export interface EnergyConfig {
  unit: string;
  priceLabel: string;
  example: ExampleData;
}

export interface HistoryEntry {
  month: string;
  monthName: string;
  verbrauch: number;
  reading: number;
  /** Tag im Monat (1–31), an dem abgelesen wurde – für Kontext im Chart */
  recordedDay?: number;
  /** Monatlicher Abschlag zum Zeitpunkt der Erfassung */
  abschlag?: number;
  /** Kosten zum Zeitpunkt der Erfassung (Verbrauch × Arbeitspreis + Grundgebühr) */
  kosten?: number;
}

export interface StoredSettings {
  pricePerUnit?: number;
  pricePerKwh?: number;
  baseFee?: number;
  abschlag?: number;
}

export interface StoredData {
  history?: HistoryEntry[];
  lastReading?: number;
  settings?: StoredSettings;
}

export interface ExportData {
  version: number;
  exportedAt: string;
  summary: { stromMonths: number; gasMonths: number; wasserMonths: number; info: string };
  strom: StoredData;
  gas: StoredData;
  wasser: StoredData;
}

export interface ImportResult {
  success: boolean;
  message: string;
}

export type TabId = 'strom' | 'gas' | 'wasser';
