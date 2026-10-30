import fs from 'node:fs';
import {calculateProject, classifyCandidate, INVESTMENT_POLICY} from '../model.js';
const root=new URL('../',import.meta.url);
const file=new URL('data/candidates.json',root);
const data=JSON.parse(fs.readFileSync(file));
const policy=JSON.parse(fs.readFileSync(new URL('data/economics-policy.json',root)));
const b=(en,zh)=>({en,zh});
for(const c of data.candidates){
 const rate=policy.stateElectricity[c.state];
 if(!rate)throw new Error(`Missing regional benchmark ${c.state}`);
 const scenarios={};
 for(const [name,a] of Object.entries(policy.scenarioAnchors)){
  const {electricityMultiplier,unpricedCostAllowanceFraction,...anchor}=a;
  const inputs={...anchor,stalls:8,energyPerKwh:rate.commercialYtdUsdPerGridKwh*electricityMultiplier,capex:(500000+8*55000)*(1+unpricedCostAllowanceFraction),tariffMode:'fully_burdened',demandPerKwMonth:0,billedPeakKw:0};
  scenarios[name]={inputs,outputs:calculateProject(inputs)};
 }
 const classification=classifyCandidate({evidence:c.review.evidence,scenarios,fatalConflict:c.review.fatalConflict===true});
 c.review.decision=classification.decision;
 c.ranks={network:null,investor:null}; // Assignment requires a separate reviewed ranking of qualified properties.
 function required(input,cap,requireNpv){
  const succeeds=(n)=>{const r=calculateProject({...input,sessionsPerStallDay:n});return r.projectPaybackYears!==null&&r.projectPaybackYears<=cap&&r.stabilizedFreeCash>0&&(!requireNpv||r.npv>=0);};
  if(calculateProject(input).marginPerKwh<=0)return null;
  let lo=0,hi=1; while(!succeeds(hi) && hi<1e9)hi*=2;
  if(!succeeds(hi))return null; for(let i=0;i<70;i++){const m=(lo+hi)/2;if(succeeds(m))hi=m;else lo=m;}return hi;
 }
 const requiredBase=required(scenarios.base.inputs,6,true);
 scenarios.base.outputs.requiredSessionsForBaseGate=requiredBase;
 const sid=policy.sourceIds;
 const assumptions=[
  {key:'stateElectricity',label:b('Regional electricity anchor','地域电价参照'),valueOrRange:`${rate.state}: $${rate.commercialYtdUsdPerGridKwh.toFixed(4)}/grid kWh (${rate.period})`,kind:'fact',sourceIds:rate.sourceIds,note:b('EIA commercial revenue/sales average includes demand and fixed charges. This is not an EV tariff or parcel eligibility confirmation.','EIA商业电费收入/售电量均值已含需量及固定费；不是EV专用费率，也未确认本地块适用。')},
  {key:'electricityMultiplier',label:b('Electricity stress factors','电费压力倍数'),valueOrRange:'2× / 1.5× / 1×',kind:'assumption',sourceIds:[sid['ECO-EIA-METHOD'],sid['ECO-TESLA-BILL']],note:b('Chosen sensitivity factors, not measured EV bill multipliers. Actual low-utilization bills may be higher. No separate demand charge is added.','人为敏感性参数，不是实测EV电费倍数；低利用率实际账单可能更高，不再单加需量费。')},
  {key:'capex',label:b('Capital cost illustration','投资成本参照'),valueOrRange:'$940,000 × (1.35 / 1.20 / 1.10)',kind:'assumption',sourceIds:[sid['ECO-TESLA-ESTIMATOR']],note:b('One supplier example: $500k hardware + 8 × $55k medium installation. Added 35/20/10% allowances are not scoped grid, land, tax or EPC quotes and may be insufficient.','供应商单一示例：硬件50万美元+8×5.5万美元中等安装。35/20/10%预留不是接网、土地、税费或工程报价，可能不足。')},
  {key:'sessionsPerStallDay',label:b('Stabilized paid sessions','稳定期付费次数'),valueOrRange:b('2 / 4 / 8 per stall per calendar day','每枪每日2 / 4 / 8次'),kind:'assumption',sourceIds:[],note:b('Shared stress inputs. No site demand, capture rate or local achieved volume has been measured. City EV counts are not converted into sales.','共用压力输入，尚无本站需求、捕获率或实际销量；没有把城市EV数量换算成收入。')},
  {key:'retailPerKwh',label:b('Realized selling price','实际成交单价'),valueOrRange:'$0.40 / $0.45 / $0.50 per delivered kWh',kind:'assumption',sourceIds:[],note:b('Chosen prices, not local observations. Discounts, fleet contracts, taxes and willingness to pay require evidence.','人为设置，非本地成交观察；折扣、车队合同、税和支付意愿均待核。')},
  {key:'servicePerKwh',label:b('Platform / equipment service','平台与设备服务'),valueOrRange:'$0.10 per delivered kWh',kind:'assumption',sourceIds:[sid['ECO-TESLA-ESTIMATOR'],sid['ECO-TESLA-BUSINESS']],note:b('Supplier illustration, not a contract. Verify included maintenance, payment processing and the billed energy boundary; do not duplicate covered costs.','供应商示例，非合同。须核维护、支付处理及计量边界，已覆盖费用不得重复计入。')},
  {key:'fixedMonthly',label:b('Fixed and pre-opening costs','固定及投用前成本'),valueOrRange:'$5,000 / $2,500 / $1,500 per month',kind:'assumption',sourceIds:[],note:b('Unverified lease/insurance/admin/site-cost envelopes. The same monthly allowance is charged during construction; holding-cost NPV is timed at the construction midpoint. No utility fixed charge is separately added to the all-in proxy.','租金/保险/管理/现场成本包尚未验证；建设期也扣同额月费，持有成本按建设中点折现。综合电价代理外不另加电力固定费。')},
  {key:'sustainingCapexFraction',label:b('Uncovered site-asset replacement','未覆盖现场资产更新'),valueOrRange:b('2% / 1.5% / 1% of initial capex each operating year','每运营年初始投资的2% / 1.5% / 1%'),kind:'assumption',sourceIds:[],note:b('A conservative normalized cash deduction for excluded site assets, not a known maintenance contract or predicted replacement schedule. Reconcile with Tesla coverage before admission.','未覆盖现场资产的标准化现金扣减，非已知维护合同或预测更新计划；入选前须与Tesla服务范围核对。')},
  {key:'constructionYears',label:b('Construction and volume ramp','建设期及销量爬坡'),valueOrRange:b('1.5 / 1 / 0.75 years; year-one volume 50% / 75% / 100%','1.5 / 1 / 0.75年；首运营年销量50% / 75% / 100%'),kind:'assumption',sourceIds:[],note:b('No utility/EPC schedule is confirmed. No charging revenue before commissioning. Fixed costs are not reduced by the first-year volume ramp.','尚无电力/工程交期确认，投用前无充电收入；固定成本不随首年销量爬坡同比下降。')},
  {key:'lossFraction',label:b('Delivered energy and losses','交付电量与损耗'),valueOrRange:b('40kWh/session; loss 12% / 8% / 5%','40kWh/次；损耗12% / 8% / 5%'),kind:'assumption',sourceIds:[],note:b('No local meter or session sample. Grid purchase equals delivered energy/(1-loss). Actual billing boundaries require the contract.','没有本地计量或单次充电样本；购电=交付/(1-损耗)，真实计费边界须合同确认。')},
  {key:'discountRate',label:b('Horizon and real return hurdle','期限及实际回报要求'),valueOrRange:b('10 operating years; 10% real; no growth, subsidy or terminal value','10个运营年；10%实际折现率；零增长/补贴/残值'),kind:'assumption',sourceIds:data.policy.sourceIds,note:b('Chosen screening policy. NREL provides a historical 10-year EVSE modeling precedent, not a V4 life guarantee. A shorter enforceable tenure must shorten the horizon.','选定的筛选规则；NREL历史模型采用10年，但不是V4寿命保证；可执行租期更短时须缩短模型期限。')}
 ];
 c.economics={scenarios,assumptions,benchmarkState:c.state,requiredSessionsForBaseGate:requiredBase,hurdle:{...classification.hurdle,reason:classification.hurdle.passed?b('The reference scenario math meets the numeric rules; missing evidence still blocks admission.','参照情景数学达到数字门槛，但缺证据仍不能入选。'):b('The reference scenarios fail one or more hard payback/NPV/downside-cash tests. This is a failure of the stated assumptions, not proof that the actual parcel must lose money.','参照情景未通过至少一项回本/NPV/保守现金门槛；这说明该组假设不达标，并非证明真实物业必亏。')},note:b(`Electricity is conditioned only on the ${rate.state} commercial-state benchmark. Same-state results are intentionally identical where no verified property-specific inputs exist. These are conditional calculations for a third-party charging-revenue owner, not Tesla's network costs or host-rent returns.`, `电价仅按${rate.state}州商业统计作地域条件。在缺少物业独有实测参数时，同州结果有意保持一致，不虚构差异。这是第三方拥有充电收入的条件测算，不代表Tesla内部成本或场地主租金收益。`)};
}
fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');
console.log(JSON.stringify({properties:data.candidates.length,modeledScenarios:data.candidates.length*3,qualified:data.candidates.filter(c=>c.review.decision==='qualified').length,pending:data.candidates.filter(c=>c.review.decision==='pending').length,scenarioPass:data.candidates.filter(c=>c.economics.hurdle.passed).length}));
