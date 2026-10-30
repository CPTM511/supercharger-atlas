import {calculateProject, INVESTMENT_POLICY} from './model.js';

/** Conditional one-variable boundaries, never demand forecasts or quotes.
 * Null means no nonnegative solution within the declared search domain.
 * Every other input remains fixed; individual boundaries cannot be combined.
 */
export function inverseConditions(inputs, scenario) {
  if (!['base','conservative'].includes(scenario)) throw new RangeError('No optimistic admission gate');
  const limit = scenario === 'base' ? INVESTMENT_POLICY.basePaybackMaxYears : INVESTMENT_POLICY.conservativePaybackMaxYears;
  const passes = x => {
    const r = calculateProject(x);
    return r.projectPaybackYears !== null && r.projectPaybackYears <= limit &&
      r.stabilizedFreeCash > 0 && (scenario !== 'base' || r.npv >= 0);
  };
  const minimum = (change, ceiling) => {
    if (!passes(change(ceiling))) return null;
    let lo = 0, hi = ceiling;
    if (passes(change(0))) return 0;
    for (let i=0;i<70;i++) {const m=(lo+hi)/2; if(passes(change(m)))hi=m;else lo=m;}
    return hi;
  };
  const maximum = (change, ceiling) => {
    if (!passes(change(0))) return null;
    if (passes(change(ceiling))) throw new RangeError('Search ceiling does not bracket boundary');
    let lo=0,hi=ceiling;
    for(let i=0;i<70;i++){const m=(lo+hi)/2;if(passes(change(m)))lo=m;else hi=m;}
    return lo;
  };
  const sessions = minimum(n=>({...inputs,sessionsPerStallDay:n}),1e6);
  return {
    requiredSessionsPerStallDay:sessions,
    requiredSessionsPerSiteDay:sessions===null?null:sessions*inputs.stalls,
    requiredKwhPerStallDay:sessions===null?null:sessions*inputs.kwhPerSession,
    minimumAverageGridKw:sessions===null?null:sessions*inputs.kwhPerSession*inputs.stalls/(24*(1-inputs.lossFraction)),
    maxCapex:maximum(n=>({...inputs,capex:n}),1e9),
    maxAllInGridPrice:inputs.tariffMode==='fully_burdened'?maximum(n=>({...inputs,energyPerKwh:n}),10):null,
    maxFixedAndHoldingMonthly:maximum(n=>({...inputs,fixedMonthly:n,preOpeningMonthly:n}),1e7),
    maxConstructionYears:maximum(n=>({...inputs,constructionYears:n}),limit),
    paybackLimitYears:limit,
    searchDomain:{sessionsPerStallDayMax:1e6,capexMax:1e9,gridPriceMax:10,monthlyCostMax:1e7,constructionYearsMax:limit}
  };
}
