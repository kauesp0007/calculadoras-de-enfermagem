# -*- coding: utf-8 -*-
"""e24.py: Spanish Scales 40 and 41 (morse, news)"""
import os
from engine_es import FormPDFEngineES

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\ES"

def run():
    print("Compiling Spanish Scales 40 and 41...")
    # 40. Morse
    e = FormPDFEngineES("ESCALA DE CAÍDAS DE MORSE (MFS)", "Evaluación Rápida del Riesgo de Caídas en Pacientes Hospitalizados", "125 puntos", "Morse JM, et al. Res Nurs Health, 1989;12(4):245-252.")
    e.add_table_section("SEIS VARIABLES CLÍNICAS DE RIESGO", [
        (("1. Antecedentes de Caídas", "Caídas previas recientes"), [("No: Sin caídas en los últimos 3 meses", 0), ("Sí: Ha caído durante el presente ingreso o en los últimos 3 meses", 25)]),
        (("2. Diagnóstico Secundario", "Diagnósticos coexistentes activos"), [("No: Sólo un diagnóstico médico en la historia", 0), ("Sí: Dos o más diagnósticos médicos activos", 15)]),
        (("3. Ayuda para Deambular", "Requerimiento de apoyo para caminar"), [("Ninguna / Encamado / Asistencia de enfermería", 0), ("Muletas / Bastón / Andador", 15), ("Mobiliario (apoyándose en paredes, mesas, sillas)", 30)]),
        (("4. Vía IV / Cánula / Salino", "Dispositivos intravenosos"), [("No: Sin vía IV, tapón salino ni heparinizado", 0), ("Sí: Tiene infusión IV, vía venosa o tapón de heparina", 20)]),
        (("5. Marcha / Transferencias", "Calidad del paso y equilibrio"), [("Normal / Encamado / Inmóvil (silla de ruedas autónoma)", 0), ("Débil (encorvado/a, pasos cortos, titubeante)", 10), ("Alterada (dificultad para levantarse, pasos cortos e inestables)", 20)]),
        (("6. Estado Mental", "Autoconciencia de sus limitaciones"), [("Orientado/a en sus capacidades (realista sobre sus límites)", 0), ("Sobreestima sus capacidades / Olvida sus limitaciones", 15)])
    ])
    e.set_risk_stratification([
        ("Riesgo Bajo de Caída", "0 - 24 puntos", "Cuidados de enfermería básicos, cama en posición más baja, timbre accesible, calzado seguro.", "green"),
        ("Riesgo Moderado", "25 - 50 puntos", "Protocolo estándar de caídas: pulsera identificativa, asistencia al baño, revisar fármacos.", "yellow"),
        ("Riesgo Alto de Caída", "≥ 51 puntos", "Protocolo de alto riesgo: alarma de cama/silla, supervisión 1:1 en transferencias, rondas q1h.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_morse.pdf"))

    # 41. NEWS 2
    e = FormPDFEngineES("ESCALA NEWS 2 (NATIONAL EARLY WARNING SCORE 2)", "Evaluación Estandarizada de la Gravedad del Deterioro Clínico en Adultos", "20 puntos (0 a 20)", "Royal College of Physicians. NEWS 2, London: RCP, 2017.")
    e.add_table_section("SIETE PARÁMETROS FISIOLÓGICOS", [
        (("1. Frecuencia Respiratoria", "Respiraciones/min"), [("12 - 20 (0)", 0), ("9 - 11 (1)", 1), ("21 - 24 (2)", 2), ("≤8 o ≥25 (3)", 3)]),
        (("2. SpO2 Escala 1", "Oximetría con aire ambiente"), [("≥ 96% (0)", 0), ("94 - 95% (1)", 1), ("92 - 93% (2)", 2), ("≤ 91% (3)", 3)]),
        (("3. SpO2 Escala 2", "Fracaso respiratorio hipercápnico"), [("88 - 92% o ≥93 aire (0)", 0), ("86 - 87% (1)", 1), ("84 - 85% (2)", 2), ("≤ 83% (3)", 3)]),
        (("4. Oxígeno Suplementario", "Administración de O2"), [("Aire ambiente: No (0)", 0), ("Oxígeno suplementario: Sí (2)", 2)]),
        (("5. Presión Arterial Sistólica", "Hemodinámica (mmHg)"), [("111 - 219 (0)", 0), ("101 - 110 (1)", 1), ("91 - 100 (2)", 2), ("≤90 o ≥220 (3)", 3)]),
        (("6. Frecuencia Cardíaca", "Latidos/min"), [("51 - 90 (0)", 0), ("41 - 50 o 91 - 110 (1)", 1), ("111 - 130 (2)", 2), ("≤40 o ≥131 (3)", 3)]),
        (("7. Nivel de Conciencia", "Escala ACVPU"), [("Alerta (0)", 0), ("Confusión nueva (3)", 3), ("Voz (3)", 3), ("Dolor (3)", 3), ("Sin respuesta (3)", 3)])
    ])
    e.set_risk_stratification([
        ("Riesgo Bajo", "0 - 4 puntos", "Respuesta a nivel de planta. Continuar observaciones de rutina c/4-6h.", "green"),
        ("Riesgo Bajo-Moderado", "Puntuación 3 en 1 parámetro", "Revisión urgente por enfermero/a de planta, avisar a equipo médico, aumentar controles c/1h.", "yellow"),
        ("Riesgo Clínico Moderado", "5 - 6 puntos", "Revisión urgente por clínico con competencias en cuidados agudos, preparar escalado.", "orange"),
        ("Riesgo Clínico Alto", "≥ 7 puntos", "Respuesta de emergencia: Equipo de Emergencias Médicas (EEM) / UCI de inmediato.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_news.pdf"))

if __name__ == "__main__":
    run()
