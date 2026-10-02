# -*- coding: utf-8 -*-
"""e05.py: Spanish Scale 6 - Barthel Index"""
import os
from engine_es import FormPDFEngineES

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\ES"

def run():
    print("Compiling Spanish Scale 6: Barthel...")
    e = FormPDFEngineES("ÍNDICE DE BARTHEL", "Evaluación de la Independencia Funcional en Actividades Básicas de la Vida Diaria (ABVD)", "100 puntos", "Mahoney FI, Barthel DW. Md State Med J, 1965;14:61-65.")
    e.layout_mode = "single"
    e.extra_css = ".table-eval td { padding: 4.2px 7px !important; font-size: 7.5pt !important; } .opt-item { margin-bottom: 1.5px !important; font-size: 7.4pt !important; }"
    e.add_table_section("DIEZ ACTIVIDADES BÁSICAS DE LA VIDA DIARIA", [
        (("1. Comer", "Alimentación e ingesta"), [("Incapaz (0)", 0), ("Necesita ayuda para cortar carne, untar pan (5)", 5), ("Independiente para comer (10)", 10)]),
        (("2. Lavarse / Bañarse", "Higiene personal"), [("Dependiente (0)", 0), ("Independiente para bañarse o ducharse (5)", 5)]),
        (("3. Vestirse", "Aseo y vestimenta"), [("Dependiente (0)", 0), ("Necesita ayuda pero realiza al menos la mitad (5)", 5), ("Independiente con botones, cremalleras (10)", 10)]),
        (("4. Arreglarse", "Cuidado personal, peinado, afeitado"), [("Necesita ayuda con el aseo personal (0)", 0), ("Independiente para lavarse la cara, peinarse, afeitarse (5)", 5)]),
        (("5. Deposición (Heces)", "Control esfinteriano anal"), [("Incontinente / requiere enemas (0)", 0), ("Accidente ocasional una vez por semana (5)", 5), ("Continente (10)", 10)]),
        (("6. Micción (Orina)", "Control esfinteriano vesical"), [("Incontinente / sondado e incapaz (0)", 0), ("Accidente ocasional un máximo de 1 vez en 24h (5)", 5), ("Continente (10)", 10)]),
        (("7. Uso del Retrete", "Uso del inodoro o cuña"), [("Dependiente (0)", 0), ("Necesita alguna ayuda para quitarse ropa, limpiarse (5)", 5), ("Independiente (10)", 10)]),
        (("8. Trasladarse Bed-Silla", "Transferencias cama-silla"), [("Incapaz, sin equilibrio sentado (0)", 0), ("Gran ayuda (2 personas), capaz de estar sentado (5)", 5), ("Mínima ayuda (1 persona) (10)", 10), ("Independiente (15)", 15)]),
        (("9. Deambulación", "Desplazamiento en plano"), [("Inmóvil / < 50 metros (0)", 0), ("Independiente en silla de ruedas > 50m (5)", 5), ("Camina con ayuda de 1 persona > 50m (10)", 10), ("Independiente > 50m (15)", 15)]),
        (("10. Escalones", "Subir y bajar escaleras"), [("Incapaz (0)", 0), ("Necesita ayuda física o verbal (5)", 5), ("Independiente para subir y bajar (10)", 10)])
    ])
    e.set_risk_stratification([
        ("Dependencia Total", "0-20 pts", "Atención de enfermería completa en ABVD. Elevado riesgo de UPP y caídas.", "red"),
        ("Dependencia Severa", "21-60 pts", "Asistencia de enfermería sustancial requerida para movilidad y autocuidado.", "orange"),
        ("Dependencia Moderada", "61-90 pts", "Asistencia en tareas específicas. Elevado potencial de rehabilitación.", "yellow"),
        ("Independiente", "91-100 pts", "Mínima o nula asistencia requerida. Capacidad funcional autónoma.", "green")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_barthel.pdf"))

if __name__ == "__main__":
    run()
