# -*- coding: utf-8 -*-
"""b21.py: Scales 44 and 45 (norton, ofras)"""
import os
from engine_en import FormPDFEngineEN

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\EN"

def run():
    print("Compiling Scales 44 and 45...")
    # 44. Norton
    e = FormPDFEngineEN("NORTON SCALE FOR PRESSURE SORE RISK", "Assessment of Pressure Ulcer Susceptibility in Hospitalized Patients", "20 points (5 to 20)", "Norton D, McLaren R, Exton-Smith AN. London: NCME, 1962.")
    e.add_table_section("FIVE CLINICAL PARAMETERS", [
        (("1. Physical Condition", "General physical health status"), [("Good: Alert, active, robust appearance", 4), ("Fair: Chronically ill, frail", 3), ("Poor: Weak, impaired nutrition, bed-confined", 2), ("Very bad: Critically ill, moribund", 1)]),
        (("2. Mental Condition", "Cognitive orientation and alertness"), [("Alert: Fully oriented, lucid, responsive", 4), ("Apathetic: Passive, low initiative", 3), ("Confused: Disoriented, wandering, impulsive", 2), ("Stuporous: Barely responsive, comatose", 1)]),
        (("3. Activity", "Daily functional ambulation"), [("Ambulant: Walks independently without aid", 4), ("Walks with help: Needs assistance or cane/walker", 3), ("Chairbound: Sits in wheelchair/chair all day", 2), ("Bedbound: Confined to bed 24 hours", 1)]),
        (("4. Mobility", "Ability to change position in bed"), [("Full: Changes posture independently in bed", 4), ("Slightly limited: Controls body position with effort", 3), ("Very limited: Needs assistance to change position", 2), ("Immobile: Completely unable to move body", 1)]),
        (("5. Incontinence", "Sphincter control and skin exposure"), [("None: Fully continent of urine and stool", 4), ("Occasional: Incontinent 1-2 times in 24 hours", 3), ("Usually urinary: Incontinent of urine regularly", 2), ("Doubly: Incontinent of both urine and feces", 1)])
    ])
    e.set_risk_stratification([
        ("Low Risk", "17 - 20 points", "Universal preventive measures: skin hydration, encourage mobility, clean skin.", "green"),
        ("Moderate Risk", "15 - 16 points", "Repositioning schedule q3h, static foam mattress, barrier skin protectants.", "yellow"),
        ("High Risk of Ulcer", "≤ 14 points", "Dynamic alternating air mattress, q2h turning protocol, heel elevation.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_norton.pdf"))

    # 45. OFRAS
    e = FormPDFEngineEN("ONTARIO FEMALE RISK ASSESSMENT SCALE (OFRAS)", "Obstetric Fall Risk Assessment Tool in Antepartum and Postpartum Care", "10 points (Risk if ≥ 3)", "Ontario Hospital Association, 2012.")
    e.add_table_section("SIX MATERNAL RISK DOMAINS", [
        (("1. History of Falls", "Falls during pregnancy or previous year"), [("No falls during pregnancy or past 12 months", 0), ("History of fall during current pregnancy", 2)]),
        (("2. Mobility & Gait Impairment", "Balance and ambulatory stability"), [("Normal, steady independent gait", 0), ("Uses assistive device or steadying on furniture", 1), ("Impaired balance, weak, unsteady gait", 2)]),
        (("3. Medications & Anesthesia", "Administered sedating drugs / blocks"), [("No sedating meds / No anesthesia", 0), ("Epidural / Spinal anesthesia within past 12 hours", 2), ("Magnesium sulfate, opioids, or sedatives within past 24 hours", 2)]),
        (("4. Elimination Needs", "Urinary frequency and urgency"), [("Independent, normal continent urination", 0), ("Frequency, urgency, or urinary retention needing assistance", 1)]),
        (("5. Mental & Sensory Status", "Alertness and dizziness"), [("Alert, oriented, cooperative", 0), ("Dizziness, orthostatic hypotension, or blurred vision", 1), ("Sedated, confused, or non-compliant with safety instructions", 2)]),
        (("6. Fluid Balance & Blood Loss", "Hemodynamic impact of delivery"), [("Normal postpartum / antepartum status", 0), ("Postpartum hemorrhage / Symptomatic anemia (Hb < 8 g/dL)", 1)])
    ])
    e.set_risk_stratification([
        ("Low Obstetric Fall Risk", "0 - 2 points", "Standard postpartum safety precautions, call bell within reach, bed in lowest position.", "green"),
        ("High Obstetric Fall Risk", "≥ 3 points", "Fall alert sign, assist on first 3 ambulations, mandatory assist for bathroom transfers.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_ofras.pdf"))

if __name__ == "__main__":
    run()
