# -*- coding: utf-8 -*-
"""e25.py: Spanish Scales 42 and 43 (nips, nihss)"""
import os
from engine_es import FormPDFEngineES

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\ES"

def run():
    print("Compiling Spanish Scales 42 and 43...")
    # 42. NIPS
    e = FormPDFEngineES("ESCALA NIPS (NEONATAL INFANT PAIN SCALE)", "Evaluación Conductual del Dolor en Neonatos Pretérmino y a Término", "7 puntos (0 a 7)", "Lawrence J, et al. Neonatal Netw, 1993;12(6):59-66.")
    e.add_table_section("SEIS CRITERIOS CONDUCTUALES Y FISIOLÓGICOS", [
        (("1. Expresión Facial", "Relajación vs mueca facial"), [("Relajada: Cara en reposo, expresión neutra", 0), ("Mueca: Músculos faciales tensos, ceño fruncido, barbilla temblorosa", 1)]),
        (("2. Llanto", "Calidad audible del llanto"), [("Sin llanto: Tranquilo/a, no llora", 0), ("Quejido: Gemido leve, llanto intermitente", 1), ("Llanto enérgico: Llanto fuerte, continuo, agudo", 2)]),
        (("3. Patrón Respiratorio", "Esfuerzo respiratorio"), [("Relajado: Patrón respiratorio habitual basal", 0), ("Cambio en la respiración: Irregular, más rápida, atragantamiento", 1)]),
        (("4. Movimiento de Brazos", "Tensión muscular en miembros superiores"), [("Relajados / Sujetos: Sin rigidez muscular, movimiento espontáneo", 0), ("Flexionados / Extendidos: Brazos tensos, rígidos en flexión o extensión", 1)]),
        (("5. Movimiento de Piernas", "Tensión muscular en miembros inferiores"), [("Relajadas / Sujetas: Sin rigidez muscular, piernas relajadas", 0), ("Flexionadas / Extendidas: Piernas tensas, pataleando, rígidas", 1)]),
        (("6. Estado de Alerta", "Estado de sueño-vigilia"), [("Dormido / Despierto: Tranquilo, en paz, alerta y asentado", 0), ("Inquieto: Alerta, inquieto, agitado, llora intermitentemente", 1)])
    ])
    e.set_risk_stratification([
        ("Confortable / Sin Dolor", "0 - 2 puntos", "Neonato confortable. Mantener cuidados de desarrollo (anidación, arropamiento).", "green"),
        ("Dolor Leve a Moderado", "3 - 4 puntos", "Confort no farmacológico (sacarosa, succión no nutritiva, método madre canguro).", "yellow"),
        ("Dolor Severo", "≥ 5 puntos", "Intervención analgésica requerida (tratamiento farmacológico) y reevaluación en 15-30m.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_nips.pdf"))

    # 43. NIHSS
    e = FormPDFEngineES("ESCALA DE ICTUS DEL NIH (NIHSS)", "Cuantificación Sistemática del Déficit Neurológico en Ictus Agudo", "42 puntos (0 a 42)", "Brott T, et al. Stroke, 1989;20(7):864-870.")
    e.layout_mode = "double_col"
    e.extra_css = ".table-eval-col2 td { padding: 5.5px 6px !important; font-size: 7.2pt !important; } .sec-title { margin: 5px 0 2px !important; }"
    e.add_table_section("1. CONCIENCIA Y MIRADA", [
        ("1a. Nivel de Conciencia", [("Alerta (0)", 0), ("Somnoliento (1)", 1), ("Estuporoso (2)", 2), ("Comatoso (3)", 3)]),
        ("1b. Preguntas LOC (Mes/Edad)", [("Ambas correctas (0)", 0), ("Una correcta (1)", 1), ("Ninguna (2)", 2)]),
        ("1c. Órdenes LOC (Ojos/Puño)", [("Ambas correctas (0)", 0), ("Una correcta (1)", 1), ("Ninguna (2)", 2)]),
        ("2. Mirada Conjugada", [("Normal (0)", 0), ("Paresia parcial (1)", 1), ("Desviación forzada (2)", 2)]),
        ("3. Campos Visuales", [("Sin pérdida (0)", 0), ("Hemianopsia parcial (1)", 1), ("Completa (2)", 2), ("Ceguera bilateral (3)", 3)]),
        ("4. Parálisis Facial", [("Normal (0)", 0), ("Paresia menor (1)", 1), ("Paresia parcial (2)", 2), ("Parálisis completa (3)", 3)])
    ])
    e.add_table_section("2. MOTOR, SENSIBILIDAD Y LENGUAJE", [
        ("5. Motor Brazo (Izq/Der)", [("Sin caída (0)", 0), ("Caída leve (1)", 1), ("Cierta fuerza (2)", 2), ("Sin movimiento (4)", 4)]),
        ("6. Motor Pierna (Izq/Der)", [("Sin caída (0)", 0), ("Caída leve (1)", 1), ("Cierta fuerza (2)", 2), ("Sin movimiento (4)", 4)]),
        ("7. Ataxia de Miembros", [("Ausente (0)", 0), ("En 1 miembro (1)", 1), ("En 2 miembros (2)", 2)]),
        ("8. Sensibilidad", [("Normal (0)", 0), ("Pérdida leve-moderada (1)", 1), ("Pérdida severa (2)", 2)]),
        ("9. Lenguaje (Afasia)", [("Sin afasia (0)", 0), ("Afasia leve-mod (1)", 1), ("Afasia severa (2)", 2), ("Mute (3)", 3)]),
        ("10. Disartria", [("Normal (0)", 0), ("Leve-moderada (1)", 1), ("Severa / anartria (2)", 2)]),
        ("11. Inatención (Negligencia)", [("Sin negligencia (0)", 0), ("Inatención parcial (1)", 1), ("Profunda (2)", 2)])
    ])
    e.add_raw_html_section('''
    <div class="visual-box" style="margin-top:5px; font-size:7.1pt; line-height:1.28; text-align:left;">
        <b>Reglas de Examen NIHSS:</b> Administrar en el orden exacto. Anotar lo que el paciente hace, no lo que el examinador cree que puede hacer.
        Puntuaciones ≥ 5 justifican consideración urgente de revascularización (trombolisis IV / trombectomía mecánica).
    </div>
    ''')
    e.set_risk_stratification([
        ("Ictus Menor", "1 - 4 puntos", "Déficit funcional leve. Prevención secundaria rápida y controles neurológicos.", "green"),
        ("Ictus Moderado", "5 - 15 puntos", "Candidato a trombolisis IV / trombectomía endovascular si está en ventana.", "yellow"),
        ("Moderado a Severo", "16 - 20 puntos", "Déficit neurológico sustancial, alto riesgo de transformación hemorrágica.", "orange"),
        ("Ictus Severo", "21 - 42 puntos", "Ictus grave, alto riesgo de mortalidad. Cuidados en Neuro-UCI, valorar hemicraniectomía.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_nihss.pdf"))

if __name__ == "__main__":
    run()
