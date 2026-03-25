/**
 * Strompresi – Konfiguration und Konstanten
 * Erweiterbar für weitere Energiearten (z.B. Wasser, Wärme)
 */

import type { EnergyConfig } from './types.js';

export const MONTH_NAMES: readonly string[] = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

export const CONFIG: Record<'strom' | 'gas' | 'wasser', EnergyConfig> = {
  strom: {
    unit: 'kWh',
    priceLabel: '€/kWh',
    example: {
      readingNow: '4523.5',
      readingMonthAgo: '4380',
      pricePerUnit: '0.32',
      baseFee: '12',
      currentAbschlag: '85',
    },
  },
  gas: {
    unit: 'm³',
    priceLabel: '€/m³',
    example: {
      readingNow: '1234.5',
      readingMonthAgo: '1180',
      pricePerUnit: '0.12',
      baseFee: '15',
      currentAbschlag: '95',
    },
  },
  wasser: {
    unit: 'm³',
    priceLabel: '€/m³',
    example: {
      readingNow: '523.5',
      readingMonthAgo: '518',
      pricePerUnit: '2.50',
      baseFee: '8',
      currentAbschlag: '0',
    },
  },
};
