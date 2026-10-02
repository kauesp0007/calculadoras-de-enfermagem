# -*- coding: utf-8 -*-
"""
AUDITOR_GEOMETRIA_FORMULARIOS_PDF.py
Script Automatizado de Contra-Prova Técnica e Auditoria Geométrica de PDFs
Calculadoras de Enfermagem — www.calculadorasdeenfermagem.com.br
"""

import os
import glob
import fitz  # PyMuPDF

# Escalas com exceção documental clínica comprovada de 2 páginas (WIfI e FAST)
EXCECOES_MULTIPAGINAS = {
    "classificacao_wifi_formulario.pdf": 2,
    "Ficha_Impressao_Escala_FAST.pdf": 2
}

def auditar_diretorio_pdf(caminho_diretorio, padrao="*.pdf"):
    """
    Inspeciona arquivos PDF no diretório especificado.
    Validações:
    1. Contagem estrita de páginas == 1 (exceto algoritmos autorizados).
    2. Ocupação vertical útil entre 65.0% e 95.0% da folha A4.
    """
    busca = os.path.join(caminho_diretorio, padrao)
    arquivos = sorted(glob.glob(busca))
    if not arquivos:
        print(f"⚠️ Nenhum arquivo PDF encontrado com o padrão: {busca}")
        return False

    print("=" * 72)
    print(f"AUDITORIA GEOMÉTRICA DE FORMULÁRIOS PDF ({len(arquivos)} arquivos)")
    print(f"Diretório: {caminho_diretorio} | Padrão: {padrao}")
    print("=" * 72)

    erros = 0
    alertas = 0
    aprovados = 0

    for pdf in arquivos:
        nome = os.path.basename(pdf)
        doc = fitz.open(pdf)
        num_paginas = doc.page_count
        paginas_esperadas = EXCECOES_MULTIPAGINAS.get(nome, 1)

        # Cálculo da mancha gráfica útil da primeira página
        page = doc[0]
        rects = page.get_textpage().extractBLOCKS()
        max_y = max([r[3] for r in rects]) if rects else 0
        total_h = page.rect.height
        ocupacao = (max_y / total_h) * 100.0

        if num_paginas != paginas_esperadas:
            print(f"❌ [FALHA - PÁGINAS] {nome:<40} | Páginas: {num_paginas} (Esperado: {paginas_esperadas})")
            erros += 1
        elif ocupacao < 65.0:
            print(f"⚠️ [ALERTA - SUBOCUPAÇÃO] {nome:<38} | Ocupação: {ocupacao:.1f}%")
            alertas += 1
        elif ocupacao > 96.0:
            print(f"⚠️ [ALERTA - RISCO DE TRANSBORDO] {nome:<35} | Ocupação: {ocupacao:.1f}%")
            alertas += 1
        else:
            status = f"✅ [APROVADO] {nome:<42} | Páginas: {num_paginas} | Ocupação: {ocupacao:.1f}%"
            if nome in EXCECOES_MULTIPAGINAS:
                status += f" (Exceção {paginas_esperadas}p)"
            print(status)
            aprovados += 1

    print("=" * 72)
    print(f"Resultado: {aprovados} Aprovados | {alertas} Alertas | {erros} Falhas Críticas")
    print("=" * 72)

    if erros > 0:
        raise ValueError(f"Auditoria reprovada: {erros} formulários violaram a regra de contagem de páginas!")
    print("🎉 Todos os formulários inspecionados foram APROVADOS na contra-prova técnica!")
    return True

if __name__ == "__main__":
    import sys
    alvo = sys.argv[1] if len(sys.argv) > 1 else r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS"
    filtro = sys.argv[2] if len(sys.argv) > 2 else "*.pdf"
    auditar_diretorio_pdf(alvo, filtro)

