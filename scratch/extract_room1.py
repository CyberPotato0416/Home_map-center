import sys
import os

pdf_path = r"h:\640_cheers_Soft\room1.pdf"
output_txt = r"h:\640_cheers_Soft\scratch\room1_text.txt"

print(f"Reading: {pdf_path}")
if not os.path.exists(pdf_path):
    print("PDF not found!")
    sys.exit(1)

text = ""
try:
    import fitz # PyMuPDF
    print("Trying PyMuPDF...")
    doc = fitz.open(pdf_path)
    for page in doc:
        text += page.get_text()
except Exception as e:
    print(f"PyMuPDF failed: {e}. Trying pypdf...")
    try:
        import pypdf
        reader = pypdf.PdfReader(pdf_path)
        for page in reader.pages:
            t = page.extract_text()
            if t:
                text += t
    except Exception as e2:
        print(f"pypdf failed: {e2}. Installing pypdf...")
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
print(f"Saved to {output_txt}")
