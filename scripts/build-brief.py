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
notes = {
 'net-eureka':('Utility EV rate found; full tariff eligibility and site capacity unconfirmed.','找到电力EV费率；完整适用性及本站容量未确认。'),
 'net-challis':('Local utility inquiry route found; no signed rights or capacity offer.','找到当地供电查询对象；没有已签权利或容量承诺。'),
 'net-john-day':('OTEC G3 tariff and utility relationship found; capacity eligibility still blocks.','找到OTEC G3费率及本地供电关联；容量适用仍待核。'),
 'net-hanksville':('Garkane EV tariff found; effective date, load shape and access need confirmation.','找到Garkane EV费率；生效日、负荷形态及开放待确认。'),
 'net-machias':('Tax parcel/owner record found; prior canceled project still requires explanation.','找到税籍地块和业主记录；前项目取消原因仍须解释。'),
 'net-chama':('NORA proposed increase found; approval/current applicable tariff unconfirmed.','找到NORA拟涨价通知；批准及当前适用费率未确认。'),
 'net-austin':('Existing highway charging host; upgrade rights and utility scope unresolved.','已有公路充电设施；改造权利及电力范围待核。'),
 'net-mountain-view':('Utility/program leads found; no complete grid or EPC quote.','找到供电/项目线索；仍无完整接网或工程报价。'),
 'net-elkins':('Published utility terms add detail; incremental demand remains unmeasured.','公开电力条款补齐细节；增量需求仍未实测。'),
 'net-chinle':('Tribal authority and utility context matter; charger land consent unverified.','须核部落土地授权及供电关系；充电用地同意未证实。'),
 'heb-mansfield':('Owner filing found; reported gas generation is NOT spare charger capacity.','找到业主备案；披露的燃气发电不等于充电可用容量。'),
 'heb-leander':('Fulfillment expansion adds parking/layout constraints; rights and load unverified.','履约扩建增加停车及布局约束；权利和负荷待核。'),
 'heb-ronaldreagan':('AEW transaction and ground leases found; waterway/easement constraints.','找到AEW交易及地租结构；有水道和地役权约束。'),
 'winco-brushprairie':('Clark tariff subtotal tested; resale approval and capacity remain unverified.','已算Clark费率小计；转售许可及容量仍未确认。'),
 'winco-vancouver':('Clark tariff subtotal tested; meter eligibility and connection quote missing.','已算Clark费率小计；缺电表适用和接网报价。'),
 'winco-bremerton':('Permit links store to parcel; parking rights and grid capacity unresolved.','许可关联商店与地块；停车权利和电力容量待核。'),
 'winco-edmonds':('Existing EVgo supply confirmed; Sno standard tariff sensitivity added.','证实既有EVgo供给；新增Sno常规费率敏感性。'),
 'winco-everett':('Sno tariff tested; original parcel source inaccessible, ownership not asserted.','已测Sno费率；地块原始来源不可访问，不断言产权。'),
 'winco-tigard':('Same address links two tax accounts; exact charging parcel must be fixed.','同址关联两个税籍账户；须明确充电拟用地块。'),
 'sprouts-suwanee':('SEC parking/tenant lease found; 2029 expiry needs new enforceable site term.','找到SEC停车及租约；2029到期须另核可执行用地期。'),
}

notes.update({
 'winco-puyallup':('Parcel source inaccessible; load-dependent rate assignment unresolved.','地块来源无法访问；随负荷变化的适用费率待核。'),
 'winco-hillsboro':('Store-alteration filing found; declared cost is not a charger quote.','找到商店改造备案；申报金额不是充电工程报价。'),
 'winco-oregoncity':('Tenant plan found; undated traffic claims are not paid charging demand.','找到租户物业图；无日期车流宣传不是付费充电需求。'),
 'heb-elgin':('Owner filing found; East/West highway address discrepancy unresolved.','找到业主备案；公路地址东西方向冲突未解决。'),
})
def finding(c):
    default = ('Store/property identity checked. Written land, utility, total-cost and demand evidence is still absent.', '商店或物业身份已核；仍缺书面场地、电力、完整成本与需求证据。')
    a, b = notes.get(c['id'], default)
    return p(text(a,b))
