"""Independent Decimal verification; imports no production JS and uses deadline equations for inverses."""
from decimal import Decimal as D,getcontext
from pathlib import Path
import json,subprocess,hashlib
getcontext().prec=50
ROOT=Path(__file__).resolve().parents[1]
OUT=Path(__file__).resolve().parent
BASE='b193b388f0f4d2f707f424fdfda3d41c8fbf59bc'
d=lambda x:D(str(x))
errors=[];diffs=[];checks=0

def close(label,actual,expected):
 global checks
 checks+=1
 if actual is None or expected is None:
  if actual is not None or expected is not None: errors.append({'label':label,'actual':actual,'expected':str(expected)})
  return
 delta=abs(d(actual)-expected);diffs.append((float(delta),label))
 if delta>D('0.000001')*max(D(1),abs(expected)/D(1000000)):
  errors.append({'label':label,'actual':actual,'expected':str(expected),'difference':str(delta)})

def calc(raw):
 x={k:d(v) for k,v in raw.items() if isinstance(v,(float,int))};C=x['capex'];t=x['constructionYears'];r=x['discountRate'];ramp=x['firstYearRamp'];rep=C*x['sustainingCapexFraction'];fix=12*x['fixedMonthly'];hold=12*x['preOpeningMonthly']*t
 assert raw['tariffMode']=='fully_burdened'
 assert all(x[k]==0 for k in ['demandPerKwMonth','utilityFixedMonthly','utilityFixedDaily','minimumBillDaily'])
 Q=x['stalls']*365*x['sessionsPerStallDay']*x['kwhPerSession'];G=Q/(1-x['lossFraction']);rev=Q*x['retailPerKwh'];energy=G*x['energyPerKwh'];svc=Q*x['servicePerKwh'];con=rev-energy-svc;op=con-fix;cash=op-rep
 balance=-C-hold;npv=-C-hold/(1+r)**(t/2);pb=None;rows=[]
 for y in range(1,int(x['operatingYears'])+1):
  factor=ramp if y==1 else D(1);cf=con*factor-fix-rep;prior=balance;balance+=cf
  npv+=cf/(1+r)**(t+y)
  if pb is None and prior<0<=balance:pb=t+y-1-prior/cf
  rows.append({'year':d(y),'time':t+y,'ramp':factor,'operatingCash':con*factor-fix,'replacementAllowance':rep,'cash':cf,'cumulative':balance})
 return {'annualKwh':Q,'gridKwh':G,'revenue':rev,'energyCost':energy,'serviceCost':svc,'demandCost':D(0),'utilityFixedCost':D(0),'minimumBillAdjustment':D(0),'electricityCost':energy,'fixedCost':fix,'operatingCash':op,'marginPerKwh':x['retailPerKwh']-x['servicePerKwh']-x['energyPerKwh']/(1-x['lossFraction']),'breakEvenSessionsPerStallDay':fix/con*x['sessionsPerStallDay'],'simplePaybackYears':C/op if op>0 else None,'preOpeningHoldingCost':hold,'annualSustainingCapex':rep,'stabilizedFreeCash':cash,'projectPaybackYears':pb,'npv':npv,'cashflows':rows,'horizonYears':t+x['operatingYears'],'discountRate':r}

def inverse(raw,kind):
 x={k:d(v) for k,v in raw.items() if isinstance(v,(float,int))};C=x['capex'];t=x['constructionYears'];r=x['discountRate'];ramp=x['firstYearRamp'];s=x['sustainingCapexFraction'];fix=12*x['fixedMonthly'];hold=12*x['preOpeningMonthly']*t;years=int(x['operatingYears']);deadline=D(6 if kind=='base' else 8);n=deadline-t
 assert n>1 and n<=years
 q=x['sessionsPerStallDay']*x['kwhPerSession'];coef=x['stalls']*365*(x['retailPerKwh']-x['servicePerKwh']-x['energyPerKwh']/(1-x['lossFraction']))
 pvsum=sum((1+r)**(-t-y) for y in range(1,years+1));pvramp=pvsum-(1-ramp)*(1+r)**(-t-1)
 reqpb=(C+hold+(fix+C*s)*n)/(coef*(n-1+ramp));reqcash=(fix+C*s)/coef
 required=max(reqpb,reqcash)
 cap_pb=(coef*q*(n-1+ramp)-hold-fix*n)/(1+s*n)
 cap_cash=(coef*q-fix)/s
 caps=[cap_pb,cap_cash]
 if kind=='base':
  required=max(required,(C+hold/(1+r)**(t/2)+(fix+C*s)*pvsum)/(coef*pvramp))
  caps.append((coef*q*pvramp-fix*pvsum-hold/(1+r)**(t/2))/(1+s*pvsum))
 cap=min(caps)
 return {'requiredKwhPerStallDay':required,'requiredSessionsPerStallDay':required/x['kwhPerSession'],'requiredSessionsPerSiteDay':required/x['kwhPerSession']*x['stalls'],'minimumAverageGridKw':required*x['stalls']/24/(1-x['lossFraction']),'maxCapex':cap if cap>=0 else None,'paybackLimitYears':deadline}

