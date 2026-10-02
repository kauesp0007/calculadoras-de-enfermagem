# -*- coding: utf-8 -*-
"""e28.py: Spanish Scale 48 - Perroca Patient Classification System"""
import os
from engine_es import FormPDFEngineES

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\ES"

def run():
    print("Compiling Spanish Scale 48: Perroca...")
    e = FormPDFEngineES("SISTEMA DE CLASIFICACIÓN DE PACIENTES DE PERROCA", "Valoración de la Complejidad del Cuidado de Enfermería y Dotación de Personal", "36 puntos (9 a 36)", "Perroca MG. Rev Esc Enferm USP, 2011;45(2):413-421.")
    e.layout_mode = "single"
    e.extra_css = ".table-eval td { padding: 2.7px 6px !important; font-size: 7.3pt !important; } .opt-item { margin-bottom: 1px !important; font-size: 7.2pt !important; } .sec-title { margin: 4px 0 2px !important; }"
    e.add_table_section("NUEVE DOMINIOS DE COMPLEJIDAD DEL CUIDADO DE ENFERMERÍA", [
        (("1. Planificación de Cuidados", "Coordinación y proceso de enfermería"), [("Protocolo estandarizado de planta (1)", 1), ("Coordinación moderada requerida (2)", 2), ("Plan de enfermería individualizado complejo (3)", 3), ("Coordinación intensiva multiequipo (4)", 4)]),
        (("2. Investigación y Monitorización", "Signos vitales y vigilancia clínica"), [("Monitorización de rutina c/8h (1)", 1), ("Monitorización c/6h (2)", 2), ("Monitorización c/4h / ECG continuo (3)", 3), ("Monitorización invasiva continua / hemodinámica (4)", 4)]),
        (("3. Higiene Corporal", "Dependencia en higiene y autocuidado"), [("Autocuidado independiente (1)", 1), ("Ducha / baño asistido (2)", 2), ("Baño en cama por 1 enfermero/a (3)", 3), ("Baño en cama que requiere 2+ enfermeros/as (4)", 4)]),
        (("4. Nutrición e Hidratación", "Método de ingesta nutricional"), [("Alimentación oral independiente (1)", 1), ("Alimentación oral asistida (2)", 2), ("Nutrición enteral por sonda/estoma (3)", 3), ("Nutrición parenteral total (NPT) (4)", 4)]),
        (("5. Eliminación", "Control de esfínteres y cuidados"), [("Uso del inodoro independiente (1)", 1), ("Asistencia para cuña / orinal (2)", 2), ("Incontinente / cambios de pañal (3)", 3), ("Sonda vesical / irrigación de ostomía (4)", 4)]),
        (("6. Locomoción / Actividad", "Movilidad en cama y planta"), [("Camina independientemente (1)", 1), ("Camina con ayuda / personal (2)", 2), ("Transferencias a silla / silla de ruedas (3)", 3), ("Encamado/a / transferencias dependientes (4)", 4)]),
        (("7. Integridad Cutáneo-Mucosa", "Cuidado de heridas y curaciones"), [("Piel intacta / limpia (1)", 1), ("Lesión Grado 1-2 / curación 1x al día (2)", 2), ("Curación extensa 2x al día (3)", 3), ("Curación de herida compleja ≥3x al día (4)", 4)]),
        (("8. Terapéutica", "Complejidad del tratamiento medicamentoso"), [("Medicamentos orales únicamente (1)", 1), ("Fármacos IV / IM intermitentes (2)", 2), ("Infusiones IV continuas (3)", 3), ("Drogas vasoactivas / quimioterapia (4)", 4)]),
        (("9. Apoyo Emocional", "Interacción psicosocial"), [("Calmado/a, receptivo/a (1)", 1), ("Ansioso/a, requiere contención (2)", 2), ("Agitado/a, poco colaborador/a (3)", 3), ("Crisis severa / conflictivo/a (4)", 4)])
    ])
    e.set_risk_stratification([
        ("Cuidados Mínimos", "9 - 13 puntos", "Paciente autónomo en condición estable. Dotación básica de enfermería.", "green"),
        ("Cuidados Intermedios", "14 - 20 puntos", "Dependencia moderada para higiene y administración de medicación.", "green"),
        ("Alta Dependencia", "21 - 26 puntos", "Elevada carga de trabajo, inestabilidad clínica parcial.", "yellow"),
        ("Cuidados Semi-Intensivos", "27 - 31 puntos", "Atención intermedia, alto riesgo de descompensación aguda.", "orange"),
        ("Cuidados Intensivos", "32 - 36 puntos", "Atención crítica total, soporte multiorgánico, enfermería continua 1:1 o 1:2.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_perroca.pdf"))

if __name__ == "__main__":
    run()
