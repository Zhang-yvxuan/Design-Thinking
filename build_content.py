"""Rebuild independent exhibit payloads from the existing archive and task files."""
from pathlib import Path
import json
import re
import unicodedata
from PIL import Image
from pypdf import PdfReader

SITE = Path(__file__).resolve().parent
ROOT = SITE.parent
OUT = SITE / 'content'
OUT.mkdir(exist_ok=True)
DATA = json.loads((SITE / 'data.json').read_text(encoding='utf-8'))
ART = json.loads((SITE / 'assets/cases/catalog.json').read_text(encoding='utf-8'))

def save(name, value):
    p = OUT / f'{name}.json'
    p.write_text(json.dumps(value, ensure_ascii=False, separators=(',', ':'))+'\n', encoding='utf-8')
    print(f'{name}: {p.stat().st_size:,} bytes')

members = [{'key':x['key'], 'name':x['name']} for x in DATA['members']]
cases = [{**x, 'art': ART.get(x['ownerKey']+':'+x['id'])} for x in DATA['cases']]
case_by_id = {x['id'] if x['ownerKey'] != 'lzx' else f"LZX-{x['id']}": x for x in cases}

# Associate cases with the exact scene line that carries their ID on the team's map.
scenes = DATA['scenes']
canonical = dict(zip([x['code'] for x in scenes],[x['title'] for x in scenes]))
aliases = {'跨语言会谈与发言提示':'A2.2','跨语言会议与发言提示':'A2.2','随身倾诉与对话回顾':'B4.1','随身倾诉与对话回溯':'B4.1'}
def tight(t): return re.sub(r'\s+', '', unicodedata.normalize('NFKC', t))
by_title = {tight(v):k for k,v in canonical.items()}|{tight(k):v for k,v in aliases.items()}
ref_by_scene = {k:[] for k in canonical}; current=None
map_text = PdfReader(ROOT/'5场景分类思维导图'/'场景分类思维导图.pdf').pages[0].extract_text()
for line in map_text.splitlines():
    line=line.strip(); norm=tight(line)
    if norm in by_title:
        current=by_title[norm]
    elif re.match(r'^[A-D]\d?\s+', line):
        current=None
    else:
        m=re.fullmatch(r'(.+?)\s*·\s*((?:CZX|ZYX|WJY|ZZS|LZX)-\d{3})', line)
        if m and current:
            label,key=m.groups()
            case=case_by_id.get(key)
            ref_by_scene[current].append({'id':key,'title':label.strip(),'case':case and f"{case['ownerKey']}:{case['id']}"})
        opinion=re.match(r'^观点\s+([A-Z]{3}-\d{3})',line)
        if opinion and current:
            ident=opinion[1]
            ref_by_scene[current].append({'id':ident,'title':'原分类图所列观点卡','opinion':f'{ident[:3].lower()}:{ident}'})

assert len(scenes)==44 and sum(bool(v) for v in ref_by_scene.values())>=39
for key,item in case_by_id.items():
    item['scenes'] = [{'code':k,'title':canonical[k]} for k,refs in ref_by_scene.items() if any(r['id']==key for r in refs)]
    if item['art']: item['title']=item['art']['title']

def featured(key, label):
    c=case_by_id[key]
    return {**c,'label':label}

pack_root=ROOT/'998数据包'
columns=DATA['packs']['columns']
packmap={}
for d in pack_root.iterdir():
    m=re.search(r'([A-Z]{3})-数据包$',d.name)
    if not d.is_dir() or not m: continue
    sub=d/d.name
    base=sub if sub.is_dir() else d
    def files(p): return sum(1 for f in p.rglob('*') if f.is_file() and not f.name.startswith('~$') and f.name not in {'desktop.ini','Thumbs.db','.DS_Store'})
    packmap[m[1].lower()]={'cells':[files(base/col) for col in columns],'files':files(base)}
assert len(packmap)==5
packs=[{**m,**packmap[m['key']]} for m in members]

# Recover opinion cards from the source rather than truncating the display snippets.
from docx import Document
from pptx import Presentation

marker=re.compile(r'(?m)^[ \t]*观点[ \t]+([A-Z]{3})[ \t]*-+[ \t]*(\d{3})[ \t]*([^\n]*)$')
heading=re.compile(r'^(?:\d{1,2}\s*[.、]?\s*(?:细分应用|产品特征|设计机会)|[A-Da-d]\s+|依据\s*|论文依据|总判断|产品特征[:：]|Agent 能力|[①②③④⑤⑥])')

