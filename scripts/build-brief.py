#!/usr/bin/env python3
"""Rebuild the two-page EN/ZH brief from current Ronald Reagan validation data."""
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
data_bytes = (ROOT / 'data/candidates.json').read_bytes()
data = json.loads(data_bytes)
review = data['ronaldValidationReview']
data_hash = hashlib.sha256(data_bytes).hexdigest()
site = next(item for item in data['candidates'] if item['id'] == review['candidateId'])
analysis = site['ronaldValidation']['analysis']
sources = {item['id']: item for item in data['sources']}
if analysis['evidenceAdmitted'] or analysis['hurdle']['passed']:
    raise ValueError('Brief conclusions require review after any admission change')

W, H = landscape(A4); margin = 28; width = W - 2 * margin
ink, blue = colors.HexColor('#203544'), colors.HexColor('#3555C5')
body = ParagraphStyle('body', fontName=FONT, fontSize=8, leading=10.3,
                      textColor=ink, wordWrap='CJK' if zh else None)
small = ParagraphStyle('small', parent=body, fontSize=7.4, leading=9.5)
head = ParagraphStyle('head', parent=body, fontSize=7.5, leading=9.6, textColor=colors.white)
label = ParagraphStyle('label', parent=body, fontSize=9, leading=11.5, textColor=blue)
def tr(en, cn): return cn if zh else en
def loc(value): return value[args.lang]
def plain(value): return escape(str(value).replace('\u2011', '-').replace('\u2013', '-').replace('\u2014', ' - '))
def p(value, style=body): return Paragraph(value, style)
def cash(value): return ('-' if value < 0 else '') + '$' + f'{abs(value) / 1000:,.1f}k'
def result(output):
    payback = output['projectPaybackYears']
    pay = f'{payback:.2f}' + tr(' yr', ' 年') if payback is not None else tr('No recovery*', '期内未回本*')
    return p(pay + '<br/>NPV ' + cash(output['npv']))
def source_links(source_ids):
    links = ['<link href="' + escape(sources[source_id]['url'], {'"': '&quot;'}) + '" color="#3555C5">'
             + str(index) + '</link>' for index, source_id in enumerate(source_ids, 1)]
    return tr('Sources ', '来源 ') + ' / '.join(links)

out.parent.mkdir(parents=True, exist_ok=True)
c = canvas.Canvas(str(out), pagesize=(W, H), pageCompression=1)
c.setTitle(tr('Charge Atlas | Ronald Reagan focused validation', 'Charge Atlas | Ronald Reagan 专项核查'))
c.setAuthor('Charge Atlas Research')
c.setSubject('Public evidence; language=' + args.lang + '; data-sha256=' + data_hash)
def block(value, y, style=small, gap=8):
    paragraph = p(value, style); _, height = paragraph.wrap(width, H)
    if y - height < 58: raise ValueError(f'Brief content/footer collision: bottom={y-height:.1f}')
    paragraph.drawOn(c, margin, y-height)
    return y-height-gap
def header(page, title):
    c.setFillColor(ink); c.setFont(FONT, 17)
    c.drawString(margin, H-35, 'CHARGE ATLAS / ' + title)
    c.setFont(FONT, 8)
    c.drawRightString(W-margin, H-33, f"{review['asOf']} | v{review['version']} | {page}/2")
    lead = tr('Ronald Reagan H-E-B | Four-post investigation | Not investment-ready',
              'Ronald Reagan H-E-B | 四枪方案调查 | 尚不具备投资资格')
    y = block('<b>' + lead + '</b>', H-53, body, 5)
    return block(tr('Unchanged policy: base payback <=6 years; conservative <=8 years from first spend; base NPV >=0 at 10% real over 10 operating years; positive conservative cash and all six evidence gates.',
                    '门槛不变：从首次支出起，基准回本≤6年、保守≤8年；10个运营年、10%实际折现率下基准NPV≥0；保守现金为正，且六类证据齐全。'), y, small, 10)
