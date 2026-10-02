# -*- coding: utf-8 -*-
"""e32.py: Spanish Scales 55 and 56 (saps, silverman)"""
import os
from engine_es import FormPDFEngineES

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\ES"

def run():
    print("Compiling Spanish Scales 55 and 56...")
    # 55. SAPS 3
    e = FormPDFEngineES("ESCALA SAPS 3", "Sistema Simplificado de Evaluación Fisiológica Aguda en Cuidados Intensivos", "100+ puntos", "Moreno RP, et al. Intensive Care Med, 2005;31(10):1336-1344.")
    e.layout_mode = "double_col"
    e.extra_css = ".table-eval-col2 td { padding: 5.5px 6.5px !important; font-size: 7.2pt !important; } .sec-title { margin: 5px 0 2px !important; }"
    e.add_table_section("1. ESTADO PREVIO Y AL INGRESO EN UCI", [
        ("Puntuación por Edad", [("< 40 años (0)", 0), ("40-59 (5)", 5), ("60-69 (9)", 9), ("70-74 (13)", 13), ("75-79 (16)", 16), ("≥ 80 (18)", 18)]),
        ("Comorbilidades", [("Ninguna (0)", 0), ("Cáncer / Inmunodeprimido (6)", 6), ("Insuficiencia Cardíaca NYHA IV (8)", 8), ("Cirrosis / Leucemia (10)", 10)]),
        ("Procedencia Pre-UCI", [("Urgencias (0)", 0), ("Otro hospital (5)", 5), ("Planta hospitalaria (7)", 7), ("Otra UCI (8)", 8)]),
        ("Motivo de Ingreso", [("Cirugía programada (0)", 0), ("Cirugía urgente (5)", 5), ("Ingreso médico (6)", 6)])
    ])
    e.add_table_section("2. FISIOLOGÍA AL INGRESO EN UCI", [
        ("Escala de Coma de Glasgow", [("GCS 13-15 (0)", 0), ("GCS 7-12 (7)", 7), ("GCS 3-6 (15)", 15)]),
        ("Frecuencia Cardíaca (lpm)", [("< 120 (0)", 0), ("120-159 (5)", 5), ("≥ 160 (7)", 7), ("Parada cardíaca previa (13)", 13)]),
        ("Presión Arterial Sistólica", [("≥ 120 mmHg (0)", 0), ("70-119 (6)", 6), ("< 70 mmHg (11)", 11)]),
        ("Temperatura Central", [("≥ 35.0 °C (0)", 0), ("< 35.0 °C (7)", 7)]),
        ("Oxigenación (PaO2/FiO2)", [("≥ 250 (0)", 0), ("100-249 (7)", 7), ("< 100 mmHg (11)", 11)]),
        ("Creatinina Sérica", [("< 1.2 mg/dL (0)", 0), ("1.2-1.9 (6)", 6), ("≥ 2.0 mg/dL (8)", 8)]),
        ("Bilirrubina Total", [("< 2.0 (0)", 0), ("2.0-5.9 (4)", 4), ("≥ 6.0 mg/dL (6)", 6)]),
        ("Recuento de Plaquetas", [("≥ 100k (0)", 0), ("50-99k (5)", 5), ("< 50k (8)", 8)])
    ])
    e.add_raw_html_section('''
    <div class="visual-box" style="margin-top:5px; font-size:7.1pt; line-height:1.28; text-align:left;">
        <b>Ventana de Registro SAPS 3:</b> Registrar datos fisiológicos dentro del intervalo ± 1 hora del ingreso en UCI.
        Las puntuaciones de las 3 secciones se suman para calcular la mortalidad hospitalaria predicha.
    </div>
    ''')
    e.set_risk_stratification([
        ("Mortalidad Predicha Baja", "< 45 puntos", "Riesgo de mortalidad hospitalaria < 15%. Monitorización intensiva de rutina.", "green"),
        ("Riesgo Moderado", "45 - 60 puntos", "Mortalidad estimada 25 - 50%. Soporte de órganos y titulación hemodinámica.", "yellow"),
        ("Riesgo de Mortalidad Alto", "> 60 puntos", "Mortalidad estimada > 60%. Falla multiorgánica severa, escalado crítico.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_saps.pdf"))

    # 56. Silverman-Andersen
    e = FormPDFEngineES("TEST DE SILVERMAN-ANDERSEN", "Evaluación de la Dificultad Respiratoria Neonatal en Recién Nacidos", "10 puntos (0 a 10)", "Silverman WA, Andersen DH. Pediatrics, 1956;17(1):1-10.")
    e.add_table_section("CINCO CRITERIOS DE DIFICULTAD RESPIRATORIA", [
        (("1. Movimientos Tóraco-Abdominales", "Sincronía entre tórax y abdomen"), [("Sincrónicos: El tórax y el abdomen se elevan juntos", 0), ("Tórax inmóvil: El tórax no se eleva, sólo el abdomen", 1), ("Disociación tóraco-abdominal (sube y baja invertido)", 2)]),
        (("2. Tiraje Intercostal", "Hundimiento de espacios intercostales"), [("Ausente: Sin hundimiento de espacios intercostales", 0), ("Leve: Apenas visible en espacios intercostales inferiores", 1), ("Marcado: Hundimiento profundo e intercostal evidente", 2)]),
        (("3. Retracción Xifoidea", "Hundimiento del apéndice xifoides"), [("Ausente: Sin hundimiento xifoideo", 0), ("Leve: Apenas visible el hundimiento subxifoideo", 1), ("Marcado: Hundimiento xifoideo profundo y evidente", 2)]),
        (("4. Aleteo Nasal", "Dilatación de las fosas nasales"), [("Ausente: Respiración nasal tranquila normal", 0), ("Leve: Dilatación nasal mínima e intermitente", 1), ("Marcado: Aleteo nasal continuo y marcado", 2)]),
        (("5. Quejido Espiratorio", "Ruido respiratorio al espirar"), [("Ausente: Sin quejido espiratorio", 0), ("Audible con fonendoscopio solamente", 1), ("Audible a distancia sin fonendoscopio", 2)])
    ])
    e.set_risk_stratification([
        ("Sin Dificultad Respiratoria", "0 puntos", "Patrón respiratorio neonatal normal. Vigilancia térmica y respiratoria de rutina.", "green"),
        ("Dificultad Respiratoria Leve", "1 - 3 puntos", "Oxígeno humidificado suplementario, valorar CPAP nasal, aspirar secreciones.", "yellow"),
        ("Dificultad Moderada", "4 - 6 puntos", "CPAP nasal / Cánula nasal de alto flujo, gasometría arterial, Rx de tórax.", "orange"),
        ("Fallo Respiratorio Severo", "7 - 10 puntos", "Fallo respiratorio inminente. Intubación endotraqueal urgente, ventilación mecánica y UCIN.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_silverman.pdf"))

if __name__ == "__main__":
    run()
