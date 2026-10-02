# -*- coding: utf-8 -*-
"""e34b.py: Spanish Scale 60 - Zarit Burden Interview"""
import os
from engine_es import FormPDFEngineES

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\ES"

def run():
    print("Compiling Spanish Scale 60: Zarit...")
    e = FormPDFEngineES("ENTREVISTA DE CARGA DEL CUIDADOR DE ZARIT (ZBI-12)", "Evaluación de la Sobrecarga del Cuidador de Pacientes con Demencia", "48 puntos (0 a 48)", "Bedard M, et al. Gerontologist, 2001;41(5):652-657.")
    e.layout_mode = "double_col"
    e.extra_css = """
    .cols-2 { gap: 5mm !important; }
    .card-param { border: 1px solid #CBD5E1; border-radius: 4px; padding: 3px 5px; margin-bottom: 3.5px; font-size: 7pt; background: #fff; }
    .card-param-title { font-weight: 700; color: #1A3E74; margin-bottom: 1.5px; }
    .card-opt { display: flex; align-items: flex-start; gap: 4px; margin-bottom: 1px; line-height: 1.18; font-size: 6.8pt; }
    .card-opt:last-child { margin-bottom: 0; }
    """
    col1 = '<div class="sec-title">PARTE 1: PREGUNTAS 1 A 6</div>'
    items1 = [
        ("1. ¿Siente que el familiar pide más ayuda de la necesaria?", [("Nunca (0)", 0), ("Rara vez (1)", 1), ("A veces (2)", 2), ("Frecuentemente (3)", 3), ("Casi siempre (4)", 4)]),
        ("2. ¿Siente que no tiene suficiente tiempo para usted?", [("Nunca (0)", 0), ("Rara vez (1)", 1), ("A veces (2)", 2), ("Frecuentemente (3)", 3), ("Casi siempre (4)", 4)]),
        ("3. ¿Se siente estresado/a entre cuidar y otras tareas?", [("Nunca (0)", 0), ("Rara vez (1)", 1), ("A veces (2)", 2), ("Frecuentemente (3)", 3), ("Casi siempre (4)", 4)]),
        ("4. ¿Se siente avergonzado/a por la conducta del familiar?", [("Nunca (0)", 0), ("Rara vez (1)", 1), ("A veces (2)", 2), ("Frecuentemente (3)", 3), ("Casi siempre (4)", 4)]),
        ("5. ¿Se siente enfadado/a cuando está cerca de su familiar?", [("Nunca (0)", 0), ("Rara vez (1)", 1), ("A veces (2)", 2), ("Frecuentemente (3)", 3), ("Casi siempre (4)", 4)]),
        ("6. ¿Siente que cuidar afecta sus relaciones familiares?", [("Nunca (0)", 0), ("Rara vez (1)", 1), ("A veces (2)", 2), ("Frecuentemente (3)", 3), ("Casi siempre (4)", 4)])
    ]
    for p_title, opts in items1:
        col1 += f'<div class="card-param"><div class="card-param-title">{p_title}</div>'
        for opt, pts in opts:
            col1 += f'<div class="card-opt"><span class="sq"></span> {opt} <b>({pts})</b></div>'
        col1 += '</div>'

    col2 = '<div class="sec-title">PARTE 2: PREGUNTAS 7 A 12</div>'
    items2 = [
        ("7. ¿Tiene temor por el futuro de su familiar?", [("Nunca (0)", 0), ("Rara vez (1)", 1), ("A veces (2)", 2), ("Frecuentemente (3)", 3), ("Casi siempre (4)", 4)]),
        ("8. ¿Siente que su familiar depende totalmente de usted?", [("Nunca (0)", 0), ("Rara vez (1)", 1), ("A veces (2)", 2), ("Frecuentemente (3)", 3), ("Casi siempre (4)", 4)]),
        ("9. ¿Se siente tenso/a cuando está cerca de su familiar?", [("Nunca (0)", 0), ("Rara vez (1)", 1), ("A veces (2)", 2), ("Frecuentemente (3)", 3), ("Casi siempre (4)", 4)]),
        ("10. ¿Siente que su salud ha empeorado por cuidar?", [("Nunca (0)", 0), ("Rara vez (1)", 1), ("A veces (2)", 2), ("Frecuentemente (3)", 3), ("Casi siempre (4)", 4)]),
        ("11. ¿Siente que carece de la intimidad que desearía?", [("Nunca (0)", 0), ("Rara vez (1)", 1), ("A veces (2)", 2), ("Frecuentemente (3)", 3), ("Casi siempre (4)", 4)]),
        ("12. En general, ¿se siente sobrecargado/a al cuidar?", [("Nunca (0)", 0), ("Rara vez (1)", 1), ("A veces (2)", 2), ("Frecuentemente (3)", 3), ("Casi siempre (4)", 4)])
    ]
    for p_title, opts in items2:
        col2 += f'<div class="card-param"><div class="card-param-title">{p_title}</div>'
        for opt, pts in opts:
            col2 += f'<div class="card-opt"><span class="sq"></span> {opt} <b>({pts})</b></div>'
        col2 += '</div>'

    e.add_raw_html_section(f'<div class="cols-2"><div>{col1}</div><div>{col2}</div></div>')
    e.set_risk_stratification([
        ("Sin Sobrecarga / Sobrecarga Leve", "0 - 10 puntos", "Cuidador/a adaptado/a. Ofrecer educación sanitaria y grupos de apoyo.", "green"),
        ("Sobrecarga Moderada", "11 - 20 puntos", "Tensión moderada del cuidador. Recurso de respiro familiar, derivación a apoyo.", "yellow"),
        ("Sobrecarga Intensa / Severa", "≥ 21 puntos", "Alto riesgo de claudicación y depresión. Intervención urgente de trabajo social.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_zarit.pdf"))

if __name__ == "__main__":
    run()
