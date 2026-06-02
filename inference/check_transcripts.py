# inference/check_transcripts.py
import fitz
import os

folder = "transcripts"
files  = sorted(os.listdir(folder))

pages_1      = []
pages_2_7    = []
pages_8_plus = []

for f in files:
    if not f.endswith(".pdf"):
        continue
    path = os.path.join(folder, f)
    doc  = fitz.open(path)
    p    = len(doc)
    doc.close()

    if p < 2:
        pages_1.append((f, p))
    elif p < 8:
        pages_2_7.append((f, p))
    else:
        pages_8_plus.append((f, p))

print(f"Total PDFs:                    {len(files)}")
print(f"Real transcripts (8+ pages):   {len(pages_8_plus)}")
print(f"Borderline (2-7 pages):        {len(pages_2_7)}")
print(f"Notification letters (1 page): {len(pages_1)}")

if pages_1:
    print("\nNotification letters still present:")
    for f, p in pages_1:
        print(f"  {f} ({p} page)")

if pages_2_7:
    print("\nBorderline files — check manually:")
    for f, p in pages_2_7:
        print(f"  {f} ({p} pages)")

if not pages_1 and not pages_2_7:
    print("\nAll PDFs look clean — ready for batch processing.")