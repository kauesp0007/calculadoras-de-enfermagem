# -*- coding: utf-8 -*-
"""e29.py: Spanish Scales 49 and 50 (pews, prism)"""
import os
from engine_es import FormPDFEngineES

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\ES"

def run():
    print("Compiling Spanish Scales 49 and 50...")
    # 49. PEWS
    e = FormPDFEngineES("ESCALA PEWS (PEDIATRIC EARLY WARNING SCORE)", "Cribado de Deterioro Clínico Pediátrico en Hospitalización y Alerta Rápida", "9 puntos (+ modificadores)", "Monaghan A. Br J Nurs, 2005;14(5):278-281.")
    e.add_table_section("TRES DOMINIOS FISIOLÓGICOS PRINCIPALES", [
        (("1. Comportamiento", "Estado mental e irritabilidad"), [("Jugando / Respuesta adecuada (0)", 0), ("Dormido/a / Irritable pero consolable (1)", 1), ("Inconsolable / Letárgico/a / Débil (2)", 2), ("Respuesta reducida al dolor / Comatoso/a (3)", 3)]),
        (("2. Cardiovascular", "Coloración cutánea y relleno capilar"), [("Rosado/a / Relleno capilar 1-2s (0)", 0), ("Pálido/a / Relleno capilar 3s (1)", 1), ("Grisáceo/a / Relleno capilar 4s / Taquicardia > 20 lpm sobre normal (2)", 2), ("Gris moteado / Relleno capilar ≥ 5s / Taquicardia > 30 lpm o Bradicardia (3)", 3)]),
        (("3. Respiratorio", "Esfuerzo respiratorio y frecuencia"), [("Frecuencia normal, sin tiraje (0)", 0), ("Taquipnea > 10 rpm sobre normal, uso de músculos accesorios o FiO2 30%+ (1)", 1), ("Taquipnea > 20 rpm sobre normal, tiraje intercostal o FiO2 40%+ (2)", 2), ("Taquipnea > 30 rpm sobre normal, quejido, tiraje esternal o FiO2 50%+ (3)", 3)]),
        (("4. Modificadores Especiales", "Tratamientos clínicos en curso"), [("Nebulizaciones cada 15 minutos: Sí [ ] (2 pts)", 2), ("Vómitos persistentes posoperatorios: Sí [ ] (2 pts)", 2)])
    ])
    e.set_risk_stratification([
        ("Riesgo Bajo (Verde)", "0 - 2 puntos", "Observaciones de rutina c/4h. Continuar plan de cuidados de planta pediátrica.", "green"),
        ("Riesgo Moderado (Ámbar)", "3 - 4 puntos", "Repetir constantes en 1h, revisión por enfermero/a responsable, avisar a residente.", "yellow"),
        ("Riesgo Alto (Rojo)", "≥ 5 puntos (o 3 en 1 ítem)", "Respuesta inmediata del Equipo de Emergencias Médicas (EEM) / UCI Pediátrica.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_pews.pdf"))

    # 50. PRISM III
    e = FormPDFEngineES("ESCALA PRISM III", "Riesgo Pediátrico de Mortalidad III en Cuidados Intensivos Pediátricos", "74 puntos", "Pollack MM, et al. Crit Care Med, 1996;24(5):743-752.")
    e.layout_mode = "double_col"
    e.extra_css = ".table-eval-col2 td { padding: 5.5px 6.5px !important; font-size: 7.3pt !important; } .sec-title { margin: 6px 0 3px !important; }"
    e.add_table_section("1. CARDIOVASCULAR Y NEUROLÓGICO", [
        ("Presión Arterial Sistólica", [("Normal para la edad (0)", 0), ("Baja para la edad (3)", 3), ("Severamente baja (7)", 7)]),
        ("Frecuencia Cardíaca (lpm)", [("Normal para la edad (0)", 0), ("Ligeramente alterada (3)", 3), ("Taquicardia/bradicardia severa (4)", 4)]),
        ("Reflejos Pupilares", [("Ambas reactivas (0)", 0), ("Una pupila fija (7)", 7), ("Ambas pupilas fijas (11)", 11)]),
        ("Escala de Coma de Glasgow", [("GCS > 8 (0)", 0), ("GCS ≤ 8 (6)", 6)]),
        ("Temperatura Central (°C)", [("36.0 - 38.4 °C (0)", 0), ("35.0-35.9 o 38.5-39.9 (2)", 2), ("< 35.0 o ≥ 40.0 °C (5)", 5)])
    ])
    e.add_table_section("2. BIOQUÍMICA Y ÁCIDO-BASE", [
        ("Relación PaO2 / FiO2", [("≥ 300 mmHg (0)", 0), ("200 - 299 (2)", 2), ("< 200 mmHg (3)", 3)]),
        ("PaCO2 (mmHg)", [("35 - 50 mmHg (0)", 0), ("51 - 65 (1)", 1), ("> 65 mmHg (3)", 3)]),
        ("CO2 Total (Bicarbonato)", [("16 - 32 mEq/L (0)", 0), ("< 16 mEq/L (3)", 3)]),
        ("Potasio Sérico (mEq/L)", [("3.5 - 5.5 (0)", 0), ("< 3.0 o > 6.0 (3)", 3)]),
        ("Glucemia (mg/dL)", [("60 - 200 mg/dL (0)", 0), ("> 200 mg/dL (2)", 2)]),
        ("TP / TTPa (Coagulación)", [("Normal (0)", 0), ("TP o TTPa > 1.5x control (3)", 3)])
    ])
    e.add_raw_html_section('''
    <div class="visual-box" style="margin-top:5px; font-size:7.1pt; line-height:1.28; text-align:left;">
        <b>Ventana de Registro PRISM III:</b> Registrar el valor más alterado en las primeras 24 horas de ingreso en UCIP.
        Ajustes por edad aplican a PA y FC. Neonatos &lt; 24h excluidos.
    </div>
    ''')
    e.set_risk_stratification([
        ("Riesgo de Mortalidad Bajo", "0 - 9 puntos", "Mortalidad estimada en UCIP < 3%. Monitorización intensiva estándar.", "green"),
        ("Riesgo Moderado", "10 - 19 puntos", "Mortalidad estimada 5 - 15%. Titulación de soporte multiorgánico.", "yellow"),
        ("Riesgo Severo", "≥ 20 puntos", "Mortalidad estimada > 25%. Alto riesgo de shock / fallo multiorgánico pediátrico.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_prism.pdf"))

if __name__ == "__main__":
    run()
