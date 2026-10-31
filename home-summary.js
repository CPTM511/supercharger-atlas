import {orderedFollowups} from './followup-view.js?v=1341d4030c3e';

// Editorial summaries only. Ranks and financial values come from retained data.
const copy = {
 shortlist: ['01 / WHERE TO FOCUS', '01 / 重点场地'],
 title: ['Ten locations worth investigating', '十个值得重点跟进的场地'],
 lead: ['One shortlist, two perspectives. Network order prioritizes coverage; third-party order prioritizes investability. These are follow-up priorities within the existing 37-site study—not qualified investments.', '同一清单，两种视角：网络顺序侧重覆盖价值，第三方顺序侧重投资成立条件。这是现有37址研究中的跟进优先级，尚非合格投资标的。'],
 overall: ['Overall', '综合'], network: ['Network', '网络'], investor: ['Third-party', '第三方'],
 order: ['Order by', '排序依据'], location: ['Location', '场地'], why: ['Why it merits a closer look', '值得进一步核实的原因'],
 note: ['Distances and supply records retain their original snapshot dates. Open a location for its full evidence, scope and stop conditions.', '距离和供给记录保留原快照日期。打开场地可查看完整证据、项目范围及暂停条件。'],
 brief: ['Ten-location research brief', '十址研究简报'],
 decision: ['02 / WHAT WOULD CHANGE THE DECISION', '02 / 什么证据会改变判断'],
 decisionTitle: ['Promising sites still need commercial proof', '有潜力的场地，仍需商业证据'],
 decisionLead: ['Investment readiness remains unproven. Paid demand at a viable price, complete project costs and binding delivery terms must work together; favorable assumptions alone do not qualify a site.', '投资可行性仍未获证实。可行价格下的付费需求、完整项目成本与有约束力的交付条款必须同时成立，仅凭有利假设不能获得准入。'],
 ronald: ['First follow-up: Ronald Reagan H-E-B', '首要跟进：Ronald Reagan H-E-B'],
 ronaldScope: ['Four-post conditional case · not a local demand forecast', '四枪条件测算 · 并非本地需求预测'],
 base: ['Conditional base payback', '有条件基准回本'], downside: ['Paired conservative case', '配对保守情景'], noRecovery: ['No recovery within 10 operating years', '10个运营年内未回本'], years: ['years', '年'],
 target: ['Assumes {sessions} paid sessions/day × {energy} billed kWh, {price}/kWh realized price and {cp} kW established 4CP, with {capital} assumed base capital. Demand, control performance and complete cost remain unverified.', '假设每天{sessions}次付费充电 × 每次计费{energy}kWh，实现价格{price}/kWh，已建立4CP为{cp}kW，假设基准资本支出{capital}。需求、控峰性能及完整成本仍待核实。'],
 joint: ['The base result does not clear the joint investment gate.', '该基准结果仍未通过联合投资门槛。'],
 demand: ['Paid demand', '真实付费需求'], demandText: ['Obtain nearby settled transactions at comparable prices, billed energy, uptime and queues. Test whether volume transfers to this exact site.', '获取附近可比价格下的结算交易、计费电量、可用率与排队记录，检验订单量能否迁移到本址。'],
 cost: ['Complete cost & site rights', '完整成本与场地权利'], costText: ['Secure parking/access terms and a design-matched EPC, utility and operating-cost package. Expansion or recovery needs incremental cash flows.', '落实停车与通行条款，取得设计范围匹配的EPC、接电及运营成本。扩容或恢复项目必须使用增量现金流。'],
 grid: ['Grid & peak control', '接电与控峰'], gridText: ['Confirm meter, tariff, firm capacity/date and a priced Tesla/PEC control plan. Test lost sales and missed peaks; a 150 kW 4CP target is not a permanent power cap.', '确认电表、费率、明确容量/交期及有报价的Tesla/PEC控峰方案。测试销量损失及峰值漏控；150kW的4CP目标不等于全时限功率。'],
 policyTitle: ['One standard for both perspectives', '两种视角使用同一门槛'],
 policy: ['Payback from first spend: base ≤ {base} years; conservative ≤ {downside} years. Base NPV ≥ 0 at {discount}% real over {years} operating years; positive conservative cash after replacement allowance; all six evidence gates verified. These are chosen underwriting rules, not Tesla policy.', '从首笔支出起回本：基准≤{base}年，保守≤{downside}年；{years}个运营年、{discount}%实际折现率下基准NPV≥0；保守情景扣更新预留后现金为正，且六类证据齐全。这是选定的投资规则，不是Tesla政策。'],
 support: ['Unawarded incentives remain sensitivities. Grants, rebates and credits only improve a qualifying case when eligibility, timing and costs are substantiated.', '未获批激励仍仅用于敏感度分析；补助、返利和积分须有资格、到账时间及成本依据，才能支持合格判断。'],
 explore: ['Continue to Site explorer', '继续查看场地浏览器'],
 evidence: ['Detailed research', '完整研究文档'],history: ['Research history on GitHub', 'GitHub 历史更新'],
 ronaldReport: ['Ronald Reagan analysis', 'Ronald Reagan 分析'],incentives: ['Incentive conditions', '激励条件']
};
const reasons = {
 'heb-ronaldreagan': ['The clearest test of paid demand, complete cost and PEC peak control.', '付费需求、完整成本及PEC控峰条件最明确、可检验的假设。'],
 'winco-puyallup': ['24-hour retail and a supply-gap hypothesis; tariff and control costs are decisive.', '全天零售与供给缺口假设；电价及控峰成本是关键。'],
 'heb-elgin': ['US 290 corridor potential; verify the serving utility and driveway/road plans first.', 'US290走廊潜力；先确认实际供电商和出入口/道路规划。'],
 'winco-oregoncity': ['Supply spacing and a property plan support a targeted parking/utility inquiry.', '供给间距及场地图支持定向核查停车权与供电条件。'],
 'net-machias': ['Restart only. Check the canceled project, funding eligibility and Tesla compatibility.', '仅重启假设。核查项目取消原因、资助资格与Tesla兼容性。'],
 'heb-mansfield': ['A concrete property/utility route; nearby competing supply needs checking first.', '有具体地块及供电路径；先核实附近竞争供给。'],
 'winco-edmonds': ['Expansion/redesign only. Existing EVgo rights and incremental demand govern the case.', '仅扩容/改造。须核实现有EVgo权利及增量需求。'],
 'net-colebrook': ['Recovery/upgrade only. Named operator and utility offer a route to actual operating logs.', '仅恢复/升级。具名运营商及供电方提供实际运营记录获取路径。'],
 'net-challis': ['A large corridor gap merits a network check; seasonal paid demand is unproven.', '较大走廊缺口值得核查网络价值；季节性付费需求未证实。'],
 'winco-medford': ['Recovery/redesign only. Resolve cancellation, reuse costs and nearby competition.', '仅恢复/重设计。查清取消原因、复用成本及近邻竞争。']
};
const word=(key,lang)=>copy[key][lang==='zh'?1:0];
const interpolate=(text,values)=>text.replace(/\{(\w+)\}/g,(_,key)=>String(values[key]));

