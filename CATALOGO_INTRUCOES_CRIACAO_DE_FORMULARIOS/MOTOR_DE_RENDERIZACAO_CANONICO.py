# -*- coding: utf-8 -*-
"""
MOTOR_DE_RENDERIZACAO_CANONICO.py
Motor Universal de Geração de Formulários Hospitalares em PDF (A4 - 1 Página)
Calculadoras de Enfermagem — www.calculadorasdeenfermagem.com.br
"""

import os
import subprocess

class FormPDFEngine:
    """
    Construtor e renderizador universal de formulários hospitalares em PDF.
    Gera HTML contido em 1 página A4 e compila via Chromium/Edge headless.
    """
    def __init__(self, title, subtitle, max_score, reference):
        self.title = title
        self.subtitle = subtitle
        self.max_score = max_score
        self.reference = reference
        self.sections_html = []
        self.risk_html = ""
        self.extra_css = ""
        self.layout_mode = "single"  # "single" ou "double_col"

    def add_table_section(self, section_title, rows_data):
        """rows_data: lista de tuplas (Item, [(Opcao, Pontos), ...])
        Item pode ser string ou tupla (Titulo, Descricao)"""
        html = f'<div class="sec-title">{section_title}</div>'
        if self.layout_mode == "double_col":
            html += '<table class="table-eval"><thead><tr><th style="width:68%">Critério / Parâmetro</th><th style="width:32%; text-align:right">Opções e Pontos</th></tr></thead><tbody>'
            for item, options in rows_data:
                param_title = item[0] if isinstance(item, tuple) else item
                opt_str = " &nbsp;|&nbsp; ".join([f'<span class="sq"></span> {opt} <b>({pts})</b>' for opt, pts in options])
                html += f'<tr><td class="td-lbl">{param_title}</td><td class="td-pts">{opt_str}</td></tr>'
        else:
            html += '<table class="table-eval"><thead><tr><th style="width:28%">Critério / Parâmetro</th><th style="width:58%">Opções e Pontuação</th><th style="width:14%; text-align:center">Escore</th></tr></thead><tbody>'
            for item, options in rows_data:
                if isinstance(item, tuple) and len(item) == 2:
                    param_html = f'{item[0]}<div class="param-desc">{item[1]}</div>'
                else:
                    param_html = f'{item}'
                opts_html = "".join([f'<div class="opt-item"><span class="sq"></span> {opt} <b>({pts})</b></div>' for opt, pts in options])
                html += f'<tr><td class="td-param">{param_html}</td><td class="td-options">{opts_html}</td><td class="td-score">[ &nbsp;&nbsp;&nbsp;&nbsp; ]</td></tr>'
        html += '</tbody></table>'
        self.sections_html.append(html)

    def add_raw_html_section(self, raw_html):
        """Injeta diagramas SVG ou grids personalizados."""
        self.sections_html.append(raw_html)

    def set_risk_stratification(self, cards_list):
        """cards_list: lista de tuplas (Label, Faixa, Conduta, ColorClass)"""
        html = '<div class="sec-title">ESTRATIFICAÇÃO DE RISCO E CONDUTAS DE ENFERMAGEM</div>'
        html += '<div class="risk-grid">'
        for label, score_range, conduta, color_cls in cards_list:
            html += f'''
            <div class="risk-card {color_cls}">
                <div class="risk-head"><b>{label}</b> ({score_range})</div>
                <div class="risk-body">{conduta}</div>
            </div>
            '''
        html += '</div>'
        self.risk_html = html

    def get_base_css(self):
        css_path = os.path.join(os.path.dirname(__file__), "ESTILO_BASE_IMPRESSAO_A4.css")
        if os.path.exists(css_path):
            with open(css_path, "r", encoding="utf-8") as f:
                return f.read()
        return ""

    def render(self, output_pdf_path):
        """Compila o HTML e invoca o navegador headless para produzir o PDF."""
        css_content = self.get_base_css() + "\n" + self.extra_css

        if self.layout_mode == "double_col":
            mid = (len(self.sections_html) + 1) // 2
            col1 = "".join(self.sections_html[:mid])
            col2 = "".join(self.sections_html[mid:])
            body_content = f'<div class="cols-2"><div>{col1}</div><div>{col2}</div></div>'
        else:
            body_content = "".join(self.sections_html)

        html_content = f'''<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>{self.title}</title>
<style>
{css_content}
</style>
</head>
<body>
<div class="sheet">
    <div>
        <div class="header">
            <div class="brand">CALCULADORAS DE ENFERMAGEM</div>
            <div class="title">{self.title}</div>
            <div class="subtitle">{self.subtitle}</div>
        </div>
        <div class="patient-box">
            <div class="patient-grid">
                <div><b>Paciente:</b> __________________________________</div>
                <div><b>Idade/DN:</b> ___/___/_____</div>
                <div><b>Prontuário:</b> _________</div>
            </div>
            <div class="patient-grid" style="margin-top:2px;">
                <div><b>Setor/Leito:</b> _______________________________</div>
                <div><b>Data/Hora:</b> ___/___/___ __:__</div>
                <div><b>Avaliador:</b> _________________</div>
            </div>
        </div>
        {body_content}
        <div class="score-box">
            <span><b>ESCORE TOTAL:</b> [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ] pontos (Máximo: {self.max_score})</span>
            <span><b>Assinatura do Avaliador:</b> ____________________________________</span>
        </div>
        {self.risk_html}
    </div>
    <div>
        <div class="sig-box">
            <div class="sig-line">Carimbo e Assinatura do Profissional Responsável (COREN)</div>
            <div class="sig-line">Visto da Supervisão / Auditoria Hospitalar</div>
        </div>
        <div class="footer">
            <span>{self.reference}</span>
            <span>Disponibilizado por Calculadoras de Enfermagem — www.calculadorasdeenfermagem.com.br</span>
        </div>
    </div>
</div>
</body>
</html>'''

        temp_html = output_pdf_path.replace(".pdf", "_temp_build.html")
        with open(temp_html, "w", encoding="utf-8") as f:
            f.write(html_content)

        cands = [
            r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
            r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
            r"C:\Program Files\Google\Chrome\Application\chrome.exe"
        ]
        browser_bin = next((c for c in cands if os.path.exists(c)), None)
        if not browser_bin:
            raise FileNotFoundError("Nenhum Chromium/Edge encontrado para renderizar PDF!")

        cmd = [browser_bin, "--headless", "--disable-gpu", "--no-pdf-header-footer", f"--print-to-pdf={output_pdf_path}", temp_html]
        subprocess.run(cmd, check=True)

        if os.path.exists(temp_html):
            os.remove(temp_html)
        print(f"✅ PDF gerado: {output_pdf_path}")
