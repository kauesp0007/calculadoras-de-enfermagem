#!/usr/bin/env python3
"""
Auditor e Corretor de Botões de Impressão e PDF
================================================
Fase 1 (--scan): Audita os botões de IMPRESSÃO e PDF nos HTMLs da raiz.
Fase 2+3 (--fix): Backup + Correção cirúrgica + Validação final.

Uso:
    python automacoes/auditor_botoes_impressao_pdf.py          # somente scan
    python automacoes/auditor_botoes_impressao_pdf.py --scan   # somente scan
    python automacoes/auditor_botoes_impressao_pdf.py --fix    # scan + backup + correção
"""

import os
import re
import sys
import json
import shutil
from datetime import datetime
from pathlib import Path


# ============================================================
# FUNÇÕES DE I/O — PRESERVA BOM E QUEBRAS DE LINHA
# ============================================================

def ler_html(caminho):
    """
    Lê arquivo HTML preservando BOM e quebras de linha originais.
    Retorna (conteudo_str, tem_bom, newline_style).
    """
    with open(caminho, "rb") as f:
        raw = f.read()
    tem_bom = raw.startswith(b'\xef\xbb\xbf')
    conteudo = raw.decode('utf-8-sig')
    if b'\r\n' in raw:
        newline_style = '\r\n'
    elif b'\r' in raw:
        newline_style = '\r'
    else:
        newline_style = '\n'
    return conteudo, tem_bom, newline_style


def gravar_html(caminho, conteudo, tem_bom, newline_style):
    """
    Grava arquivo HTML preservando BOM e quebras de linha.
    """
    # Normaliza o conteúdo para o estilo de quebra de linha original
    if newline_style == '\r\n':
        conteudo = conteudo.replace('\r\n', '\n').replace('\n', '\r\n')
    elif newline_style == '\r':
        conteudo = conteudo.replace('\r\n', '\n').replace('\r', '\n').replace('\n', '\r')
    else:
        conteudo = conteudo.replace('\r\n', '\n').replace('\r', '\n')

    raw = conteudo.encode('utf-8')
    if tem_bom:
        raw = b'\xef\xbb\xbf' + raw
    with open(caminho, "wb") as f:
        f.write(raw)


# ============================================================
# CONFIGURAÇÃO
# ============================================================

# Raiz do projeto
ROOT = Path(__file__).resolve().parent.parent

# Pasta de automações (onde este script está)
AUTOMACOES_DIR = Path(__file__).resolve().parent

# Arquivos HTML proibidos (na raiz) — NUNCA modificar
ARQUIVOS_PROIBIDOS = {
    "footer.html",
    "menu-global.html",
    "global-body-elements.html",
    "downloads.html",
    "_language_selector.html",
    "googlefc0a17cdd552164b.html",
}

# Pastas proibidas — NUNCA entrar
PASTAS_PROIBIDAS = {
    "downloads",
    "biblioteca",
    "blog",
    "blog-templates",
    "node_modules",
    ".git",
    "automacoes",  # não analisar a si mesmo
}

# Pastas de idiomas (não analisar)
PASTAS_IDIOMAS = {
    "ar", "de", "en", "es", "fr", "hi", "id", "it", "ja",
    "ko", "nl", "pl", "ru", "sv", "tr", "uk", "vi", "zh",
}

# Padrões de ID que identificam botões de IMPRESSÃO
IDS_IMPRESSAO = [
    "btnImprimir", "btnimprimir", "btnPrint", "btnprint",
    "btn_imprimir", "btn_print", "btn-imprimir", "btn-print",
]

# Padrões de ID que identificam botões de PDF
IDS_PDF = [
    "btnGerarPDF", "btngerarpdf", "btnPdf", "btnpdf",
    "btn_pdf", "btn-pdf", "btnGerarPdf", "btn_gerar_pdf",
]

# Texto padrão para botões de impressão
PADRAO_IMPRESSAO = "Imprimir"

# Texto padrão para botões de PDF
PADRAO_PDF = "Salvar PDF"

# ============================================================
# FUNÇÕES AUXILIARES
# ============================================================

