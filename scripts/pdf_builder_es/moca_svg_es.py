# -*- coding: utf-8 -*-
"""moca_svg_es.py: SVG vector assets for MoCA scale in Spanish"""

VIS_HTML = '''
<div class="sec-title">1. VISOESPACIAL / EJECUTIVA (5 PUNTOS)</div>
<div style="display:grid; grid-template-columns: 2fr 1fr 1fr; gap: 4px; margin-bottom: 2px;">
    <div class="visual-box">
        <div class="visual-title">1. Prueba de Trazado (Alternar 1-A-2-B-3-C-4-D-5-E)</div>
        <svg width="100%" height="68" viewBox="0 0 200 75" xmlns="http://www.w3.org/2000/svg">
            <style>.c{fill:#fff;stroke:#1e293b;stroke-width:1.2;}.t{font-family:Arial;font-size:9px;font-weight:bold;text-anchor:middle;dominant-baseline:central;}</style>
            <circle cx="80" cy="40" r="8" class="c"/><text x="80" y="40" class="t">1</text>
            <circle cx="115" cy="18" r="8" class="c"/><text x="115" y="18" class="t">A</text>
            <circle cx="150" cy="35" r="8" class="c"/><text x="150" y="35" class="t">2</text>
            <circle cx="115" cy="55" r="8" class="c"/><text x="115" y="55" class="t">B</text>
            <circle cx="50" cy="18" r="8" class="c"/><text x="50" y="18" class="t">E</text>
            <circle cx="25" cy="40" r="8" class="c"/><text x="25" y="40" class="t">5</text>
            <circle cx="45" cy="62" r="8" class="c"/><text x="45" y="62" class="t">D</text>
            <circle cx="78" cy="65" r="8" class="c"/><text x="78" y="65" class="t">C</text>
            <circle cx="150" cy="62" r="8" class="c"/><text x="150" y="62" class="t">3</text>
            <circle cx="180" cy="48" r="8" class="c"/><text x="180" y="48" class="t">4</text>
            <line x1="86" y1="35" x2="108" y2="23" stroke="#475569" stroke-width="1" stroke-dasharray="2,2"/>
            <line x1="122" y1="22" x2="143" y2="31" stroke="#475569" stroke-width="1" stroke-dasharray="2,2"/>
            <text x="80" y="52" font-family="Arial" font-size="6.5" font-weight="bold" fill="#2563EB" text-anchor="middle">Inicio</text>
            <text x="50" y="8" font-family="Arial" font-size="6.5" font-weight="bold" fill="#16A34A" text-anchor="middle">Fin</text>
        </svg>
        <div style="font-size:6.8pt; text-align:right;">[ &nbsp; ] <b>(1 pt)</b></div>
    </div>
    <div class="visual-box">
        <div class="visual-title">2. Copia del Cubo</div>
        <svg width="100%" height="68" viewBox="0 0 80 65" xmlns="http://www.w3.org/2000/svg">
            <polygon points="15,22 45,12 70,22 70,50 45,60 15,50" fill="none" stroke="#1e293b" stroke-width="1.2"/>
            <line x1="15" y1="22" x2="45" y2="12" stroke="#1e293b" stroke-width="1.2"/>
            <line x1="45" y1="12" x2="70" y2="22" stroke="#1e293b" stroke-width="1.2"/>
            <line x1="45" y1="12" x2="45" y2="60" stroke="#1e293b" stroke-width="1.2"/>
            <line x1="45" y1="60" x2="15" y2="50" stroke="#1e293b" stroke-width="1.2"/>
            <line x1="45" y1="60" x2="70" y2="50" stroke="#1e293b" stroke-width="1.2"/>
        </svg>
        <div style="font-size:6.8pt; text-align:right;">[ &nbsp; ] <b>(1 pt)</b></div>
    </div>
    <div class="visual-box">
        <div class="visual-title">3. Dibujo del Reloj (11:10)</div>
        <svg width="100%" height="68" viewBox="0 0 80 65" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="32" r="28" fill="none" stroke="#1e293b" stroke-width="1.2"/>
            <text x="40" y="12" font-family="Arial" font-size="7" font-weight="bold" text-anchor="middle">12</text>
            <text x="63" y="34" font-family="Arial" font-size="7" font-weight="bold" text-anchor="middle">3</text>
            <text x="40" y="57" font-family="Arial" font-size="7" font-weight="bold" text-anchor="middle">6</text>
            <text x="17" y="34" font-family="Arial" font-size="7" font-weight="bold" text-anchor="middle">9</text>
            <line x1="40" y1="32" x2="31" y2="19" stroke="#1e293b" stroke-width="1.8"/>
            <line x1="40" y1="32" x2="55" y2="25" stroke="#1e293b" stroke-width="1.3"/>
            <circle cx="40" cy="32" r="1.5" fill="#1e293b"/>
        </svg>
        <div style="font-size:6.8pt; text-align:right;">Contorno [ &nbsp; ] Núm [ &nbsp; ] Agujas [ &nbsp; ] <b>(3 pts)</b></div>
    </div>
</div>
'''

NAMING_HTML = '''
<div class="sec-title">2. IDENTIFICACIÓN DE ANIMALES (3 PUNTOS)</div>
<div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px; margin-bottom: 2px;">
    <div class="visual-box">
        <svg width="100%" height="32" viewBox="0 0 100 32" xmlns="http://www.w3.org/2000/svg">
            <path d="M15,24 Q25,8 40,16 Q60,10 75,18 Q85,14 90,24 Z" fill="none" stroke="#1e293b" stroke-width="1.2"/>
            <circle cx="28" cy="14" r="7" fill="none" stroke="#1e293b" stroke-width="1.2"/>
        </svg>
        <div style="font-size:6.8pt;"><b>León:</b> [ &nbsp; ] (1 pt)</div>
    </div>
    <div class="visual-box">
        <svg width="100%" height="32" viewBox="0 0 100 32" xmlns="http://www.w3.org/2000/svg">
            <path d="M10,24 Q20,12 35,16 L45,10 L50,16 Q75,12 85,24 Z" fill="none" stroke="#1e293b" stroke-width="1.2"/>
            <polygon points="12,18 5,14 15,14" fill="#1e293b"/>
        </svg>
        <div style="font-size:6.8pt;"><b>Rinoceronte:</b> [ &nbsp; ] (1 pt)</div>
    </div>
    <div class="visual-box">
        <svg width="100%" height="32" viewBox="0 0 100 32" xmlns="http://www.w3.org/2000/svg">
            <path d="M10,24 Q18,6 26,16 Q36,6 48,16 Q62,6 74,16 Q85,12 90,24 Z" fill="none" stroke="#1e293b" stroke-width="1.2"/>
        </svg>
        <div style="font-size:6.8pt;"><b>Camello:</b> [ &nbsp; ] (1 pt)</div>
    </div>
</div>
'''
