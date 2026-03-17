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
  summary: { stromMonths: number; gasMonths: number; info: string };
  strom: StoredData;
  gas: StoredData;
}

export interface ImportResult {
  success: boolean;
  message: string;
}

export type TabId = 'strom' | 'gas';
