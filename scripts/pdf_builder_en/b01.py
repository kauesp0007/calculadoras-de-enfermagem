# -*- coding: utf-8 -*-
"""b01.py: Scales 1 and 2 (aldrete, apache)"""
import os
from engine_en import FormPDFEngineEN

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\EN"

def run():
    print("Compiling Scales 1 and 2...")
    # 1. Aldrete
    e = FormPDFEngineEN("ALDRETE AND KROULIK SCORE (PACU)", "Post-Anesthesia Recovery Scoring System for Safe Inpatient Discharge", "10 points", "Aldrete JA, Kroulik D. Anesth Analg, 1970;49(6):924-934.")
    e.add_table_section("2. CLINICAL ASSESSMENT CRITERIA", [
        (("1. Motor Activity", "Voluntary or commanded limb movement"), [("Moves 4 extremities voluntarily or on command", 2), ("Moves 2 extremities voluntarily or on command", 1), ("Unable to move extremities voluntarily", 0)]),
        (("2. Respiration", "Ventilatory effort and pattern"), [("Breathes deeply and coughs freely", 2), ("Dyspneic, shallow, or limited breathing", 1), ("Apnea or assisted mechanical ventilation", 0)]),
        (("3. Circulation (BP)", "Blood pressure variation from baseline"), [("BP within ± 20% of preanesthetic level", 2), ("BP within ± 20% - 49% of preanesthetic level", 1), ("BP within ± 50% of preanesthetic level", 0)]),
        (("4. Consciousness", "Sensory awareness and alertness"), [("Fully awake, lucid, oriented in time/place", 2), ("Arousable on calling / somnolent", 1), ("Unresponsive to auditory or tactile stimuli", 0)]),
        (("5. Oxygen Saturation", "Peripheral pulse oximetry"), [("Maintains SpO2 > 92% on room air", 2), ("Requires supplemental O2 to maintain SpO2 > 90%", 1), ("SpO2 < 90% even with supplemental oxygen", 0)])
    ])
    e.set_risk_stratification([
        ("9 to 10 POINTS: Ready for Discharge", "9-10 pts", "Stable physiological conditions for safe transfer to inpatient ward. Surgical site clean and dry.", "green"),
        ("8 POINTS: Continued Observation", "8 pts", "Reassess in 15-30 minutes. Monitor vital signs and maintain supplemental O2 until criteria met.", "yellow"),
        ("< 8 POINTS: Mandatory PACU Stay", "< 8 pts", "Continuous intensive surveillance. Airway support, hemodynamic stabilization, notify anesthesiologist.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_aldrete.pdf"))

    # 2. APACHE II
    e = FormPDFEngineEN("APACHE II SCORE", "Acute Physiology and Chronic Health Evaluation II in ICU", "71 points", "Knaus WA, et al. Crit Care Med, 1985;13(10):818-829.")
    e.layout_mode = "double_col"
    e.extra_css = ".table-eval-col2 td { padding: 9px 8px !important; font-size: 7.6pt !important; } .sec-title { margin: 8px 0 4px !important; } .patient-box { margin-bottom: 8px !important; } .score-box-wrap { margin: 10px 0 !important; }"
    e.add_table_section("1. PHYSIOLOGICAL (PART 1)", [
        ("Core Temp (°C)", [("36.0-38.4", 0), ("34.0-35.9/38.5-38.9", 1), ("32.0-33.9/39.0-40.9", 3), ("<30/≥41", 4)]),
        ("Mean Arterial Pressure", [("70-109 mmHg", 0), ("110-129/50-69", 2), ("130-159", 3), ("≥160/≤49", 4)]),
        ("Heart Rate (bpm)", [("70-109", 0), ("110-139/55-69", 2), ("140-179/40-54", 3), ("≥180/≤39", 4)]),
        ("Respiratory Rate (/min)", [("12-24", 0), ("25-34/10-11", 1), ("35-49/6-9", 3), ("≥50/≤5", 4)]),
        ("Oxygenation (PaO2/FiO2)", [("Normal/PaO2>70", 0), ("PaO2 61-70", 1), ("PaO2 55-60", 3), ("PaO2<55", 4)]),
        ("Arterial pH", [("7.33-7.49", 0), ("7.50-7.59", 1), ("7.25-7.32", 2), ("<7.15/≥7.70", 4)])
    ])
    e.add_table_section("2. PHYSIOLOGICAL (PART 2) & AGE", [
        ("Serum Sodium (mEq/L)", [("130-149", 0), ("150-154", 1), ("155-159/120-129", 2), ("≥180/≤110", 4)]),
        ("Serum Potassium (mEq/L)", [("3.5-5.4", 0), ("5.5-5.9/3.0-3.4", 1), ("6.0-6.9/2.5-2.9", 2), ("≥7.0/<2.5", 4)]),
        ("Serum Creatinine (mg/dL)", [("0.6-1.4", 0), ("1.5-1.9", 2), ("2.0-3.4", 3), ("≥3.5", 4)]),
        ("Hematocrit (%)", [("30.0-45.9", 0), ("46.0-49.9", 1), ("50.0-59.9/20.0-29.9", 2), ("≥60/<20", 4)]),
        ("WBC Count (/mm³)", [("3.0-14.9k", 0), ("15.0-19.9k", 1), ("20.0-39.9k/1.0-2.9k", 2), ("≥40k/<1k", 4)]),
        ("Age Score", [("<44 yrs", 0), ("45-54 yrs", 2), ("55-64 yrs", 3), ("65-74 yrs", 5), ("≥75 yrs", 6)])
    ])
    e.set_risk_stratification([
        ("Low Risk", "0-14 pts", "Predicted ICU mortality < 15%. Standard ICU care protocol.", "green"),
        ("Moderate Risk", "15-24 pts", "Predicted mortality 25-40%. Invasive monitoring and organ support.", "yellow"),
        ("Severe Risk", "≥ 25 pts", "Predicted mortality > 50%. Advanced critical care and resuscitation.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_apache.pdf"))

if __name__ == "__main__":
    run()