def paragraphs(lines, pdf):
    result=[]
    for line in lines:
        line=line.strip(' |\t')
        if not line or re.match(r'^(?:观点卡\s*/|设计思维\s*·|AI 硬件产品观察卡\s*·)',line): continue
        join=pdf and result and not heading.match(line) and (not heading.match(result[-1]) or result[-1].startswith(('依据','论文依据','总判断'))) and result[-1][-1] not in '。！？；!?;'
        if join:
            sep=' ' if result[-1][-1:].isascii() and line[0].isascii() and result[-1][-1:].isalnum() and line[0].isalnum() else ''
            result[-1]+=sep+line
        else: result.append(line)
    return result

opinions=[]
for member in members:
    key=member['key']; file=next((ROOT/'2观点卡').glob(f'{key} gd.*'))
    if file.suffix=='.docx':
        doc=Document(file)
        text='\n'.join([x.text for x in doc.paragraphs]+[cell.text for table in doc.tables for row in table.rows for cell in row.cells])
    elif file.suffix=='.pptx':
        text='\n'.join(sh.text for slide in Presentation(file).slides for sh in slide.shapes if sh.has_text_frame)
    else:
        text='\n'.join(page.extract_text() or '' for page in PdfReader(file).pages)
    text=unicodedata.normalize('NFKC',text)
    marks=list(marker.finditer(text))
    if key=='wjy':
        labels=[o['title'] for o in DATA['opinions'] if o['ownerKey']==key]
        pattern='|'.join(re.escape(label) for label in labels)
        marks=list(re.finditer(rf'(?m)^({pattern})[ \t]*$',text))
    assert marks,(key,file)
    for i,m in enumerate(marks):
        lines=[s.strip(' |\t') for s in text[m.end():marks[i+1].start() if i+1<len(marks) else len(text)].splitlines() if s.strip(' |\t')]
        if key=='wjy':
            title=m[1]; scene=''; ident=f'WJY-{i+1:02}'
        else:
            ident=f'{m[1]}-{m[2]}'; scene=m[3].strip(' /|'); title=lines.pop(0) if lines and not heading.match(lines[0]) else scene or ident
        body=paragraphs(lines,file.suffix=='.pdf')
        core=''
        if body and body[0].startswith('核心观点'): core=body.pop(0).removeprefix('核心观点').strip(' :：')
        opinions.append({'id':ident,'ownerKey':key,'owner':member['name'],'title':title,'scene':scene,'core':core,'body':body,'source':file.name})
assert len({(x['ownerKey'],x['id']) for x in opinions})==len(opinions)
assert len(opinions)>=len(DATA['opinions']),(len(opinions),len(DATA['opinions']))

asset=SITE/'assets'/'analysis'; asset.mkdir(exist_ok=True)
analysis_root=ROOT/'output'/'极端用户分析全套'
scene_index=[]
for s in scenes:
    code=s['code']; text=(analysis_root/'文本'/f'{code}.md').read_text(encoding='utf-8'); hmw=re.search(r'场景问题（HMW）：(.+)',text)[1]
    head,acts=text.split('## 极端行为',1)
    pl,al=(re.findall(r'^(\d+)\.\s+(.+)$',x,re.M) for x in (head,acts))
    assert pl and al,code
    src=analysis_root/'PNG'/f'{code}.png'; dest=asset/f'{code}.webp'
    if not dest.exists() or src.stat().st_mtime>dest.stat().st_mtime:
        with Image.open(src) as im:
            im.thumbnail((2200,1320),Image.Resampling.LANCZOS)
            im.save(dest,lossless=True,method=4)
    scene_index.append({**s,'hmw':hmw,'counts':[len(pl),len(al)],'references':ref_by_scene[code]})
    save(f'users-{code}',{'code':code,'people':pl,'behaviors':al,'image':f'assets/analysis/{code}.webp'})

save('home',{'stats':[['成员数据包',len(packs)],['可检索案例',len(cases)],['末级场景',len(scenes)],['文献索引',len(DATA['papers'])]],'featured':[featured('ZYX-001','学习陪伴'),featured('LZX-040','日常起居'),featured('ZZS-003','第一视角'),featured('ZYX-005','远程协作')]})
save('cases',{'members':members,'cases':cases,'scans':[{ 'ownerKey':'czx','owner':'蔡紫璇','id':f'P{i}','title':f'蔡紫璇案例卡原页 · {i}','image':f'assets/czx/{i:02}.jpg'} for i in range(1,6)]})
save('opinions',{'members':members,'opinions':opinions})
save('scenes',scene_index)
save('library',{'datasource':DATA['datasource'],'packs':{'columns':columns,'rows':packs}})
papers=[p for p in DATA['papers'] if re.match(r'^https?://',p['url'])]
save('papers',papers)
