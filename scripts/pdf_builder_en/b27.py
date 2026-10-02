# -*- coding: utf-8 -*-
"""b27.py: Scales 56 and 57 (silverman, sistema_sinbad)"""
import os
from engine_en import FormPDFEngineEN

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\EN"

def run():
    print("Compiling Scales 56 and 57...")
    # 56. Silverman-Andersen
    e = FormPDFEngineEN("SILVERMAN-ANDERSEN RETRACTION SCORE", "Assessment of Respiratory Distress in Newborns and Preterm Infants", "10 points (0 to 10)", "Silverman WA, Andersen DH. Pediatrics, 1956;17(1):1-10.")
    e.add_table_section("FIVE OBSERVATIONAL RESPIRATORY CRITERIA", [
        (("1. Upper Chest", "Thoracoabdominal respiratory synchrony"), [("Synchronized: Chest and abdomen rise together", 0), ("Lag on inspiration: Chest lag, abdomen rises", 1), ("Seesaw: Complete seesaw paradox movement", 2)]),
        (("2. Lower Chest", "Intercostal retractions"), [("None: No intercostal retractions visible", 0), ("Mild: Just visible lower intercostal retractions", 1), ("Marked: Deep prominent intercostal indrawing", 2)]),
        (("3. Xiphoid Retraction", "Substernal indrawing"), [("None: No substernal indrawing", 0), ("Mild: Barely visible subxiphoid retraction", 1), ("Marked: Marked deep xiphoid retraction", 2)]),
        (("4. Nares Dilation", "Nasal flaring"), [("None: Normal quiet nasal breathing", 0), ("Mild: Minimal transient nasal flaring", 1), ("Marked: Marked continuous flaring of nostrils", 2)]),
        (("5. Expiratory Grunt", "Audible respiratory noise"), [("None: No grunt audible", 0), ("Audible with stethoscope only", 1), ("Audible with naked ear without stethoscope", 2)])
    ])
    e.set_risk_stratification([
        ("No Respiratory Distress", "0 points", "Normal neonatal breathing pattern. Routine thermal and respiratory surveillance.", "green"),
        ("Mild Respiratory Distress", "1 - 3 points", "Supplemental humidified oxygen, CPAP consideration, aspirate secretions.", "yellow"),
        ("Moderate Distress", "4 - 6 points", "Nasal CPAP / High Flow nasal cannula, blood gas analysis, chest X-ray.", "orange"),
        ("Severe Respiratory Failure", "7 - 10 points", "Imminent respiratory failure. Urgent endotracheal intubation, mechanical ventilation, NICU.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_silverman.pdf"))

    # 57. SINBAD
    e = FormPDFEngineEN("SINBAD SYSTEM FOR DIABETIC FOOT ULCERS", "Classification System for Diabetic Foot Ulcer Severity and Healing Prediction", "6 points (0 to 6)", "Ince P, et al. Diabetes Care, 2008;31(5):969-973.")
    e.add_table_section("SIX CLINICAL CHARACTERISTICS (1 PT EACH)", [
        (("S - Site", "Anatomical location on foot"), [("Forefoot ulcer", 0), ("Midfoot or Hindfoot (heel) ulcer", 1)]),
        (("I - Ischemia", "Pedal arterial perfusion"), [("Intact pedal pulses (dorsalis pedis / posterior tibial)", 0), ("Reduced / Absent pedal pulses or clinical ischemia", 1)]),
        (("N - Neuropathy", "Protective sensory threshold"), [("Intact protective sensation (10g Semmes-Weinstein monofilament)", 0), ("Loss of protective sensation (sensory neuropathy)", 1)]),
        (("B - Bacterial Infection", "Infectious signs and cellulitis"), [("Uninfected wound", 0), ("Clinical signs of infection (purulence, cellulitis >2cm, osteitis)", 1)]),
        (("A - Area", "Wound surface measurement"), [("Ulcer surface area < 1 cm²", 0), ("Ulcer surface area ≥ 1 cm²", 1)]),
        (("D - Depth", "Tissue depth penetration"), [("Ulcer confined to skin and subcutaneous tissue", 0), ("Deep ulcer reaching muscle, tendon, joint capsule, or bone", 1)])
    ])
    e.set_risk_stratification([
        ("Low Severity / High Healing", "0 - 2 points", "Wound care, offloading footwear, strict glycemic control. Favorable healing.", "green"),
        ("Moderate Ulcer Severity", "3 - 4 points", "Specialized wound care team, culture-directed antibiotics, vascular non-invasive studies.", "yellow"),
        ("Severe Ulcer / Amputation Risk", "5 - 6 points", "High risk of major amputation. Urgent vascular consult, surgical debridement, IV antibiotics.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_sistema_sinbad.pdf"))

if __name__ == "__main__":
    run()
