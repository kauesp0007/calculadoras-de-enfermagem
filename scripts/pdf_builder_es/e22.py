# -*- coding: utf-8 -*-
"""e22.py: Spanish Scales 37 and 38 (meem, meows)"""
import os
from engine_es import FormPDFEngineES

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\ES"

def run():
    print("Compiling Spanish Scales 37 and 38...")
    # 37. MMSE / MEEM
    e = FormPDFEngineES("MINI-EXAMEN DEL ESTADO MENTAL (MMSE / FOLSTEIN)", "Cribado de Deterioro Cognitivo y Demencia en la Práctica Clínica", "30 puntos", "Folstein MF, et al. J Psychiatr Res, 1975;12(3):189-198.")
    e.layout_mode = "double_col"
    e.add_table_section("1. ORIENTACIÓN Y FIJACIÓN", [
        ("Orientación Temporal (Año, Estación, Mes, Fecha, Día)", [("1 punto por respuesta correcta (0 a 5)", 5)]),
        ("Orientación Espacial (País, Provincia, Ciudad, Hospital, Planta)", [("1 punto por respuesta correcta (0 a 5)", 5)]),
        ("Fijación / Registro (Nombrar 3 objetos: Manzana, Mesa, Peseta)", [("1 punto por objeto repetido al 1er intento (0 a 3)", 3)])
    ])
    e.add_table_section("2. ATENCIÓN, MEMORIA Y LENGUAJE", [
        ("Atención / Cálculo (Restar 7 desde 100: 93, 86, 79, 72, 65)", [("1 punto por cada resta correcta (0 a 5)", 5)]),
        ("Memoria / Recuerdo (Pedir los 3 objetos nombrados antes)", [("1 punto por objeto recordado (0 a 3)", 3)]),
        ("Denominación (Mostrar reloj y bolígrafo, pedir nombre)", [("1 punto por objeto correcto (0 a 2)", 2)]),
        ("Repetición ('Ni sí, ni no, ni peros')", [("1 punto por repetición exacta (0 a 1)", 1)]),
        ("Orden de 3 Pasos (Coja el papel con mano derecha, dóblelo y al suelo)", [("1 punto por cada paso ejecutado (0 a 3)", 3)]),
        ("Lectura y Orden ('CIERRE LOS OJOS')", [("1 punto si ejecuta la orden de cerrar ojos (0 a 1)", 1)]),
        ("Escritura (Escribir una frase con sujeto, verbo y sentido)", [("1 punto por frase con sentido (0 a 1)", 1)]),
        ("Copia de Dibujo (Dos pentágonos entrecruzados)", [("1 punto por 10 ángulos y cruce de 4 lados (0 a 1)", 1)])
    ])
    e.set_risk_stratification([
        ("Cognición Normal", "24 - 30 puntos", "Sin deterioro cognitivo significativo. Ajustar según nivel de escolaridad.", "green"),
        ("Deterioro Cognitivo Leve", "19 - 23 puntos", "Deterioro leve. Evaluación clínica de causas reversibles o demencia incipiente.", "yellow"),
        ("Deterioro Moderado", "10 - 18 puntos", "Demencia moderada. Supervisión de seguridad, apoyo al cuidador.", "orange"),
        ("Deterioro Cognitivo Severo", "< 10 puntos", "Demencia severa. Dependencia total de cuidados, supervisión 24 horas.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_meem.pdf"))

    # 38. MEOWS
    e = FormPDFEngineES("ESCALA MEOWS (MODIFIED EARLY OBSTETRIC WARNING SCORE)", "Sistema de Alerta Temprana Obstétrica y Seguimiento del Deterioro Materno", "Alertas por Colores (Amarillo / Rojo)", "Royal College of Obstetricians and Gynaecologists (RCOG), 2021.")
    e.add_table_section("SIETE PARÁMETROS FISIOLÓGICOS MATERNOS", [
        (("1. Frecuencia Respiratoria (/min)", "Auscultar durante 60 segundos"), [("11 - 20 rpm (Normal)", 0), ("21 - 30 rpm (Alerta Amarilla)", 1), ("< 10 o > 30 rpm (Alerta Roja)", 2)]),
        (("2. Saturación de Oxígeno (SpO2)", "Oximetría de pulso con aire ambiente"), [("≥ 96% con aire ambiente (Normal)", 0), ("92 - 95% (Alerta Amarilla)", 1), ("< 92% (Alerta Roja)", 2)]),
        (("3. Temperatura (°C)", "Temperatura timpánica o bucal"), [("36.0 - 37.4 °C (Normal)", 0), ("35.0-35.9 o 37.5-37.9 °C (Amarilla)", 1), ("< 35.0 o ≥ 38.0 °C (Alerta Roja)", 2)]),
        (("4. Presión Arterial Sistólica (mmHg)", "Medición manual o automática"), [("100 - 139 mmHg (Normal)", 0), ("90 - 99 o 140 - 149 mmHg (Amarilla)", 1), ("< 90 o ≥ 150 mmHg (Alerta Roja)", 2)]),
        (("5. Presión Arterial Diastólica (mmHg)", "Fase V de Korotkoff"), [("< 90 mmHg (Normal)", 0), ("90 - 99 mmHg (Alerta Amarilla)", 1), ("≥ 100 mmHg (Alerta Roja)", 2)]),
        (("6. Frecuencia Cardíaca (lpm)", "Conteo de pulso apical o radial"), [("60 - 99 lpm (Normal)", 0), ("50 - 59 o 100 - 119 lpm (Amarilla)", 1), ("< 50 o ≥ 120 lpm (Alerta Roja)", 2)]),
        (("7. Conciencia / Dolor Materno", "Escala AVDI / evaluación de dolor"), [("Alerta / Dolor normal (Normal)", 0), ("Responde a voz / Agitada / Dolor severo (Amarilla)", 1), ("Responde sólo al dolor / Inconsciente (Roja)", 2)])
    ])
    e.set_risk_stratification([
        ("Riesgo Bajo / Normal", "0 Alertas", "Continuar con el control de signos vitales intraparto/posparto de rutina.", "green"),
        ("Preocupación Moderada", "1 Alerta Amarilla", "Repetir constantes en 30 min, avisar a matrona responsable, evaluar balance de fluidos.", "yellow"),
        ("Alerta Obstétrica Urgente", "1 Roja o ≥ 2 Amarillas", "Valoración inmediata por obstetra de guardia, presencia de matrona senior, considerar equipo de urgencias.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_meows.pdf"))

if __name__ == "__main__":
    run()
