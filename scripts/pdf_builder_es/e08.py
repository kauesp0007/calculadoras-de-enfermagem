# -*- coding: utf-8 -*-
"""e08.py: Spanish Scales 10 and 11 (bps, cam)"""
import os
from engine_es import FormPDFEngineES

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\ES"

def run():
    print("Compiling Spanish Scales 10 and 11...")
    # 10. BPS
    e = FormPDFEngineES("ESCALA BPS (BEHAVIORAL PAIN SCALE)", "Evaluación del Dolor en Pacientes Críticos Adultos Intubados y Sedados", "12 puntos (3 a 12)", "Payen JF, et al. Crit Care Med, 2001;29(12):2258-2263.")
    e.extra_css = ".table-eval td { padding: 8px 10px !important; } .opt-item { margin-bottom: 5px !important; }"
    e.add_table_section("DOMINIOS CONDUCTUALES Y FISIOLÓGICOS", [
        (("1. Expresión Facial", "Tensión muscular y mueca facial"), [("Relajada: Cara completamente tranquila y neutra", 1), ("Parcialmente tensa: Ceño fruncido, tensión facial leve", 2), ("Totalmente tensa: Cierre palpebral fuerte, mueca profunda", 3), ("Mueca de dolor: Cara distorsionada, mandíbula apretada, lágrimas", 4)]),
        (("2. Movimiento de Miembros Superiores", "Postura y movimientos de defensa"), [("Sin movimiento: Brazos relajados en posición neutra", 1), ("Parcialmente doblados: Flexión leve de codos o dedos", 2), ("Totalmente doblados con flexión de dedos: Postura de defensa", 3), ("Permanentemente retraídos: Flexión rígida y resistencia", 4)]),
        (("3. Adaptación al Ventilador Mecánico", "Sincronía paciente-ventilador"), [("Tolerando la ventilación: Sin alarmas, respiración sincronizada", 1), ("Tose pero tolera la ventilación: Tose, se adapta espontáneamente", 2), ("Luchando contra el ventilador: Asincronía, alarmas frecuentes", 3), ("Incapaz de controlar la ventilación: Lucha continua contra el ventilador", 4)])
    ])
    e.add_raw_html_section('''
    <div class="visual-box" style="margin-top:6px; font-size:7.4pt; line-height:1.30; text-align:left;">
        <b>Guía de Titulación de Analgesia y Sedación en UCI:</b>
        Evaluar BPS antes de procedimientos dolorosos (aspiración de secreciones, curaciones, cambios de posición) y 15-30 min post-intervención.
        Objetivo terapéutico en cuidados críticos: BPS ≤ 5. Si BPS ≥ 6, iniciar analgesia multimodal / titulación de opioides antes de aumentar sedantes.
    </div>
    ''')
    e.set_risk_stratification([
        ("Sin Dolor / Aceptable", "3 - 5 puntos", "Confort y analgesia adecuados. Mantener el esquema analgésico/sedante actual.", "green"),
        ("Dolor Leve a Moderado", "6 - 7 puntos", "Evaluar al paciente; aplicar medidas de confort no farmacológicas o titular analgesia.", "yellow"),
        ("Dolor Severo / Malestar", "≥ 8 puntos", "Intervención analgésica inmediata requerida (bolus/titulación de opioide IV). Reevaluar en 15-30m.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_bps.pdf"))

    # 11. CAM-ICU
    e = FormPDFEngineES("ESCALA CAM-ICU", "Método para la Evaluación del Delirium en la Unidad de Cuidados Intensivos", "Delirium Positivo / Negativo", "Ely EW, et al. JAMA, 2001;286(21):2703-2710.")
    e.extra_css = ".table-eval td { padding: 8px 10px !important; } .opt-item { margin-bottom: 4px !important; }"
    e.add_table_section("CUATRO CARACTERÍSTICAS CLÍNICAS DEL CAM-ICU", [
        (("Característica 1: Inicio Agudo o Curso Fluctante", "Cambio en el estado mental respecto al basal"), [("Sin cambio respecto al estado basal", 0), ("Cambio agudo o curso fluctuante en las últimas 24 horas", 1)]),
        (("Característica 2: Inatención (Prueba de Letras ASE)", "Prueba de apretar la mano al oír la letra 'A' en 'SAVEAHAART'"), [("0 - 2 errores: Atención normal", 0), ("> 2 errores: Inatención presente", 1)]),
        (("Característica 3: Nivel de Conciencia Alterado", "Escala de Agitación y Sedación de Richmond (RASS)"), [("RASS actual = 0 (Alerta y tranquilo)", 0), ("RASS actual distinto de 0 (ej. -3 a -1 o +1 a +4)", 1)]),
        (("Característica 4: Pensamiento Desorganizado", "Preguntas lógicas simples y orden de 2 pasos"), [("0 - 1 error en preguntas y sigue la orden correctamente", 0), ("> 1 error en preguntas o incapaz de seguir la orden", 1)])
    ])
    e.add_raw_html_section('''
    <div class="visual-box" style="margin-top:6px; font-size:7.4pt; line-height:1.30; text-align:left;">
        <b>Bundle ABCDEF de Prevención del Delirium en UCI:</b>
        <b>A</b>valuar y manejar el dolor | <b>B</b>oth (Pruebas de respiración y despertar espontáneo) | 
        <b>C</b>elección de sedantes (evitar benzodiacepinas) | <b>D</b>elirium monitorizado por turno | 
        <b>E</b>jercicio y movilidad precoz | <b>F</b>amilia involucrada y orientación diurna.
    </div>
    ''')
    e.set_risk_stratification([
        ("Delirium Negativo", "Caract. 1 o 2 Ausente", "Estado cognitivo normal en UCI. Mantener paquete de medidas preventivas de delirium.", "green"),
        ("Delirium Positivo", "Caract. 1 y 2 Y (Caract. 3 o 4)", "Delirium activo. Identificar etiología (fármacos, hipoxia, sepsis), movilizar y evitar benzodiacepinas.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_cam.pdf"))

if __name__ == "__main__":
    run()
