"""Independent verification of PDFs downloaded from the browser, using pypdf."""
from pathlib import Path
import json
from pypdf import PdfReader
from pypdf.generic import ContentStream
PT=72/25.4
ROOT=Path(__file__).resolve().parents[1]
report={}
for name in ['350x466.7-A4-overlap','350x466.7-A4-butt','350x466.7-original']:
    reader=PdfReader(ROOT/'output/pdf'/f'{name}.pdf')
    single=name.endswith('original')
    assert len(reader.pages)==(1 if single else 4)
    matrices=[]
    for i,page in enumerate(reader.pages):
        expected=[0,0,350,466.7] if single else [0,0,210,297]
        for key in ['/MediaBox','/CropBox']:
            assert key in page
            actual=[float(x)/PT for x in page[key]]
            assert max(abs(a-b) for a,b in zip(actual,expected))<1e-8,(i,key,actual)
        stream=ContentStream(page['/Contents'],reader)
        last_matrix=None
        for operands,operator in stream.operations:
            if operator==b'cm':last_matrix=[float(x)/PT for x in operands]
            if operator==b'Do' and str(operands[0]).startswith('/Poster-'):
                matrices.append(last_matrix)
    assert len(matrices)==len(reader.pages)
    if not single:
        assert abs(matrices[0][4]-matrices[1][4]-170)<1e-8
        assert abs(matrices[2][5]-matrices[0][5]-257)<1e-8
        assert abs(180-(matrices[0][4]-matrices[1][4])-10)<1e-8
        assert all(abs(m[0]-matrices[0][0])<1e-8 and abs(m[3]-matrices[0][3])<1e-8 for m in matrices)
    report[name]={'pages':len(reader.pages),'mediaBox_mm':expected,'cropBox_mm':expected,'image_matrices_mm':matrices,'pass':True}
assert report['350x466.7-A4-overlap']['image_matrices_mm']==report['350x466.7-A4-butt']['image_matrices_mm']
(ROOT/'output/pdf/verification.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
