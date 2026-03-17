import { describe, it, expect } from 'vitest';
import { extractMeterReading } from '../js/ocr.js';

describe('extractMeterReading', () => {
  it('gibt null für leere/ungültige Eingabe zurück', () => {
    expect(extractMeterReading(null)).toBeNull();
    expect(extractMeterReading(undefined)).toBeNull();
    expect(extractMeterReading('')).toBeNull();
  });

  it('extrahiert Zählerstand aus Text', () => {
    expect(extractMeterReading('4523.5')).toBe('4523.5');
    expect(extractMeterReading('Zählerstand: 4523,5 kWh')).toBe('4523.5');
  });

  it('gibt die größte passende Zahl zurück', () => {
    expect(extractMeterReading('4523.5, 4380')).toBe('4523.5');
  });

  it('filtert Zahlen unter 100', () => {
    expect(extractMeterReading('Zähler: 45')).toBeNull();
  });

  it('filtert Zahlen >= 99999999', () => {
    expect(extractMeterReading('99999999')).toBeNull();
    expect(extractMeterReading('99999998')).toBe('99999998');
  });
});
