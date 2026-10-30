import test from 'node:test';
import assert from 'node:assert/strict';
import {inverseConditions} from '../inverse.js';
import {calculateProject} from '../model.js';

const x={stalls:8,sessionsPerStallDay:4,kwhPerSession:40,retailPerKwh:.45,energyPerKwh:.15,
 lossFraction:.08,servicePerKwh:.10,demandPerKwMonth:0,billedPeakKw:0,tariffMode:'fully_burdened',
 fixedMonthly:2500,preOpeningMonthly:2500,capex:1128000,constructionYears:1,firstYearRamp:.75,
 sustainingCapexFraction:.015,discountRate:.10,operatingYears:10};
test('inverse minimum passes, just below fails; kWh/session scaling preserves required energy',()=>{
 const a=inverseConditions(x,'base'), b=inverseConditions({...x,kwhPerSession:20},'base');
 assert.ok(Math.abs(a.requiredKwhPerStallDay-b.requiredKwhPerStallDay)<1e-8);
 const upper=calculateProject({...x,sessionsPerStallDay:a.requiredSessionsPerStallDay*1.000001});
 const lower=calculateProject({...x,sessionsPerStallDay:a.requiredSessionsPerStallDay*.999999});
 assert.ok(upper.projectPaybackYears<=6&&upper.npv>=0);
 assert.ok(lower.projectPaybackYears>6||lower.npv<0||lower.projectPaybackYears===null);
});
test('maximum capital boundary and impossible single-input remedies are distinct',()=>{
 const a=inverseConditions(x,'base');
 assert.ok(a.maxCapex>0&&a.maxCapex<x.capex);
 assert.equal(a.maxConstructionYears,null);
 const y=calculateProject({...x,capex:a.maxCapex*1.000001});
 assert.ok(y.projectPaybackYears>6||y.npv<0||y.projectPaybackYears===null);
 const z=inverseConditions({...x,retailPerKwh:0},'conservative');
 assert.equal(z.requiredSessionsPerStallDay,null);
 assert.equal(z.maxCapex,null);
});
test('zero upfront cost does not erase ramp losses from the payback clock',()=>{
 const result=calculateProject({...x,stalls:1,sessionsPerStallDay:1,kwhPerSession:1,
  retailPerKwh:110/365,energyPerKwh:0,servicePerKwh:0,fixedMonthly:100/12,
  preOpeningMonthly:0,capex:0,firstYearRamp:5/11,sustainingCapexFraction:0});
 assert.ok(Math.abs(result.projectPaybackYears-7)<1e-9);
 assert.ok(result.npv>0);
});
