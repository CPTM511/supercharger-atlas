#!/usr/bin/env python3
"""Independent closed-form checks of the all-in, one-variable boundaries.

No JS imports and no forward-model outputs used as calculation inputs.
The deadline balance uses the published linear intra-year payback convention.
"""
import json, math
from pathlib import Path

data=json.loads((Path(__file__).resolve().parents[1]/'data/candidates.json').read_text())

def factors(x, limit):
    d=x['constructionYears']; u=min(x['operatingYears'],max(0,limit-d))
    paid=min(u,1)*x['firstYearRamp']+max(0,u-1)
    pv=sum((1+x['discountRate'])**(-d-y) for y in range(1,x['operatingYears']+1))
    pvr=pv-(1-x['firstYearRamp'])*(1+x['discountRate'])**(-d-1)
    return u,paid,pv,pvr

def adequate(x,kind):
    lim=6 if kind=='base' else 8
    u,r,pv,pvr=factors(x,lim)
    q=x['stalls']*365*x['kwhPerSession']*x['sessionsPerStallDay']
    contribution=q*(x['retailPerKwh']-x['servicePerKwh']-x['energyPerKwh']/(1-x['lossFraction']))
    fixed=x['fixedMonthly']*12+x['capex']*x['sustainingCapexFraction']
    hold=x['preOpeningMonthly']*12*x['constructionYears']
    balance=contribution*r-fixed*u-x['capex']-hold
    npv=contribution*pvr-fixed*pv-x['capex']-hold/(1+x['discountRate'])**(x['constructionYears']/2)
    return balance>=-1e-6 and contribution>fixed and (kind!='base' or npv>=-1e-6)

checked=0
for c in data['candidates']:
    for kind in ['base','conservative']:
        x=c['economics']['scenarios'][kind]['inputs']; a=c['economics']['inverse'][kind]
        u,r,pv,pvr=factors(x,6 if kind=='base' else 8)
        hold=x['preOpeningMonthly']*12*x['constructionYears']; cap=x['capex']
        fixed=x['fixedMonthly']*12+cap*x['sustainingCapexFraction']
        target=max((cap+hold+fixed*u)/r,fixed)
        if kind=='base':target=max(target,(cap+hold/(1+x['discountRate'])**(x['constructionYears']/2)+fixed*pv)/pvr)
        q=x['stalls']*365*x['kwhPerSession']
        margin=x['retailPerKwh']-x['servicePerKwh']-x['energyPerKwh']/(1-x['lossFraction'])
        expected=target/q/margin if margin>0 else None
        actual=a['requiredSessionsPerStallDay']
        assert (actual is None)==(expected is None),c['id']
        if expected is not None: assert math.isclose(actual,expected,rel_tol=1e-9),(c['id'],kind,actual,expected)
        for metric,fields in [('maxCapex',['capex']),('maxAllInGridPrice',['energyPerKwh']),('maxFixedAndHoldingMonthly',['fixedMonthly','preOpeningMonthly']),('maxConstructionYears',['constructionYears'])]:
            value=a[metric]
            if value is None:
                assert not adequate({**x,**{f:0 for f in fields}},kind),(c['id'],kind,metric,'false null')
            else:
                assert adequate({**x,**{f:value*.999999 for f in fields}},kind),(c['id'],kind,metric,'below fails')
                assert not adequate({**x,**{f:value*1.000001+1e-7 for f in fields}},kind),(c['id'],kind,metric,'above passes')
            checked+=1
print(f'Independent deadline-balance and discounted-cash equations verified 74 minimum-volume results and {checked} one-input upper boundaries/nulls.')
