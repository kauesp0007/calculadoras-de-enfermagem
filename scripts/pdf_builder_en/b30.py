# -*- coding: utf-8 -*-
"""b30.py: Scales 62 and 63 (downes, manchester)"""
import os
from engine_en import FormPDFEngineEN

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\EN"

def run():
    print("Compiling Scales 62 and 63...")
    # 62. Wood-Downes
    e = FormPDFEngineEN("WOOD-DOWNES RESPIRATORY DISTRESS SCORE", "Assessment of Acute Bronchiolitis and Asthma Severity in Pediatric Patients", "14 points (0 to 14)", "Downes JJ, et al. Clin Pediatr (Phila), 1972;11(10):567-570.")
    e.add_table_section("SIX CLINICAL RESPIRATORY PARAMETERS", [
        (("1. Wheezing / Airway Sound", "Auscultatory findings"), [("None", 0), ("Terminal expiratory with stethoscope", 1), ("Entire expiration with stethoscope", 2), ("Inspiratory & expiratory without stethoscope", 3)]),
        (("2. Retractions / Indrawing", "Accessory muscle use"), [("None", 0), ("Subcostal / Intercostal mild", 1), ("Intercostal + Suprasternal moderate", 2), ("Severe intercostal + Suprasternal + Flaring", 3)]),
        (("3. Respiratory Rate (RR)", "Breaths per minute"), [("< 30 bpm", 0), ("31 - 45 bpm", 1), ("46 - 60 bpm", 2), ("> 60 bpm", 3)]),
        (("4. Heart Rate (HR)", "Beats per minute"), [("< 100 bpm", 0), ("100 - 120 bpm", 1), ("121 - 140 bpm", 2), ("> 140 bpm", 3)]),
        (("5. Ventilation / Air Entry", "Bilateral breath sounds"), [("Good / Bilaterally symmetrical", 0), ("Regular / Mild symmetric reduction", 1), ("Very poor / Marked symmetric reduction", 2), ("Silent chest / Barely audible air entry", 3)]),
        (("6. Cyanosis", "Color and oxygenation"), [("None (SpO2 > 95% on room air)", 0), ("Mild / Perioral on crying", 1), ("Central cyanosis breathing room air", 2), ("Central cyanosis breathing 40% O2", 3)])
    ])
    e.set_risk_stratification([
        ("Mild Bronchiolitis / Distress", "1 - 3 points", "Outpatient / Ward observation. Saline drops, fractionated feeding, monitor SpO2.", "green"),
        ("Moderate Respiratory Distress", "4 - 7 points", "Inpatient admission. Humidified low-flow/high-flow O2, nebulized therapy, IV hydration.", "yellow"),
        ("Severe Imminent Failure", "≥ 8 points", "PICU transfer, high-flow nasal cannula (HFNC) / non-invasive CPAP / endotracheal intubation.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_downes.pdf"))

    # 63. Manchester Triage System
    e = FormPDFEngineEN("MANCHESTER TRIAGE SYSTEM (MTS)", "Standardized Emergency Department Clinical Risk Stratification Protocol", "Five Priority Categories (Red to Blue)", "Mackway-Jones K, et al. Emergency Triage, BMJ Books, 2014.")
    e.add_table_section("FIVE CLINICAL PRIORITY CATEGORIES & GENERAL DISCRIMINATORS", [
        (("RED: Immediate Priority (Target: 0 min)", "Life-threatening emergencies"), [("Life-threat: Airway compromise, inadequate breathing, absent pulse, active convulsion, shock, unresponsive child", 1)]),
        (("ORANGE: Very Urgent (Target: 10 min)", "High-risk presentations"), [("High risk: Severe pain, altered consciousness, acute neurological deficit, high fever in neonate, major hemorrhage", 2)]),
        (("YELLOW: Urgent (Target: 60 min)", "Moderate risk conditions"), [("Moderate risk: Moderate pain, minor hemorrhage, history of seizure, uncontrolled vomiting, persistent tachycardia", 3)]),
        (("GREEN: Standard (Target: 120 min)", "Semi-urgent conditions"), [("Mild condition: Mild pain, minor trauma, localized rash without fever, chronic complaint without acute worsening", 4)]),
        (("BLUE: Non-Urgent (Target: 240 min)", "Low-acuity / routine presentation"), [("Routine / Non-urgent: Suture removal, repeat prescription, chronic stable complaint with no acute discriminators", 5)])
    ])
    e.set_risk_stratification([
        ("RED - IMMEDIATE (0 MIN)", "Immediate Resuscitation", "Immediate resuscitation room transfer, medical emergency team activation, ABCDE stabilization.", "red"),
        ("ORANGE - VERY URGENT (10 MIN)", "Very Urgent Assessment", "Rapid medical review within 10 min, continuous vital signs monitoring, venous access.", "orange"),
        ("YELLOW - URGENT (60 MIN)", "Urgent Clinical Review", "Medical evaluation within 60 min, initial nursing interventions, pain relief, re-triage if delay.", "yellow"),
        ("GREEN / BLUE - STANDARD (120-240 MIN)", "Non-Urgent Assessment", "Waiting room care, regular nursing surveillance, re-triage if clinical status changes.", "green")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_manchester.pdf"))

if __name__ == "__main__":
    run()
