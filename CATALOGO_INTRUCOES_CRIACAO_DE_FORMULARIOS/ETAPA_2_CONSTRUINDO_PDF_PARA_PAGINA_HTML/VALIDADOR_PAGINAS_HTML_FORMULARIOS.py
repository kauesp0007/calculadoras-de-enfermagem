# -*- coding: utf-8 -*-
"""
VALIDADOR_PAGINAS_HTML_FORMULARIOS.py
Auditor Automatizado de Páginas HTML Hospedeiras de Formulários em PDF
Calculadoras de Enfermagem — www.calculadorasdeenfermagem.com.br
"""

import os
import re
import glob

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))
PDF_DIR = os.path.join(ROOT_DIR, "FORMULARIOS_DE_ESCALAS")

def auditar_pagina_html(caminho_html):
    nome_arquivo = os.path.basename(caminho_html)
    with open(caminho_html, "r", encoding="utf-8") as f:
        html = f.read()

    erros = []
    is_shell = 'id="premium-content-placeholder"' in html

    # 1. Estrutura Básica
    if not re.search(r"<!doctype html>", html, re.I):
        erros.append("Ausência de <!doctype html>")
    if not re.search(r'<html\s+lang=["\']pt-BR["\']', html, re.I):
        erros.append("Tag <html> sem lang='pt-BR'")

    # 2. SEO e Metatags
    if not re.search(r"<title>[^<]+Calculadoras de Enfermagem</title>", html, re.I):
        erros.append("Tag <title> inválida ou sem a assinatura da marca")
    if not re.search(r'<meta\s+content=["\']#1A3E74["\']\s+name=["\']theme-color["\']', html):
        erros.append("Meta theme-color #1A3E74 ausente")
    if not re.search(r'<meta\s+content=["\'][^"\']+["\']\s+name=["\']description["\']', html):
        erros.append("Meta description ausente")

    # 3. Canonical e Hreflang
    expected_canonical = f"https://www.calculadorasdeenfermagem.com.br/{nome_arquivo}"
    if expected_canonical not in html and "{{SLUG_HTML}}" not in html:
        erros.append(f"Link canonical incorreto (esperado: {expected_canonical})")
    if 'hreflang="pt-br"' not in html or 'hreflang="x-default"' not in html:
        erros.append("Marcadores hreflang pt-br / x-default ausentes")

    # 4. Schema.org
    if 'type="application/ld+json"' not in html:
        erros.append("Bloco Schema.org JSON-LD ausente")

    # 5. Placeholders Anti-CLS
    if 'id="anti-cls-placeholders"' not in html:
        erros.append("Bloco de estilo anti-cls-placeholders ausente")

    # 6. Verificação de Conteúdo: Aberto vs. Shell Público
    if is_shell:
        if '/js/access/premium-content-loader.js' not in html:
            erros.append("Shell público sem script premium-content-loader.js")
    else:
        # Página com conteúdo aberto direto
        if 'id="global-header-container"' not in html or 'id="footer-placeholder"' not in html:
            erros.append("Containers de injeção global (#global-header-container ou #footer-placeholder) ausentes")

        pdf_match = re.search(r'src=["\']/FORMULARIOS_DE_ESCALAS/([^"\']+\.pdf)["\']', html)
        if not pdf_match:
            if "{{NOME_ARQUIVO_PDF}}" not in html:
                erros.append("Visualizador de PDF (iframe) ausente ou mal formatado")
        else:
            pdf_nome = pdf_match.group(1)
            pdf_fisico = os.path.join(PDF_DIR, pdf_nome)
            if not os.path.exists(pdf_fisico):
                erros.append(f"Arquivo PDF referenciado no iframe NÃO existe no disco: {pdf_nome}")

    return erros

def auditar_todas_as_paginas(padrao="formulario_*.html"):
    arquivos = sorted(glob.glob(os.path.join(ROOT_DIR, padrao)))
    print("=" * 72)
    print(f"AUDITORIA DE PÁGINAS HTML DE FORMULÁRIOS ({len(arquivos)} arquivos)")
    print("=" * 72)

    total_erros = 0
    aprovados = 0

    for html_file in arquivos:
        nome = os.path.basename(html_file)
        erros = auditar_pagina_html(html_file)
        if erros:
            print(f"❌ [REPROVADO] {nome}:")
            for err in erros:
                print(f"   • {err}")
            total_erros += 1
        else:
            print(f"✅ [APROVADO] {nome:<45} | Conforme")
            aprovados += 1

    print("=" * 72)
    print(f"Resultado: {aprovados} Aprovados | {total_erros} Reprovados")
    print("=" * 72)
    return total_erros == 0

if __name__ == "__main__":
    import sys
    filtro = sys.argv[1] if len(sys.argv) > 1 else "formulario_*.html"
    auditar_todas_as_paginas(filtro)

