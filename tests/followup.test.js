import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {followupRank,orderedFollowups,renderFollowupOverview,renderFollowupDetail} from '../followup-view.js';
const data=JSON.parse(fs.readFileSync(new URL('../data/candidates.json',import.meta.url)));
test('Both follow-up lenses use the same ten and leave investment admission untouched',()=>{
 const before=JSON.stringify(data);
 for(const mode of ['combined','network','investor']){
  const rows=orderedFollowups(data.candidates,mode);
  assert.equal(rows.length,10);
  assert.deepEqual(rows.map(c=>followupRank(c,mode)),[1,2,3,4,5,6,7,8,9,10]);
  assert.ok(rows.every(c=>c.review.decision==='pending'&&c.ranks.network===null&&c.ranks.investor===null));
 }
 assert.equal(JSON.stringify(data),before);
 assert.equal(followupRank(data.candidates.find(c=>!c.followup),'network'),null);
});
test('Network coverage priority and investor priority deliberately differ',()=>{
 assert.equal(orderedFollowups(data.candidates,'network')[0].id,'net-challis');
 assert.equal(orderedFollowups(data.candidates,'investor')[0].id,'heb-ronaldreagan');
 assert.equal(orderedFollowups(data.candidates,'investor').at(-1).id,'net-challis');
});
test('English static fallback and Chinese detail preserve ten-site and recovery boundaries',()=>{
 const e=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;');
 const html=renderFollowupOverview(data,{e,interactive:false});
 assert.equal((html.match(/data-followup-id=/g)||[]).length,10);
 assert.ok(html.includes('All ten remain pending'));
 assert.ok(!html.includes('data-followup-select'));
 const detail=renderFollowupDetail(data.candidates.find(c=>c.id==='net-colebrook'),{e,lang:'zh'});
 assert.ok(detail.includes('仅恢复/升级')&&detail.includes('没有合法接管/合作路径'));
});
