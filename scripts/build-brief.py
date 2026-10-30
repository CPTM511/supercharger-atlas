#!/usr/bin/env python3
"""Rebuild the two-page EN/ZH brief from current local-validation data."""
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
review = data['localValidationReview']
data_hash = hashlib.sha256(data_bytes).hexdigest()
by_id = {item['id']: item for item in data['candidates']}
selected = [by_id[item['candidateId']] for item in review['records']]
sources = {item['id']: item for item in review['sources']}
profiles = [(site, plan) for site in selected for plan in site['localValidation']['tariffPlans']]
if not selected or not profiles:
    raise ValueError('Current local-validation records and tariff analyses are required')

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
c.setTitle(tr('Charge Atlas | Local evidence and tariff sensitivities', 'Charge Atlas | 本地证据与电费敏感度'))
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
    n = data['meta']['localValidation']['qualified']
    lead = tr(f'{len(selected)} local reviews | {len(profiles)} conditional tariff profiles | {n} investment-ready sites',
              f'{len(selected)}处本地核查 | {len(profiles)}种有条件电费方案 | {n}处具备投资资格')
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
        ('TOPPADDING', (0,0), (-1,-1), 6), ('BOTTOMPADDING', (0,0), (-1,-1), 6)]))
    _, height = table.wrap(width, H)
    if y-height < 70: raise ValueError(f'Brief table exceeds page: bottom={y-height:.1f}')
    table.drawOn(c, margin, y-height)
    return y-height-10
def footer():
    report_url = 'https://github.com/CPTM511/supercharger-atlas/blob/main/docs/LOCAL-VALIDATION.md'
    product_url = 'https://cptm511.github.io/supercharger-atlas/'
    c.setFont(FONT, 7); c.setFillColor(blue)
    c.drawString(margin, 37, tr('Full evidence and source URLs: ', '完整证据与来源链接：') + report_url)
    c.linkURL(report_url, (margin,34,W-margin,45), relative=0)
    c.drawString(margin, 23, tr('Interactive product: ', '在线产品：') + product_url)
    c.linkURL(product_url, (margin,20,margin+400,31), relative=0)
    c.setFillColor(ink); c.drawRightString(W-margin, 23, 'data SHA-256 ' + data_hash[:16])
    c.showPage()

# The evidence text comes from the same bilingual records shown in the product.
y = header(1, tr('LOCAL EVIDENCE', '本地证据'))
headers = tr(['Property / exact address', 'New public evidence', 'Decision change / remaining condition'],
             ['场地 / 具体地址', '新增公开证据', '判断变化 / 仍须满足的条件'])
rows = [[p(plain(value), head) for value in headers]]
finding_ids = {'heb-ronaldreagan':['parcel'], 'winco-puyallup':['utility'],
               'heb-elgin':['traffic','overlap'], 'winco-edmonds':['rebate'], 'winco-medford':['rebate']}
for site in selected:
    local = site['localValidation']; findings = {item['id']:item for item in local['findings']}
    chosen = [findings[key] for key in finding_ids.get(site['id'], [local['findings'][0]['id']])]
    evidence = '<br/><br/>'.join(plain(loc(item['claim'])) + ' ' + source_links(item['sourceIds']) for item in chosen)
    conditions = '<b>' + plain(loc(local['change'])) + '</b><br/><br/>' + plain(loc(chosen[-1]['limitation']))
    rows.append([p('<b>'+plain(site['name'])+'</b><br/>'+plain(site['address'])), p(evidence), p(conditions)])
y = draw_table(rows, [177,305,width-482], y)
y = block(plain(loc(review['conclusion'])), y, label, 6)
y = block(tr('All 37 candidate decisions remain pending. No enforceable site rights, complete design-matched EPC quote, firm grid capacity/date or calibrated local paid-demand forecast was obtained. Road traffic and mapped service territory do not establish charging orders or available power. No awarded grant is booked.',
             '全部37处候选决策仍待核。未取得可执行场地权利、匹配设计的完整EPC报价、确定接电容量/交期或校准的本地付费需求预测。道路车流和供电区域图不证明充电订单或可用电力；未计入任何获批补助。'), y)
footer()

# All financial outputs are read from the current canonical analysis, not copied from prose.
y = header(2, tr('TARIFF SENSITIVITIES', '电费敏感度'))
y = block('<b>' + tr('Utility SUBTOTALS, not full bills. Taxes, reactive power, bespoke charges and load-control costs remain unpriced. These are assumptions, not forecasts; positive results can overstate returns.',
                      '电费仅为小计，并非完整账单。税、无功、特殊费用和负荷控制成本尚未计价。这些是条件假设，非预测；正向结果可能高估收益。') + '</b>', y, small, 8)
