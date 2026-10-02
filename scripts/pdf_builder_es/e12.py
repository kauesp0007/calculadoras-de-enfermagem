# -*- coding: utf-8 -*-
"""e12.py: Spanish Scales 18 and 19 (gds, downton)"""
import os
from engine_es import FormPDFEngineES

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\ES"

def run():
    print("Compiling Spanish Scales 18 and 19...")
    # 18. GDS-15
    e = FormPDFEngineES("ESCALA DE DEPRESIÓN GERIÁTRICA DE YESAVAGE (GDS-15)", "Cribado de Depresión en Adultos Mayores (Forma Abreviada)", "15 puntos", "Sheikh JI, Yesavage JA. Clin Gerontol, 1986;5(1-2):165-173.")
    e.layout_mode = "double_col"
    e.extra_css = ".table-eval-col2 td { padding: 6.5px 7px !important; font-size: 7.5pt !important; } .sec-title { margin: 6px 0 3px !important; }"
    e.add_table_section("PREGUNTAS 1 A 8", [
        ("1. ¿Está básicamente satisfecho/a con su vida?", [("Sí (0)", 0), ("No (1)", 1)]),
        ("2. ¿Ha dejado muchas actividades e intereses?", [("No (0)", 0), ("Sí (1)", 1)]),
        ("3. ¿Siente que su vida está vacía?", [("No (0)", 0), ("Sí (1)", 1)]),
        ("4. ¿Se aburre a menudo?", [("No (0)", 0), ("Sí (1)", 1)]),
        ("5. ¿Está de buen ánimo la mayor parte del tiempo?", [("Sí (0)", 0), ("No (1)", 1)]),
        ("6. ¿Teme que le vaya a pasar algo malo?", [("No (0)", 0), ("Sí (1)", 1)]),
        ("7. ¿Se siente feliz la mayor parte del tiempo?", [("Sí (0)", 0), ("No (1)", 1)]),
        ("8. ¿Se siente a menudo indefenso/a?", [("No (0)", 0), ("Sí (1)", 1)])
    ])
    e.add_table_section("PREGUNTAS 9 A 15", [
        ("9. ¿Prefiere quedarse en casa a salir?", [("No (0)", 0), ("Sí (1)", 1)]),
        ("10. ¿Siente que tiene más problemas de memoria?", [("No (0)", 0), ("Sí (1)", 1)]),
        ("11. ¿Cree que es maravilloso estar vivo/a ahora?", [("Sí (0)", 0), ("No (1)", 1)]),
        ("12. ¿Se siente inútil tal como está ahora?", [("No (0)", 0), ("Sí (1)", 1)]),
        ("13. ¿Se siente lleno/a de energía?", [("Sí (0)", 0), ("No (1)", 1)]),
        ("14. ¿Siente que su situación es desesperada?", [("No (0)", 0), ("Sí (1)", 1)]),
        ("15. ¿Cree que la mayoría está mejor que usted?", [("No (0)", 0), ("Sí (1)", 1)])
    ])
    e.add_raw_html_section('''
    <div class="visual-box" style="margin-top:6px; font-size:7.2pt; line-height:1.28; text-align:left;">
        <b>Guía de Administración:</b> Preguntar cómo se ha sentido la persona durante la última semana. Respuestas Sí o No.
        Las respuestas que otorgan 1 punto indican sintomatología depresiva. Puntuaciones ≥ 5 justifican evaluación clínica integral.
    </div>
    ''')
    e.set_risk_stratification([
        ("Normal / Sin Depresión", "0 - 4 puntos", "Síntomas depresivos poco probables. Seguimiento habitual del envejecimiento saludable.", "green"),
        ("Sugerente de Depresión Leve", "5 - 9 puntos", "Valoración por médico de atención primaria, fomentar participación social.", "yellow"),
        ("Sugerente de Depresión Severa", "10 - 15 puntos", "Alta probabilidad de depresión mayor. Evaluación psicogeriátrica especializada.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_gds.pdf"))

    # 19. Downton
    e = FormPDFEngineES("ÍNDICE DE DOWNTON DE RIESGO DE CAÍDAS", "Evaluación del Riesgo de Caídas en Pacientes Adultos y Geriátricos Hospitalizados", "14 puntos (Riesgo si > 2)", "Downton JH. St. Michael's Hospital, 1993.")
    e.add_table_section("CINCO MÓDULOS DE RIESGO", [
        (("1. Caídas Previas", "Historial de caídas en los últimos 12 meses"), [("Sin caídas previas en los últimos 12 meses", 0), ("Sí: Ha sufrido una o más caídas en los últimos 12 meses", 1)]),
        (("2. Medicamentos", "Prescripción de fármacos de riesgo (1 pt por categoría)"), [("Ninguno de los medicamentos de riesgo indicados", 0), ("Tranquilizantes / Sedantes / Hipnóticos", 1), ("Diuréticos", 1), ("Antihipertensivos", 1), ("Antiparkinsonianos", 1), ("Antidepresivos", 1)]),
        (("3. Déficits Sensoriales", "Alteraciones sensoriales que afectan el equilibrio"), [("Ninguno: Visión, audición y movilidad normales", 0), ("Déficit visual / Ceguera", 1), ("Déficit auditivo / Sordera", 1), ("Paresia / Extremidad afecta / Amputación", 1)]),
        (("4. Estado Mental", "Orientación cognitiva y conciencia de limitaciones"), [("Orientado: Conciencia intacta de su entorno y límites", 0), ("Confuso / Desorientado / Agitado / Impulsivo", 1)]),
        (("5. Deambulación / Marcha", "Estabilidad al caminar y calidad de la marcha"), [("Normal: Marcha segura, paso regular", 0), ("Segura con ayuda (bastón, andador, muletas)", 1), ("Insegura con o sin ayuda (titubeante, inestable)", 1), ("Incapaz de caminar / Encamado/a completo", 0)])
    ])
    e.set_risk_stratification([
        ("Riesgo Bajo de Caída", "0 - 2 puntos", "Precauciones universales de caídas, timbre al alcance, calzado antideslizante.", "green"),
        ("Riesgo Alto de Caída", "> 2 puntos", "Protocolo de alto riesgo: pulsera identificativa, timbre de cama, transferencias supervisadas.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_downton.pdf"))

if __name__ == "__main__":
    run()