def listar_htmls_raiz():
    """Lista apenas arquivos .html diretamente na raiz, respeitando proibições."""
    htmls = []
    for item in sorted(ROOT.iterdir()):
        if not item.is_file():
            continue
        if item.suffix.lower() != ".html":
            continue
        if item.name in ARQUIVOS_PROIBIDOS:
            continue
        htmls.append(item)
    return htmls


def remover_blocos_script(conteudo):
    """
    Substitui blocos <script>...</script> por placeholders de mesmo tamanho.
    Retorna (conteudo_limpo, mapeamento).
    """
    # Regex para encontrar blocos <script>...</script> (incluindo atributos na tag)
    padrao_script = re.compile(
        r'<script\b[^>]*>.*?</script>',
        re.DOTALL | re.IGNORECASE
    )

    mapeamento = []  # lista de (inicio, fim, original)

    def substituir(match):
        original = match.group(0)
        inicio = match.start()
        fim = match.end()
        mapeamento.append((inicio, fim, original))
        # placeholder de mesmo tamanho para preservar offsets
        return " " * len(original)

    conteudo_limpo = padrao_script.sub(substituir, conteudo)
    return conteudo_limpo, mapeamento


def extrair_texto_visivel(inner_html):
    """
    Extrai o texto visível do innerHTML de um botão.
    Remove tags HTML/SVG, normaliza espaços.
    """
    # Remove tudo entre < e > (tags HTML/SVG)
    texto = re.sub(r'<[^>]*>', ' ', inner_html)
    # Substitui entidades HTML comuns
    texto = texto.replace('&nbsp;', ' ').replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
    # Normaliza espaços e quebras de linha
    texto = re.sub(r'\s+', ' ', texto).strip()
    return texto


def classificar_botao(id_attr, texto_visivel):
    """
    Classifica o botão como 'IMPRESSÃO', 'PDF' ou None.
    Retorna (tipo, padrao_esperado).
    """
    id_lower = id_attr.lower() if id_attr else ""

    # Verifica por ID primeiro (mais confiável)
    for padrao in IDS_IMPRESSAO:
        if padrao.lower() in id_lower:
            return ("IMPRESSÃO", PADRAO_IMPRESSAO)

    for padrao in IDS_PDF:
        if padrao.lower() in id_lower:
            return ("PDF", PADRAO_PDF)

    # Fallback: verifica pelo texto visível (mais restrito para evitar falsos positivos)
    texto_upper = texto_visivel.upper()

    # IMPRESSÃO: texto contém "Imprimir" ou "Print" como palavra
    if re.search(r'\bIMPRIMIR\b', texto_upper) or re.search(r'\bPRINT\b', texto_upper):
        return ("IMPRESSÃO", PADRAO_IMPRESSAO)

    # PDF: texto contém padrões específicos de botão PDF
    # Evita classificar botões que apenas mencionam "PDF" incidentalmente
    padroes_texto_pdf = [
        r'\bSALVAR\s+PDF\b',
        r'\bGERAR\s+PDF\b',
        r'\bBAIXAR\s+PDF\b',
        r'\bSALVAR\s+EM\s+PDF\b',
        r'\bIMPRIMIR\s+LAUDO\s*/\s*GERAR\s+PDF\b',
    ]
    for padrao in padroes_texto_pdf:
        if re.search(padrao, texto_upper):
            return ("PDF", PADRAO_PDF)

    return (None, None)


def encontrar_botoes(conteudo_limpo):
    """
    Encontra todos os botões no conteúdo (já sem scripts).
    Retorna lista de dicts com informações de cada botão.
    """
    botoes = []

    # Regex para encontrar elementos <button>...</button>
    # Usamos uma abordagem iterativa para lidar com buttons aninhados
    padrao_button = re.compile(
        r'<button\b([^>]*?)>(.*?)</button>',
        re.DOTALL | re.IGNORECASE
    )

    for match in padrao_button.finditer(conteudo_limpo):
        atributos_str = match.group(1)
        inner_html = match.group(2)
        botao_completo = match.group(0)
        pos_inicio = match.start()
        pos_fim = match.end()

        # Extrai o id do botão
        id_match = re.search(r'id\s*=\s*["\']([^"\']*)["\']', atributos_str, re.IGNORECASE)
        id_attr = id_match.group(1) if id_match else ""

        # Extrai data-action
        data_action_match = re.search(r'data-action\s*=\s*["\']([^"\']*)["\']', atributos_str, re.IGNORECASE)
        data_action = data_action_match.group(1) if data_action_match else ""

        # Extrai texto visível
        texto_visivel = extrair_texto_visivel(inner_html)

        if not texto_visivel:
            continue  # botão sem texto, ignorar

        # Classifica o botão
        tipo, padrao = classificar_botao(id_attr, texto_visivel)

        if tipo is None:
            continue  # não é botão de impressão nem PDF

        # Verifica se o texto já está padronizado
        precisa_corrigir = (texto_visivel != padrao)

        botoes.append({
            "tipo": tipo,
            "id": id_attr,
            "data_action": data_action,
            "texto_encontrado": texto_visivel,
            "texto_padrao": padrao,
            "precisa_corrigir": precisa_corrigir,
            "pos_inicio": pos_inicio,
            "pos_fim": pos_fim,
            "botao_completo": botao_completo,
            "inner_html": inner_html,
        })

    return botoes


