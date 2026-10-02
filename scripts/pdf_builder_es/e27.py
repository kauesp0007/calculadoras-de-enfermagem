# -*- coding: utf-8 -*-
"""e27.py: Spanish Scales 46 and 47 (painad, pelod)"""
import os
from engine_es import FormPDFEngineES

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\ES"

def run():
    print("Compiling Spanish Scales 46 and 47...")
    # 46. PAINAD
    e = FormPDFEngineES("ESCALA PAINAD", "Evaluación del Dolor Conductual en Pacientes con Demencia Avanzada", "10 puntos (0 a 10)", "Warden V, et al. J Am Med Dir Assoc, 2003;4(1):9-15.")
    e.add_table_section("CINCO INDICADORES CONDUCTUALES DE DOLOR", [
        (("1. Respiración", "Esfuerzo respiratorio y ruidos"), [("Normal: Respiración relajada y tranquila", 0), ("Respiración fatigosa ocasional, hiperventilación corta", 1), ("Respiración fatigosa ruidosa, hiperventilación prolongada, Cheyne-Stokes", 2)]),
        (("2. Vocalización Negativa", "Manifiestos verbales de malestar"), [("Ninguna: Tono vocal normal o silencio", 0), ("Gemido o gruñido ocasional; queja en voz baja", 1), ("Llamado de socorro repetido, gemido/gruñido fuerte, llanto", 2)]),
        (("3. Expresión Facial", "Tensión muscular y mueca"), [("Sonriente o inexpresiva", 0), ("Triste, asustada, ceño fruncido", 1), ("Mueca facial de dolor, dientes apretados, ojos cerrados con fuerza", 2)]),
        (("4. Lenguaje Corporal", "Postura física y agitación"), [("Postura relajada y tranquila", 0), ("Tensa, deambulando con malestar, postura de protección", 1), ("Rígida, puños cerrados, rodillas encogidas, agresión física", 2)]),
        (("5. Consolabilidad", "Respuesta a caricias o voz reconfortante"), [("No requiere consuelo", 0), ("Distraído/a o tranquilizado/a con voz o contacto suave", 1), ("Incapaz de consolar, distraer o reasegurar", 2)])
    ])
    e.set_risk_stratification([
        ("Sin Dolor / Dolor Leve", "0 - 3 puntos", "Estado confortable. Medidas de confort no farmacológicas (voz suave, contacto, cambios).", "green"),
        ("Dolor Moderado", "4 - 6 puntos", "Dolor presente. Administrar analgésico pautado o de rescate, reevaluar en 45 min.", "yellow"),
        ("Dolor Severo", "7 - 10 puntos", "Crisis de dolor severo. Titulación analgésica urgente (opioide IV), aviso a médico.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_painad.pdf"))

    # 47. PELOD-2
    e = FormPDFEngineES("ESCALA PELOD-2", "Evaluación de la Disfunción Orgánica Logística en UCI Pediátrica", "33 puntos", "Leteurtre S, et al. Crit Care Med, 2013;41(4):1039-1053.")
    e.layout_mode = "single"
    e.extra_css = ".table-eval td { padding: 4.5px 7px !important; font-size: 7.4pt !important; } .opt-item { margin-bottom: 2px !important; } .sec-title { margin: 5px 0 2px !important; }"
    e.add_table_section("DIEZ CRITERIOS DE DISFUNCIÓN ORGÁNICA PEDIÁTRICA", [
        (("1. Escala de Coma de Glasgow", "Conciencia neurológica"), [("11 - 15 (0)", 0), ("5 - 10 (1)", 1), ("3 - 4 (4)", 4)]),
        (("2. Reacción Pupilar", "Reflejos pupilares del tronco encéfalo"), [("Ambas pupilas reactivas a la luz (0)", 0), ("Una pupila arreactiva (2)", 2), ("Ambas pupilas fijas / arreactivas (5)", 5)]),
        (("3. Lactato Sérico", "Indicador de hipoperfusión tisular"), [("< 5.0 mmol/L (0)", 0), ("5.0 - 10.9 mmol/L (1)", 1), ("≥ 11.0 mmol/L (4)", 4)]),
        (("4. Presión Arterial Media", "Perfusión cardiovascular"), [("PAM normal para la edad (0)", 0), ("PAM baja para la edad (2)", 2), ("PAM severamente baja para la edad (4)", 4)]),
        (("5. Creatinina Sérica", "Función renal para la edad"), [("Creatinina normal para la edad (0)", 0), ("Creatinina elevada para la edad (2)", 2)]),
        (("6. Relación PaO2 / FiO2", "Intercambio gaseoso pulmonar"), [("≥ 400 mmHg o no ventilado (0)", 0), ("200 - 399 mmHg (2)", 2), ("< 200 mmHg (4)", 4)]),
        (("7. PaCO2", "Adecuación ventilatoria"), [("≤ 58 mmHg (0)", 0), ("> 58 mmHg (1)", 1)]),
        (("8. Ventilación Mecánica Invasiva", "Soporte ventilatorio e intubación"), [("Sin ventilación invasiva (0)", 0), ("Ventilación mecánica invasiva presente (3)", 3)]),
        (("9. Leucocitos Totales", "Respuesta inmunológica / hematológica"), [("≥ 2.0 x10⁹/L (0)", 0), ("< 2.0 x10⁹/L (2)", 2)]),
        (("10. Recuento de Plaquetas", "Competencia de coagulación"), [("≥ 77 x10⁹/L (0)", 0), ("35 - 76 x10⁹/L (1)", 1), ("< 35 x10⁹/L (2)", 2)])
    ])
    e.set_risk_stratification([
        ("Disfunción Orgánica Baja", "0 - 4 puntos", "Mortalidad en UCIP estimada < 2%. Monitorización intensiva de rutina.", "green"),
        ("Disfunción Moderada", "5 - 9 puntos", "Mortalidad estimada 5 - 15%. Titulación de soporte multiorgánico.", "yellow"),
        ("Disfunción Orgánica Severa", "≥ 10 puntos", "Mortalidad estimada > 30%. Alto riesgo de fallo multiorgánico refractario.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_pelod.pdf"))

if __name__ == "__main__":
    run()
