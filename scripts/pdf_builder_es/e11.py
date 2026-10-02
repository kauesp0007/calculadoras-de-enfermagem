# -*- coding: utf-8 -*-
"""e11.py: Spanish Scales 16 and 17 (cries, curb-65)"""
import os
from engine_es import FormPDFEngineES

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\ES"

def run():
    print("Compiling Spanish Scales 16 and 17...")
    # 16. CRIES
    e = FormPDFEngineES("ESCALA CRIES DE DOLOR NEONATAL", "Evaluación del Dolor Postoperatorio en Neonatos (≥ 32 Semanas)", "10 puntos", "Krechel SW, Bildner J. Paediatr Anaesth, 1995;5(1):53-61.")
    e.add_table_section("CINCO INDICADORES CONDUCTUALES Y FISIOLÓGICOS", [
        (("C - Crying (Llanto)", "Tono vocal y llanto"), [("Sin llanto / Llanto normal no doloroso", 0), ("Llanto agudo, consolable", 1), ("Llanto continuo e inconsolable", 2)]),
        (("R - Requires O2 (Requiere Oxígeno)", "Oxigenación para mantener SpO2 > 95%"), [("No requiere O2 suplementario (SpO2 > 95% con aire)", 0), ("Requiere < 30% de FiO2 para mantener SpO2 > 95%", 1), ("Requiere ≥ 30% de FiO2 para mantener SpO2 > 95%", 2)]),
        (("I - Increased Vital Signs (Constantes)", "Incremento de frecuencia cardíaca y presión arterial"), [("FC y PA iguales o menores que el basal preop", 0), ("FC o PA incrementadas en ≤ 20% respecto al basal", 1), ("FC o PA incrementadas en > 20% respecto al basal", 2)]),
        (("E - Expression (Expresión Facial)", "Mueca facial y tensión"), [("Expresión relajada / neutra", 0), ("Mueca presente (ceño fruncido, ojos apretados)", 1), ("Mueca con quejido no intencionado", 2)]),
        (("S - Sleeplessness (Sueño)", "Patrón de sueño-vigilia en la última hora"), [("Continuamente dormido / despierta normalmente", 0), ("Se despierta a intervalos frecuentes", 1), ("Constantemente despierto, inquieto", 2)])
    ])
    e.set_risk_stratification([
        ("Sin Dolor Significativo", "0 - 3 puntos", "Neonato confortable. Medidas no farmacológicas de confort (arropamiento, chupete, sacarosa).", "green"),
        ("Dolor Moderado a Severo", "≥ 4 puntos", "Analgesia farmacológica indicada (paracetamol / bolus de opioide IV) más medidas de confort.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_cries.pdf"))

    # 17. CURB-65
    e = FormPDFEngineES("ESCALA CURB-65", "Estratificación de Gravedad y Elección del Lugar de Cuidados en Neumonía", "5 puntos", "Lim WS, et al. Thorax, 2003;58(5):377-382.")
    e.extra_css = ".table-eval td { padding: 8.5px 10px !important; } .opt-item { margin-bottom: 4px !important; }"
    e.add_table_section("CINCO CRITERIOS CLÍNICOS DE CURB-65", [
        (("C - Confusión", "Alteración reciente del estado mental"), [("Alterado: Confusión mental de reciente aparición / Test abreviado ≤ 8", 1), ("Normal: Estado mental intacto, orientado en tiempo/espacio", 0)]),
        (("U - Urea (BUN)", "Indicador de disfunción renal"), [("Alterado: Nitrógeno Ureico en Sangre (BUN) > 19 mg/dL (Urea > 7 mmol/L)", 1), ("Normal: BUN ≤ 19 mg/dL (Urea ≤ 7 mmol/L)", 0)]),
        (("R - Frecuencia Respiratoria", "Evaluación de taquipnea"), [("Alterado: Frecuencia respiratoria ≥ 30 respiraciones/minuto", 1), ("Normal: Frecuencia respiratoria < 30 respiraciones/minuto", 0)]),
        (("B - Presión Arterial (Blood Pressure)", "Inestabilidad hemodinámica"), [("Alterado: Presión Sistólica < 90 mmHg o Diastólica ≤ 60 mmHg", 1), ("Normal: PAS ≥ 90 mmHg y PAD > 60 mmHg", 0)]),
        (("65 - Edad ≥ 65 Años", "Factor de riesgo por edad avanzada"), [("Paciente con 65 años o más", 1), ("Paciente menor de 65 años", 0)])
    ])
    e.add_raw_html_section('''
    <div class="visual-box" style="margin-top:6px; font-size:7.4pt; line-height:1.32; text-align:left;">
        <b>Recomendaciones de Manejo de la Sociedad Británica de Tórax (BTS):</b><br>
        • Estudio Diagnóstico: Cultivos de esputo y hemocultivos previos a antibióticos, antígeno urinario (Legionella/Neumococo), Rx tórax.<br>
        • Oxigenoterapia Objetivo: Titular O2 para SpO2 94-98% (o 88-92% en riesgo de hipercapnia).<br>
        • Primera Dosis de Antibiótico: Administrar en &lt; 4 horas (o &lt; 1 hora si CURB-65 ≥ 3 o shock séptico).
    </div>
    ''')
    e.set_risk_stratification([
        ("Riesgo Bajo (Grupo 1)", "0 - 1 punto", "Mortalidad a 30 días < 1.5%. Tratamiento ambulatorio con antibióticos orales.", "green"),
        ("Riesgo Moderado (Grupo 2)", "2 puntos", "Mortalidad aprox. 9.2%. Ingreso recomendado en sala de hospitalización.", "yellow"),
        ("Riesgo Severo (Grupo 3)", "3 - 5 puntos", "Mortalidad 15% a 40%. Hospitalización urgente; valorar UCI para puntuaciones 4-5.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_curb-65.pdf"))

if __name__ == "__main__":
    run()
