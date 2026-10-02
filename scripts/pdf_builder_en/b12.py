# -*- coding: utf-8 -*-
"""b12.py: Scales 24 and 25 (four, glasgow)"""
import os
from engine_en import FormPDFEngineEN

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\EN"

def run():
    print("Compiling Scales 24 and 25...")
    # 24. FOUR Score
    e = FormPDFEngineEN("FOUR SCORE (COMA SCALE)", "Full Outline of UnResponsiveness Coma Assessment in ICU", "16 points (0 to 16)", "Wijdicks EF, et al. Ann Neurol, 2005;58(4):585-593.")
    e.add_table_section("FOUR CLINICAL DOMAINS", [
        (("1. Eye Response (E)", "Eyelid opening and tracking"), [("Eyelids open/tracked", 4), ("Eyelids open to loud voice", 3), ("Eyelids open to pain", 2), ("Eyelids closed to pain", 1), ("No response to pain", 0)]),
        (("2. Motor Response (M)", "Command following and posturing"), [("Thumbs-up, fist, peace sign", 4), ("Localizing to pain", 3), ("Flexion response to pain", 2), ("Extensor posturing", 1), ("No response / Myoclonus", 0)]),
        (("3. Brainstem Reflexes (B)", "Pupillary and corneal integrity"), [("Pupil and corneal reflexes present", 4), ("One pupil wide and fixed", 3), ("Pupil or corneal absent", 2), ("Both absent", 1), ("Absent pupil, corneal, cough", 0)]),
        (("4. Respiration (R)", "Ventilatory drive and pattern"), [("Regular breathing pattern", 4), ("Cheyne-Stokes breathing", 3), ("Breathes above vent rate", 2), ("Breathes at vent rate", 1), ("Apnea / On ventilator", 0)])
    ])
    e.set_risk_stratification([
        ("Mild Impairment", "13 - 16 points", "Favorable prognosis, high likelihood of consciousness recovery.", "green"),
        ("Moderate Impairment", "9 - 12 points", "Close neurological surveillance in ICU, protect airway.", "yellow"),
        ("Severe Coma", "≤ 8 points", "Severe brain injury, high mortality risk. Intubation, neurocritical care.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_four.pdf"))

    # 25. Glasgow Coma Scale (GCS-P)
    e = FormPDFEngineEN("GLASGOW COMA SCALE (GCS-P)", "Comprehensive Neurological Assessment with Pupil Reactivity", "1 to 15 (GCS) - Pupils (0 to -2)", "Teasdale G, Jennett B. Lancet, 1974; Brennan PM, et al. J Neurosurg, 2018.")
    e.layout_mode = "double_col"
    e.extra_css = ".table-eval-col2 td { padding: 4px 6px !important; font-size: 7.2pt !important; } .sec-title { margin: 5px 0 2px !important; }"
    e.add_table_section("1. EYE OPENING (E)", [
        ("Spontaneous", [("Open before stimulus", 4)]),
        ("To Sound", [("Open on sound / spoken request", 3)]),
        ("To Pressure", [("Open on fingertip pressure", 2)]),
        ("None", [("No opening to any stimulus", 1)]),
        ("Not Testable", [("Closed by swelling or trauma", 0)])
    ])
    e.add_table_section("2. VERBAL RESPONSE (V)", [
        ("Oriented", [("Correct name, place, date", 5)]),
        ("Confused", [("Converses but disoriented", 4)]),
        ("Inappropriate", [("Random words, no dialogue", 3)]),
        ("Incomprehensible", [("Moans, groans only", 2)]),
        ("None", [("No vocalization", 1)]),
        ("Not Testable", [("Intubated / Tracheostomy", 0)])
    ])
    e.add_table_section("3. MOTOR RESPONSE (M)", [
        ("Obeys Commands", [("Follows 2-step requests", 6)]),
        ("Localizes", [("Brings hand above clavicle", 5)]),
        ("Normal Flexion", [("Rapid withdrawal", 4)]),
        ("Abnormal Flexion", [("Slow decorticate posture", 3)]),
        ("Extension", [("Decerebrate posture", 2)]),
        ("None", [("No movement", 1)])
    ])
    e.add_table_section("4. PUPIL REACTIVITY (PRS)", [
        ("Both Pupils React", [("Score = 0", 0)]),
        ("One Pupil Reacts", [("Score = -1", -1)]),
        ("Neither Pupil Reacts", [("Score = -2", -2)])
    ])
    e.add_raw_html_section('''
    <div class="visual-box" style="margin-top:4px; font-size:7.2pt; line-height:1.28; text-align:left;">
        <b>Standard Assessment Method:</b> Check (factors interfering: drugs, shock) ➔ Observe (spontaneous) ➔ 
        Stimulate (sound first, then pressure: trapezius or supraorbital) ➔ Rate best response. <b>GCS-P = GCS - PRS</b>.
    </div>
    ''')
    e.set_risk_stratification([
        ("Mild TBI", "13 - 15 points", "Observe for neurological deterioration, neuro checks q1h.", "green"),
        ("Moderate TBI", "9 - 12 points", "Urgent head CT, neurosurgical consultation, ICU admission.", "yellow"),
        ("Severe TBI", "≤ 8 points", "Definitive airway (endotracheal intubation), ICP management.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_glasgow.pdf"))

if __name__ == "__main__":
    run()
