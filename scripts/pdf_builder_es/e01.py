# -*- coding: utf-8 -*-
"""e01.py: Scale 1 - Aldrete (Spanish)"""
import os
from engine_es import FormPDFEngineES

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\ES"

def run():
    print("Compiling Scale 01: Aldrete (ES)...")
    e = FormPDFEngineES("ESCALA DE ALDRETE Y KROULIK (URPA)", "Sistema de Puntuación de Recuperación Postanestésica para el Alta Segura", "10 puntos", "Aldrete JA, Kroulik D. Anesth Analg, 1970;49(6):924-934.")
    e.add_table_section("2. CRITERIOS DE EVALUACIÓN CLÍNICA", [
        (("1. Actividad Motora", "Movimiento voluntario o bajo orden de extremidades"), [("Mueve 4 extremidades voluntariamente o bajo orden", 2), ("Mueve 2 extremidades voluntariamente o bajo orden", 1), ("Incapaz de mover extremidades voluntariamente", 0)]),
        (("2. Respiración", "Esfuerzo y patrón ventilatorio"), [("Respira profundamente y tose libremente", 2), ("Disnea, respiración superficial o limitada", 1), ("Apnea o bajo ventilación mecánica asistida", 0)]),
        (("3. Circulación (PA)", "Variación de la presión arterial respecto al basal"), [("PA dentro del ± 20% del nivel preanestésico", 2), ("PA dentro del ± 20% - 49% del nivel preanestésico", 1), ("PA dentro del ± 50% del nivel preanestésico", 0)]),
        (("4. Nivel de Conciencia", "Estado de alerta y respuesta sensorial"), [("Completamente despierto, lúcido y orientado", 2), ("Responde al llamado / somnoliento", 1), ("No responde a estímulos auditivos o táctiles", 0)]),
        (("5. Saturación de Oxígeno", "Oximetría de pulso periférica"), [("Mantiene SpO2 > 92% respirando aire ambiente", 2), ("Requiere O2 suplementario para mantener SpO2 > 90%", 1), ("SpO2 < 90% incluso con oxígeno suplementario", 0)])
    ])
    e.set_risk_stratification([
        ("9 a 10 PUNTOS: Criterio de Alta URPA", "9-10 pts", "Condiciones fisiológicas estables. Apto para traslado seguro a sala de hospitalización.", "green"),
        ("8 PUNTOS: Observación Continua", "8 pts", "Reevaluar en 15-30 minutos. Monitorizar signos vitales y mantener O2 suplementario.", "yellow"),
        ("< 8 PUNTOS: Permanencia Obligatoria", "< 8 pts", "Vigilancia intensiva estricta. Soporte de vía aérea, estabilización hemodinámica y aviso a anestesiólogo.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_aldrete.pdf"))

if __name__ == "__main__":
    run()
