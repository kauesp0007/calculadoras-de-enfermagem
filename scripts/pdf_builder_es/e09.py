# -*- coding: utf-8 -*-
"""e09.py: Spanish Scales 12 and 13 (capurro, cincinnati)"""
import os
from engine_es import FormPDFEngineES

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\ES"

def run():
    print("Compiling Spanish Scales 12 and 13...")
    # 12. Capurro
    e = FormPDFEngineES("TEST DE CAPURRO", "Evaluación de la Edad Gestacional en el Recién Nacido (Somático y Neurológico)", "Fórmula: [204 + Puntos] ÷ 7", "Capurro H, et al. J Pediatr, 1978;93(1):120-122.")
    e.add_table_section("CRITERIOS SOMÁTICOS Y NEUROLÓGICOS", [
        (("1. Forma del Pabellón Auricular", "Incurvación del borde del pabellón"), [("Aplanado, sin forma, sin incurvación", 0), ("Borde superior parcialmente incurvado", 8), ("Toda la parte superior incurvada de forma definida", 16), ("Pabellón totalmente incurvado, cartílago firme", 24)]),
        (("2. Tamaño de la Glándula Mamaria", "Palpación del nódulo mamario"), [("Nódulo no palpable", 0), ("Nódulo palpable < 5 mm de diámetro", 5), ("Nódulo palpable entre 5 y 10 mm de diámetro", 10), ("Nódulo palpable > 10 mm de diámetro", 15)]),
        (("3. Formación del Pezón", "Elevación del pezón y punteado de la areola"), [("Apenas visible, sin areola", 0), ("Pezón visible, areola plana y lisa", 5), ("Areola elevada, borde no punteado", 10), ("Areola elevada, borde punteado con botón definido", 15)]),
        (("4. Textura de la Piel", "Inspección y palpación de la epidermis"), [("Muy fina, gelatinosa, lisa", 0), ("Lisa, grosor medio, descamación superficial", 10), ("Grietas superficiales, pálida, descamación en manos/pies", 15), ("Apergaminada, grietas profundas", 20)]),
        (("5. Pliegues Plantares", "Pliegues en la planta del pie al extender"), [("Sin pliegues visibles en la planta", 0), ("Marcas rojas tenues en la mitad anterior", 5), ("Pliegues definidos en la mitad anterior", 10), ("Surcos profundos en más de la mitad anterior", 15), ("Surcos profundos en toda la planta", 20)]),
        (("6. Signo de la Bufanda (si somático+neuro)", "Posición del codo cruzado sobre el tórax"), [("El codo llega a la línea axilar opuesta", 0), ("El codo entre la axila opuesta y la línea media", 6), ("El codo llega a la línea media", 12), ("El codo no llega a la línea media", 18)])
    ])
    e.set_risk_stratification([
        ("Neonato Postérmino", "≥ 42 semanas", "Riesgo de insuficiencia placentaria, vigilancia de meconio, glucemia neonatal.", "yellow"),
        ("Neonato a Término", "37 - 41 semanas", "Neonato maduro. Alojamiento conjunto, contacto piel con piel, lactancia materna exclusiva.", "green"),
        ("Prematuro Moderado", "32 - 36 semanas", "Soporte de termorregulación, evaluación de succión/deglución, fototerapia.", "yellow"),
        ("Prematuro Extremo", "< 32 semanas", "Ingreso en UCIN, soporte respiratorio (surfactante), cuna radiante, mínima manipulación.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_capurro.pdf"))

    # 13. Cincinnati
    e = FormPDFEngineES("ESCALA PREHOSPITALARIA DE ICTUS DE CINCINNATI (CPSS)", "Herramienta de Detección Rápida de Ictus Agudo", "3 criterios (Positivo si ≥ 1 alterado)", "Kothari RU, et al. Acad Emerg Med, 1999;6(10):987-990.")
    e.extra_css = ".table-eval td { padding: 9px 10px !important; } .opt-item { margin-bottom: 5px !important; }"
    e.add_table_section("TRES HALLAZGOS DEL EXAMEN FÍSICO", [
        (("1. Asimetría Facial (Caída)", "Hacer enseñar los dientes o sonreír"), [("Normal: Ambos lados de la cara se mueven igual y simétricamente", 0), ("Alterado: Un lado de la cara no se mueve bien o se cae", 1)]),
        (("2. Derivación del Brazo", "Cerrar ojos, extender brazos al frente, palmas arriba, 10s"), [("Normal: Ambos brazos se mueven igual o no caen", 0), ("Alterado: Un brazo no se mueve o cae hacia abajo respecto al otro", 1)]),
        (("3. Lenguaje Anormal", "Pedir al paciente que repita 'El perro camina por la calle'"), [("Normal: Utiliza palabras correctas sin arrastrar la voz", 0), ("Alterado: Arrastra las palabras, usa palabras incorrectas o es incapaz de hablar", 1)])
    ])
    e.add_raw_html_section('''
    <div class="visual-box" style="margin-top:6px; font-size:7.4pt; line-height:1.32; text-align:left;">
        <b>Protocolo Prehospitalario de Ictus y Tiempos Objetivo:</b>
        Registrar hora exacta de Inicio de Síntomas / Última Hora Conocido Sano (LKW): ____:____ | Glucemia capilar (descartar hipoglucemia) | 
        Preaviso a Urgencias ("Código Ictus") | Tiempo Objetivo Puerta-TC: < 20 min | Tiempo Objetivo Puerta-Aguja: < 45 min.
    </div>
    <div class="visual-box" style="margin-top:6px; font-size:7.2pt; line-height:1.30; text-align:left;">
        <b>Lista de Chequeo de Criterios de Revascularización Aguda:</b><br>
        • ¿Tiempo de inicio de síntomas &lt; 4.5 horas? [ &nbsp; ] Sí &nbsp;&nbsp; [ &nbsp; ] No &nbsp;&nbsp;&nbsp;&nbsp;
        • ¿TC Craneal simple: Sin hemorragia intracraneal? [ &nbsp; ] Sí &nbsp;&nbsp; [ &nbsp; ] No<br>
        • ¿Presión arterial &lt; 185/110 mmHg? [ &nbsp; ] Sí &nbsp;&nbsp; [ &nbsp; ] No &nbsp;&nbsp;&nbsp;&nbsp;
        • ¿Sin hemorragia interna activa ni cirugía mayor en últimos 21 días? [ &nbsp; ] Sí &nbsp;&nbsp; [ &nbsp; ] No
    </div>
    ''')
    e.set_risk_stratification([
        ("Ictus Poco Probable (0 Alterados)", "0 criterios", "Reevaluar etiologías alternativas (hipoglucemia, parálisis de Bell, migraña).", "green"),
        ("Sospecha de Ictus Agudo (≥1 Alterado)", "1 a 3 criterios", "72% (1 criterio) a >85% (3 criterios) de probabilidad de ictus. Código Ictus inmediato y TC urgente.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_cincinnati.pdf"))

if __name__ == "__main__":
    run()
