// Investigation order is separate from qualification and financial outputs.
export function followupRank(candidate, mode = 'combined') {
  const value = candidate?.followup?.ranks?.[mode];
  return Number.isInteger(value) && value > 0 ? value : null;
}
export function orderedFollowups(candidates, mode = 'combined') {
  return candidates.filter(c => followupRank(c, mode) !== null).slice().sort((a,b) => followupRank(a,mode)-followupRank(b,mode));
}
const copy = {
 title:['Ten locations to investigate next','下一步重点跟进的十个场地'],
 round:['FOLLOW-UP PRIORITIES · v0.10 · OCT 30, 2026','跟进优先级 · v0.10 · 2026年10月30日'],
 combined:['Overall','综合'],network:['Network','网络价值'],investor:['Third-party','第三方投资'],
 sort:['Order this table by','表格排序依据'],site:['Location / project scope','地址 / 项目范围'],
 reason:['Why follow up','跟进理由'],next:['Verify next','下一步核实'],stop:['Downgrade / stop condition','降级 / 暂停条件'],
 ranks:['Follow-up order within the selected ten','所选十址内的跟进顺序'],
 filter:['Show the current ten follow-up priorities','显示本轮十址跟进清单'],
 history5:['Show the earlier five field hypotheses','显示较早五址假设'],history10:['Show the earlier ten focused reviews','显示较早十址深查'],
 priority:['Follow-up priority','跟进优先级'],pending:['Pending verification · Not investment-qualified','待核实 · 尚未通过投资门槛'],
 detail:['Current follow-up brief','本轮跟进说明'],evidence:['Retained source references','保留证据来源'],
 report:['Read the ten-location report','阅读十址报告'],data:['Download priority data (JSON)','下载优先级数据（JSON）'],
 note:['All three numbers are investigation priorities, not qualified investment ranks. Expand a location for its evidence and conditional economics.','三个数字均为调查优先级，不是合格投资排名。打开场地查看证据及有条件经济性。']
};
export const followupText = (key,lang='en') => copy[key][lang==='zh'?1:0];
export function renderFollowupOverview(data, {e,lang='en',mode='combined',interactive=true}) {
 const r=data.followupReview;if(!r)return '';
 const t=k=>followupText(k,lang),loc=v=>e(v[lang]);
 const table=orderedFollowups(data.candidates,mode).map(c=>{const f=c.followup;return `<tr data-followup-id="${e(c.id)}"><th scope="row">${interactive?`<button class="text-button" data-followup-select="${e(c.id)}">${e(c.name)} ↗</button>`:`<a href="#workspace">${e(c.name)}</a>`}<small>${e(c.address)}</small><small>${loc(f.projectScope)}</small></th>${['combined','network','investor'].map(k=>`<td class="followup-number">${f.ranks[k]}</td>`).join('')}<td>${loc(f.reason)}</td><td>${loc(f.nextChecks)}</td></tr>`;}).join('');
 return `<p class="eyebrow">${t('round')}</p><h2>${t('title')}</h2><p class="audit-lead">${loc(r.method)}</p><p class="followup-boundary"><strong>${t('pending')}</strong><br>${loc(r.boundary)}</p>${interactive?`<label class="followup-sort">${t('sort')} <select id="followup-order">${['combined','network','investor'].map(k=>`<option value="${k}" ${k===mode?'selected':''}>${t(k)}</option>`).join('')}</select></label>`:''}<div class="table-scroll"><table class="followup-table"><thead><tr><th scope="col">${t('site')}</th>${['combined','network','investor'].map(k=>`<th scope="col">${t(k)}</th>`).join('')}<th scope="col">${t('reason')}</th><th scope="col">${t('next')}</th></tr></thead><tbody>${table}</tbody></table></div><p class="small">${t('note')}</p><p class="small muted">${loc(r.evidenceScope)}</p><p><a href="./docs/FOLLOWUP-PRIORITIES.md">${t('report')}</a> · <a href="./data/followup-priorities.json">${t('data')}</a></p>`;
}
export function renderFollowupDetail(candidate,{e,lang='en',refs=()=>''}) {
 const f=candidate.followup;if(!f)return '';
 const t=k=>followupText(k,lang),loc=v=>e(v[lang]);
 return `<section class="followup-detail"><p class="eyebrow">${t('detail')}</p><h3>${loc(f.projectScope)}</h3><p class="followup-ranks">${['combined','network','investor'].map(k=>`${t(k)} <strong>#${f.ranks[k]}</strong>`).join(' · ')}</p><p class="small">${t('ranks')} · ${t('pending')}</p><h4>${t('reason')}</h4><p>${loc(f.reason)}</p><h4>${t('next')}</h4><p>${loc(f.nextChecks)}</p><h4>${t('stop')}</h4><p>${loc(f.stopCondition)}</p><details><summary>${t('evidence')}</summary><p class="small">${refs(f.sourceIds)}</p></details></section>`;
}
