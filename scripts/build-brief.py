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
 'net-eureka':('Specific grocery verified; land, utility scope and paid demand unresolved.','实体商店已核；土地、电力范围与付费需求待核。'),
 'net-challis':('Operating grocery; no verified site rights or DCFC connection quote.','营业商店；尚无场地授权与快充接网报价。'),
 'net-john-day':('Store verified; nearby charging and incremental demand need validation.','商店已核；附近供给与增量需求仍待验证。'),
 'net-hanksville':('Owner confirms RV outlets only, restricted hours; dedicated DCFC is unproven.','业主称仅有营地插座、限时开放；专用快充未证实。'),
 'net-machias':('Official prior-project cancellation; cause and site implications remain unknown.','官方确认此前项目取消；原因及对本址影响未知。'),
 'net-chama':('Store identity checked; mountain-route demand and grid capacity unresolved.','商店身份已核；山地路线需求和电力容量待核。'),
 'net-austin':('Existing charging host: assess upgrade/co-location, not empty greenfield.','已有充电设施：按改造或共址核查，不当作空白新建。'),
 'net-mountain-view':('Store identity checked; parking rights and measured demand unresolved.','商店身份已核；停车位权利与实测需求待核。'),
 'net-elkins':('Store identity checked; incremental service and grid capacity unresolved.','商店身份已核；增量服务价值和电力容量待核。'),
 'net-chinle':('Retail node checked; land authority, consent and demand unresolved.','零售节点已核；土地权限、同意与需求待核。'),
 'heb-mansfield':('City EVCS permit at 1715 E Broad, distinct from this 1670 address; supply unresolved.','市府1715 E Broad充电许可与本址1670号不同；新增供给待核。'),
 'heb-leander':('Specific store verified; demand may overlap Ronald Reagan candidate.','具体商店已核；需求可能与Ronald Reagan候选重叠。'),
 'heb-ronaldreagan':('Specific store verified; alternative to Leander, not additive demand.','具体商店已核；与Leander可能互为替代，需求不可叠加。'),
}
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
    lead = text('0 QUALIFIED. All 20 previous shortlist sites remain pending; 3 replacement prospects also remain pending. No quota is filled.', '合格数：0。原两份名单20个场地均待核，3个替补也未合格；不为凑数放宽门槛。')
    b=p('<b>'+lead+'</b>'); _,bh=b.wrap(width,50); b.drawOn(c,margin,H-55-bh)
    policy=text('Shared gate: base payback ≤6 yr; conservative ≤8 yr; base NPV ≥0 at 10% real; positive conservative free cash; all six evidence gates verified. These are chosen underwriting rules, not Tesla criteria or an industry standard.', '统一硬门槛：基准回本≤6年、保守≤8年；基准净现值按10%实际贴现率≥0；保守现金流为正；六类关键证据全部核实。这是明确的投资筛选政策，并非特斯拉标准或行业事实。')
    b=p(policy,small); _,bh=b.wrap(width,45); b.drawOn(c,margin,H-76-bh)
    headers=text(['Prior order†','Property / complete address','Conservative\nPayback / cash‡','Base\nPayback / cash‡','Optimistic\nPayback / cash‡','Round-one finding / pending evidence'],['历史顺序†','场地 / 完整地址','保守\n回本 / 年现金‡','基准\n回本 / 年现金‡','乐观\n回本 / 年现金‡','本轮核查 / 尚缺证据'])
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
    assumptions=text('Stress inputs: 8 stalls; 40 kWh/session; 2/4/8 sessions per stall/day; prices $0.40/0.45/0.50; capex $1.269m/1.128m/1.034m. Electricity uses the EIA state commercial mean ×2/1.5/1, not a parcel tariff. Same-state sites share assumptions. All scenario sets fail the combined hurdle; optimistic recovery alone does not qualify a site.', '压力输入：8枪、40kWh/次、每天每枪2/4/8次；售价$0.40/0.45/0.50；投资$126.9万/112.8万/103.4万。电费采用EIA州商业均价×2/1.5/1，并非本站费率。同州共用假设。全部情景组均未过组合门槛，乐观回本不能单独使场地合格。')
    b=p(foot+'<br/>'+assumptions,small); _,bh=b.wrap(width,100)
    if bottom-bh-8<38: raise ValueError('Footer collision; revise layout')
    b.drawOn(c,margin,bottom-8-bh)
    c.setFont(FONT,7); c.setFillColor(blue)
    c.drawString(margin,25,text('Full evidence, assumptions and 37-site pool: ', '完整证据、假设与37址候选池：')+'https://cptm511.github.io/supercharger-atlas/')
    c.linkURL('https://cptm511.github.io/supercharger-atlas/',(margin,22,W-margin,34),relative=0)
    c.showPage()
c.save(); print(out.name)
