# -*- coding: utf-8 -*-
"""e02.py: Scale 2 - APACHE II (Spanish)"""
import os
from engine_es import FormPDFEngineES

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\ES"

def run():
    print("Compiling Scale 02: APACHE II (ES)...")
    e = FormPDFEngineES("ESCALA APACHE II", "Evaluación de Fisiología Aguda y Salud Crónica en Cuidados Intensivos", "71 puntos", "Knaus WA, et al. Crit Care Med, 1985;13(10):818-829.")
    e.layout_mode = "double_col"
    e.extra_css = """
    .cols-2 { gap: 5mm !important; }
    .card-param { border: 1px solid #CBD5E1; border-radius: 4px; padding: 3px 5px; margin-bottom: 3.5px; font-size: 7pt; background: #fff; }
    .card-param-title { font-weight: 700; color: #1A3E74; margin-bottom: 1.5px; }
    .card-opt { display: flex; align-items: flex-start; gap: 4px; margin-bottom: 1px; line-height: 1.18; font-size: 6.8pt; }
    .card-opt:last-child { margin-bottom: 0; }
    """
    col1 = '<div class="sec-title">1. VARIABLES FISIOLÓGICAS (PARTE 1)</div>'
    v1 = [
        ("1. Temperatura Central (°C)", [("36.0 - 38.4 °C (Normal)", 0), ("34.0 - 35.9 o 38.5 - 38.9 °C", 1), ("32.0 - 33.9 o 39.0 - 40.9 °C", 3), ("< 30.0 o ≥ 41.0 °C", 4)]),
        ("2. Presión Arterial Media", [("70 - 109 mmHg (Normal)", 0), ("110 - 129 o 50 - 69 mmHg", 2), ("130 - 159 mmHg", 3), ("≥ 160 o ≤ 49 mmHg", 4)]),
        ("3. Frecuencia Cardíaca", [("70 - 109 lpm (Normal)", 0), ("110 - 139 o 55 - 69 lpm", 2), ("140 - 179 o 40 - 54 lpm", 3), ("≥ 180 o ≤ 39 lpm", 4)]),
        ("4. Frecuencia Respiratoria", [("12 - 24 rpm (Normal)", 0), ("25 - 34 o 10 - 11 rpm", 1), ("35 - 49 o 6 - 9 rpm", 3), ("≥ 50 o ≤ 5 rpm", 4)]),
        ("5. Oxigenación", [("PaO2 > 70 o A-aDO2 < 200", 0), ("PaO2 61 - 70 o A-aDO2 200 - 349", 1), ("PaO2 55 - 60 o A-aDO2 350 - 499", 3), ("PaO2 < 55 o A-aDO2 ≥ 500", 4)]),
        ("6. pH Arterial", [("7.33 - 7.49 (Normal)", 0), ("7.50 - 7.59 (Alcalemia)", 1), ("7.25 - 7.32 (Acidemia)", 2), ("< 7.15 o ≥ 7.70", 4)])
    ]
    for p_title, opts in v1:
        col1 += f'<div class="card-param"><div class="card-param-title">{p_title}</div>'
        for opt, pts in opts:
            col1 += f'<div class="card-opt"><span class="sq"></span> {opt} <b>({pts})</b></div>'
        col1 += '</div>'

    col2 = '<div class="sec-title">2. FISIOLOGÍA (PARTE 2) Y EDAD</div>'
    v2 = [
        ("7. Sodio Sérico (mEq/L)", [("130 - 149 mEq/L (Normal)", 0), ("150 - 154 mEq/L", 1), ("155 - 159 o 120 - 129 mEq/L", 2), ("≥ 180 o ≤ 110 mEq/L", 4)]),
        ("8. Potasio Sérico (mEq/L)", [("3.5 - 5.4 mEq/L (Normal)", 0), ("5.5 - 5.9 o 3.0 - 3.4 mEq/L", 1), ("6.0 - 6.9 o 2.5 - 2.9 mEq/L", 2), ("≥ 7.0 o < 2.5 mEq/L", 4)]),
        ("9. Creatinina Sérica", [("0.6 - 1.4 mg/dL (Normal)", 0), ("1.5 - 1.9 mg/dL", 2), ("2.0 - 3.4 mg/dL", 3), ("≥ 3.5 mg/dL (Doble en FRA)", 4)]),
        ("10. Hematocrito (%)", [("30.0 - 45.9% (Normal)", 0), ("46.0 - 49.9%", 1), ("50.0 - 59.9% o 20.0 - 29.9%", 2), ("≥ 60.0% o < 20.0%", 4)]),
        ("11. Leucocitos (x10³/mm³)", [("3.0 - 14.9 x10³/mm³", 0), ("15.0 - 19.9 x10³/mm³", 1), ("20.0 - 39.9 o 1.0 - 2.9k", 2), ("≥ 40.0 o < 1.0 x10³/mm³", 4)]),
        ("12. Edad y Salud Crónica", [("Edad < 44 años (0) | 45-54 años (2)", 2), ("Edad 55-64 años (3) | 65-74 años (5)", 5), ("Edad ≥ 75 años (6) | Insuficiencia de órgano (5)", 6)])
    ]
    for p_title, opts in v2:
        col2 += f'<div class="card-param"><div class="card-param-title">{p_title}</div>'
        for opt, pts in opts:
            col2 += f'<div class="card-opt"><span class="sq"></span> {opt} <b>({pts})</b></div>'
        col2 += '</div>'

    e.add_raw_html_section(f'<div class="cols-2"><div>{col1}</div><div>{col2}</div></div>')
    e.set_risk_stratification([
        ("Riesgo Bajo", "0-14 pts", "Mortalidad intrahospitalaria estimada < 15%. Monitorización y cuidados estándar de UCI.", "green"),
        ("Riesgo Moderado", "15-24 pts", "Mortalidad estimada 25-40%. Monitorización invasiva y soporte vasopresor/orgánico.", "yellow"),
        ("Riesgo Severo", "≥ 25 pts", "Mortalidad estimada > 50%. Cuidados críticos agresivos y reanimación intensiva.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_apache.pdf"))

if __name__ == "__main__":
    run()
