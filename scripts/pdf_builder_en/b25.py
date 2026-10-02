# -*- coding: utf-8 -*-
"""b25.py: Scales 52 and 53 (ramsay, rancholosamigos)"""
import os
from engine_en import FormPDFEngineEN

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\EN"

def run():
    print("Compiling Scales 52 and 53...")
    # 52. Ramsay
    e = FormPDFEngineEN("RAMSAY SEDATION SCALE", "Assessment of Sedation Depth and Responsiveness in Critical Care", "6 points (Levels 1 to 6)", "Ramsay MA, et al. BMJ, 1974;2(5920):656-659.")
    e.add_table_section("SIX CLINICAL SEDATION LEVELS", [
        (("Level 1 (Anxious / Agitated)", "Inadequate sedation"), [("Patient anxious, agitated, or restless, or both", 1)]),
        (("Level 2 (Cooperative / Calm)", "Target sedation"), [("Patient cooperative, oriented, and tranquil", 2)]),
        (("Level 3 (Responds to Verbal Only)", "Light sedation"), [("Patient responds to verbal commands only", 3)]),
        (("Level 4 (Brisk Response to Stimulus)", "Moderate sedation"), [("Brisk response to light glabellar tap or loud auditory stimulus", 4)]),
        (("Level 5 (Sluggish Response)", "Deep sedation"), [("Sluggish response to light glabellar tap or loud auditory stimulus", 5)]),
        (("Level 6 (Unresponsive)", "Extreme / Over-sedation"), [("No response to glabellar tap or loud auditory stimulus", 6)])
    ])
    e.set_risk_stratification([
        ("Under-Sedated", "Level 1", "Risk of unplanned extubation, agitation. Optimize analgesia/sedation.", "yellow"),
        ("Optimal Sedation", "Levels 2 - 3", "Target for awake, non-intubated or ventilating patients. Calm, cooperative.", "green"),
        ("Moderate Sedation", "Level 4", "Acceptable during acute synchronization with mechanical ventilation.", "green"),
        ("Deep Sedation", "Levels 5 - 6", "Risk of prolonged ventilation, ICU weakness. Plan daily sedation interruption.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_ramsay.pdf"))

    # 53. Rancho Los Amigos
    e = FormPDFEngineEN("RANCHO LOS AMIGOS LEVELS (RLAS)", "Assessment of Cognitive Recovery following Traumatic Brain Injury", "Levels I to VIII (1 to 8)", "Hagen C, et al. Rehabilitation of Head Injured Adult, 1979.")
    e.layout_mode = "single"
    e.extra_css = ".table-eval td { padding: 5px 8px !important; font-size: 7.5pt !important; } .opt-item { margin-bottom: 2px !important; font-size: 7.4pt !important; }"
    e.add_table_section("EIGHT LEVELS OF COGNITIVE FUNCTIONING", [
        (("Level I: No Response", "Coma / total assistance"), [("Completely unresponsive to visual, auditory, or painful stimuli. Appears deeply asleep.", 1)]),
        (("Level II: Generalized Response", "Reflex / total assistance"), [("Non-specific, inconsistent, non-purposeful reflex response to painful stimuli (sweating, groaning, posturing).", 2)]),
        (("Level III: Localized Response", "Specific / total assistance"), [("Blinks to light, turns toward sound, focuses on object, pulls at endotracheal tube/restraints inconsistently.", 3)]),
        (("Level IV: Confused-Agitated", "Alert / maximal assistance"), [("Heightened state of activity, bizarre non-purposeful behavior, cries, aggressive, lacks short-term recall.", 4)]),
        (("Level V: Confused-Inappropriate", "Non-agitated / max assist"), [("Alert, responds to simple commands, highly distractible, wanders, severe memory impairment, inappropriate verbal.", 5)]),
        (("Level VI: Confused-Appropriate", "Goal-directed / mod assist"), [("Inconsistently oriented to time/place, shows carry-over for relearned tasks, needs cues for structure.", 6)]),
        (("Level VII: Automatic-Appropriate", "Robot-like / min assist"), [("Appropriate and oriented in hospital/home, robot-like daily routine, superficial awareness, impaired judgment.", 7)]),
        (("Level VIII: Purposeful-Appropriate", "Autonomous / stand-by"), [("Consistently oriented, recalls past and recent events, integrates changes, autonomous with assistive devices.", 8)])
    ])
    e.set_risk_stratification([
        ("Severe Coma (Levels I-III)", "Levels 1 - 3", "Total assistance. Prevent contractures, skin breakdown, sensory stimulation protocol.", "red"),
        ("Confused Agitated (Levels IV-V)", "Levels 4 - 5", "Maximal assist. Low-stimulation environment, 1:1 safety supervision, bed enclosure.", "orange"),
        ("Reintegrating (Levels VI-VIII)", "Levels 6 - 8", "Mod to min assist. Structured routine, cognitive rehabilitation, family teaching.", "green")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_rancholosamigos.pdf"))

if __name__ == "__main__":
    run()