out.parent.mkdir(parents=True, exist_ok=True)
c = canvas.Canvas(str(out), pagesize=(W,H), pageCompression=1)
c.setTitle(text('Charge Atlas | Evidence review and conditional payback', 'Charge Atlas | 证据核查与条件回本测算'))
c.setAuthor('Charge Atlas Research')
c.setSubject('Public evidence; independent, not Tesla endorsed. language='+args.lang+'; data-sha256='+hashlib.sha256(data_bytes).hexdigest())
for page, mode in enumerate(['network','investor'],1):
    c.setFillColor(ink); c.setFont(FONT,18)
    c.drawString(margin,H-35,'CHARGE ATLAS / '+text('NETWORK LENS' if mode=='network' else 'INVESTOR LENS', '网络视角' if mode=='network' else '投资视角'))
    c.setFont(FONT,8); c.drawRightString(W-margin,H-33,f"{data['meta']['asOf']} | v{data['meta']['version']} | {page}/2")
    lead = text('0 QUALIFIED. All 37 properties investigated in round two; all remain pending. No quota is filled.', '合格数：0。第二轮调查全部37处，均继续待核；不为凑数放宽门槛。')
    b=p('<b>'+lead+'</b>'); _,bh=b.wrap(width,50); b.drawOn(c,margin,H-55-bh)
    policy=text('Shared gate: base payback ≤6 yr; conservative ≤8 yr; base NPV ≥0 at 10% real; positive conservative free cash; all six evidence gates verified. These are chosen underwriting rules, not Tesla criteria or an industry standard.', '统一硬门槛：基准回本≤6年、保守≤8年；基准净现值按10%实际贴现率≥0；保守现金流为正；六类关键证据全部核实。这是明确的投资筛选政策，并非特斯拉标准或行业事实。')
    b=p(policy,small); _,bh=b.wrap(width,45); b.drawOn(c,margin,H-76-bh)
    headers=text(['Prior order†','Property / complete address','Conservative\nPayback / cash‡','Base\nPayback / cash‡','Optimistic\nPayback / cash‡','Round-two finding / remaining gap'],['历史顺序†','场地 / 完整地址','保守\n回本 / 年现金‡','基准\n回本 / 年现金‡','乐观\n回本 / 年现金‡','本轮核查 / 尚缺证据'])
    rows=[[p(escape(h).replace('\n','<br/>'),head) for h in headers]]
    prior=sorted([x for x in data['candidates'] if x['previousRanks'].get(mode)],key=lambda x:x['previousRanks'][mode])
    for x in prior:
        rows.append([p(str(x['previousRanks'][mode])),p('<b>'+escape(x['name'])+'</b><br/>'+escape(x['address'])),scenario(x,'conservative'),scenario(x,'base'),scenario(x,'optimistic'),finding(x)])
    table=Table(rows,colWidths=[39,219,76,76,76,width-486])
    table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),ink),('VALIGN',(0,0),(-1,-1),'TOP'),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#F3F5F7')]),('LINEBELOW',(0,0),(-1,-1),.3,colors.HexColor('#D5DCE1')),('LEFTPADDING',(0,0),(-1,-1),5),('RIGHTPADDING',(0,0),(-1,-1),5),('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4)]))
    _, th=table.wrap(width,H)
    if th > 365: raise ValueError(f'Table too tall: {th}')
    bottom=H-110-th; table.drawOn(c,margin,bottom)
    foot=text('† Historical research order only; all rows are pending, not qualified recommendations. ‡ Stabilized annual cash after replacement allowance, in USD thousands. * No recovery within construction plus 10 operating years. Payback starts at first spend and includes construction holding costs, ramp and replacement. No site has verified rights, grid capacity, an installed-cost quote or paid demand.', '† 仅保留历史研究顺序；全部待核，并非合格推荐。‡ 稳定期扣除更新预留后的年现金，美元千元。* 在施工期加10个运营年内未回本。回本从首次投资起算，含施工持有费用、爬坡与更新预留。所有场地均缺已核实的权利、电力容量、完整安装报价或付费需求。')
    assumptions=text('Stress inputs: 8 stalls; 22/40/40 kWh/session; 2/4/8 sessions per stall/day; prices $0.40/0.45/0.50; capex $1.269m/1.128m/1.034m. Electricity uses the EIA state commercial mean ×2/1.5/1, not a parcel tariff. Same-state sites share assumptions. All scenario sets fail the combined hurdle; optimistic recovery alone does not qualify a site.', '压力输入：8枪、22/40/40kWh/次、每天每枪2/4/8次；售价$0.40/0.45/0.50；投资$126.9万/112.8万/103.4万。电费采用EIA州商业均价×2/1.5/1，并非本站费率。同州共用假设。全部情景组均未过组合门槛，乐观回本不能单独使场地合格。')
    b=p(foot+'<br/>'+assumptions,small); _,bh=b.wrap(width,100)
    if bottom-bh-8<38: raise ValueError('Footer collision; revise layout')
    b.drawOn(c,margin,bottom-8-bh)
    c.setFont(FONT,7); c.setFillColor(blue)
    c.drawString(margin,25,text('Full evidence, assumptions and 37-site pool: ', '完整证据、假设与37址候选池：')+'https://cptm511.github.io/supercharger-atlas/')
    c.linkURL('https://cptm511.github.io/supercharger-atlas/',(margin,22,W-margin,34),relative=0)
    c.showPage()
c.save(); print(out.name)
