import { describe, it, expect, beforeEach, vi } from 'vitest';
import { load, save, exportAll, importAll } from '../js/storage.js';

const STROM_KEY = 'test_strom';
const GAS_KEY = 'test_gas';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('load/save', () => {
    it('gibt null bei leerem Storage zurück', () => {
      expect(load(STROM_KEY)).toBeNull();
    });

    it('speichert und lädt Daten', () => {
      const data = { history: [], lastReading: 4523.5 };
      save(STROM_KEY, data);
      expect(load(STROM_KEY)).toEqual(data);
    });

    it('gibt null bei ungültigem JSON zurück', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      localStorage.setItem(STROM_KEY, 'invalid json');
      expect(load(STROM_KEY)).toBeNull();
      spy.mockRestore();
    });
  });

  describe('exportAll', () => {
    it('exportiert leere Daten', () => {
      const result = exportAll(STROM_KEY, GAS_KEY);
      expect(result.version).toBe(1);
      expect(result.exportedAt).toBeDefined();
      expect(result.strom).toEqual({});
      expect(result.gas).toEqual({});
      expect(result.summary.stromMonths).toBe(0);
      expect(result.summary.gasMonths).toBe(0);
    });

    it('exportiert Historie', () => {
      save(STROM_KEY, {
        history: [
          { month: '2025-01', monthName: 'Januar 2025', verbrauch: 120, reading: 4523 },
          { month: '2025-02', monthName: 'Februar 2025', verbrauch: 115, reading: 4638 },
        ],
        lastReading: 4638,
      });
      const result = exportAll(STROM_KEY, GAS_KEY);
      expect(result.strom.history).toHaveLength(2);
      expect(result.summary.stromMonths).toBe(2);
    });
  });

  describe('importAll', () => {
    it('lehnt ungültige Daten ab', () => {
      expect(importAll(null, STROM_KEY, GAS_KEY)).toEqual({
        success: false,
        message: 'Ungültige Datei.',
      });
      expect(importAll('string', STROM_KEY, GAS_KEY)).toEqual({
        success: false,
        message: 'Ungültige Datei.',
      });
    });

    it('importiert strom und gas', () => {
      const data = {
        strom: { history: [], lastReading: 4523 },
        gas: { history: [], lastReading: 1234 },
      };
      const result = importAll(data, STROM_KEY, GAS_KEY);
      expect(result.success).toBe(true);
      expect(load(STROM_KEY)).toEqual(data.strom);
      expect(load(GAS_KEY)).toEqual(data.gas);
    });

    it('importiert Legacy-Format (nur history)', () => {
      const data = {
        history: [{ month: '2025-01', monthName: 'Jan 2025', verbrauch: 100, reading: 4500 }],
        lastReading: 4500,
      };
      const result = importAll(data, STROM_KEY, GAS_KEY);
      expect(result.success).toBe(true);
      expect(load(STROM_KEY)).toEqual(data);
    });
  });
});
