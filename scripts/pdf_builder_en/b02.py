# -*- coding: utf-8 -*-
"""b02.py: Scales 3 and 4 (apgar, asa)"""
import os
from engine_en import FormPDFEngineEN

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\EN"

def run():
    print("Compiling Scales 3 and 4...")
    # 3. Apgar
    e = FormPDFEngineEN("APGAR SCORE", "Assessment of Newborn Vitality and Extrauterine Adaptation", "10 points", "Apgar V. Anesth Analg, 1953;32(4):260-267.")
    e.add_table_section("APGAR PARAMETERS AT 1 AND 5 MINUTES", [
        (("1. Heart Rate (Pulse)", "Auscultate apex with stethoscope"), [("Absent", 0), ("< 100 beats per minute", 1), ("≥ 100 beats per minute", 2)]),
        (("2. Respiratory Effort", "Rate, depth, and crying effort"), [("Absent (apnea)", 0), ("Slow, irregular, weak cry", 1), ("Good breathing, vigorous lusty cry", 2)]),
        (("3. Muscle Tone (Activity)", "Flexion and spontaneous motion"), [("Flaccid, limp, no movement", 0), ("Some flexion of extremities", 1), ("Active motion, well flexed limbs", 2)]),
        (("4. Reflex Irritability", "Response to suctioning or tactile stimulus"), [("No response to stimulation", 0), ("Grimace, feeble cry, minor avoidance", 1), ("Cough, sneeze, vigorous withdrawal, cry", 2)]),
        (("5. Skin Color (Appearance)", "Peripheral and central oxygenation"), [("Blue-gray, pale, cyanotic all over", 0), ("Pink body with blue extremities (acrocyanosis)", 1), ("Completely pink, normal color", 2)])
    ])
    e.set_risk_stratification([
        ("Normal / Vigorous", "8-10 pts", "Routine delivery room care, skin-to-skin contact, early breastfeeding support.", "green"),
        ("Moderate Depression", "4-7 pts", "Tactile stimulation, airway clearing, supplemental O2 / positive pressure ventilation (PPV).", "yellow"),
        ("Severe Asphyxia", "0-3 pts", "Immediate neonatal resuscitation protocol, PPV, chest compressions, NICU team activation.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_apgar.pdf"))

    # 4. ASA
    e = FormPDFEngineEN("ASA PHYSICAL STATUS CLASSIFICATION", "Preoperative Physical Status and Anesthetic Risk Assessment", "Class VI (plus E)", "American Society of Anesthesiologists (ASA), 2020.")
    e.add_table_section("ASA PHYSICAL STATUS CLASSIFICATION CRITERIA", [
        (("ASA I", "Healthy Individual"), [("Normal healthy patient, non-smoker, minimal alcohol use", 1)]),
        (("ASA II", "Mild Systemic Disease"), [("Mild systemic disease without substantive functional limitations (mild DM, well-controlled HTN)", 2)]),
        (("ASA III", "Severe Systemic Disease"), [("Severe systemic disease with substantive functional limitations (poorly controlled DM, morbid obesity, ESRD)", 3)]),
        (("ASA IV", "Life-Threatening Disease"), [("Severe systemic disease that is a constant threat to life (recent MI/stroke <3 mo, ongoing ischemia)", 4)]),
        (("ASA V", "Moribund Patient"), [("Moribund patient not expected to survive without operation (ruptured aneurysm, massive trauma)", 5)]),
        (("ASA VI", "Brain-Dead Organ Donor"), [("Declared brain-dead patient whose organs are being removed for donor purposes", 6)]),
        (("Emergency Suffix (E)", "Emergency Procedure"), [("Emergency operation when delay significantly increases threat to life or limb (e.g. ASA III-E)", 0)])
    ])
    e.set_risk_stratification([
        ("Low Risk", "ASA I - II", "Standard perioperative care, routine pre-anesthesia evaluation.", "green"),
        ("Elevated Risk", "ASA III", "Preoperative optimization, specialized intraoperative hemodynamic monitoring.", "yellow"),
        ("Extreme Risk", "ASA IV - V", "Intensive resuscitation, arterial line/CVC, reserved ICU bed.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_asa.pdf"))

if __name__ == "__main__":
    run()