headers = tr(['Conditional profile', 'Conservative\nPayback / NPV', 'Base\nPayback / NPV', 'Optimistic\nPayback / NPV', '42 x 35 transfer\nPayback / NPV', 'Joint demand\nkWh/post/day', 'Base utility\nSUBTOTAL / year'],
             ['条件电费方案', '保守\n回本 / NPV', '基准\n回本 / NPV', '乐观\n回本 / NPV', '42 x 35类比\n回本 / NPV', '联合所需电量\nkWh/枪/日', '基准年电费\n小计'])
rows = [[p(plain(value).replace('\n','<br/>'), head) for value in headers]]
for site, plan in profiles:
    analysis = plan['analysis']
    transfer = next(item for item in analysis['transfers'] if item['stationSessions']==42 and item['kwhPerSession']==35)
    required = analysis['requiredPairedKwhPerPostDay']
    rows.append([p('<b>'+plain(site['name'])+'</b><br/>'+plain(loc(plan['label']))),
                 *[result(analysis['scenarios'][key]['outputs']) for key in ['conservative','base','optimistic']],
                 result(transfer['outputs']), p(f'{required:,.1f}' if required is not None else tr('Not reached','未达到')),
                 p(cash(analysis['scenarios']['base']['outputs']['annualUtilitySubtotal']))])
y = draw_table(rows, [190,86,86,86,111,102,width-661], y)
transfer = next(item for item in profiles[0][1]['analysis']['transfers'] if item['stationSessions']==42 and item['kwhPerSession']==35)
transfer_text = tr(
    f"42 sessions/site/day is reported grocery-adjacent analytics, not audited local orders. Assuming all sessions are paid and {transfer['kwhPerSession']} kWh each gives {transfer['kwhPerPostDay']:.1f} kWh/post/day on {transfer['inputs']['stalls']} posts. Paid mix, session energy and site comparability are unverified. The transfer holds base cost and tariff fixed; it is separate from the three scenarios.",
    f"42次/站/日来自超市邻近站的报告分析，并非本地审计订单。假设全部付费、每次{transfer['kwhPerSession']}kWh，转移到{transfer['inputs']['stalls']}枪得到{transfer['kwhPerPostDay']:.1f}kWh/枪/日。付费比例、单次电量及可比性未核。类比固定基准成本与电价，与三情景分开。")
y = block('<b>'+tr('Transfer and joint boundary. ', '类比与联合门槛。')+'</b>'+plain(transfer_text), y, small, 6)
y = block(plain(loc(review['tariffMethod'])), y, small, 6)
y = block(tr('<b>Conditions.</b> PEC assumes uniform hourly energy and one full startup year before the 4CP transition; actual calendar and achieved 4CP require verification. PSE 26 assumes secondary service and the same 600 kW monthly maximum. PSE 558 enrollment is unapproved and capped; preserving sales under its 200/600 kW peak/off-peak limits requires a priced control/queue design. These profiles do not establish spare capacity.',
             '<b>适用条件。</b>PEC假设每小时均匀用电，并在完整首运营年后切换4CP收费；真实切换日历及可实现4CP须核验。PSE 26假设低压侧服务且每月同为600kW峰值。PSE 558准入未获批且有名额限制；在200/600kW峰/谷限制下保留销量，须有已计价的控制与排队方案。这些方案不证明剩余容量。'), y, small, 6)
y = block(tr('NPV: USD thousands, 10% real discount, 10 operating years, no residual. Payback starts at first spend. * No recovery within construction plus 10 operating years. Joint demand is a lower, incomplete-cost boundary under paired base/downside rules, not observed demand or a full-gate pass. PSE\'s optional $160k capital case remains an unawarded, post-installation sensitivity; it is excluded above and includes no stacked grid-upgrade allowance.',
             'NPV单位为千美元，10%实际折现率、10个运营年、无残值；回本从首次支出起。*建设加10个运营年内未回本。联合电量仅为基准/保守规则下未完整计价的下限，非实测需求或完整门槛通过。PSE可选16万美元仅为未获批、安装后支付的补助敏感度，未计入上表，也未叠加电网升级额度。'), y, small, 0)
footer()
c.save(); print(out.name)
