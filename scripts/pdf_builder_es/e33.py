# -*- coding: utf-8 -*-
"""e33.py: Spanish Scales 57 and 58 (sistema_sinbad, sofa)"""
import os
from engine_es import FormPDFEngineES

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\ES"

def run():
    print("Compiling Spanish Scales 57 and 58...")
    # 57. SINBAD
    e = FormPDFEngineES("SISTEMA SINBAD PARA PIE DIABÉTICO", "Clasificación de Severidad de Úlcera de Pie Diabético y Pronóstico de Curación", "6 puntos (0 a 6)", "Ince P, et al. Diabetes Care, 2008;31(5):969-973.")
    e.add_table_section("SEIS CARACTERÍSTICAS CLÍNICAS (1 PT CADA UNA)", [
        (("S - Site (Ubicación)", "Localización anatómica en el pie"), [("Úlcera en antepié", 0), ("Úlcera en mediopié o retropié (talón)", 1)]),
        (("I - Ischemia (Isquemia)", "Perfusión arterial pedia"), [("Pulsos pedios palpables intactos (dorsal del pie / tibial posterior)", 0), ("Pulsos pedios reducidos / ausentes o isquemia clínica", 1)]),
        (("N - Neuropathy (Neuropatía)", "Sensibilidad protectora"), [("Sensibilidad protectora intacta (monofilamento Semmes-Weinstein 10g)", 0), ("Pérdida de sensibilidad protectora (neuropatía sensitiva)", 1)]),
        (("B - Bacterial Infection (Infección)", "Signos infecciosos y celulitis"), [("Herida no infectada", 0), ("Signos clínicos de infección (purulencia, celulitis > 2cm, osteítis)", 1)]),
        (("A - Area (Área / Extensión)", "Medida de la superficie de la úlcera"), [("Superficie de la úlcera < 1 cm²", 0), ("Superficie de la úlcera ≥ 1 cm²", 1)]),
        (("D - Depth (Profundidad)", "Penetración tisular en profundidad"), [("Úlcera confinada a piel y tejido subcutáneo", 0), ("Úlcera profunda que alcanza músculo, tendón, cápsula articular o hueso", 1)])
    ])
    e.set_risk_stratification([
        ("Severidad Baja / Alta Curación", "0 - 2 puntos", "Cuidado de herida, calzado de descarga, control glucémico estricto. Curación favorable.", "green"),
        ("Severidad Moderada", "3 - 4 puntos", "Equipo de curaciones complejas, antibióticos según cultivo, estudios vasculares.", "yellow"),
        ("Severidad Alta / Riesgo Amputación", "5 - 6 puntos", "Riesgo alto de amputación mayor. Interconsulta urgente a vascular, desbridamiento e IV.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_sistema_sinbad.pdf"))

    # 58. SOFA
    e = FormPDFEngineES("ESCALA SOFA (SEQUENTIAL ORGAN FAILURE ASSESSMENT)", "Evaluación Secuencial del Fallo Orgánico y Riesgo de Mortalidad en UCI", "24 puntos (0 a 24)", "Vincent JL, et al. Intensive Care Med, 1996;22(7):707-710.")
    e.layout_mode = "single"
    e.extra_css = ".table-eval td { padding: 4px 7px !important; font-size: 7.4pt !important; } .opt-item { margin-bottom: 1.5px !important; font-size: 7.3pt !important; } .sec-title { margin: 5px 0 2px !important; }"
    e.add_table_section("CRITERIOS DE FALLO DE SEIS SISTEMAS ORGÁNICOS", [
        (("1. Respiratorio", "PaO2 / FiO2 mmHg y soporte ventilatorio"), [("PaO2 / FiO2 ≥ 400 mmHg (0)", 0), ("PaO2 / FiO2 < 400 mmHg (1)", 1), ("PaO2 / FiO2 < 300 mmHg (2)", 2), ("PaO2 / FiO2 < 200 mmHg con ventilación invasiva (3)", 3), ("PaO2 / FiO2 < 100 mmHg con ventilación invasiva (4)", 4)]),
        (("2. Coagulación", "Recuento de plaquetas (x10³/μL)"), [("Plaquetas ≥ 150 x10³/μL (0)", 0), ("Plaquetas < 150 x10³/μL (1)", 1), ("Plaquetas < 100 x10³/μL (2)", 2), ("Plaquetas < 50 x10³/μL (3)", 3), ("Plaquetas < 20 x10³/μL (4)", 4)]),
        (("3. Hepático", "Bilirrubina total sérica (mg/dL)"), [("Bilirrubina < 1.2 mg/dL (0)", 0), ("Bilirrubina 1.2 - 1.9 mg/dL (1)", 1), ("Bilirrubina 2.0 - 5.9 mg/dL (2)", 2), ("Bilirrubina 6.0 - 11.9 mg/dL (3)", 3), ("Bilirrubina ≥ 12.0 mg/dL (4)", 4)]),
        (("4. Cardiovascular", "Presión Arterial Media y Dosis Vasopresoras (mcg/kg/min)"), [("PAM ≥ 70 mmHg (0)", 0), ("PAM < 70 mmHg (1)", 1), ("Dopamina ≤ 5 o Dobutamina cualquier dosis (2)", 2), ("Dopamina > 5 o Noradrenalina ≤ 0.1 (3)", 3), ("Dopamina > 15 o Noradrenalina > 0.1 (4)", 4)]),
        (("5. Sistema Nervioso Central", "Escala de Coma de Glasgow (GCS)"), [("GCS = 15 (0)", 0), ("GCS = 13 - 14 (1)", 1), ("GCS = 10 - 12 (2)", 2), ("GCS = 6 - 9 (3)", 3), ("GCS < 6 (4)", 4)]),
        (("6. Renal", "Creatinina sérica (mg/dL) o Diuresis (mL/día)"), [("Creatinina < 1.2 mg/dL (0)", 0), ("Creatinina 1.2 - 1.9 mg/dL (1)", 1), ("Creatinina 2.0 - 3.4 mg/dL (2)", 2), ("Creatinina 3.5 - 4.9 mg/dL o Diuresis < 500 mL/d (3)", 3), ("Creatinina ≥ 5.0 mg/dL o Diuresis < 200 mL/d (4)", 4)])
    ])
    e.set_risk_stratification([
        ("Disfunción Baja", "0 - 6 puntos", "Mortalidad < 10%. Monitorización continua de constantes e indicadores metabólicos.", "green"),
        ("Fallo Moderado", "7 - 9 puntos", "Mortalidad 15 - 20%. Soporte de órganos afectos, optimización de perfusión.", "yellow"),
        ("Fallo Multiorgánico Severo", "10 - 12 puntos", "Mortalidad 40 - 50%. Terapia de reemplazo renal, ventilación, inotrópicos.", "orange"),
        ("Crítico / Refractario", "> 12 puntos", "Mortalidad > 80%. Soporte multivasopresor, reanimación intensiva crítica.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_sofa.pdf"))

if __name__ == "__main__":
    run()