export function renderHomeShortlist(data,{e,lang='en',mode='combined',interactive=true}) {
 const t=key=>word(key,lang),candidates=orderedFollowups(data.candidates,mode);
 const rows=candidates.map(c=>{
  const r=c.followup.ranks,reason=reasons[c.id]?.[lang==='zh'?1:0]??c.followup.reason[lang];
  return `<tr data-followup-id="${e(c.id)}"><td class="summary-rank">${r.combined}</td><th scope="row">${interactive?`<button class="text-button" data-followup-select="${e(c.id)}">${e(c.name)} ↗</button>`:`<a href="#workspace">${e(c.name)}</a>`}<small>${e(c.address)}</small></th><td class="summary-rank">${r.network}</td><td class="summary-rank">${r.investor}</td><td>${e(reason)}</td></tr>`;
 }).join('');
 return `<div class="summary-heading"><div><p class="eyebrow">${t('shortlist')}</p><h2>${t('title')}</h2></div>${interactive?`<label class="summary-sort">${t('order')}<select id="followup-order">${['combined','network','investor'].map(k=>`<option value="${k}" ${mode===k?'selected':''}>${t(k==='combined'?'overall':k)}</option>`).join('')}</select></label>`:''}</div><p class="summary-lead">${t('lead')}</p><div class="table-scroll"><table class="summary-shortlist"><thead><tr><th scope="col">${t('overall')}</th><th scope="col">${t('location')}</th><th scope="col">${t('network')}</th><th scope="col">${t('investor')}</th><th scope="col">${t('why')}</th></tr></thead><tbody>${rows}</tbody></table></div><p class="summary-footnote">${t('note')} <a href="./docs/FOLLOWUP-PRIORITIES.md">${t('brief')} ↗</a></p>`;
}

