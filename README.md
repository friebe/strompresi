# Strompresi

**Monatliches Tracking** – Einmal im Monat Zählerstände eintragen und Strom-, Gas- und Wasserverbrauch dokumentieren. Für Strom und Gas prüft die App zusätzlich, ob dein Abschlag noch passt.

## Warum Strompresi?

- **Deine Daten bleiben bei dir** – Alles wird ausschließlich lokal im Browser gespeichert (localStorage). Kein Server, keine Cloud, kein Konto. Niemand außer dir kann deine Verbrauchsdaten einsehen.
- **Unabhängig vom Anbieter** – Auch wenn deine Strom-, Gas- oder Wasser-App den Zugang sperrt, der Anbieter wechselt oder eine App eingestellt wird: deine eigene Liste bleibt bestehen. Du bist nicht auf das Portal deines Energieversorgers angewiesen.
- **Funktioniert offline** – Als PWA installierbar. Läuft vollständig im Browser, auch ohne Internetverbindung.
- **Kein Konto, kein Login** – Keine Registrierung, keine E-Mail-Adresse, kein Passwort.
- **Strom, Gas & Wasser in einer App** – Alle drei Zähler separat dokumentiert, mit eigenem Chart und eigener Historie.
- **Volle Datenkontrolle** – Export als JSON (Backup/Import) oder CSV (Excel, Numbers, Google Sheets). Deine Daten gehören dir.

## Was macht es?

Du gibst ein:
- **Zählerstand heute** und **letzter Zählerstand** → Verbrauch (kWh bei Strom, m³ bei Gas/Wasser)  
  Der Zeitraum muss nicht genau ein Monat sein – es zählt die Differenz zwischen den beiden Werten.  
  *Beispiel:* 4523 − 4380 = **143 kWh**
- **Arbeitspreis** (€/kWh bzw. €/m³) und optional **Grundgebühr**  
  *Beispiel:* 0,32 €/kWh, 12 € Grundgebühr
- **Aktuellen monatlichen Abschlag** *(nur Strom & Gas – bei Wasser nicht nötig)*  
  *Beispiel:* 85 €

Das Tool berechnet die tatsächlichen Kosten und zeigt dir:
- Automatisches Backup alle 3 Monate (JSON-Download) – startet erst nach dem ersten manuellen Export; bei Browser-Absturz kannst du das Backup wieder importieren
- **CSV-Export** – Zählerstände, Verbrauch, Abschlag und Kosten aller drei Typen als CSV für Excel/Numbers/Sheets (Vermieter, Steuer, Dokumentation). Die Kosten-Spalte enthält pro Monat: Verbrauch × Arbeitspreis + Grundgebühr (zum Zeitpunkt der Erfassung).
- **Drucken** – Druckoptimierte Ansicht mit Chart und Tabellen für Strom, Gas & Wasser (Monat, Ablesedatum, Zählerstand, Verbrauch, Abschlag, Kosten).
- ✓ **Abschlag passt** – alles gut *(Strom & Gas)*
- ↓ **Abschlag senken** – du zahlst zu viel *(Strom & Gas)*
- ↑ **Abschlag erhöhen** – Nachzahlung droht *(Strom & Gas)*
- 💧 **Jahreshochrechnung** – Hochrechnung auf Jahresbasis *(nur Wasser)*

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

## Wie wird die Abschlags-Empfehlung berechnet? *(Strom & Gas)*

1. **Verbrauch** = Zählerstand heute − letzter Zählerstand  
   *Beispiel:* 4523 − 4380 = **143 kWh** (Zeitraum beliebig, z.B. ~1 Monat)
2. **Kosten** = Verbrauch × Arbeitspreis + Grundgebühr  
   *Beispiele:*
   - Strom: 143 kWh × 0,32 €/kWh + 12 € Grundgebühr = **57,76 €**
   - Gas: 120 m³ × 0,12 €/m³ + 15 € Grundgebühr = **29,40 €**
   - Ohne Grundgebühr: 100 kWh × 0,28 €/kWh = **28 €**

**Mit Historie (≥2 Monate):** Die Empfehlung basiert auf dem **Durchschnitt** aller gespeicherten Monate – nicht auf einem einzelnen Monat. Das macht die Empfehlung aussagekräftiger und robuster gegenüber Saisonschwankungen (z.B. Gas im Winter) oder Ausreißern. Es werden maximal 120 Monate berücksichtigt.

- **Ø Verbrauch** = Mittelwert aller Monate  
  *Beispiel:* (143 + 120 + 155) ÷ 3 = **139 kWh**
- **Ø Kosten** = Ø Verbrauch × Arbeitspreis + Grundgebühr  
  *Beispiel:* 139 × 0,32 + 12 = **56,48 €**
- **Differenz** = Dein Abschlag − Ø Kosten  
  *Beispiel:* 85 − 56,48 = **+28,52 €** (Guthaben)

