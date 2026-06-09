import sys
import os

pdf_path = r"h:\640_cheers_Soft\room1.pdf"

print(f"File size: {os.path.getsize(pdf_path)} bytes")

# 1. Try PyMuPDF
try:
    import fitz
    doc = fitz.open(pdf_path)
    print(f"PyMuPDF pages: {len(doc)}")
    pymupdf_text = ""
    img_count = 0
    for i, page in enumerate(doc):
        t = page.get_text()
        pymupdf_text += t
        imgs = page.get_images()
        img_count += len(imgs)
        print(f"Page {i+1}: text len={len(t)}, images={len(imgs)}")
    print(f"PyMuPDF total text len: {len(pymupdf_text)}, total images: {img_count}")
except Exception as e:
    print(f"PyMuPDF failed: {e}")

# 2. Try pypdf
try:
    import pypdf
    reader = pypdf.PdfReader(pdf_path)
    pypdf_text = ""
    for i, page in enumerate(reader.pages):
        t = page.extract_text()
        if t:
            pypdf_text += t
    print(f"pypdf total text len: {len(pypdf_text)}")
except Exception as e:
    print(f"pypdf failed: {e}")

# 3. Try pdfminer
try:
    from pdfminer.high_level import extract_text
    pdfminer_text = extract_text(pdf_path)
    print(f"pdfminer total text len: {len(pdfminer_text)}")
except Exception as e:
    print(f"pdfminer failed: {e}")
