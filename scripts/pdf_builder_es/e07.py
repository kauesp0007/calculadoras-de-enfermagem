# -*- coding: utf-8 -*-
"""e07.py: Spanish Scales 8 and 9 (bishop, braden)"""
import os
from engine_es import FormPDFEngineES

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\ES"

def run():
    print("Compiling Spanish Scales 8 and 9...")
    # 8. Bishop
    e = FormPDFEngineES("TEST DE BISHOP", "Valoración de la Madurez Cervical y Predicción del Éxito en la Inducción del Parto", "13 puntos", "Bishop EH. Obstet Gynecol, 1964;24(2):266-268.")
    e.add_table_section("PARÁMETROS DE EXPLORACIÓN CERVICAL", [
        (("1. Dilatación Cervical", "Diámetro del orificio cervical interno en cm"), [("Cerrado (0 cm)", 0), ("1 - 2 cm", 1), ("3 - 4 cm", 2), ("≥ 5 cm", 3)]),
        (("2. Borramiento Cervical", "Longitud del cérvix acortada (%)"), [("0 - 30% (cérvix grueso)", 0), ("40 - 50%", 1), ("60 - 70%", 2), ("≥ 80% (cérvix borrado)", 3)]),
        (("3. Altura de la Presentación", "Plano de Hodge / Estación fetal (cm)"), [("-3 (feto libre / alto)", 0), ("-2", 1), ("-1 / 0 (apoyado en espinas)", 2), ("+1 / +2 (encajado / bajo)", 3)]),
        (("4. Consistencia Cervical", "Firmeza del tejido al tacto vaginal"), [("Firme (como la punta de la nariz)", 0), ("Media (como el mentón)", 1), ("Blanda (como los labios)", 2)]),
        (("5. Posición Cervical", "Orientación del cérvix respecto al eje pélvico"), [("Posterior", 0), ("Media", 1), ("Anterior", 2)])
    ])
    e.set_risk_stratification([
        ("Cérvix Desfavorable / Inmaduro", "≤ 5 puntos", "Indicación de maduración cervical (dinoprostona / misoprostol / balón de Foley).", "red"),
        ("Cérvix Intermedio", "6 - 7 puntos", "Madurez equívoca. Reevaluar o considerar maduración mecánica leve frente a oxitocina.", "yellow"),
        ("Cérvix Favorable / Maduro", "≥ 8 points", "Alta probabilidad de parto vaginal exitoso similar al trabajo de parto espontáneo. Iniciar oxitocina.", "green")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_bishop.pdf"))

    # 9. Braden
    e = FormPDFEngineES("ESCALA DE BRADEN", "Valoración del Riesgo de Desarrollar Lesiones por Presión en Adultos", "23 puntos", "Bergstrom N, Braden BJ, et al. Nurs Res, 1987;36(4):205-210.")
    e.extra_css = ".table-eval td { padding: 4.5px 7px !important; font-size: 7.4pt !important; } .opt-item { margin-bottom: 1.5px !important; font-size: 7.3pt !important; } .sec-title { margin: 5px 0 2px !important; }"
    e.add_table_section("SUBESCALAS DE RIESGO DE BRADEN", [
        (("1. Percepción Sensorial", "Capacidad para responder significativamente al malestar por presión"), [("Completamente limitada: No responde a estímulos dolorosos (estupor/coma)", 1), ("Muy limitada: Responde sólo a estímulos dolorosos", 2), ("Ligeramente limitada: Responde a órdenes verbales, déficit sensorial leve", 3), ("Sin limitación: Responde totalmente a órdenes verbales, sensación intacta", 4)]),
        (("2. Exposición a la Humedad", "Nivel de exposición de la piel a la humedad"), [("Constantemente húmeda: Piel empapada continuamente por sudor o orina", 1), ("Con frecuencia húmeda: La lencería debe cambiarse al menos una vez por turno", 2), ("Ocasionalmente húmeda: La lencería se cambia aproximadamente una vez al día", 3), ("Raramente húmeda: Piel habitualmente seca, cambios de pañal/lencería de rutina", 4)]),
        (("3. Actividad Física", "Grado de actividad física habitual"), [("Encamado/a: Confinado a la cama continuamente", 1), ("En silla: Capacidad de caminar severamente limitada o nula, en silla", 2), ("Camina ocasionalmente: Camina distancias cortas durante el día con o sin ayuda", 3), ("Camina frecuentemente: Camina fuera de la habitación al menos dos veces al día", 4)]),
        (("4. Movilidad", "Capacidad para cambiar y controlar la posición del cuerpo"), [("Completamente inmóvil: No realiza ni pequeños cambios de posición sin ayuda", 1), ("Muy limitada: Realiza ocasionalmente pequeños cambios de posición", 2), ("Ligeramente limitada: Realiza frecuentes y pequeños cambios de posición autónomamente", 3), ("Sin limitación: Realiza grandes y frecuentes cambios de posición sin ayuda", 4)]),
        (("5. Nutrición", "Patrón habitual de ingesta de alimentos"), [("Muy pobre: Nunca come una comida completa, ingiere pocos líquidos, NPO > 5 días", 1), ("Probablemente inadecuada: Rara vez come una comida completa, ingiere menos del óptimo", 2), ("Adecuada: Come más de la mitad de la mayoría de las comidas, suplementos si precisa", 3), ("Excelente: Come la mayor parte de cada comida, nunca rechaza alimentos", 4)]),
        (("6. Fricción y Cizallamiento", "Deslizamiento y roce con sábanas"), [("Problema: Requiere asistencia moderada a máxima para moverse, se desliza en cama", 1), ("Problema potencial: Se mueve débilmente o requiere mínima asistencia durante el cambio", 2), ("No se aprecia problema: Se mueve en cama y silla de forma independiente", 3)])
    ])
    e.set_risk_stratification([
        ("Riesgo Muy Alto / Alto", "≤ 12 puntos", "Colchón de presión alterna, cambios posturales q2h, crema barrera, interconsulta a nutrición.", "red"),
        ("Riesgo Moderado", "13 - 14 puntos", "Superficie especial de manejo de presión (SEMP) estática, cambios q2h, protección de talones.", "orange"),
        ("Riesgo Leve / Bajo", "15 - 18 puntos", "Protocolo de cambios posturales, hidratación cutánea, fomentar deambulación.", "yellow"),
        ("Sin Riesgo", "19 - 23 puntos", "Cuidados de enfermería de rutina, vigilancia ambiental, reevaluar semanalmente.", "green")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_braden.pdf"))

if __name__ == "__main__":
    run()
