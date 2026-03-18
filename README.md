# Strompresi

**Monatlicher Abschlags-Check** – Einmal im Monat Zählerstände eintragen und prüfen, ob dein Strom und Gas-Abschlag noch passt.

## Was macht es?

Du gibst ein:
- **Zählerstand heute** und **vor 1 Monat** → Verbrauch (kWh bei Strom, m³ bei Gas)
- **Arbeitspreis** (€/kWh) und optional **Grundgebühr**
- **Aktuellen monatlichen Abschlag**

Das Tool berechnet die tatsächlichen Kosten und zeigt dir:
- Automatisches Backup alle 3 Monate (JSON-Download) – startet erst nach dem ersten manuellen Export; bei Browser-Absturz kannst du das Backup wieder importieren
- ✓ **Abschlag passt** – alles gut
- ↓ **Abschlag senken** – du zahlst zu viel
- ↑ **Abschlag erhöhen** – Nachzahlung droht

## Wie wird die Abschlags-Empfehlung berechnet?

1. **Verbrauch** = Zählerstand heute − Zählerstand vor 1 Monat
2. **Kosten** = Verbrauch × Arbeitspreis + Grundgebühr

**Mit Historie (≥2 Monate):** Die Empfehlung basiert auf dem **Durchschnitt** aller gespeicherten Monate – nicht auf einem einzelnen Monat. Das macht die Empfehlung aussagekräftiger und robuster gegenüber Saisonschwankungen (z.B. Gas im Winter) oder Ausreißern. Es werden maximal 120 Monate berücksichtigt.

- **Ø Verbrauch** = Mittelwert aller Monate
- **Ø Kosten** = Ø Verbrauch × Arbeitspreis + Grundgebühr
- **Differenz** = Dein Abschlag − Ø Kosten

**Ohne Historie (1 Monat):** Es wird nur der aktuelle Monat verwendet (Tatsächliche Kosten = Kosten dieses Monats). Die Historie wird pro Tab (Strom/Gas) getrennt gespeichert.

- **Differenz positiv** (Guthaben) → Abschlag senken
- **Differenz negativ** (Fehlbetrag) → Abschlag erhöhen
- **Differenz nahe 0** (innerhalb 10 %, min. 5 €, max. 15 € Toleranz) → Abschlag passt

**Jahresprognose:** Mit Historie: `Ø Kosten × 12`. Ohne Historie: `Kosten dieses Monats × 12`. Keine Saisonbereinigung.

## Nutzung

1. **Starten:** `npm install` (einmalig), dann `npm run dev` oder `start.bat`
2. Browser öffnet sich – falls nicht: http://localhost:5173
3. Einmal monatlich Zählerstände eintragen
4. Berechnen – Empfehlung anzeigen

## Technik

- **TypeScript** + Vite (ES-Module, Hot Reload)
- Vanilla HTML/CSS/TS
- PWA-fähig: Installierbar, Offline-Nutzung via Service Worker
- `npm run dev` – Entwicklungsserver (Port 5173)
- `npm run build` – Production-Build in `dist/`
- `npm run test` – Unit-Tests (Vitest)

## Offene Todos / Verbesserungspotenzial

- [ ] **Import-Legacy dokumentieren** – Der Fall `data.history` ohne `strom`/`gas` in `importAll` (Rückwärtskompatibilität) im Code oder README erklären
- [ ] **localStorage-Quota** – Bei sehr langer Historie (z.B. 120 Monate) könnte Speicher knapp werden; evtl. Fehlerbehandlung oder Hinweis
- [ ] **OCR-Sprache** – Tesseract nutzt `eng`; `deu` könnte bei deutschen Ziffern evtl. genauer sein
- [ ] **Service Worker** – Tesseract-CDN wird nicht gecacht; OCR funktioniert offline nicht
- [ ] **Validierungs-Feedback** – `alert()` durch Toast oder Inline-Meldungen ersetzen (moderner, weniger störend)

