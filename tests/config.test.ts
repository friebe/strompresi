import { describe, it, expect } from 'vitest';
import { MONTH_NAMES, CONFIG } from '../js/config.js';

describe('config', () => {
  describe('MONTH_NAMES', () => {
    it('hat 12 Monate', () => {
      expect(MONTH_NAMES).toHaveLength(12);
    });

    it('beginnt mit Januar', () => {
      expect(MONTH_NAMES[0]).toBe('Januar');
    });

    it('endet mit Dezember', () => {
      expect(MONTH_NAMES[11]).toBe('Dezember');
    });
  });

  describe('CONFIG', () => {
    it('hat strom und gas', () => {
      expect(CONFIG.strom).toBeDefined();
      expect(CONFIG.gas).toBeDefined();
    });

    it('strom hat korrekte Einheiten', () => {
      expect(CONFIG.strom.unit).toBe('kWh');
      expect(CONFIG.strom.priceLabel).toBe('€/kWh');
    });

    it('gas hat korrekte Einheiten', () => {
      expect(CONFIG.gas.unit).toBe('m³');
      expect(CONFIG.gas.priceLabel).toBe('€/m³');
    });

    it('example-Daten sind gültig', () => {
      const ex = CONFIG.strom.example;
      expect(parseFloat(ex.readingNow)).toBeGreaterThan(parseFloat(ex.readingMonthAgo));
      expect(parseFloat(ex.pricePerUnit)).toBeGreaterThan(0);
      expect(parseFloat(ex.currentAbschlag)).toBeGreaterThan(0);
    });
  });
});
