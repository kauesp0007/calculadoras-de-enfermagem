# -*- coding: utf-8 -*-
"""e06.py: Spanish Scale 7 - Berg Balance Scale"""
import os
from engine_es import FormPDFEngineES

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\ES"

def run():
    print("Compiling Spanish Scale 7: Berg...")
    e = FormPDFEngineES("ESCALA DE EQUILIBRIO DE BERG (BBS)", "Evaluación Clínica de la Función del Equilibrio y Riesgo de Caídas", "56 puntos", "Berg KO, et al. Physiother Can, 1989;41(6):304-311.")
    e.layout_mode = "double_col"
    e.extra_css = """
    .cols-2 { gap: 5mm !important; }
    .card-param { border: 1px solid #CBD5E1; border-radius: 4px; padding: 3px 5px; margin-bottom: 3.5px; font-size: 7pt; background: #fff; }
    .card-param-title { font-weight: 700; color: #1A3E74; margin-bottom: 1.5px; }
    .card-opt { display: flex; align-items: flex-start; gap: 4px; margin-bottom: 1px; line-height: 1.18; font-size: 6.8pt; }
    .card-opt:last-child { margin-bottom: 0; }
    """
    col1 = '<div class="sec-title">1. PRUEBAS EN SEDESTACIÓN Y BIDEPESTACIÓN</div>'
    items1 = [
        ("1. De Sedestación a Bipedestación", [("Necesita asistencia (0)", 0), ("Asistencia mínima (1)", 1), ("Utiliza manos (2)", 2), ("Independiente (4)", 4)]),
        ("2. Bipedestación Sin Apoyo", [("Incapaz (0)", 0), ("Se mantiene 30s (2)", 2), ("Se mantiene 2 min supervisado (3)", 3), ("Se mantiene 2 min seguro (4)", 4)]),
        ("3. Sedestación Sin Apoyo", [("Incapaz (0)", 0), ("Se mantiene 30s (2)", 2), ("Se mantiene 2 min supervisado (3)", 3), ("Se mantiene 2 min seguro (4)", 4)]),
        ("4. De Bipedestación a Sedestación", [("Necesita asistencia (0)", 0), ("Aterrizaje no controlado (1)", 1), ("Usa parte posterior de piernas (2)", 2), ("Se sienta de forma segura (4)", 4)]),
        ("5. Transferencias", [("Necesita 2 personas (0)", 0), ("Necesita 1 persona (1)", 1), ("Necesita indicación verbal (2)", 2), ("Independiente seguro (4)", 4)]),
        ("6. Bipedestación con Ojos Cerrados", [("Necesita asistencia (0)", 0), ("Incapaz de mantener 3s (1)", 1), ("Se mantiene 3s (2)", 2), ("Se mantiene 10s seguro (4)", 4)]),
        ("7. Bipedestación con Pies Juntos", [("Necesita asistencia (0)", 0), ("Incapaz de mantener 15s (1)", 1), ("Supervisión 1 min (3)", 3), ("Se mantiene 1 min seguro (4)", 4)])
    ]
    for p_title, opts in items1:
        col1 += f'<div class="card-param"><div class="card-param-title">{p_title}</div>'
        for opt, pts in opts:
            col1 += f'<div class="card-opt"><span class="sq"></span> {opt} <b>({pts})</b></div>'
        col1 += '</div>'

    col2 = '<div class="sec-title">2. PRUEBAS DE EQUILIBRIO DINÁMICO</div>'
    items2 = [
        ("8. Alcance Anterior con Brazo", [("Necesita asistencia (0)", 0), ("Alcanza < 5cm (1)", 1), ("Alcanza > 12cm (3)", 3), ("Alcanza > 25cm seguro (4)", 4)]),
        ("9. Recoger Objeto del Suelo", [("Incapaz (0)", 0), ("Supervisión (1)", 1), ("Con dificultad (3)", 3), ("Recoge objeto seguro (4)", 4)]),
        ("10. Giro para Mirar Atrás", [("Necesita asistencia (0)", 0), ("Supervisión (1)", 1), ("Un solo lado (2)", 2), ("Mira a ambos lados seguro (4)", 4)]),
        ("11. Giro de 360 Grados", [("Necesita asistencia (0)", 0), ("Tarda > 4s (2)", 2), ("Gira seguro ≤ 4s en ambos sentidos (4)", 4)]),
        ("12. Peldaño Dinámico Alternante", [("Necesita asistencia (0)", 0), ("< 2 peldaños (1)", 1), ("4 peldaños (2)", 2), ("8 peldaños ≤ 20s seguro (4)", 4)]),
        ("13. Bipedestación en Tándem", [("Necesita asistencia (0)", 0), ("Paso corto 30s (1)", 1), ("Independiente tándem 30s seguro (4)", 4)]),
        ("14. Bipedestación sobre Un Pie", [("Incapaz (0)", 0), ("Mantiene < 3s (1)", 1), ("Mantiene 5-10s (3)", 3), ("Mantiene > 10s seguro (4)", 4)])
    ]
    for p_title, opts in items2:
        col2 += f'<div class="card-param"><div class="card-param-title">{p_title}</div>'
        for opt, pts in opts:
            col2 += f'<div class="card-opt"><span class="sq"></span> {opt} <b>({pts})</b></div>'
        col2 += '</div>'

    e.add_raw_html_section(f'<div class="cols-2"><div>{col1}</div><div>{col2}</div></div>')
    e.set_risk_stratification([
        ("Riesgo Alto de Caída", "0-20 pts", "Usuario de silla de ruedas / 100% riesgo de caída. Asistencia total y protocolo de prevención.", "red"),
        ("Riesgo Moderado", "21-40 pts", "Deambulación asistida (andador/bastón), entrenamiento de marcha por fisioterapia.", "yellow"),
        ("Riesgo Bajo de Caída", "41-56 pts", "Deambulación independiente; mantener actividad y precauciones ambientales.", "green")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_berg.pdf"))

if __name__ == "__main__":
    run()
