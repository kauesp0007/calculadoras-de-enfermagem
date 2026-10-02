# -*- coding: utf-8 -*-
"""e23.py: Spanish Scale 39 - MoCA Test with SVG graphics"""
import os
from engine_es import FormPDFEngineES
from moca_svg_es import VIS_HTML, NAMING_HTML

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\ES"

def run():
    print("Compiling Spanish Scale 39: MoCA...")
    e = FormPDFEngineES("EVALUACIÓN COGNITIVA DE MONTREAL (MoCA)", "Cribado Rápido para el Deterioro Cognitivo Leve y Demencia Temprana", "30 puntos", "Nasreddine ZS, et al. J Am Geriatr Soc, 2005;53(4):695-699.")
    e.extra_css = ".sec-title { margin: 3px 0 1px !important; } .table-eval td { padding: 2.8px 5px !important; font-size: 7.1pt !important; } .patient-box { margin-bottom: 4px !important; } .score-box-wrap { margin: 5px 0 !important; }"
    
    e.add_raw_html_section(VIS_HTML)
    e.add_raw_html_section(NAMING_HTML)

    e.add_table_section("3. MEMORIA Y ATENCIÓN (REGISTRO Y 6 PUNTOS)", [
        ("Memoria (Leer 5 palabras, 2 intentos)", [("Rostro [ ] Terciopelo [ ] Iglesia [ ] Margarito [ ] Rojo [ ]", 0)]),
        ("Dígitos Directos e Inversos", [("Directos (2-1-8-5-4) [ ] (1 pt) | Inversos (7-4-2) [ ] (1 pt)", 2)]),
        ("Vigilancia (Dar golpecito en la letra 'A')", [("FBACMNAAJKLBAFAWDA (1 pt si ≤ 1 error) [ ]", 1)]),
        ("Serie de 7 Restados (desde 100)", [("4-5 correctos (3 pts) | 2-3 correctos (2 pts) | 1 correcto (1 pt) [ ]", 3)])
    ])

    e.add_table_section("4. LENGUAJE, ABSTRACCIÓN, RECUERDO DIFERIDO Y ORIENTACIÓN (16 PUNTOS)", [
        ("Repetición de Frases", [("2 frases complejas repetidas exactamente [ ]", 2)]),
        ("Fluidez Verbal (Letra 'P')", [("≥ 11 palabras en 60 segundos [ ]", 1)]),
        ("Abstracción (Semejanza de categoría)", [("Tren-Bicicleta [ ] | Reloj-Regla [ ]", 2)]),
        ("Recuerdo Diferido (5 Palabras)", [("Rostro [ ] Terciopelo [ ] Iglesia [ ] Margarito [ ] Rojo [ ] (1 pt c/u)", 5)]),
        ("Orientación (Tiempo y Lugar)", [("Fecha [ ] Mes [ ] Año [ ] Día [ ] Lugar [ ] Ciudad [ ] (1 pt c/u)", 6)])
    ])

    e.set_risk_stratification([
        ("Cognición Normal", "26 - 30 puntos", "Perfil cognitivo normal (añadir 1 pt si ≤ 12 años de escolaridad formal, máx. 30).", "green"),
        ("Deterioro Cognitivo Leve", "18 - 25 puntos", "Alta sensibilidad para DCL temprano. Estudio neurocognitivo completo.", "yellow"),
        ("Deterioro Moderado", "10 - 17 puntos", "Déficit cognitivo significativo. Supervisión de seguridad y apoyo al cuidador.", "orange"),
        ("Deterioro Severo", "< 10 puntos", "Demencia severa. Dependencia funcional total, cuidados 24 horas.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_moca.pdf"))

if __name__ == "__main__":
    run()
