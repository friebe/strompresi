import { describe, it, expect } from 'vitest';
import { toCsv } from '../js/csv.js';

describe('toCsv', () => {
  it('gibt leere CSV mit Header zurück bei leerer Historie', () => {
    const csv = toCsv({}, {});
    expect(csv).toContain('Typ;Monat;Ablesedatum');
    expect(csv.split('\n')).toHaveLength(1);
  });

  it('exportiert Strom-Historie', () => {
    const strom = {
      history: [
        {
          month: '2025-01',
          monthName: 'Januar 2025',
          verbrauch: 120,
          reading: 4523,
          recordedDay: 5,
          abschlag: 85,
          kosten: 50.4,
        },
      ],
    };
    const csv = toCsv(strom, {});
    const lines = csv.split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain('Typ');
    expect(lines[1]).toContain('Strom');
    expect(lines[1]).toContain('Januar 2025');
    expect(lines[1]).toContain('05.01.2025');
    expect(lines[1]).toContain('4523');
    expect(lines[1]).toContain('120');
    expect(lines[1]).toContain('85');
    expect(lines[1]).toContain('50,40');
  });

  it('exportiert Gas-Historie mit Einheit m³', () => {
    const gas = {
      history: [
        {
          month: '2025-02',
          monthName: 'Februar 2025',
          verbrauch: 85.5,
          reading: 1234.5,
          abschlag: 95,
          kosten: 48.8,
        },
      ],
    };
    const csv = toCsv({}, gas);
    const lines = csv.split('\n');
    expect(lines[1]).toContain('Gas');
    expect(lines[1]).toContain('m³');
    expect(lines[1]).toContain('85,5');
  });

  it('kombiniert Strom und Gas in einer Datei', () => {
    const strom = {
      history: [{ month: '2025-01', monthName: 'Jan 2025', verbrauch: 100, reading: 4500 }],
    };
    const gas = {
      history: [{ month: '2025-01', monthName: 'Jan 2025', verbrauch: 50, reading: 1200 }],
    };
    const csv = toCsv(strom, gas);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(3); // header + strom + gas
    expect(lines[1]).toContain('Strom');
    expect(lines[2]).toContain('Gas');
  });
});