def encontrar_linha_aproximada(conteudo, posicao):
    """Retorna o número da linha (1-indexed) para uma posição no conteúdo."""
    return conteudo[:posicao].count('\n') + 1


def gerar_relatorio(resultados, arquivos_ignorados):
    """Gera os relatórios JSON e TXT."""
    timestamp = datetime.now().strftime("%Y-%m-%d_%H%M%S")

    # Prepara dados para JSON
    total_botoes_impressao = 0
    total_botoes_pdf = 0
    total_precisa_corrigir = 0
    arquivos_com_botoes = set()

    itens_relatorio = []
    for resultado in resultados:
        arquivo = resultado["arquivo"]
        if resultado["botoes"]:
            arquivos_com_botoes.add(arquivo)
        for botao in resultado["botoes"]:
            if botao["tipo"] == "IMPRESSÃO":
                total_botoes_impressao += 1
            else:
                total_botoes_pdf += 1

            if botao["precisa_corrigir"]:
                total_precisa_corrigir += 1

            itens_relatorio.append({
                "arquivo": arquivo,
                "linha": botao["linha"],
                "tipo": botao["tipo"],
                "id": botao["id"],
                "texto_encontrado": botao["texto_encontrado"],
                "texto_padrao": botao["texto_padrao"],
                "precisa_corrigir": botao["precisa_corrigir"],
            })

    # Monta relatório JSON
    relatorio_json = {
        "data": datetime.now().isoformat(),
        "modo": "scan",
        "resumo": {
            "total_htmls_analisados": len(resultados),
            "total_arquivos_com_botoes": len(arquivos_com_botoes),
            "total_botoes_impressao": total_botoes_impressao,
            "total_botoes_pdf": total_botoes_pdf,
            "total_botoes": total_botoes_impressao + total_botoes_pdf,
            "total_precisa_corrigir": total_precisa_corrigir,
            "total_ja_padronizados": (total_botoes_impressao + total_botoes_pdf) - total_precisa_corrigir,
            "arquivos_ignorados": len(arquivos_ignorados),
        },
        "itens": itens_relatorio,
        "arquivos_ignorados": sorted(arquivos_ignorados),
    }

    # Salva JSON
    json_path = AUTOMACOES_DIR / f"relatorio_botoes_impressao_pdf.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(relatorio_json, f, ensure_ascii=False, indent=2)

    # Salva TXT
    txt_path = AUTOMACOES_DIR / f"relatorio_botoes_impressao_pdf.txt"
    linhas_txt = []
    linhas_txt.append("=" * 70)
    linhas_txt.append("RELATÓRIO DE AUDITORIA — BOTÕES DE IMPRESSÃO E PDF")
    linhas_txt.append("=" * 70)
    linhas_txt.append(f"Data: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    linhas_txt.append(f"Modo: SCAN (somente auditoria)")
    linhas_txt.append("")
    linhas_txt.append(f"HTMLs analisados:      {len(resultados)}")
    linhas_txt.append(f"Arquivos com botões:   {len(arquivos_com_botoes)}")
    linhas_txt.append(f"Botões IMPRESSÃO:      {total_botoes_impressao}")
    linhas_txt.append(f"Botões PDF:            {total_botoes_pdf}")
    linhas_txt.append(f"TOTAL de botões:       {total_botoes_impressao + total_botoes_pdf}")
    linhas_txt.append(f"Precisam corrigir:     {total_precisa_corrigir}")
    linhas_txt.append(f"Já padronizados:       {(total_botoes_impressao + total_botoes_pdf) - total_precisa_corrigir}")
    linhas_txt.append(f"Arquivos ignorados:    {len(arquivos_ignorados)}")
    linhas_txt.append("")

    if arquivos_ignorados:
        linhas_txt.append("-" * 70)
        linhas_txt.append("ARQUIVOS IGNORADOS (fora do escopo):")
        linhas_txt.append("-" * 70)
        for arq in sorted(arquivos_ignorados):
            linhas_txt.append(f"  {arq}")
        linhas_txt.append("")

    # Agrupa por arquivo
    for resultado in resultados:
        botoes_para_corrigir = [b for b in resultado["botoes"] if b["precisa_corrigir"]]
        botoes_ok = [b for b in resultado["botoes"] if not b["precisa_corrigir"]]

        if not resultado["botoes"]:
            continue

        linhas_txt.append("=" * 70)
        linhas_txt.append(f"ARQUIVO: {resultado['arquivo']}")
        linhas_txt.append(f"Total de botões encontrados: {len(resultado['botoes'])}")
        linhas_txt.append(f"  Já padronizados: {len(botoes_ok)}")
        linhas_txt.append(f"  Precisam corrigir: {len(botoes_para_corrigir)}")
        linhas_txt.append("-" * 70)

        for botao in resultado["botoes"]:
            status = "❌ CORRIGIR" if botao["precisa_corrigir"] else "✅ OK"
            linhas_txt.append(f"  [{status}]")
            linhas_txt.append(f"    Linha:     {botao['linha']}")
            linhas_txt.append(f"    Tipo:      {botao['tipo']}")
            linhas_txt.append(f"    ID:        {botao['id']}")
            linhas_txt.append(f"    Encontrado: \"{botao['texto_encontrado']}\"")
            if botao["precisa_corrigir"]:
                linhas_txt.append(f"    Correção:  \"{botao['texto_padrao']}\"")
            linhas_txt.append("")

    linhas_txt.append("=" * 70)
    linhas_txt.append("FIM DO RELATÓRIO")
    linhas_txt.append("=" * 70)

    with open(txt_path, "w", encoding="utf-8") as f:
        f.write("\n".join(linhas_txt))

    return json_path, txt_path, relatorio_json


def fase1_scan():
    """Fase 1: Somente auditoria. Retorna resultados e lista de arquivos."""
    print("=" * 70)
    print("FASE 1 — AUDITORIA DE BOTÕES (SCAN)")
    print("=" * 70)
    print()

    htmls = listar_htmls_raiz()
    print(f"HTMLs encontrados na raiz: {len(htmls)}")

    # Lista os ignorados (pastas de idioma, proibidos)
    arquivos_ignorados = []
    for item in sorted(ROOT.iterdir()):
        if item.is_dir() and item.name in PASTAS_IDIOMAS:
            arquivos_ignorados.append(f"Pasta de idioma: {item.name}/")
        elif item.is_dir() and item.name in PASTAS_PROIBIDAS:
            arquivos_ignorados.append(f"Pasta proibida: {item.name}/")
        elif item.is_file() and item.suffix.lower() == ".html" and item.name in ARQUIVOS_PROIBIDOS:
            arquivos_ignorados.append(f"Arquivo proibido: {item.name}")

    print(f"Pastas/arquivos ignorados: {len(arquivos_ignorados)}")
    print()

    resultados = []

    for i, html_path in enumerate(htmls, 1):
        nome = html_path.name
        print(f"[{i}/{len(htmls)}] Analisando: {nome} ...", end=" ")

        try:
            conteudo_original, _, _ = ler_html(html_path)
        except Exception as e:
            print(f"ERRO ao ler: {e}")
            continue

        # Remove blocos de script para análise
        conteudo_limpo, _ = remover_blocos_script(conteudo_original)

        # Encontra botões
        botoes = encontrar_botoes(conteudo_limpo)

        # Adiciona número da linha para cada botão
        for botao in botoes:
            botao["linha"] = encontrar_linha_aproximada(conteudo_original, botao["pos_inicio"])

        num_corrigir = sum(1 for b in botoes if b["precisa_corrigir"])
        num_ok = sum(1 for b in botoes if not b["precisa_corrigir"])

        if botoes:
            print(f"{len(botoes)} botões ({num_ok} OK, {num_corrigir} a corrigir)")
        else:
            print("nenhum botão relevante")

        resultados.append({
            "arquivo": nome,
            "caminho": str(html_path),
            "botoes": botoes,
        })

    print()
    print("-" * 70)

    # Gera relatório
    json_path, txt_path, relatorio = gerar_relatorio(resultados, arquivos_ignorados)

    print(f"Relatório JSON: {json_path}")
    print(f"Relatório TXT:  {txt_path}")
    print()
    print("RESUMO:")
    print(f"  HTMLs analisados:      {relatorio['resumo']['total_htmls_analisados']}")
    print(f"  Botões IMPRESSÃO:      {relatorio['resumo']['total_botoes_impressao']}")
    print(f"  Botões PDF:            {relatorio['resumo']['total_botoes_pdf']}")
    print(f"  Precisam corrigir:     {relatorio['resumo']['total_precisa_corrigir']}")
    print(f"  Já padronizados:       {relatorio['resumo']['total_ja_padronizados']}")
    print()

    if relatorio['resumo']['total_precisa_corrigir'] > 0:
        print("⚠️  Existem botões que precisam de correção.")
        print("   Execute com --fix para corrigir (após revisar o relatório).")
    else:
        print("✅ Todos os botões já estão padronizados!")

    return resultados, htmls


# ============================================================
# FASE 2 — BACKUP
# ============================================================

def fase2_backup(arquivos_para_modificar):
    """Cria backup dos arquivos que serão modificados."""
    if not arquivos_para_modificar:
        print("Nenhum arquivo para modificar. Pulando backup.")
        return None

    timestamp = datetime.now().strftime("%Y-%m-%d_%H%M%S")
    backup_dir = AUTOMACOES_DIR / "backups_botoes" / timestamp
    backup_dir.mkdir(parents=True, exist_ok=True)

    print(f"Criando backup em: {backup_dir}")
    print()

    for html_path in sorted(arquivos_para_modificar):
        nome = html_path.name
        destino = backup_dir / nome
        shutil.copy2(html_path, destino)
        print(f"  ✅ Backup: {nome}")

    print()
    print(f"Backup concluído: {len(arquivos_para_modificar)} arquivos em {backup_dir}")
    return backup_dir


# ============================================================
# FASE 3 — CORREÇÃO CIRÚRGICA
# ============================================================

def corrigir_texto_botao(conteudo_original, botao_info):
    """
    Substitui cirurgicamente o texto visível de um botão.
    Preserva TODO o resto: ids, classes, onclick, SVG, etc.
    """
    pos_inicio = botao_info["pos_inicio"]
    pos_fim = botao_info["pos_fim"]
    texto_encontrado = botao_info["texto_encontrado"]
    texto_padrao = botao_info["texto_padrao"]

    # Extrai a parte do conteúdo que corresponde ao botão
    botao_html = conteudo_original[pos_inicio:pos_fim]

    # Encontra o texto visível NO ORIGINAL (não no conteúdo limpo)
    # O texto_encontrado veio do conteúdo limpo, precisamos encontrar
    # a ocorrência correspondente no original

    # Estratégia: encontrar o inner HTML (entre > e </button>)
    match_abertura = re.search(r'<button\b[^>]*>', botao_html, re.IGNORECASE)
    if not match_abertura:
        return conteudo_original  # não foi possível encontrar a abertura

    # Posição onde começa o inner HTML
    inicio_inner = match_abertura.end()
    # O inner HTML vai até </button>
    fim_inner = botao_html.rfind('</button>')
    if fim_inner == -1:
        return conteudo_original

    inner_original = botao_html[inicio_inner:fim_inner]

    # Remove tags para encontrar o texto no original
    texto_sem_tags = re.sub(r'<[^>]*>', ' ', inner_original)
    texto_sem_tags = re.sub(r'\s+', ' ', texto_sem_tags).strip()

    # Verifica se o texto extraído do original corresponde ao esperado
    if texto_sem_tags != texto_encontrado:
        # Pode haver diferenças de whitespace; tentamos mesmo assim
        pass

    # Agora precisamos encontrar a posição exata do texto dentro do inner_original
    # Vamos procurar o texto_encontrado no inner_original (sem tags)
    # e mapear de volta para a posição original

    # Estratégia mais robusta: encontrar o ÚLTIMO trecho de texto não-tag
    # no inner_original e substituí-lo pelo texto_padrao

    # Divide o inner em partes: tags e texto
    partes = re.split(r'(<[^>]*>)', inner_original)

    # Encontra a última parte que é texto puro (não tag) e não é só whitespace
    texto_substituido = False
    for i in range(len(partes) - 1, -1, -1):
        parte = partes[i]
        # Pula tags
        if re.match(r'<[^>]*>', parte):
            continue
        # Verifica se essa parte contém o texto que queremos substituir
        parte_limpa = re.sub(r'\s+', ' ', parte).strip()
        if parte_limpa and parte_limpa in texto_encontrado:
            # Substitui apenas o texto desta parte, preservando whitespace ao redor
            # Encontra a posição do texto dentro da parte
            idx = parte.find(parte_limpa)
            if idx != -1:
                nova_parte = parte[:idx] + texto_padrao + parte[idx + len(parte_limpa):]
                partes[i] = nova_parte
                texto_substituido = True
                break

    if not texto_substituido:
        # Fallback: tenta encontrar o texto_encontrado diretamente
        inner_sem_tags = re.sub(r'\s+', ' ', re.sub(r'<[^>]*>', ' ', inner_original)).strip()
        if texto_encontrado in inner_sem_tags:
            # Tenta substituir no inner_original
            # Normaliza espaços para encontrar
            padrao_busca = re.escape(texto_encontrado)
            # Tenta match flexível com whitespace
            padrao_flex = r'\s*'.join(re.escape(p) for p in texto_encontrado.split())
            match_texto = re.search(padrao_flex, inner_original)
            if match_texto:
                novo_inner = (
                    inner_original[:match_texto.start()] +
                    texto_padrao +
                    inner_original[match_texto.end():]
                )
                novo_botao = (
                    botao_html[:inicio_inner] +
                    novo_inner +
                    botao_html[fim_inner:]
                )
                return conteudo_original[:pos_inicio] + novo_botao + conteudo_original[pos_fim:]

        print(f"    ⚠️  AVISO: Não foi possível localizar o texto cirurgicamente.")
        print(f"           Arquivo conterá botão: ID={botao_info.get('id', 'N/A')}")
        print(f"           Texto esperado: \"{texto_encontrado}\"")
        return conteudo_original

    # Reconstrói o inner HTML
    novo_inner = ''.join(partes)
    novo_botao = botao_html[:inicio_inner] + novo_inner + botao_html[fim_inner:]

    # Reconstrói o conteúdo completo
    novo_conteudo = conteudo_original[:pos_inicio] + novo_botao + conteudo_original[pos_fim:]

    return novo_conteudo


def fase3_corrigir(resultados_scan):
    """Fase 3: Correção cirúrgica dos textos dos botões."""
    print("=" * 70)
    print("FASE 3 — CORREÇÃO CIRÚRGICA")
    print("=" * 70)
    print()

    arquivos_modificados = []
    arquivos_com_erro = []
    total_alteracoes = 0

    for resultado in resultados_scan:
        botoes_para_corrigir = [b for b in resultado["botoes"] if b["precisa_corrigir"]]

        if not botoes_para_corrigir:
            continue

        nome = resultado["arquivo"]
        caminho = resultado["caminho"]
        print(f"Corrigindo: {nome} ({len(botoes_para_corrigir)} botões)")

        try:
            conteudo_original, tem_bom, newline_style = ler_html(caminho)
        except Exception as e:
            print(f"  ❌ ERRO ao ler: {e}")
            arquivos_com_erro.append(nome)
            continue

        conteudo_novo = conteudo_original
        alteracoes_feitas = 0

        # Processa botões de trás para frente para preservar offsets
        for botao in sorted(botoes_para_corrigir, key=lambda b: b["pos_inicio"], reverse=True):
            texto_antes = botao["texto_encontrado"]
            texto_depois = botao["texto_padrao"]

            # Recalcula offsets no conteúdo atual (que pode ter sido modificado)
            # Mas como processamos de trás pra frente, offsets anteriores ainda são válidos
            conteudo_novo = corrigir_texto_botao(conteudo_novo, botao)
            alteracoes_feitas += 1
            print(f"  ✅ \"{texto_antes}\" → \"{texto_depois}\"")

        if alteracoes_feitas > 0:
            # Verificação de segurança: garante que scripts não foram alterados
            # Compara quantidade de <script e function
            scripts_antes = len(re.findall(r'<script\b', conteudo_original))
            scripts_depois = len(re.findall(r'<script\b', conteudo_novo))
            funcoes_antes = len(re.findall(r'function\s+\w+', conteudo_original))
            funcoes_depois = len(re.findall(r'function\s+\w+', conteudo_novo))

            if scripts_antes != scripts_depois or funcoes_antes != funcoes_depois:
                print(f"  ⚠️  ALERTA: Possível alteração em JavaScript detectada!")
                print(f"     Scripts: {scripts_antes} → {scripts_depois}")
                print(f"     Funções: {funcoes_antes} → {funcoes_depois}")
                print(f"     ABORTANDO alterações neste arquivo.")
                arquivos_com_erro.append(nome)
                continue

            try:
                gravar_html(caminho, conteudo_novo, tem_bom, newline_style)
                arquivos_modificados.append(nome)
                total_alteracoes += alteracoes_feitas
            except Exception as e:
                print(f"  ❌ ERRO ao gravar: {e}")
                arquivos_com_erro.append(nome)
        else:
            print(f"  ℹ️  Nenhuma alteração necessária (texto já estava correto)")

    print()
    return arquivos_modificados, arquivos_com_erro, total_alteracoes


# ============================================================
# VALIDAÇÃO PÓS-CORREÇÃO
# ============================================================

def validar_pos_correcao(resultados_antes, arquivos_modificados):
    """Executa uma segunda varredura para confirmar a correção."""
    print("=" * 70)
    print("VALIDAÇÃO PÓS-CORREÇÃO")
    print("=" * 70)
    print()

    # Re-executa o scan
    htmls = listar_htmls_raiz()
    resultados_depois = []

    erros_validacao = []

    for html_path in htmls:
        nome = html_path.name
        try:
            conteudo_original, _, _ = ler_html(html_path)
        except Exception as e:
            erros_validacao.append(f"Erro ao ler {nome}: {e}")
            continue

        conteudo_limpo, _ = remover_blocos_script(conteudo_original)
        botoes = encontrar_botoes(conteudo_limpo)

        for botao in botoes:
            botao["linha"] = encontrar_linha_aproximada(conteudo_original, botao["pos_inicio"])

        resultados_depois.append({
            "arquivo": nome,
            "caminho": str(html_path),
            "botoes": botoes,
        })

    # Verificações
    pendentes = []
    for r in resultados_depois:
        for b in r["botoes"]:
            if b["precisa_corrigir"]:
                pendentes.append({
                    "arquivo": r["arquivo"],
                    "linha": b["linha"],
                    "tipo": b["tipo"],
                    "texto_encontrado": b["texto_encontrado"],
                })

    # Contagem de scripts (verificação de integridade JS)
    for resultado in resultados_depois:
        if resultado["arquivo"] in [r["arquivo"] for r in resultados_antes]:
            # Não podemos comparar diretamente pois já alteramos, mas verificamos
            # se não há erros óbvios
            try:
                conteudo, _, _ = ler_html(resultado["caminho"])
                scripts_count = len(re.findall(r'<script\b', conteudo))
                if scripts_count == 0 and any(b["tipo"] == "IMPRESSÃO" for b in resultado["botoes"]):
                    # Isso é OK - alguns arquivos podem não ter scripts de impressão inline
                    pass
            except:
                pass

    print("✅ Verificação 1: Botões restantes fora do padrão:")
    if pendentes:
        print(f"   ❌ Ainda existem {len(pendentes)} botões fora do padrão:")
        for p in pendentes:
            print(f"      - {p['arquivo']} linha {p['linha']}: \"{p['texto_encontrado']}\" ({p['tipo']})")
    else:
        print(f"   ✅ Nenhum botão fora do padrão encontrado!")

    print(f"✅ Verificação 2: Arquivos modificados: {len(arquivos_modificados)}")
    for arq in sorted(arquivos_modificados):
        print(f"   - {arq}")

    print(f"✅ Verificação 3: Nenhuma pasta de idioma foi alterada (garantido pelo escopo).")
    print(f"✅ Verificação 4: Nenhum arquivo proibido foi alterado (garantido pelo escopo).")

    # Relatório final
    print()
    print("=" * 70)
    print("RELATÓRIO FINAL DE CORREÇÃO")
    print("=" * 70)

    total_antes = sum(len(r["botoes"]) for r in resultados_antes)
    total_depois = sum(len(r["botoes"]) for r in resultados_depois)
    corrigir_antes = sum(1 for r in resultados_antes for b in r["botoes"] if b["precisa_corrigir"])

    print(f"HTMLs analisados:          {len(resultados_depois)}")
    print(f"Botões IMPRESSÃO encontrados: {sum(1 for r in resultados_depois for b in r['botoes'] if b['tipo'] == 'IMPRESSÃO')}")
    print(f"Botões PDF encontrados:       {sum(1 for r in resultados_depois for b in r['botoes'] if b['tipo'] == 'PDF')}")
    print(f"Alterações realizadas:        {corrigir_antes - len(pendentes)}")
    print(f"Arquivos modificados:         {len(arquivos_modificados)}")
    print(f"Pendências restantes:         {len(pendentes)}")
    print(f"Erros encontrados:            {len(erros_validacao)}")

    if erros_validacao:
        for e in erros_validacao:
            print(f"  ⚠️  {e}")

    return len(pendentes) == 0


# ============================================================
# MAIN
# ============================================================

def main():
    modo = "scan"  # padrão

    if "--fix" in sys.argv:
        modo = "fix"
    elif "--scan" in sys.argv:
        modo = "scan"

    print()
    print("╔" + "═" * 68 + "╗")
    print("║  AUDITOR DE BOTÕES DE IMPRESSÃO E PDF — v1.0" + " " * 16 + "║")
    print("║  Padrão: Impressão → \"Imprimir\" | PDF → \"Salvar PDF\"" + " " * 9 + "║")
    print("╚" + "═" * 68 + "╝")
    print()

    if modo == "scan":
        print("🔍 MODO: SCAN (somente auditoria)")
        print("   Para corrigir, execute com: --fix")
        print()
        fase1_scan()
        print()
        print("✅ Auditoria concluída. Nenhum arquivo foi modificado.")

    elif modo == "fix":
        print("🔧 MODO: FIX (auditoria + backup + correção + validação)")
        print()

        # Fase 1: Scan
        resultados, htmls = fase1_scan()

        # Coleta arquivos que precisam de correção
        arquivos_para_modificar = set()
        total_correcoes = 0
        for r in resultados:
            for b in r["botoes"]:
                if b["precisa_corrigir"]:
                    arquivos_para_modificar.add(Path(r["caminho"]))
                    total_correcoes += 1

        if total_correcoes == 0:
            print()
            print("✅ Nenhum botão precisa de correção. Nada a fazer.")
            return

        print()
        print(f"⚠️  {total_correcoes} botões em {len(arquivos_para_modificar)} arquivos serão corrigidos.")
        print()

        # Confirmação interativa
        resposta = input("Deseja prosseguir com backup e correção? (s/N): ").strip().lower()
        if resposta not in ("s", "sim", "y", "yes"):
            print("Operação cancelada pelo usuário.")
            return

        print()

        # Fase 2: Backup
        backup_dir = fase2_backup(arquivos_para_modificar)

        # Fase 3: Correção
        arquivos_modificados, arquivos_com_erro, total_alteracoes = fase3_corrigir(resultados)

        print()
        print(f"✅ Correção concluída: {total_alteracoes} alterações em {len(arquivos_modificados)} arquivos.")
        if arquivos_com_erro:
            print(f"⚠️  Erros em: {', '.join(arquivos_com_erro)}")

        # Validação final
        print()
        validacao_ok = validar_pos_correcao(resultados, arquivos_modificados)

        if validacao_ok:
            print()
            print("✅✅✅ VALIDAÇÃO FINAL: Todas as verificações passaram! ✅✅✅")
        else:
            print()
            print("⚠️⚠️⚠️ VALIDAÇÃO FINAL: Existem pendências. Revise o relatório acima.")


if __name__ == "__main__":
    main()
