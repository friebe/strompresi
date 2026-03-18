# Strompresi

**Monatlicher Abschlags-Check** – Einmal im Monat Zählerstände eintragen und prüfen, ob dein Strom und Gas-Abschlag noch passt.

## Was macht es?

Du gibst ein:
- **Zählerstand heute** und **letzter Zählerstand** → Verbrauch (kWh bei Strom, m³ bei Gas)  
  Der Zeitraum muss nicht genau ein Monat sein – es zählt die Differenz zwischen den beiden Werten.  
  *Beispiel:* 4523 − 4380 = **143 kWh**
- **Arbeitspreis** (€/kWh) und optional **Grundgebühr**  
  *Beispiel:* 0,32 €/kWh, 12 € Grundgebühr
- **Aktuellen monatlichen Abschlag**  
  *Beispiel:* 85 €

Das Tool berechnet die tatsächlichen Kosten und zeigt dir:
- Automatisches Backup alle 3 Monate (JSON-Download) – startet erst nach dem ersten manuellen Export; bei Browser-Absturz kannst du das Backup wieder importieren
- ✓ **Abschlag passt** – alles gut
- ↓ **Abschlag senken** – du zahlst zu viel
- ↑ **Abschlag erhöhen** – Nachzahlung droht

### Zählerstände & Verbrauch (Chart)

Der Chart zeigt alle 12 Monate des Jahres mit horizontalen Balken:

- **Blau (Erfasst)** – Der Teil des Monats, für den du bereits abgelesen hast.  
  *Rechnung:* `Blau % = Ablesetag ÷ Tage im Monat`  
  *Beispiel:* Abgelesen am 5. Januar (31 Tage) → 5 ÷ 31 ≈ **16 %** blau
- **Grau (Tage offen)** – Die noch offenen Tage bis Monatsende.  
  *Rechnung:* `Grau % = (Tage im Monat − Ablesetag) ÷ Tage im Monat`  
  *Beispiel:* 5. Januar → (31 − 5) ÷ 31 ≈ **84 %** grau
- **Hochrechnung** (im Tooltip bei Teilmonaten):  
  *Rechnung:* `Hochgerechnet = Verbrauch × (Tage im Monat ÷ Ablesetag)`  
  *Beispiel:* 50 kWh bis zum 5. → 50 × (31 ÷ 5) ≈ **310 kWh** auf Monatsende
- **Jahr-Auswahl** – Dropdown zum Wechseln zwischen Jahren (z.B. 2024, 2025).
- **Legacy-Einträge** – Ältere Einträge ohne Ablesedatum werden als einfacher blauer Balken dargestellt; ein Hinweis erscheint, falls vorhanden.

## Wie wird die Abschlags-Empfehlung berechnet?

1. **Verbrauch** = Zählerstand heute − letzter Zählerstand  
   *Beispiel:* 4523 − 4380 = **143 kWh** (Zeitraum beliebig, z.B. ~1 Monat)
2. **Kosten** = Verbrauch × Arbeitspreis + Grundgebühr  
   *Beispiel:* 143 × 0,32 + 12 = **57,76 €**

**Mit Historie (≥2 Monate):** Die Empfehlung basiert auf dem **Durchschnitt** aller gespeicherten Monate – nicht auf einem einzelnen Monat. Das macht die Empfehlung aussagekräftiger und robuster gegenüber Saisonschwankungen (z.B. Gas im Winter) oder Ausreißern. Es werden maximal 120 Monate berücksichtigt.

- **Ø Verbrauch** = Mittelwert aller Monate  
  *Beispiel:* (143 + 120 + 155) ÷ 3 = **139 kWh**
- **Ø Kosten** = Ø Verbrauch × Arbeitspreis + Grundgebühr  
  *Beispiel:* 139 × 0,32 + 12 = **56,48 €**
- **Differenz** = Dein Abschlag − Ø Kosten  
  *Beispiel:* 85 − 56,48 = **+28,52 €** (Guthaben)

**Ohne Historie (1 Monat):** Es wird nur der aktuelle Monat verwendet (Tatsächliche Kosten = Kosten dieses Monats). Die Historie wird pro Tab (Strom/Gas) getrennt gespeichert.

- **Differenz positiv** (Guthaben) → Abschlag senken  
  *Beispiel:* Abschlag 85 €, Kosten 57 € → **+28 €** Guthaben
- **Differenz negativ** (Fehlbetrag) → Abschlag erhöhen  
  *Beispiel:* Abschlag 85 €, Kosten 95 € → **−10 €** Fehlbetrag
- **Differenz nahe 0** (innerhalb 10 %, min. 5 €, max. 15 € Toleranz) → Abschlag passt  
  *Beispiel:* Abschlag 85 €, Kosten 82 € → Differenz 3 € < 5 € Toleranz → **passt**

**Jahresprognose:** Mit Historie: `Ø Kosten × 12`. Ohne Historie: `Kosten dieses Monats × 12`.  
*Beispiel:* 56,48 × 12 = **677,76 €** pro Jahr

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

