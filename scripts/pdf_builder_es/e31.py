# -*- coding: utf-8 -*-
"""e31.py: Spanish Scales 53 and 54 (rancholosamigos, richmond)"""
import os
from engine_es import FormPDFEngineES

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\ES"

def run():
    print("Compiling Spanish Scales 53 and 54...")
    # 53. Rancho Los Amigos
    e = FormPDFEngineES("NIVELES DE RANCHO LOS AMIGOS (RLAS)", "Evaluación de la Recuperación Cognitiva tras Traumatismo Craneoencefálico", "Niveles I a VIII (1 a 8)", "Hagen C, et al. Rehabilitation of Head Injured Adult, 1979.")
    e.layout_mode = "single"
    e.extra_css = ".table-eval td { padding: 5px 8px !important; font-size: 7.5pt !important; } .opt-item { margin-bottom: 2px !important; font-size: 7.4pt !important; }"
    e.add_table_section("OCHO NIVELES DE FUNCIONAMIENTO COGNITIVO", [
        (("Nivel I: Sin Respuesta", "Coma / asistencia total"), [("Completamente arreactivo/a a estímulos visuales, auditivos o dolorosos. Parece profundamente dormido/a.", 1)]),
        (("Nivel II: Respuesta Generalizada", "Refleja / asistencia total"), [("Respuesta refleja no específica e inconsistente al dolor (sudoración, gemidos, postura).", 2)]),
        (("Nivel III: Respuesta Localizada", "Específica / asistencia total"), [("Parpadea ante la luz, gira hacia sonidos, enfoca objetos, retira tubos de forma inconsistente.", 3)]),
        (("Nivel IV: Confuso-Agitado", "Alerta / asistencia máxima"), [("Estado de hiperactividad, conducta estrafalaria no intencionada, gritos, agresividad, sin memoria reciente.", 4)]),
        (("Nivel V: Confuso-Inapropiado", "No agitado / asistencia máxima"), [("Alerta, responde a órdenes simples, altamente distraíble, vagabundeo, deterioro severo de memoria.", 5)]),
        (("Nivel VI: Confuso-Apropiado", "Dirigido / asistencia moderada"), [("Inconsistentemente orientado en tiempo/espacio, muestra aprendizaje previo, requiere pautas.", 6)]),
        (("Nivel VII: Automático-Apropiado", "Rutina / asistencia mínima"), [("Apropiado y orientado en entorno, rutina diaria robótica, conciencia superficial, juicio alterado.", 7)]),
        (("Nivel VIII: Con Propósito-Apropiado", "Autónomo / supervisión"), [("Consistente orientado, recuerda eventos pasados y recientes, integra cambios, autónomo con ayudas.", 8)])
    ])
    e.set_risk_stratification([
        ("Coma Severo (Niveles I-III)", "Niveles 1 - 3", "Asistencia total. Prevención de contracturas, lesiones de piel, protocolo de estimulación sensorial.", "red"),
        ("Confuso Agitado (Niveles IV-V)", "Niveles 4 - 5", "Asistencia máxima. Entorno de baja estimulación, supervisión de seguridad 1:1.", "orange"),
        ("Reintegración (Niveles VI-VIII)", "Niveles 6 - 8", "Asistencia mod a mín. Rutina estructurada, rehabilitación cognitiva, educación familiar.", "green")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_rancholosamigos.pdf"))

    # 54. RASS
    e = FormPDFEngineES("ESCALA DE AGITACIÓN Y SEDACIÓN DE RICHMOND (RASS)", "Titulación Dirigida de la Sedación y Agitación en Cuidados Críticos", "10 niveles (-5 a +4)", "Sessler CN, et al. Am J Respir Crit Care Med, 2002;166(10):1338-1344.")
    e.layout_mode = "single"
    e.extra_css = ".table-eval td { padding: 4px 7px !important; font-size: 7.4pt !important; } .opt-item { margin-bottom: 1.5px !important; font-size: 7.3pt !important; }"
    e.add_table_section("DIEZ NIVELES DE AGITACIÓN Y SEDACIÓN", [
        (("+4: Combativo/a", "Conducta violenta"), [("Completamente combativo/a o violento/a; peligro inmediato para la seguridad del personal.", 4)]),
        (("+3: Muy Agitado/a", "Conducta agresiva"), [("Se retira o se quita tubos o catéteres; agresivo/a.", 3)]),
        (("+2: Agitado/a", "Movimiento no intencionado"), [("Movimientos no intencionados frecuentes o asincronía paciente-ventilador.", 2)]),
        (("+1: Inquieto/a", "Ansioso/a"), [("Ansioso/a o aprensivo/a pero los movimientos no son agresivos ni vigorosos.", 1)]),
        (("0: Alerta y Tranquilo/a", "Estado basal objetivo"), [("Espontáneamente alerta, tranquilo/a, presta atención al examinador.", 0)]),
        (("-1: Somnoliento/a", "Sedación leve"), [("No está plenamente alerta, pero mantiene el despertar (contacto visual a la voz ≥ 10s).", -1)]),
        (("-2: Sedación Leve", "Contacto visual breve"), [("Se despierta brevemente con contacto visual a la voz (< 10 segundos).", -2)]),
        (("-3: Sedación Moderada", "Movimiento a la voz"), [("Cualquier movimiento (apertura ocular o extremidades) a la voz, pero sin contacto visual.", -3)]),
        (("-4: Sedación Profunda", "Estímulo físico sólo"), [("Sin respuesta a la voz, pero algún movimiento al estímulo físico (sacudida de hombro).", -4)]),
        (("-5: Inconsciente / Arreactivo", "Sin respuesta al dolor"), [("Sin respuesta a la voz ni al estímulo físico (frotamiento esternal / presión ungueal).", -5)])
    ])
    e.set_risk_stratification([
        ("Estado Agitado (+1 a +4)", "+1 a +4", "Evaluar dolor (BPS/CPOT), evaluar delirium (CAM-ICU), tratar causa desencadenante.", "yellow"),
        ("Sedación Objetivo (0 a -1)", "0 a -1", "Objetivo ideal para la mayoría de pacientes despiertos y ventilados en UCI.", "green"),
        ("Sedación Moderada (-2 a -3)", "-2 a -3", "Objetivo en asincronía severa con ventilador o decúbito prono.", "green"),
        ("Sedación Profunda (-4 a -5)", "-4 a -5", "Realizar prueba de despertar espontáneo (SAT) diaria salvo contraindicación.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_richmond.pdf"))

if __name__ == "__main__":
    run()
