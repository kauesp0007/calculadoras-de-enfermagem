# -*- coding: utf-8 -*-
"""e35.py: Spanish Scales 61 and 62 (waterlow, downes)"""
import os
from engine_es import FormPDFEngineES

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\ES"

def run():
    print("Compiling Spanish Scales 61 and 62...")
    # 61. Waterlow
    e = FormPDFEngineES("ESCALA DE WATERLOW", "Valoración del Riesgo de Úlceras por Presión y Estrategia Preventiva", "Puntuación > 20 (Riesgo Muy Alto)", "Waterlow J. Prof Nurse, 1985;1(2):49-55.")
    e.layout_mode = "single"
    e.extra_css = ".table-eval td { padding: 4px 7px !important; font-size: 7.4pt !important; } .opt-item { margin-bottom: 1.5px !important; } .sec-title { margin: 5px 0 2px !important; }"
    e.add_table_section("SUBESCALAS DE RIESGO DE ÚLCERAS POR PRESIÓN", [
        (("1. Talla / Peso para la Altura", "Evaluación de IMC y complexión"), [("IMC promedio (0)", 0), ("IMC por encima del promedio (1)", 1), ("Obeso / IMC > 30 (2)", 2), ("Por debajo del promedio / Caquéctico (3)", 3)]),
        (("2. Tipo de Piel Visualmente", "Áreas de alto riesgo cutáneo"), [("Piel sana e intacta (0)", 0), ("Piel fina como papel de fumar / Seca / Edematosa (1)", 1), ("Piel húmeda / febril (1)", 1), ("Piel pigmentada / Eritema Grado 1 (2)", 2), ("Piel rota / Úlcera por presión existente (3)", 3)]),
        (("3. Sexo y Edad", "Ponderación demográfica de riesgo"), [("Hombre (1 pt) | Mujer (2 pts)", 1), ("14-49 años (1 pt) | 50-64 años (2 pts)", 2), ("65-74 años (3 pts) | 75-80 años (4 pts) | 81+ años (5 pts)", 4)]),
        (("4. Continencia", "Control de esfínteres"), [("Continente completo / Sonda vesical intacta (0)", 0), ("Incontinencia ocasional (1)", 1), ("Sondado/a pero incontinente de heces (2)", 2), ("Incontinencia doble de orina y heces (3)", 3)]),
        (("5. Movilidad", "Capacidad de movimiento corporal"), [("Totalmente móvil (0)", 0), ("Inquieto/a / Agitado/a (1)", 1), ("Apático/a (2)", 2), ("Restringida (3)", 3), ("Encamado/a (4)", 4), ("Silla de ruedas / Sillón (5)", 5)]),
        (("6. Malnutrición Tisular", "Condición sistémica de base"), [("Caquexia terminal / Fallo multiorgánico (8)", 8), ("Fallo de un solo órgano (respiratorio/renal/cardíaco) (5)", 5), ("Enfermedad vascular periférica (5)", 5), ("Anemia severa / Tabaquismo (2)", 2)]),
        (("7. Déficit Neurológico", "Alteración sensitivo-motora"), [("Diabetes / EM / ACV / Paraplejía / Neuropatía (4-6 pts)", 5)]),
        (("8. Cirugía Mayor / Traumatismo", "Ortopédica / espinal / tiempo en quirófano"), [("Cirugía ortopédica o espinal por debajo de cintura (5)", 5), ("En mesa quirúrgica > 2 horas (5)", 5)])
    ])
    e.set_risk_stratification([
        ("En Riesgo", "10 - 14 puntos", "Colchón preventivo de espuma, cambios posturales c/3h, piel limpia e hidratada.", "green"),
        ("Riesgo Alto", "15 - 19 puntos", "Colchón dinámico de aire alternante, posición 30° en cambios, protección de talones.", "yellow"),
        ("Riesgo Muy Alto", "≥ 20 puntos", "Cama de reemplazo dinámico / aire fluidificado, cambios c/2h, revisión por nutrición.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_waterlow.pdf"))

    # 62. Wood-Downes
    e = FormPDFEngineES("ESCALA DE WOOD-DOWNES", "Valoración de la Gravedad en Bronquiolitis Aguda y Crisis Asmática Pediátrica", "14 puntos (0 a 14)", "Downes JJ, et al. Clin Pediatr (Phila), 1972;11(10):567-570.")
    e.add_table_section("SEIS PARÁMETROS RESPIRATORIOS CLÍNICOS", [
        (("1. Sibilancias / Ruidos Respiratorios", "Auscultación pulmonar"), [("Ausentes", 0), ("Final de la espiración con fonendoscopio", 1), ("Toda la espiración con fonendoscopio", 2), ("Inspiratorias y espiratorias a distancia sin fonendoscopio", 3)]),
        (("2. Tiraje / Retracciones", "Uso de musculatura accesoria"), [("Ausente", 0), ("Subcostal / Intercostal leve", 1), ("Intercostal + Supraclavicular / Supraesternal moderado", 2), ("Intercostal + Supraclavicular + Aleteo nasal severo", 3)]),
        (("3. Frecuencia Respiratoria (FR)", "Respiraciones por minuto"), [("< 30 rpm", 0), ("31 - 45 rpm", 1), ("46 - 60 rpm", 2), ("> 60 rpm", 3)]),
        (("4. Frecuencia Cardíaca (FC)", "Latidos por minuto"), [("< 100 lpm", 0), ("100 - 120 lpm", 1), ("121 - 140 lpm", 2), ("> 140 lpm", 3)]),
        (("5. Entrada de Aire / Ventilación", "Murmullo vesicular bilateral"), [("Buena / Simétrica bilateralmente", 0), ("Regular / Disminución simétrica leve", 1), ("Muy pobre / Disminución marcada simétrica", 2), ("Tórax silente / Murmullo ausente", 3)]),
        (("6. Cianosis", "Coloración y oxigenación"), [("Ausente (SpO2 > 95% con aire ambiente)", 0), ("Leve / Peribucal al llorar", 1), ("Cianosis central respirando aire ambiente", 2), ("Cianosis central respirando O2 al 40%", 3)])
    ])
    e.set_risk_stratification([
        ("Bronquiolitis / Crisis Leve", "1 - 3 puntos", "Observación ambulatoria. Lavados nasales, tomas fraccionadas, controlar SpO2.", "green"),
        ("Dificultad Respiratoria Moderada", "4 - 7 puntos", "Ingreso en planta. Oxígeno humidificado de bajo/alto flujo, nebulizaciones, sueroterapia IV.", "yellow"),
        ("Fallo Respiratorio Inminente", "≥ 8 puntos", "Traslado a UCIP, cánula nasal de alto flujo (CNAF) / CPAP / intubación orotraqueal.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_downes.pdf"))

if __name__ == "__main__":
    run()
