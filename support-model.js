import { calculateProject, calculateEconomics } from './model.js';

/** Capital reimbursement is a dated cash receipt, not a lower gross asset cost.
 * This sensitivity does not assert eligibility, an award, financing or tax treatment.
 * Operating cash and replacement are calculated on the original gross-cost design.
 */
export function calculateCapitalSupport(input, fraction = 0, delayYears = 0, utilitySupport = null) {
  if (['constructionYears','operatingYears','discountRate','capex','sessionsPerStallDay'].some(k=>!Number.isFinite(input[k]))) throw new RangeError('Explicit project inputs are required');
  if (!Number.isFinite(fraction) || fraction < 0 || fraction > 1) throw new RangeError('Invalid capital support fraction');
  if (!Number.isFinite(delayYears) || delayYears < 0 || delayYears > input.operatingYears) throw new RangeError('Invalid reimbursement delay');
  const gross = calculateProject(input);
  const grant = input.capex * fraction;
  const receiptTime = input.constructionYears + delayYears;
  if (utilitySupport && (!Number.isFinite(utilitySupport.cap) || utilitySupport.cap < 0 || !Array.isArray(utilitySupport.fractionByYear) || utilitySupport.fractionByYear.some(v=>!Number.isFinite(v)||v<0||v>1))) throw new RangeError('Invalid temporary utility support');
  let remainingUtilitySupport = utilitySupport?.cap || 0;
  const utilityRebates = [];
  let utilitySupportNpv = 0;
  let balance = -input.capex - gross.preOpeningHoldingCost;
  let payback = balance === 0 ? 0 : null;
  let grantPaid = false;
  const receipt = () => {
    const before = balance;
    balance += grant;
    if (payback === null && before < 0 && balance >= 0) payback = receiptTime;
    grantPaid = true;
  };
  if (delayYears === 0) receipt();
  for (const cf of gross.cashflows) {
    const start = cf.time - 1;
    const advance = (from, to) => {
      const before = balance;
      balance += cf.cash * (to - from);
      // Temporary support must not report lasting recovery if later losses
      // drive cumulative cash below zero again within the modeled horizon.
      if (balance < 0) payback = null;
      if (payback === null && before < 0 && balance >= 0 && cf.cash > 0) payback = from - before / cf.cash;
    };
    if (!grantPaid && receiptTime <= cf.time) {
      advance(start, receiptTime);
      receipt();
      advance(receiptTime, cf.time);
    } else advance(start, cf.time);
    // The actual program can reimburse quarterly. This sensitivity assumes
    // annual reimbursement after bills are paid and cannot count it in perpetuity.
    const bill = calculateEconomics({...input,sessionsPerStallDay:input.sessionsPerStallDay*cf.ramp}).electricityCost;
    const rebate = Math.min(remainingUtilitySupport, bill*(utilitySupport?.fractionByYear[cf.year-1] || 0));
    remainingUtilitySupport -= rebate;
    const beforeRebate = balance;
    balance += rebate;
    if (payback===null && beforeRebate<0 && balance>=0) payback=cf.time;
    utilityRebates.push({year:cf.year, bill, rebate, cashAfterRebate:cf.cash+rebate});
    utilitySupportNpv += rebate/(1+input.discountRate)**cf.time;
  }
  return {
    grossCapex: input.capex, capitalSupport: grant, fraction, receiptTime,
    grossFundingBeforeReimbursement: input.capex + gross.preOpeningHoldingCost,
    unreimbursedCapital: input.capex - grant,
    operatingCash: gross.operatingCash,
    annualSustainingCapex: gross.annualSustainingCapex,
    stabilizedFreeCash: gross.stabilizedFreeCash,
    projectPaybackYears: payback,
    npv: gross.npv + grant / (1 + input.discountRate) ** receiptTime + utilitySupportNpv,
    finalCumulativeCash: balance,
    ...(utilitySupport ? {utilityRebates, utilitySupportReceived:utilitySupport.cap-remainingUtilitySupport} : {})
  };
}
