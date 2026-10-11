"""Reproducible synthetic fixtures, no private or third-party document content.
Run after npm ci: pip install -r scripts/requirements-fixtures.txt
"""
from pathlib import Path
import json, re
from fontTools.ttLib import TTFont as Font
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen.canvas import Canvas
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
import fitz
root=Path(__file__).resolve().parents[1]
out=root/'public/fixtures';out.mkdir(parents=True,exist_ok=True)
tmp=root/'tmp/fixtures';tmp.mkdir(parents=True,exist_ok=True)
for name,source in [('Hindi','noto-sans-devanagari/files/noto-sans-devanagari-devanagari-400-normal.woff'),('Latin','dm-sans/files/dm-sans-latin-400-normal.woff')]:
 f=Font(root/'node_modules/@fontsource'/source);f.flavor=None;f.save(tmp/(name+'.ttf'))
 pdfmetrics.registerFont(TTFont(name,str(tmp/(name+'.ttf'))))
texts={
 'english':'Artificial intelligence improves information retrieval.',
 'hindi':'कृत्रिम बुद्धिमत्ता सूचना पुनर्प्राप्ति में सुधार करती है।',
 'mixed':'भारत में Artificial Intelligence का उपयोग तेजी से बढ़ रहा है।'
}
style=ParagraphStyle('body',fontName='Hindi',fontSize=18,leading=34,shaping=True)
def page(c,text):
 # Explicit font spans for Latin subset; Hindi is shaped with HarfBuzz.
 html=re.sub(r'[A-Za-z.,]+(?: [A-Za-z.,]+)*',lambda m:'<font name="Latin">'+m[0]+'</font>',text)
 p=Paragraph(html,style);w,h=p.wrap(640,200);p.drawOn(c,40,230-h);c.showPage()
# Create shaped visual sources, then a genuine image-only scan and a searchable
# text-overlay copy. Original Unicode in the overlay avoids ReportLab's shaped
# glyph PUA mappings. This is the same PDF structure produced by OCR software.
from reportlab.lib.utils import ImageReader
import io
for name,text in texts.items():
 visual=tmp/(name+'-visual.pdf');c=Canvas(str(visual),pagesize=(720,300),invariant=1);page(c,text);c.save()
 source=fitz.open(visual);pix=source[0].get_pixmap(matrix=fitz.Matrix(2,2),alpha=False)
 image=pix.tobytes('png');pix.save(str(tmp/(name+'.png')))
 scan=fitz.open();p=scan.new_page(width=720,height=300);p.insert_image(p.rect,stream=image);scan.save(out/(name+'-scan.pdf'),deflate=True)
 assert not scan[0].get_text().strip(), 'Scanned fixture must contain no text layer'
 c=Canvas(str(out/(name+'-text.pdf')),pagesize=(720,300),invariant=1)
 c.drawImage(ImageReader(io.BytesIO(image)),0,0,width=720,height=300)
 t=c.beginText(40,210);t.setTextRenderMode(3)
 for part in re.split(r'([A-Za-z., ]+)',text):
  t.setFont('Latin' if re.fullmatch(r'[A-Za-z., ]+',part) else 'Hindi',18)
  t.textOut(part)
 c.drawText(t);c.showPage();c.save()
bilingual=fitz.open()
for name in texts:bilingual.insert_pdf(fitz.open(out/(name+'-text.pdf')))
bilingual.save(out/'bilingual-text.pdf')
mixed=fitz.open();mixed.insert_pdf(fitz.open(out/'english-text.pdf'));mixed.insert_pdf(fitz.open(out/'hindi-scan.pdf'));mixed.save(out/'hybrid.pdf')
(out/'references.json').write_text(json.dumps(texts,ensure_ascii=False,indent=2)+'\n')
(out/'invalid.pdf').write_bytes(b'This is not a PDF.')
print('Created 8 PDFs plus invalid-file fixture and references.')
