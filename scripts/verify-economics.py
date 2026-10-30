#!/usr/bin/env python3
"""Independent arithmetic audit; does not import JS or its outputs as inputs."""
import json, math
from pathlib import Path
root=Path(__file__).resolve().parents[1]
data=json.loads((root/'data/candidates.json').read_text())
policy=json.loads((root/'data/economics-policy.json').read_text())
profiles=json.loads((root/'data/tariff-sensitivities.json').read_text())

def close(actual,expected,label):
    assert math.isclose(actual,expected,rel_tol=1e-10,abs_tol=1e-7),(label,actual,expected)

def annual(x,ramp=1):
    q=x['stalls']*x['sessionsPerStallDay']*365*x['kwhPerSession']*ramp
    revenue=q*x['retailPerKwh']; energy=q/(1-x['lossFraction'])*x['energyPerKwh']; service=q*x['servicePerKwh']
    demand=max(0,x['billedPeakKw']-x.get('demandFreeKw',0))*x['demandPerKwMonth']*12
    uf=x.get('utilityFixedMonthly',0)*12+x.get('utilityFixedDaily',0)*365
    minimum=max(0,x.get('minimumBillDaily',0)*365-energy-demand-uf)
    fixed=x['fixedMonthly']*12
    return {'annualKwh':q,'gridKwh':q/(1-x['lossFraction']),'revenue':revenue,'energyCost':energy,'serviceCost':service,'demandCost':demand,'utilityFixedCost':uf,'minimumBillAdjustment':minimum,'electricityCost':energy+demand+uf+minimum,'fixedCost':fixed,'operatingCash':revenue-service-fixed-energy-demand-uf-minimum}

def verify(s,label):
    x=s['inputs']; y=s['outputs']; a=annual(x)
    reserve=x['capex']*x['sustainingCapexFraction'];holding=x['preOpeningMonthly']*12*x['constructionYears']
    a.update(annualSustainingCapex=reserve,stabilizedFreeCash=a['operatingCash']-reserve,preOpeningHoldingCost=holding)
    for key,value in a.items():close(y[key],value,f'{label}/{key}')
    npv=-x['capex']-holding/(1+x['discountRate'])**(x['constructionYears']/2)
    balance=-x['capex']-holding;recovery=None
    for year in range(1,x['operatingYears']+1):
        cf=annual(x,x['firstYearRamp'] if year==1 else 1)['operatingCash']-reserve
        npv+=cf/(1+x['discountRate'])**(x['constructionYears']+year)
        if recovery is None and cf>0 and balance<0<=balance+cf:recovery=x['constructionYears']+year-1-balance/cf
        balance+=cf
        close(y['cashflows'][year-1]['cash'],cf,'annual free cash')
    close(y['npv'],npv,'project NPV')
    if recovery is None:assert y['projectPaybackYears'] is None
    else:close(y['projectPaybackYears'],recovery,'project payback')
    return recovery

checked=conditional=0
for c in data['candidates']:
    for name,s in c['economics']['scenarios'].items():
        x=s['inputs'];anchor=policy['scenarioAnchors'][name]
        close(x['energyPerKwh'],policy['stateElectricity'][c['state']]['commercialYtdUsdPerGridKwh']*anchor['electricityMultiplier'],'regional rate binding')
        close(x['capex'],940000*(1+anchor['unpricedCostAllowanceFraction']),'capital anchor')
        close(x['kwhPerSession'],anchor['kwhPerSession'],'session analogue binding')
        assert x['tariffMode']=='fully_burdened' and x['demandPerKwMonth']==0 and x['billedPeakKw']==0
        verify(s,c['id']+'/'+name);checked+=1
    for test in c['economics']['tariffSensitivities']:
        p=next(p for p in profiles['profiles'] if p['id']==test['profileId'])
        assert c['id'] in p['candidateIds']
        for name,s in test['scenarios'].items():
            x=s['inputs'];assert x['tariffMode']=='energy_only'
            for k in ['energyPerKwh','demandPerKwMonth','demandFreeKw','utilityFixedMonthly','utilityFixedDaily','minimumBillDaily']:close(x[k],p.get('scenarioOverrides',{}).get(name,{}).get(k,p.get(k,0)),'tariff field '+k)
            if p['id']=='pacific-power-30-201':
                load=x['loadSizeKw']
                assert load==profiles['assumedBilledPeaksKw'][name] and load<1000
                close(x['utilityFixedMonthly'],((198+2.45*load) if load<=300 else (525+1.20*load))*1.015,'Schedule30 basic/load-size plus conditional public-purpose mapping')
                close(x['energyPerKwh'],.06537*1.015+(.047+.830+.138+.278)/100,'Schedule30 energy and four known riders')
                close(x['demandPerKwMonth'],13.07*1.015,'Schedule30 demand and conditional public-purpose mapping')
            close(x['billedPeakKw'],profiles['assumedBilledPeaksKw'][name],'peak assumption')
            verify(s,c['id']+'/'+p['id']+'/'+name);conditional+=1
print(f'Independent Python recomputation reconciled {checked} main scenarios and {conditional} tariff subtotal sensitivities, including demand exemptions, fixed/daily charges, minimum bills, ramp, construction, NPV and payback.')
