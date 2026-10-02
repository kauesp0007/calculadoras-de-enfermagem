# -*- coding: utf-8 -*-
"""e21.py: Spanish Scales 35 and 36 (lanss, lawton)"""
import os
from engine_es import FormPDFEngineES

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\ES"

def run():
    print("Compiling Spanish Scales 35 and 36...")
    # 35. LANSS
    e = FormPDFEngineES("ESCALA DE DOLOR LANSS", "Evaluación de Síntomas y Signos de Dolor Neuropático", "24 puntos (Neuropático si ≥ 12)", "Bennett M. Pain, 2001;92(1-2):147-157.")
    e.add_table_section("A. CUESTIONARIO DE DOLOR (REPORTE DEL PACIENTE)", [
        (("1. Sensación de Punsadas / Hormigueo", "Punzadas o agujas en la zona dolorosa"), [("No", 0), ("Sí", 5)]),
        (("2. Cambio de Coloración de la Piel", "La piel luce moteada, enrojecida o rosada"), [("No", 0), ("Sí", 5)]),
        (("3. Sensibilidad Térmica Alterada", "La piel se siente anormalmente caliente o fría"), [("No", 0), ("Sí", 3)]),
        (("4. Crisis Ráfagas de Dolor", "Descargas eléctricas o punzadas bruscas"), [("No", 0), ("Sí", 2)]),
        (("5. Sensación de Quemazón / Ardor", "La piel siente como si estuviera ardiendo"), [("No", 0), ("Sí", 1)])
    ])
    e.add_table_section("B. EXAMEN FÍSICO A LA CABECERA", [
        (("6. Alodinia (Pincelado con Algodón)", "El roce suave con algodón provoca dolor"), [("No: Sensación normal", 0), ("Sí: Alodinia presente", 5)]),
        (("7. Umbral de Pinchazo Alterado", "Pinchazo con aguja 23G en zona dolorosa vs sana"), [("No: Sensación simétrica", 0), ("Sí: Umbral alterado / hiperalgesia", 3)])
    ])
    e.set_risk_stratification([
        ("Dolor Nociceptivo Probable", "< 12 puntos", "Mecanismos neuropáticos poco probables. Analgesia nociceptiva estándar (AINEs, paracetamol).", "green"),
        ("Dolor Neuropático Probable", "≥ 12 puntos", "Mecanismos neuropáticos contribuyentes. Indicados gabapentinoides (pregabalina/gabapentina), ISRN, tricíclicos.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_lanss.pdf"))

    # 36. Lawton
    e = FormPDFEngineES("ESCALA DE LAWTON Y BRODY", "Evaluación de las Actividades Instrumentales de la Vida Diaria (AIVD)", "8 puntos (0 a 8)", "Lawton MP, Brody EM. Gerontologist, 1969;9(3):179-186.")
    e.layout_mode = "single"
    e.extra_css = ".table-eval td { padding: 4.8px 7px !important; } .opt-item { margin-bottom: 2px !important; }"
    e.add_table_section("OCHO DOMINIOS INSTRUMENTALES DE AUTONOMÍA", [
        (("1. Capacidad para Usar el Teléfono", "Manejo del teléfono"), [("Utiliza el teléfono por iniciativa propia; marca números (1)", 1), ("Marca unos cuantos números bien conocidos (1)", 1), ("Contesta el teléfono pero no marca (1)", 1), ("No usa el teléfono en absoluto (0)", 0)]),
        (("2. Hacer Compras", "Adquisición de alimentos y enseres"), [("Realiza todas las compras de forma independiente (1)", 1), ("Realiza compras pequeñas de forma independiente (0)", 0), ("Necesita ir acompañado/a para cualquier compra (0)", 0), ("Completamente incapaz de comprar (0)", 0)]),
        (("3. Preparación de la Comida", "Planificación y cocina"), [("Organiza, prepara y sirve las comidas adecuadamente (1)", 1), ("Prepara comidas adecuadas si se le dan los ingredientes (0)", 0), ("Calienta y sirve comidas preparadas (0)", 0), ("Necesita que le preparen y sirvan la comida (0)", 0)]),
        (("4. Cuidado de la Casa", "Mantenimiento del hogar"), [("Mantiene la casa solo/a o con ayuda ocasional (1)", 1), ("Realiza tareas ligeras diarias (fregar platos, hacer cama) (1)", 1), ("Realiza tareas ligeras pero no mantiene la limpieza (1)", 1), ("Necesita ayuda para todas las tareas de la casa (0)", 0)]),
        (("5. Lavado de la Ropa", "Cuidado de vestimenta"), [("Lava toda su ropa personal independientemente (1)", 1), ("Lava prendas pequeñas; aclara medias, etc. (1)", 1), ("Todo el lavado de ropa debe ser hecho por otros (0)", 0)]),
        (("6. Modo de Transporte", "Capacidad de desplazamiento"), [("Viaja de forma independiente en transporte público o conduce coche (1)", 1), ("Organiza su propio viaje en taxi, pero no usa otro transporte (1)", 1), ("Viaja en transporte público si va acompañado/a (1)", 1), ("Viajes limitados a taxi o coche con ayuda (0)", 0), ("No viaja en absoluto (0)", 0)]),
        (("7. Responsabilidad de la Medicación", "Manejo de fármacos"), [("Es responsable de tomar su medicación en dosis y horas correctas (1)", 1), ("Toma la medicación si se le prepara con antelación en dosis separadas (0)", 0), ("No es capaz de dosificar su propia medicación (0)", 0)]),
        (("8. Capacidad para Manejar Dinero", "Manejo económico"), [("Maneja los asuntos financieros independientemente (banco, facturas) (1)", 1), ("Maneja las compras de día a día, pero necesita ayuda en compras mayores (1)", 1), ("Incapaz de manejar dinero (0)", 0)])
    ])
    e.set_risk_stratification([
        ("Independencia Elevada", "8 puntos", "Autónomo/a en tareas instrumentales complejas. Independiente en la comunidad.", "green"),
        ("Afectación Moderada", "4 - 7 puntos", "Necesita asistencia para actividades complejas (medicación, finanzas).", "yellow"),
        ("Dependencia Severa", "0 - 3 puntos", "Alta dependencia de cuidados. Requiere apoyo de cuidador o residencia asistida.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_lawton.pdf"))

if __name__ == "__main__":
    run()
