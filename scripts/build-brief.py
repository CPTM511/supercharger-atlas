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
    o = c['economics']['scenarios'][key]['outputs']
    pay = f"{o['projectPaybackYears']:.2f}"+text(' yr', ' 年') if o['projectPaybackYears'] is not None else text('No recovery*', '期内未回本*')
    return p(pay+'<br/>'+cash(o['stabilizedFreeCash']))
notes = {x['id']: (x['headline']['en'], x['headline']['zh']) for x in data['acquisitionReview']['sites']}

round3=json.loads((ROOT/'data/feasibility-round-3.json').read_text())
selected=[next(c for c in data['candidates'] if c['id']==cid) for cid in round3['selection']['selectedIds']]
out.parent.mkdir(parents=True, exist_ok=True)
c=canvas.Canvas(str(out),pagesize=(W,H),pageCompression=1)
c.setTitle(text('Charge Atlas | Focused feasibility review','Charge Atlas | 重点可行性核查'))
c.setAuthor('Charge Atlas Research')
c.setSubject('Public evidence; language='+args.lang+'; data-sha256='+hashlib.sha256(data_bytes).hexdigest())
for page in [1,2]:
    c.setFillColor(ink);c.setFont(FONT,18)
    c.drawString(margin,H-35,'CHARGE ATLAS / '+text('EVIDENCE' if page==1 else 'CONDITIONS','证据核查' if page==1 else '回本条件'))
    c.setFont(FONT,8);c.drawRightString(W-margin,H-33,f"{data['meta']['asOf']} | v{data['meta']['version']} | {page}/2")
    lead=text('37-site pool; 10 evidence follow-ups, 27 carried forward. 0 investment-ready does not mean no viable U.S. sites.','37处候选；本轮追查10处、沿用27处。0处达到投资条件，不代表美国无可行场地；门槛不变。')
    b=p('<b>'+lead+'</b>');_,bh=b.wrap(width,40);b.drawOn(c,margin,H-56-bh)
    policy=text('Base payback ≤6 years; conservative ≤8 years from first spend; base NPV ≥0 at 10% real over 10 operating years; positive conservative steady cash and all six evidence gates. Chosen policy, not Tesla or industry criteria.','基准回本≤6年，保守≤8年（从首次支出起）；10个运营年、10%实际折现率下基准NPV≥0；保守稳定现金为正，且六类证据齐全。这是选定政策，并非Tesla或行业标准。')
    b=p(policy,small);_,bh=b.wrap(width,40);b.drawOn(c,margin,H-77-bh)
    if page==1:
        headers=text(['Research property / address','Demand','Full cost','Connection','Finding / feasibility effect'],['研究场地 / 地址','订单','完整成本','接电','发现 / 可行性影响'])
        rows=[[p(escape(h),head) for h in headers]]
        for x in selected:
            f=x['feasibility'];status=lambda k:text('Partial' if f['availability'][k]['status']=='partial' else 'Not obtained','部分' if f['availability'][k]['status']=='partial' else '未取得')
            rows.append([p('<b>'+escape(x['name'])+'</b><br/>'+escape(x['address'])),p(status('demand')),p(status('cost')),p(status('grid')),p(escape(text(*notes[x['id']]))+'<br/>'+text('Status: pending.','资格：待核。'))])
        widths=[260,58,58,64,width-440]
        foot=text('These 10 are information-acquisition priorities, not qualified investment recommendations. Partial can mean a historical record, tariff or application route; it does not close a gate. No full local paid-demand series, complete new-project cost or firm expansion-capacity commitment was obtained. No outreach, applications or paid studies were performed.','这10处是资料获取优先级，不是合格投资推荐。部分证据可能仅指历史记录、费率或申请路径，不代表通过门槛。未取得完整本地付费订单序列、完整新增项目成本或确定扩容承诺。本轮未对外联系、申请或付费研究。')
    else:
        headers=text(['Property','Conservative payback / cash','Base payback / cash','Optimistic payback / cash','Base required sessions / site / day','Base max capex at original volume'],['场地','保守回本 / 年现金','基准回本 / 年现金','乐观回本 / 年现金','基准所需订单 / 站 / 日','原销量下基准最高投资'])
        rows=[[p(escape(h),head) for h in headers]]
        for x in selected:
            a=x['economics']['inverse']['base'];n=a['requiredSessionsPerSiteDay'];m=a['maxCapex']
            rows.append([p(escape(x['name'])),scenario(x,'conservative'),scenario(x,'base'),scenario(x,'optimistic'),p(f'{n:,.1f}' if n is not None else text('No finite result','无有限解')),p(cash(m) if m is not None else text('No solution alone','仅调此项无解'))])
        widths=[180,99,99,99,104,width-581]
        foot=text('Shared stress cases, not local forecasts. Cash is stabilized annual free cash after replacement allowance; USD thousands. * No recovery within construction plus 10 operating years. Main inputs/results remain unchanged from v0.3.2. Inverse columns change ONE variable while holding others fixed: do not combine their limits. Required volume is algebraically unconstrained and may be physically impossible; no grid capacity is implied.','共用压力情景，不是本地预测。年现金为扣更新预留后的稳定现金（千美元）。*建设加10个运营年内未回本。主模型输入与结果相较v0.3.2不变。反推列每次仅改变一个变量，其余固定，不可拼接边界。所需订单是未经物理约束的代数值，可能实际无法承载，不代表已取得容量。')
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
