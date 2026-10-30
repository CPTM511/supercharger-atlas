import {calculateProject, assessScenarioHurdle} from './model.js';
import {inverseConditions} from './inverse.js';

// Frozen before outcomes were inspected. These are author-selected joint
// stresses, not calibrated confidence intervals or local demand percentiles.
export const HYPOTHESIS_FACTORS = Object.freeze({
  conservative:{energy:.7,capital:1.35,utility:1.25,fixedMonthly:2000,constructionYears:1.5,ramp:.5,reserve:.02},
  base:{energy:1,capital:1.2,utility:1,fixedMonthly:1000,constructionYears:1,ramp:.75,reserve:.015},
  optimistic:{energy:1.2,capital:1.1,utility:1,fixedMonthly:500,constructionYears:.75,ramp:1,reserve:.01}
});

export function buildHypothesis(estimate) {
  for(const k of ['kwhPerPostDay','retailPerKwh','allInGridPerKwh','fourPostCapital']) {
    if(!Number.isFinite(estimate[k])||estimate[k]<=0)throw new RangeError(`Missing positive vendor estimate: ${k}`);
  }
  const scenarios=Object.fromEntries(Object.entries(HYPOTHESIS_FACTORS).map(([key,f])=>{
    const inputs={stalls:4,sessionsPerStallDay:estimate.kwhPerPostDay*f.energy/35,kwhPerSession:35,
      retailPerKwh:estimate.retailPerKwh,energyPerKwh:estimate.allInGridPerKwh*f.utility,
      lossFraction:.15,servicePerKwh:.10,tariffMode:'fully_burdened',demandPerKwMonth:0,billedPeakKw:0,
      utilityFixedMonthly:0,utilityFixedDaily:0,demandFreeKw:0,minimumBillDaily:0,
      capex:estimate.fourPostCapital*f.capital,fixedMonthly:f.fixedMonthly,preOpeningMonthly:f.fixedMonthly,
      constructionYears:f.constructionYears,firstYearRamp:f.ramp,sustainingCapexFraction:f.reserve,
      discountRate:.10,operatingYears:10};
    return [key,{inputs,outputs:calculateProject(inputs)}];
  }));
  return {scenarios,numericHurdle:assessScenarioHurdle(scenarios),
    inverse:Object.fromEntries(['base','conservative'].map(k=>[k,inverseConditions(scenarios[k].inputs,k)])),
    // No result of this helper can grant investment qualification.
    qualification:'pending',evidenceAdmitted:false};
}
