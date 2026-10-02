# -*- coding: utf-8 -*-
"""b10b.py: Scale 20 (escalanumerica)"""
import os
from engine_en import FormPDFEngineEN

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\EN"

def run():
    print("Compiling Scale 20: Pain Numeric Scale...")
    e = FormPDFEngineEN("NUMERIC RATING SCALE FOR PAIN (NRS / VAS)", "Pain Intensity Assessment and Analgesic Protocol Management", "10 points", "Huskisson EC. Measurement of pain. Lancet, 1974;2(7889):1127-1131.")
    regua_svg = '''
<div class="visual-box" style="margin: 4px 0;">
    <div class="visual-title">VISUAL NUMERIC PAIN INTENSITY RULER (0 TO 10)</div>
    <svg width="100%" height="48" viewBox="0 0 700 48" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="gradDorEN" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#16A34A" />
                <stop offset="30%" stop-color="#EAB308" />
                <stop offset="60%" stop-color="#F97316" />
                <stop offset="100%" stop-color="#DC2626" />
            </linearGradient>
        </defs>
        <rect x="20" y="6" width="660" height="12" rx="6" fill="url(#gradDorEN)" stroke="#64748B" stroke-width="1" />
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
            <text x="20" y="44" text-anchor="start">NO PAIN</text>
            <text x="218" y="44" text-anchor="middle">MILD</text>
            <text x="416" y="44" text-anchor="middle">MODERATE</text>
            <text x="614" y="44" text-anchor="middle">SEVERE</text>
            <text x="680" y="44" text-anchor="end">WORST PAIN</text>
        </g>
    </svg>
</div>
'''
    e.add_raw_html_section(regua_svg)
    e.add_table_section("CLINICAL PAIN CHARACTERISTICS", [
        (("1. Anatomical Location", "Primary pain site"), [("Head / Neck", 1), ("Chest / Thorax", 2), ("Abdomen / Pelvis", 3), ("Upper / Lower Limbs", 4), ("Spine / Back", 5)]),
        (("2. Pain Quality", "Nature of sensation"), [("Burning / Stinging", 1), ("Throbbing / Pulsing", 2), ("Sharp / Stabbing", 3), ("Aching / Dull pressure", 4), ("Cramping / Spasmodic", 5)]),
        (("3. Temporal Pattern", "Frequency and behavior"), [("Constant / Continuous", 1), ("Intermittent / Periodic", 2), ("Incident (on movement/cough)", 3), ("At rest", 4)]),
        (("4. Relieving / Aggravating", "Response to positioning"), [("Improves with rest / heat / ice", 1), ("Worsens with palpation / movement", 2), ("Refractory to mild measures", 3)])
    ])
    e.set_risk_stratification([
        ("No Pain", "0 points", "Patient comfortable. Maintain routine monitoring and comfort measures.", "green"),
        ("Mild Pain", "1 - 3 points", "Non-pharmacological comfort (positioning, cold/heat) and non-opioid analgesics.", "yellow"),
        ("Moderate Pain", "4 - 6 points", "Scheduled analgesia, weak opioid / multimodal regimen, reassess in 60 min.", "orange"),
        ("Severe Pain", "7 - 10 points", "Urgent intervention: potent IV opioid bolus, vital signs check, reassess in 30 min.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_escalanumerica.pdf"))

if __name__ == "__main__":
    run()
