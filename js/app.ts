/**
 * Strompresi – Strom & Gas: Zählerstand eingeben, Verbrauchstrend + Abschlags-Empfehlung
 */
import { CONFIG, MONTH_NAMES } from './config.js';
import { toNumInputVal, parseNumFromString, formatEuro, formatNum, roundGlatt } from './utils.js';
import { load, save, exportAll, importAll, getLastBackupDate, setLastBackupDate } from './storage.js';
import { recognizeMeterReading } from './ocr.js';
import {
  calcVerbrauch,
  calcKosten,
  calcAvgKosten,
  calcTolerance,
  calcVerdict,
  calcZielAbschlag,
} from './calc.js';
import type { TabId } from './types.js';

const STORAGE_KEY_STROM = 'strompresi_strom';
const STORAGE_KEY_GAS = 'strompresi_gas';
const INSTALL_BANNER_DISMISSED_KEY = 'strompresi_install_banner_dismissed';
const BACKUP_INTERVAL_DAYS = 90; // Auto-Backup alle 3 Monate

interface ResultsParams {
  verbrauch: number;
  kosten: number;
  abschlag: number;
  pricePerUnit: number;
  baseFee: number;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const App = {
  activeTab: 'strom' as TabId,
  _cameraTarget: '' as string,
  _cameraStream: null as MediaStream | null,
  _deferredInstallPrompt: null as BeforeInstallPromptEvent | null,

  init() {
    document.getElementById('inputForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.calculate();
    });
    document.getElementById('btnReset')?.addEventListener('click', () => this.reset());
    document.querySelectorAll('.tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = (btn as HTMLElement).dataset.tab;
        if (tab === 'strom' || tab === 'gas') this.switchTab(tab);
      });
    });
    document.getElementById('btnExport')?.addEventListener('click', () => this.exportData());
    document.getElementById('fileImport')?.addEventListener('change', (e) => this.importData(e as Event & { target: HTMLInputElement }));
    document.getElementById('btnCameraNow')?.addEventListener('click', () => this._openCamera('readingNow'));
    document.getElementById('btnCameraAgo')?.addEventListener('click', () => this._openCamera('readingMonthAgo'));
    document.getElementById('btnCameraCancel')?.addEventListener('click', () => this._closeCamera());
    document.getElementById('btnCameraClose')?.addEventListener('click', () => this._closeCamera());
    document.getElementById('cameraModalBackdrop')?.addEventListener('click', () => this._closeCamera());
    document.getElementById('btnCameraCapture')?.addEventListener('click', () => this._captureAndRecognize());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !document.getElementById('cameraModal')?.classList.contains('hidden')) {
        this._closeCamera();
      }
    });
    document.getElementById('btnInstall')?.addEventListener('click', () => this._promptInstall());
    document.getElementById('btnInstallClose')?.addEventListener('click', () => this._dismissInstallBanner());
    window.addEventListener('beforeinstallprompt', (e) => this._onBeforeInstallPrompt(e as BeforeInstallPromptEvent));
    window.addEventListener('appinstalled', () => this._hideInstallBanner());
    this._maybeShowIOSInstallBanner();
    this._updateTabLabels();
    this._loadStoredData();
    document.getElementById('verbrauchChartYear')?.addEventListener('change', (e) => {
      const year = parseInt((e.target as HTMLSelectElement).value, 10);
      this._renderVerbrauchChartForYear(year);
    });
  },

  _isStandalone(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as { standalone?: boolean }).standalone === true
    );
  },

  _isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  },

  _maybeShowIOSInstallBanner() {
    if (!this._isIOS() || this._isStandalone()) return;
    if (localStorage.getItem(INSTALL_BANNER_DISMISSED_KEY)) return;
    const banner = document.getElementById('installBanner');
    const textEl = document.getElementById('installBannerText');
    const btnInstall = document.getElementById('btnInstall');
    if (!banner || !textEl) return;
    if (textEl) textEl.textContent = 'Strompresi zum Home-Bildschirm hinzufügen: Tippe auf das Teilen-Symbol unten und wähle „Zum Home-Bildschirm hinzufügen“.';
    if (btnInstall) btnInstall.style.display = 'none';
    banner.classList.remove('hidden');
  },

  _onBeforeInstallPrompt(e: BeforeInstallPromptEvent) {
    this._deferredInstallPrompt = e;
    if (!this._isStandalone() && !localStorage.getItem(INSTALL_BANNER_DISMISSED_KEY)) {
      e.preventDefault();
      this._showInstallBanner();
    }
  },

  _showInstallBanner() {
    const banner = document.getElementById('installBanner');
    if (banner) banner.classList.remove('hidden');
  },

  _hideInstallBanner() {
    const banner = document.getElementById('installBanner');
    if (banner) banner.classList.add('hidden');
    this._deferredInstallPrompt = null;
  },

  _dismissInstallBanner() {
    this._hideInstallBanner();
    try {
      localStorage.setItem(INSTALL_BANNER_DISMISSED_KEY, '1');
    } catch {
      /* ignore */
    }
  },

  async _promptInstall() {
    const prompt = this._deferredInstallPrompt;
    if (!prompt) return;
    await prompt.prompt();
    this._hideInstallBanner();
    try {
      localStorage.setItem(INSTALL_BANNER_DISMISSED_KEY, '1');
    } catch {
      /* ignore */
    }
  },

  _getStorageKey(): string {
    return this.activeTab === 'gas' ? STORAGE_KEY_GAS : STORAGE_KEY_STROM;
  },

  _updateTabLabels() {
    const cfg = CONFIG[this.activeTab];
    const unitReading = document.getElementById('unitReading');
    const unitReadingAgo = document.getElementById('unitReadingAgo');
    const unitPrice = document.getElementById('unitPrice');
    const statVerbrauchUnit = document.getElementById('statVerbrauchUnit');
    const readingNow = document.getElementById('readingNow') as HTMLInputElement;
    const pricePerUnit = document.getElementById('pricePerUnit') as HTMLInputElement;
    if (unitReading) unitReading.textContent = cfg.unit;
    if (unitReadingAgo) unitReadingAgo.textContent = cfg.unit;
    if (unitPrice) unitPrice.textContent = cfg.priceLabel;
    if (statVerbrauchUnit) statVerbrauchUnit.textContent = cfg.unit;
    if (readingNow) readingNow.placeholder = this.activeTab === 'strom' ? 'z.B. 4523.5' : 'z.B. 1234.5';
    if (pricePerUnit) pricePerUnit.placeholder = this.activeTab === 'strom' ? 'z.B. 0,32' : 'z.B. 0,12';
  },

  switchTab(tab: TabId) {
    if (tab === this.activeTab) return;
    this.activeTab = tab;
    document.querySelectorAll('.tab').forEach((btn) => {
      btn.classList.toggle('active', (btn as HTMLElement).dataset.tab === tab);
    });
    this._updateTabLabels();
    document.getElementById('resultsSection')?.classList.add('hidden');
    this._loadStoredData();
  },

  _loadStoredData() {
    const data = load(this._getStorageKey());

    const readingNowEl = document.getElementById('readingNow') as HTMLInputElement;
    const readingMonthAgoEl = document.getElementById('readingMonthAgo') as HTMLInputElement;
    const pricePerUnitEl = document.getElementById('pricePerUnit') as HTMLInputElement;
    const baseFeeEl = document.getElementById('baseFee') as HTMLInputElement;
    const abschlagEl = document.getElementById('currentAbschlag') as HTMLInputElement;

    const hasUsableData =
      data &&
      (data.lastReading != null ||
        (data.settings &&
          (data.settings.pricePerUnit != null ||
            data.settings.pricePerKwh != null ||
            data.settings.abschlag != null)) ||
        (data.history && data.history.length > 0));

    if (!hasUsableData) {
      this._loadExampleData();
      this._renderVerbrauchChart(data?.history || []);
      return;
    }

    const s = data.settings;
    const price = s?.pricePerUnit ?? s?.pricePerKwh;

    if (readingNowEl) readingNowEl.value = '';
    if (readingMonthAgoEl) readingMonthAgoEl.value = data.lastReading != null ? toNumInputVal(data.lastReading) : '';
    if (pricePerUnitEl) pricePerUnitEl.value = price != null ? toNumInputVal(price) : '';
    if (baseFeeEl) baseFeeEl.value = s?.baseFee != null ? toNumInputVal(s.baseFee) : '0';
    if (abschlagEl) abschlagEl.value = s?.abschlag != null ? toNumInputVal(s.abschlag) : '';

    this._renderVerbrauchChart(data.history || []);
  },

  _loadExampleData() {
    const example = CONFIG[this.activeTab].example;
    const readingNow = document.getElementById('readingNow') as HTMLInputElement;
    const readingMonthAgo = document.getElementById('readingMonthAgo') as HTMLInputElement;
    const pricePerUnit = document.getElementById('pricePerUnit') as HTMLInputElement;
    const baseFee = document.getElementById('baseFee') as HTMLInputElement;
    const currentAbschlag = document.getElementById('currentAbschlag') as HTMLInputElement;
    if (readingNow) readingNow.value = toNumInputVal(example.readingNow);
    if (readingMonthAgo) readingMonthAgo.value = toNumInputVal(example.readingMonthAgo);
    if (pricePerUnit) pricePerUnit.value = toNumInputVal(example.pricePerUnit);
    if (baseFee) baseFee.value = toNumInputVal(example.baseFee);
    if (currentAbschlag) currentAbschlag.value = toNumInputVal(example.currentAbschlag);
  },

  _saveData(readingNow: number, verbrauch: number, settings: { pricePerUnit: number; baseFee: number; abschlag: number }) {
    const data = load(this._getStorageKey()) || { history: [] };
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthName = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

    data.history = data.history || [];
    const lastEntry = data.history[data.history.length - 1];

    const recordedDay = now.getDate();
    if (lastEntry && lastEntry.month === monthKey) {
      lastEntry.verbrauch = verbrauch;
      lastEntry.reading = readingNow;
      lastEntry.monthName = monthName;
      lastEntry.recordedDay = recordedDay;
      lastEntry.abschlag = settings.abschlag;
    } else {
      data.history.push({ month: monthKey, monthName, verbrauch, reading: readingNow, recordedDay, abschlag: settings.abschlag });
    }
    data.history = data.history.slice(-120);
    data.lastReading = readingNow;
    data.settings = settings;

    save(this._getStorageKey(), data);
  },

  parseNum(id: string): number {
    const el = document.getElementById(id) as HTMLInputElement | null;
    const val = el?.value ?? '';
    return parseNumFromString(String(val));
  },

  calculate() {
    const readingNow = this.parseNum('readingNow');
    const readingMonthAgo = this.parseNum('readingMonthAgo');
    const pricePerUnit = this.parseNum('pricePerUnit');
    const baseFee = this.parseNum('baseFee');
    const abschlag = this.parseNum('currentAbschlag');

    if (readingNow <= 0 || readingMonthAgo <= 0) {
      alert('Bitte gültige Zählerstände eingeben.');
      return;
    }
    if (readingNow < readingMonthAgo) {
      alert('Der aktuelle Zählerstand muss höher sein als der letzte.');
      return;
    }
    if (pricePerUnit <= 0) {
      alert(
        `Bitte einen gültigen Arbeitspreis eingeben (z.B. ${this.activeTab === 'strom' ? '0,32 €/kWh' : '0,12 €/m³'}).`
      );
      return;
    }
    if (abschlag <= 0) {
      alert('Bitte deinen aktuellen monatlichen Abschlag eingeben.');
      return;
    }

    const verbrauch = calcVerbrauch(readingNow, readingMonthAgo);
    const kosten = calcKosten(verbrauch, pricePerUnit, baseFee);

    this._saveData(readingNow, verbrauch, { pricePerUnit, baseFee, abschlag });
    this._maybeAutoBackup();
    this.showResults({ verbrauch, kosten, abschlag, pricePerUnit, baseFee });
  },

  showResults({ verbrauch, kosten, abschlag, pricePerUnit, baseFee }: ResultsParams) {
    document.getElementById('resultsSection')?.classList.remove('hidden');

    const now = new Date();
    const monthBadge = document.getElementById('monthBadge');
    if (monthBadge) monthBadge.textContent = `Berechnung für ${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

    this._showTrend(verbrauch);
    const statVerbrauchUnit = document.getElementById('statVerbrauchUnit');
    if (statVerbrauchUnit) statVerbrauchUnit.textContent = CONFIG[this.activeTab].unit;

    const data = load(this._getStorageKey());
    const history = data?.history || [];
    const avgKosten = calcAvgKosten(history, pricePerUnit, baseFee, verbrauch);
    const differenz = abschlag - avgKosten;
    const tolerance = calcTolerance(avgKosten, abschlag);
    const verdict = calcVerdict(differenz, tolerance);
    const ziel = calcZielAbschlag(abschlag, differenz, verdict);

    const avgVerbrauch =
      history.length > 0 ? history.reduce((s, h) => s + (h.verbrauch || 0), 0) / history.length : verbrauch;
    const icon = verdict === 'ok' ? '✓' : verdict === 'down' ? '↓' : '↑';
    const title =
      verdict === 'ok'
        ? 'Abschlag passt'
        : verdict === 'down'
          ? 'Abschlag senken'
          : 'Abschlag erhöhen';
    const text =
      verdict === 'ok'
        ? history.length > 1
          ? `Dein Abschlag entspricht etwa den durchschnittlichen Kosten (${history.length} Monate).`
          : 'Dein monatlicher Abschlag entspricht etwa den tatsächlichen Kosten.'
        : verdict === 'down'
          ? history.length > 1
            ? `Im Durchschnitt zahlst du zu viel (basierend auf ${history.length} Monaten).`
            : 'Du zahlst zu viel. Du könntest deinen Abschlag reduzieren.'
          : history.length > 1
            ? `Im Durchschnitt zahlst du zu wenig (basierend auf ${history.length} Monaten). Erhöhe deinen Abschlag.`
            : 'Du zahlst zu wenig. Erhöhe deinen Abschlag, um Nachzahlungen zu vermeiden.';
    const glatt = verdict === 'ok' ? 0 : roundGlatt(Math.abs(differenz));
    const amount =
      verdict === 'ok'
        ? 'Keine Änderung nötig.'
        : verdict === 'down'
          ? `Auf ${formatEuro(ziel)} reduzieren (${formatEuro(glatt)} weniger)`
          : `Auf ${formatEuro(ziel)} erhöhen (${formatEuro(glatt)} mehr)`;

    const verdictCard = document.getElementById('verdictCard');
    if (verdictCard) {
      verdictCard.className = verdictCard.className.replace(/\b(ok|up|down)\b/g, '').trim() + ' ' + verdict;
    }
    const verdictIcon = document.getElementById('verdictIcon');
    const verdictTitle = document.getElementById('verdictTitle');
    const verdictText = document.getElementById('verdictText');
    const verdictAmount = document.getElementById('verdictAmount');
    const verdictJahres = document.getElementById('verdictJahres');
    if (verdictIcon) verdictIcon.textContent = icon;
    if (verdictTitle) verdictTitle.textContent = title;
    if (verdictText) verdictText.textContent = text;
    if (verdictAmount) verdictAmount.textContent = amount;

    const jahresText =
      history.length > 1
        ? `Jahresprognose (Ø ${formatNum(avgVerbrauch)} ${CONFIG[this.activeTab].unit}/Monat): ${formatEuro(avgKosten * 12)}`
        : `Jahresprognose bei gleichbleibendem Verbrauch: ${formatEuro(kosten * 12)}`;
    if (verdictJahres) verdictJahres.textContent = jahresText;

    // Stats
    const statVerbrauch = document.getElementById('statVerbrauch');
    const statKosten = document.getElementById('statKosten');
    const statAbschlag = document.getElementById('statAbschlag');
    const statDifferenzLabel = document.getElementById('statDifferenzLabel');
    const statDifferenz = document.getElementById('statDifferenz');
    const statKostenLabel = document.getElementById('statKostenLabel');
    if (statVerbrauch) statVerbrauch.textContent = formatNum(verbrauch);
    if (history.length > 1 && statKostenLabel) {
      statKostenLabel.textContent = `Ø Kosten (${history.length} Monate)`;
      if (statKosten) statKosten.textContent = formatEuro(avgKosten);
    } else {
      if (statKostenLabel) statKostenLabel.textContent = 'Tatsächliche Kosten';
      if (statKosten) statKosten.textContent = formatEuro(kosten);
    }
    if (statAbschlag) statAbschlag.textContent = formatEuro(abschlag);

    if (statDifferenzLabel) {
      statDifferenzLabel.textContent =
        differenz > 0 ? 'Guthaben' : differenz < 0 ? 'Fehlbetrag' : 'Ausgeglichen';
    }
    if (statDifferenz) {
      statDifferenz.textContent =
        differenz > 0 ? '+' + formatEuro(differenz) : differenz < 0 ? formatEuro(differenz) : '0,00 €';
      statDifferenz.className =
        'stat-value' + (differenz > 0 ? ' positive' : differenz < 0 ? ' negative' : '');
    }

    // Verbrauch-Chart (Zählerstände-Verlauf)
    this._renderVerbrauchChart(history);

    // Bar chart
    const barKosten = history.length > 1 ? avgKosten : kosten;
    const max = Math.max(barKosten, abschlag, 10);
    const barCostLabel = document.getElementById('barCostLabel');
    const barCost = document.getElementById('barCost');
    const barAbschlag = document.getElementById('barAbschlag');
    const barCostVal = document.getElementById('barCostVal');
    const barAbschlagVal = document.getElementById('barAbschlagVal');
    const barMaxLabel = document.getElementById('barMaxLabel');
    if (barCostLabel)
      barCostLabel.textContent =
        history.length > 1 ? `Ø Kosten (${history.length} Monate)` : 'Tatsächliche Kosten';
    if (barCost) barCost.style.width = `${(barKosten / max) * 100}%`;
    if (barAbschlag) barAbschlag.style.width = `${(abschlag / max) * 100}%`;
    if (barCostVal) barCostVal.textContent = formatEuro(barKosten);
    if (barAbschlagVal) barAbschlagVal.textContent = formatEuro(abschlag);
    if (barMaxLabel) barMaxLabel.textContent = formatEuro(max);

    document.getElementById('resultsSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  _renderVerbrauchChartForYear(year: number) {
    const data = load(this._getStorageKey());
    const history = data?.history || [];
    this._renderVerbrauchChart(history, year);
  },

  _renderVerbrauchChart(history: { month: string; monthName: string; verbrauch: number; recordedDay?: number; abschlag?: number }[], year?: number) {
    const container = document.getElementById('verbrauchChart');
    const hint = document.getElementById('verbrauchChartHint');
    const legend = document.getElementById('verbrauchChartLegend');
    const legacyHint = document.getElementById('verbrauchChartLegacyHint');
    const yearSelect = document.getElementById('verbrauchChartYear') as HTMLSelectElement | null;
    if (!container) return;

    const byMonth = new Map<string, { monthName: string; verbrauch: number; recordedDay?: number; abschlag?: number }>();
    for (const e of history) {
      byMonth.set(e.month, {
        monthName: e.monthName,
        verbrauch: e.verbrauch ?? 0,
        recordedDay: e.recordedDay,
        abschlag: e.abschlag,
      });
    }

    const currentYear = new Date().getFullYear();
    const displayYear = year ?? currentYear;
    const unit = CONFIG[this.activeTab].unit;
    const trackedEntries = [...byMonth.entries()].filter(([k]) => k.startsWith(String(displayYear)));
    const maxVerbrauch = Math.max(...trackedEntries.map(([, e]) => e.verbrauch || 0), 1);

    const yearsInHistory = new Set(history.map((e) => parseInt(e.month.slice(0, 4), 10)));
    yearsInHistory.add(currentYear);
    const years = [...yearsInHistory].sort((a, b) => b - a);

    if (yearSelect) {
      yearSelect.innerHTML = years.map((y) => `<option value="${y}" ${y === displayYear ? 'selected' : ''}>${y}</option>`).join('');
    }

    if (hint) hint.classList.remove('hidden');
    if (legend) legend.classList.remove('hidden');

    const hasLegacyEntries = trackedEntries.some(([, e]) => !e.recordedDay);
    if (legacyHint) legacyHint.classList.toggle('hidden', !hasLegacyEntries);

    const getDaysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();

    const rows = MONTH_NAMES.map((name, i) => {
      const monthKey = `${displayYear}-${String(i + 1).padStart(2, '0')}`;
      const data = byMonth.get(monthKey);
      const tracked = !!data;
      const v = data?.verbrauch ?? 0;
      const shortName = name.slice(0, 3);
      let barHtml: string;
      let contextHtml = '';
      let title = tracked ? `${name} ${displayYear}: ${formatNum(v)} ${unit}` : `${name} ${displayYear}: noch nicht getrackt`;

      if (tracked && data?.recordedDay != null) {
        const daysInMonth = getDaysInMonth(displayYear, i + 1);
        const daysLeft = Math.max(0, daysInMonth - data.recordedDay);
        const pctCovered = (data.recordedDay / daysInMonth) * 100;
        const pctOpen = (daysLeft / daysInMonth) * 100;
        const context = `${data.recordedDay}. · ${daysLeft} Tage offen`;
        let hochrechnung = '';
        if (daysLeft > 0 && data.recordedDay > 0) {
          const projected = Math.round((v / data.recordedDay) * daysInMonth);
          hochrechnung = ` · Hochgerechnet auf Monatsende: ~${formatNum(projected)} ${unit}`;
        }
        title += ` · Abgelesen am ${data.recordedDay}. · ${daysLeft} Tage bis Monatsende${hochrechnung}`;
        if (data.abschlag != null && data.abschlag > 0) {
          title += ` · Abschlag: ${formatEuro(data.abschlag)}`;
        }
        contextHtml = `<span class="verbrauch-chart-context">${context}</span>`;
        barHtml = `
            <div class="verbrauch-chart-fill verbrauch-chart-covered" style="width: ${pctCovered}%"></div>
            <div class="verbrauch-chart-fill verbrauch-chart-open" style="width: ${pctOpen}%"></div>`;
      } else if (tracked) {
        const pct = maxVerbrauch > 0 ? (v / maxVerbrauch) * 100 : 0;
        barHtml = `<div class="verbrauch-chart-fill verbrauch-chart-covered" style="width: ${pct}%"></div>`;
        if (data.abschlag != null && data.abschlag > 0) {
          title += ` · Abschlag: ${formatEuro(data.abschlag)}`;
        }
      } else {
        barHtml = '';
      }

      return `
        <div class="verbrauch-chart-row ${tracked ? 'tracked' : 'disabled'}" title="${title.replace(/"/g, '&quot;')}">
          <span class="verbrauch-chart-month">${shortName}</span>
          <div class="verbrauch-chart-track">
            ${barHtml}
          </div>
          <span class="verbrauch-chart-val-wrap">
            ${tracked ? formatNum(v) : '–'}
            ${contextHtml}
          </span>
        </div>`;
    }).join('');

    container.innerHTML = `<div class="verbrauch-chart-horizontal">${rows}</div>`;
  },

  _showTrend(verbrauch: number) {
    const trendCard = document.getElementById('trendCard');
    const trendIcon = document.getElementById('trendIcon');
    const trendText = document.getElementById('trendText');
    if (!trendCard || !trendIcon || !trendText) return;
    try {
      const data = load(this._getStorageKey());
      const history = data?.history || [];
      const currentMonthKey = history.length > 0 ? history[history.length - 1].month : null;

      let lastMonth = history[history.length - 2] ?? null;
      for (let i = history.length - 2; i >= 0; i--) {
        if (history[i].month !== currentMonthKey) {
          lastMonth = history[i];
          break;
        }
      }
      if (!lastMonth) {
        trendCard.classList.add('hidden');
        return;
      }

      const lastVerbrauch = lastMonth.verbrauch;
      const diff = verbrauch - lastVerbrauch;
      const diffPct = lastVerbrauch > 0 ? (diff / lastVerbrauch) * 100 : 0;
      const unit = CONFIG[this.activeTab].unit;

      trendCard.classList.remove('hidden');
      trendCard.className = trendCard.className.replace(/\b(up|down|same)\b/g, '').trim();

      if (Math.abs(diffPct) < 5) {
        trendCard.classList.add('same');
        trendIcon.textContent = '→';
        trendText.textContent = `Verbrauch wie letzten Monat: ${formatNum(verbrauch)} ${unit} (${lastMonth.monthName}: ${formatNum(lastVerbrauch)} ${unit})`;
      } else if (diff > 0) {
        trendCard.classList.add('up');
        trendIcon.textContent = '↑';
        trendText.textContent = `Verbrauch gestiegen: ${formatNum(verbrauch)} ${unit} (${formatNum(diffPct)}% mehr als ${lastMonth.monthName})`;
      } else {
        trendCard.classList.add('down');
        trendIcon.textContent = '↓';
        trendText.textContent = `Verbrauch gesunken: ${formatNum(verbrauch)} ${unit} (${formatNum(Math.abs(diffPct))}% weniger als ${lastMonth.monthName})`;
      }
    } catch (e) {
      console.error('Strompresi: Fehler beim Trend', e);
      trendCard.classList.add('hidden');
    }
  },

  reset() {
    document.getElementById('resultsSection')?.classList.add('hidden');
    const form = document.getElementById('inputForm') as HTMLFormElement;
    form?.reset();
    this._loadStoredData();
  },

  exportData() {
    this._downloadBackup();
    setLastBackupDate();
  },

  _downloadBackup() {
    const data = exportAll(STORAGE_KEY_STROM, STORAGE_KEY_GAS);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `strompresi-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  _maybeAutoBackup() {
    const last = getLastBackupDate();
    if (!last) return; // Erstes Mal: kein Auto-Backup, Intervall startet erst nach manuellem Export
    const now = new Date();
    const lastDate = new Date(last);
    const daysSinceLast = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLast >= BACKUP_INTERVAL_DAYS) {
      this._downloadBackup();
      setLastBackupDate();
    }
  },

  async _openCamera(targetFieldId: string) {
    this._cameraTarget = targetFieldId;
    const modal = document.getElementById('cameraModal');
    const video = document.getElementById('cameraVideo') as HTMLVideoElement;
    const status = document.getElementById('cameraStatus');
    if (!modal || !video || !status) return;
    modal.classList.remove('hidden');
    status.textContent = 'Kamera wird gestartet…';
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      video.srcObject = stream;
      this._cameraStream = stream;
      status.textContent = 'Zählerstand in die Kamera halten und „Aufnehmen“ klicken';
    } catch {
      status.textContent = 'Kamera nicht verfügbar. Bitte manuell eingeben.';
    }
  },

  _closeCamera() {
    const modal = document.getElementById('cameraModal');
    const video = document.getElementById('cameraVideo') as HTMLVideoElement;
    if (modal) modal.classList.add('hidden');
    if (this._cameraStream) {
      this._cameraStream.getTracks().forEach((t) => t.stop());
      this._cameraStream = null;
    }
    if (video) video.srcObject = null;
  },

  async _captureAndRecognize() {
    const video = document.getElementById('cameraVideo') as HTMLVideoElement;
    const canvas = document.getElementById('cameraCanvas') as HTMLCanvasElement;
    const status = document.getElementById('cameraStatus');
    const targetEl = document.getElementById(this._cameraTarget) as HTMLInputElement | null;
    if (!targetEl || !video?.srcObject) return;
    if (status) status.textContent = 'Bild wird erkannt…';
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    try {
      const result = await recognizeMeterReading(canvas);
      if (result && targetEl) {
        targetEl.value = result;
        targetEl.focus();
        if (status) status.textContent = `Erkannt: ${result} – bei Bedarf manuell anpassen`;
      } else if (status) {
        status.textContent = 'Keine Zahl erkannt. Bitte erneut fotografieren oder manuell eingeben.';
      }
    } catch {
      if (status) status.textContent = 'Fehler bei der Erkennung. Bitte manuell eingeben.';
    }
  },

  importData(event: Event & { target: HTMLInputElement }) {
    const file = event.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse((e.target?.result as string) || '{}');
        const result = importAll(data, STORAGE_KEY_STROM, STORAGE_KEY_GAS);
        if (result.success) {
          this._loadStoredData();
          alert(result.message);
        } else {
          alert(result.message);
        }
      } catch (err) {
        alert('Ungültige JSON-Datei: ' + (err instanceof Error ? err.message : 'Parse-Fehler'));
      }
      event.target.value = '';
    };
    reader.readAsText(file);
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