export function renderHomeDecision(data,{e,lang='en',interactive=true}) {
 const t=key=>word(key,lang),r=data.ronaldValidationReview,c=data.candidates.find(c=>c.id===r.candidateId),a=c.ronaldValidation.analysis,p=data.policy;
 const base=a.scenarios.base,downside=a.scenarios.conservative;
 const target=interpolate(t('target'),{sessions:r.settings.sessionsPerDay,energy:r.settings.kwhPerSession,price:'$'+base.inputs.retailPerKwh.toFixed(2),cp:r.settings.capKw,capital:new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(base.inputs.capex)});
 const policy=interpolate(t('policy'),{base:p.basePaybackMaxYears,downside:p.conservativePaybackMaxYears,discount:p.discountRate*100,years:p.operatingYears});
 const payback=value=>value===null?t('noRecovery'):`${value.toFixed(2)} ${t('years')}`;
 return `<p class="eyebrow">${t('decision')}</p><h2>${t('decisionTitle')}</h2><p class="summary-lead">${t('decisionLead')}</p><div class="summary-decision-grid"><article class="summary-ronald"><h3>${t('ronald')}</h3><p class="summary-footnote">${t('ronaldScope')}</p><div class="summary-results"><div><span>${t('base')}</span><strong>${e(payback(base.outputs.projectPaybackYears))}</strong></div><div><span>${t('downside')}</span><strong>${e(payback(downside.outputs.projectPaybackYears))}</strong></div></div><p>${e(target)}</p><p class="summary-caution">${t('joint')}</p>${interactive?`<button class="text-button" data-followup-select="${e(c.id)}">${t('ronaldReport')} ↗</button>`:`<a href="./docs/RONALD-VALIDATION.md">${t('ronaldReport')} ↗</a>`}</article><div class="summary-checks">${['demand','cost','grid'].map((key,i)=>`<article><span class="summary-step">0${i+1}</span><div><h3>${t(key)}</h3><p>${t(key+'Text')}</p></div></article>`).join('')}</div></div><div class="summary-policy"><h3>${t('policyTitle')}</h3><p>${e(policy)}</p><p class="summary-footnote">${t('support')} <a href="./docs/INCENTIVES-AND-OWNERSHIP.md">${t('incentives')} ↗</a></p></div><div class="summary-links"><a class="button button-small" href="#workspace">${t('explore')} ↓</a><div><a href="https://github.com/CPTM511/supercharger-atlas/tree/main/docs" target="_blank" rel="noopener noreferrer">${t('evidence')} ↗</a><a href="https://github.com/CPTM511/supercharger-atlas/blob/main/CHANGELOG.md" target="_blank" rel="noopener noreferrer">${t('history')} ↗</a></div></div>`;
}
