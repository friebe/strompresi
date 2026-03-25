/**
 * Strompresi – reine Berechnungslogik (testbar ohne DOM)
 */

import type { HistoryEntry } from './types.js';
import { roundGlatt } from './utils.js';

export function calcVerbrauch(readingNow: number, readingMonthAgo: number): number {
  return readingNow - readingMonthAgo;
}

export function calcKosten(verbrauch: number, pricePerUnit: number, baseFee: number): number {
  return verbrauch * pricePerUnit + baseFee;
}

export function calcAvgVerbrauch(history: HistoryEntry[]): number {
  if (history.length === 0) return 0;
  return history.reduce((s, h) => s + (h.verbrauch || 0), 0) / history.length;
}

export function calcAvgKosten(
  history: HistoryEntry[],
  pricePerUnit: number,
  baseFee: number,
  fallbackVerbrauch: number
): number {
  const avgVerbrauch = history.length > 0 ? calcAvgVerbrauch(history) : fallbackVerbrauch;
  return avgVerbrauch * pricePerUnit + baseFee;
}

export function calcTolerance(avgKosten: number, abschlag: number): number {
  const tolerancePct = 0.1;
  const toleranceMin = 5;
  const toleranceMax = Math.max(Math.abs(avgKosten), Math.abs(abschlag)) * tolerancePct;
  return Math.min(Math.max(toleranceMin, toleranceMax), 15);
}

export type Verdict = 'ok' | 'up' | 'down';

export function calcVerdict(differenz: number, tolerance: number): Verdict {
  if (Math.abs(differenz) <= tolerance) return 'ok';
  return differenz > 0 ? 'down' : 'up';
}

export function calcZielAbschlag(abschlag: number, differenz: number, verdict: Verdict): number {
  if (verdict === 'ok') return abschlag;
  if (verdict === 'down') {
    const glatt = roundGlatt(differenz);
    return Math.max(0, Math.round((abschlag - glatt) / 5) * 5);
  }
  const glatt = roundGlatt(Math.abs(differenz));
  return Math.round((abschlag + glatt) / 5) * 5;
}

/**
 * Jahreshochrechnung für Wasser (kein Abschlag):
 * avgVerbrauch × 12 × Arbeitspreis + Grundgebühr × 12
 */
export function calcJahreskosten(
  history: HistoryEntry[],
  verbrauch: number,
  pricePerUnit: number,
  baseFee: number
): number {
  const avgV = history.length > 0 ? calcAvgVerbrauch(history) : verbrauch;
  return avgV * 12 * pricePerUnit + baseFee * 12;
}
