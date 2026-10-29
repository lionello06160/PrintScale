"""Independent inspection of real browser downloads, including accumulated PDF transforms."""
from pathlib import Path
from math import hypot
import json
from pypdf import PdfReader
from pypdf.generic import ContentStream
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/calibration'
PT=72/25.4

def multiply(a,b):
    # PDF transforms map a point through b, then a.
    return [a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]]
def inspect(reader,page):
    ctm=[1,0,0,1,0,0];stack=[];images=[];lines=[];clips=[];point=None;pending_rect=None
    def at(x,y):return ((ctm[0]*x+ctm[2]*y+ctm[4])/PT,(ctm[1]*x+ctm[3]*y+ctm[5])/PT)
    for operands,op in ContentStream(page['/Contents'],reader).operations:
        if op==b'q':stack.append(ctm[:])
        elif op==b'Q':ctm=stack.pop()
        elif op==b'cm':ctm=multiply(ctm,list(map(float,operands)))
        elif op==b'm':point=at(*map(float,operands))
        elif op==b'l':
            end=at(*map(float,operands))
            if point:lines.append((point,end))
            point=end
        elif op==b're':
            x,y,w,h=map(float,operands);pending_rect=(at(x,y),at(x+w,y+h))
        elif op in [b'W',b'W*'] and pending_rect:
            clips.append(pending_rect);pending_rect=None
        elif op==b'Do' and str(operands[0]).startswith('/Poster-'):images.append([ctm[0]/PT,ctm[1]/PT,ctm[2]/PT,ctm[3]/PT,ctm[4]/PT,ctm[5]/PT])
    assert not stack, 'Unbalanced graphics state'
    return {'images':images,'lines':lines,'clips':clips}

def boxes(reader,expected):
    for page in reader.pages:
        for key in ['/MediaBox','/CropBox']:
            assert key in page
            values=[float(n)/PT for n in page[key]]
            assert max(abs(x-y) for x,y in zip(values,[0,0,*expected]))<1e-7,(key,values)

report={}
ruler=PdfReader(OUT/'100mm-reference.pdf');boxes(ruler,(210,297));e=inspect(ruler,ruler.pages[0]);
assert len(ruler.pages)==1 and not e['images']
x,y=55,98.5
for target in [((x,y),(x+100,y)),((x,y),(x,y+100))]:
    assert any(max(abs(a-b) for actual,want in zip(line,target) for a,b in zip(actual,want))<1e-7 for line in e['lines']),target
report['ruler']={'pages':1,'paper_mm':[210,297],'reference_X_mm':100,'reference_Y_mm':100,'uncompensated':True}
for name in ['standard','original','corrected-overlap','corrected-butt']:
    reader=PdfReader(OUT/f'{name}.pdf');corrected=name.startswith('corrected');single=name=='original';boxes(reader,(350,466.7) if single else (210,297))
    assert len(reader.pages)==(6 if corrected else 1 if single else 4)
    image_matrices=[]
    for page in reader.pages:
        data=inspect(reader,page);assert len(data['images'])==1
        m=data['images'][0];image_matrices.append(m)
        expected_w=350*(100/98 if corrected else 1);expected_h=466.7*(100/102 if corrected else 1)
        assert abs(m[0]-expected_w)<1e-7 and abs(m[3]-expected_h)<1e-7,(name,m)
        if corrected:
            assert abs(m[0]*.98-350)<1e-7 and abs(m[3]*1.02-466.7)<1e-7
            assert 'CAL X102.04% Y98.04%' in page.extract_text()
            for (l,b),(r,t) in data['clips']:
                assert l>=15-1e-7 and b>=15-1e-7 and r<=195+1e-7 and t<=282+1e-7,(name,(l,b,r,t))
    report[name]={'pages':len(reader.pages),'paper_mm':[350,466.7] if single else [210,297],'image_matrices_mm':image_matrices,'pass':True}
assert report['corrected-overlap']['image_matrices_mm']==report['corrected-butt']['image_matrices_mm']
(OUT/'verification.json').write_text(json.dumps(report,indent=2))
print('PASS: 100 mm reference axes; unchanged standard and original; six-page corrected output, composed matrices, safe margins, labels and simulated inverse scaling.')
