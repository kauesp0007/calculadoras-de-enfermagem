# -*- coding: utf-8 -*-
"""e13a.py: Spanish Scale 20 - Numeric Pain Rating Scale (ENV/EVA)"""
import os
from engine_es import FormPDFEngineES

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\ES"

def run():
    print("Compiling Spanish Scale 20: Pain Numeric Scale...")
    e = FormPDFEngineES("ESCALA NUMÉRICA DEL DOLOR (ENV / EVA)", "Valoración de la Intensidad del Dolor y Manejo del Protocolo Analgésico", "10 puntos", "Huskisson EC. Measurement of pain. Lancet, 1974;2(7889):1127-1131.")
    regua_svg = '''
<div class="visual-box" style="margin: 4px 0;">
    <div class="visual-title">REGLA VISUAL NUMÉRICA DE INTENSIDAD DEL DOLOR (0 A 10)</div>
    <svg width="100%" height="48" viewBox="0 0 700 48" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="gradDorES" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#16A34A" />
                <stop offset="30%" stop-color="#EAB308" />
                <stop offset="60%" stop-color="#F97316" />
                <stop offset="100%" stop-color="#DC2626" />
            </linearGradient>
        </defs>
        <rect x="20" y="6" width="660" height="12" rx="6" fill="url(#gradDorES)" stroke="#64748B" stroke-width="1" />
        <g font-family="Arial" font-size="11" font-weight="bold" text-anchor="middle" fill="#1e293b">
            <text x="20" y="32">0</text><line x1="20" y1="18" x2="20" y2="24" stroke="#1e293b" stroke-width="2"/>
            <text x="86" y="32">1</text><line x1="86" y1="18" x2="86" y2="22" stroke="#1e293b" stroke-width="1"/>
            <text x="152" y="32">2</text><line x1="152" y1="18" x2="152" y2="22" stroke="#1e293b" stroke-width="1"/>
            <text x="218" y="32">3</text><line x1="218" y1="18" x2="218" y2="22" stroke="#1e293b" stroke-width="1"/>
            <text x="284" y="32">4</text><line x1="284" y1="18" x2="284" y2="22" stroke="#1e293b" stroke-width="1"/>
            <text x="350" y="32">5</text><line x1="350" y1="18" x2="350" y2="24" stroke="#1e293b" stroke-width="2"/>
            <text x="416" y="32">6</text><line x1="416" y1="18" x2="416" y2="22" stroke="#1e293b" stroke-width="1"/>
            <text x="482" y="32">7</text><line x1="482" y1="18" x2="482" y2="22" stroke="#1e293b" stroke-width="1"/>
            <text x="548" y="32">8</text><line x1="548" y1="18" x2="548" y2="22" stroke="#1e293b" stroke-width="1"/>
            <text x="614" y="32">9</text><line x1="614" y1="18" x2="614" y2="22" stroke="#1e293b" stroke-width="1"/>
            <text x="680" y="32">10</text><line x1="680" y1="18" x2="680" y2="24" stroke="#1e293b" stroke-width="2"/>
        </g>
        <g font-family="Arial" font-size="8.5" font-weight="bold" fill="#475569">
            <text x="20" y="44" text-anchor="start">SIN DOLOR</text>
            <text x="218" y="44" text-anchor="middle">LEVE</text>
            <text x="416" y="44" text-anchor="middle">MODERADO</text>
            <text x="614" y="44" text-anchor="middle">SEVERO</text>
            <text x="680" y="44" text-anchor="end">MÁXIMO DOLOR</text>
        </g>
    </svg>
</div>
'''
    e.add_raw_html_section(regua_svg)
    e.add_table_section("CARACTERÍSTICAS CLÍNICAS DEL DOLOR", [
        (("1. Localización Anatómica", "Región corporal principal del dolor"), [("Cabeza / Cuello", 1), ("Tórax / Pecho", 2), ("Abdomen / Pelvis", 3), ("Extremidades superiores / inferiores", 4), ("Columna / Espalda", 5)]),
        (("2. Tipo de Dolor (Cualidad)", "Naturaleza de la sensación dolorosa"), [("Urente / Quemante", 1), ("Pulsátil / Culpable", 2), ("Punzante / Punzante agudo", 3), ("Sordo / Opresivo / Pesado", 4), ("Crampoide / Cólico", 5)]),
        (("3. Patrón Temporal", "Frecuencia y comportamiento"), [("Constante / Continuo", 1), ("Intermittent / Periódico", 2), ("Incidental (al mover/toser)", 3), ("En reposo", 4)]),
        (("4. Factores Agravantes / Aliviantes", "Respuesta al posicionamiento o reposo"), [("Mejora con reposo / calor / frío", 1), ("Empeora con palpación / movimiento", 2), ("Refractario a medidas leves", 3)])
    ])
    e.set_risk_stratification([
        ("Sin Dolor", "0 puntos", "Paciente confortable. Mantener monitorización de rutina y medidas de confort.", "green"),
        ("Dolor Leve", "1 - 3 puntos", "Medidas no farmacológicas (posicionamiento, calor/frío) y analgésicos no opioides.", "yellow"),
        ("Dolor Moderado", "4 - 6 puntos", "Analgesia pautada, opioide débil / esquema multimodal, reevaluar en 60 min.", "orange"),
        ("Dolor Severo", "7 - 10 puntos", "Intervención urgente: opioide potente IV, control de constantes, reevaluar en 30 min.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_escalanumerica.pdf"))

if __name__ == "__main__":
    run()
