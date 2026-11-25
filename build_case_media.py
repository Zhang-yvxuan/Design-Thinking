"""Build web pictures from the group's original case cards; run from the site root."""
import io, json, re, unicodedata
from pathlib import Path
from PIL import Image
from pypdf import PdfReader
from docx import Document
from pptx import Presentation

site=Path(__file__).resolve().parent
cards=site.parent/'1案例卡'
out=site/'assets'/'cases'; out.mkdir(parents=True,exist_ok=True)
data=json.loads((site/'data.json').read_text(encoding='utf-8'))
known={(x['ownerKey'],x['id']):x for x in data['cases']}
map_pdf=PdfReader(site.parent/'5场景分类思维导图'/'场景分类思维导图.pdf')
labels={}
for line in map_pdf.pages[0].extract_text().splitlines():
    m=re.fullmatch(r'\s*(.+?)\s*·\s*((?:ZYX|WJY|ZZS|LZX)-\d+)\s*',line)
    if m: labels[m[2]]=m[1]

catalog={}
def add(owner, ident, img, file, part, title='', illustration=False):
    assert (owner,ident) in known and f'{owner}:{ident}' not in catalog,(owner,ident)
    title=title or labels.get(ident if owner!='lzx' else 'LZX-'+ident) or known[owner,ident]['title']
    name=f'{owner}-{ident.lower()}.webp'
    img=img.convert('RGB'); img.thumbnail((960,960),Image.Resampling.LANCZOS)
    img.save(out/name,quality=85,method=5)
    catalog[f'{owner}:{ident}']={'image':'assets/cases/'+name,'title':title,'source':f'{file} · {part}','illustration':illustration}

for owner in ['zyx','wjy']:
    file=owner+' al.pdf'
    for num, page in enumerate(PdfReader(cards/file).pages,1):
        text=unicodedata.normalize('NFKC',page.extract_text())
        matches=list(re.finditer(r'案例\s*:\s*('+owner.upper()+r'-\d{3})[^\S\n]*\n([^\n]+)',text))
        images={Path(x.name).stem:x.image for x in page.images}
        sequence=[]
        matrix=None
        for args,op in page.get_contents().operations:
            if op==b'cm': matrix=args
            elif op==b'Do': sequence.append((args[0][1:],(matrix,b'cm')))
        assert len(sequence)==len(matches)==4,(owner,num,sequence)
        for i,((key,(matrix,operator)),m) in enumerate(zip(sequence,matches),1):
            assert operator==b'cm' and key in images and (float(matrix[4])<700)==(i%2==1) and (float(matrix[5])<1300)==(i<=2),(owner,num,i)
            title=m[2].split('·')[0].strip() if owner=='zyx' else ''
            add(owner,m[1],images[key],file,f'第 {num} 页第 {i} 张',title,owner=='zyx')

file='lzx al.docx'
doc=Document(cards/file)
for table in doc.tables:
    for row in table.rows:
        for cell in row.cells:
            match=re.search(r'案例\s*:\s*(\d{3})\s+([^\n]+)',unicodedata.normalize('NFKC',cell.text))
            blips=cell._tc.xpath('.//a:blip')
            if not match: continue
            assert len(blips)==1
            rid=blips[0].get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed')
            add('lzx',match[1],Image.open(io.BytesIO(doc.part.related_parts[rid].blob)),file,'编号 '+match[1],match[2].strip())

file='zzs al.pptx'
for num,slide in enumerate(Presentation(cards/file).slides,1):
    imgs=[]; texts=[]
    for sh in slide.shapes:
        if sh.shape_type==13: imgs.append(sh)
        t=unicodedata.normalize('NFKC',getattr(sh,'text',''))
        m=re.search(r'案例\s*:\s*(ZZS-\d{3})',t)
        if m:
            title=re.search(r"observe\?\s*([^\n]+)",t,re.I)
            texts.append((sh.left,m[1],title[1].strip() if title else ''))
    assert len(imgs)==len(texts)==2,(num,len(imgs),len(texts))
    for sh,(left,ident,title) in zip(sorted(imgs,key=lambda s:s.left),sorted(texts)):
        assert (left<5000000)==(sh.left<5000000)
        rid=sh._element.blipFill.blip.rEmbed
        add('zzs',ident,Image.open(io.BytesIO(slide.part.related_part(rid).blob)),file,f'第 {num} 张幻灯片',labels.get(ident) or (title if len(title)<=42 else ''))
assert len(catalog)==len(known)==80
(out/'catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'{len(catalog)} matching cases; {sum(x.stat().st_size for x in out.glob("*.webp"))//1024} KiB')