def draw_table(rows, widths, y):
    table = Table(rows, colWidths=widths)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), ink), ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F0F4F7')]),
        ('LINEBELOW', (0,0), (-1,-1), .3, colors.HexColor('#D5DCE1')),
        ('LEFTPADDING', (0,0), (-1,-1), 6), ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 4), ('BOTTOMPADDING', (0,0), (-1,-1), 4)]))
    _, height = table.wrap(width, H)
    if y-height < 70: raise ValueError(f'Brief table exceeds page: bottom={y-height:.1f}')
    table.drawOn(c, margin, y-height)
    return y-height-10
def footer():
    report_url = 'https://github.com/CPTM511/supercharger-atlas/blob/main/docs/RONALD-VALIDATION.md'
    product_url = 'https://cptm511.github.io/supercharger-atlas/'
    c.setFont(FONT, 7); c.setFillColor(blue)
    c.drawString(margin, 37, tr('Full evidence and source URLs: ', '完整证据与来源链接：') + report_url)
    c.linkURL(report_url, (margin,34,W-margin,45), relative=0)
    c.drawString(margin, 23, tr('Interactive product: ', '在线产品：') + product_url)
    c.linkURL(product_url, (margin,20,margin+400,31), relative=0)
    c.setFillColor(ink); c.drawRightString(W-margin, 23, 'data SHA-256 ' + data_hash[:16])
    c.showPage()

# Source status and all financial figures share the product's canonical inputs.
y = header(1, tr('RONALD REAGAN', 'RONALD REAGAN'))
y = block('<b>'+plain(site['address'])+'</b>', y, body, 7)
e = analysis['energy']; settings = review['settings']; base = analysis['scenarios']['base']
assessment_text = [
    tr(f"{settings['sessionsPerDay']} sessions on four posts = {e['sessionsPerPostDay']:.2f}/post/day. The remote five-post example becomes 47.2/day when normalized to four posts; retaining 59 requires 25% more throughput per post.",
       f"四枪每天{settings['sessionsPerDay']}次，即每枪{e['sessionsPerPostDay']:.2f}次。外地五枪案例按单枪次数迁移到四枪为47.2次；保持59次需单枪吞吐增加25%。"),
    tr('EV-ChART federal totals imply about 37.81 kWh/session. This supports 35 as a sensitivity input; it does not verify the local paid mean or vehicle mix.',
       'EV-ChART联邦汇总约37.81kWh/次，支持把35用于敏感度分析；不能证明本地付费均值或车型组合。'),
    tr(f"At assumed 15% losses, a permanent 150 kW cap needs {e['equivalentFullPowerHours']:.2f} full-power hours/day, or {e['storeWindowCapacityFraction']*100:.2f}% of a 17-hour window. Targeted summer curtailment is a different design; neither control nor retained sales is assured.",
       f"假设损耗15%，全时150kW限功率需每天{e['equivalentFullPowerHours']:.2f}满功率小时，占17小时窗口的{e['storeWindowCapacityFraction']*100:.2f}%。夏季定向限载属于另一方案；控制能力与保留销量均未保证。"),
    tr('Local 2021 construction registrations: $160k Cedar Park, $315k Georgetown. They exclude specified cost categories and are not current four-post all-in quotes.',
       '附近2021年施工登记：Cedar Park 16万美元、Georgetown 31.5万美元。登记排除特定成本类别，并非当前四枪全包报价。')
]
headers = tr(['Assumption / evidence status', 'What the crosscheck establishes', 'Unresolved'], ['假设 / 证据状态', '交叉核查能证明什么', '尚未解决'])
rows = [[p(plain(v),head) for v in headers]]
limits = [tr('Nearby paid histories, $0.51 price-matched demand and queue losses.', '附近付费历史、0.51美元价格对应需求及排队损失。'),
          tr('Local billed-energy distribution and paid share.', '本地计费电量分布及付费比例。'),
          tr('Tesla/PEC meter-control terms, cost and performance.', 'Tesla/PEC电表控制条款、成本及性能。'),
          tr('Complete EPC, PEC CIAC, land, taxes and control package.', '完整EPC、PEC接电费用、场地、税费及控制报价。')]
