import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateProject, assessScenarioHurdle, classifyCandidate, INVESTMENT_POLICY} from '../model.js';
const inputs={stalls:1,sessionsPerStallDay:1,kwhPerSession:100,retailPerKwh:1,energyPerKwh:0,lossFraction:0,servicePerKwh:0,demandPerKwMonth:0,billedPeakKw:0,fixedMonthly:0,capex:73000,tariffMode:'fully_burdened',constructionYears:1,firstYearRamp:0.5,sustainingCapexFraction:0,discountRate:0.1,operatingYears:4};
test('project cash flows reconcile independently with construction, ramp and capital recovery',()=>{
 const x=calculateProject(inputs);
 assert.deepEqual(x.cashflows.map(c=>c.cash),[18250,36500,36500,36500]);
 assert.equal(x.projectPaybackYears,3.5);
 const manual=-73000+18250/1.1**2+36500/1.1**3+36500/1.1**4+36500/1.1**5;
 assert.ok(Math.abs(x.npv-manual)<1e-8);
});
test('replacement allowance and horizon prevent fictitious payback',()=>{
 const x=calculateProject({...inputs,capex:500000,sustainingCapexFraction:.02});
 assert.equal(x.annualSustainingCapex,10000);assert.equal(x.stabilizedFreeCash,26500);
 assert.equal(x.projectPaybackYears,null);assert.ok(x.npv<0);
});
const good={projectPaybackYears:5,npv:1,stabilizedFreeCash:1};
const scenarios=(base=good,conservative=good)=>({base:{outputs:base},conservative:{outputs:conservative},optimistic:{outputs:{...good,npv:1000000}}});
test('unknown key evidence excludes even a profitable scenario from both rankings',()=>{
 assert.equal(classifyCandidate({evidence:{},scenarios:scenarios()}).decision,'pending');
 const evidence=Object.fromEntries(INVESTMENT_POLICY.requiredEvidence.map(k=>[k,'verified']));
 assert.equal(classifyCandidate({evidence,scenarios:scenarios()}).decision,'qualified');
 assert.equal(classifyCandidate({evidence,scenarios:scenarios({...good,projectPaybackYears:6.001})}).decision,'rejected');
 assert.equal(classifyCandidate({evidence:{},scenarios:scenarios(),fatalConflict:true}).decision,'rejected');
});
test('upside cannot rescue downside failure; caps use unrounded values',()=>{
 assert.equal(assessScenarioHurdle(scenarios(good,{...good,projectPaybackYears:8.001})).passed,false);
 assert.equal(assessScenarioHurdle(scenarios({...good,npv:-.01})).passed,false);
 assert.equal(assessScenarioHurdle(scenarios({...good,projectPaybackYears:6},{...good,projectPaybackYears:8})).passed,true);
});
test('invalid project horizons and ramp are rejected',()=>{
 for(const bad of [{firstYearRamp:1.1},{operatingYears:0},{constructionYears:-1},{discountRate:NaN}]) assert.throws(()=>calculateProject({...inputs,...bad}),RangeError);
});

test('pre-opening holding costs occur before revenue and are included in payback',()=>{
 const x=calculateProject({...inputs,preOpeningMonthly:3650/12});
 assert.equal(x.preOpeningHoldingCost,3650);
 assert.ok(Math.abs(x.projectPaybackYears-3.6)<1e-10);
 const baseline=calculateProject(inputs);
 assert.ok(Math.abs(x.npv-(baseline.npv-3650/1.1**.5))<1e-8);
});
