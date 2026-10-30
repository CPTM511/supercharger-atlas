import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {renderRonaldOverview} from '../ronald-view.js';
import {t,setLanguage} from '../i18n.js';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderStaticSnapshot(data,html) {
 const replace=(id,body)=>{const re=new RegExp(`(<([a-z]+)[^>]*\\bid="${id}"[^>]*>)[\\s\\S]*?</\\2>`);if(!re.test(html))throw new Error(`Missing snapshot target ${id}`);html=html.replace(re,(_,start,tag)=>start+body+`</${tag}>`);};
 const reviewed=data.localValidationReview;
 if(data.ronaldValidationReview){setLanguage('en');replace('ronald-audit',renderRonaldOverview(data.ronaldValidationReview,{t,e:value=>escape(value?.en??value)}).replace(/<button[^>]*data-hypothesis-select[^>]*>[\s\S]*?<\/button>/,''));}
 const count=mode=>data.candidates.filter(c=>c.review.decision==='qualified'&&Number.isInteger(c.ranks[mode])).length;
 html=html.replace('id="snapshot-date" class="snapshot-date" data-i18n="reading"','id="snapshot-date" class="snapshot-date"');
 replace('snapshot-date',escape(data.meta.asOf));replace('pool-count',data.candidates.length);replace('network-count',count('network'));replace('investor-count',count('investor'));replace('source-count',new Set(data.sources.map(s=>s.url)).size);replace('footer-version',escape(`${data.meta.version} · ${data.meta.asOf}`));
 replace('local-validation-audit',`<p class="eyebrow">EARLIER FIVE-SITE REVIEW · v${escape(reviewed.version)} · ${escape(reviewed.asOf)}</p><h2>Earlier five-site evidence</h2><p>${escape(reviewed.conclusion.en)}</p><div class="table-scroll"><table><thead><tr><th>Property</th><th>Current investigation judgment</th></tr></thead><tbody>${reviewed.records.map(r=>{const c=data.candidates.find(c=>c.id===r.candidateId);return `<tr><th>${escape(c.name)}<small>${escape(c.address)}</small></th><td>${escape(r.change.en)}</td></tr>`;}).join('')}</tbody></table></div><p>${escape(reviewed.boundary.en)}</p><p><a href="./docs/LOCAL-VALIDATION.md">Read the complete local evidence and conditional tests</a> · <a href="./downloads/charge-atlas-brief.pdf">English PDF</a> · <a href="./downloads/charge-atlas-brief-zh.pdf">Chinese PDF</a></p><p class="small">Published snapshot. Interactive evidence loads when JavaScript and data are available.</p>`);
 replace('support-audit',`<p class="eyebrow">INCENTIVES &amp; OWNERSHIP</p><h2>Support is conditional, not awarded cash</h2><p>${data.supportReview.programs.length} support mechanisms are mapped. Tesla-owned, third-party owner and property-host cash flows are distinct. No unverified grant or credit is included in investment qualification.</p><p><a href="./docs/INCENTIVES-AND-OWNERSHIP.md">Read the incentive conditions and timing sensitivities</a></p>`);
 return html;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const root=new URL('../',import.meta.url),data=JSON.parse(fs.readFileSync(new URL('data/candidates.json',root))),file=new URL('index.html',root);fs.writeFileSync(file,renderStaticSnapshot(data,fs.readFileSync(file,'utf8')));console.log('Generated English snapshot and report fallbacks without requiring JavaScript.');}
