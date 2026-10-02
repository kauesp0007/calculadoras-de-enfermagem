# -*- coding: utf-8 -*-
"""e18.py: Spanish Scales 29 and 30 (hendrich, humpty)"""
import os
from engine_es import FormPDFEngineES

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\ES"

def run():
    print("Compiling Spanish Scales 29 and 30...")
    # 29. Hendrich II
    e = FormPDFEngineES("MODELO DE RIESGO DE CAÍDAS HENDRICH II", "Cribado de Riesgo de Caídas en Entornos Hospitalarios de Agudos", "16 puntos (Riesgo si ≥ 5)", "Hendrich AL, et al. Appl Nurs Res, 2003;16(2):65-73.")
    e.add_table_section("OCHO FACTORES CLÍNICOS DE RIESGO", [
        (("1. Confusión / Desorientación", "Alteración de la conciencia o juicio"), [("No", 0), ("Sí", 4)]),
        (("2. Depresión Sintomática", "Presencia de signos depresivos activos"), [("No", 0), ("Sí", 2)]),
        (("3. Alteración en la Eliminación", "Urgencia, frecuencia o incontinencia"), [("No", 0), ("Sí", 1)]),
        (("4. Mareo / Vértigo", "Sensación de inestabilidad o mareo"), [("No", 0), ("Sí", 1)]),
        (("5. Género Masculino", "Ponderación epidemiológica de riesgo"), [("Femenino", 0), ("Masculino", 1)]),
        (("6. Fármacos Antiepilépticos", "Administración de anticonvulsivantes"), [("No", 0), ("Sí", 2)]),
        (("7. Fármacos Benzodiacepínicos", "Administración de sedantes/hipnóticos"), [("No", 0), ("Sí", 1)]),
        (("8. Prueba de Levantarse y Andar", "Levantarse de posición sentada"), [("Capaz de levantarse de un solo movimiento sin usar manos", 0), ("Se impulsa en un solo intento con las manos", 1), ("Múltiples intentos pero lo consigue", 3), ("Incapaz de levantarse sin asistencia física", 4)])
    ])
    e.set_risk_stratification([
        ("Riesgo Bajo de Caída", "0 - 4 puntos", "Precauciones universales de caídas, timbre al alcance, calzado antideslizante.", "green"),
        ("Riesgo Alto de Caída", "≥ 5 puntos", "Protocolo de prevención de caídas: pulsera amarilla, alarma de cama, asistencia para ir al baño.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_hendrich.pdf"))

    # 30. Humpty Dumpty
    e = FormPDFEngineES("ESCALA DE RIESGO DE CAÍDAS HUMPTY DUMPTY", "Evaluación de Riesgo de Caídas e Intervención en Pacientes Pediátricos", "26 puntos (7 a 26)", "Hill-Rodriguez D, et al. J Pediatr Nurs, 2009;24(1):26-36.")
    e.add_table_section("SIETE DOMINIOS DE RIESGO PEDIÁTRICO", [
        (("1. Edad", "Etapa del desarrollo infantil"), [("≥ 13 años", 1), ("7 - 12 años", 2), ("3 - 6 años", 3), ("< 3 años", 4)]),
        (("2. Género", "Riesgo estadístico pediátrico"), [("Femenino", 1), ("Masculino", 2)]),
        (("3. Diagnóstico", "Motivo médico de ingreso"), [("Otros diagnósticos médicos", 1), ("Trastorno psiquiátrico / comportamiento", 2), ("Condición respiratoria / deshidratación", 3), ("Condición neurológica / convulsiones", 4)]),
        (("4. Deterioro Cognitivo", "Conciencia de los propios límites"), [("Consciente de sus limitaciones", 1), ("Olvida sus limitaciones de forma intermitente", 2), ("Completamente inconsciente de sus límites / impulsivo", 3)]),
        (("5. Factores Ambientales", "Entorno físico del paciente"), [("Área de consulta externa / ambulatoria", 1), ("Paciente en cama estándar de hospitalización", 2), ("Lactante / preescolar en cuna con barandillas", 3), ("Historial de caídas en el ingreso / Múltiples vías IV", 4)]),
        (("6. Cirugía / Sedación / Anestesia", "Tiempo transcurrido tras procedimiento"), [("Ninguna / Más de 48 horas", 1), ("En las últimas 48 horas", 2), ("En las últimas 24 horas tras anestesia general", 3)]),
        (("7. Uso de Medicamentos", "Prescripción de fármacos de riesgo"), [("Otros fármacos / Sin medicación", 1), ("Un medicamento de alto riesgo de caída", 2), ("Múltiples fármacos de alto riesgo (sedantes, narcóticos, laxantes)", 3)])
    ])
    e.set_risk_stratification([
        ("Riesgo Bajo de Caída", "7 - 11 puntos", "Precauciones pediátricas universales, barandillas elevadas, educación a padres.", "green"),
        ("Riesgo Alto de Caída", "≥ 12 puntos", "Protocolo de alto riesgo: pegatina de Humpty Dumpty, calcetines antideslizantes, supervisión.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_humpty.pdf"))

if __name__ == "__main__":
    run()
