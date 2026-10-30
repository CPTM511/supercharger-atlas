/** Reproducible supplementary calculations. Public schedules are conditional
 * subtotals, NOT verified parcel bills and never substitutes for evidence gates. */
import fs from 'node:fs';
import {calculateProject,assessScenarioHurdle} from '../model.js';
const root=new URL('../',import.meta.url), read=p=>JSON.parse(fs.readFileSync(new URL(p,root)));
const data=read('data/candidates.json'), previous=read('data/previous-results-v0.2.json'), profiles=read('data/tariff-sensitivities.json');
const b=(en,zh)=>({en,zh});
for(const c of data.candidates){
 const e=c.economics;
 e.previous=previous.sites[c.id];
 e.changeReason=b('Conservative session energy is reduced from 40 to 22 kWh using an older non-Tesla paid-session analogue as a downside assumption. Base and optimistic inputs are unchanged where no defensible site-specific replacement exists. Public tariff sensitivities below are separate incomplete-bill tests.','保守单次电量由40降至22kWh，以较早非Tesla付费样本作下行假设。没有可靠逐址替代值时基准与乐观输入保留。下方公开费率敏感性单独计算，非完整账单。');
 const required=e.requiredSessionsForBaseGate;
 e.throughputComparison={requiredKwhPerStallDay:required===null?null:required*e.scenarios.base.inputs.kwhPerSession,observedNetworkKwhPerStallDay:276,ratio:required===null?null:required*e.scenarios.base.inputs.kwhPerSession/276,sourceIds:['V3-EVGO'],note:b('EVgo reported 276 kWh/stall/day for its owned public network in Q2 2026. A network-wide average is neither a local demand forecast nor an upper bound. The required volume keeps price and the all-in electricity proxy fixed, so it is a mechanical hurdle test.','EVgo报告2026Q2自营公共网络276kWh/枪/日。网络均值不是本站需求预测或上限。门槛销量计算保持售价及综合电费代理不变，仅为数学条件测试。')};
 e.tariffSensitivities=[];
 for(const p of profiles.profiles.filter(p=>p.candidateIds.includes(c.id))){
  const scenarios={};
  for(const [key,s] of Object.entries(e.scenarios)){
   const peak=profiles.assumedBilledPeaksKw[key];
   if(p.maxPeakKwExclusive && peak>=p.maxPeakKwExclusive)continue;
   const inputs={...s.inputs,tariffMode:'energy_only',energyPerKwh:p.energyPerKwh,demandPerKwMonth:p.demandPerKwMonth,billedPeakKw:peak,utilityFixedMonthly:p.utilityFixedMonthly||0,utilityFixedDaily:p.utilityFixedDaily||0,demandFreeKw:p.demandFreeKw||0,minimumBillDaily:p.minimumBillDaily||0,...(p.scenarioOverrides?.[key]||{})};
   scenarios[key]={inputs,outputs:calculateProject(inputs)};
  }
  e.tariffSensitivities.push({profileId:p.id,title:p.title,sourceIds:p.sourceIds,limitation:p.limitation,scenarios,hurdle:scenarios.conservative?assessScenarioHurdle(scenarios):null});
 }
}
fs.writeFileSync(new URL('data/candidates.json',root),JSON.stringify(data,null,2)+'\n');
console.log(`Updated ${data.candidates.length} comparisons; ${data.candidates.reduce((n,c)=>n+c.economics.tariffSensitivities.length,0)} conditional tariff tests.`);
