#!/usr/bin/env python3
"""Independent Decimal audit. Does not import JS helpers or use JS output as inputs."""
import argparse, json
from decimal import Decimal as D, getcontext
from pathlib import Path
getcontext().prec=55
args=argparse.ArgumentParser(description=__doc__)
args.add_argument('--repo', type=Path, default=Path(__file__).resolve().parents[1])
R=args.parse_args().repo
review=json.loads((R/'data/ronald-validation.json').read_text(),parse_float=D)
d=json.loads((R/'data/candidates.json').read_text(),parse_float=D)
c=next(c for c in d['candidates'] if c['id']=='heb-ronaldreagan')
a=c['ronaldValidation']['analysis']
expected_settings={'sessionsPerDay':59,'kwhPerSession':35,'lossFraction':D('.15'),'storeHours':17,'capKw':150,'tou17h':D('.06431968267526189')}
for k,v in expected_settings.items():
 assert review['settings'][k]==v,('Review settings changed; update independently checked assumptions',k)
assert len(a['scenarios'])==3 and len(a['cpCases'])==4 and len(a['energyCases'])==2 and len(a['costCases'])==3 and len(a['priceCases'])==3 and len(a['portCases'])==2
values=0; max_error=D(0)
def check(actual,expected,where):
 global values,max_error
 if expected is None:
  assert actual is None,(where,actual,expected)
 elif isinstance(expected,(D,int,float)) and not isinstance(expected,bool):
  err=abs(D(str(actual))-D(str(expected)));max_error=max(max_error,err);values+=1
  assert err<D('.000001'),(where,actual,expected,err)
 else: assert actual==expected,(where,actual,expected)
O=D('.043481');M=D('.093169');PK=D('.161843');WM=D('.086442')
TOU24=(122*(17*O+3*M+4*PK)+153*(20*O+4*WM)+90*(16*O+8*WM))/(D(365)*24)
TOU17=(122*(10*O+3*M+4*PK)+153*(13*O+4*WM)+90*(10*O+7*WM))/(D(365)*17)
FEE=D('.020688'); MONTH_PEAK=D(600);PEAK_RATE=D('6.74');CP_RATE=D('6.11');BASIC=D(150)
cases=[]
for kind in ['conservative','base','optimistic']:cases.append((kind,a['scenarios'][kind],kind,{}))
for i,x in enumerate(a['cpCases']):
 m=[0,1,2,4][i];cp=D(150)+D('112.5')*m
 check(x['cp'],cp,f'cp{i}');check(x['annualTcos'],cp*CP_RATE*12,f'cp{i}TCOS');check(x['addedAnnualTcos'],(cp-150)*CP_RATE*12,f'cp{i}added')
 cases.append((f'cp{i}',x,'base',{'cp':cp}))
