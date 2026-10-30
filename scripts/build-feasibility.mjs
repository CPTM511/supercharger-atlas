import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {inverseConditions} from '../inverse.js';
const root=new URL('../',import.meta.url),read=name=>JSON.parse(fs.readFileSync(new URL(name,root)));
const write=(name,value)=>fs.writeFileSync(new URL(name,root),JSON.stringify(value,null,2)+'\n');
const input=process.argv[2];
if(!input)throw new Error('Supply the reviewed private evidence directory; raw material is never copied.');
const load=name=>JSON.parse(fs.readFileSync(path.join(input,name)));
const selection=load('selection.json');
const scans=['network','northwest','south'].map(g=>load(g+'-availability.json'));
const deep=['network','northwest','south'].map(g=>load(g+'-deep.json'));
const data=read('data/candidates.json');
const prior=read('data/previous-results-v0.3.2.json');
const ids=new Set(data.candidates.map(c=>c.id));
const all=scans.flatMap(x=>x.sites),details=deep.flatMap(x=>x.sites);
if(all.length!==37||new Set(all.map(x=>x.id)).size!==37||all.some(x=>!ids.has(x.id)))throw new Error('Must scan all37 before selection');
if(details.length!==10||new Set(details.map(x=>x.id)).size!==10||details.some(x=>!selection.selectedIds.includes(x.id)))throw new Error('Must investigate the selected10');
const sourceMap=new Map(data.sources.map(x=>[x.url,x.id]));
for(const source of [...scans,...deep].flatMap(x=>x.sources)){
 if(sourceMap.has(source.url)){
  const old=data.sources.find(s=>s.id===sourceMap.get(source.url));
  if(source.notes && typeof source.notes==='string' && typeof old.notes==='string' && !old.notes.includes(source.notes))old.notes+=' Round-three access/review: '+source.notes;
  continue;
 }
 const id='V4-'+createHash('sha256').update(source.url).digest('hex').slice(0,9);
 sourceMap.set(source.url,id);
 data.sources.push({id,url:source.url,title:source.title,publisher:source.publisher,publishedDate:source.publishedDate||null,retrievedDate:source.retrievedDate||'2026-10-30',kind:'research',notes:source.notes||'',access:source.access||'See claim-level access record; a listed URL alone is not verification.'});
}
const attach=record=>{
 for(const [key,value] of Object.entries(record)){
  if(key==='sourceUrls'||key==='urls')record.sourceIds=[...new Set(value.map(u=>sourceMap.get(u)).filter(Boolean))];
  else if(value&&typeof value==='object')Array.isArray(value)?value.forEach(x=>x&&typeof x==='object'&&attach(x)):attach(value);
 }
 return record;
};
const same={en:'Qualification unchanged: pending. No complete site-level demand, cost and connection package was obtained; shared stress inputs are retained rather than replaced by unsupported estimates.',zh:'资格不变：仍待核。尚未取得完整的场地订单、成本和接电资料；保留共用压力输入，不以无依据估算替换。'};
for(const c of data.candidates){
 const scan=all.find(x=>x.id===c.id),review=details.find(x=>x.id===c.id);
 const f=structuredClone(scan);
 f.selected=selection.selectedIds.includes(c.id);
 f.selectionReason=selection.reasons[c.id];
 if(review){f.deepReview=structuredClone(review);Object.assign(f.availability,review.availabilityUpdates||{});}
 f.decisionChange=review?.assessmentChange||same;
 f.priorDecision=prior.sites.find(x=>x.id===c.id).decision;
 f.currentDecision=c.review.decision;
 f.classificationChanged=f.currentDecision!==f.priorDecision;
 attach(f);
 const collected=new Set();
 const collect=o=>{if(!o||typeof o!=='object')return;for(const [k,v]of Object.entries(o)){if(k==='sourceIds')v.forEach(x=>collected.add(x));else if(typeof v==='object')collect(v);}};
 collect(f);f.sourceIds=[...collected];c.feasibility=f;
 c.economics.inverse=Object.fromEntries(['base','conservative'].map(k=>[k,inverseConditions(c.economics.scenarios[k].inputs,k)]));
 c.economics.currentIterationChange={inputsChanged:false,reason:same};
}
data.meta.version='0.4.0';
data.meta.description='Round three scanned data availability at all37 properties, then investigated10 selected sites in depth. Acquisition routes and limits are explicit; selection is for research, not investment qualification.';
data.meta.zh.description='第三轮先筛查全部37处的数据可获取性，再对选定10处深入核实。明确资料获取路径与限制；选址用于研究，不代表投资合格。';
data.meta.roundTwoEvidence={reviewed:37,carriedForward:0,newFindings:98};
data.meta.newFindings=data.candidates.reduce((n,c)=>n+c.feasibility.newFindings.length+(c.feasibility.deepReview?.findings.length||0),0);
data.meta.availabilityReview={scanned:37,focused:10,newFindings:data.meta.newFindings,classificationChanges:data.candidates.filter(c=>c.feasibility.classificationChanged).length};
write('data/candidates.json',data);
write('data/feasibility-round-3.json',{asOf:'2026-10-30',baselineVersion:'0.3.2',selection,sites:data.candidates.map(c=>c.feasibility)});
console.log(JSON.stringify(data.meta.availabilityReview));
