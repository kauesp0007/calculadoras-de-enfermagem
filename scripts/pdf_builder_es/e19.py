# -*- coding: utf-8 -*-
"""e19.py: Spanish Scales 31 and 32 (johns, jouvet)"""
import os
from engine_es import FormPDFEngineES

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\ES"

def run():
    print("Compiling Spanish Scales 31 and 32...")
    # 31. Johns Hopkins
    e = FormPDFEngineES("ESCALA DE RIESGO DE CAÍDAS DE JOHNS HOPKINS (JHFRAT)", "Evaluación e Intervención del Riesgo de Caídas en Pacientes Hospitalizados", "35 puntos", "Poe SS, et al. J Nurs Care Qual, 2005;20(2):107-116.")
    e.add_table_section("SIETE CATEGORÍAS DE RIESGO", [
        (("1. Edad", "Edad cronológica del paciente"), [("< 60 años", 0), ("60 - 69 años", 1), ("70 - 79 años", 2), ("≥ 80 años", 3)]),
        (("2. Historial de Caídas", "Caídas previas documentadas"), [("Sin caídas en los últimos 6 meses", 0), ("Una caída en los últimos 6 meses", 5), ("Más de una caída en los últimos 6 meses", 10)]),
        (("3. Eliminación Urinaria / Fecal", "Patrón de micción y evacuación"), [("Normal / Continente", 0), ("Incontinencia / Urgencia / Frecuencia", 2), ("Requiere asistencia para ir al baño", 4)]),
        (("4. Medicamentos de Riesgo", "Sedantes, diuréticos, narcóticos, antihipertensivos"), [("Ninguno de los fármacos de lista", 0), ("Un medicamento de alto riesgo", 3), ("Dos o más medicamentos de alto riesgo", 5)]),
        (("5. Equipos y Dispositivos Médicos", "Sondas, vías IV, sueros que limitan movimiento"), [("Sin equipos / vías conectoras", 0), ("Un dispositivo o vía IV", 1), ("Dos dispositivos o vías IV", 2), ("Tres o más dispositivos / vías IV", 3)]),
        (("6. Movilidad y Marcha", "Equilibrio y necesidad de ayuda para caminar"), [("Independiente / Marcha firme y estable", 0), ("Utiliza bastón, andador o muletas", 2), ("Equilibrio alterado / inestable / bamboleante", 4), ("Requiere asistencia física de 1-2 personas", 6)]),
        (("7. Cognición", "Orientación y juicio de seguridad"), [("Orientado x3 (persona, lugar, tiempo)", 0), ("Confusión leve / Sobreestima su capacidad", 2), ("Confusión severa / Agitación / Delirium", 4)])
    ])
    e.set_risk_stratification([
        ("Riesgo Bajo de Caída", "0 - 5 puntos", "Precauciones universales: timbre accesible, cama baja, calzado antideslizante.", "green"),
        ("Riesgo Moderado", "6 - 13 puntos", "Señal de alerta de caída, deambulación asistida, revisar horario de medicación.", "yellow"),
        ("Riesgo Alto de Caída", "> 13 puntos", "Pulsera amarilla, alarma de cama, ronda de eliminación q2h, supervisión 1:1.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_johns.pdf"))

    # 32. Jouvet
    e = FormPDFEngineES("ESCALA DE COMA DE JOUVET", "Evaluación de la Conciencia: Perceptividad y Reactividad", "Perceptividad (P1-P5) y Reactividad (R1-R4)", "Jouvet M. Rev Neurol (Paris), 1969;121(3):187-201.")
    e.add_table_section("1. PERCEPTIVIDAD (FUNCIÓN CORTICAL)", [
        (("P1 - Conciencia Clara", "Función cognoscitiva superior intacta"), [("Despierto/a, orientado/a en tiempo/espacio, obedece órdenes complejas", 1)]),
        (("P2 - Obnubilación", "Lentitud cognitiva leve"), [("Respuestas lentas, dificultad para tareas mentales complejas, somnolencia", 2)]),
        (("P3 - Estupor / Semicoma", "Obtundación mental marcada"), [("Obedece sólo órdenes simples (abrir ojos, sacar la lengua)", 3)]),
        (("P4 - Agnosia / Estado Vegetativo", "Pérdida de percepción cortical"), [("Sin comprensión de órdenes, sólo fijación/seguimiento visual reflejo", 4)]),
        (("P5 - Coma Profundo", "Pérdida total de perceptividad"), [("Ausencia total de percepción consciente, no responde a ninguna orden", 5)])
    ])
    e.add_table_section("2. REACTIVIDAD (TRONCO ENCEFÁLICO / SUBCORTICAL)", [
        (("R1 - Reactividad Normal", "Despertar no específico intacto"), [("Reflejo de orientación normal, parpadeo espontáneo, retiro al dolor", 1)]),
        (("R2 - Reactividad Disminuida", "Despertar torpe"), [("Respuestas lentas a estímulos auditivos o dolorosos, mueca lenta", 2)]),
        (("R3 - Postura Motora", "Compresión de tronco severa"), [("Postura de extensión (descerebración) o flexión anormal (decorticación)", 3)]),
        (("R4 - Areactividad", "Fallo de tronco encéfalo"), [("Ausencia total de respuesta motora al dolor, pupilas arreactivas bilaterales", 4)])
    ])
    e.set_risk_stratification([
        ("Consciente / Alteración Leve", "P1-P2, R1", "Reflejos de tronco intactos, lentitud cortical. Monitorización neurológica.", "green"),
        ("Afectación Moderada / Estupor", "P3-P4, R1-R2", "Depresión de conciencia. Proteger vía aérea, TC cerebral urgente.", "yellow"),
        ("Coma Profundo / Fallo de Tronco", "P5, R3-R4", "Coma grave. Ventilación mecánica, monitorización de PIC, UCI neurocríticos.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_jouvet.pdf"))

if __name__ == "__main__":
    run()
