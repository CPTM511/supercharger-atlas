#!/usr/bin/env python3
"""Build a two-page public shortlist; no personal application material is read."""
import argparse, json
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

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--font', type=Path, help='Licensed Unicode TrueType font with Chinese glyphs')
parser.add_argument('--output', type=Path, default=ROOT/'downloads/charge-atlas-brief.pdf')
args=parser.parse_args()
font=args.font
if not font:
    system_font=Path('/System/Library/Fonts/Supplemental/Arial Unicode.ttf')
    font=system_font if system_font.exists() else None
if font:
    pdfmetrics.registerFont(TTFont('Brief',str(font)))
else:
    pdfmetrics.registerFont(UnicodeCIDFont('STSong-Light'))
FONT='Brief' if font else 'STSong-Light'
data=json.loads((ROOT/'data/candidates.json').read_text())
sources={s['id']:s for s in data['sources']}
W,H=landscape(A4); margin=30; width=W-2*margin
ink=colors.HexColor('#203544'); blue=colors.HexColor('#3555C5')
style=ParagraphStyle('body',fontName=FONT,fontSize=7.6,leading=10.2,textColor=ink,wordWrap='CJK')
small=ParagraphStyle('small',parent=style,fontSize=6.8,leading=9)
head=ParagraphStyle('head',parent=style,fontSize=7.7,leading=10,textColor=colors.white)
def p(s,st=style): return Paragraph(s,st)
args.output.parent.mkdir(parents=True,exist_ok=True)
c=canvas.Canvas(str(args.output),pagesize=(W,H),pageCompression=1)
c.setTitle('Charge Atlas | Two perspectives, twenty conditional sites')
c.setAuthor('Charge Atlas Research')
c.setSubject('Public evidence and due-diligence priorities; independent, not Tesla endorsed')
for page,mode in enumerate(['network','investor'],1):
    c.setFillColor(ink); c.setFont(FONT,19)
    c.drawString(margin,H-38,'CHARGE ATLAS  /  '+('网络选址' if mode=='network' else '投资尽调'))
    c.setFont(FONT,8); c.drawRightString(W-margin,H-35,f"{data['meta']['asOf']}   |   {page} / 2")
    intro='网络：优先核查走廊补点和服务增量。' if mode=='network' else '投资：优先核实商业条件与下行风险；Leander / Ronald Reagan 是替代物业，不应叠加需求。'
    c.setFont(FONT,8); c.drawString(margin,H-56,intro+' 排名为候选池内尽调顺序，并非全美最优或可建设证明。')
    rows=[[p(t,head) for t in ['#','具体场地 / 完整地址','选址逻辑 / 可点击的来源','最强反证 / 停止条件']]]
    ranked=sorted([x for x in data['candidates'] if x['ranks'][mode]],key=lambda x:x['ranks'][mode])
    for x in ranked:
        links=' · '.join(f'<a href="{escape(sources[i]["url"], {chr(34): "&quot;"})}" color="#3555C5">{i}</a>' for i in x['sourceIds'])
        rows.append([p(str(x['ranks'][mode])),p(escape(x['name'])+'<br/>'+escape(x['address'])),
                     p(escape(x['thesis'][mode])+f'<br/><font size="6.2">{links}</font>'),p(escape(x['counterargument']))])
    table=Table(rows,colWidths=[23,190,287,width-500])
    table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),ink),('VALIGN',(0,0),(-1,-1),'TOP'),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#F3F5F7')]),('LINEBELOW',(0,0),(-1,-1),.35,colors.HexColor('#D5DCE1')),('LEFTPADDING',(0,0),(-1,-1),5),('RIGHTPADDING',(0,0),(-1,-1),5),('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4)]))
    tw,th=table.wrap(width,H)
    if th>H-150: raise ValueError(f'Page {page} table too tall: {th}; revise layout, do not truncate evidence')
    table.drawOn(c,margin,H-69-th)
    if mode=='network':
        footer='验证与 AI：公开物业来源 + AFDC 15,882 条运营 DCFC 记录 + 643 条规划/临时停运记录；社区管线只作线索。AI 整理和比对，研究者判断取舍；地块、电力、许可和需求仍须责任方确认。直线距离不是驾车距离，未查到不是不存在。'
    else:
        footer='投资门槛：取得场地许可、完整接网/安装报价及实测需求后再决策。统一示例 8 枪、4 次/枪/日、40kWh/次的年经营现金贡献为 -$9,576；盈亏平衡 4.41 次/枪/日，不代表任何候选实绩。首月工作顺序：排除供给冲突 → 核业主和电力 → 现场需求/报价 → 重排并提交继续或停止结论。'
    block=p(footer,small); bw,bh=block.wrap(width,70); block.drawOn(c,margin,42)
    c.setFont(FONT,7);c.setFillColor(blue)
    c.drawString(margin,25,'完整证据、37 个候选和可复核计算： https://cptm511.github.io/supercharger-atlas/')
    c.linkURL('https://cptm511.github.io/supercharger-atlas/',(margin,22,W-margin,34),relative=0)
    c.showPage()
c.save();print(args.output.name)
