import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCapitalSupport } from '../support-model.js';
import { calculateProject } from '../model.js';

const input = {stalls:1,sessionsPerStallDay:1,kwhPerSession:1,retailPerKwh:200/365,
 energyPerKwh:0,lossFraction:0,servicePerKwh:0,demandPerKwMonth:0,billedPeakKw:0,
 fixedMonthly:0,capex:1000,tariffMode:'fully_burdened',constructionYears:1,
 preOpeningMonthly:0,firstYearRamp:1,sustainingCapexFraction:0,
 discountRate:.1,operatingYears:10};

test('dated capital support preserves gross operating and replacement costs',()=>{
 const x={...input,sustainingCapexFraction:.02};
 const no=calculateProject(x), supported=calculateCapitalSupport(x,.8,1);
 assert.equal(supported.annualSustainingCapex,20);
 assert.equal(supported.stabilizedFreeCash,no.stabilizedFreeCash);
 assert.equal(supported.grossFundingBeforeReimbursement,1000);
 assert.ok(Math.abs(supported.npv-no.npv-800/1.1**2)<1e-9);
});
test('reimbursement cannot cause payback before cash is received',()=>{
 assert.equal(calculateCapitalSupport(input,.8,0).projectPaybackYears,2);
 assert.equal(calculateCapitalSupport(input,.8,3).projectPaybackYears,4);
 assert.ok(calculateCapitalSupport(input,.8,3).npv<calculateCapitalSupport(input,.8,0).npv);
 assert.equal(calculateCapitalSupport(input,0,0).projectPaybackYears,calculateProject(input).projectPaybackYears);
});
test('capital subsidy does not repair negative recurring cash',()=>{
 const r=calculateCapitalSupport({...input,fixedMonthly:300/12},.8,0);
 assert.equal(r.stabilizedFreeCash,-100);
 assert.equal(r.projectPaybackYears,null);
 assert.throws(()=>calculateCapitalSupport(input,1.01,0),RangeError);
 assert.throws(()=>calculateCapitalSupport(input,.8,-1),RangeError);
});
test('temporary bill reimbursements stop at cap and do not change post-expiry cash',()=>{
 const x={...input,energyPerKwh:100/365};
 const r=calculateCapitalSupport(x,0,0,{fractionByYear:[1,.8,.6,.4,.2],cap:150});
 assert.deepEqual(r.utilityRebates.map(v=>v.rebate),[100,50,0,0,0,0,0,0,0,0]);
 assert.equal(r.utilitySupportReceived,150);
 assert.equal(r.stabilizedFreeCash,100);
 const base=calculateProject(x);
 assert.ok(Math.abs(r.npv-base.npv-100/1.1**2-50/1.1**3)<1e-9);
});
test('later losses invalidate apparent payback created by a grant',()=>{
 const r=calculateCapitalSupport({...input,firstYearRamp:0,fixedMonthly:100/12},1,0);
 assert.equal(r.projectPaybackYears,3);
 const loss=calculateCapitalSupport({...input,fixedMonthly:300/12},1,0);
 assert.equal(loss.projectPaybackYears,null);
 assert.throws(()=>calculateCapitalSupport({...input,discountRate:undefined},.3,0),RangeError);
});
