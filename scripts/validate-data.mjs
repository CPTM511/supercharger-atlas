import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {haversineMiles, classifyCandidate, INVESTMENT_POLICY} from '../model.js';

const data = JSON.parse(fs.readFileSync(new URL('../data/candidates.json', import.meta.url)));
const supply = JSON.parse(fs.readFileSync(new URL('../data/supply-snapshot.json', import.meta.url)));
const fail = (condition, message) => assert.ok(condition, message);
const dataHash = createHash('sha256').update(fs.readFileSync(new URL('../data/candidates.json', import.meta.url))).digest('hex');
for (const suffix of ['', '-zh']) {
  const brief = fs.readFileSync(new URL(`../downloads/charge-atlas-brief${suffix}.pdf`, import.meta.url));
  fail(brief.subarray(0,5).toString() === '%PDF-' && brief.includes(Buffer.from(`data-sha256=${dataHash}`)), `PDF brief ${suffix || 'en'} is stale: rebuild from current data`);
}
const sourceIds = new Set(data.sources.map(s => s.id));
fail(sourceIds.size === data.sources.length, 'Source IDs must be unique');
for (const s of data.sources) {
  const u = new URL(s.url);
  fail(['http:', 'https:'].includes(u.protocol) && !u.username && !u.password, `Invalid public URL: ${s.id}`);
  fail(s.title && s.publisher && s.retrievedDate, `Source metadata incomplete: ${s.id}`);
}
fail(new Set(data.candidates.map(s => s.id)).size === data.candidates.length, 'Candidate IDs must be unique');
fail(new Set(data.candidates.map(s => `${s.address}|${s.city}|${s.state}`.toLowerCase())).size === data.candidates.length, 'Duplicate property address');
for (const mode of ['network', 'investor']) {
  const ranks = data.candidates.map(c => c.ranks?.[mode]).filter(Number.isInteger).sort((a,b) => a-b);
  fail(ranks.length <= 10, `At most ten qualified ranks: ${mode}`);
  assert.deepEqual(ranks, Array.from({length:ranks.length},(_,i)=>i+1), `Qualified ranks must be consecutive: ${mode}`);
  for (const c of data.candidates) if (c.ranks?.[mode] !== null) fail(c.review.decision === 'qualified' && c.economics.hurdle.passed, `Unqualified property ranked: ${c.id}`);
}
fail(supply.stations.length === supply.meta.totalResults, 'Supply download is truncated');
fail(new Set(supply.stations.map(s => s.id)).size === supply.stations.length, 'Duplicate AFDC IDs');
const tesla = supply.stations.filter(s => s.network === 'Tesla');
for (const c of data.candidates) {
  for (const k of ['name','address','city','state','coordinateQuality','counterargument']) fail(typeof c[k] === 'string' && c[k].trim(), `Missing ${k}: ${c.id}`);
  fail(c.sourceIds?.length && c.facts?.length && c.unknowns?.length && c.killCriteria?.length, `Incomplete evidence/risk fields: ${c.id}`);
  for (const ref of [...c.sourceIds, ...c.facts.flatMap(f => f.sourceIds || [])]) fail(sourceIds.has(ref), `Unresolved source ${ref}: ${c.id}`);
  for (const fact of c.facts) {
    fail(['fact','inference','assumption','unknown'].includes(fact.kind), `Invalid epistemic label: ${c.id}`);
    if (fact.kind === 'fact') fail(fact.sourceIds?.length, `Fact has no source: ${c.id}`);
  }
  if (c.lat == null || c.lon == null) {
    fail(c.lat == null && c.lon == null, `Half coordinate: ${c.id}`);
    fail(c.metrics.nearestOpenMiles == null && c.metrics.dcfcWithin10Miles == null, `Missing location cannot have computed metrics: ${c.id}`);
    continue;
  }
  fail(c.lat >= 18 && c.lat <= 72 && c.lon >= -180 && c.lon <= -65, `Unexpected US coordinate: ${c.id}`);
  const nearest = Math.min(...tesla.map(s => haversineMiles(c,s)));
  fail(Math.abs(nearest-c.metrics.nearestOpenMiles) <= .051, `Nearest Tesla calculation mismatch: ${c.id}`);
  const count = supply.stations.filter(s => haversineMiles(c,s) <= 10).length;
  fail(count === c.metrics.dcfcWithin10Miles, `DCFC radius count mismatch: ${c.id}`);
  for (const n of c.nearby || []) {
    fail(Number.isFinite(n.distanceMiles) && n.distanceMiles >= 0, `Invalid nearby distance: ${c.id}`);
    if (Number.isFinite(n.lat) && Number.isFinite(n.lon)) fail(Math.abs(haversineMiles(c,n)-n.distanceMiles) <= .051, `Nearby distance mismatch: ${c.id}`);
  }
  for (const mode of ['network','investor']) if (Number.isInteger(c.ranks[mode])) {
    fail(c.thesis?.[mode] && c.rankRationale?.[mode], `Rank lacks rationale: ${c.id}/${mode}`);
    fail(!['rejected','淘汰'].includes(c.status), `Rejected property cannot be Top 10: ${c.id}`);
    if (nearest < .5) fail(/Tesla|特斯拉|超充/.test(c.counterargument), `Nearby Tesla conflict omitted: ${c.id}`);
  }
}
console.log(`Validated ${data.candidates.length} properties, hard-gated lists, ${data.sources.length} source references and ${supply.stations.length} supply records.`);
console.log('Validation checks structure and reproducible calculations; it does not establish demand, land control, utility capacity or investment returns.');

