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

/** Screening policy, not an industry standard or a Tesla investment criterion. */
export const INVESTMENT_POLICY = Object.freeze({
  basePaybackMaxYears: 6, conservativePaybackMaxYears: 8,
  discountRate: 0.10, operatingYears: 10,
  requiredEvidence: ['site_control', 'grid_and_tariff', 'installed_cost', 'demand_and_price', 'permits_and_access', 'commercial_terms']
});

/** Constant-dollar, unlevered pre-income-tax project cash flows.
 * Capex paid at t=0; annual cash received at year end after construction.
 * No subsidy, growth, financing or terminal value. Replacement allowance is
 * an explicit assumed cash deduction, not a supplier maintenance charge.
 */
export function calculateProject(input) {
  const x = { ...input };
  const p = { constructionYears: 1, firstYearRamp: 0.8, sustainingCapexFraction: 0.015,
    discountRate: INVESTMENT_POLICY.discountRate, operatingYears: INVESTMENT_POLICY.operatingYears, preOpeningMonthly: 0, ...x };
  for (const k of ['constructionYears','firstYearRamp','sustainingCapexFraction','discountRate','operatingYears','preOpeningMonthly']) {
    if (!Number.isFinite(p[k]) || p[k] < 0) throw new RangeError(`Invalid ${k}`);
  }
  if (p.firstYearRamp > 1 || p.sustainingCapexFraction > 1 || p.discountRate > 1 || !Number.isInteger(p.operatingYears) || p.operatingYears < 1 || p.operatingYears > 50) throw new RangeError('Invalid project horizon or ratio');
  const steady = calculateEconomics(x);
  const annualSustainingCapex = p.capex * p.sustainingCapexFraction;
  if (!Number.isFinite(annualSustainingCapex)) throw new RangeError('Explicit capex is required');
  const stabilizedFreeCash = steady.operatingCash - annualSustainingCapex;
  const preOpeningHoldingCost = p.preOpeningMonthly * 12 * p.constructionYears;
  let balance = -p.capex - preOpeningHoldingCost;
  let npv = -p.capex - preOpeningHoldingCost / (1 + p.discountRate) ** (p.constructionYears / 2);
  let projectPaybackYears = balance === 0 ? 0 : null;
  const cashflows = [];
  for (let year = 1; year <= p.operatingYears; year++) {
    const ramp = year === 1 ? p.firstYearRamp : 1;
    const result = calculateEconomics({...x, sessionsPerStallDay: x.sessionsPerStallDay * ramp});
    const cash = result.operatingCash - annualSustainingCapex;
    const priorBalance = balance;
    balance += cash;
    const time = p.constructionYears + year;
    npv += cash / (1 + p.discountRate) ** time;
    // Linear interpolation assumes cash accrues evenly within each operating year.
    if (projectPaybackYears === null && priorBalance < 0 && balance >= 0 && cash > 0) projectPaybackYears = p.constructionYears + year - 1 + (-priorBalance / cash);
    cashflows.push({year, time, ramp, operatingCash: result.operatingCash, replacementAllowance: annualSustainingCapex, cash, cumulative: balance});
  }
  return {...steady, preOpeningHoldingCost, annualSustainingCapex, stabilizedFreeCash, projectPaybackYears, npv, cashflows,
    horizonYears: p.constructionYears + p.operatingYears, discountRate: p.discountRate};
}

export function assessScenarioHurdle(scenarios, policy = INVESTMENT_POLICY) {
  const base = scenarios.base.outputs, downside = scenarios.conservative.outputs;
  const tests = {
    basePayback: base.projectPaybackYears !== null && base.projectPaybackYears <= policy.basePaybackMaxYears,
    conservativePayback: downside.projectPaybackYears !== null && downside.projectPaybackYears <= policy.conservativePaybackMaxYears,
    baseNpv: base.npv >= 0,
    conservativeCash: downside.stabilizedFreeCash > 0
  };
  return {passed: Object.values(tests).every(Boolean), tests};
}

/** Unknown evidence is never a pass. Optimistic economics cannot rescue failure. */
export function classifyCandidate({evidence, scenarios, fatalConflict = false}, policy = INVESTMENT_POLICY) {
  const hurdle = assessScenarioHurdle(scenarios, policy);
  const missing = policy.requiredEvidence.filter(key => evidence?.[key] !== 'verified');
  if (fatalConflict) return {decision:'rejected', missing, hurdle};
  if (missing.length) return {decision:'pending', missing, hurdle};
  return {decision:hurdle.passed ? 'qualified' : 'rejected', missing, hurdle};
}
