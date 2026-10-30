#!/usr/bin/env python3
"""Build the two-page public evidence brief in English or Chinese."""
import argparse, hashlib, json
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.platypus import Paragraph, Table, TableStyle

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--lang', choices=['en', 'zh'], default='en')
parser.add_argument('--font', type=Path)
parser.add_argument('--output', type=Path)
args = parser.parse_args()
zh = args.lang == 'zh'
out = args.output or ROOT / ('downloads/charge-atlas-brief-zh.pdf' if zh else 'downloads/charge-atlas-brief.pdf')
font = args.font or Path('/System/Library/Fonts/Supplemental/Arial Unicode.ttf')
if font.exists():
    pdfmetrics.registerFont(TTFont('Brief', str(font))); FONT = 'Brief'
else:
    pdfmetrics.registerFont(UnicodeCIDFont('STSong-Light')); FONT = 'STSong-Light'
data_bytes = (ROOT/'data/candidates.json').read_bytes()
data = json.loads(data_bytes)
W, H = landscape(A4); margin = 28; width = W-2*margin
ink, blue = colors.HexColor('#203544'), colors.HexColor('#3555C5')
style = ParagraphStyle('body', fontName=FONT, fontSize=7.2, leading=9.3, textColor=ink, wordWrap='CJK' if zh else None)
small = ParagraphStyle('small', parent=style, fontSize=7, leading=9.3)
head = ParagraphStyle('head', parent=style, fontSize=7, leading=9.3, textColor=colors.white)
def p(text, st=style): return Paragraph(text, st)
def text(en, cn): return cn if zh else en
def cash(n): return ('−' if n < 0 else '')+'$'+f'{abs(n)/1000:.1f}k'
def scenario(c, key):
    o = c['hypothesis']['analysis']['scenarios'][key]['outputs']
    pay = f"{o['projectPaybackYears']:.2f}"+text(' yr', ' 年') if o['projectPaybackYears'] is not None else text('No recovery*', '期内未回本*')
    return p(pay+'<br/>NPV '+cash(o['npv']))