for i,item in enumerate(review['assessments']):
    refs = item['sourceIds'][:2] if i < 3 else ['COST9-TDLR-CEDAR','COST9-TDLR-GEORGETOWN','COST9-TDLR-DEFINITION']
    rows.append([p('<b>'+plain(loc(item['title']))+'</b><br/>'+plain(loc(item['status'])),small),
                 p(plain(assessment_text[i])+' '+source_links(refs),small),p(plain(limits[i]),small)])
y = draw_table(rows,[184,400,width-584],y)
y = block(tr('<b>Five nearby operating comparisons.</b> Operator pages verify supply, not paid orders. Distances are straight-line from the retained AFDC inventory; no matched local paid history was obtained.',
             '<b>五处附近运营参照。</b>运营商页面验证供给，不验证付费订单。距离为保留AFDC清单计算的直线距离；未取得可匹配的本地付费历史。'),y,small,6)
headers=tr(['Comparator / address','Miles','Published equipment','Transfer limitation'],['参照 / 地址','英里','公开设备配置','迁移限制'])
rows=[[p(plain(v),head) for v in headers]]
for item in review['comparables']:
    limit=loc(item['limit']).split(' No historical')[0].split(' 未取得历史')[0]
    rows.append([p('<b>'+plain(item['name'])+'</b><br/>'+plain(item['address']),small),p(f"{item['miles']:.1f}",small),
                 p(plain(loc(item['configuration']))+' '+source_links(item['sourceIds']),small),p(plain(limit),small)])
y=draw_table(rows,[275,40,235,width-550],y)
if 'COST9-TCEQ-HEB' in sources:
    y=block(tr('Nearby H-E-B engineering plan: 11 posts, three cabinets and transformer foundation, plus ADA/civil work. PEC tie-in remains marked pending in that historical plan; no complete price or Ronald capacity is established. ',
               '附近H-E-B工程图：11枪、三柜、变压器基础及无障碍/土建。历史图纸仍标注PEC接电设计待定；不能证明完整价格或Ronald容量。')+source_links(['COST9-TCEQ-HEB']),y,small,0)
footer()

y=header(2,tr('CONDITIONAL ECONOMICS','有条件经济性'))
y=block(tr('<b>59-session target rebased into three scenarios.</b> All use 35 billed kWh/session and $0.51/kWh realized price. The 70% / 100% / 120% demand factors are author-selected stresses, not probabilities. Monthly peak 600 kW and established 4CP 150 kW are separate assumptions. Conservative utility components are stressed +25%; construction/ramp/replacement inputs are retained.',
           '<b>以59次目标重设三情景。</b>均按每次计费35kWh、实现价格0.51美元/kWh。70% / 100% / 120%需求系数为作者压力假设，不是概率；月峰600kW与已建立4CP 150kW是独立假设。保守电费分项上调25%；保留建设、爬坡及更新参数。'),y,small,7)
headers=tr(['Scenario','Sessions / site / day','Gross capex','Payback from first spend / NPV','Decision'],['情景','次数 / 站 / 日','总资本支出','首次支出起回本 / NPV','判断'])
rows=[[p(plain(v),head) for v in headers]]
for key in ['conservative','base','optimistic']:
    item=analysis['scenarios'][key]
    name={'conservative':tr('Conservative','保守'),'base':tr('Base','基准'),'optimistic':tr('Optimistic','乐观')}[key]
    decision=tr('Fails <=8-year downside rule','未通过保守≤8年规则') if key=='conservative' else tr('Conditional only; no evidence admission','仅为条件测算，证据未获准入')
    rows.append([p(name),p(f"{item['inputs']['sessionsPerStallDay']*4:.1f}"),p(cash(item['inputs']['capex'])),result(item['outputs']),p(decision,small)])
y=draw_table(rows,[90,120,105,210,width-525],y)
y=block(tr('<b>Combined gate: FAIL.</b> A positive base target does not clear the conservative payback rule. Sensitivities hold other base inputs fixed; port-normalized rows combine the stated session and energy assumptions.',
           '<b>联合门槛：未通过。</b>基准目标为正，仍不能通过保守回本规则。敏感度保持其他基准输入不变；按枪数迁移的行同时采用所列次数与电量假设。'),y,small,6)
