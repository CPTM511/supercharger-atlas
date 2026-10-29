import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {haversineMiles} from '../model.js';

const data = JSON.parse(fs.readFileSync(new URL('../data/candidates.json', import.meta.url)));
const supply = JSON.parse(fs.readFileSync(new URL('../data/supply-snapshot.json', import.meta.url)));
const fail = (condition, message) => assert.ok(condition, message);
const brief = fs.readFileSync(new URL('../downloads/charge-atlas-brief.pdf', import.meta.url));
const dataHash = createHash('sha256').update(fs.readFileSync(new URL('../data/candidates.json', import.meta.url))).digest('hex');
fail(brief.subarray(0,5).toString() === '%PDF-' && brief.includes(Buffer.from(`data-sha256=${dataHash}`)), 'PDF brief is stale: rebuild it from the current candidate data');
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
  assert.deepEqual(ranks, [1,2,3,4,5,6,7,8,9,10], `Exactly one complete Top 10 required: ${mode}`);
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
console.log(`Validated ${data.candidates.length} properties, two independent Top 10 lists, ${data.sources.length} source references and ${supply.stations.length} supply records.`);
console.log('Validation checks structure and reproducible calculations; it does not establish demand, land control, utility capacity or investment returns.');
