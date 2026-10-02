# -*- coding: utf-8 -*-
"""run_all_63.py: Master runner for compiling and auditing all 63 English PDF forms"""
import os, sys, glob, fitz

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPT_DIR)

import b01, b02, b03, b04, b05, b06, b07, b08, b09, b10a, b10b, b11, b12, b13, b14, b15, b16, b17, b18, b19, b20a, b20b, b21, b22, b23, b24, b25, b26, b27, b28, b29, b30

MODULES = [
    b01, b02, b03, b04, b05, b06, b07, b08, b09, b10a, b10b, b11, b12, b13, b14, b15,
    b16, b17, b18, b19, b20a, b20b, b21, b22, b23, b24, b25, b26, b27, b28, b29, b30
]

OUT_DIR = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\EN"

def main():
    print("=" * 72)
    print("RE-COMPILING ALL 63 ENGLISH PDF FORMS (FULL PAGE OCCUPANCY)")
    print(f"Destination: {OUT_DIR}")
    print("=" * 72)
    os.makedirs(OUT_DIR, exist_ok=True)

    for i, mod in enumerate(MODULES, 1):
        print(f"[{i:02d}/{len(MODULES):02d}] Running {mod.__name__}...")
        mod.run()

    print("\n" + "=" * 72)
    print("ALL MODULES COMPILED. AUDITING ALL 63 PDFS WITH PYMUPDF...")
    print("=" * 72)

    files = sorted(glob.glob(os.path.join(OUT_DIR, "*.pdf")))
    print(f"Total PDFs found: {len(files)}")

    erros = 0
    alertas = 0
    aprovados = 0

    for f in files:
        fn = os.path.basename(f)
        doc = fitz.open(f)
        num_paginas = doc.page_count
        p = doc[0]
        rects = p.get_textpage().extractBLOCKS()
        max_y = max([r[3] for r in rects]) if rects else 0
        ocupacao = (max_y / p.rect.height) * 100.0

        if num_paginas != 1:
            print(f"❌ [PAGES ERROR] {fn:<42} | Pages: {num_paginas} (Expected: 1)")
            erros += 1
        elif ocupacao < 65.0:
            print(f"⚠️ [LOW OCCUPANCY] {fn:<40} | Occupancy: {ocupacao:.1f}%")
            alertas += 1
        elif ocupacao > 95.0:
            print(f"⚠️ [HIGH OCCUPANCY] {fn:<39} | Occupancy: {ocupacao:.1f}%")
            alertas += 1
        else:
            print(f"✅ [APPROVED] {fn:<42} | Pages: {num_paginas} | Occupancy: {ocupacao:.1f}%")
            aprovados += 1

    print("=" * 72)
    print(f"Summary: {aprovados} Approved | {alertas} Alerts | {erros} Critical Errors")
    print("=" * 72)
    if erros > 0:
        raise ValueError(f"Audit failed with {erros} multi-page documents!")
    print("🎉 ALL 63 FORMS SUCCESSFULLY AUDITED AND APPROVED!")

if __name__ == "__main__":
    main()
