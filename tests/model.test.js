import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateEconomics, DEFAULT_SCENARIO, haversineMiles, csvCell} from '../model.js';

test('cash reconciles with independently calculated energy, losses and annual costs', () => {
  const x = calculateEconomics({stalls: 2, sessionsPerStallDay: 5, kwhPerSession: 20,
    retailPerKwh: .5, energyPerKwh: .1, lossFraction: .2, servicePerKwh: .05,
    demandPerKwMonth: 10, billedPeakKw: 100, fixedMonthly: 100, capex: 100000});
  assert.equal(x.annualKwh, 73000);
  assert.equal(x.gridKwh, 91250);
  assert.equal(x.revenue, 36500);
  assert.equal(x.energyCost, 9125);
  assert.equal(x.demandCost, 12000);
  assert.equal(x.fixedCost, 1200);
  assert.equal(x.operatingCash, 10525);
  assert.equal(x.simplePaybackYears, 100000 / 10525);
});
test('computed break-even volume produces zero operating cash', () => {
  const v = calculateEconomics().breakEvenSessionsPerStallDay;
  assert.ok(Math.abs(calculateEconomics({sessionsPerStallDay: v}).operatingCash) < 1e-7);
});
test('non-positive contribution cannot be solved by more volume', () => {
  const x = calculateEconomics({retailPerKwh: .05});
  assert.equal(x.breakEvenSessionsPerStallDay, null);
  assert.equal(x.simplePaybackYears, null);
});
test('zero volume still incurs demand and fixed costs', () => {
  const x = calculateEconomics({sessionsPerStallDay: 0});
  assert.equal(x.revenue, 0);
  assert.equal(x.operatingCash, -102000);
});
test('all-in tariff prevents adding demand charges twice', () => {
  assert.throws(() => calculateEconomics({tariffMode: 'fully_burdened'}), /includes demand/);
  assert.equal(calculateEconomics({tariffMode: 'fully_burdened', demandPerKwMonth: 0}).demandCost, 0);
});
test('bad inputs fail explicitly instead of producing misleading output', () => {
  for (const x of [{lossFraction: 1}, {stalls: 1.5}, {energyPerKwh: NaN}, {sessionsPerStallDay: -1}, {kwhPerSession: 0}, {capex: Infinity}]) assert.throws(() => calculateEconomics(x), RangeError);
  assert.equal(DEFAULT_SCENARIO.stalls, 8);
});
test('great-circle distances use miles and preserve symmetry', () => {
  const a = {lat: 0, lon: 0}, b = {lat: 0, lon: 1};
  assert.ok(Math.abs(haversineMiles(a, b) - 69.0934) < .001);
  assert.equal(haversineMiles(a, b), haversineMiles(b, a));
  assert.equal(haversineMiles(a, a), 0);
  assert.throws(() => haversineMiles({lat: null, lon: 0}, b), RangeError);
});
test('CSV escapes formulas but preserves numeric coordinates', () => {
  assert.equal(csvCell(-97.114977), '"-97.114977"');
  assert.equal(csvCell('-1+2'), '"\'-1+2"');
  assert.equal(csvCell('=SUM(A1)'), '"\'=SUM(A1)"');
  assert.equal(csvCell('A, "B"'), '"A, ""B"""');
});
