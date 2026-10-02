# -*- coding: utf-8 -*-
"""b20a.py: Scales 40 and 41 (morse, news)"""
import os
from engine_en import FormPDFEngineEN

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\EN"

def run():
    print("Compiling Scales 40 and 41...")
    # 40. Morse Fall Scale
    e = FormPDFEngineEN("MORSE FALL SCALE (MFS)", "Rapid Inpatient Fall Risk Assessment and Clinical Action Plan", "125 points", "Morse JM, et al. Res Nurs Health, 1989;12(4):245-252.")
    e.add_table_section("SIX CLINICAL RISK VARIABLES", [
        (("1. History of Falling", "Previous fall event"), [("No: No fall in past 3 months", 0), ("Yes: Has fallen during present admission or in past 3 months", 25)]),
        (("2. Secondary Diagnosis", "Active coexisting diagnoses"), [("No: Only one medical diagnosis on chart", 0), ("Yes: Two or more active medical diagnoses", 15)]),
        (("3. Ambulatory Aid", "Walking assistance requirements"), [("None / Bed rest / Nurse assistance", 0), ("Crutches / Cane / Walker", 15), ("Furniture (holding on to walls, tables, chairs)", 30)]),
        (("4. IV Therapy / Heparin Lock", "Lines tethering patient"), [("No: No IV line, saline lock, or heparin lock", 0), ("Yes: Has IV infusion, saline lock, or heparin lock", 20)]),
        (("5. Gait / Transferring", "Walking stride and balance"), [("Normal / Bed rest / Immobile (wheels autonomously)", 0), ("Weak (stooped, small steps, hesitancy)", 10), ("Impaired (difficulty rising, uncoordinated, short steps)", 20)]),
        (("6. Mental Status", "Self-awareness of limitations"), [("Oriented to own ability (realistic about limits)", 0), ("Overestimates ability / Forgets limitations", 15)])
    ])
    e.set_risk_stratification([
        ("No / Low Fall Risk", "0 - 24 points", "Basic nursing care, bed in lowest position, call light within reach, safe footwear.", "green"),
        ("Moderate Fall Risk", "25 - 50 points", "Standard fall prevention protocol: yellow armband, assist toileting, evaluate meds.", "yellow"),
        ("High Fall Risk", "≥ 51 points", "High-risk protocol: bed/chair alarm, 1:1 supervision during transfer, frequent rounding q1h.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_morse.pdf"))

    # 41. NEWS 2
    e = FormPDFEngineEN("NATIONAL EARLY WARNING SCORE 2 (NEWS 2)", "Standardized Assessment of Acute Illness Severity in Adult Patients", "20 points (0 to 20)", "Royal College of Physicians. NEWS 2, London: RCP, 2017.")
    e.add_table_section("SEVEN PHYSIOLOGICAL PARAMETERS", [
        (("1. Respiration Rate", "Breaths/min"), [("12 - 20 (0)", 0), ("9 - 11 (1)", 1), ("21 - 24 (2)", 2), ("≤8 or ≥25 (3)", 3)]),
        (("2. SpO2 Scale 1", "Room air pulse oximetry"), [("≥ 96% (0)", 0), ("94 - 95% (1)", 1), ("92 - 93% (2)", 2), ("≤ 91% (3)", 3)]),
        (("3. SpO2 Scale 2", "Hypercapnic respiratory failure"), [("88 - 92% or ≥93 air (0)", 0), ("86 - 87% (1)", 1), ("84 - 85% (2)", 2), ("≤ 83% (3)", 3)]),
        (("4. Supplemental O2", "Oxygen administration"), [("Room air: No (0)", 0), ("Supplemental O2: Yes (2)", 2)]),
        (("5. Systolic BP", "Hemodynamics (mmHg)"), [("111 - 219 (0)", 0), ("101 - 110 (1)", 1), ("91 - 100 (2)", 2), ("≤90 or ≥220 (3)", 3)]),
        (("6. Pulse Rate", "Beats/min"), [("51 - 90 (0)", 0), ("41 - 50 or 91 - 110 (1)", 1), ("111 - 130 (2)", 2), ("≤40 or ≥131 (3)", 3)]),
        (("7. Consciousness", "ACVPU score"), [("Alert (0)", 0), ("New Confusion (3)", 3), ("Voice (3)", 3), ("Pain (3)", 3), ("Unresponsive (3)", 3)])
    ])
    e.set_risk_stratification([
        ("Low Risk", "0 - 4 points", "Ward-based response. Continue routine observations q4-6h.", "green"),
        ("Low-Medium Risk", "Single score 3", "Urgent ward nurse review, inform medical team, increase monitoring q1h.", "yellow"),
        ("Medium Clinical Risk", "5 - 6 points", "Urgent review by clinician with acute care competencies, prepare for escalation.", "orange"),
        ("High Clinical Risk", "≥ 7 points", "Emergency response: Immediate Medical Emergency Team (MET) / ICU outreach.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_news.pdf"))

if __name__ == "__main__":
    run()
