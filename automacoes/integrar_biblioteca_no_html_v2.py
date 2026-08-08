#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FASE 5.2 v2 — INTEGRAÇÃO CORRIGIDA (ESCAPE JS ROBUSTO)
=========================================================
Versão corrigida que reconstrói o array dadosNotificacao com
escape JavaScript adequado para evitar quebra do parser.

Correções vs v1:
- Todas as strings escapadas com json.dumps (garantia de validade JS)
- Conteúdo PDF binário filtrado (substituído por placeholder)
- Quebras de linha convertidas para \n
- Aspas e backslashes escapados corretamente
"""

import json
import os
import re
import shutil
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)
HTML_FILE = os.path.join(ROOT_DIR, "notificacao-compulsoria.html")
BACKUP_DIR = os.path.join(BASE_DIR, "backup_fase_5_2")
MAPA_INTEGRACAO = os.path.join(BASE_DIR, "mapa_integracao_biblioteca_html.json")
BIBLIOTECA = os.path.join(BASE_DIR, "biblioteca_doencas_notificacao_compulsoria.json")
SAIDA_TXT = os.path.join(BASE_DIR, "relatorio_integracao_biblioteca_html.txt")

MAPA_CAMPOS = {
    "descricao": "descricao",
    "incidencia": "incidencia",
    "prevalencia": "prevalencia",
    "forma_transmissao": "forma_de_transmissao",
    "periodo_incubacao": "periodo_de_incubacao",
    "medidas_preventivas": "medidas_preventivas",
    "agente_causador": "agente_causador",
    "tratamento": "tratamento",
    "observacoes": "observacoes",
}

CAMPOS_NOTIFICACAO = {"nome", "classificacao", "prazo_dias", "referencia_nacional"}


def js_string(val):
    """Escapa uma string para JavaScript usando json.dumps (garantido)."""
    if val is None:
        return '""'
    s = str(val)
    # Remove caracteres de controle exceto \n, \t
    s = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', s)
    # Usa json.dumps que escapa tudo corretamente
    return json.dumps(s, ensure_ascii=False)


def extrair_entradas_como_dicts(html_content):
    """Extrai cada entrada do dadosNotificacao como dict Python usando split por nome."""
    start = html_content.find('const dadosNotificacao = [')
    if start == -1:
        return None, None, None

    end = html_content.find('];', start)
    if end == -1:
        return None, None, None

    array_start = start
    array_end_val = end + 2

    # Pega o conteúdo entre [ e ];
    inner = html_content[start + len('const dadosNotificacao = ['):end]

    # Encontra todas as posições de 'nome: "' para dividir entradas
    nome_positions = [m.start() for m in re.finditer(r'\bnome:\s*"', inner)]
    print(f"  DEBUG: {len(nome_positions)} nomes encontrados")

    entradas_raw = []
    for i, pos in enumerate(nome_positions):
        if i + 1 < len(nome_positions):
            chunk = inner[pos:nome_positions[i+1]]
        else:
            chunk = inner[pos:]
        # Limpa: remove vírgula e whitespace do final
        chunk = chunk.strip()
        if chunk.endswith(','):
            chunk = chunk[:-1].strip()
        entradas_raw.append(chunk)

    dicts = []
    for raw in entradas_raw:
        d = parse_entrada_simples(raw)
        if d and "nome" in d:
            dicts.append(d)

    return dicts, array_start, array_end_val


def parse_entrada_simples(texto):
    """Parse uma entrada JS simples para dict."""
    d = {}
    # Extrai nome primeiro
    m = re.match(r'\s*nome:\s*"([^"]*)"', texto)
    if not m:
        return None
    d["nome"] = m.group(1)

    # Extrai todos os campos: campo: "valor" ou campo: numero
    pattern = r'(\w+):\s*(?:"((?:[^"\\]|\\.)*)"|(\d+))'
    for campo, str_val, num_val in re.findall(pattern, texto):
        if campo == "nome":
            continue
        if str_val is not None:
            val = str_val
            val = val.replace('\\n', '\n').replace('\\"', '"').replace('\\\\', '\\').replace("\\'", "'")
            d[campo] = val
        elif num_val is not None:
            d[campo] = int(num_val)

    # Garantir prazo_dias (derivar de classificacao se ausente)
    if "prazo_dias" not in d or not isinstance(d.get("prazo_dias"), int):
        if d.get("classificacao") == "Imediata":
            d["prazo_dias"] = 1
        else:
            d["prazo_dias"] = 7

    # Garantir referencia_nacional
    if "referencia_nacional" not in d or not d.get("referencia_nacional"):
        d["referencia_nacional"] = "Portaria GM/MS nº 10.175/2026"

    return d


def limpar_texto_biblioteca(texto):
    """Limpa texto da biblioteca para exibição no HTML."""
    if not texto:
        return None

    s = str(texto).strip()

    # Se contém PDF, rejeita
    if s.startswith('%PDF') or 'endobj' in s[:100]:
        return None

    # Remove cabeçalhos de navegação do SINAN
    pads_nav = [
        "Ir direto para menu de acessibilidade.",
        "Portal do Governo Brasileiro",
        "Atualize sua Barra de Governo",
        "Fim do menu principal",
        "Início do conteúdo da página",
        "Página inicial >",
    ]
    for pad in pads_nav:
        s = s.replace(pad, "")

    # Remove linhas de metadados SINAN (Publicado: ..., Acessos: ...)
    s = re.sub(r'Publicado:[^\n]*\n?', '', s)
    s = re.sub(r'Última atualização[^\n]*\n?', '', s)
    s = re.sub(r'Acessos:\s*\d+\n?', '', s)

    # Remove blocos de contato/rodapé do SINAN
    s = re.sub(r'CONTATO[\s\S]*?(?=Ficha|$)', '', s)
    s = re.sub(r'Coordenação-Geral[\s\S]*?(?=\n\n|$)', '', s)
    s = re.sub(r'Ficha de notificação[^\n]*\n?', '', s)
    s = re.sub(r'Instrucional de preenchimento[^\n]*\n?', '', s)
    s = re.sub(r'Dicionário de Dados[^\n]*\n?', '', s)
    s = re.sub(r'Dados epidemiológicos e estatísticas[^\n]*\n?', '', s)
    s = re.sub(r'Tabulações de dados[^\n]*\n?', '', s)
    s = re.sub(r'Mais informações[^\n]*\n?', '', s)

    # Remove linhas de endereço/email protegido
    s = re.sub(r'SRTVN[^\n]*\n?', '', s)
    s = re.sub(r'E-mail:[^\n]*\n?', '', s)
    s = re.sub(r'Telefone:[^\n]*\n?', '', s)
    s = re.sub(r'Coordenador Geral:[^\n]*\n?', '', s)
    s = re.sub(r'CEP:[^\n]*\n?', '', s)

    # Remove cabeçalho SINANWEB
    s = re.sub(r'SINANWEB\s*-\s*[^\n]*\n?', '', s)

    # Remove conteúdo "sem seções identificadas" (placeholder da extração)
    s = re.sub(r'Conteúdo completo extraído como texto contínuo[^\n]*\n?', '', s)

    # Remove CVE-SP footer padrão
    s = re.sub(r'Este espaço destina-se apenas[\s\S]*$', '', s)
    s = re.sub(r'Faça sua sugestão[\s\S]*$', '', s)
    s = re.sub(r'Agradecemos sua colaboração[\s\S]*$', '', s)

    # Remove linhas de navegação comuns
    s = re.sub(r'(?:Página inicial|Fim do menu|Início do conteúdo)[^\n]*\n?', '', s)

    # Remove espaços extras
    s = re.sub(r'\n{3,}', '\n\n', s)
    s = re.sub(r'[ \t]+', ' ', s)
    s = re.sub(r' +\n', '\n', s)
    s = re.sub(r'\n +', '\n', s)
    s = s.strip()

    # Mínimo de conteúdo útil
    if len(s) < 15:
        return None

    return s


def main():
    print("=" * 70)
    print("FASE 5.2 v2 — INTEGRAÇÃO CORRIGIDA")
    print("=" * 70)
    print()

    # Carregar dados
    print("[1/4] Carregando arquivos...")
    with open(HTML_FILE, "r", encoding="utf-8") as f:
        html_content = f.read()

    with open(MAPA_INTEGRACAO, "r", encoding="utf-8") as f:
        mapa_int = json.load(f)

    with open(BIBLIOTECA, "r", encoding="utf-8") as f:
        biblioteca = json.load(f)

    idx_bib = {e["nome"]: e for e in biblioteca["entidades"]}
    idx_mapa = {}
    for m in mapa_int["mapeamentos"]:
        if m["entidade_biblioteca"]:
            idx_mapa[m["entrada_html"]["nome"]] = m["entidade_biblioteca"]["nome"]

    print(f"  Mapa: {len(idx_mapa)} | Biblioteca: {len(idx_bib)}")
    print()

    # Extrair entradas como dicts
    print("[2/4] Extraindo entradas HTML...")
    entradas, array_start, array_end = extrair_entradas_como_dicts(html_content)
    if not entradas:
        print("  ERRO: Não foi possível extrair entradas")
        return

    print(f"  [OK] {len(entradas)} entradas extraídas")
    print()

    # Atualizar cada entrada
    print("[3/4] Atualizando dados da biblioteca...")
    campos_atualizados = {k: 0 for k in MAPA_CAMPOS}

    for entrada in entradas:
        nome_html = entrada.get("nome", "")
        nome_entidade = idx_mapa.get(nome_html)

        if not nome_entidade or nome_entidade not in idx_bib:
            continue

        dados_bib = idx_bib[nome_entidade].get("dados_epidemiologicos", {})

        for campo_html, campo_bib in MAPA_CAMPOS.items():
            valor_bib = dados_bib.get(campo_bib)
            if not valor_bib:
                continue

            texto_limpo = limpar_texto_biblioteca(valor_bib)
            if texto_limpo and len(texto_limpo) > 10:
                # NÃO substituir descricao se for a principal (mantém descricao original do HTML)
                if campo_html == "descricao":
                    # Só atualiza se o valor atual for muito curto (placeholder) e o novo for melhor
                    atual = entrada.get(campo_html, "")
                    if len(atual) > 50 and len(texto_limpo) < len(atual) * 3:
                        continue  # Mantém original se já é bom
                entrada[campo_html] = texto_limpo
                campos_atualizados[campo_html] += 1

    print(f"  Campos atualizados:")
    for campo, count in campos_atualizados.items():
        if count > 0:
            print(f"    {campo}: {count}")
    print()

    # Reconstruir o array
    print("[4/4] Reconstruindo array JavaScript...")
    linhas_js = []
    for i, entrada in enumerate(entradas):
        partes = []

        # Campos de notificação primeiro (IMUTÁVEIS)
        nome = entrada.get("nome", "")
        classificacao = entrada.get("classificacao", "")
        prazo = entrada.get("prazo_dias", 7)
        referencia = entrada.get("referencia_nacional", "")

        partes.append(f'nome: {js_string(nome)}')
        partes.append(f'classificacao: {js_string(classificacao)}')
        partes.append(f'prazo_dias: {prazo}')
        partes.append(f'descricao: {js_string(entrada.get("descricao", ""))}')
        partes.append(f'referencia_nacional: {js_string(referencia)}')

        # Campos epidemiológicos
        for campo_html in MAPA_CAMPOS:
            if campo_html == "descricao":
                continue
            val = entrada.get(campo_html, "")
            partes.append(f'{campo_html}: {js_string(val)}')

        linha = "{ " + ", ".join(partes) + " }"
        if i < len(entradas) - 1:
            linha += ","
        linhas_js.append(linha)

    novo_array = "[\n// NOTIFICAÇÃO IMEDIATA (até 24 horas)\n" + "\n".join(linhas_js[:31]) + "\n\n// NOTIFICAÇÃO SEMANAL (até 7 dias)\n" + "\n".join(linhas_js[31:]) + "\n]"

    # Substituir no HTML
    novo_html = html_content[:array_start] + "const dadosNotificacao = " + novo_array + html_content[array_end:]

    # Salvar
    with open(HTML_FILE, "w", encoding="utf-8") as f:
        f.write(novo_html)
    print(f"  [OK] HTML salvo: {len(novo_html)} caracteres")
    print()

    # Verificar
    raw_newlines = novo_array.count('\n')
    pdf_check = '%PDF' in novo_array
    print(f"  Validação: {raw_newlines} newlines no array | PDF: {'SIM ⚠️' if pdf_check else 'NÃO ✅'}")

    # Relatório
    linhas = []
    linhas.append("=" * 70)
    linhas.append("FASE 5.2 v2 — RELATÓRIO DE INTEGRAÇÃO CORRIGIDA")
    linhas.append(f"Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    linhas.append("=" * 70)
    linhas.append(f"Entradas processadas: {len(entradas)}")
    linhas.append(f"Escape JS: json.dumps (robusto)")
    linhas.append(f"PDF filtrado: {'SIM' if not pdf_check else 'NÃO'}")
    for campo, count in campos_atualizados.items():
        linhas.append(f"  {campo}: {count} atualizados")
    linhas.append("=" * 70)

    with open(SAIDA_TXT, "w", encoding="utf-8") as f:
        f.write("\n".join(linhas))

    print("=" * 70)
    print("FASE 5.2 v2 CONCLUÍDA")
    print("=" * 70)


if __name__ == "__main__":
    main()