for i,x in enumerate(a['energyCases']):cases.append((f'energy{i}',x,'base',{'sessionEnergy':D([22,35][i])}))
for i,x in enumerate(a['costCases']):cases.append((f'cost{i}',x,'base',{'extraCapex':D([0,100000,200000][i])}))
for i,x in enumerate(a['priceCases']):cases.append((f'price{i}',x,'base',{'retailPerKwh':[D('.40'),D('.45'),D('.51')][i]}))
for i,x in enumerate(a['portCases']):cases.append((f'port{i}',x,'base',{'sessionEnergy':D([22,35][i]),'stationSessions':D(59)*4/5}))
cases.append(('operatingHours',a['operatingHoursCase'],'base',{'energy':TOU17}))
summary=[]
for name,actual,kind,opts in cases:
 x=c['hypothesis']['analysis']['scenarios'][kind]['inputs'].copy()
 factor={'conservative':D('.7'),'base':D(1),'optimistic':D('1.2')}[kind]
 x.update(kwhPerSession=opts.get('sessionEnergy',D(35)),sessionsPerStallDay=opts.get('stationSessions',D(59))*factor/4,lossFraction=D('.15'))
 x['capex']+=opts.get('extraCapex',D(0))
 if 'retailPerKwh' in opts:x['retailPerKwh']=opts['retailPerKwh']
 for k,v in x.items():check(actual['inputs'][k],v,f'{name}.inputs.{k}')
 cp=opts.get('cp',D(150));energy=opts.get('energy',TOU24);stress=D('1.25') if kind=='conservative' else D(1)
 check(actual['utilityStress'],stress,name+'.stress');check(actual['plan']['firstYears'],1,name+'.firstYears')
 check(actual['plan']['first']['energyPerKwh'],energy+FEE,name+'.first.energy')
 check(actual['plan']['first']['demandPerKwMonth'],PEAK_RATE,name+'.first.demand')
 check(actual['plan']['later']['energyPerKwh'],energy,name+'.later.energy')
 check(actual['plan']['later']['demandPerKwMonth'],PEAK_RATE+cp*CP_RATE/MONTH_PEAK,name+'.later.demand')
 for period in ['first','later']:
  check(actual['plan'][period]['billedPeakKw'],MONTH_PEAK,name+'.'+period+'.peak')
  check(actual['plan'][period]['utilityFixedMonthly'],BASIC,name+'.'+period+'.fixed')
 holding=x['preOpeningMonthly']*12*x['constructionYears'];balance=-x['capex']-holding
 npv=-x['capex']-holding/(1+x['discountRate'])**(D(x['constructionYears'])/2);payback=None
 for y in range(1,11):
  ramp=x['firstYearRamp'] if y==1 else D(1)
  billed=4*x['sessionsPerStallDay']*365*x['kwhPerSession']*ramp;grid=billed/(1-x['lossFraction'])
  energy_rate=(energy+(FEE if y==1 else 0))*stress
  ecost=grid*energy_rate
  # Separate true monthly peak and 4CP invoice components, not normalized helper.
  dcost=MONTH_PEAK*PEAK_RATE*12*stress+(D(0) if y==1 else cp*CP_RATE*12*stress)
  ufix=BASIC*12*stress;rev=billed*x['retailPerKwh'];service=billed*x['servicePerKwh'];fixed=x['fixedMonthly']*12;reserve=x['capex']*x['sustainingCapexFraction']
  utility=ecost+dcost+ufix;cash=rev-service-fixed-utility-reserve;before=balance;balance+=cash;t=x['constructionYears']+y
  if balance<0:payback=None
  if payback is None and before<0 and balance>=0 and cash>0:payback=t-1-before/cash
  npv+=cash/(1+x['discountRate'])**t
  row=dict(year=y,time=t,ramp=ramp,annualKwh=billed,gridKwh=grid,revenue=rev,energyCost=ecost,demandCost=dcost,utilityFixedCost=ufix,electricityCost=utility,serviceCost=service,fixedCost=fixed,replacementAllowance=reserve,operatingFreeCash=cash,capitalReceipt=0,cash=cash,cumulative=balance)
  for k,v in row.items():check(actual['outputs']['cashflows'][y-1][k],v,f'{name}.year{y}.{k}')
 totals=dict(npv=npv,projectPaybackYears=payback,stabilizedFreeCash=cash,annualUtilitySubtotal=utility,preOpeningHoldingCost=holding,finalCumulativeCash=balance)
 for k,v in totals.items():check(actual['outputs'][k],v,name+'.outputs.'+k)
 summary.append({'case':name,'payback':float(payback) if payback is not None else None,'npv':float(npv),'steadyFreeCash':float(cash)})
billed=D(59)*35;grid=billed/D('.85');cap=D(150);hours=D(17)
e=dict(deliveredDay=billed,gridDay=grid,deliveredYear=billed*365,gridYear=grid*365,perPostDay=billed/4,sessionsPerPostDay=D(59)/4,equivalentFullPowerHours=grid/cap,averageKw24h=grid/24,averageKwStoreHours=grid/hours,storeWindowCapacityFraction=grid/(cap*hours),maxSessionsStoreHours=cap*hours*D('.85')/35,fourConcurrentDeliveredKwEach=cap*D('.85')/4,fourConcurrentMinutes=D(35)/(cap*D('.85')/4)*60)
for k,v in e.items():check(a['energy'][k],v,'energy.'+k)
base=summary[1];con=summary[0]
expected={'basePayback':base['payback'] is not None and base['payback']<=6,'conservativePayback':con['payback'] is not None and con['payback']<=8,'baseNpv':base['npv']>=0,'conservativeCash':con['steadyFreeCash']>0}
check(a['hurdle']['tests'],expected,'hurdle.tests');check(a['hurdle']['passed'],all(expected.values()),'hurdle.passed');check(a['evidenceAdmitted'],False,'evidenceAdmitted')
result={'cases':len(cases),'annualRows':len(cases)*10,'numericComparisons':values,'maxAbsoluteError':str(max_error),'pass':True,'hurdle':expected,'energy':{k:float(v) for k,v in e.items()},'results':summary,'scope':'Independent Decimal equations against retained hypothesis inputs and published tariff components; forecasts and rights remain unverified.'}
print(json.dumps({k:result[k] for k in ['cases','annualRows','numericComparisons','maxAbsoluteError','pass','hurdle']},indent=2))
