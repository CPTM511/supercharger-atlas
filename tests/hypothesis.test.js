import test from 'node:test';
import assert from 'node:assert/strict';
import {buildHypothesis,HYPOTHESIS_FACTORS} from '../hypothesis-model.js';
const estimate={kwhPerPostDay:298,retailPerKwh:.49,allInGridPerKwh:.10,fourPostCapital:470000};
test('vendor-anchored alternatives retain gross costs and cannot confer qualification',()=>{
 const h=buildHypothesis(estimate);
 assert.equal(h.scenarios.base.inputs.capex,564000);
 assert.ok(Math.abs(h.scenarios.base.outputs.annualKwh-4*298*365)<1e-8);
 assert.equal(h.scenarios.base.inputs.demandPerKwMonth,0);
 assert.equal(h.qualification,'pending');assert.equal(h.evidenceAdmitted,false);
 assert.equal(HYPOTHESIS_FACTORS.conservative.energy,.7);
 const bright=buildHypothesis({...estimate,kwhPerPostDay:2000});
 assert.equal(bright.numericHurdle.passed,true);assert.equal(bright.qualification,'pending');
});
test('missing or transient zero vendor data is not a zero-demand forecast',()=>{
 for(const key of Object.keys(estimate))assert.throws(()=>buildHypothesis({...estimate,[key]:0}),RangeError);
});
