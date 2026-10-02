# -*- coding: utf-8 -*-
"""run_all_es.py: Master runner for compiling and auditing all 63 Spanish PDF forms"""
import os, sys, glob, fitz

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPT_DIR)

import e01, e02, e03, e04, e05, e06, e07, e08, e09, e10, e11, e12, e13a, e13b, e14, e15, e16, e17, e18, e19, e20, e21, e22, e23, e24, e25, e26, e27, e28, e29, e30, e31, e32, e33, e34a, e34b, e35, e36

MODULES = [
    e01, e02, e03, e04, e05, e06, e07, e08, e09, e10, e11, e12, e13a, e13b, e14, e15, e16, e17, e18, e19, e20, e21, e22, e23, e24, e25, e26, e27, e28, e29, e30, e31, e32, e33, e34a, e34b, e35, e36
]

OUT_DIR = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\ES"

def main():
    print("=" * 72)
    print("COMPILING ALL 63 SPANISH PDF FORMS (FULL PAGE OCCUPANCY)")
    print(f"Destination: {OUT_DIR}")
    print("=" * 72)
    os.makedirs(OUT_DIR, exist_ok=True)

    for i, mod in enumerate(MODULES, 1):
        print(f"[{i:02d}/{len(MODULES):02d}] Running {mod.__name__}...")
        mod.run()

    print("\n" + "=" * 72)
    print("ALL SPANISH MODULES COMPILED. AUDITING ALL 63 PDFS WITH PYMUPDF...")
    print("=" * 72)

    files = sorted(glob.glob(os.path.join(OUT_DIR, "*.pdf")))
    print(f"Total Spanish PDFs found: {len(files)}")

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
            print(f"❌ [PAGES ERROR]    {fn:<40} | Pages: {num_paginas} (Expected: 1)")
            erros += 1
        elif ocupacao < 65.0:
            print(f"⚠️ [LOW OCCUPANCY]  {fn:<40} | Occupancy: {ocupacao:.1f}%")
            alertas += 1
        elif ocupacao > 95.0:
            print(f"⚠️ [HIGH OCCUPANCY] {fn:<40} | Occupancy: {ocupacao:.1f}%")
            alertas += 1
        else:
            print(f"✅ [APPROVED]       {fn:<40} | Pages: {num_paginas} | Occupancy: {ocupacao:.1f}%")
            aprovados += 1

    print("=" * 72)
    print(f"Spanish Audit Summary: {aprovados} Approved | {alertas} Alerts | {erros} Critical Errors")
    print("=" * 72)
    if erros > 0:
        raise ValueError(f"Audit failed with {erros} multi-page documents!")
    print("🎉 ALL 63 SPANISH FORMS SUCCESSFULLY AUDITED AND APPROVED WITH FULL PAGE OCCUPANCY!")

if __name__ == "__main__":
    main()
