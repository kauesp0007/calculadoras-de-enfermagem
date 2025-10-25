"""
gerar_pdf_completo.py
Gera um PDF fiel à página web usando pdfkit + wkhtmltopdf.
Funciona com URL remota ou arquivo HTML local.
"""

import os
import tempfile
import pdfkit
import requests
from pathlib import Path

# ====== CONFIGURAÇÕES QUE VOCÊ PODE ALTERAR ======
# URL da página que você quer transformar em PDF (ou um caminho local)
PAGE_SOURCE = "https://www.calculadorasdeenfermagem.com.br/"  # <- altere se quiser

# Nome do arquivo de saída
OUTPUT_PDF = "pagina_exata.pdf"

# Caminho do wkhtmltopdf (Windows comum). Se o wkhtmltopdf estiver no PATH, deixe None.
# Exemplo Windows: r"C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe"
# Exemplo Linux/Mac: geralmente None (wkhtmltopdf instalado no PATH)
WKHTMLTOPDF_PATH = None

# ====== FIM DAS CONFIGURAÇÕES ======

def get_pdfkit_config():
    if WKHTMLTOPDF_PATH:
        return pdfkit.configuration(wkhtmltopdf=WKHTMLTOPDF_PATH)
    try:
        return pdfkit.configuration()  # tenta encontrar automatic.
    except Exception:
        # Retorna None e deixamos o pdfkit tentar (vai falhar com mensagem se não encontrado)
        return None

def fetch_html(url):
    """
    Baixa o HTML da URL. Retorna o texto HTML.
    Em caso de falha, lança exception.
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT) Python/pdfkit"
    }
    r = requests.get(url, headers=headers, timeout=30)
    r.raise_for_status()
    return r.text

def create_temp_html_with_print_css(html: str, base_href: str) -> str:
    """
    Cria um arquivo HTML temporário onde:
     - adicionamos <base href="..."> para corrigir caminhos relativos,
     - injetamos CSS de impressão para evitar quebras e preservar cores.
    Retorna o caminho do arquivo temporário salvo.
    """
    print_css = """
    <style>
      /* Evitar quebra dentro de blocos importantes */
      html, body, div, section, article, header, footer, main, table, tr, td, th, p {
        page-break-inside: avoid;
        -webkit-column-break-inside: avoid;
        break-inside: avoid;
      }
      /* Cores e ajustes de impressão */
      @page { size: A4; margin: 0mm; }
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      /* Se seu site usa fontes web, aumentar a prioridade */
      /* Você pode ajustar font-size/zoom se necessário */
    </style>
    """

    # Insere o <base> e o CSS logo após a tag <head> se existir, caso contrário cria head
    lower = html.lower()
    head_idx = lower.find("<head")
    if head_idx != -1:
        # encontrar '>' do <head ...>
        start = lower.find(">", head_idx)
        insert_at = start + 1
        new_html = html[:insert_at] + f'\n<base href="{base_href}">\n' + print_css + html[insert_at:]
    else:
        # criar head simples
        new_html = f"<!doctype html><html><head><base href=\"{base_href}\">{print_css}</head><body>{html}</body></html>"

    # salva em arquivo temporário
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".html", prefix="pdfkit_tmp_")
    tmp.write(new_html.encode("utf-8"))
    tmp.close()
    return tmp.name

def gerar_pdf_da_pagina(source, output):
    """
    source pode ser:
     - uma URL começando com http:// ou https://  -> baixa o HTML e cria temp
     - um caminho de arquivo local -> usa diretamente (adiciona base href se quiser)
    """
    # Determinar tipo
    is_url = str(source).lower().startswith("http://") or str(source).lower().startswith("https://")
    config = get_pdfkit_config()

    # Opções recomendadas para manter layout idêntico
    options = {
        'page-size': 'A4',
        'encoding': 'UTF-8',
        'print-media-type': '',
        'no-outline': None,
        'quiet': '',
        'margin-top': '0mm',
        'margin-right': '0mm',
        'margin-bottom': '0mm',
        'margin-left': '0mm',
        'disable-smart-shrinking': '',  # ajuda a preservar layout
        'enable-local-file-access': '',  # permite carregar arquivos locais (útil pra recursos locais)
        'zoom': '1.0',
        'dpi': 300,
        # 'user-style-sheet': '/caminho/para/arquivo.css',  # se quiser usar CSS externo
    }

    temp_html_path = None
    try:
        if is_url:
            print("🔎 Baixando HTML da URL...")
            html = fetch_html(source)
            print("✍️ Injetando CSS de impressão e base href...")
            temp_html_path = create_temp_html_with_print_css(html, base_href=source)
            input_for_pdfkit = temp_html_path
        else:
            # arquivo local: adicionamos base href apontando para o diretório do arquivo
            p = Path(source).resolve()
            base = f"file://{p.parent.as_posix()}/"
            with open(p, "r", encoding="utf-8") as f:
                html = f.read()
            temp_html_path = create_temp_html_with_print_css(html, base_href=base)
            input_for_pdfkit = temp_html_path

        print("📄 Gerando PDF — isso pode levar alguns segundos...")
        # Gera o PDF
        pdfkit.from_file(input_for_pdfkit, output, configuration=config, options=options)
        print(f"✅ PDF gerado com sucesso: {output}")

    finally:
        # limpa arquivo temporário
        if temp_html_path and os.path.exists(temp_html_path):
            try:
                os.remove(temp_html_path)
            except Exception:
                pass

if __name__ == "__main__":
    try:
        gerar_pdf_da_pagina(PAGE_SOURCE, OUTPUT_PDF)
    except Exception as e:
        print("❌ Erro ao gerar PDF:", e)
        # DICA: se estiver no Windows e receber erro que wkhtmltopdf não foi encontrado,
        # defina WKHTMLTOPDF_PATH no topo do arquivo apontando para o executável,
        # ex: "C:\\Program Files\\wkhtmltopdf\\bin\\wkhtmltopdf.exe"
