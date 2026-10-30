#!/usr/bin/env python3
"""Independent forward cash arithmetic for all published support sensitivities."""
import json, math
from pathlib import Path
root=Path(__file__).resolve().parents[1]
data=json.loads((root/'data/candidates.json').read_text())

def close(a,b,label):
    if a is None or b is None: assert a is b,(label,a,b)
    else: assert math.isclose(a,b,abs_tol=1e-6,rel_tol=1e-10),(label,a,b)

def independent(x,fraction,delay,temporary=False):
    cap=x['capex'];holding=x['preOpeningMonthly']*12*x['constructionYears']
    reserve=cap*x['sustainingCapexFraction'];grant=cap*fraction
    discount=x['discountRate'];build=x['constructionYears']
    balance=-cap-holding+(grant if delay==0 else 0)
    npv=-cap-holding/(1+discount)**(build/2)+grant/(1+discount)**(build+delay)
    payback=0 if balance==0 else None
    rebate_left=300000 if temporary else 0
    rebates=[]
    for year in range(1,x['operatingYears']+1):
        ramp=x['firstYearRamp'] if year==1 else 1
        energy=x['stalls']*x['sessionsPerStallDay']*365*x['kwhPerSession']*ramp
        bill=energy/(1-x['lossFraction'])*x['energyPerKwh']
        # Published support inputs use all-in rates; no second demand charge.
        assert x['tariffMode']=='fully_burdened'
        cash=energy*(x['retailPerKwh']-x['servicePerKwh'])-bill-x['fixedMonthly']*12-reserve
        before=balance;balance+=cash
        if balance<0:payback=None
        if payback is None and before<0<=balance and cash>0:payback=build+year-1-before/cash
        rebate=min(rebate_left,bill*[1,.8,.6,.4,.2][year-1]) if temporary and year<=5 else 0
        rebate_left-=rebate;rebates.append(rebate)
        before=balance
        balance+=rebate+(grant if year==delay else 0)
        if payback is None and before<0<=balance:payback=build+year
        npv+=(cash+rebate)/(1+discount)**(build+year)
    return {'projectPaybackYears':payback,'npv':npv,'finalCumulativeCash':balance,
        'stabilizedFreeCash':cash,'annualSustainingCapex':reserve,
        'grossFundingBeforeReimbursement':cap+holding,'capitalSupport':grant},rebates

checked=0
for c in data['candidates']:
    s=c['supportReview']
    assert s['admittedCapitalSupport']==s['admittedRecurringSupport']==0
    assert s['decisionBefore']==s['decisionAfter']==c['review']['decision']
    for case in s['cases']:
        for name,o in case['scenarios'].items():
            expected,_=independent(c['economics']['scenarios'][name]['inputs'],case['fraction'],case['delayYears'])
            for key,value in expected.items():close(o[key],value,c['id']+'/'+name+'/'+key)
            checked+=1
        for o in case['volume']:
            x={**c['economics']['scenarios']['base']['inputs'],'sessionsPerStallDay':o['sessions']}
            expected,_=independent(x,case['fraction'],case['delayYears'])
            for key,value in expected.items():close(o[key],value,'volume/'+key)
            checked+=1
    if 'temporaryProgramCase' in s:
        assert c['id']=='net-machias'
        for name,o in s['temporaryProgramCase']['scenarios'].items():
            x=c['economics']['scenarios'][name]['inputs']
            expected,rebates=independent(x,min(600000,x['capex'])/x['capex'],1,True)
            for key,value in expected.items():close(o[key],value,'temporary/'+key)
            close(o['utilitySupportReceived'],sum(rebates),'temporary total')
            for actual,expected_rebate in zip(o['utilityRebates'],rebates):close(actual['rebate'],expected_rebate,'expiry/cap')
            assert all(z['rebate']==0 for z in o['utilityRebates'][5:])
            checked+=1
print(f'Independent Python reconciled {checked} dated-support/volume cases, including temporary benefit expiry and gross-cost preservation.')
