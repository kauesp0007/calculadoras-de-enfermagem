# -*- coding: utf-8 -*-
"""e17.py: Spanish Scales 27 and 28 (gosnell, hamilton)"""
import os
from engine_es import FormPDFEngineES

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\ES"

def run():
    print("Compiling Spanish Scales 27 and 28...")
    # 27. Gosnell
    e = FormPDFEngineES("ESCALA DE GOSNELL", "Valoración del Riesgo de Úlceras por Presión en Pacientes Adultos Hospitalizados", "20 puntos (5 a 20)", "Gosnell DJ. Nurs Res, 1973;22(1):55-59.")
    e.add_table_section("CINCO SUBESCALAS CLÍNICAS", [
        (("1. Estado Mental", "Orientación y sensorio"), [("Alerta: Orientado en tiempo, espacio y persona", 1), ("Apático/a: Somnoliento, pasivo, deprimido", 2), ("Confuso/a: Conversa de forma inapropiada", 3), ("Estuporoso/a: Responde sólo a estímulos enérgicos", 4), ("Comatoso/a: Sin respuesta a estímulos", 5)]),
        (("2. Continencia", "Control de esfínteres vesical y anal"), [("Totalmente continente: Control esfinteriano completo", 1), ("Habitualmente continente: Incontinente sólo una vez al día", 2), ("Incontinente ocasional: Incontinente dos veces al día", 3), ("Habitualmente incontinente: Incontinente varias veces al día", 4), ("Incontinente de orina y heces: Incontinencia total", 5)]),
        (("3. Movilidad", "Capacidad para cambiar de posición corporal"), [("Completa: Mueve todas las extremidades activamente", 1), ("Ligeramente limitada: Se mueve con alguna ayuda", 2), ("Muy limitada: Requiere gran ayuda para moverse", 3), ("Inmóvil: Incapaz de cambiar de posición", 4)]),
        (("4. Actividad", "Grado de deambulación"), [("Ambulatorio/a: Camina sin ayuda", 1), ("Camina con ayuda: Requiere bastón, andador o persona", 2), ("En silla: Confinado/a a silla/silla de ruedas", 3), ("Encamado/a: Confinado/a a la cama continuamente", 4)]),
        (("5. Nutrición", "Calidad de la ingesta de alimentos y líquidos"), [("Buena: Come comidas equilibradas completamente", 1), ("Regular: Come comidas parciales, requiere suplementos", 2), ("Pobre: Rechaza alimentos, solo líquidos, sonda", 3)])
    ])
    e.set_risk_stratification([
        ("Riesgo Bajo", "5 - 9 puntos", "Higiene cutánea estándar, mantener piel seca, cambios posturales regulares.", "green"),
        ("Riesgo Moderado", "10 - 14 puntos", "Programa de cambios q2h, colchón de alivio de presión, apoyo nutricional.", "yellow"),
        ("Riesgo Alto de Úlcera", "≥ 15 puntos", "Colchón dinámico de aire alternante, protectores de talón, crema barrera.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_gosnell.pdf"))

    # 28. Hamilton
    e = FormPDFEngineES("ESCALA DE ANSIEDAD DE HAMILTON (HAM-A)", "Evaluación Clínica de la Intensidad de los Síntomas de Ansiedad", "56 puntos (0 a 56)", "Hamilton M. Br J Med Psychol, 1959;32(1):50-55.")
    e.layout_mode = "double_col"
    e.extra_css = ".table-eval-col2 td { padding: 10.5px 8px !important; font-size: 7.8pt !important; } .sec-title { margin: 8px 0 4px !important; }"
    e.add_table_section("DOMINIOS DE ANSIEDAD (PARTE 1)", [
        ("1. Estado de Ánimo Ansioso", [("Ausente (0)", 0), ("Leve (1)", 1), ("Mod (2)", 2), ("Grave (3)", 3), ("Muy grave (4)", 4)]),
        ("2. Tensión (fatiga, susto)", [("Ausente (0)", 0), ("Leve (1)", 1), ("Mod (2)", 2), ("Grave (3)", 3), ("Muy grave (4)", 4)]),
        ("3. Temores (oscuridad, gente)", [("Ausente (0)", 0), ("Leve (1)", 1), ("Mod (2)", 2), ("Grave (3)", 3), ("Muy grave (4)", 4)]),
        ("4. Insomnio (sueño interrumpido)", [("Ausente (0)", 0), ("Leve (1)", 1), ("Mod (2)", 2), ("Grave (3)", 3), ("Muy grave (4)", 4)]),
        ("5. Funciones Intelectuales", [("Ausente (0)", 0), ("Leve (1)", 1), ("Mod (2)", 2), ("Grave (3)", 3), ("Muy grave (4)", 4)]),
        ("6. Estado Ánimo Depresivo", [("Ausente (0)", 0), ("Leve (1)", 1), ("Mod (2)", 2), ("Grave (3)", 3), ("Muy grave (4)", 4)]),
        ("7. Síntomas Somáticos (Músculos)", [("Ausente (0)", 0), ("Leve (1)", 1), ("Mod (2)", 2), ("Grave (3)", 3), ("Muy grave (4)", 4)])
    ])
    e.add_table_section("DOMINIOS DE ANSIEDAD (PARTE 2)", [
        ("8. Síntomas Somáticos (Sensorial)", [("Ausente (0)", 0), ("Leve (1)", 1), ("Mod (2)", 2), ("Grave (3)", 3), ("Muy grave (4)", 4)]),
        ("9. Cardiovasculares (taquicardia)", [("Ausente (0)", 0), ("Leve (1)", 1), ("Mod (2)", 2), ("Grave (3)", 3), ("Muy grave (4)", 4)]),
        ("10. Respiratorios (disnea)", [("Ausente (0)", 0), ("Leve (1)", 1), ("Mod (2)", 2), ("Grave (3)", 3), ("Muy grave (4)", 4)]),
        ("11. Gastrointestinales (náuseas)", [("Ausente (0)", 0), ("Leve (1)", 1), ("Mod (2)", 2), ("Grave (3)", 3), ("Muy grave (4)", 4)]),
        ("12. Genitourinarios (micción)", [("Ausente (0)", 0), ("Leve (1)", 1), ("Mod (2)", 2), ("Grave (3)", 3), ("Muy grave (4)", 4)]),
        ("13. Autonómicos (boca seca)", [("Ausente (0)", 0), ("Leve (1)", 1), ("Mod (2)", 2), ("Grave (3)", 3), ("Muy grave (4)", 4)]),
        ("14. Comportamiento en Entrevista", [("Ausente (0)", 0), ("Leve (1)", 1), ("Mod (2)", 2), ("Grave (3)", 3), ("Muy grave (4)", 4)])
    ])
    e.set_risk_stratification([
        ("Ansiedad Leve", "< 17 puntos", "Síntomas levemente significativos. Apoyo psicológico, manejo del estrés.", "green"),
        ("Ansiedad Moderada", "18 - 24 puntos", "Ansiedad moderada. Derivación a psicoterapia, evaluar tratamiento farmacológico.", "yellow"),
        ("Ansiedad Severa", "25 - 30 points", "Trastorno de ansiedad significativo. Valoración médica especializada.", "orange"),
        ("Ansiedad Muy Severa", "> 30 puntos", "Síntomas incapacitantes. Intervención psiquiátrica urgente.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_hamilton.pdf"))

if __name__ == "__main__":
    run()
