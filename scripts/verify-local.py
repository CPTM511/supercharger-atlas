"""Independent Decimal verification. No production JavaScript/helpers imported.

Input adapters are intentionally separate from cash-flow/threshold calculations.
Threshold is solved from affine cash balances at policy deadlines and NPV,
not by reproducing the production bisection.
"""
from decimal import Decimal as D, getcontext
from pathlib import Path
import json
import subprocess
import hashlib

getcontext().prec = 55
REPO = Path(__file__).resolve().parents[1]
ZERO, ONE = D(0), D(1)


def decimal_json(path):
    return json.loads(path.read_text(), parse_float=D, parse_int=D)


def cash_model(x, plan, stress=ONE, reimbursement=ZERO):
    """Direct annual ledger from source inputs; no production economics calls."""
    debt = x['capex'] + x['preOpeningMonthly'] * 12 * x['constructionYears']
    holding = debt - x['capex']
    balance = -debt
    rate = ONE + x['discountRate']
    npv = -x['capex'] - holding / rate ** (x['constructionYears'] / 2)
    rows = []
    for year in range(1, int(x['operatingYears']) + 1):
        tariff = plan['first'] if year <= plan['firstYears'] else plan['later']
        ramp = x['firstYearRamp'] if year == 1 else ONE
        sold = x['stalls'] * x['sessionsPerStallDay'] * x['kwhPerSession'] * 365 * ramp
        bought = sold / (ONE - x['lossFraction'])
        revenue = sold * x['retailPerKwh']
        energy = bought * tariff['energyPerKwh'] * stress
        demand = tariff['billedPeakKw'] * tariff['demandPerKwMonth'] * 12 * stress
        utility_fixed = tariff['utilityFixedMonthly'] * 12 * stress
        service = sold * x['servicePerKwh']
        fixed = x['fixedMonthly'] * 12
        reserve = x['capex'] * x['sustainingCapexFraction']
        operating_free = revenue - energy - demand - utility_fixed - service - fixed - reserve
        receipt = reimbursement if year == 1 else ZERO
        cash = operating_free + receipt
        balance += cash
        time = x['constructionYears'] + year
        npv += cash / rate ** time
        rows.append(dict(year=D(year), time=time, ramp=ramp, annualKwh=sold,
                         gridKwh=bought, revenue=revenue, energyCost=energy,
                         demandCost=demand, utilityFixedCost=utility_fixed,
                         electricityCost=energy+demand+utility_fixed,
                         serviceCost=service, fixedCost=fixed,
                         replacementAllowance=reserve, operatingFreeCash=operating_free,
                         capitalReceipt=receipt,cash=cash, cumulative=balance))
    # Find the last negative annual balance. Interpolate its following crossing;
    # unlike first-crossing payback, this cannot hide a subsequent relapse.
    balances = [-debt] + [r['cumulative'] for r in rows]
    negative = [i for i, v in enumerate(balances) if v < 0]
    payback = None
    if not negative:
        payback = ZERO
    elif negative[-1] < len(rows):
        prior_index = negative[-1]
        row = rows[prior_index]
        operating_free = row['operatingFreeCash']
        if balances[prior_index]+operating_free>=0 and operating_free>0:
            payback = x['constructionYears'] + prior_index - balances[prior_index] / operating_free
        else:
            payback = row['time']
    return dict(npv=npv, projectPaybackYears=payback,
                stabilizedFreeCash=rows[-1]['operatingFreeCash'],
                annualUtilitySubtotal=rows[-1]['electricityCost'],
                preOpeningHoldingCost=holding, finalCumulativeCash=balance,
                cashflows=rows)


def balance_at(result, x, deadline):
    remaining = max(ZERO, D(deadline)-x['constructionYears'])
    balance = -x['capex']-x['preOpeningMonthly']*12*x['constructionYears']
    for row in result['cashflows']:
        fraction = min(ONE, max(ZERO, remaining))
        balance += fraction*row['cash']
        remaining -= ONE
    return balance