**Ohne Historie (1 Monat):** Es wird nur der aktuelle Monat verwendet (Tatsächliche Kosten = Kosten dieses Monats). Die Historie wird pro Tab (Strom/Gas/Wasser) getrennt gespeichert.

- **Differenz positiv** (Guthaben) → Abschlag senken  
  *Beispiel:* Abschlag 85 €, Kosten 57 € → **+28 €** Guthaben
- **Differenz negativ** (Fehlbetrag) → Abschlag erhöhen  
  *Beispiel:* Abschlag 85 €, Kosten 95 € → **−10 €** Fehlbetrag
- **Differenz nahe 0** (innerhalb 10 %, min. 5 €, max. 15 € Toleranz) → Abschlag passt  
  *Beispiel:* Abschlag 85 €, Kosten 82 € → Differenz 3 € < 5 € Toleranz → **passt**

**Jahresprognose (Strom & Gas):** Mit Historie: `Ø Kosten × 12`. Ohne Historie: `Kosten dieses Monats × 12`.  
*Beispiel:* 56,48 × 12 = **677,76 €** pro Jahr

## Wasser-Tab

Bei Wasser gibt es in der Regel keine monatlichen Abschläge – die Abrechnung erfolgt meist jährlich. Daher unterscheidet sich der Wasser-Tab von Strom & Gas:

- **Kein Abschlag-Feld** – entfällt, da nicht üblich
- **Keine Abschlags-Empfehlung** – kein Vergleich Abschlag vs. Kosten
- **Arbeitspreis** (€/m³) – z.B. ~2,50 €/m³
- **Grundgebühr** (€/Monat) – z.B. ~8–15 €/Monat
- **Jahreshochrechnung** – `Ø Verbrauch × 12 × Arbeitspreis + Grundgebühr × 12`  
  *Beispiel:* 5,5 m³/Monat × 12 × 2,50 €/m³ + 8 € × 12 = **261 €/Jahr**  
  Ab 2 Monaten Historie wird der Durchschnitt aller Monate verwendet.
- **Ø Verbrauch/Monat** – erscheint ab 2 Monaten Historie

## Nutzung

1. **Starten:** `npm install` (einmalig), dann `npm run dev` oder `start.bat`
2. Browser öffnet sich – falls nicht: http://localhost:5173
3. Einmal monatlich Zählerstände eintragen
4. Berechnen – Empfehlung anzeigen

## Technik

- **TypeScript** + Vite (ES-Module, Hot Reload)
- Vanilla HTML/CSS/TS
- PWA-fähig: Installierbar, Offline-Nutzung via Service Worker
- **Mobile installieren:** Android Chrome zeigt bei Bedarf „App installieren“. iOS: Teilen-Symbol → „Zum Home-Bildschirm hinzufügen“.
- `npm run dev` – Entwicklungsserver (Port 5173)
- `npm run build` – Production-Build in `dist/`
- `npm run test` – Unit-Tests (Vitest)

## Offene Features

### Dokumentation & Export

- [x] **CSV-Export** – Zusätzlich zu JSON: Export als CSV für Excel/Numbers/Sheets (Vermieter, Steuer, Energieberatung) – inkl. Wasser
- [ ] **Tabellenansicht** – Monat | Zählerstand | Verbrauch | Abschlag | Kosten als Tabelle (Chart ergänzen oder umschaltbar)
- [x] **Kosten pro Monat speichern** – Kosten zum Ablesezeitpunkt in Historie speichern (Preisänderungen verfälschen alte Monate nicht)
- [x] **Druckansicht** – Druckoptimierte Ansicht von Chart + Tabelle für Ablage/Nebenkostenabrechnung – inkl. Wasser
- [x] **Wasser-Tab** – Dritter Tab für Wasserverbrauch mit Jahreshochrechnung statt Abschlags-Empfehlung
- [ ] **Notizen pro Monat** – Optionale Notiz pro Eintrag (z.B. „Urlaub“, „Neuer Kühlschrank“) für Kontext
- [ ] **Vollständiges Ablesedatum** – Im Export/Tooltip „05.01.2025“ statt nur „5.“ für bessere Dokumentation

### Technik & UX

- [ ] **localStorage-Quota** – Bei sehr langer Historie (z.B. 120 Monate) könnte Speicher knapp werden; evtl. Fehlerbehandlung oder Hinweis
- [ ] **OCR-Sprache** – Tesseract nutzt `eng`; `deu` könnte bei deutschen Ziffern evtl. genauer sein
- [ ] **Service Worker** – Tesseract-CDN wird nicht gecacht; OCR funktioniert offline nicht
- [ ] **Validierungs-Feedback** – `alert()` durch Toast oder Inline-Meldungen ersetzen (moderner, weniger störend)