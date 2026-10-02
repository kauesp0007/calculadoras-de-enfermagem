# -*- coding: utf-8 -*-
"""e36.py: Spanish Scale 63 - Manchester Triage System"""
import os
from engine_es import FormPDFEngineES

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\ES"

def run():
    print("Compiling Spanish Scale 63: Manchester...")
    e = FormPDFEngineES("SISTEMA DE TRIAJE MANCHESTER (MTS)", "Protocolo de Clasificación y Priorización de Riesgo Clínico en Urgencias", "Cinco Categorías de Prioridad (Rojo a Azul)", "Mackway-Jones K, et al. Emergency Triage, BMJ Books, 2014.")
    e.add_table_section("CINCO CATEGORÍAS DE PRIORIDAD Y DISCRIMINADORES GENERALES", [
        (("ROJO: Prioridad Inmediata (Objetivo: 0 min)", "Emergencia con riesgo vital inminente"), [("Riesgo vital: Vía aérea comprometida, respiración inadecuada, pulso ausente, convulsión activa, shock, niño/a no reactivo/a", 1)]),
        (("NARANJA: Muy Urgente (Objetivo: 10 min)", "Situaciones de riesgo muy elevado"), [("Riesgo elevado: Dolor severo, nivel de conciencia alterado, déficit neurológico agudo, fiebre alta en neonato, hemorragia mayor", 2)]),
        (("AMARILLO: Urgente (Objetivo: 60 min)", "Condiciones de riesgo moderado"), [("Riesgo moderado: Dolor moderado, hemorragia menor, historial de convulsión, vómitos incontrolados, taquicardia persistente", 3)]),
        (("VERDE: Estándar (Objetivo: 120 min)", "Condiciones semiurgentes"), [("Condición leve: Dolor leve, traumatismo menor, erupción localizada sin fiebre, proceso crónico sin empeoramiento agudo", 4)]),
        (("AZUL: No Urgente (Objetivo: 240 min)", "Procesos sin agudeza clínica"), [("Proceso de baja agudeza / rutina: Retirada de puntos, receta repetida, proceso crónico estable sin discriminadores agudos", 5)])
    ])
    e.set_risk_stratification([
        ("ROJO - INMEDIATO (0 MIN)", "Reanimación Inmediata", "Paso inmediato a box de vitales, activación del equipo de reanimación, estabilización ABCDE.", "red"),
        ("NARANJA - MUY URGENTE (10 MIN)", "Valoración Muy Urgente", "Valoración médica urgente en menos de 10 min, monitorización de constantes, acceso venoso.", "orange"),
        ("AMARILLO - URGENTE (60 MIN)", "Revisión Clínica Urgente", "Evaluación médica en menos de 60 min, intervenciones iniciales de enfermería, analgesia.", "yellow"),
        ("VERDE / AZUL - ESTÁNDAR (120-240 MIN)", "Valoración No Urgente", "Atención en sala de espera, vigilancia periódica de enfermería, retriaje si cambia el estado.", "green")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_manchester.pdf"))

if __name__ == "__main__":
    run()