headers=tr(['Sensitivity around the 59-session base','Value / interpretation','Payback / NPV'],['围绕59次基准的敏感度','数值 / 解释','回本 / NPV'])
rows=[[p(plain(v),head) for v in headers]]
for item in analysis['portCases']:
    rows.append([p(tr('Five-post example normalized to four posts','五枪案例按单枪次数迁移至四枪'),small),p(f"{item['stationSessions']:.1f}"+tr(' sessions/day x ','次/日 × ')+str(item['sessionEnergy'])+' kWh',small),p(('%.2f' % item['outputs']['projectPaybackYears'] + tr(' yr','年') if item['outputs']['projectPaybackYears'] is not None else tr('No recovery*','期内未回本*'))+' / '+cash(item['outputs']['npv']),small)])
for item in analysis['cpCases'][1:]:
    rows.append([p(tr(f"{item['missedMonths']} of four summer peaks at 600 kW",f"四个夏季峰值中{item['missedMonths']}次达到600kW"),small),p(f"4CP {item['cp']:.1f} kW; "+tr('annual TCOS ','年TCOS ')+cash(item['annualTcos']),small),p(('%.2f' % item['outputs']['projectPaybackYears'] + tr(' yr','年') if item['outputs']['projectPaybackYears'] is not None else tr('No recovery*','期内未回本*'))+' / '+cash(item['outputs']['npv']),small)])
for item in analysis['costCases'][1:]:
    rows.append([p(tr('Unquoted additional gross capital','尚无报价的额外资本支出')+' +'+cash(item['extraCapex']),small),p(tr('Total ','合计 ')+cash(item['inputs']['capex']),small),p(('%.2f' % item['outputs']['projectPaybackYears'] + tr(' yr','年') if item['outputs']['projectPaybackYears'] is not None else tr('No recovery*','期内未回本*'))+' / '+cash(item['outputs']['npv']),small)])
y=draw_table(rows,[320,260,width-580],y)
y=block(tr('4CP rows repeat the specified summer average each established year; they do not predict miss probability or a one-time event. One missed peak adds $8,248.50/year TCOS at the published rate. The 47.2-session transfer is illustrative, not a forecast.',
           '4CP各行在后续每年重复指定夏季均值，不预测漏控概率或单次事件。按公布费率漏控一次增加每年8,248.50美元TCOS。47.2次迁移仅为示例，不是预测。'),y,small,6)
y=block('<b>'+tr('Cost boundary. ','成本边界。')+'</b>'+plain(loc(review['costMethod']))+' '+tr('Known small fees: $175 accessibility filing and $120 for four initial port registrations, where applicable; RAS and renewal costs remain separate.',
           '已知小额费用：适用时无障碍申报175美元、四接口首次登记120美元；RAS及续期费用另核。'),y,small,6)
y=block(tr('<b>Still unpriced:</b> complete civil/electrical/ADA/drainage EPC; PEC CIAC and service equipment; rent/access; tax and insurance; control/storage and lost sales; recurring obligations and removal. Obtain matching contracts and quotes before admission.',
           '<b>仍未完整计价：</b>土建/电气/无障碍/排水EPC、PEC接电及设备、租金/通行、税/保险、控制/储能及损失销量、经常性义务及拆除。准入前须取得匹配合同和报价。'),y,small,6)
y=block(tr('USD, pre-tax/unlevered. NPV uses 10% real discount and 10 operating years; no residual/grant/growth. * No recovery within construction plus 10 operating years. Utility subtotals omit unresolved charges; missing costs may lower returns. Full 18-case analysis and acquisition paths are linked below.',
           '美元，税前且不含融资。NPV按10%实际折现、10个运营年，无残值/补助/增长。*建设加10个运营年内未回本。电费为不含待定费用的小计，缺失成本可能压低回报。完整18项测算与获取路径见下方链接。'),y,small,0)
footer()
c.save(); print(out.name)
