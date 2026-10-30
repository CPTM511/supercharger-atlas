#!/usr/bin/env python3
"""Independent arithmetic audit: deliberately does not import the JS model."""
import json, math
from pathlib import Path
root=Path(__file__).resolve().parents[1]
data=json.loads((root/'data/candidates.json').read_text())
policy=json.loads((root/'data/economics-policy.json').read_text())
def close(actual,expected,label):
    assert math.isclose(actual,expected,rel_tol=1e-10,abs_tol=1e-7),(label,actual,expected)
checked=0
for c in data['candidates']:
    for name,s in c['economics']['scenarios'].items():
        x=s['inputs']; y=s['outputs']; a=policy['scenarioAnchors'][name]
        close(x['energyPerKwh'],policy['stateElectricity'][c['state']]['commercialYtdUsdPerGridKwh']*a['electricityMultiplier'],'regional rate binding')
        close(x['capex'],940000*(1+a['unpricedCostAllowanceFraction']),'capital anchor')
        assert x['tariffMode']=='fully_burdened' and x['demandPerKwMonth']==0 and x['billedPeakKw']==0
        q=x['stalls']*x['sessionsPerStallDay']*365*x['kwhPerSession']
        revenue=q*x['retailPerKwh']; energy=q/(1-x['lossFraction'])*x['energyPerKwh']; service=q*x['servicePerKwh']
        fixed=x['fixedMonthly']*12; reserve=x['capex']*x['sustainingCapexFraction']; holding=x['preOpeningMonthly']*12*x['constructionYears']
        cash=revenue-energy-service-fixed
        for key,value in [('annualKwh',q),('revenue',revenue),('energyCost',energy),('serviceCost',service),('fixedCost',fixed),('operatingCash',cash),('annualSustainingCapex',reserve),('stabilizedFreeCash',cash-reserve),('preOpeningHoldingCost',holding)]:close(y[key],value,f'{c["id"]}/{name}/{key}')
        npv=-x['capex']-holding/(1+x['discountRate'])**(x['constructionYears']/2)
        balance=-x['capex']-holding; recovery=None
        for year in range(1,x['operatingYears']+1):
            ramp=x['firstYearRamp'] if year==1 else 1
            cf=(revenue-energy-service)*ramp-fixed-reserve
            npv+=cf/(1+x['discountRate'])**(x['constructionYears']+year)
            if recovery is None and cf>0 and balance<0<=balance+cf:recovery=x['constructionYears']+year-1-balance/cf
            balance+=cf
            close(y['cashflows'][year-1]['cash'],cf,'annual free cash')
        close(y['npv'],npv,'project NPV')
        if recovery is None:assert y['projectPaybackYears'] is None
        else:close(y['projectPaybackYears'],recovery,'project payback')
        checked+=1
print(f'Independent Python recomputation reconciled {checked} regional benchmark scenarios, including construction holding cost, ramp, replacement allowance, NPV and payback.')
