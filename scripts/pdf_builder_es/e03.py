# -*- coding: utf-8 -*-
"""e03.py: Spanish Scales 3 and 4 (apgar, asa)"""
import os
from engine_es import FormPDFEngineES

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\ES"

def run():
    print("Compiling Spanish Scales 3 and 4...")
    # 3. Apgar
    e = FormPDFEngineES("TEST DE APGAR", "Evaluación de la Vitalidad Neonatal y Adaptación Extrauterina", "10 puntos", "Apgar V. Anesth Analg, 1953;32(4):260-267.")
    e.add_table_section("PARÁMETROS DE APGAR AL 1 Y 5 MINUTOS", [
        (("1. Frecuencia Cardíaca", "Auscultación del latido cardíaco apical"), [("Ausente", 0), ("< 100 latidos por minuto", 1), ("≥ 100 latidos por minuto", 2)]),
        (("2. Esfuerzo Respiratorio", "Frecuencia, profundidad y llanto"), [("Ausente (apnea)", 0), ("Lento, irregular, llanto débil", 1), ("Buena respiración, llanto vigoroso", 2)]),
        (("3. Tono Muscular", "Flexión y movimiento espontáneo de extremidades"), [("Flácido, sin movimiento", 0), ("Cierta flexión de extremidades", 1), ("Movimiento activo, extremidades bien flexionadas", 2)]),
        (("4. Irritabilidad Refleja", "Respuesta a la aspiración o estímulo táctil"), [("Sin respuesta a la estimulación", 0), ("Mueca, llanto débil, evitación leve", 1), ("Tos, estornudo, retiro vigoroso, llanto", 2)]),
        (("5. Color de la Piel", "Oxigenación periférica y central"), [("Azul grisáceo, pálido, cianosis generalizada", 0), ("Cuerpo rosado con extremidades azuladas (acrocianosis)", 1), ("Completamente rosado, coloración normal", 2)])
    ])
    e.set_risk_stratification([
        ("Normal / Vigoroso", "8-10 pts", "Cuidados habituales en sala de partos, contacto piel con piel y lactancia precoz.", "green"),
        ("Depresión Moderada", "4-7 pts", "Estimulación táctil, permeabilización de vía aérea, O2 suplementario / VPP.", "yellow"),
        ("Depresión Severa", "0-3 pts", "Protocolo inmediato de reanimación neonatal, VPP, compresiones cardíacas y UCIN.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_apgar.pdf"))

    # 4. ASA
    e = FormPDFEngineES("CLASIFICACIÓN DEL ESTADO FÍSICO ASA", "Valoración del Estado Físico Preoperatorio y Riesgo Anestésico", "Clase VI (más E)", "American Society of Anesthesiologists (ASA), 2020.")
    e.add_table_section("CRITERIOS DE CLASIFICACIÓN DEL ESTADO FÍSICO ASA", [
        (("ASA I", "Paciente Sano"), [("Paciente sano normal, no fumador, consumo nulo o mínimo de alcohol", 1)]),
        (("ASA II", "Enfermedad Sistémica Leve"), [("Enfermedad sistémica leve sin limitaciones funcionales (HTA controlada, DM leve)", 2)]),
        (("ASA III", "Enfermedad Sistémica Grave"), [("Enfermedad sistémica grave con limitación funcional sustantiva (DM mal controlada, IRC)", 3)]),
        (("ASA IV", "Enfermedad Amenazante para la Vida"), [("Enfermedad sistémica grave que es un riesgo constante para la vida (IAM/ACV < 3 meses)", 4)]),
        (("ASA V", "Paciente Moribundo"), [("Paciente moribundo que no se espera que sobreviva sin la operación (rotura aneurisma)", 5)]),
        (("ASA VI", "Donante con Muerte Cerebral"), [("Paciente con muerte cerebral declarada cuyos órganos son extraídos para donación", 6)]),
        (("Sufijo de Emergencia (E)", "Procedimiento Urgente"), [("Intervención de emergencia cuando la demora aumenta el riesgo vital (ej. ASA III-E)", 0)])
    ])
    e.set_risk_stratification([
        ("Riesgo Bajo", "ASA I - II", "Cuidados perioperatorios habituales, evaluación preanestésica de rutina.", "green"),
        ("Riesgo Elevado", "ASA III", "Optimización preoperatoria, monitorización hemodinámica intraoperatoria especializada.", "yellow"),
        ("Riesgo Extremo", "ASA IV - V", "Reanimación intensiva, vía arterial / CVC, reserva de cama en UCI.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_asa.pdf"))

if __name__ == "__main__":
    run()
