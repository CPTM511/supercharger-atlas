import fs from 'node:fs';
import {buildHypothesis,HYPOTHESIS_FACTORS} from '../hypothesis-model.js';
const root=new URL('../',import.meta.url),read=p=>JSON.parse(fs.readFileSync(new URL(p,root))),write=(p,v)=>fs.writeFileSync(new URL(p,root),JSON.stringify(v,null,2)+'\n');
const data=read('data/candidates.json'),review=read('data/hypotheses.json');
for(const s of review.sources)if(!data.sources.some(x=>x.id===s.id))data.sources.push(s);
for(const c of data.candidates){
 const r=review.records.find(x=>x.candidateId===c.id);
 c.hypothesis=r?{...r,analysis:buildHypothesis(r.estimate)}:null;
}
data.hypothesisReview={...review,factors:HYPOTHESIS_FACTORS};data.meta.version='0.7.0';
data.meta.hypothesisReview={selected:review.records.length,qualified:0};write('data/candidates.json',data);
const pkg=read('package.json');pkg.version='0.7.0';write('package.json',pkg);
const sm=new Map(data.sources.map(s=>[s.id,s]));
const refs=ids=>ids.map(id=>`[${id}](${sm.get(id).url})`).join(' · ');
const num=x=>x===null?'No recovery':x.toFixed(2),money=x=>x===null?'No solution':'$'+Math.round(x).toLocaleString('en-US');
const lines=['# Field-verification hypotheses and model audit','','As of 2026-10-30 · v0.7.0','',review.conclusion.en,'',review.selection.en,'','## What changed','',...review.claims.flatMap(c=>['### '+c.title.en,'',c.text.en+' '+refs(c.sourceIds),'']),
 '## Measured aggregate versus vendor projections','',review.comparison.text.en+' '+refs(review.comparison.sourceIds),'',
 'Five retained address entries produce only three distinct vendor input sets. Puyallup and Edmonds share 298 kWh/post/day, $0.49 retail and $0.10 all-in utility; the two Texas addresses share 302, $0.51 and $0.11; Medford shows 230, $0.51 and $0.16. They are not five independent operating samples. All four-post medium-install illustrations show $470,000; vendor payback is five years for WA/TX and seven for Medford under its different assumptions. '+refs(['S53158f4']),'',
 'Tesla uses 7% yearly utilization growth, no parking rent and a 15-year illustration, with hardware taxes excluded. The analysis below does not reproduce that calculator: it uses flat demand, construction/ramp, explicit uncovered-cost allowances and a 10-year horizon. No growth is assumed merely because a network grew.','',
 '## Frozen hypothesis method','',review.method.en,'',review.boundary.en,'',
 'The 35 kWh/session divisor is an explanatory unit conversion. Cash flows are driven by the daily kWh anchor and are invariant to that conversion. The 70%/100%/120% cases are author-selected alternatives, not empirical confidence bounds. A field forecast must be calibrated using matched paid observations, seasonality, access and incremental capture.','',
 '## Selected investigations','',
 '| Property | Investigation tier | Vendor kWh/post/day | Base required kWh/post/day | Base maximum complete capex at vendor volume |',
 '|---|---|---:|---:|---:|'];
for(const c of data.candidates.filter(c=>c.hypothesis)){const h=c.hypothesis,a=h.analysis.inverse.base;lines.push(`| ${c.name} | ${h.tier} | ${h.estimate.kwhPerPostDay} | ${num(a.requiredKwhPerStallDay)} | ${money(a.maxCapex)} |`);}
lines.push('','Each threshold changes ONE input with all others held fixed. Do not combine thresholds or treat them as observed demand, feasible grid capacity or a construction quote. A base-case result cannot substitute for the conservative gate.','');
for(const r of review.records){const c=data.candidates.find(c=>c.id===r.candidateId),h=c.hypothesis;lines.push('### '+c.name,'',c.address,'',h.rationale.en,'','**Evidence:** '+h.anchors.en,'','**Strongest counter-evidence:** '+h.counter.en,'','**Field test:** '+h.test.en,'',refs(h.sourceIds),'',
 '| Working case | kWh/post/day | Gross capex | Annual cash after reserve | Payback from first spend | NPV at 10% |','|---|---:|---:|---:|---:|---:|');
for(const[k,s]of Object.entries(h.analysis.scenarios))lines.push(`| ${k} | ${num(s.inputs.sessionsPerStallDay*35)} | ${money(s.inputs.capex)} | ${money(s.outputs.stabilizedFreeCash)} | ${num(s.outputs.projectPaybackYears)} | ${money(s.outputs.npv)} |`);
lines.push('',`Base required daily energy: ${num(h.analysis.inverse.base.requiredKwhPerStallDay)} kWh/post. Conservative required daily energy: ${num(h.analysis.inverse.conservative.requiredKwhPerStallDay)} kWh/post, with its other adverse inputs fixed. Original investment decision: pending; hypothesis combined numeric gate: ${h.analysis.numericHurdle.passed?'passes numerically only':'does not pass'}.`,'');}
lines.push('## What would validate or stop a hypothesis','',
 'Require owner-approved site/parking/access rights; utility identity and a written capacity, design, tariff and commissioning offer; and a scope-matched EPC quote including grid works, civil/ADA/drainage, equipment, labor, permits, tax, contingency and uncovered O&M. A percentage allowance does not verify completeness. Reconcile covered equipment service against site/admin/insurance and replacement items.','',
 'For a new site, use comparable paid-energy records with actual available post-days, seasons, prices, downtime and competition, then validate local EV traffic, stopping need and capture without treating city registration share as roadway share. A seven-day observation can detect an access or competition problem; it does not establish an annual demand distribution. Reject the proposed scope when credible demand/cost/service evidence cannot clear the unchanged gates; otherwise refine the design and rerun the full paired scenarios. No outreach or fieldwork was performed.','',
 '## Wider pool and access limits','',review.excludedNumbers.en,'',...review.coverage.filter(x=>!x.selected).map(x=>`- ${data.candidates.find(c=>c.id===x.candidateId).name}: ${x.reason.en}`),'',
 'All 37 original records, qualified rankings and financial/evidence gates are preserved. The five hypotheses form a separate discovery layer, not a replacement list of qualified investments. Source and numerical review scope is recorded in [VALIDATION.md](VALIDATION.md).','');
fs.writeFileSync(new URL('docs/FIELD-HYPOTHESES.md',root),lines.join('\n'));
console.log(`Built ${review.records.length} separate hypotheses; original decisions unchanged.`);
