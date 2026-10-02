# -*- coding: utf-8 -*-
"""b16.py: Scales 32 and 33 (jouvet, katz)"""
import os
from engine_en import FormPDFEngineEN

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\EN"

def run():
    print("Compiling Scales 32 and 33...")
    # 32. Jouvet
    e = FormPDFEngineEN("JOUVET COMA SCALE", "Assessment of Consciousness: Perceptivity and Reactivity", "Perceptivity (P1-P5) & Reactivity (R1-R4)", "Jouvet M. Rev Neurol (Paris), 1969;121(3):187-201.")
    e.add_table_section("1. PERCEPTIVITY (CORTICAL FUNCTION)", [
        (("P1 - Clear Consciousness", "Intact higher cognitive function"), [("Awake, fully oriented in time/place, obeys complex orders", 1)]),
        (("P2 - Obnubilation", "Mild cognitive slowing"), [("Slow responses, difficulty with complex mental tasks, drowsiness", 2)]),
        (("P3 - Stupor / Semicoma", "Marked mental obtundation"), [("Obeys simple commands only (open eyes, stick tongue out)", 3)]),
        (("P4 - Agnosia / Vegetative", "Loss of cortical perception"), [("No comprehension of commands, reflex visual tracking only", 4)]),
        (("P5 - Deep Coma", "Complete loss of perceptivity"), [("Total loss of conscious perception, no response to any command", 5)])
    ])
    e.add_table_section("2. REACTIVITY (SUBCORTICAL / BRAINSTEM)", [
        (("R1 - Normal Reactivity", "Intact non-specific arousal"), [("Normal orienting reflex, spontaneous blinking, withdrawal to pain", 1)]),
        (("R2 - Decreased Reactivity", "Sluggish arousal"), [("Sluggish reactions to auditory or painful stimuli, slow grimace", 2)]),
        (("R3 - Motor Posturing", "Severe brainstem compression"), [("Extensor posturing (decerebrate) or abnormal flexion (decorticate)", 3)]),
        (("R4 - Areactivity", "Brainstem failure"), [("Total absence of motor response to pain, bilateral fixed dilated pupils", 4)])
    ])
    e.set_risk_stratification([
        ("Conscious / Mild Alteration", "P1-P2, R1", "Intact brainstem reflexes, cortical slowing. Regular neuro monitoring.", "green"),
        ("Moderate Impairment / Stupor", "P3-P4, R1-R2", "Depressed consciousness. Protect airway, urgent neuroimaging.", "yellow"),
        ("Deep Coma / Brainstem Failure", "P5, R3-R4", "Severe coma. Mechanical ventilation, invasive ICP monitoring, neurocritical ICU.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_jouvet.pdf"))

    # 33. Katz
    e = FormPDFEngineEN("KATZ INDEX OF INDEPENDENCE IN ADLs", "Assessment of Independence in Six Basic Activities of Daily Living", "6 points (0 to 6)", "Katz S, et al. JAMA, 1963;185(12):914-919.")
    e.add_table_section("SIX CORE ADL DOMAINS", [
        (("1. Bathing", "Personal hygiene"), [("Independent: Bathes self entirely or needs help for single body part", 1), ("Dependent: Needs help with bathing more than one part or unable", 0)]),
        (("2. Dressing", "Selection and donning of clothes"), [("Independent: Gets clothes, dresses self completely (may need ties)", 1), ("Dependent: Needs help with dressing self or stays undressed", 0)]),
        (("3. Toileting", "Toilet use and hygiene"), [("Independent: Goes to toilet, gets on/off, arranges clothes, cleans", 1), ("Dependent: Needs bedpan, commode assist, or help with wiping", 0)]),
        (("4. Transferring", "Bed-chair mobility"), [("Independent: Moves in and out of bed and chair unassisted", 1), ("Dependent: Needs mechanical assist or human help to transfer", 0)]),
        (("5. Continence", "Bladder and bowel control"), [("Independent: Controls urination and bowel movement completely", 1), ("Dependent: Partial or total incontinence of urine or feces", 0)]),
        (("6. Feeding", "Getting food from plate to mouth"), [("Independent: Gets food from plate into mouth (cutting can be done)", 1), ("Dependent: Needs help with feeding or requires enteral/parenteral tube", 0)])
    ])
    e.set_risk_stratification([
        ("High Independence", "6 points", "Full independence in all 6 core ADLs. Minimal or no daily nursing assist required.", "green"),
        ("Moderate Impairment", "3 - 5 points", "Partial dependence. Needs targeted nursing assistance and rehabilitation support.", "yellow"),
        ("Severe Functional Dependence", "0 - 2 points", "Severe disability. Requires total daily nursing care, high skin breakdown and safety risk.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_katz.pdf"))

if __name__ == "__main__":
    run()
