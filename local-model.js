import {calculateEconomics, assessScenarioHurdle} from './model.js';

/** Dated tariff sensitivity, not a connection offer or a calibrated forecast.
 * Rates are held constant in real terms except the explicit introductory period.
 * Revenue still depends on assumed billed energy; reported sessions are not sales.
 */
export function calculateLocalProject(input, plan, utilityStress=1, capitalReimbursement=0) {
  if (!plan?.first || !plan?.later || !Number.isInteger(plan.firstYears) || plan.firstYears<0 || !Number.isFinite(utilityStress)||utilityStress<=0)throw new RangeError('Explicit tariff periods required');
  if(!Number.isFinite(capitalReimbursement)||capitalReimbursement<0||capitalReimbursement>input.capex)throw new RangeError('Invalid conditional reimbursement');
  let balance=-input.capex-input.preOpeningMonthly*12*input.constructionYears;
  const holding=input.preOpeningMonthly*12*input.constructionYears;
  let npv=-input.capex-holding/(1+input.discountRate)**(input.constructionYears/2),payback=balance===0?0:null;
  const cashflows=[];
  for(let year=1;year<=input.operatingYears;year++) {
    const tariff=year<=plan.firstYears?plan.first:plan.later;
    const ramp=year===1?input.firstYearRamp:1;
    const rates={tariffMode:'energy_only',energyPerKwh:tariff.energyPerKwh*utilityStress,
      demandPerKwMonth:tariff.demandPerKwMonth*utilityStress,billedPeakKw:tariff.billedPeakKw,
      utilityFixedMonthly:tariff.utilityFixedMonthly*utilityStress,utilityFixedDaily:0,demandFreeKw:0,minimumBillDaily:0};
    const operating=calculateEconomics({...input,...rates,sessionsPerStallDay:input.sessionsPerStallDay*ramp});
    const operatingFreeCash=operating.operatingCash-input.capex*input.sustainingCapexFraction,receipt=year===1?capitalReimbursement:0,cash=operatingFreeCash+receipt,before=balance;
    balance+=cash;const time=input.constructionYears+year;
    if(balance<0)payback=null;
    if(payback===null&&before<0&&balance>=0&&cash>0)payback=before+operatingFreeCash>=0&&operatingFreeCash>0?time-1-before/operatingFreeCash:time;
    npv+=cash/(1+input.discountRate)**time;
    cashflows.push({year,time,ramp,rates,annualKwh:operating.annualKwh,gridKwh:operating.gridKwh,revenue:operating.revenue,energyCost:operating.energyCost,demandCost:operating.demandCost,utilityFixedCost:operating.utilityFixedCost,electricityCost:operating.electricityCost,serviceCost:operating.serviceCost,fixedCost:operating.fixedCost,replacementAllowance:input.capex*input.sustainingCapexFraction,operatingFreeCash,capitalReceipt:receipt,cash,cumulative:balance});
  }
  return {npv,projectPaybackYears:payback,stabilizedFreeCash:cashflows.at(-1).operatingFreeCash,annualUtilitySubtotal:cashflows.at(-1).electricityCost,preOpeningHoldingCost:holding,finalCumulativeCash:balance,cashflows};
}

export function analyzeLocalTariff(hypothesis,plan) {
  const evaluate=(key,q=null)=>{const inputs={...hypothesis.analysis.scenarios[key].inputs};if(q!==null)inputs.sessionsPerStallDay=q/inputs.kwhPerSession;return {inputs,outputs:calculateLocalProject(inputs,plan,key==='conservative'?1.25:1)};};
  const scenarios=Object.fromEntries(['conservative','base','optimistic'].map(k=>[k,evaluate(k)]));
  const paired=q=>({base:evaluate('base',q),conservative:evaluate('conservative',q*.7)});
  const physicalBaseCap=(plan.maxGridEnergyDay ?? plan.later.billedPeakKw*24)*(1-hypothesis.analysis.scenarios.base.inputs.lossFraction)/4;
  const ok=q=>assessScenarioHurdle(paired(q)).passed;
  let requiredPairedKwhPerPostDay=null;
  if(ok(physicalBaseCap)){let lo=0,hi=physicalBaseCap;for(let i=0;i<80;i++){const mid=(lo+hi)/2;if(ok(mid))hi=mid;else lo=mid;}requiredPairedKwhPerPostDay=hi;}
  // Source SPD is a whole-station number with unknown paid mix and kWh.
  // These are revenue-equivalent transfer tests, never fitted site forecasts.
  const transfers=[9,42,59].flatMap(stationSessions=>[22,35].map(kwhPerSession=>{
    const inputs={...scenarios.base.inputs,kwhPerSession,sessionsPerStallDay:stationSessions/4};
    return {stationSessions,kwhPerSession,kwhPerPostDay:stationSessions*kwhPerSession/4,assumedBillableFraction:1,inputs,outputs:calculateLocalProject(inputs,plan)};
  }));
  const delayStress={inputs:{...scenarios.base.inputs,constructionYears:2},outputs:calculateLocalProject({...scenarios.base.inputs,constructionYears:2},plan)};
  const conditionalCapital=plan.unawardedGrantCeiling?{amount:plan.unawardedGrantCeiling,receipt:'end_of_first_operating_year',bookedAward:0,outputs:calculateLocalProject(scenarios.base.inputs,plan,1,plan.unawardedGrantCeiling),retail42Outputs:calculateLocalProject({...scenarios.base.inputs,sessionsPerStallDay:42/4,kwhPerSession:35},plan,1,plan.unawardedGrantCeiling)}:null;
  return {scenarios,delayStress,conditionalCapital,numericHurdle:assessScenarioHurdle(scenarios),requiredPairedKwhPerPostDay,physicalBaseCap,transfers,evidenceAdmitted:false};
}
