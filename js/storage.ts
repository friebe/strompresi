/**
 * Strompresi – localStorage-Operationen
 */

import type { StoredData, ImportResult } from './types.js';

/**
 * Lädt Daten aus dem Storage
 */
export function load(key: string): StoredData | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as StoredData) : null;
  } catch (e) {
    console.error('Strompresi: Fehler beim Laden', e);
    return null;
  }
}

/**
 * Speichert Daten im Storage
 */
export function save(key: string, data: StoredData): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Strompresi: Fehler beim Speichern', e);
  }
}

/**
 * Exportiert alle Daten (Strom + Gas) inkl. vollständiger Historie
 */
export function exportAll(stromKey: string, gasKey: string) {
  const strom = load(stromKey) || {};
  const gas = load(gasKey) || {};
  const stromMonths = strom.history?.length ?? 0;
  const gasMonths = gas.history?.length ?? 0;
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    summary: {
      stromMonths,
      gasMonths,
      info: `Vollständiger Export: ${stromMonths} Strom-Monate, ${gasMonths} Gas-Monate`,
    },
    strom,
    gas,
  };
}

const LAST_BACKUP_KEY = 'strompresi_last_backup';

/**
 * Gibt das Datum des letzten Auto-Backups zurück (ISO-String oder null)
 */
export function getLastBackupDate(): string | null {
  return localStorage.getItem(LAST_BACKUP_KEY);
}

/**
 * Speichert das aktuelle Datum als letztes Backup
 */
export function setLastBackupDate(): void {
  localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());
}

/**
 * Importiert Daten aus Backup-JSON in den Storage
 * Legacy: data.history ohne strom/gas → wird als Strom-Daten importiert
 */
export function importAll(
  data: unknown,
  stromKey: string,
  gasKey: string
): ImportResult {
  try {
    if (!data || typeof data !== 'object') {
      return { success: false, message: 'Ungültige Datei.' };
    }
    const obj = data as Record<string, unknown>;
    if (obj.strom && typeof obj.strom === 'object') {
      save(stromKey, obj.strom as StoredData);
    }
    if (obj.gas && typeof obj.gas === 'object') {
      save(gasKey, obj.gas as StoredData);
    }
    if (obj.history && !obj.strom && !obj.gas) {
      save(stromKey, obj as unknown as StoredData);
    }
    return { success: true, message: 'Daten erfolgreich importiert.' };
  } catch (e) {
    console.error('Strompresi: Fehler beim Import', e);
    return {
      success: false,
      message: 'Fehler beim Import: ' + (e instanceof Error ? e.message : 'Unbekannt'),
    };
  }
}
