# -*- coding: utf-8 -*-
"""e20.py: Spanish Scales 33 and 34 (katz, lachs)"""
import os
from engine_es import FormPDFEngineES

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\ES"

def run():
    print("Compiling Spanish Scales 33 and 34...")
    # 33. Katz
    e = FormPDFEngineES("ÍNDICE DE KATZ", "Evaluación de la Independencia en Actividades Básicas de la Vida Diaria", "6 puntos (0 a 6)", "Katz S, et al. JAMA, 1963;185(12):914-919.")
    e.add_table_section("SEIS DOMINIOS BÁSICOS DE AUTOCUIDADO", [
        (("1. Baño / Lavado", "Higiene corporal"), [("Independiente: Se baña solo/a completamente o necesita ayuda sólo para una parte", 1), ("Dependiente: Necesita ayuda para lavar más de una parte o incapaz", 0)]),
        (("2. Vestido", "Elección y colocación de ropa"), [("Independiente: Coge la ropa y se viste completamente (puede necesitar atarse zapatos)", 1), ("Dependiente: Necesita ayuda para vestirse o permanece desvestido/a", 0)]),
        (("3. Uso del Retrete", "Ir al inodoro y aseo intimo"), [("Independiente: Va al retrete, se sienta/levanta, se arregla la ropa y se limpia", 1), ("Dependiente: Necesita cuña, orinal o ayuda para limpiarse y vestirse", 0)]),
        (("4. Movilidad / Transferencias", "Desplazamiento cama-silla"), [("Independiente: Se levanta y acuesta de la cama y se sienta/levanta de la silla solo/a", 1), ("Dependiente: Necesita ayuda humana o mecánica para trasladarse", 0)]),
        (("5. Continencia", "Control esfinteriano vesical y anal"), [("Independiente: Control completo de la micción y defecación", 1), ("Dependiente: Incontinencia parcial o total de orina o heces", 0)]),
        (("6. Alimentación", "Llevar la comida del plato a la boca"), [("Independiente: Lleva los alimentos del plato a la boca (se permite cortar la carne)", 1), ("Dependiente: Necesita ayuda para comer o requiere nutrición enteral/parenteral", 0)])
    ])
    e.set_risk_stratification([
        ("Independencia Elevada", "6 puntos", "Independencia total en las 6 ABVD básicas. Mínima asistencia requerida.", "green"),
        ("Afectación Moderada", "3 - 5 puntos", "Dependencia parcial. Requiere asistencia de enfermería dirigida y rehabilitación.", "yellow"),
        ("Dependencia Funcional Severa", "0 - 2 puntos", "Incapacidad severa. Cuidados de enfermería diarios totales, alto riesgo de UPP.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_katz.pdf"))

    # 34. Lachs (VES-13)
    e = FormPDFEngineES("ENCUESTA VES-13 DE LACHS", "Detección de Vulnerabilidad y Riesgo de Deterioro Funcional en Adultos Mayores", "10 puntos (Riesgo si ≥ 3)", "Saliba D, et al. J Am Geriatr Soc, 2001;49(12):1691-1699.")
    e.layout_mode = "double_col"
    e.extra_css = ".table-eval-col2 td { padding: 6px 7px !important; font-size: 7.4pt !important; } .sec-title { margin: 6px 0 3px !important; }"
    e.add_table_section("1. EDAD Y SALUD PERCIBIDA", [
        ("1. Puntuación por Edad", [("< 75 años (0)", 0), ("75 - 84 años (1)", 1), ("≥ 85 años (3)", 3)]),
        ("2. Auto-evaluación de Salud", [("Buena / Excelente (0)", 0), ("Regular / Mala (1)", 1)])
    ])
    e.add_table_section("2. LIMITACIONES FUNCIONALES", [
        ("3. Agacharse, arrodillarse", [("Sin dificultad (0)", 0), ("Alguna/Mucha dificultad (1)", 1)]),
        ("4. Levantar 4.5 kg (10 lbs)", [("Sin dificultad (0)", 0), ("Alguna/Mucha dificultad (1)", 1)]),
        ("5. Alcanzar sobre hombros", [("Sin dificultad (0)", 0), ("Alguna/Mucha dificultad (1)", 1)]),
        ("6. Escribir, coger objetos", [("Sin dificultad (0)", 0), ("Alguna/Mucha dificultad (1)", 1)]),
        ("7. Caminar 400 metros", [("Sin dificultad (0)", 0), ("Alguna/Mucha dificultad (1)", 1)]),
        ("8. Tareas pesadas del hogar", [("Sin dificultad (0)", 0), ("Alguna/Mucha dificultad (1)", 1)]),
        ("9. Ir de compras", [("Sin dificultad (0)", 0), ("Necesita ayuda / Incapaz (1)", 1)]),
        ("10. Manejar el dinero", [("Sin dificultad (0)", 0), ("Necesita ayuda / Incapaz (1)", 1)]),
        ("11. Caminar por la habitación", [("Sin dificultad (0)", 0), ("Necesita ayuda / Incapaz (1)", 1)])
    ])
    e.add_raw_html_section('''
    <div class="visual-box" style="margin-top:5px; font-size:7.2pt; line-height:1.28; text-align:left;">
        <b>Regla de Puntuación:</b> Sumar puntos de Edad (0-3), Salud Percibida (0-1), Limitaciones Físicas (máx 2 pts) y AIVD (máx 4 pts).
        Puntuación total de 0 a 10. Un valor ≥ 3 identifica ancianos vulnerables que requieren valoración geriátrica integral.
    </div>
    ''')
    e.set_risk_stratification([
        ("Robustez / No Vulnerable", "0 - 2 puntos", "Bajo riesgo de deterioro funcional o mortalidad a 2 años. Mantener prevención.", "green"),
        ("Anciano/a Vulnerable", "≥ 3 puntos", "Riesgo 4.2 veces mayor de deterioro funcional o muerte. Valoración Geriátrica Integral (VGI) indicada.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_lachs.pdf"))

if __name__ == "__main__":
    run()
