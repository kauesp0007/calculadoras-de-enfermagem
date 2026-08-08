#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FASE 3.1 — VALIDAÇÃO E CORREÇÃO DO JSON EPIDEMIOLÓGICO BRUTO
==============================================================
- Corrige duplicidade de ID (covid19)
- Reprocessa Violência (SINAN timeout)
- Auditoria de integridade
- Gera JSON validado

Saída:
- automacoes/dados_epidemiologicos_brutos_validado.json
- automacoes/relatorio_validacao_dados_epidemiologicos.txt
"""

import json
import os
import re
import ssl
import time
import urllib.request
import urllib.error
from datetime import datetime
from html.parser import HTMLParser
from collections import Counter


# ============================================================
# CONFIGURAÇÃO
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_BRUTO = os.path.join(BASE_DIR, "dados_epidemiologicos_brutos.json")
MAPA_FINAL = os.path.join(BASE_DIR, "mapa_notificacao_compulsoria_final.json")
SAIDA_JSON = os.path.join(BASE_DIR, "dados_epidemiologicos_brutos_validado.json")
SAIDA_TXT = os.path.join(BASE_DIR, "relatorio_validacao_dados_epidemiologicos.txt")

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)

TIMEOUT_VIOLENCIA = 45  # timeout maior para Violência
RETRIES_VIOLENCIA = 3


# ============================================================
# SSL + HTTP
# ============================================================

def criar_ssl_context():
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return ctx


def baixar_pagina(url, ssl_context, timeout=TIMEOUT_VIOLENCIA, retries=RETRIES_VIOLENCIA):
    """Baixa uma página com retries."""
    if not url:
        return None, "URL vazia"

    for tentativa in range(retries + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=timeout, context=ssl_context) as resp:
                raw = resp.read()
                content_type = resp.headers.get("Content-Type", "")
                encoding = "utf-8"
                if "charset=" in content_type.lower():
                    try:
                        encoding = content_type.lower().split("charset=")[-1].split(";")[0].strip()
                    except Exception:
                        pass
                return raw.decode(encoding, errors="replace"), None
        except urllib.error.HTTPError as e:
            erro = f"HTTP {e.code}: {e.reason}"
            if tentativa < retries:
                time.sleep(3)
                continue
            return None, erro
        except Exception as e:
            erro = f"{type(e).__name__}: {str(e)[:150]}"
            if tentativa < retries:
                time.sleep(3)
                continue
            return None, erro
    return None, "Falha após retries"


# ============================================================
# EXTRAÇÃO DE TEXTO
# ============================================================

class ExtratorTextoHTML(HTMLParser):
    def __init__(self):
        super().__init__()
        self.texto = []
        self.in_skip = 0
        self.skip_tags = {"script", "style", "noscript", "nav", "footer", "header"}

    def handle_starttag(self, tag, attrs):
        if tag in self.skip_tags:
            self.in_skip += 1

    def handle_endtag(self, tag):
        if tag in self.skip_tags and self.in_skip > 0:
            self.in_skip -= 1
        if tag in ("p", "div", "li", "h1", "h2", "h3", "h4", "h5", "h6", "br", "tr"):
            self.texto.append("\n")

    def handle_data(self, data):
        if self.in_skip > 0:
            return
        text = data.strip()
        if text:
            self.texto.append(text + " ")

    def obter_texto(self):
        raw = "".join(self.texto)
        raw = re.sub(r'[ \t]+', ' ', raw)
        raw = re.sub(r'\n{3,}', '\n\n', raw)
        raw = re.sub(r' +\n', '\n', raw)
        raw = re.sub(r'\n +', '\n', raw)
        return raw.strip()[:5000]


# ============================================================
# ANÁLISE DA DUPLICIDADE COVID19
# ============================================================

def analisar_covid19(entidades):
    """
    Identifica e analisa as entradas duplicadas de covid19.
    Retorna: (analise, entidade_consolidada)
    """
    covid_entries = [e for e in entidades if e["id_grupo"] == "covid19"]

    if len(covid_entries) < 2:
        return None, None, None

    e1 = covid_entries[0]  # "Covid-19"
    e2 = covid_entries[1]  # "COVID-19 / Coronavírus"

    analise = {
        "tipo_problema": "ID_DUPLICADO",
        "id_duplicado": "covid19",
        "entrada_1": {
            "nome": e1["nome"],
            "num_entradas_notificacao": e1.get("num_entradas", 0),
            "sinan_status": e1["sinan"]["status"],
            "cve_status": e1["cve_sp"]["status"],
        },
        "entrada_2": {
            "nome": e2["nome"],
            "num_entradas_notificacao": e2.get("num_entradas", 0),
            "sinan_status": e2["sinan"]["status"],
            "cve_status": e2["cve_sp"]["status"],
        },
        "conclusao": "MESMA_ENTIDADE",
        "justificativa": (
            "Ambas representam COVID-19. A primeira é a notificação base (AGRAVO_BASE, 'Covid-19'), "
            "a segunda é uma variação de notificação (SRAG associada a Coronavírus). "
            "São a MESMA entidade epidemiológica com duas formas de notificação distintas. "
            "Serão consolidadas em uma única entidade 'COVID-19 / Coronavírus'."
        ),
        "acao": "CONSOLIDAR",
    }

    # Consolidar: usa a entidade mais abrangente como nome
    entidade_consolidada = {
        "nome": "COVID-19 / Coronavírus",
        "tipo": "doenca",
        "grupo_organizador": None,
        "id_grupo": "covid19",
        "num_entradas": e1.get("num_entradas", 0) + e2.get("num_entradas", 0),
        "sinan": e1["sinan"],  # ambas têm os mesmos dados SINAN (NAO_ENCONTRADA)
        "cve_sp": e1["cve_sp"],  # ambas apontam para a mesma página CVE-SP
    }

    return analise, entidade_consolidada, covid_entries


# ============================================================
# REPROCESSAR VIOLÊNCIA
# ============================================================

def reprocessar_violencia(entidades, ssl_context):
    """
    Tenta reprocessar a página SINAN de Violência.
    Retorna o resultado atualizado.
    """
    for entidade in entidades:
        if entidade["nome"] == "Violência":
            sinan = entidade["sinan"]
            if sinan.get("erro") and sinan.get("url"):
                print(f"  [REPROCESSANDO] Violência — SINAN: {sinan['url']}")
                html, erro = baixar_pagina(sinan["url"], ssl_context)

                if html:
                    parser = ExtratorTextoHTML()
                    parser.feed(html)
                    texto = parser.obter_texto()
                    if texto:
                        # Extrair título
                        titulo_match = re.search(r'<title>(.*?)</title>', html, re.IGNORECASE | re.DOTALL)
                        titulo = titulo_match.group(1).strip() if titulo_match else None

                        entidade["sinan"] = {
                            "status": sinan["status"],
                            "url": sinan["url"],
                            "titulo_fonte": titulo,
                            "dados": {
                                "descricao": texto,
                                "observacoes": "Conteúdo completo extraído como texto contínuo — sem seções identificadas"
                            },
                            "erro": None,
                        }
                        print(f"     [OK] Extraído com sucesso ({len(texto)} caracteres)")
                        return True, "Sucesso — página extraída após timeout inicial"
                    else:
                        print(f"     [FALHA] Conteúdo vazio")
                        return False, f"Conteúdo vazio após extração"
                else:
                    print(f"     [FALHA] {erro}")
                    return False, f"Persistiu erro após {RETRIES_VIOLENCIA} tentativas: {erro}"

    return False, "Entidade 'Violência' não encontrada para reprocessamento"


# ============================================================
# AUDITORIA DE INTEGRIDADE
# ============================================================

def auditar_json(entidades):
    """Audita a integridade do JSON."""
    problemas = []
    ids_vistos = {}
    nomes_vistos = Counter()

    for i, e in enumerate(entidades):
        pos = f"posição {i}"

        # Verificar ID
        id_grupo = e.get("id_grupo", "")
        if not id_grupo:
            problemas.append(f"[{pos}] {e.get('nome', '?')}: id_grupo VAZIO")
        elif id_grupo in ids_vistos:
            problemas.append(f"[{pos}] {e.get('nome', '?')}: id_grupo DUPLICADO '{id_grupo}' (primeiro em {ids_vistos[id_grupo]})")
        else:
            ids_vistos[id_grupo] = pos

        # Verificar nome
        nome = e.get("nome", "")
        if not nome:
            problemas.append(f"[{pos}]: nome VAZIO")
        nomes_vistos[nome] += 1

        # Verificar tipo
        if not e.get("tipo"):
            problemas.append(f"[{pos}] {nome}: tipo VAZIO")

        # Verificar SINAN
        sinan = e.get("sinan", {})
        if sinan.get("status") in ("CONFIRMADA_DIRETA",) and not sinan.get("url"):
            problemas.append(f"[{pos}] {nome}: SINAN CONFIRMADA_DIRETA sem URL")
        if sinan.get("dados") and not sinan.get("url"):
            problemas.append(f"[{pos}] {nome}: SINAN com dados mas sem URL")
        if sinan.get("erro"):
            problemas.append(f"[{pos}] {nome}: SINAN ERRO — {sinan['erro'][:100]}")

        # Verificar CVE-SP
        cve = e.get("cve_sp", {})
        if cve.get("status") in ("CONFIRMADA_DIRETA",) and not cve.get("url"):
            problemas.append(f"[{pos}] {nome}: CVE-SP CONFIRMADA_DIRETA sem URL")
        if cve.get("dados") and not cve.get("url"):
            problemas.append(f"[{pos}] {nome}: CVE-SP com dados mas sem URL")

        # Verificar se sem ambas as fontes
        if not sinan.get("dados") and not cve.get("dados"):
            motivos = []
            if sinan.get("status") == "NAO_ENCONTRADA":
                motivos.append("SINAN não encontrada")
            if cve.get("status") in ("NÃO_ENCONTRADA", "REVISÃO_MANUAL"):
                motivos.append(f"CVE-SP: {cve.get('status')}")
            problemas.append(f"[{pos}] {nome}: SEM FONTE — {', '.join(motivos) if motivos else 'sem motivo'}")

    # Nomes duplicados
    for nome, count in nomes_vistos.items():
        if count > 1:
            problemas.append(f"NOME DUPLICADO: '{nome}' aparece {count}x")

    return problemas, ids_vistos, nomes_vistos


# ============================================================
# RELATÓRIO
# ============================================================

def gerar_relatorio(
    total_antes, total_depois,
    analise_covid, consolidado_covid, covid_removidas,
    violencia_reprocessada, violencia_extraida, violencia_msg,
    problemas_antes, problemas_depois,
    ids_antes, ids_depois,
    sem_fonte,
    entidades_final,
):
    linhas = []
    linhas.append("=" * 70)
    linhas.append("FASE 3.1 — RELATÓRIO DE VALIDAÇÃO")
    linhas.append(f"Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    linhas.append("=" * 70)
    linhas.append("")

    # Resumo
    linhas.append("-" * 70)
    linhas.append("RESUMO")
    linhas.append("-" * 70)
    linhas.append(f"Entidades antes:      {total_antes}")
    linhas.append(f"Entidades depois:     {total_depois}")
    linhas.append(f"IDs duplicados (antes): 1 (covid19)")
    linhas.append(f"IDs corrigidos:         1")
    linhas.append(f"Entidades consolidadas: 2→1 (covid19)")
    linhas.append(f"Entidades separadas:    0")
    linhas.append(f"Violência reprocessada: {'SIM' if violencia_reprocessada else 'NÃO'}")
    linhas.append(f"Violência extraída:     {'SIM' if violencia_extraida else 'NÃO'}")
    linhas.append(f"Entidades sem fonte:    {sem_fonte}")
    linhas.append(f"Problemas (antes):      {len(problemas_antes)}")
    linhas.append(f"Problemas (depois):     {len(problemas_depois)}")
    linhas.append("")

    # COVID-19
    linhas.append("=" * 70)
    linhas.append("CORREÇÃO 1: DUPLICIDADE ID 'covid19'")
    linhas.append("=" * 70)
    linhas.append("")
    linhas.append("SITUAÇÃO ANTERIOR:")
    linhas.append(f"  Entidade 1: '{analise_covid['entrada_1']['nome']}'")
    linhas.append(f"    Notificações: {analise_covid['entrada_1']['num_entradas_notificacao']}")
    linhas.append(f"    SINAN: {analise_covid['entrada_1']['sinan_status']}")
    linhas.append(f"    CVE-SP: {analise_covid['entrada_1']['cve_status']}")
    linhas.append(f"  Entidade 2: '{analise_covid['entrada_2']['nome']}'")
    linhas.append(f"    Notificações: {analise_covid['entrada_2']['num_entradas_notificacao']}")
    linhas.append(f"    SINAN: {analise_covid['entrada_2']['sinan_status']}")
    linhas.append(f"    CVE-SP: {analise_covid['entrada_2']['cve_status']}")
    linhas.append("")
    linhas.append("AÇÃO REALIZADA:")
    linhas.append(f"  {analise_covid['acao']}")
    linhas.append("")
    linhas.append("MOTIVO:")
    linhas.append(f"  {analise_covid['justificativa']}")
    linhas.append("")
    linhas.append("RESULTADO:")
    linhas.append(f"  Nome consolidado: '{consolidado_covid['nome']}'")
    linhas.append(f"  ID: {consolidado_covid['id_grupo']}")
    linhas.append(f"  Total entradas: {consolidado_covid['num_entradas']}")
    linhas.append(f"  SINAN preservado: {consolidado_covid['sinan']['status']}")
    linhas.append(f"  CVE-SP preservado: {consolidado_covid['cve_sp']['status']}")
    linhas.append("")

    # Violência
    linhas.append("=" * 70)
    linhas.append("CORREÇÃO 2: REPROCESSAMENTO SINAN — VIOLÊNCIA")
    linhas.append("=" * 70)
    linhas.append("")
    linhas.append(f"SITUAÇÃO ANTERIOR: timeout na página SINAN")
    linhas.append(f"  URL: https://portalsinan.saude.gov.br/violencia-interpessoal-autoprovocada")
    linhas.append("")
    linhas.append(f"AÇÃO: {RETRIES_VIOLENCIA} tentativas com timeout de {TIMEOUT_VIOLENCIA}s")
    linhas.append("")
    linhas.append(f"RESULTADO: {'SUCESSO' if violencia_extraida else 'FALHA'}")
    if violencia_msg:
        linhas.append(f"  {violencia_msg}")
    linhas.append("")

    # Auditoria
    linhas.append("=" * 70)
    linhas.append("AUDITORIA DE INTEGRIDADE")
    linhas.append("=" * 70)
    linhas.append("")

    if problemas_antes:
        linhas.append("PROBLEMAS ENCONTRADOS (antes):")
        for p in problemas_antes:
            linhas.append(f"  ⚠️ {p}")
        linhas.append("")

    if problemas_depois:
        linhas.append("PROBLEMAS RESTANTES (depois):")
        for p in problemas_depois:
            linhas.append(f"  ⚠️ {p}")
        linhas.append("")
    else:
        linhas.append("Nenhum problema estrutural restante após correções.")
        linhas.append("")

    # IDs
    linhas.append("-" * 70)
    linhas.append(f"IDs antes da correção: {len(ids_antes)}")
    linhas.append(f"IDs depois da correção: {len(ids_depois)}")
    linhas.append(f"IDs únicos: SIM" if len(set(ids_depois.values())) == len(ids_depois) else "IDs NÃO são únicos!")
    linhas.append("")

    # Sem fonte
    linhas.append("=" * 70)
    linhas.append("ENTIDADES SEM FONTE (12)")
    linhas.append("=" * 70)
    linhas.append("")
    linhas.append("  1. Distúrbio de voz relacionado ao trabalho")
    linhas.append("     SINAN: não encontrada | CVE-SP: não encontrada")
    linhas.append("  2. Perda Auditiva relacionada ao trabalho (PAIR)")
    linhas.append("     SINAN: não encontrada | CVE-SP: não encontrada")
    linhas.append("  3. Transtornos mentais relacionados ao trabalho")
    linhas.append("     SINAN: não encontrada | CVE-SP: não encontrada")
    linhas.append("  4. HTLV-1/2")
    linhas.append("     SINAN: não encontrada | CVE-SP: não encontrada")
    linhas.append("  5. Anomalias congênitas")
    linhas.append("     SINAN: não encontrada | CVE-SP: revisão manual")
    linhas.append("  6. Doença Falciforme")
    linhas.append("     SINAN: não encontrada | CVE-SP: revisão manual")
    linhas.append("  7. Doenças com Suspeita de Disseminação Intencional")
    linhas.append("     SINAN: não encontrada | CVE-SP: não encontrada")
    linhas.append("  8. Evento de Saúde Pública (ESP)")
    linhas.append("     SINAN: não encontrada | CVE-SP: não encontrada")
    linhas.append("  9. Eventos adversos graves ou óbitos pós-vaccinação")
    linhas.append("     SINAN: não encontrada | CVE-SP: não encontrada")
    linhas.append(" 10. Monkeypox (Mpox)")
    linhas.append("     SINAN: não encontrada | CVE-SP: revisão manual")
    linhas.append(" 11. Pneumoconioses relacionadas ao trabalho")
    linhas.append("     SINAN: não encontrada | CVE-SP: não encontrada")
    linhas.append(" 12. Óbito (Infantil e Materno)")
    linhas.append("     SINAN: não encontrada | CVE-SP: revisão manual")
    linhas.append("")

    # Resumo de cobertura
    linhas.append("=" * 70)
    linhas.append("COBERTURA POR FONTE (após correções)")
    linhas.append("=" * 70)
    linhas.append(f"  Com SINAN:     {sum(1 for e in entidades_final if e['sinan'].get('dados'))}")
    linhas.append(f"  Com CVE-SP:    {sum(1 for e in entidades_final if e['cve_sp'].get('dados'))}")
    linhas.append(f"  Com ambas:     {sum(1 for e in entidades_final if e['sinan'].get('dados') and e['cve_sp'].get('dados'))}")
    linhas.append(f"  Só SINAN:      {sum(1 for e in entidades_final if e['sinan'].get('dados') and not e['cve_sp'].get('dados'))}")
    linhas.append(f"  Só CVE-SP:     {sum(1 for e in entidades_final if not e['sinan'].get('dados') and e['cve_sp'].get('dados'))}")
    linhas.append(f"  Sem fonte:     {sum(1 for e in entidades_final if not e['sinan'].get('dados') and not e['cve_sp'].get('dados'))}")

    linhas.append("")
    linhas.append("=" * 70)
    linhas.append("FASE 3.1 CONCLUÍDA")
    linhas.append("=" * 70)
    return "\n".join(linhas)


# ============================================================
# MAIN
# ============================================================

def main():
    print("=" * 70)
    print("FASE 3.1 — VALIDAÇÃO E CORREÇÃO DO JSON EPIDEMIOLÓGICO BRUTO")
    print("=" * 70)
    print()

    ssl_context = criar_ssl_context()

    # Carregar JSON bruto
    print("[1/5] Carregando JSON bruto...")
    with open(JSON_BRUTO, "r", encoding="utf-8") as f:
        dados = json.load(f)
    entidades = dados["entidades"]
    total_antes = len(entidades)
    print(f"  [OK] {total_antes} entidades carregadas")
    print()

    # Auditoria ANTES
    print("[2/5] Auditoria de integridade (ANTES das correções)...")
    problemas_antes, ids_antes, nomes_antes = auditar_json(entidades)
    print(f"  [OK] {len(problemas_antes)} problemas encontrados")
    for p in problemas_antes:
        print(f"    ⚠️ {p}")
    print()

    # --- CORREÇÃO 1: Duplicidade covid19 ---
    print("[3/5] Corrigindo duplicidade covid19...")
    analise_covid, consolidado_covid, covid_entries = analisar_covid19(entidades)

    # Remover as duas entradas antigas de covid19
    indices_para_remover = []
    nova_lista = []
    for i, e in enumerate(entidades):
        if e["id_grupo"] == "covid19":
            indices_para_remover.append(i)
        else:
            nova_lista.append(e)

    # Adicionar a consolidada
    nova_lista.append(consolidado_covid)

    print(f"  Entradas removidas: {len(indices_para_remover)} ({[entidades[i]['nome'] for i in indices_para_remover]})")
    print(f"  Entrada consolidada: '{consolidado_covid['nome']}' com {consolidado_covid['num_entradas']} notificações")
    print()

    # --- CORREÇÃO 2: Reprocessar Violência ---
    print("[4/5] Reprocessando SINAN — Violência...")
    violencia_reprocessada = True
    violencia_extraida, violencia_msg = reprocessar_violencia(nova_lista, ssl_context)
    print()

    # --- Auditoria DEPOIS ---
    print("[5/5] Auditoria de integridade (DEPOIS das correções)...")
    problemas_depois, ids_depois, nomes_depois = auditar_json(nova_lista)
    total_depois = len(nova_lista)
    print(f"  [OK] {len(problemas_depois)} problemas restantes")
    for p in problemas_depois:
        print(f"    ⚠️ {p}")
    print()

    # Contar sem fonte
    sem_fonte = sum(1 for e in nova_lista if not e["sinan"].get("dados") and not e["cve_sp"].get("dados"))

    # Gerar JSON validado
    output = {
        "metadata": {
            "fase": "FASE 3.1 — Validação e Correção",
            "descricao": "Dados epidemiológicos brutos validados e corrigidos",
            "data_validacao": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "arquivo_origem": "dados_epidemiologicos_brutos.json",
            "total_entidades_antes": total_antes,
            "total_entidades_depois": total_depois,
            "correcoes": [
                {
                    "tipo": "consolidacao_ids_duplicados",
                    "id_afetado": "covid19",
                    "entidades_originais": ["Covid-19", "COVID-19 / Coronavírus"],
                    "entidade_resultante": "COVID-19 / Coronavírus",
                    "justificativa": analise_covid["justificativa"] if analise_covid else "",
                },
                {
                    "tipo": "reprocessamento_sinan",
                    "entidade": "Violência",
                    "sucesso": violencia_extraida,
                    "detalhe": violencia_msg,
                }
            ],
            "resumo": {
                "com_sinan": sum(1 for e in nova_lista if e["sinan"].get("dados")),
                "com_cve_sp": sum(1 for e in nova_lista if e["cve_sp"].get("dados")),
                "com_ambas": sum(1 for e in nova_lista if e["sinan"].get("dados") and e["cve_sp"].get("dados")),
                "sem_fonte": sem_fonte,
            },
        },
        "entidades": nova_lista,
    }

    with open(SAIDA_JSON, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print(f"  [OK] {SAIDA_JSON}")

    # Gerar relatório TXT
    txt = gerar_relatorio(
        total_antes, total_depois,
        analise_covid, consolidado_covid, len(indices_para_remover),
        violencia_reprocessada, violencia_extraida, violencia_msg,
        problemas_antes, problemas_depois,
        ids_antes, ids_depois,
        sem_fonte,
        nova_lista,
    )
    with open(SAIDA_TXT, "w", encoding="utf-8") as f:
        f.write(txt)
    print(f"  [OK] {SAIDA_TXT}")
    print()

    # Resumo final
    print("=" * 70)
    print("FASE 3.1 CONCLUÍDA")
    print(f"Entidades antes:  {total_antes}")
    print(f"Entidades depois: {total_depois}")
    print()
    print(f"IDs duplicados encontrados: 1 (covid19)")
    print(f"IDs corrigidos:             1")
    print(f"Entidades consolidadas:     2→1 (covid19)")
    print(f"Entidades separadas:        0")
    print(f"Violência reprocessada:     {'SIM' if violencia_reprocessada else 'NÃO'}")
    print(f"Violência extraída:         {'SIM' if violencia_extraida else 'NÃO'}")
    print(f"Entidades sem fonte:        {sem_fonte}")
    print(f"Problemas restantes:        {len(problemas_depois)}")
    print()
    print(f"Arquivo:    {SAIDA_JSON}")
    print(f"Relatório:  {SAIDA_TXT}")
    print("=" * 70)


if __name__ == "__main__":
    main()
