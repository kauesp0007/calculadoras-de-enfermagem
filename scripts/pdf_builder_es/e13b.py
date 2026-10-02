# -*- coding: utf-8 -*-
"""e13b.py: Spanish Scale 21 - ELPO Scale"""
import os
from engine_es import FormPDFEngineES

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\ES"

def run():
    print("Compiling Spanish Scale 21: ELPO...")
    e = FormPDFEngineES("ESCALA ELPO", "Evaluación del Riesgo de Lesiones por Posicionamiento Quirúrgico", "35 puntos (7 a 35)", "Menezes S, et al. Rev Lat Am Enfermagem, 2013;21(6):1298-1305.")
    e.add_table_section("SIETE FACTORES DE RIESGO PERIOPERATORIOS", [
        (("1. Posición Quirúrgica", "Postura quirúrgica principal"), [("Decúbito supino", 1), ("Decúbito prono", 2), ("Decúbito lateral", 3), ("Litotomía / Trendelenburg", 4)]),
        (("2. Tiempo de Cirugía", "Duración total en quirófano"), [("≤ 1 hora", 1), ("1 - 2 horas", 2), ("2 - 4 horas", 3), ("4 - 6 horas", 4), ("> 6 horas", 5)]),
        (("3. Tipo de Anestesia", "Técnica anestésica empleada"), [("Local / Sedación", 1), ("Regional (Raquídea/Epidural)", 2), ("Anestesia general", 3), ("Combinada general + regional", 4)]),
        (("4. Superficie de Soporte", "Colchón y almohadillado"), [("Colchón viscoelástico / Gel", 1), ("Colchón de espuma", 2), ("Mesa quirúrgica estándar sin protección adicional", 3)]),
        (("5. Posición de Extremidades", "Angulación de miembros"), [("Anatómica (≤ 90°)", 1), ("Brazos extendidos > 90°", 2), ("Miembros flexionados / elevados", 3)]),
        (("6. Comorbilidades", "Condiciones médicas de base"), [("Ninguna", 1), ("Enfermedad vascular / Diabetes", 2), ("Desnutrición / Obesidad", 3), ("Múltiples comorbilidades", 4)]),
        (("7. Edad del Paciente", "Categoría de edad de riesgo"), [("18 - 39 años", 1), ("40 - 59 años", 2), ("60 - 79 años", 3), ("≥ 80 años / Pediátrico", 4)])
    ])
    e.set_risk_stratification([
        ("Riesgo Bajo de Lesión", "≤ 19 puntos", "Cuidados perioperatorios estándar, apoyabrazos acolchados, alineación neutra.", "green"),
        ("Riesgo Alto de Lesión", "≥ 20 puntos", "Protectores de gel de redistribución de presión, protectores nerviosos, revisión frecuente.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_elpo.pdf"))

if __name__ == "__main__":
    run()
