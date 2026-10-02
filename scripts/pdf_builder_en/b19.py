# -*- coding: utf-8 -*-
"""b19.py: Scale 39 (moca) with full SVG stimuli and strict alignment"""
import os
from engine_en import FormPDFEngineEN
from moca_svg import VIS_HTML, NAMING_HTML

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\EN"

def run():
    print("Compiling Scale 39: MoCA with SVG graphics...")
    e = FormPDFEngineEN("MONTREAL COGNITIVE ASSESSMENT (MoCA)", "Rapid Screening Tool for Mild Cognitive Impairment and Dementia", "30 points", "Nasreddine ZS, et al. J Am Geriatr Soc, 2005;53(4):695-699.")
    
    e.add_raw_html_section(VIS_HTML)
    e.add_raw_html_section(NAMING_HTML)

    e.add_table_section("3. MEMORY & ATTENTION (REGISTRATION & 6 POINTS)", [
        ("Memory (Read 5 words, 2 trials)", [("Face [ ] Velvet [ ] Church [ ] Daisy [ ] Red [ ]", 0)]),
        ("Digits Forward & Backward", [("Forward (2-1-8-5-4) [ ] (1 pt) | Backward (7-4-2) [ ] (1 pt)", 2)]),
        ("Vigilance (Tap hand at letter 'A')", [("FBACMNAAJKLBAFAWDA (1 pt if ≤1 error) [ ]", 1)]),
        ("Serial 7 Subtraction (from 100)", [("4-5 correct (3 pts) | 2-3 correct (2 pts) | 1 correct (1 pt) [ ]", 3)])
    ])

    e.add_table_section("4. LANGUAGE, ABSTRACTION, DELAYED RECALL & ORIENTATION (16 POINTS)", [
        ("Sentence Repetition", [("2 complex sentences repeated exactly [ ]", 2)]),
        ("Verbal Fluency (Letter 'F')", [("≥ 11 words in 60 seconds [ ]", 1)]),
        ("Abstraction (Category)", [("Train-Bicycle [ ] | Watch-Ruler [ ]", 2)]),
        ("Delayed Recall (5 Words)", [("Face [ ] Velvet [ ] Church [ ] Daisy [ ] Red [ ] (1 pt each)", 5)]),
        ("Orientation (Time & Place)", [("Date [ ] Month [ ] Year [ ] Day [ ] Place [ ] City [ ] (1 pt each)", 6)])
    ])

    e.set_risk_stratification([
        ("Normal Cognition", "26 - 30 points", "Normal cognitive profile (add 1 pt if ≤12 years formal education, max 30).", "green"),
        ("Mild Cognitive Impairment", "18 - 25 points", "High sensitivity for early MCI. Comprehensive neurocognitive workup.", "yellow"),
        ("Moderate Impairment", "10 - 17 points", "Significant cognitive deficit. Safety surveillance, caregiver support.", "orange"),
        ("Severe Impairment", "< 10 points", "Severe dementia. Total functional dependence, 24-hour care.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_moca.pdf"))

if __name__ == "__main__":
    run()
