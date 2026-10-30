#!/usr/bin/env python3
"""Rebuild the two-page EN/ZH brief from current ten-location follow-up priorities."""
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
review = data['followupReview']
data_hash = hashlib.sha256(data_bytes).hexdigest()
sources = {item['id']: item for item in data['sources']}

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
c.setTitle(tr('Charge Atlas | Ten follow-up priorities', 'Charge Atlas | 十址跟进优先级'))
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
    lead = tr('The same ten properties | Two investigation perspectives | 0 qualified / 37 pending',
              '同一十址 | 两种跟进视角 | 0合格 / 37待核实')
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
    report_url = 'https://github.com/CPTM511/supercharger-atlas/blob/main/docs/FOLLOWUP-PRIORITIES.md'
    product_url = 'https://cptm511.github.io/supercharger-atlas/'
    c.setFont(FONT, 7); c.setFillColor(blue)
    c.drawString(margin, 37, tr('Full evidence and source URLs: ', '完整证据与来源链接：') + report_url)
    c.linkURL(report_url, (margin,34,W-margin,45), relative=0)
    c.drawString(margin, 23, tr('Interactive product: ', '在线产品：') + product_url)
    c.linkURL(product_url, (margin,20,margin+400,31), relative=0)
    c.setFillColor(ink); c.drawRightString(W-margin, 23, 'data SHA-256 ' + data_hash[:16])
    c.showPage()

# Rankings and narrative use the same public canonical records as the product.
records=sorted(review['records'],key=lambda r:r['ranks']['combined'])
for page in [1,2]:
    y=header(page,tr('TEN FOLLOW-UP PRIORITIES','十址跟进优先级'))
    y=block(plain(loc(review['method'])),y,small,8)
    headers=tr(['Location / scope / order','Why follow up','Verify next / downgrade or stop'],['地址 / 范围 / 顺序','跟进理由','下一步核实 / 降级或暂停'])
    rows=[[p(plain(v),head) for v in headers]]
    for r in records[(page-1)*5:page*5]:
        site=next(c for c in data['candidates'] if c['id']==r['candidateId'])
        rank=r['ranks']
        identity='<b>'+str(rank['combined'])+'. '+plain(site['name'])+'</b><br/>'+plain(site['address'])+'<br/>'+plain(loc(r['projectScope']))+'<br/>'+tr('Network #','网络 #')+str(rank['network'])+' / '+tr('Third-party #','第三方 #')+str(rank['investor'])
        checks=plain(loc(r['nextChecks']))+'<br/><b>'+tr('Stop / downgrade: ','暂停/降级：')+'</b>'+plain(loc(r['stopCondition']))
        rows.append([p(identity,small),p(plain(loc(r['reason'])),small),p(checks,small)])
    y=draw_table(rows,[190,200,width-390],y)
    y=block(plain(loc(review['evidenceScope'])),y,small,6)
    y=block(plain(loc(review['boundary'])),y,small,0)
    footer()
c.save();print(out.name)
