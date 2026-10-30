import fs from 'node:fs';
import assert from 'node:assert/strict';
import { calculateCapitalSupport } from '../support-model.js';
const root = new URL('../', import.meta.url);
const read = p => JSON.parse(fs.readFileSync(new URL(p, root)));
const write = (p, v) => fs.writeFileSync(new URL(p, root), JSON.stringify(v, null, 2)+'\n');
const data = read('data/candidates.json');
const review = read('data/support-review.json');
for (const s of review.sources) {
  const previous = data.sources.find(x => x.url === s.url);
  if (previous) assert.equal(previous.id, s.id);
  else data.sources.push(s);
}
for (const c of data.candidates) {
  const cases = [];
  for (const fraction of [0, .3, .8]) for (const delayYears of [0, 1]) {
    const scenarios = Object.fromEntries(Object.entries(c.economics.scenarios).map(([key,s]) => [key,calculateCapitalSupport(s.inputs,fraction,delayYears)]));
    const volume = [4,8,10,12].map(sessions => ({sessions, ...calculateCapitalSupport({...c.economics.scenarios.base.inputs,sessionsPerStallDay:sessions},fraction,delayYears)}));
    cases.push({fraction, delayYears, scenarios, volume});
  }
  c.supportReview = {asOf:review.asOf, admittedCapitalSupport:0, admittedRecurringSupport:0,
    programIds: review.programs.filter(p => p.candidateIds.includes(c.id)).map(p => p.id),
    decisionBefore:c.review.decision, decisionAfter:c.review.decision, cases};
  if (c.id==='net-machias') c.supportReview.temporaryProgramCase={
    programId:'me-phase12', notAnEligibilityDetermination:true,
    scenarios:Object.fromEntries(Object.entries(c.economics.scenarios).map(([key,s])=>[key,calculateCapitalSupport(s.inputs,Math.min(600000,s.inputs.capex)/s.inputs.capex,1,{fractionByYear:[1,.8,.6,.4,.2],cap:300000})]))};
}
data.supportReview=review;
data.meta.version='0.6.0';
data.meta.supportReview={mapped:37,programs:review.programs.length,admittedAwards:0};
write('data/candidates.json',data);
const pkg=read('package.json');pkg.version='0.6.0';write('package.json',pkg);
const sourceMap=new Map(data.sources.map(s=>[s.id,s]));
const refs=ids=>ids.map(id=>`[${id}](${sourceMap.get(id).url})`).join(' · ');
const lines=['# Incentives, ownership and investment economics','','As of '+review.asOf+' · v0.6.0','',review.conclusion.en,'',
 '## Different owners have different cash flows','',...review.ownershipModels.flatMap(m=>['### '+m.title.en,'',m.description.en,'',m.limitation.en+' '+refs(m.sourceIds),'']),
 '## Material findings','',...review.findings.flatMap(f=>['- **'+f.title.en+'** '+f.claim.en+' '+f.limitation.en+' '+refs(f.sourceIds),'']),
 '## Program routes and restrictions','','These are researched routes, not awards or confirmed parcel eligibility. Program coverage is bounded; absence from this list does not establish that no incentive exists. No application was submitted. All 37 sites are mapped to relevant broad routes, with state/utility/equipment/contract restrictions retained.',''];
for (const p of review.programs) lines.push('### '+p.title.en,'',p.claim.en,'','**Status and limits:** '+p.limitation.en,'','**Required next evidence:** '+p.required.en,'','**Potential research matches:** '+p.candidateIds.map(id=>data.candidates.find(c=>c.id===id)?.name).join('; '), '',refs(p.sourceIds),'');
lines.push('## What the new sensitivity calculates','',review.sensitivityExplanation.en,'',
 'The app shows each existing conservative/base/optimistic scenario with 0%, 30% or 80% hypothetical reimbursement of gross initial capex. This deliberately generous ceiling does not imply that all gross costs are eligible or that a program offers these percentages. It then separately varies base-case demand to 4, 8, 10 or 12 sessions/stall/calendar day with the same chosen support. More volume is an assumption, not an observed candidate forecast. Neither table tests a newly validated downside demand case.', '',
 'The original gross capital, operating costs, construction holding costs and gross-asset replacement reserve are retained. Reimbursement arrives at commissioning or at the end of the first operating year. It is not netted against initial construction funding, and its cash receipt is discounted at its actual modeled time. Financing interest, tax effects, application costs, clawbacks and conditional compliance expenses are not supplied by this sensitivity. Actual grant applications and a liquidity/financing plan may make results worse.', '',
 'A capital grant cannot fix negative recurring operating cash. Clean-fuel credits, utility support and retail gross profit could affect recurring cash, but require eligible metering, contractual ownership, expiry, net realization and incremental-cost evidence. Apart from the explicitly conditional Machias illustration, these recurring mechanisms stay unquantified; no fabricated credit price or retailer revenue is admitted.', '',
 '## Source access limitations','',...review.sourceAccess.filter(s=>!s.status.startsWith('Primary original')).map(s=>`- ${refs([s.sourceId])}: ${s.status}. ${s.limitation||''}`),'', '## Qualification and review','',
 'All 37 remain pending. No evidence gate, 6/8-year payback limit, 10% real NPV rule or original site scenario changed. A favorable base sensitivity does not establish a passing conservative case or qualify a property. Support records and calculations are exported alongside the current view, with the same limitations.', '',
 'Independent review checks source applicability, cash-flow timing and the preservation of gross asset costs. The published validation record specifies the completed review and product checks.','');
fs.writeFileSync(new URL('docs/INCENTIVES-AND-OWNERSHIP.md',root),lines.join('\n'));
console.log(`Mapped ${data.candidates.length} properties to ${review.programs.length} researched support routes; no awards or qualification admitted.`);
