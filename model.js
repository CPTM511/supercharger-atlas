/** All defaults are illustrative assumptions, never a forecast for a candidate site. */
export const DEFAULT_SCENARIO = Object.freeze({
  stalls: 8, sessionsPerStallDay: 4, kwhPerSession: 40,
  retailPerKwh: 0.45, energyPerKwh: 0.14, lossFraction: 0.08,
  servicePerKwh: 0.10, demandPerKwMonth: 12, billedPeakKw: 500,
  fixedMonthly: 2500, capex: 1000000, tariffMode: 'energy_only'
});

/**
 * Station-level, unlevered annual operating cash before tax, depreciation,
 * financing, replacement capex and incentives. Sessions average over ALL
 * calendar days: do not multiply this volume by a second uptime assumption.
 * Delivered energy is battery-side; grid losses increase purchased energy.
 * The service fee is assumed to apply to delivered kWh; confirm contract basis.
 */
export function calculateEconomics(input = {}) {
  const x = { ...DEFAULT_SCENARIO, ...input };
  for (const key of Object.keys(DEFAULT_SCENARIO).filter(k => k !== 'tariffMode')) {
    if (typeof x[key] !== 'number' || !Number.isFinite(x[key]) || x[key] < 0) {
      throw new RangeError(`${key} must be a finite non-negative number`);
    }
  }
  if (!Number.isInteger(x.stalls) || x.stalls < 1 || x.stalls > 200) throw new RangeError('stalls must be an integer from 1 to 200');
  if (x.kwhPerSession <= 0) throw new RangeError('kwhPerSession must be positive');
  if (x.lossFraction >= 1) throw new RangeError('lossFraction must be less than 1');
  if (!['energy_only', 'fully_burdened'].includes(x.tariffMode)) throw new RangeError('Unknown tariffMode');
  if (x.tariffMode === 'fully_burdened' && x.demandPerKwMonth !== 0) {
    throw new RangeError('All-in electricity rate includes demand charges: set demandPerKwMonth to zero');
  }
  const annualKwh = x.stalls * x.sessionsPerStallDay * 365 * x.kwhPerSession;
  const gridKwh = annualKwh / (1 - x.lossFraction);
  const revenue = annualKwh * x.retailPerKwh;
  const energyCost = gridKwh * x.energyPerKwh;
  const serviceCost = annualKwh * x.servicePerKwh;
  const demandCost = x.billedPeakKw * x.demandPerKwMonth * 12;
  const fixedCost = x.fixedMonthly * 12;
  const operatingCash = revenue - energyCost - serviceCost - demandCost - fixedCost;
  const marginPerKwh = x.retailPerKwh - x.energyPerKwh / (1 - x.lossFraction) - x.servicePerKwh;
  const breakEvenSessionsPerStallDay = marginPerKwh > 0
    ? (demandCost + fixedCost) / (365 * x.stalls * x.kwhPerSession * marginPerKwh)
    : null;
  return {
    annualKwh, gridKwh, revenue, energyCost, serviceCost, demandCost, fixedCost,
    operatingCash, marginPerKwh, breakEvenSessionsPerStallDay,
    simplePaybackYears: operatingCash > 0 ? x.capex / operatingCash : null
  };
}

/** WGS84 points; spherical great-circle miles, NOT driving distance. */
export function haversineMiles(a, b) {
  for (const point of [a, b]) {
    if (!Number.isFinite(point.lat) || !Number.isFinite(point.lon) || Math.abs(point.lat) > 90 || Math.abs(point.lon) > 180) {
      throw new RangeError('Invalid coordinate');
    }
  }
  const rad = d => d * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 3958.7613 * 2 * Math.atan2(Math.sqrt(Math.min(1, h)), Math.sqrt(Math.max(0, 1 - h)));
}

/** Safe CSV cell for spreadsheet import, including formula-like leading text. */
export function csvCell(value) {
  let s = String(value ?? '');
  if (!(typeof value === 'number' && Number.isFinite(value)) && /^[\s]*[=+@-]/.test(s)) s = `'${s}`;
  return `"${s.replaceAll('"', '""')}"`;
}
