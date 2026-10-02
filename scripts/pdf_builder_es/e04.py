# -*- coding: utf-8 -*-
"""e04.py: Spanish Scale 5 - New Ballard Score"""
import os
from engine_es import FormPDFEngineES

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\ES"

def run():
    print("Compiling Spanish Scale 5: Ballard...")
    e = FormPDFEngineES("TEST DE BALLARD NUEVO", "Evaluación de la Madurez Gestacional Neonatal", "50 puntos (-10 a 50)", "Ballard JL, et al. J Pediatr, 1991;119(3):417-423.")
    e.layout_mode = "double_col"
    e.extra_css = """
    .cols-2 { gap: 4mm !important; }
    .card-param { border: 1px solid #CBD5E1; border-radius: 3px; padding: 1.2px 3.5px; margin-bottom: 1.5px; font-size: 6.6pt; background: #fff; }
    .card-param-title { font-weight: 700; color: #1A3E74; margin-bottom: 0.5px; }
    .card-opt { display: flex; align-items: flex-start; gap: 2.5px; margin-bottom: 0.5px; line-height: 1.12; font-size: 6.3pt; }
    .card-opt:last-child { margin-bottom: 0; }
    .sec-title { margin: 4px 0 2px !important; }
    """
    col1 = '<div class="sec-title">1. MADUREZ NEUROMUSCULAR</div>'
    items1 = [
        ("1. Postura", [("Extremidades extendidas (-1)", -1), ("Flexión leve de caderas/rodillas (0)", 0), ("Flexión moderada (1)", 1), ("Flexión moderada a fuerte (2)", 2), ("Piernas y brazos flexionados (3)", 3), ("Flexión completa (4)", 4)]),
        ("2. Ventana Cuadrada (Muñeca)", [(">90° ángulo (-1)", -1), ("90° ángulo (0)", 0), ("60° ángulo (1)", 1), ("45° ángulo (2)", 2), ("30° ángulo (3)", 3), ("0° flexión completa (4)", 4)]),
        ("3. Retroceso de Brazo", [("180° sin retroceso (0)", 0), ("140-180° leve (1)", 1), ("110-140° moderado (2)", 2), ("90-110° enérgico (3)", 3), ("<90° inmediato (4)", 4)]),
        ("4. Ángulo Poplíteo", [("180° ángulo (-1)", -1), ("160° ángulo (0)", 0), ("140° ángulo (1)", 1), ("120° ángulo (2)", 2), ("100° ángulo (3)", 3), ("<90° ángulo (5)", 5)]),
        ("5. Signo de la Bufanda", [("Codo cruza el cuerpo (-1)", -1), ("Pasa línea media (0)", 0), ("En línea media (1)", 1), ("Antes de línea media (2)", 2), ("Resistencia firme (3)", 3)]),
        ("6. Talón a Oreja", [("Talón llega a oreja (-1)", -1), ("Cerca de oreja (0)", 0), ("Resistencia a 90° (1)", 1), ("Resistencia poplítea (2)", 2), ("Resistencia firme (3)", 3)])
    ]
    for p_title, opts in items1:
        col1 += f'<div class="card-param"><div class="card-param-title">{p_title}</div>'
        for opt, pts in opts:
            col1 += f'<div class="card-opt"><span class="sq"></span> {opt} <b>({pts})</b></div>'
        col1 += '</div>'

    col2 = '<div class="sec-title">2. MADUREZ FÍSICA</div>'
    items2 = [
        ("7. Textura de la Piel", [("Pegajosa, frágil, transparente (-1)", -1), ("Gelatinosa, roja, translúcida (0)", 0), ("Rosada lisa, venas visibles (1)", 1), ("Descamación superficial (2)", 2), ("Grietas, zonas pálidas (3)", 3), ("Pergamino, grietas profundas (4)", 4)]),
        ("8. Lanugo", [("Ausente (-1)", -1), ("Escaso (0)", 0), ("Abundante (1)", 1), ("Fino / calvas (2)", 2), ("Zonas calvas (3)", 3), ("Casi sin lanugo (4)", 4)]),
        ("9. Superficie Plantar", [("Talón-dedo 40-50mm (-1)", -1), (">50mm sin pliegues (0)", 0), ("Marcas rojas tenues (1)", 1), ("Pliegue transversal ant (2)", 2), ("Pliegues 2/3 ant (3)", 3), ("Pliegues en toda la planta (4)", 4)]),
        ("10. Mama / Areola", [("Imperceptible (-1)", -1), ("Apenas perceptible (0)", 0), ("Areola plana, sin botón (1)", 1), ("Areola punteada 1-2mm (2)", 2), ("Areola elevada 3-4mm (3)", 3), ("Areola completa 5-10mm (4)", 4)]),
        ("11. Ojo / Oreja", [("Párpados fusionados (-1)", -1), ("Párpados abiertos, oreja plana (0)", 0), ("Pabellón ligeramente curvado (1)", 1), ("Bien curvado, blando (2)", 2), ("Formado y firme (3)", 3), ("Cartílago grueso (4)", 4)]),
        ("12. Genitales (M/F)", [("Escroto plano / Clítoris prominente (-1)", -1), ("Escroto vacío, pliegues tenues (0)", 0), ("Testículos en canal sup (1)", 1), ("Testículos descendiendo (2)", 2), ("Testículos abajo, pliegues (3)", 3), ("Péndulos / Labios mayores cubren (4)", 4)])
    ]
    for p_title, opts in items2:
        col2 += f'<div class="card-param"><div class="card-param-title">{p_title}</div>'
        for opt, pts in opts:
            col2 += f'<div class="card-opt"><span class="sq"></span> {opt} <b>({pts})</b></div>'
        col2 += '</div>'

    e.add_raw_html_section(f'<div class="cols-2"><div>{col1}</div><div>{col2}</div></div>')
    e.set_risk_stratification([
        ("Prematuro Extremo", "-10 a 10 pts", "20-28 semanas. Incubadora UCIN, surfactante, protocolo de mínima manipulación.", "red"),
        ("Prematuro Moderado", "15 a 30 pts", "30-36 semanas. Control térmico, soporte de alimentación, fototerapia.", "yellow"),
        ("Término / Postérmino", "35 a 50 pts", "38-44 semanas. Alojamiento conjunto, tamizaje de rutina, apoyo a lactancia.", "green")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_ballard.pdf"))

if __name__ == "__main__":
    run()
