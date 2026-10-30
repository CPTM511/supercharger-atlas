import fs from 'node:fs';
import assert from 'node:assert/strict';
const root = new URL('../', import.meta.url);
const read = name => JSON.parse(fs.readFileSync(new URL(name, root)));
const write = (name, value) => fs.writeFileSync(new URL(name, root), JSON.stringify(value, null, 2)+'\n');
const data = read('data/candidates.json');
const round = read('data/acquisition-round-4.json');
assert.equal(new Set(round.reviewedIds).size, 10);
assert.equal(round.carriedForwardIds.length, 27);
assert.equal(round.sites.length, 10);
for (const source of round.sources) {
  const existing = data.sources.find(s => s.url === source.url);
  if (existing) {
    assert.equal(existing.id, source.id);
    // Preserve prior provenance; latest retrieval restrictions live beside each claim.
  } else data.sources.push(source);
}
for (const c of data.candidates) {
  const a = round.sites.find(s => s.id === c.id);
  if (a) {
    assert.equal(c.review.decision, a.decisionBefore);
    assert.equal(a.decisionBefore, a.decisionAfter);
    assert.ok(a.findings.every(f => f.usableAsModelInput === false));
    c.acquisition = a;
  }
}
data.acquisitionReview = round;
data.meta.version = round.version;
data.meta.acquisitionReview = {reviewed:10,carriedForward:27,findings:round.sites.reduce((n,s)=>n+s.findings.length,0),classificationChanges:0};
data.meta.description = round.coverage.en;
data.meta.zh.description = round.coverage.zh;
write('data/candidates.json', data);
const pkg = read('package.json'); pkg.version = round.version; write('package.json', pkg);
const sources = new Map(data.sources.map(s => [s.id,s]));
const refs = ids => ids.map(id => `[${id}](${sources.get(id).url})`).join(' · ');
const lines = ['# Evidence recovery and decision audit', '', `As of ${round.asOf} · v${round.version}`, '', round.conclusion.en, '', round.coverage.en, '',
  '## What zero qualified actually means', '',
  `All ${round.diagnostics.incompleteEvidence} properties lack complete evidence packages. There are only ${round.diagnostics.distinctScenarioSets} distinct state-based main scenario sets behind the 37 addresses. Shared conservative revenue is $${round.diagnostics.conservativeRevenue.toLocaleString('en-US')}, below $${round.diagnostics.conservativeFixedCost.toLocaleString('en-US')} fixed costs before other expenses. Universal stress failure is therefore mechanical; it is not 37 independent field observations.`, '',
  'Base annual free cash is positive in 34 of 37 shared cases, yet none meets the combined payback/NPV/downside gate. An optimistic pass cannot override the other conditions. These are hypothetical outputs, not measured returns.', '',
  round.greenfieldRule.en, '',
  'A matched analogue must justify geography, trip purpose, price, connector compatibility, stall count/power, uptime, season and competing supply. Separate repair, expansion, staged and battery-assisted designs when their actual scope differs. Do not divide an eight-stall example to invent smaller-project costs. The same 6-year base, 8-year conservative, 10% real NPV and six evidence gates remain mandatory.', '',
  'Both ranking lenses use the illustrated third-party owner cash flow. They do not establish Tesla internal investment returns or a host-rent contract. Any different ownership model needs its own evidenced cash flow.', '',
  '## A built-and-used comparison outside the candidate pool', '', round.comparison.summary.en, '',
  `Period: ${round.comparison.periodStart}–${round.comparison.periodEnd}. Source: ${refs(round.comparison.sourceIds)}.`, '',
  '| Existing California site | Mean of monthly maximum grid demand | Reported uptime |', '| --- | ---: | ---: |',
  ...round.comparison.sites.map(s=>`| ${s.name} | ${s.meanMonthlyPeakKw} kW | ${s.uptimePercent.toFixed(2)}% |`), '',round.comparison.limitation.en, '',
  'These sites demonstrate specific designs were built and used. They do not establish an available new parcel, a profitable marginal expansion or an investment recommendation. No comparison figures have been substituted into candidate inputs.', '',
  '## Follow-up results for the ten evidence priorities', '',
  '| Property | Evidence/context change | Investment status |', '| --- | --- | --- |',
  ...round.sites.map(s=>`| ${data.candidates.find(c=>c.id===s.id).name} | ${s.headline.en} | Pending → pending |`), ''];
for (const s of round.sites) {
  const c=data.candidates.find(c=>c.id===s.id);
  lines.push(`## ${c.name}`, '',c.address, '',s.impact.en, '');
  for (const f of s.findings) lines.push(`- **${f.evidenceClass} — ${f.scope}.** ${f.claim.en} Limitation: ${f.limitation.en} ${refs(f.sourceIds)}`, '');
  if (!s.findings.length) lines.push('No decision-changing new evidence was obtained. Prior evidence is retained without a new observation date.', '');
  for (const k of ['demand','cost','grid']) lines.push(`**Still missing — ${k}:** ${s.remaining[k].en}`, '');
  lines.push(`**Next acquisition:** ${s.nextAction.en}`, '', '**Attempts and access limits:**', '');
  for (const a of s.attempts) lines.push(`- ${typeof a.action==='string'?a.action:a.action.en}: ${typeof a.result==='string'?a.result:a.result.en} ${refs(a.sourceIds||[])}`);
  lines.push('');
}
lines.push('## Review and boundaries', '', 'An independent reviewer checked the decision interpretation, representative inverse calculations, the external comparison and newly acquired primary materials. Retained original documents and rendered text were used where direct online retrieval failed; those access limits remain attached to claims. Review is not a field inspection or an operator audit.', '',
  'No current operator paid-session sequence, complete new-design quote or firm incremental utility capacity/date was obtained for the ten. No economic inputs or formal decisions changed. No communication, record request, utility application, contract or expenditure was made. Confidential records and personal background material remain outside this public repository.', '');
fs.writeFileSync(new URL('docs/EVIDENCE-RECOVERY.md',root), lines.join('\n'));
console.log(`Imported ${round.sites.length} follow-ups without changing economic inputs or qualification.`);
