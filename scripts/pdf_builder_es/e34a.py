# -*- coding: utf-8 -*-
"""e34a.py: Spanish Scale 59 - Tinetti POMA Mobility Scale"""
import os
from engine_es import FormPDFEngineES

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\ES"

def run():
    print("Compiling Spanish Scale 59: Tinetti...")
    e = FormPDFEngineES("ESCALA DE TINETTI (POMA)", "Evaluación de la Marcha y el Equilibrio para la Valoración del Riesgo de Caídas", "28 puntos (Equilibrio 16 + Marcha 12)", "Tinetti ME. J Am Geriatr Soc, 1986;34(2):119-126.")
    e.layout_mode = "double_col"
    e.extra_css = ".table-eval-col2 td { padding: 10.5px 8px !important; font-size: 7.8pt !important; } .sec-title { margin: 8px 0 4px !important; }"
    e.add_table_section("1. EQUILIBRIO (16 PTS)", [
        ("Equilibrio Sentado", [("Inestable / Se desliza (0)", 0), ("Firme / Seguro (1)", 1)]),
        ("Levantarse de la Silla", [("Incapaz sin ayuda (0)", 0), ("Usa los brazos (1)", 1), ("Capaz sin usar brazos (2)", 2)]),
        ("Intentos para Levantarse", [("Incapaz sin ayuda (0)", 0), ("Varios intentos (1)", 1), ("Un solo intento (2)", 2)]),
        ("Equilibrio Inmediato", [("Inestable (0)", 0), ("Estable con apoyo (1)", 1), ("Estable sin apoyo (2)", 2)]),
        ("Equilibrio en Bipedestación", [("Inestable (0)", 0), ("Apoyo amplio (1)", 1), ("Apoyo estrecho (2)", 2)]),
        ("Empujón en Esternón (3x)", [("Empieza a caer (0)", 0), ("Se tambalea (1)", 1), ("Firme y estable (2)", 2)]),
        ("Ojos Cerrados Bipedestación", [("Inestable (0)", 0), ("Estable (1)", 1)]),
        ("Giro 360 Grados", [("Pasos discontinuos (0)", 0), ("Continuos (1)", 1), ("Inestable (0)", 0), ("Estable (1)", 1)]),
        ("Sentarse", [("Inseguro / Cae (0)", 0), ("Usa brazos (1)", 1), ("Seguro y suave (2)", 2)])
    ])
    e.add_table_section("2. MARCHA (12 PTS)", [
        ("Iniciación de la Marcha", [("Vacilación (0)", 0), ("Sin vacilación (1)", 1)]),
        ("Longitud del Paso (Der/Izq)", [("No sobrepasa pie opuesto (0)", 0), ("Sobrepasa pie opuesto (1)", 1)]),
        ("Altura del Paso (Der/Izq)", [("Arrastra el pie (0)", 0), ("Levanta el pie (1)", 1)]),
        ("Simetría del Paso", [("Pasos desiguales (0)", 0), ("Pasos iguales (1)", 1)]),
        ("Continuidad de la Marcha", [("Paradas entre pasos (0)", 0), ("Pasos continuos (1)", 1)]),
        ("Trayectoria (Pasillo 3m)", [("Desviación marcada (0)", 0), ("Desviación leve / ayuda (1)", 1), ("Línea recta (2)", 2)]),
        ("Estabilidad del Tronco", [("Balanceo marcado (0)", 0), ("Flexiona rodillas/brazos (1)", 1), ("Tronco estable (2)", 2)]),
        ("Postura al Caminar", [("Talones separados (>10cm) (0)", 0), ("Talones casi se tocan (1)", 1)])
    ])
    e.set_risk_stratification([
        ("Riesgo Bajo de Caída", "24 - 28 puntos", "Deambulación independiente. Precauciones ambientales habituales.", "green"),
        ("Riesgo Moderado", "19 - 23 puntos", "Riesgo presente. Valoración de producto de apoyo para marcha, fisioterapia.", "yellow"),
        ("Riesgo Alto de Caída", "< 19 puntos", "Riesgo 5 veces mayor de caídas. Deambulación únicamente asistida.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_tinetti.pdf"))

if __name__ == "__main__":
    run()

