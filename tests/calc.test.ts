import { describe, it, expect } from 'vitest';
import {
  calcVerbrauch,
  calcKosten,
  calcAvgVerbrauch,
  calcAvgKosten,
  calcTolerance,
  calcVerdict,
  calcZielAbschlag,
} from '../js/calc.js';

describe('calcVerbrauch', () => {
  it('berechnet Differenz der Zählerstände', () => {
    expect(calcVerbrauch(4523.5, 4380)).toBe(143.5);
    expect(calcVerbrauch(1234, 1180)).toBe(54);
  });
});

describe('calcKosten', () => {
  it('berechnet Verbrauch * Preis + Grundgebühr', () => {
    expect(calcKosten(143.5, 0.32, 12)).toBeCloseTo(143.5 * 0.32 + 12, 2);
    expect(calcKosten(100, 0.2, 0)).toBe(20);
  });
});

describe('calcAvgVerbrauch', () => {
  it('gibt 0 für leere Historie zurück', () => {
    expect(calcAvgVerbrauch([])).toBe(0);
  });

  it('berechnet Durchschnitt', () => {
    const history = [
      { month: '2025-01', monthName: 'Jan', verbrauch: 100, reading: 4500 },
      { month: '2025-02', monthName: 'Feb', verbrauch: 120, reading: 4620 },
    ];
    expect(calcAvgVerbrauch(history)).toBe(110);
  });
});

describe('calcAvgKosten', () => {
  it('nutzt Fallback bei leerer Historie', () => {
    expect(calcAvgKosten([], 0.32, 12, 100)).toBe(100 * 0.32 + 12);
  });

  it('berechnet aus Historie', () => {
    const history = [
      { month: '2025-01', monthName: 'Jan', verbrauch: 100, reading: 4500 },
      { month: '2025-02', monthName: 'Feb', verbrauch: 120, reading: 4620 },
    ];
    expect(calcAvgKosten(history, 0.32, 12, 0)).toBeCloseTo(110 * 0.32 + 12, 2);
  });
});

describe('calcTolerance', () => {
  it('liegt zwischen 5 und 15', () => {
    const t = calcTolerance(80, 85);
    expect(t).toBeGreaterThanOrEqual(5);
    expect(t).toBeLessThanOrEqual(15);
  });

  it('ist ca. 10% der Kosten', () => {
    const t = calcTolerance(100, 100);
    expect(t).toBe(10);
  });
});

describe('calcVerdict', () => {
  it('gibt ok bei Differenz innerhalb Toleranz', () => {
    expect(calcVerdict(5, 10)).toBe('ok');
    expect(calcVerdict(-5, 10)).toBe('ok');
    expect(calcVerdict(0, 10)).toBe('ok');
  });

  it('gibt down bei positivem Guthaben', () => {
    expect(calcVerdict(20, 10)).toBe('down');
  });

  it('gibt up bei Fehlbetrag', () => {
    expect(calcVerdict(-20, 10)).toBe('up');
  });
});

describe('calcZielAbschlag', () => {
  it('gibt Abschlag bei ok zurück', () => {
    expect(calcZielAbschlag(85, 5, 'ok')).toBe(85);
  });

  it('reduziert bei down', () => {
    const ziel = calcZielAbschlag(85, 25, 'down');
    expect(ziel).toBeLessThan(85);
    expect(ziel % 5).toBe(0);
  });

  it('erhöht bei up', () => {
    const ziel = calcZielAbschlag(85, 25, 'up');
    expect(ziel).toBeGreaterThan(85);
    expect(ziel % 5).toBe(0);
  });
});
