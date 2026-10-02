# -*- coding: utf-8 -*-
"""e30.py: Spanish Scales 51 and 52 (qsofa, ramsay)"""
import os
from engine_es import FormPDFEngineES

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\ES"

def run():
    print("Compiling Spanish Scales 51 and 52...")
    # 51. qSOFA
    e = FormPDFEngineES("ESCALA QUICK SOFA (qSOFA)", "Cribado Rápido a la Cabecera de Sepsis fuera de la Unidad de Cuidados Intensivos", "3 puntos (Alto riesgo si ≥ 2)", "Singer M, et al. JAMA, 2016;315(8):801-810.")
    e.extra_css = ".table-eval td { padding: 9px 10px !important; } .opt-item { margin-bottom: 5px !important; }"
    e.add_table_section("TRES CRITERIOS CLÍNICOS A LA CABECERA", [
        (("1. Frecuencia Respiratoria (Taquipnea)", "Auscultar u observar respiraciones por minuto"), [("Normal: Frecuencia respiratoria < 22 respiraciones/minuto", 0), ("Alterado: Frecuencia respiratoria ≥ 22 respiraciones/minuto", 1)]),
        (("2. Estado Mental Alterado (SNC)", "Evaluación del estado de conciencia según Escala de Glasgow"), [("Normal: Escala de Coma de Glasgow = 15 (Alerta, totalmente orientado)", 0), ("Alterado: Escala de Coma de Glasgow < 15 (Confusion agudo, somnolencia, letargia)", 1)]),
        (("3. Presión Arterial Sistólica (Hipotensión)", "Medición por manguito estándar o vía arterial"), [("Normal: Presión Arterial Sistólica > 100 mmHg", 0), ("Alterado: Presión Arterial Sistólica ≤ 100 mmHg", 1)])
    ])
    e.add_raw_html_section('''
    <div class="visual-box" style="margin-top:6px; font-size:7.4pt; line-height:1.32; text-align:left;">
        <b>Bundle de Reanimación de la 1ª Hora de la Campaña Sobrevivir a la Sepsis:</b><br>
        1. Medir lactato sérico de inmediato (revalorar en 2-4 horas si lactato inicial &gt; 2 mmol/L).<br>
        2. Extraer hemocultivos antes de iniciar antibióticos (sin retrasar la terapia antimicrobiana).<br>
        3. Administrar antimicrobianos IV de amplio espectro en la 1ª hora.<br>
        4. Iniciar infusión rápida de cristaloides IV 30 mL/kg en caso de hipotensión (PAM &lt; 65 mmHg) o lactato ≥ 4 mmol/L.<br>
        5. Iniciar vasopresores (noradrenalina 1ª elección) durante o tras la reanimación con fluidos para PAM ≥ 65 mmHg.
    </div>
    ''')
    e.set_risk_stratification([
        ("Riesgo Bajo de Sepsis", "0 - 1 punto", "Mortalidad intrahospitalaria < 1%. Continuar tratamiento enfocado del foco infeccioso.", "green"),
        ("Riesgo Alto de Sepsis / Crítico", "≥ 2 puntos", "Mortalidad 3 a 14 veces mayor. Bundle de sepsis inmediato: hemocultivos, antibióticos IV, cristaloides 30 mL/kg, lactato y valoración por UCI.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_qsofa.pdf"))

    # 52. Ramsay
    e = FormPDFEngineES("ESCALA DE SEDACIÓN DE RAMSAY", "Evaluación del Nivel de Sedación y Respuesta en Cuidados Críticos", "6 niveles (Niveles 1 a 6)", "Ramsay MA, et al. BMJ, 1974;2(5920):656-659.")
    e.add_table_section("SEIS NIVELES CLÍNICOS DE SEDACIÓN", [
        (("Nivel 1 (Ansioso/a / Agitado/a)", "Sedación insuficiente"), [("Paciente ansioso/a, agitado/a, inquieto/a o ambos", 1)]),
        (("Nivel 2 (Cooperador/a / Tranquilo/a)", "Sedación objetivo"), [("Paciente cooperador/a, orientado/a y tranquilo/a", 2)]),
        (("Nivel 3 (Responde sólo a Órdenes)", "Sedación leve"), [("Paciente responde únicamente a órdenes verbales", 3)]),
        (("Nivel 4 (Respuesta Enérgica a Estímulos)", "Sedación moderada"), [("Respuesta enérgica al toque glabelar ligero o estímulo auditivo fuerte", 4)]),
        (("Nivel 5 (Respuesta Torpe / Perezosa)", "Sedación profunda"), [("Respuesta torpe/perezosa al toque glabelar ligero o estímulo auditivo fuerte", 5)]),
        (("Nivel 6 (Sin Respuesta)", "Sobresedación / Coma"), [("Sin respuesta al toque glabelar ni a estímulos auditivos fuertes", 6)])
    ])
    e.set_risk_stratification([
        ("Subsedado/a", "Nivel 1", "Riesgo de extubación no planificada, agitación. Optimizar analgesia/sedación.", "yellow"),
        ("Sedación Óptima", "Niveles 2 - 3", "Objetivo ideal para pacientes despiertos, ventilados o no intubados. Tranquilo.", "green"),
        ("Sedación Moderada", "Nivel 4", "Aceptable durante sincronización aguda con ventilación mecánica.", "green"),
        ("Sedación Profunda", "Niveles 5 - 6", "Riesgo de ventilación prolongada y debilidad de UCI. Planear ventana de despertar diaria.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_ramsay.pdf"))

if __name__ == "__main__":
    run()
