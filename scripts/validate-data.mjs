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
console.log(`Historical round-one coverage retained: ${round.reviewedIds.length}.`);

const diligence=JSON.parse(fs.readFileSync(new URL('../data/evidence-round-2.json',import.meta.url)));
fail(diligence.sites.length===data.candidates.length && new Set(diligence.sites.map(c=>c.id)).size===data.candidates.length,'Round-two coverage mismatch');
let claims=0;
for(const c of data.candidates){
 const record=diligence.sites.find(s=>s.id===c.id);
 assert.deepEqual(c.diligence,record,`Diligence copy stale: ${c.id}`);
 fail(record.findings.length>=2 && record.remainingCritical.length && record.attempts.length,`Insufficient documented investigation: ${c.id}`);
 fail(record.publicResearchConclusion.en && record.publicResearchConclusion.zh,`Missing conclusion: ${c.id}`);
 for(const f of record.findings){
  claims++;
  fail(['direct','secondary','inference','estimate','unresolved'].includes(f.evidenceClass),`Invalid evidence class: ${c.id}`);
  fail(['parcel','corridor','utility','regional'].includes(f.locality),`Invalid claim scope: ${c.id}`);
  fail(f.claim.en && f.claim.zh && f.limitation.en && f.limitation.zh,`Missing claim/limitation translation: ${c.id}`);
  if(['direct','secondary'].includes(f.evidenceClass))fail(f.sourceIds.length>0,`Unsupported sourced claim: ${c.id}`);
  for(const id of f.sourceIds)fail(sourceIds.has(id),`Missing claim source ${id}`);
 }
 for(const p of c.economics.tariffSensitivities){
  fail(p.limitation.en && p.limitation.zh,'Tariff subtotal limitation missing');
  for(const id of p.sourceIds)fail(sourceIds.has(id),`Missing tariff source ${id}`);
 }
 const q=c.economics.throughputComparison;
 if(q.ratio!==null)fail(Math.abs(q.ratio-q.requiredKwhPerStallDay/q.observedNetworkKwhPerStallDay)<1e-10,'Throughput ratio mismatch');
}
fail(data.meta.roundTwoEvidence.reviewed===37 && data.meta.roundTwoEvidence.carriedForward===0 && data.meta.roundTwoEvidence.newFindings===claims,'Historical round-two statistics mismatch');
console.log(`Round two: all ${diligence.sites.length} sites investigated, ${claims} classified findings; admission rules unchanged.`);

const current=JSON.parse(fs.readFileSync(new URL('../data/feasibility-round-3.json',import.meta.url)));
const prior=JSON.parse(fs.readFileSync(new URL('../data/previous-results-v0.3.2.json',import.meta.url)));
fail(current.sites.length===37 && new Set(current.sites.map(x=>x.id)).size===37,'Availability coverage');
fail(current.selection.scanCompletedBeforeSelection && current.selection.selectedIds.length===10,'Selection order/size');
let focused=0,currentClaims=0;
for(const c of data.candidates){
 const f=current.sites.find(x=>x.id===c.id);
 assert.deepEqual(c.feasibility,f,'Round-three candidate copy mismatch');
 fail(f.attempts.length>0,'No availability attempts');
 if(f.selected){focused++;fail(f.deepReview?.attempts.length>0 && f.deepReview.findings.length>0,'Missing focused investigation');}
 for(const key of ['demand','cost','grid']){
  const a=f.availability[key];fail(['partial','observed','unavailable','blocked'].includes(a.status),'Invalid availability status');
  for(const field of ['summary','neededDocument','provider','route'])fail(a[field]?.en && a[field]?.zh,`Missing bilingual route: ${c.id}/${key}/${field}`);
 }
 for(const q of [...f.newFindings,...(f.deepReview?.findings||[])]){
  currentClaims++;
  fail(['direct','secondary','inference','estimate','unresolved'].includes(q.evidenceClass),'Invalid current evidence class');
  fail(['parcel','corridor','utility','regional'].includes(q.locality),'Missing current geographic scope');
  fail(q.claim?.en && q.claim?.zh && q.limitation?.en && q.limitation?.zh,'Missing bilingual current claim');
  if(['direct','secondary'].includes(q.evidenceClass))fail(q.sourceIds?.length>0,'Current sourced claim without source');
 }
 for(const id of f.sourceIds)fail(sourceIds.has(id),'Unresolved current source');
 const old=prior.sites.find(s=>s.id===c.id);
 for(const [k,s]of Object.entries(c.economics.scenarios)){
  const hash=createHash('sha256').update(JSON.stringify(s.inputs)).digest('hex');
  fail(hash===old.scenarios[k].inputHash,'Unsupported input change from v0.3.2');
  for(const key of ['stabilizedFreeCash','npv','projectPaybackYears'])fail(s.outputs[key]===old.scenarios[k][key],`Unexpected economic delta: ${c.id}/${k}/${key}`);
 }
 fail(f.classificationChanged===(old.decision!==c.review.decision),'Incorrect before/after decision');
}
fail(focused===10 && currentClaims===data.meta.availabilityReview.newFindings,'Current coverage/count mismatch');
console.log(`Round three: 37 availability records, ${focused} focused reviews, ${currentClaims} classified findings; unchanged inputs and decisions reconciled against v0.3.2.`);

const assetHash=name=>createHash('sha256').update(fs.readFileSync(new URL('../'+name,import.meta.url))).digest('hex').slice(0,12);
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
for(const name of ['styles.css','app.js'])fail(html.includes('./'+name+'?v='+assetHash(name)),'Stale asset URL: '+name);
for(const name of ['i18n.js','model.js'])fail(app.includes('./'+name+'?v='+assetHash(name)),'Stale module URL: '+name);
