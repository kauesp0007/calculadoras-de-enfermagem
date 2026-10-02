# -*- coding: utf-8 -*-
"""engine_en.py: Universal English PDF Engine for Hospital Scale Forms"""
import os, subprocess

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CSS_PATH = os.path.join(SCRIPT_DIR, "css_en.css")

class FormPDFEngineEN:
    def __init__(self, title, subtitle, max_score, reference):
        self.title = title
        self.subtitle = subtitle
        self.max_score = max_score
        self.reference = reference
        self.sections_html = []
        self.risk_html = ""
        self.extra_css = ""
        self.layout_mode = "single"

    def add_table_section(self, section_title, rows_data):
        html = f'<div class="sec-title">{section_title}</div>'
        if self.layout_mode == "double_col":
            html += '<table class="table-eval-col2"><thead><tr><th style="width:65%">Parameter / Criterion</th><th style="width:35%; text-align:right">Options & Points</th></tr></thead><tbody>'
            for item, options in rows_data:
                param_title = item[0] if isinstance(item, tuple) else item
                opt_str = " &nbsp;|&nbsp; ".join([f'<span class="sq"></span> {opt} <b>({pts})</b>' for opt, pts in options])
                html += f'<tr><td class="td-lbl">{param_title}</td><td class="td-pts">{opt_str}</td></tr>'
        else:
            html += '<table class="table-eval"><thead><tr><th style="width:28%">Clinical Parameter</th><th style="width:58%">Options & Scoring Criteria</th><th style="width:14%; text-align:center">Score</th></tr></thead><tbody>'
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
        self.sections_html.append(raw_html)

    def set_risk_stratification(self, cards_list):
        html = '<div class="sec-title">CLINICAL INTERPRETATION & RECOMMENDED NURSING ACTIONS</div>'
        html += '<div class="risk-grid">'
        for label, score_range, conduta, color_cls in cards_list:
            html += f'<div class="risk-card {color_cls}"><div class="risk-head"><b>{label}</b> ({score_range})</div><div>{conduta}</div></div>'
        html += '</div>'
        self.risk_html = html

    def get_base_css(self):
        if os.path.exists(CSS_PATH):
            with open(CSS_PATH, "r", encoding="utf-8") as f:
                return f.read()
        return "@page { size: A4 portrait; margin: 6mm 8mm; }"

    def render(self, output_pdf_path):
        css_content = self.get_base_css() + "\n" + self.extra_css
        if self.layout_mode == "double_col":
            mid = (len(self.sections_html) + 1) // 2
            body_content = f'<div class="cols-2"><div>{"".join(self.sections_html[:mid])}</div><div>{"".join(self.sections_html[mid:])}</div></div>'
        else:
            body_content = "".join(self.sections_html)

        html_content = f'''<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>{self.title}</title><style>{css_content}</style></head>
<body><div class="sheet">
    <div class="header">
        <div class="brand">NURSING CALCULATORS</div>
        <div class="title">{self.title}</div>
        <div class="subtitle">{self.subtitle}</div>
    </div>
    <div class="sec-title">1. PATIENT IDENTIFICATION</div>
    <div class="patient-box">
        <div class="patient-grid">
            <div><b>Patient Name:</b> __________________________________</div>
            <div><b>Age / DOB:</b> ___/___/_____</div>
            <div><b>MRN / ID:</b> _________</div>
        </div>
        <div class="patient-grid" style="margin-top: 5px;">
            <div><b>Unit / Ward / Bed:</b> _______________________________</div>
            <div><b>Surgery / Diagnosis:</b> ________________________</div>
            <div><b>Date / Time:</b> ___/___/___ __:__</div>
        </div>
    </div>
    {body_content}
    <div class="score-box-wrap">
        <span><b>TOTAL SCORE:</b> &nbsp; [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ] POINTS (Maximum: {self.max_score})</span>
        <span><b>Assessor (RN / License #):</b> ____________________________________</span>
    </div>
    {self.risk_html}
    <div class="sig-grid">
        <div><div class="sig-line">Registered Nurse (RN) Signature & Professional Stamp</div></div>
        <div><div class="sig-line">Date & Time of Assessment</div></div>
    </div>
    <div class="footer">
        <span>{self.reference}</span>
        <span>Provided by Nursing Calculators — www.calculadorasdeenfermagem.com.br/en/</span>
    </div>
</div></body></html>'''

        temp_html = output_pdf_path.replace(".pdf", "_temp_render.html")
        with open(temp_html, "w", encoding="utf-8") as f:
            f.write(html_content)

        cands = [r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe", r"C:\Program Files\Microsoft\Edge\Application\msedge.exe", r"C:\Program Files\Google\Chrome\Application\chrome.exe"]
        browser_bin = next((c for c in cands if os.path.exists(c)), None)
        if not browser_bin: raise FileNotFoundError("Browser binary not found!")
        cmd = [browser_bin, "--headless", "--disable-gpu", "--no-pdf-header-footer", f"--print-to-pdf={output_pdf_path}", temp_html]
        subprocess.run(cmd, check=True)
        if os.path.exists(temp_html): os.remove(temp_html)