def paired_inputs(scenarios, q):
    base = dict(scenarios['base']['inputs'])
    cons = dict(scenarios['conservative']['inputs'])
    base['sessionsPerStallDay'] = q/base['kwhPerSession']
    cons['sessionsPerStallDay'] = q*D('.7')/cons['kwhPerSession']
    return base, cons


def paired_constraints(scenarios, plan, q):
    base, cons = paired_inputs(scenarios, q)
    b = cash_model(base, plan)
    c = cash_model(cons, plan, D('1.25'))
    return dict(basePaybackBalance=balance_at(b,base,6),
                conservativePaybackBalance=balance_at(c,cons,8),
                baseNpv=b['npv'], conservativeCash=c['stabilizedFreeCash'])


def closed_form_threshold(scenarios, plan, physical_cap):
    at0 = paired_constraints(scenarios, plan, ZERO)
    at1 = paired_constraints(scenarios, plan, ONE)
    constraints = {}
    for k in at0:
        slope = at1[k]-at0[k]
        if slope <= 0:
            raise AssertionError(f'Nonpositive throughput response: {k}')
        constraints[k] = max(ZERO,-at0[k]/slope)
    needed = max(constraints.values())
    return (needed if needed <= physical_cap else None), constraints


def numeric_hurdle(scenarios):
    b, c = scenarios['base'], scenarios['conservative']
    tests = dict(basePayback=b['projectPaybackYears'] is not None and b['projectPaybackYears']<=6,
                 conservativePayback=c['projectPaybackYears'] is not None and c['projectPaybackYears']<=8,
                 baseNpv=b['npv']>=0, conservativeCash=c['stabilizedFreeCash']>0)
    return dict(passed=all(tests.values()), tests=tests)


def compare(actual, expected, label, errors, tolerance=D('.000001')):
    if isinstance(expected,dict):
        for key,value in expected.items():
            if key not in actual:
                errors.append(f'{label}.{key}: missing')
            else:
                compare(actual[key],value,f'{label}.{key}',errors,tolerance)
    elif isinstance(expected,list):
        if len(actual)!=len(expected):
            errors.append(f'{label}: length mismatch')
        else:
            for i,(a,b) in enumerate(zip(actual,expected)):
                compare(a,b,f'{label}[{i}]',errors,tolerance)
    elif isinstance(expected,D):
        if actual is None or abs(D(actual)-expected)>tolerance:
            errors.append(f'{label}: actual {actual}; independent {expected}')
    elif actual!=expected:
        errors.append(f'{label}: actual {actual}; independent {expected}')


def serialize(obj):
    if isinstance(obj,D):
        return float(obj)
    raise TypeError(type(obj).__name__)


def verify_case(name, analysis, plan):
    errors=[]
    results={}
    for key,scenario in analysis['scenarios'].items():
        result=cash_model(scenario['inputs'],plan,D('1.25') if key=='conservative' else ONE)
        compare(scenario['outputs'],result,f'{name}.{key}',errors)
        results[key]=result
    compare(analysis['numericHurdle'],numeric_hurdle(results),name+'.hurdle',errors)
    for i,transfer in enumerate(analysis['transfers']):
        result=cash_model(transfer['inputs'],plan)
        compare(transfer['outputs'],result,f'{name}.transfer[{i}]',errors)
        expected_energy=transfer['stationSessions']*transfer['kwhPerSession']/4
        compare(transfer['kwhPerPostDay'],expected_energy,f'{name}.transfer[{i}].energy',errors)
        assert transfer['assumedBillableFraction']==ONE
    x=analysis['scenarios']['base']['inputs']
    cap=plan['maxGridEnergyDay']*(ONE-x['lossFraction'])/x['stalls']
    compare(analysis['physicalBaseCap'],cap,name+'.physicalBaseCap',errors)
    threshold,constraints=closed_form_threshold(analysis['scenarios'],plan,cap)
    compare(analysis['requiredPairedKwhPerPostDay'],threshold,name+'.threshold',errors)
    assert analysis['evidenceAdmitted'] is False
    delay=analysis['delayStress']
    compare(delay['outputs'],cash_model(delay['inputs'],plan),name+'.delay',errors)
    capital=analysis.get('conditionalCapital')
    if capital:
        assert capital['bookedAward']==0 and capital['receipt']=='end_of_first_operating_year'
        assert capital['amount']==plan['unawardedGrantCeiling']
        compare(capital['outputs'],cash_model(x,plan,reimbursement=capital['amount']),name+'.capital',errors)
        retail=dict(x,sessionsPerStallDay=D(42)/4,kwhPerSession=D(35))
        compare(capital['retail42Outputs'],cash_model(retail,plan,reimbursement=capital['amount']),name+'.capital42',errors)
    return dict(name=name, scenarios=len(results), transfers=len(analysis['transfers']),
                delayedScenarios=1, conditionalCapitalScenarios=2 if capital else 0,
                requiredPairedKwhPerPostDay=threshold, bindingConstraints=constraints,
                errors=errors)


