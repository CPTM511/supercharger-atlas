import {calculateLocalProject} from './local-model.js';
import {assessScenarioHurdle} from './model.js';

// This tests a proposed sales target. It does not estimate local demand or
// claim that a controller can achieve any of the coincident-peak assumptions.
export function analyzeRonaldTarget(hypothesis, referencePlan, settings) {
  const {sessionsPerDay, kwhPerSession, lossFraction, storeHours, capKw, tou17h} = settings;
  if (![sessionsPerDay,kwhPerSession,storeHours,capKw,tou17h].every(v=>Number.isFinite(v)&&v>0) || lossFraction<0 || lossFraction>=1) throw new RangeError('Invalid target assumptions');
  const components=referencePlan.components;
  const {analysis:historicalAnalysis,...planDefinition}=referencePlan;
  const planFor=(cp,energy=components.uniformHourTou)=>({
    ...planDefinition,
    first:{...referencePlan.first,energyPerKwh:energy+components.firstYearEnergyTcos},
    later:{...referencePlan.later,energyPerKwh:energy,demandPerKwMonth:components.peakRate+cp*components['4cpRate']/components.peakKw},
  });
  const evaluate=(kind,{cp=150,energy=components.uniformHourTou,sessionEnergy=kwhPerSession,extraCapex=0,retailPerKwh=null,stationSessions=sessionsPerDay}={})=>{
    const factor={conservative:.7,base:1,optimistic:1.2}[kind];
    const inputs={...hypothesis.analysis.scenarios[kind].inputs,kwhPerSession:sessionEnergy,
      sessionsPerStallDay:stationSessions*factor/4,lossFraction};
    inputs.capex+=extraCapex;
    if(retailPerKwh!==null)inputs.retailPerKwh=retailPerKwh;
    const plan=planFor(cp,energy),utilityStress=kind==='conservative'?1.25:1;
    return {inputs,plan,utilityStress,outputs:calculateLocalProject(inputs,plan,utilityStress)};
  };
  const scenarios=Object.fromEntries(['conservative','base','optimistic'].map(k=>[k,evaluate(k)]));
  const cpCases=[0,1,2,4].map(missedMonths=>{
    const cp=((4-missedMonths)*150+missedMonths*600)/4;
    return {missedMonths,cp,annualTcos:cp*components['4cpRate']*12,
      addedAnnualTcos:(cp-150)*components['4cpRate']*12,...evaluate('base',{cp})};
  });
  const energyCases=[22,35].map(sessionEnergy=>({sessionEnergy,...evaluate('base',{sessionEnergy})}));
  const costCases=[0,100000,200000].map(extraCapex=>({extraCapex,...evaluate('base',{extraCapex})}));
  const priceCases=[.4,.45,.51].map(retailPerKwh=>({retailPerKwh,...evaluate('base',{retailPerKwh})}));
  const portCases=[22,35].map(sessionEnergy=>({stationSessions:sessionsPerDay*4/5,sessionEnergy,...evaluate('base',{sessionEnergy,stationSessions:sessionsPerDay*4/5})}));
  const operatingHoursCase=evaluate('base',{energy:tou17h});
  const deliveredDay=sessionsPerDay*kwhPerSession,gridDay=deliveredDay/(1-lossFraction);
  const energy={deliveredDay,gridDay,deliveredYear:deliveredDay*365,gridYear:gridDay*365,
    perPostDay:deliveredDay/4,sessionsPerPostDay:sessionsPerDay/4,
    equivalentFullPowerHours:gridDay/capKw,averageKw24h:gridDay/24,averageKwStoreHours:gridDay/storeHours,
    storeWindowCapacityFraction:gridDay/(capKw*storeHours),
    maxSessionsStoreHours:capKw*storeHours*(1-lossFraction)/kwhPerSession,
    fourConcurrentDeliveredKwEach:capKw*(1-lossFraction)/4,
    fourConcurrentMinutes:kwhPerSession/(capKw*(1-lossFraction)/4)*60};
  return {energy,scenarios,cpCases,energyCases,costCases,priceCases,portCases,operatingHoursCase,
    hurdle:assessScenarioHurdle(scenarios),evidenceAdmitted:false};
}
