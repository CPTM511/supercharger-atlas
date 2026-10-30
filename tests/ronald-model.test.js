import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {analyzeRonaldTarget} from '../ronald-model.js';
const data=JSON.parse(fs.readFileSync(new URL('../data/candidates.json',import.meta.url))),c=data.candidates.find(c=>c.id==='heb-ronaldreagan');
const settings={sessionsPerDay:59,kwhPerSession:35,lossFraction:.15,storeHours:17,capKw:150,tou17h:.06431968267526189};
const a=analyzeRonaldTarget(c.hypothesis,c.localValidation.tariffPlans[0],settings);
test('target reproduces the existing 59-session base case without double-counting TCOS',()=>{
  const prior=c.localValidation.tariffPlans[0].analysis.transfers.find(x=>x.stationSessions===59&&x.kwhPerSession===35).outputs;
  assert.ok(Math.abs(a.scenarios.base.outputs.npv-prior.npv)<1e-6);
  assert.ok(Math.abs(a.scenarios.base.outputs.projectPaybackYears-prior.projectPaybackYears)<1e-9);
  assert.equal(a.hurdle.passed,false);assert.equal(a.hurdle.tests.conservativePayback,false);assert.equal(a.evidenceAdmitted,false);
});
test('one missed summer peak changes the annual average, not just one monthly invoice',()=>{
  const x=a.cpCases.find(x=>x.missedMonths===1);assert.equal(x.cp,262.5);assert.ok(Math.abs(x.addedAnnualTcos-8248.5)<1e-8);
  assert.equal(x.outputs.cashflows[0].electricityCost,a.scenarios.base.outputs.cashflows[0].electricityCost);
  assert.ok(Math.abs(x.outputs.cashflows[1].electricityCost-a.scenarios.base.outputs.cashflows[1].electricityCost-8248.5)<1e-6);
});
test('energy capacity and added-cost cases preserve units and replacement on gross assets',()=>{
  assert.equal(a.energy.deliveredDay,2065);assert.ok(Math.abs(a.energy.gridDay-2429.4117647058824)<1e-8);
  assert.ok(a.energy.storeWindowCapacityFraction>.95&&a.energy.storeWindowCapacityFraction<1);
  assert.ok(a.operatingHoursCase.outputs.npv<a.scenarios.base.outputs.npv);
  assert.equal(a.costCases[2].outputs.cashflows[1].replacementAllowance,764000*.015);
  assert.ok(a.costCases[2].outputs.npv<a.costCases[0].outputs.npv);
});

test('five-port normalization is distinct from the 59-session upside target',()=>{
  const x=a.portCases.find(x=>x.sessionEnergy===35);assert.ok(Math.abs(x.stationSessions-47.2)<1e-12);
  assert.ok(x.outputs.projectPaybackYears>6);assert.ok(x.outputs.npv>0);
  assert.ok(x.outputs.projectPaybackYears>a.scenarios.base.outputs.projectPaybackYears);
});
