# -*- coding: utf-8 -*-
"""e15.py: Spanish Scales 24 and 25 (four, glasgow)"""
import os
from engine_es import FormPDFEngineES

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\ES"

def run():
    print("Compiling Spanish Scales 24 and 25...")
    # 24. FOUR Score
    e = FormPDFEngineES("ESCALA FOUR (FULL OUTLINE OF UNRESPONSIVENESS)", "Evaluación del Coma y Respuesta Neurológica en Cuidados Intensivos", "16 puntos (0 a 16)", "Wijdicks EF, et al. Ann Neurol, 2005;58(4):585-593.")
    e.add_table_section("CUATRO DOMINIOS CLÍNICOS", [
        (("1. Respuesta Ocular (E)", "Apertura ocular y seguimiento"), [("Ojos abiertos, sigue con la mirada o parpadea bajo orden", 4), ("Ojos abiertos a la voz alta", 3), ("Ojos abiertos al estímulo doloroso", 2), ("Ojos cerrados al dolor", 1), ("Sin respuesta al dolor", 0)]),
        (("2. Respuesta Motora (M)", "Seguimiento de órdenes y postura"), [("Muestra pulgar arriba, puño o signo de victoria bajo orden", 4), ("Localiza el estímulo doloroso", 3), ("Respuesta de flexión al dolor (decorticación)", 2), ("Postura de extensión al dolor (descerebración)", 1), ("Sin respuesta al dolor o mioclonías generalizadas", 0)]),
        (("3. Reflejos del Tronco Encéfalo (B)", "Integridad pupilar y corneal"), [("Reflejo pupilar y corneal presentes", 4), ("Una pupila fija y dilatada", 3), ("Reflejo pupilar o corneal ausente", 2), ("Ambos reflejos (pupilar y corneal) ausentes", 1), ("Reflejo pupilar, corneal y tusígeno ausentes", 0)]),
        (("4. Respiración (R)", "Patrón y drive ventilatorio"), [("Patrón respiratorio regular sin ventilación asistida", 4), ("Patrón respiratorio de Cheyne-Stokes", 3), ("Respira por encima de la frecuencia fijada en ventilador", 2), ("Respira a la frecuencia fijada en ventilador", 1), ("Apnea o sin respiración espontánea", 0)])
    ])
    e.set_risk_stratification([
        ("Afectación Leve", "13 - 16 puntos", "Pronóstico favorable, alta probabilidad de recuperación de la conciencia.", "green"),
        ("Afectación Moderada", "9 - 12 puntos", "Vigilancia neurológica estrecha en UCI, protección de vía aérea.", "yellow"),
        ("Coma Severo", "≤ 8 puntos", "Lesión cerebral grave, alto riesgo de mortalidad. Intubación y neurocríticos.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_four.pdf"))

    # 25. Glasgow Coma Scale (GCS-P)
    e = FormPDFEngineES("ESCALA DE COMA DE GLASGOW (GCS-P)", "Evaluación Neurológica Integral con Reactividad Pupilar", "1 a 15 (GCS) - Pupilas (0 a -2)", "Teasdale G, Jennett B. Lancet, 1974; Brennan PM, et al. J Neurosurg, 2018.")
    e.layout_mode = "double_col"
    e.extra_css = ".table-eval-col2 td { padding: 4px 6px !important; font-size: 7.2pt !important; } .sec-title { margin: 5px 0 2px !important; }"
    e.add_table_section("1. APERTURA OCULAR (E)", [
        ("Espontánea", [("Apertura antes del estímulo", 4)]),
        ("Al Sonido", [("Apertura tras orden o voz", 3)]),
        ("A la Presión", [("Apertura tras presión en lecho ungueal", 2)]),
        ("Ninguna", [("Sin apertura a ningún estímulo", 1)]),
        ("No Evaluable", [("Ojos cerrados por edema o trauma", 0)])
    ])
    e.add_table_section("2. RESPUESTA VERBAL (V)", [
        ("Orientada", [("Nombre, lugar y fecha correctos", 5)]),
        ("Confusa", [("Conversa pero desorientado", 4)]),
        ("Inapropiada", [("Palabras sueltas, no conversa", 3)]),
        ("Incomprensible", [("Gemidos o gruñidos solamente", 2)]),
        ("Ninguna", [("Sin respuesta vocal", 1)]),
        ("No Evaluable", [("Intubado / Traqueostomía", 0)])
    ])
    e.add_table_section("3. RESPUESTA MOTORA (M)", [
        ("Obedece Órdenes", [("Sigue instrucciones de 2 pasos", 6)]),
        ("Localiza Dolor", [("Lleva la mano por encima de clavícula", 5)]),
        ("Flexión Normal", [("Retiro rápido de la extremidad", 4)]),
        ("Flexión Anormal", [("Postura lenta de decorticación", 3)]),
        ("Extensión", [("Postura de descerebración", 2)]),
        ("Ninguna", [("Sin movimiento", 1)])
    ])
    e.add_table_section("4. REACTIVIDAD PUPILAR (PRS)", [
        ("Ambas Pupilas Reaccionan", [("Restar 0 puntos (0)", 0)]),
        ("Una Pupila Reacciona", [("Restar 1 punto (-1)", -1)]),
        ("Ninguna Pupila Reacciona", [("Restar 2 puntos (-2)", -2)])
    ])
    e.add_raw_html_section('''
    <div class="visual-box" style="margin-top:4px; font-size:7.2pt; line-height:1.28; text-align:left;">
        <b>Método Estándar de Evaluación:</b> Comprobar (factores interferentes) ➔ Observar (espontáneo) ➔ 
        Estimular (sonido primero, luego presión trapecio/supraorbitaria) ➔ Valorar mejor respuesta. <b>GCS-P = GCS - PRS</b>.
    </div>
    ''')
    e.set_risk_stratification([
        ("TCE Leve", "13 - 15 puntos", "Observar deterioro neurológico, controles neurológicos q1h.", "green"),
        ("TCE Moderado", "9 - 12 puntos", "TC craneal urgente, interconsulta a neurocirugía, ingreso en UCI.", "yellow"),
        ("TCE Severo", "≤ 8 puntos", "Vía aérea definitiva (intubación orotraqueal), manejo de PIC.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_glasgow.pdf"))

if __name__ == "__main__":
    run()
