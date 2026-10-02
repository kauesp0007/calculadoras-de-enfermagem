# -*- coding: utf-8 -*-
"""e16.py: Spanish Scale 26 - Fugulin Patient Classification System"""
import os
from engine_es import FormPDFEngineES

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\ES"

def run():
    print("Compiling Spanish Scale 26: Fugulin...")
    e = FormPDFEngineES("SISTEMA DE CLASIFICACIÓN DE PACIENTES DE FUGULIN (SCP)", "Evaluación de la Dependencia de Enfermería y Cargas de Trabajo", "36 puntos (9 a 36)", "Fugulin FMT, et al. Rev Esc Enferm USP, 2005;39(1):26-34.")
    e.layout_mode = "single"
    e.extra_css = ".table-eval td { padding: 2.7px 6px !important; font-size: 7.3pt !important; } .opt-item { margin-bottom: 1px !important; font-size: 7.2pt !important; } .sec-title { margin: 4px 0 2px !important; }"
    e.add_table_section("NUEVE ÁREAS DE EVALUACIÓN DE CUIDADOS DE ENFERMERÍA", [
        (("1. Estado Mental", "Sensorio y orientación cognitiva"), [("Orientado/a en tiempo y espacio (1)", 1), ("Desorientación en periodos / somnoliento (2)", 2), ("Confusión continua / delirium agudo (3)", 3), ("Comatoso/a / sin respuesta (4)", 4)]),
        (("2. Oxigenación", "Requerimiento de soporte ventilatorio"), [("Aire ambiente / sin O2 (1)", 1), ("Oxígeno intermitente por mascarilla/cánula (2)", 2), ("Oxigenoterapia continua (3)", 3), ("Ventilación mecánica / CPAP (4)", 4)]),
        (("3. Signos Vitales", "Frecuencia de monitorización"), [("Monitorización de rutina c/8h (1)", 1), ("Monitorización c/6h (2)", 2), ("Monitorización c/4h (3)", 3), ("Monitorización c/2h o continua (4)", 4)]),
        (("4. Motilidad", "Movimiento físico en cama"), [("Mueve todas las extremidades activamente (1)", 1), ("Movimiento de extremidades limitado (2)", 2), ("Necesita ayuda para cambios posturales (3)", 3), ("Completamente encamado/a / inmóvil (4)", 4)]),
        (("5. Deambulación", "Capacidad para caminar"), [("Camina de forma independiente (1)", 1), ("Camina con ayuda de personal/dispositivo (2)", 2), ("En silla de ruedas / sillón (3)", 3), ("Confinamiento estricto en cama (4)", 4)]),
        (("6. Alimentación", "Método de ingesta nutricional"), [("Se alimenta solo/a de forma independiente (1)", 1), ("Necesita asistencia para comer (2)", 2), ("Nutrición enteral por sonda (SNG/PEG) (3)", 3), ("Nutrición parenteral total (NPT) (4)", 4)]),
        (("7. Cuidado Corporal", "Baño e higiene personal"), [("Autobaño / ducha independiente (1)", 1), ("Ducha / baño asistido (2)", 2), ("Baño en cama realizado por 1 enfermero/a (3)", 3), ("Baño en cama que requiere 2+ enfermeros/as (4)", 4)]),
        (("8. Eliminación", "Control de esfínteres y dispositivos"), [("Uso del inodoro independiente (1)", 1), ("Asistencia para cuña / orinal (2)", 2), ("Incontinente / uso de pañal (3)", 3), ("Sonda vesical / irrigación de ostomía (4)", 4)]),
        (("9. Terapéutica", "Vía de administración de medicamentos"), [("Medicamentos orales únicamente (1)", 1), ("Fármacos IV / IM / SC intermitentes (2)", 2), ("Infusiones intravenosas continuas (3)", 3), ("Drogas vasoactivas / quimioterapia (4)", 4)])
    ])
    e.set_risk_stratification([
        ("Cuidados Mínimos", "9 - 14 pts", "Paciente autosuficiente. Cuidados de enfermería generales de rutina.", "green"),
        ("Cuidados Intermedios", "15 - 20 pts", "Dependencia parcial para higiene y medicación. Asistencia regular.", "green"),
        ("Alta Dependencia", "21 - 26 pts", "Elevada carga de enfermería, inestabilidad parcial, controles frecuentes.", "yellow"),
        ("Cuidados Semi-Intensivos", "27 - 31 pts", "Alto riesgo de inestabilidad, nivel paso previo a cuidados intensivos.", "orange"),
        ("Cuidados Intensivos", "32 - 36 pts", "Dependencia crítica total, soporte vital, enfermería continua 1:1 o 1:2.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_fugulin.pdf"))

if __name__ == "__main__":
    run()