raw=(ROOT/'data/candidates.json').read_bytes();data=json.loads(raw)
bc={c['id']:c for c in data['candidates']}
sourceids={s['id'] for s in data['sources']}; selected=[]
for c in data['candidates']:
 h=c.get('hypothesis')
 if not h:continue
 selected.append(c['id']);analysis=h['analysis'];scenarios=analysis['scenarios'];outs={}
 for kind,case in scenarios.items():
  out=calc(case['inputs']);outs[kind]=out
  for k,v in out.items():
   if k=='cashflows':
    for i,row in enumerate(v):
     for key,val in row.items():close(c['id']+'.'+kind+'.cashflows.'+str(i)+'.'+key,case['outputs'][k][i][key],val)
   else:close(c['id']+'.'+kind+'.'+k,case['outputs'][k],v)
 for kind in ['base','conservative']:
  iv=inverse(scenarios[kind]['inputs'],kind)
  for k,v in iv.items():close(c['id']+'.'+kind+'.inverse.'+k,analysis['inverse'][kind][k],v)
 expected={'basePayback':outs['base']['projectPaybackYears'] is not None and outs['base']['projectPaybackYears']<=6,'conservativePayback':outs['conservative']['projectPaybackYears'] is not None and outs['conservative']['projectPaybackYears']<=8,'baseNpv':outs['base']['npv']>=0,'conservativeCash':outs['conservative']['stabilizedFreeCash']>0}
 if analysis['numericHurdle']!={'passed':all(expected.values()),'tests':expected}:errors.append({'label':c['id']+'.hurdle','error':'mismatch'})
 if analysis['qualification']!='pending' or analysis['evidenceAdmitted'] is not False or h['forecastVerified'] is not False: errors.append({'label':c['id']+'.evidence','error':'unverified admission'})
 for sid in h['sourceIds']+[h['estimate']['sourceId']]:
  if sid not in sourceids:errors.append({'label':c['id']+'.source','missing':sid})
canonical=json.loads((ROOT/'data/hypotheses.json').read_text())
for record in canonical['records']:
 integrated=next(c['hypothesis'] for c in data['candidates'] if c['id']==record['candidateId'])
 for k,v in record.items():
  if integrated.get(k)!=v:errors.append({'label':record['candidateId']+'.canonical.'+k,'error':'mismatch'})
for row in canonical['coverage']:
 if row['candidateId'] not in bc:errors.append({'label':'coverage','error':'unknown candidate'})
result={'verdict':'PASS'if not errors else'FAIL','asOf':'2026-10-30','baseline':BASE,'dataSha256':hashlib.sha256(raw).hexdigest(),'selected':selected,'scenariosChecked':len(selected)*3,'inverseEnvelopesChecked':len(selected)*2,'numericChecks':checks,'maxAbsoluteDifference':max(diffs)[0]if diffs else None,'maxDifferenceLocation':max(diffs)[1]if diffs else None,'errors':errors,'method':'Decimal50 arithmetic from selected inputs; separate closed-form deadline/NPV equations for required energy and maximum capex; no production helper import.'}
print(f"Independent Decimal verification: {result['scenariosChecked']} scenarios and {result['inverseEnvelopesChecked']} inverse envelopes; {result['verdict']}");assert not errors, errors
