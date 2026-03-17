import { describe, it, expect } from 'vitest';
import {
  toNumInputVal,
  parseNumFromString,
  formatEuro,
  formatNum,
  roundGlatt,
} from '../js/utils.js';

describe('toNumInputVal', () => {
  it('gibt leeren String für null/undefined/leer zurück', () => {
    expect(toNumInputVal(null)).toBe('');
    expect(toNumInputVal(undefined)).toBe('');
    expect(toNumInputVal('')).toBe('');
  });

  it('ersetzt Komma durch Punkt', () => {
    expect(toNumInputVal('12,5')).toBe('12.5');
    expect(toNumInputVal('4523,5')).toBe('4523.5');
  });

  it('gibt leeren String für ungültige Werte zurück', () => {
    expect(toNumInputVal('abc')).toBe('');
  });

  it('parseFloat stoppt bei zweitem Punkt – toNumInputVal gibt String durch', () => {
    expect(toNumInputVal('12.34.56')).toBe('12.34.56');
  });

  it('akzeptiert gültige Zahlen', () => {
    expect(toNumInputVal(123.45)).toBe('123.45');
    expect(toNumInputVal('4380')).toBe('4380');
  });
});

describe('parseNumFromString', () => {
  it('gibt 0 für null/undefined/leer zurück', () => {
    expect(parseNumFromString(null)).toBe(0);
    expect(parseNumFromString(undefined)).toBe(0);
    expect(parseNumFromString('')).toBe(0);
  });

  it('parst deutsches Format (4.523,5)', () => {
    expect(parseNumFromString('4.523,5')).toBe(4523.5);
    expect(parseNumFromString('1.234,56')).toBe(1234.56);
  });

  it('parst englisches Format (4523.5)', () => {
    expect(parseNumFromString('4523.5')).toBe(4523.5);
    expect(parseNumFromString('1234.56')).toBe(1234.56);
  });

  it('ignoriert Leerzeichen', () => {
    expect(parseNumFromString('  4523.5  ')).toBe(4523.5);
    expect(parseNumFromString('4 523,5')).toBe(4523.5);
  });

  it('behandelt mehrere Punkte (Tausendertrennzeichen)', () => {
    expect(parseNumFromString('1.234.567,89')).toBe(1234567.89);
  });
});

describe('formatEuro', () => {
  it('formatiert als Euro', () => {
    expect(formatEuro(85)).toMatch(/85[,.]00/);
    expect(formatEuro(12.5)).toMatch(/12[,.]50/);
    expect(formatEuro(0)).toMatch(/0[,.]00/);
  });
});

describe('formatNum', () => {
  it('formatiert mit Dezimalstellen', () => {
    expect(formatNum(123.4)).toMatch(/123[,.]4/);
    expect(formatNum(123.456, 2)).toMatch(/123[,.]46/);
  });
});

describe('roundGlatt', () => {
  it('rundet kleine Werte auf 0 oder 5', () => {
    expect(roundGlatt(0.005)).toBe(0);
    expect(roundGlatt(3)).toBe(3);
    expect(roundGlatt(0.1)).toBe(5); // Math.round(0.1)=0, 0||5=5
  });

  it('rundet auf 5er unter 100', () => {
    expect(roundGlatt(12)).toBe(10);
    expect(roundGlatt(13)).toBe(15);
    expect(roundGlatt(47)).toBe(45);
    expect(roundGlatt(48)).toBe(50);
  });

  it('rundet auf 10er ab 100', () => {
    expect(roundGlatt(123)).toBe(120);
    expect(roundGlatt(127)).toBe(130);
  });

  it('behandelt negative Werte (abs)', () => {
    expect(roundGlatt(-47)).toBe(45);
  });
});
