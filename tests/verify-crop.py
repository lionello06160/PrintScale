"""Check that a graphical rotated crop, not the whole source, reaches the exported PDF."""
from pathlib import Path
from pypdf import PdfReader
from pypdf.generic import ContentStream
ROOT=Path(__file__).resolve().parents[1]
reader=PdfReader(ROOT/'output/crop/cropped-rotated.pdf')
assert len(reader.pages)==1
page=reader.pages[0]
PT=72/25.4
for name in ['/MediaBox','/CropBox']:
    values=list(map(float,page[name]))
    assert max(abs(a/PT-b) for a,b in zip(values,[0,0,350,350*200/150]))<1e-7
images=list(page.images)
assert len(images)==1
image=images[0].image.convert('RGB')
assert image.size==(150,200),image.size
assert image.getpixel((30,30))==(233,196,106),image.getpixel((30,30))
matrices=[]
for operands,operator in ContentStream(page['/Contents'],reader).operations:
    if operator==b'cm':matrices.append(list(map(float,operands)))
assert len(matrices)==1
assert abs(matrices[0][0]/PT-350)<1e-7
assert abs(matrices[0][3]/PT-350*200/150)<1e-7
print('PASS: rotated graphical crop embeds only the expected 150 x 200 yellow source quadrant in the exact 350 x 466.666667 mm PDF.')
