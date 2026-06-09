import sys
import os

pdf_path = r"H:\610_BIMCAD_Standerd\陳啟敏-104履歷.pdf"
output_txt = r"H:\610_BIMCAD_Standerd\scripts\resume_extracted.txt"

print(f"Checking for PDF path: {pdf_path}")
if not os.path.exists(pdf_path):
    print("PDF not found!")
    sys.exit(1)

text = ""

# Try pymupdf (fitz)
try:
    import fitz # PyMuPDF
    print("Using PyMuPDF (fitz)...")
    doc = fitz.open(pdf_path)
    for page in doc:
        text += page.get_text()
except ImportError:
    print("PyMuPDF not installed, trying pypdf...")
    try:
        import pypdf
        print("Using pypdf...")
        reader = pypdf.PdfReader(pdf_path)
        for page in reader.pages:
            t = page.extract_text()
            if t:
                text += t
    except ImportError:
        print("pypdf not installed either. Trying pdfminer...")
        try:
            from pdfminer.high_level import extract_text
            print("Using pdfminer...")
            text = extract_text(pdf_path)
        except ImportError:
            print("No suitable PDF library found. Installing pypdf...")
            import subprocess
            subprocess.check_call([sys.executable, "-m", "pip", "install", "pypdf"])
            import pypdf
            reader = pypdf.PdfReader(pdf_path)
            for page in reader.pages:
                t = page.extract_text()
                if t:
                    text += t

print(f"Extracted {len(text)} characters.")

os.makedirs(os.path.dirname(output_txt), exist_ok=True)
with open(output_txt, "w", encoding="utf-8") as f:
    f.write(text)

print(f"Text written to {output_txt}")
