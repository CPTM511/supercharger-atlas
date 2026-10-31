import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderHomeShortlist,renderHomeDecision} from '../home-summary.js';
const data=JSON.parse(fs.readFileSync(new URL('../data/candidates.json',import.meta.url)));
const e=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;');
test('Home summary keeps all ten, both lens orders and bilingual fallback without modifying data',()=>{
 const before=JSON.stringify(data);
 for(const lang of ['en','zh']){
  const staticTable=renderHomeShortlist(data,{e,lang,interactive:false});
  assert.equal((staticTable.match(/data-followup-id=/g)||[]).length,10);
  assert.ok(!staticTable.includes('data-followup-select'));
  for(const r of data.followupReview.records)assert.ok(staticTable.includes(`data-followup-id="${r.candidateId}"`));
  for(const [mode,first] of [['network','net-challis'],['investor','heb-ronaldreagan']]){
   const table=renderHomeShortlist(data,{e,lang,mode});
   assert.equal(table.match(/data-followup-id="([^"]+)"/)[1],first);
  }
  const summary=renderHomeDecision(data,{e,lang,interactive:false});
  assert.ok(summary.includes('docs/RONALD-VALIDATION.md')&&summary.includes('main/CHANGELOG.md'));
  assert.ok(summary.includes(lang==='zh'?'联合投资门槛':'joint investment gate'));
 }
 assert.equal(JSON.stringify(data),before);
});
test('Home financial headline and thresholds derive from canonical retained values',()=>{
 const draft=structuredClone(data);
 const c=draft.candidates.find(c=>c.id==='heb-ronaldreagan');
 c.ronaldValidation.analysis.scenarios.base.outputs.projectPaybackYears=4.1234;
 const html=renderHomeDecision(draft,{e});
 assert.ok(html.includes('4.12 years'));
 assert.ok(html.includes('No recovery within 10 operating years'));
 assert.ok(html.includes(`base ≤ ${data.policy.basePaybackMaxYears} years`));
 assert.ok(html.includes(`conservative ≤ ${data.policy.conservativePaybackMaxYears} years`));
});
