# -*- coding: utf-8 -*-
"""e10.py: Spanish Scales 14 and 15 (classificacao_wifi, cornell)"""
import os
from engine_es import FormPDFEngineES

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\ES"

def run():
    print("Compiling Spanish Scales 14 and 15...")
    # 14. WIfI
    e = FormPDFEngineES("SISTEMA DE CLASIFICACIÓN SVS WIfI", "Evaluación de Extremidad Inferior Amenazada (Herida, Isquemia e Infección del Pie)", "W (0-3), I (0-3), fI (0-3)", "Mills JL, et al. J Vasc Surg, 2014;59(1):220-234.")
    e.add_table_section("TRES DOMINIOS CLÍNICOS WIfI", [
        (("W - Wound (Herida / Úlcera)", "Profundidad y extensión de la lesión"), [("0: Sin úlcera (sólo dolor isquémico en reposo), sin gangrena", 0), ("1: Úlcera pequeña y superficial en pie o pierna distal; sin gangrena", 1), ("2: Úlcera profunda con tendón, articulación o hueso expuesto; gangrena limitada a dedos", 2), ("3: Úlcera profunda extensa que afecta talón/retropié; gangrena extensa", 3)]),
        (("I - Ischemia (Isquemia)", "Índice Tobillo-Brazo (ITB) o Presión en Dedo (PT)"), [("0: ITB ≥ 0.80 / Presión Tobillo > 100 mmHg / PT ≥ 60 mmHg", 0), ("1: ITB 0.60 - 0.79 / PTobillo 70-100 mmHg / PT 40-59 mmHg", 1), ("2: ITB 0.40 - 0.59 / PTobillo 50-70 mmHg / PT 30-39 mmHg", 2), ("3: ITB < 0.40 / PTobillo < 50 mmHg / PT < 30 mmHg", 3)]),
        (("fI - foot Infection (Infección)", "Signos infecciosos, eritema y toxicidad sistémica"), [("0: Sin infección: Sin purulencia ni manifestaciones inflamatorias", 0), ("1: Leve: ≥ 2 signos locales; eritema ≤ 2 cm alrededor de la úlcera", 1), ("2: Moderada: Eritema > 2 cm; tejidos profundos afectados; sin SRIS", 2), ("3: Severa: Síndrome de Respuesta Inflamatoria Sistémica (SRIS) presente", 3)])
    ])
    e.set_risk_stratification([
        ("Estadio 1 - Riesgo Muy Bajo", "W0-1, I0, fI0", "Cuidado de heridas, control glucémico, descarga de presión. Revascularización no indicada.", "green"),
        ("Estadio 2 - Riesgo Bajo", "W1-2, I0-1, fI0-1", "Desbridamiento local, antibioticoterapia, valorar estudios vasculares no invasivos.", "yellow"),
        ("Estadio 3 - Riesgo Moderado", "W2-3, I1-2, fI1-2", "Interconsulta a cirugía vascular para revascularización, antibióticos IV, desbridamiento urgente.", "orange"),
        ("Estadio 4 - Riesgo Alto", "Isquemia Severa I3 / fI3 / W3", "Riesgo alto de pérdida mayor de extremidad. Revascularización urgente y desbridamiento quirúrgico.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_classificacao_wifi.pdf"))

    # 15. Cornell
    e = FormPDFEngineES("ESCALA DE CORNELL PARA LA DEPRESIÓN EN LA DEMENCIA", "Evaluación de Síntomas Depresivos en Pacientes con Demencia", "38 puntos (0 a 38)", "Alexopoulos GS, et al. Biol Psychiatry, 1988;23(3):271-284.")
    e.layout_mode = "double_col"
    e.add_table_section("A. ESTADO DE ÁNIMO Y CONDUCTA", [
        ("1. Ansiedad (preocupación, miedo)", [("Ausente (0)", 0), ("Leve / Intermitente (1)", 1), ("Severa (2)", 2)]),
        ("2. Tristeza (tono vocal, llanto)", [("Ausente (0)", 0), ("Leve / Intermitente (1)", 1), ("Severa (2)", 2)]),
        ("3. Falta de Reactividad", [("Ausente (0)", 0), ("Leve / Intermitente (1)", 1), ("Severa (2)", 2)]),
        ("4. Irritabilidad (se molesta)", [("Ausente (0)", 0), ("Leve / Intermitente (1)", 1), ("Severa (2)", 2)]),
        ("5. Agitación (inquietud)", [("Ausente (0)", 0), ("Leve / Intermitente (1)", 1), ("Severa (2)", 2)]),
        ("6. Retardo Psicomotor (lenguaje)", [("Ausente (0)", 0), ("Leve / Intermitente (1)", 1), ("Severa (2)", 2)]),
        ("7. Múltiples Quejas Físicas", [("Ausente (0)", 0), ("Leve / Intermitente (1)", 1), ("Severa (2)", 2)]),
        ("8. Pérdida de Interés / Energía", [("Ausente (0)", 0), ("Leve / Intermitente (1)", 1), ("Severa (2)", 2)])
    ])
    e.add_table_section("B. CICLOS BIOLÓGICOS E IDEACIÓN", [
        ("9. Pérdida de Apetito", [("Ausente (0)", 0), ("Leve / Intermitente (1)", 1), ("Severa (2)", 2)]),
        ("10. Pérdida de Peso (>2kg/mes)", [("Ausente (0)", 0), ("Leve / Intermitente (1)", 1), ("Severa (2)", 2)]),
        ("11. Falta de Energía", [("Ausente (0)", 0), ("Leve / Intermitente (1)", 1), ("Severa (2)", 2)]),
        ("12. Variación Diurna (peor mañana)", [("Ausente (0)", 0), ("Leve / Intermitente (1)", 1), ("Severa (2)", 2)]),
        ("13. Dificultad Conciliar Sueño", [("Ausente (0)", 0), ("Leve / Intermitente (1)", 1), ("Severa (2)", 2)]),
        ("14. Despertar Nocturno Múltiple", [("Ausente (0)", 0), ("Leve / Intermitente (1)", 1), ("Severa (2)", 2)]),
        ("15. Despertar Precoz Matutino", [("Ausente (0)", 0), ("Leve / Intermitente (1)", 1), ("Severa (2)", 2)]),
        ("16. Ideas de Suicidio", [("Ausente (0)", 0), ("Leve / Intermitente (1)", 1), ("Severa (2)", 2)]),
        ("17. Baja Autoestima", [("Ausente (0)", 0), ("Leve / Intermitente (1)", 1), ("Severa (2)", 2)]),
        ("18. Pesimismo / Culpabilidad", [("Ausente (0)", 0), ("Leve / Intermitente (1)", 1), ("Severa (2)", 2)]),
        ("19. Delirios Congruentes", [("Ausente (0)", 0), ("Leve / Intermitente (1)", 1), ("Severa (2)", 2)])
    ])
    e.set_risk_stratification([
        ("Sin Depresión", "0 - 7 puntos", "Síntomas depresivos poco probables. Continuar con el plan de apoyo.", "green"),
        ("Depresión Probable", "8 - 12 puntos", "Probable trastorno depresivo. Optimización ambiental y reevaluación.", "yellow"),
        ("Depresión Mayor Definitiva", "≥ 13 puntos", "Depresión mayor en demencia. Valoración psicogeriátrica y evaluar tratamiento.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_cornell.pdf"))

if __name__ == "__main__":
    run()
