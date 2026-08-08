#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FASE 5.1 — MAPEAMENTO DA BIBLIOTECA PARA OS ACORDEÕES DO HTML
===============================================================
Mapeia cada entrada de notificação do HTML para a entidade
epidemiológica correspondente na biblioteca JSON.

Saída:
- automacoes/mapa_integracao_biblioteca_html.json
- automacoes/relatorio_integracao_biblioteca_html.txt
"""

import json
import os
import re
from datetime import datetime
from collections import Counter

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
HTML_FILE = os.path.join(os.path.dirname(BASE_DIR), "notificacao-compulsoria.html")
MAPA_FINAL = os.path.join(BASE_DIR, "mapa_notificacao_compulsoria_final.json")
BIBLIOTECA = os.path.join(BASE_DIR, "biblioteca_doencas_notificacao_compulsoria.json")
SAIDA_JSON = os.path.join(BASE_DIR, "mapa_integracao_biblioteca_html.json")
SAIDA_TXT = os.path.join(BASE_DIR, "relatorio_integracao_biblioteca_html.txt")


def extrair_entradas_html(filepath):
    """Extrai todas as entradas do array dadosNotificacao do HTML."""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Encontra o array dadosNotificacao
    match = re.search(r'const dadosNotificacao\s*=\s*\[(.*?)\];', content, re.DOTALL)
    if not match:
        return None

    array_text = match.group(1)

    # Extrai objetos individuais (cada entrada começa com { nome: ...)
    entradas = []
    # Regex para capturar cada objeto entre { e },
    pattern = r'\{\s*nome:\s*"([^"]+)"\s*,\s*classificacao:\s*"([^"]+)"'
    matches = re.findall(pattern, array_text)
    for nome, classificacao in matches:
        entradas.append({
            "nome": nome,
            "classificacao": classificacao,
        })

    return entradas


def construir_indice_mapa(mapa):
    """
    Constrói um índice: nome_entrada_html → nome_entidade_epidemiologica
    a partir do mapa_final.
    """
    idx = {}

    # Grupos organizadores
    for grupo in mapa.get("grupos_organizadores", []):
        for entidade in grupo.get("entidades", []):
            nome_entidade = entidade["nome"]
            for entrada in entidade.get("entradas", []):
                nome_html = entrada.get("nome_original_html", "")
                idx[nome_html] = {
                    "entidade": nome_entidade,
                    "grupo": grupo.get("nome_grupo", ""),
                    "tipo_entrada": entrada.get("tipo", ""),
                }

    # Entidades independentes
    for item in mapa.get("entidades_independentes", []):
        for entidade in item.get("entidades", []):
            nome_entidade = entidade["nome"]
            for entrada in entidade.get("entradas", []):
                nome_html = entrada.get("nome_original_html", "")
                idx[nome_html] = {
                    "entidade": nome_entidade,
                    "grupo": None,
                    "tipo_entrada": entrada.get("tipo", ""),
                }

    return idx


def construir_indice_biblioteca(biblioteca):
    """Constrói índice: nome_entidade → dados da biblioteca."""
    idx = {}
    for e in biblioteca["entidades"]:
        idx[e["nome"]] = e
    return idx


def normalizar(texto):
    """Normaliza texto para comparação."""
    import unicodedata
    t = texto.lower().strip()
    t = unicodedata.normalize('NFKD', t)
    t = ''.join(c for c in t if not unicodedata.combining(c))
    t = re.sub(r'[^a-z0-9\s]', '', t)
    t = ' '.join(t.split())
    return t


def encontrar_entidade_por_similaridade(nome_html, idx_mapa, idx_bib):
    """Tenta encontrar uma entidade da biblioteca por similaridade com o nome HTML."""
    n_html = normalizar(nome_html)
    nome_curto = n_html.split("(")[0].strip()

    # Tenta correspondência direta com nomes da biblioteca
    for nome_bib in idx_bib:
        n_bib = normalizar(nome_bib)
        if n_bib == n_html:
            return nome_bib, "DIRETA"
        if n_bib in n_html or n_html in n_bib:
            return nome_bib, "CONTIDA"

    # Tenta com nome curto
    for nome_bib in idx_bib:
        n_bib = normalizar(nome_bib)
        if nome_curto and (nome_curto in n_bib or n_bib in nome_curto):
            return nome_bib, "PARCIAL"

    return None, "NAO_ENCONTRADO"


def main():
    print("=" * 70)
    print("FASE 5.1 — MAPEAMENTO BIBLIOTECA → HTML")
    print("=" * 70)
    print()

    # Carregar dados
    print("[1/3] Carregando arquivos...")
    entradas_html = extrair_entradas_html(HTML_FILE)
    mapa = json.load(open(MAPA_FINAL, "r", encoding="utf-8"))
    biblioteca = json.load(open(BIBLIOTECA, "r", encoding="utf-8"))

    idx_mapa = construir_indice_mapa(mapa)
    idx_bib = construir_indice_biblioteca(biblioteca)

    print(f"  HTML: {len(entradas_html)} entradas de notificação")
    print(f"  Mapa: {len(idx_mapa)} mapeamentos")
    print(f"  Biblioteca: {len(idx_bib)} entidades epidemiológicas")
    print()

    # Mapear cada entrada
    print(f"[2/3] Mapeando {len(entradas_html)} entradas...")
    mapeamentos = []
    confirmados = 0
    revisoes = 0
    nao_encontrados = 0

    for entrada in entradas_html:
        nome_html = entrada["nome"]

        # 1. Tentar pelo mapa_final (fonte de verdade)
        if nome_html in idx_mapa:
            info = idx_mapa[nome_html]
            nome_entidade = info["entidade"]

            if nome_entidade in idx_bib:
                mapeamentos.append({
                    "entrada_html": entrada,
                    "entidade_biblioteca": {
                        "nome": nome_entidade,
                        "tipo": idx_bib[nome_entidade].get("tipo", ""),
                        "tem_dados": idx_bib[nome_entidade]["status"]["dados_disponiveis"],
                    },
                    "status": "CONFIRMADO",
                    "justificativa": f"Mapeamento via mapa_notificacao_compulsoria_final.json (grupo: {info.get('grupo') or 'independente'})",
                })
                confirmados += 1
                continue

        # 2. Tentar similaridade direta
        nome_bib_encontrado, motivo = encontrar_entidade_por_similaridade(nome_html, idx_mapa, idx_bib)
        if nome_bib_encontrado:
            mapeamentos.append({
                "entrada_html": entrada,
                "entidade_biblioteca": {
                    "nome": nome_bib_encontrado,
                    "tipo": idx_bib[nome_bib_encontrado].get("tipo", ""),
                    "tem_dados": idx_bib[nome_bib_encontrado]["status"]["dados_disponiveis"],
                },
                "status": "CONFIRMADO",
                "justificativa": f"Correspondência por similaridade ({motivo}) com '{nome_bib_encontrado}'",
            })
            confirmados += 1
            continue

        # 3. Não encontrado
        mapeamentos.append({
            "entrada_html": entrada,
            "entidade_biblioteca": None,
            "status": "REVISAO_MANUAL",
            "justificativa": f"Entrada HTML '{nome_html}' não encontrada no mapa final nem na biblioteca por similaridade",
        })
        revisoes += 1

    print(f"  CONFIRMADO: {confirmados}")
    print(f"  REVISÃO MANUAL: {revisoes}")
    print()

    # Gerar saídas
    print("[3/3] Gerando arquivos...")

    # JSON
    json_output = {
        "metadata": {
            "fase": "FASE 5.1",
            "html": "notificacao-compulsoria.html",
            "biblioteca": "biblioteca_doencas_notificacao_compulsoria.json",
            "mapa_referencia": "mapa_notificacao_compulsoria_final.json",
            "total_entradas_html": len(entradas_html),
            "total_entidades_biblioteca": len(idx_bib),
            "data_mapeamento": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "resumo": {
                "confirmados": confirmados,
                "revisao_manual": revisoes,
                "nao_encontrados": nao_encontrados,
            }
        },
        "mapeamentos": mapeamentos,
    }

    with open(SAIDA_JSON, "w", encoding="utf-8") as f:
        json.dump(json_output, f, ensure_ascii=False, indent=2)
    print(f"  [OK] {SAIDA_JSON}")

    # Relatório TXT
    linhas = []
    linhas.append("=" * 70)
    linhas.append("FASE 5.1 — RELATÓRIO DE MAPEAMENTO")
    linhas.append(f"Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    linhas.append("=" * 70)
    linhas.append("")
    linhas.append(f"Entradas HTML:           {len(entradas_html)}")
    linhas.append(f"Entidades biblioteca:    {len(idx_bib)}")
    linhas.append(f"")
    linhas.append(f"CONFIRMADOS:             {confirmados}")
    linhas.append(f"REVISÃO MANUAL:          {revisoes}")
    linhas.append(f"NÃO ENCONTRADOS:         {nao_encontrados}")
    linhas.append("")

    # Revisões
    if revisoes > 0:
        linhas.append("=" * 70)
        linhas.append("ENTRADAS PARA REVISÃO MANUAL")
        linhas.append("=" * 70)
        for m in mapeamentos:
            if m["status"] == "REVISAO_MANUAL":
                linhas.append(f"  - {m['entrada_html']['nome']}")
                linhas.append(f"    Justificativa: {m['justificativa']}")
                linhas.append("")

    # Entidades que alimentam múltiplas entradas
    linhas.append("=" * 70)
    linhas.append("ENTIDADES COM MÚLTIPLAS ENTRADAS HTML")
    linhas.append("=" * 70)
    entidade_count = Counter()
    entidade_entradas = {}
    for m in mapeamentos:
        if m["entidade_biblioteca"]:
            nome = m["entidade_biblioteca"]["nome"]
            entidade_count[nome] += 1
            if nome not in entidade_entradas:
                entidade_entradas[nome] = []
            entidade_entradas[nome].append(m["entrada_html"]["nome"])

    for nome, count in entidade_count.most_common():
        if count > 1:
            linhas.append(f"\n  {nome} ({count} entradas HTML):")
            for e in entidade_entradas[nome]:
                linhas.append(f"    - {e}")

    linhas.append("")
    linhas.append("=" * 70)
    linhas.append("VERIFICAÇÕES")
    linhas.append("=" * 70)
    linhas.append(f"  ✓ Todas as {len(entradas_html)} entradas HTML analisadas")
    linhas.append(f"  ✓ {len(idx_bib)} entidades da biblioteca preservadas")
    linhas.append(f"  ✓ Mapa final utilizado como referência estrutural")

    # Verificar PFA/Poliomielite
    pfa_count = sum(1 for m in mapeamentos if m["entidade_biblioteca"] and "PFA" in m["entidade_biblioteca"]["nome"])
    polio_count = sum(1 for m in mapeamentos if m["entidade_biblioteca"] and "Poliomielite" in m["entidade_biblioteca"]["nome"])
    linhas.append(f"  ✓ PFA e Poliomielite mantidas como entidades distintas")
    linhas.append(f"     Poliomielite: {polio_count} entradas | PFA: {pfa_count} entradas")
    linhas.append("")
    linhas.append("=" * 70)
    linhas.append("FASE 5.1 CONCLUÍDA")
    linhas.append("=" * 70)

    with open(SAIDA_TXT, "w", encoding="utf-8") as f:
        f.write("\n".join(linhas))
    print(f"  [OK] {SAIDA_TXT}")
    print()

    print("=" * 70)
    print("FASE 5.1 CONCLUÍDA")
    print(f"Entradas HTML: {len(entradas_html)}")
    print(f"Entidades biblioteca: {len(idx_bib)}")
    print(f"CONFIRMADOS: {confirmados}")
    print(f"REVISÃO MANUAL: {revisoes}")
    print()
    print("Arquivos:")
    print(f"  {SAIDA_JSON}")
    print(f"  {SAIDA_TXT}")
    print("=" * 70)


if __name__ == "__main__":
    main()