const round = JSON.parse(fs.readFileSync(new URL('../data/review-round.json', import.meta.url)));
fail(round.reviewedIds.length === 23 && new Set(round.reviewedIds).size === 23, 'Review coverage mismatch');
for (const c of data.candidates) {
  const r = classifyCandidate({evidence:c.review.evidence,scenarios:c.economics.scenarios,fatalConflict:c.review.fatalConflict===true});
  fail(r.decision===c.review.decision, `Evidence/numeric decision mismatch: ${c.id}`);
  assert.deepEqual(r.hurdle.tests,c.economics.hurdle.tests, `Hurdle mismatch: ${c.id}`);
  fail(c.review.round===1 ? round.reviewedIds.includes(c.id) : !round.reviewedIds.includes(c.id), `Review scope mismatch: ${c.id}`);
  if (Object.values(c.previousRanks).some(Number.isInteger)) fail(c.review.round===1 && c.review.checks.length>=8, `Previous shortlist was not reviewed: ${c.id}`);
  for (const q of c.review.checks) {
    fail(q.finding.en && q.finding.zh && q.label.en && q.label.zh, `Missing bilingual review: ${c.id}`);
    if (q.status==='verified') fail(q.sourceIds.length>0, `Verified check lacks evidence: ${c.id}`);
    for (const id of q.sourceIds) fail(sourceIds.has(id), `Unresolved review source ${id}`);
  }
  for (const assumption of c.economics.assumptions) for (const id of assumption.sourceIds) fail(sourceIds.has(id), `Unresolved assumption source ${id}`);
  fail(c.zh.facts.length===c.facts.length, `Fact translation alignment mismatch: ${c.id}`);
}
const hasChinese = /[\u4e00-\u9fff]/;
for (const c of data.candidates) {
  for (const field of ['counterargument','type','status','coordinateQuality']) fail(!hasChinese.test(c[field]), `Non-English canonical field ${c.id}/${field}`);
  for (const text of [...Object.values(c.thesis),...Object.values(c.rankRationale),...c.unknowns,...c.killCriteria,...c.facts.map(f=>f.claim)]) fail(!hasChinese.test(text), `Non-English canonical analysis: ${c.id}`);
}
fail(!hasChinese.test(fs.readFileSync(new URL('../README.md',import.meta.url),'utf8')), 'GitHub homepage must be English');
console.log(`Review coverage: ${round.reviewedIds.length} newly reviewed, ${data.candidates.length-round.reviewedIds.length} carried forward; qualified ${data.candidates.filter(c=>c.review.decision==='qualified').length}.`);
