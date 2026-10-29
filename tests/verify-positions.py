"""Independent evidence for the 20-page locator example downloaded from the UI."""
from pathlib import Path
from pypdf import PdfReader
from pypdf.generic import ContentStream
PT=72/25.4
path=Path(__file__).resolve().parents[1]/'output/positions/20-pages-with-locators.pdf'
r=PdfReader(path)
assert len(r.pages)==20
for i,page in enumerate(r.pages):
    for name in ['/MediaBox','/CropBox']:
        assert max(abs(float(a)/PT-b) for a,b in zip(page[name],[0,0,210,297]))<1e-7
    text=page.extract_text()
    assert f'PAGE {i+1}/20  |  R{i//5+1}/4 C{i%5+1}/5' in text,text
    assert 'TOP' in text
    # Locator fill is drawn after the calibrated graphics state, in physical paper coordinates.
    rect=None;filled=[];transforms=[]
    for operands,op in ContentStream(page['/Contents'],r).operations:
        if op==b'cm':transforms.append(list(map(float,operands)))
        if op==b're':rect=list(map(float,operands))
        if op in [b'f',b'f*'] and rect:filled.append(rect);rect=None
    assert len(filled)==1
    x,y,w,h=[a/PT for a in filled[0]]
    col=(x-197)/1.6;row=(291.2-y-h)/1.6
    assert abs(col-i%5)<1e-7 and abs(row-i//5)<1e-7,(i,row,col)
    assert abs(w-1.6)<1e-7 and abs(h-1.6)<1e-7
    assert len(transforms)==1, 'Locator adds no image coordinate transform'
print('PASS: 20 real A4 pages; every label and highlighted cell matches its row/column; image mapping has no added transform.')
