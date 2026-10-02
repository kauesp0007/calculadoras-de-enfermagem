# -*- coding: utf-8 -*-
"""e14.py: Spanish Scales 22 and 23 (flacc, fast)"""
import os
from engine_es import FormPDFEngineES

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\ES"

def run():
    print("Compiling Spanish Scales 22 and 23...")
    # 22. FLACC
    e = FormPDFEngineES("ESCALA FLACC DE DOLOR CONDUCTUAL", "Evaluación del Dolor en Lactantes, Niños Pequeños y Pacientes No Verbales", "10 puntos (0 a 10)", "Merkel SI, et al. Pediatr Nurs, 1997;23(3):293-297.")
    e.add_table_section("CINCO CATEGORÍAS CONDUCTUALES", [
        (("F - Cara (Face)", "Expresión facial y mueca"), [("Sin expresión particular o sonrisa", 0), ("Mueca o ceño fruncido ocasional, retraído, desinteresado", 1), ("Barbilla temblorosa frecuente o constante, mandíbula apretada", 2)]),
        (("L - Piernas (Legs)", "Tensión muscular en miembros inferiores"), [("Posición normal o relajada", 0), ("Inquieto, molesto, tenso", 1), ("Pataleando o piernas encogidas", 2)]),
        (("A - Actividad (Activity)", "Movimiento corporal y posición"), [("Acostado tranquilamente, posición normal, se mueve fácilmente", 0), ("Retorciéndose, moviéndose adelante y atrás, tenso", 1), ("Arqueado, rígido o con sacudidas", 2)]),
        (("C - Llanto (Cry)", "Quejas vocales y llanto"), [("Sin llanto (despierto o dormido)", 0), ("Gemidos o sollozos; queja ocasional", 1), ("Llanto constante, gritos o sollozos, quejas frecuentes", 2)]),
        (("C - Consolabilidad (Consolability)", "Respuesta a medidas de confort"), [("Contento, relajado", 0), ("Tranquilizado con contacto ocasional, abrazos, hablándole", 1), ("Difícil de consolar o confortar", 2)])
    ])
    e.set_risk_stratification([
        ("Relajado / Confortable", "0 puntos", "Sin evidencia de dolor. Mantener medidas habituales de confort pediátrico.", "green"),
        ("Malestar Leve", "1 - 3 puntos", "Consuelo no farmacológico (distracción, arropamiento, presencia de padres).", "yellow"),
        ("Dolor Moderado", "4 - 6 puntos", "Analgesia leve (paracetamol / ibuprofeno) más intervenciones de confort.", "orange"),
        ("Dolor Severo / Malestar", "7 - 10 puntos", "Intervención analgésica urgente (opioide IV / aviso a médico). Reevaluar en 15-30m.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_flacc.pdf"))

    # 23. FAST
    e = FormPDFEngineES("ESCALA FAST DE ICTUS", "Protocolo de Cara, Brazo, Lenguaje y Tiempo para Sospecha de Ictus Agudo", "Ictus Positivo / Negativo", "Harbison J, et al. Stroke, 2003;34(1):71-76.")
    e.extra_css = ".table-eval td { padding: 8.5px 10px !important; } .opt-item { margin-bottom: 4px !important; }"
    e.add_table_section("DOMINIOS DE EVALUACIÓN FAST", [
        (("F - Cara (Face)", "Pedir al paciente que sonría o enseñe los dientes"), [("Normal: Sonrisa y movimiento facial simétrico", 0), ("Alterado: Un lado de la cara se cae o está adormecido", 1)]),
        (("A - Brazos (Arms)", "Levantar ambos brazos al frente, palmas arriba, 10s"), [("Normal: Ambos brazos se mantienen arriba igual durante 10 segundos", 0), ("Alterado: Un brazo cae hacia abajo o está paralizado", 1)]),
        (("S - Lenguaje (Speech)", "Pedir al paciente que repita una frase sencilla"), [("Normal: Repite la frase correctamente sin arrastrar la voz", 0), ("Alterado: Arrastra las palabras, usa palabras incorrectas o no habla", 1)]),
        (("T - Tiempo (Time)", "Hora de inicio de síntomas / Última vez sano"), [("Hora de inicio registrada: ____:____ (Aviso a Emergencias / Código Ictus)", 0)])
    ])
    e.add_raw_html_section('''
    <div class="visual-box" style="margin-top:6px; font-size:7.4pt; line-height:1.32; text-align:left;">
        <b>Protocolo de Manejo de Ictus Agudo en Urgencias:</b><br>
        • Hora Exacta de Última Vez Conocido Sano (LKW): ____:____ (Crucial para ventana trombolítica &lt; 4.5 horas y trombectomía &lt; 24 horas).<br>
        • Glucemia Capilar Inmediata: Descartar hipoglucemia (si &lt; 60 mg/dL, tratar inmediatamente con suero glucosado 50%).<br>
        • Neuroimagen Urgente: TC craneal simple + angio-TC para descartar hemorragia e identificar oclusión de gran vaso (LVO).
    </div>
    ''')
    e.set_risk_stratification([
        ("Ictus Poco Probable", "0 Síntomas", "Evaluación diagnóstica alternativa (descarte de hipoglucemia, parálisis facial, migraña).", "green"),
        ("¡Alerta de Ictus Agudo!", "≥ 1 Síntoma Presente", "¡El Tiempo es Cerebro! Código Ictus inmediato, neuroimagen (TC/RM), vía de trombolisis / trombectomía.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_fast.pdf"))

if __name__ == "__main__":
    run()