selected=[next(c for c in data['candidates'] if c['id']==h['candidateId']) for h in data['hypothesisReview']['records']]
out.parent.mkdir(parents=True, exist_ok=True)
c=canvas.Canvas(str(out),pagesize=(W,H),pageCompression=1)
c.setTitle(text('Charge Atlas | Field hypotheses','Charge Atlas | 实地验证假设'))
c.setAuthor('Charge Atlas Research')
c.setSubject('Public evidence; language='+args.lang+'; data-sha256='+hashlib.sha256(data_bytes).hexdigest())
for page in [1,2]:
    c.setFillColor(ink);c.setFont(FONT,18)
    c.drawString(margin,H-35,'CHARGE ATLAS / '+text('FIELD HYPOTHESES' if page==1 else 'WORKING CASES','实地验证假设' if page==1 else '工作情景'))
    c.setFont(FONT,8);c.drawRightString(W-margin,H-33,f"{data['meta']['asOf']} | v{data['meta']['version']} | {page}/2")
    lead=text('5 field hypotheses; 0 investment-ready sites. Vendor estimates and author-selected stresses are not local forecasts.','5个实地验证假设，0处已具投资资格。厂家估算与作者选定的压力测试不是本地预测。')
    b=p('<b>'+lead+'</b>');_,bh=b.wrap(width,40);b.drawOn(c,margin,H-56-bh)
    policy=text('Base payback ≤6 years; conservative ≤8 years from first spend; base NPV ≥0 at 10% real over 10 operating years; positive conservative steady cash and all six evidence gates. Chosen policy, not Tesla or industry criteria.','基准回本≤6年，保守≤8年（从首次支出起）；10个运营年、10%实际折现率下基准NPV≥0；保守稳定现金为正，且六类证据齐全。这是选定政策，并非Tesla或行业标准。')
    b=p(policy,small);_,bh=b.wrap(width,40);b.drawOn(c,margin,H-77-bh)
    if page==1:
        headers=text(['Property / exact address','Investigation rationale','Counter-evidence / required field test'],['场地 / 具体地址','调查理由','反证 / 必须实地核验'])
        rows=[[p(escape(h),head) for h in headers]]
        for x in selected:
            h=x['hypothesis'];loc=lambda key:h[key]['zh' if zh else 'en']
            rows.append([p('<b>'+escape(x['name'])+'</b><br/>'+escape(x['address'])+'<br/>'+text('Investigation tier ','调查优先级 ')+h['tier']),p(escape(loc('rationale'))),p(escape(loc('counter'))+'<br/><br/>'+escape(loc('test')))])
        widths=[210,220,width-430]
        foot=text('Qualitative diligence priorities, not predicted-return ranks. Puyallup and Ronald Reagan first; Elgin requires an access screen; Edmonds and Medford require a redesign/recovery scope. The wider 37-site pool remains pending, not rejected. No site rights, complete quotes, firm utility capacity/date or calibrated paid-demand forecast has been obtained.','这是定性尽调优先级，不是预测收益排名。优先Puyallup与Ronald Reagan；Elgin先核通行；Edmonds与Medford须明确重设计或恢复范围。全部37处仍待核，并非淘汰。未取得场地权利、完整报价、确定接电容量/日期及校准的付费需求预测。')
    else:
        headers=text(['Property / vendor kWh/post/day','Conservative payback / NPV','Base payback / NPV','Optimistic payback / NPV','Base required kWh/post/day','Base maximum full capex'],['场地 / 厂家kWh/枪/日','保守回本 / NPV','基准回本 / NPV','乐观回本 / NPV','基准所需kWh/枪/日','基准完整投资上限'])
        rows=[[p(escape(h),head) for h in headers]]
        for x in selected:
            h=x['hypothesis'];a=h['analysis']['inverse']['base']
            rows.append([p(escape(x['name'])+'<br/>'+str(h['estimate']['kwhPerPostDay'])+' kWh'),scenario(x,'conservative'),scenario(x,'base'),scenario(x,'optimistic'),p(f"{a['requiredKwhPerStallDay']:,.1f}"),p(cash(a['maxCapex']))])
        widths=[180,99,99,99,104,width-581]
        foot=text('Four posts; demand 0.7/1/1.2 times vendor reference; gross capex $634.5k/$564k/$517k; monthly uncovered cost $2k/$1k/$0.5k. Flat demand, no grant, no residual. Construction 1.5/1/0.75 years; first-year ramp 50/75/100%; replacement 2/1.5/1%. Input details and boundary caveats are in the product. NPV in USD thousands. * No recovery within construction plus 10 operating years. Each inverse column changes only ONE input; never combine thresholds. Neither is a quote or a full-gate pass.','四枪；需求为厂家参照的0.7/1/1.2倍；总投资63.45/56.4/51.7万美元；每月未覆盖费用2,000/1,000/500美元。需求不增长，不计补助及残值。建设期1.5/1/0.75年，首年爬坡50/75/100%，更新预留2/1.5/1%。完整输入及口径限制见产品。NPV单位为千美元。*建设加10个运营年内未回本。每个反算列仅改变一个输入，不可拼接；不代表报价或完整门槛通过。')
        foot+=' '+text('Vendor utility prices include demand; assumed 15% loss borrows a different grid-to-battery boundary. Hardware taxes and full utility/civil/land scope remain unquoted.','厂家电价包含需量费；15%损耗借自不同的电网至电池口径。硬件税和完整接电、土建、土地范围仍未获报价。')
    table=Table(rows,colWidths=widths)
    table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),ink),('VALIGN',(0,0),(-1,-1),'TOP'),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#F3F5F7')]),('LINEBELOW',(0,0),(-1,-1),.3,colors.HexColor('#D5DCE1')),('LEFTPADDING',(0,0),(-1,-1),5),('RIGHTPADDING',(0,0),(-1,-1),5),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5)]))
    _,th=table.wrap(width,H)
    bottom=H-113-th
    table.drawOn(c,margin,bottom)
    b=p(foot,small);_,bh=b.wrap(width,90)
    if bottom-bh-10<40:raise ValueError('PDF table/footer collision')
    b.drawOn(c,margin,bottom-bh-10)
    c.setFont(FONT,7);c.setFillColor(blue)
    link='https://cptm511.github.io/supercharger-atlas/'
    c.drawString(margin,25,text('Full sources, all 37 records, assumptions and acquisition paths: ','完整来源、37处记录、假设与获取路径：')+link)
    c.linkURL(link,(margin,22,W-margin,34),relative=0)
    c.showPage()
c.save();print(out.name)