if __name__=='__main__':
    data=decimal_json(REPO/'data/candidates.json')
    canonical=decimal_json(REPO/'data/local-validation.json')
    canonical_by_id={r['candidateId']:r for r in canonical['records']}
    rates_errors=[]
    reports=[]
    tou=(D(122)*(17*D('.043481')+3*D('.093169')+4*D('.161843'))
        +D(153)*(20*D('.043481')+4*D('.086442'))
        +D(90)*(16*D('.043481')+8*D('.086442')))/(365*24)
    for c in data['candidates']:
        local=c.get('localValidation')
        if not local:
            continue
        for p in local['tariffPlans']:
            report=verify_case(c['id']+'/'+p['id'],p['analysis'],p)
            reports.append(report)
            source_plan=next(v for v in canonical_by_id[c['id']]['tariffPlans'] if v['id']==p['id'])
            assert {k:v for k,v in p.items() if k!='analysis'}==source_plan
            if p['id']=='pse26-600':
                e=D('.121947');first_fixed=later_fixed=D('105063.84')
            elif p['id']=='pse558-managed':
                e=D('.048740');first_fixed=later_fixed=D('80396.28')
            elif p['id'] in ['pec-4cp-150','pec-4cp-600']:
                e=tou;first_fixed=D('50328');later_fixed=D('61326') if p['id'].endswith('150') else D('94320')
            else:
                raise AssertionError('Unexpected plan '+p['id'])
            for period,expected_fixed in [('first',first_fixed),('later',later_fixed)]:
                t=p[period]
                expected_energy=e+(D('.020688') if period=='first' and p['id'].startswith('pec') else ZERO)
                compare(t['energyPerKwh'],expected_energy,p['id']+'.'+period+'.energySource',rates_errors,D('.000000000001'))
                compare((t['billedPeakKw']*t['demandPerKwMonth']+t['utilityFixedMonthly'])*12,
                        expected_fixed,p['id']+'.'+period+'.fixedSource',rates_errors)
    preservation=[] # Baseline preservation is separately audited before release.
    counts={k:sum(c['review']['decision']==k for c in data['candidates']) for k in ['qualified','pending','rejected']}
    assert len(reports)==4 and len(data['candidates'])==37
    all_errors=rates_errors+preservation+[e for r in reports for e in r['errors']]
    out=dict(asOf='2026-10-30',method='Independent Python Decimal, 55 significant digits; annual ledger, lasting payback and affine closed-form thresholds; no production helper imports.',
             candidateSha256=hashlib.sha256((REPO/'data/candidates.json').read_bytes()).hexdigest(),
             reports=reports,sourceRateErrors=rates_errors,formalPreservationErrors=preservation,
             decisionCounts=counts,errors=all_errors,passed=not all_errors)
    print('Independent Decimal local verification: 44 project cases, 440 annual rows and 4 joint boundaries; ' + ('PASS' if not all_errors else str(all_errors)))
    raise SystemExit(1 if all_errors else 0)
