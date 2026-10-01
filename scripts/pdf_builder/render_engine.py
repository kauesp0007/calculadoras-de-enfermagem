# -*- coding: utf-8 -*-
# scripts/pdf_builder/render_engine.py
import os
import subprocess
import fitz

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
DEST_DIR = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS"
CSS_PATH = os.path.join(os.path.dirname(__file__), "base_style.css")

with open(CSS_PATH, "r", encoding="utf-8") as f:
    BASE_CSS = f.read()

def compile_scale_pdf(slug, name, subtitle, criteria_title, criteria_html, score_html, interp_title, interp_cards_html, ref, extra_css="", id_row2=None):
    """
    Compila uma escala em PDF de alta resolução com Edge Headless,
    garantindo exatamente 1 página A4 sem quebrar e ocupando harmoniosamente a página.
    """
    row2 = id_row2 or '<tr><td class="lbl">Prontuário:</td><td></td><td class="lbl">Leito:</td><td></td></tr><tr><td class="lbl">Setor:</td><td></td><td class="lbl">Data/Hora:</td><td>___/___/_____ às ___:___</td></tr>'

    html_template = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<style>
{BASE_CSS}
{extra_css}
</style>
</head>
<body>
<div class="header">
  <div class="brand">Calculadoras de Enfermagem</div>
  <h1>{name}</h1>
  <div class="sub">{subtitle}</div>
</div>

<div class="section-bar">1. IDENTIFICAÇÃO DO PACIENTE</div>
<table class="table-id">
  <tr><td class="lbl">Nome:</td><td></td><td class="lbl">Idade:</td><td style="width:22%;"></td></tr>
  {row2}
</table>

<div class="section-bar">2. {criteria_title}</div>
{criteria_html}

<div class="score-box">
  {score_html}
</div>

<div class="section-bar">3. {interp_title}</div>
<div class="interp-grid">
  {interp_cards_html}
</div>

<div class="sign-grid">
  <div class="sign-box">Carimbo e Assinatura do Profissional Responsável</div>
  <div class="sign-box">Local e Data</div>
</div>

<div class="footer">
  <div><strong>Referência:</strong> {ref}</div>
  <div>Disponibilizado por Calculadoras de Enfermagem — www.calculadorasdeenfermagem.com.br</div>
</div>
</body>
</html>"""

    temp_html = os.path.join(os.path.dirname(__file__), f"temp_{slug}.html")
    out_pdf = os.path.join(DEST_DIR, f"formulario_escala_de_{slug}.pdf")

    with open(temp_html, "w", encoding="utf-8") as f:
        f.write(html_template)

    cmd = [EDGE_PATH, "--headless", "--disable-gpu", "--no-pdf-header-footer", f"--print-to-pdf={out_pdf}", temp_html]
    subprocess.run(cmd, check=True)

    # Verificar se tem exatamente 1 página
    doc = fitz.open(out_pdf)
    num_pages = len(doc)
    if num_pages > 1:
        # Ajustar automaticamente com redução suave de padding/font se excedeu
        fix_css = extra_css + "\n body { font-size: 7.8pt !important; } .table-data td { padding: 4.5px 6px !important; } .header { padding: 8px 12px !important; margin-bottom: 5px !important; } .section-bar { margin: 6px 0 4px !important; padding: 2.5px 6px !important; } .sign-grid { margin: 8px 0 6px !important; }"
        html_fixed = html_template.replace(f"{extra_css}", f"{fix_css}")
        with open(temp_html, "w", encoding="utf-8") as f:
            f.write(html_fixed)
        subprocess.run(cmd, check=True)
        doc = fitz.open(out_pdf)
        num_pages = len(doc)

    try:
        os.remove(temp_html)
    except Exception:
        pass

    print(f"[{num_pages} PÁG] PDF Gerado: formulario_escala_de_{slug}.pdf")
    return num_pages == 1
