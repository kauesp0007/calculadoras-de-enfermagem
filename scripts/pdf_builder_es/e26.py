# -*- coding: utf-8 -*-
"""e26.py: Spanish Scales 44 and 45 (norton, ofras)"""
import os
from engine_es import FormPDFEngineES

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\ES"

def run():
    print("Compiling Spanish Scales 44 and 45...")
    # 44. Norton
    e = FormPDFEngineES("ESCALA DE NORTON", "Valoración del Riesgo de Úlceras por Presión en Pacientes Hospitalizados", "20 puntos (5 a 20)", "Norton D, McLaren R, Exton-Smith AN. London: NCME, 1962.")
    e.add_table_section("CINCO PARÁMETROS CLÍNICOS DE VALORACIÓN", [
        (("1. Estado Físico General", "Salud física general y nutrición"), [("Bueno: Alerta, activo/a, nutrición adecuada", 4), ("Mediano: Enfermo/a crónico/a, frágil", 3), ("Malo: Débil, desnutrido/a, encamado/a", 2), ("Muy malo: Críticamente enfermo/a, moribundo/a", 1)]),
        (("2. Estado Mental", "Orientación cognitiva y alerta"), [("Alerta: Orientado/a, lúcido/a, colaborador/a", 4), ("Apático/a: Pasivo/a, poca iniciativa", 3), ("Confuso/a: Desorientado/a, agitado/a", 2), ("Estuporoso/a: Estupor, apenas responde, comatoso/a", 1)]),
        (("3. Actividad", "Grado de deambulación diaria"), [("Ambulante: Camina independientemente sin ayuda", 4), ("Camina con ayuda: Requiere bastón, andador o persona", 3), ("Sentado/a: Permanece en silla/silla de ruedas todo el día", 2), ("En cama: Confinado/a a la cama las 24 horas", 1)]),
        (("4. Movilidad", "Capacidad para cambiar de postura en cama"), [("Total: Cambia de posición de forma autónoma en cama", 4), ("Ligeramente limitada: Controla posición con esfuerzo", 3), ("Muy limitada: Necesita ayuda para cambiar de postura", 2), ("Inmóvil: Completamente incapaz de moverse", 1)]),
        (("5. Incontinencia", "Control de esfínteres y humedad cutánea"), [("Ninguna: Continente de orina y heces", 4), ("Ocasional: Incontinencia 1-2 veces en 24 horas", 3), ("Habitualmente urinaria: Incontinente de orina con frecuencia", 2), ("Urinaria y fecal: Incontinencia doble de orina y heces", 1)])
    ])
    e.set_risk_stratification([
        ("Riesgo Bajo", "17 - 20 puntos", "Medidas preventivas universales: hidratación cutánea, movilidad, piel limpia.", "green"),
        ("Riesgo Moderado", "15 - 16 puntos", "Programa de cambios posturales c/3h, colchón estático de espuma, cremas barrera.", "yellow"),
        ("Riesgo Alto de Úlcera", "≤ 14 puntos", "Colchón dinámico de aire alternante, cambios posturales c/2h, elevación de talones.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_norton.pdf"))

    # 45. OFRAS
    e = FormPDFEngineES("ESCALA OFRAS (ONTARIO FEMALE RISK ASSESSMENT SCALE)", "Evaluación del Riesgo de Caídas en Pacientes Obstétricas (Anteparto y Posparto)", "10 puntos (Riesgo si ≥ 3)", "Ontario Hospital Association, 2012.")
    e.add_table_section("SEIS DOMINIOS DE RIESGO OBSTÉTRICO", [
        (("1. Antecedentes de Caídas", "Caídas en el embarazo o año previo"), [("Sin caídas en el embarazo actual ni en los últimos 12 meses", 0), ("Historial de caída durante el embarazo actual", 2)]),
        (("2. Alteración de Movilidad y Marcha", "Equilibrio y estabilidad al caminar"), [("Marcha normal, estable e independiente", 0), ("Usa dispositivo de ayuda o se apoya en mobiliario", 1), ("Equilibrio alterado, marcha débil e inestable", 2)]),
        (("3. Fármacos y Anestesia", "Administración de fármacos sedantes / bloqueos"), [("Sin fármacos sedantes / Sin anestesia reciente", 0), ("Anestesia epidural / raquídea en las últimas 12 horas", 2), ("Sulfato de magnesio, opioides o sedantes en últimas 24h", 2)]),
        (("4. Necesidades de Eliminación", "Patrón urinario de frecuencia y urgencia"), [("Micción continente e independiente", 0), ("Urgencia urinaria, frecuencia o retención que precisa ayuda", 1)]),
        (("5. Estado Mental y Sensorial", "Nivel de alerta y mareo"), [("Alerta, orientada, colaboradora", 0), ("Mareo, hipotensión ortostática o visión borrosa", 1), ("Sedada, confusa o no colaboradora con normas de seguridad", 2)]),
        (("6. Balance de Fluidos y Pérdida Hemática", "Impacto hemodinámico del parto"), [("Estado puerperal / anteparto hemodinámicamente normal", 0), ("Hemorragia posparto / Anemia sintomática (Hb < 8 g/dL)", 1)])
    ])
    e.set_risk_stratification([
        ("Riesgo Bajo de Caída Obstétrica", "0 - 2 puntos", "Precauciones de seguridad de rutina, timbre accesible, cama baja.", "green"),
        ("Riesgo Alto de Caída Obstétrica", "≥ 3 puntos", "Señal de alerta de caída, asistencia obligatoria en las 3 primeras deambulaciones y baño.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_ofras.pdf"))

if __name__ == "__main__":
    run()
