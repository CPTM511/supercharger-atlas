import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {renderHomeShortlist,renderHomeDecision} from '../home-summary.js';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderStaticSnapshot(data,html) {
 const replace=(id,body)=>{const re=new RegExp(`(<([a-z]+)[^>]*\\bid="${id}"[^>]*>)[\\s\\S]*?</\\2>`);if(!re.test(html))throw new Error(`Missing snapshot target ${id}`);html=html.replace(re,(_,start,tag)=>start+body+`</${tag}>`);};
 replace('followup-audit',renderHomeShortlist(data,{e:escape,interactive:false}));
 replace('home-decision',renderHomeDecision(data,{e:escape,interactive:false}));
 const count=mode=>data.candidates.filter(c=>c.review.decision==='qualified'&&Number.isInteger(c.ranks[mode])).length;
 html=html.replace('id="snapshot-date" class="snapshot-date" data-i18n="reading"','id="snapshot-date" class="snapshot-date"');
 replace('snapshot-date',escape(data.meta.asOf));replace('pool-count',data.candidates.length);replace('network-count',count('network'));replace('investor-count',count('investor'));replace('source-count',new Set(data.sources.map(s=>s.url)).size);replace('footer-version',escape(`${data.meta.version} · ${data.meta.asOf}`));
 return html;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const root=new URL('../',import.meta.url),data=JSON.parse(fs.readFileSync(new URL('data/candidates.json',root))),file=new URL('index.html',root);fs.writeFileSync(file,renderStaticSnapshot(data,fs.readFileSync(file,'utf8')));console.log('Generated the two-part English home summary without requiring JavaScript.');}
