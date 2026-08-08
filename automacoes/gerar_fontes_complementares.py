#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FASE 3.2 — GERAÇÃO DO JSON E RELATÓRIO DE FONTES COMPLEMENTARES
=================================================================
Gera os arquivos de saída com as fontes complementares encontradas
para as 12 entidades sem fonte no JSON validado.

Saída:
- automacoes/correspondencias_fontes_complementares.json
- automacoes/relatorio_fontes_complementares.txt
"""

import json
import os
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SAIDA_JSON = os.path.join(BASE_DIR, "correspondencias_fontes_complementares.json")
SAIDA_TXT = os.path.join(BASE_DIR, "relatorio_fontes_complementares.txt")

# ============================================================
# FONTES COMPLEMENTARES ENCONTRADAS
# Pesquisa em: gov.br/saude (Ministério da Saúde)
# Data: 2026-08-08
# ============================================================

FONTES = [
    # === DOENÇAS RELACIONADAS AO TRABALHO ===
    {
        "id": "drt",
        "nome": "Distúrbio de voz relacionado ao trabalho",
        "fonte_complementar": {
            "status": "CONFIRMADA_CATEGORIA",
            "instituicao": "Ministério da Saúde — SVSA — Saúde do Trabalhador",
            "titulo": "Vigilância em Saúde do Trabalhador (VISAT) — Doenças e Agravos Relacionados ao Trabalho",
            "url": "https://www.gov.br/saude/pt-br/composicao/svsa/saude-do-trabalhador/vigilancia-em-saude-do-trabalhador-vigisat",
            "tipo_correspondencia": "CONFIRMADA_CATEGORIA",
            "confianca": "BAIXA",
            "justificativa": (
                "A página VISAT lista as doenças e agravos relacionados ao trabalho, incluindo "
                "distúrbios de voz. Não há página individual específica para distúrbio de voz. "
                "A página geral de Saúde do Trabalhador serve como fonte de categoria."
            ),
        }
    },
    {
        "id": "drt",
        "nome": "Perda Auditiva relacionada ao trabalho (PAIR)",
        "fonte_complementar": {
            "status": "CONFIRMADA_DIRETA",
            "instituicao": "Ministério da Saúde — SVSA — Saúde do Trabalhador",
            "titulo": "Perda Auditiva Induzida por Ruído (PAIR)",
            "url": "https://www.gov.br/saude/pt-br/composicao/svsa/saude-do-trabalhador/vigilancia-em-saude-do-trabalhador-vigisat/doencas-e-agravos-relacionados-ao-trabalho/perda-auditiva-induzida-por-ruido-pair",
            "tipo_correspondencia": "CONFIRMADA_DIRETA",
            "confianca": "ALTA",
            "justificativa": (
                "Página específica sobre PAIR no site do Ministério da Saúde, "
                "dentro da seção de Vigilância em Saúde do Trabalhador (VISAT). "
                "Correspondência exata com a entidade epidemiológica."
            ),
        }
    },
    {
        "id": "drt",
        "nome": "Transtornos mentais relacionados ao trabalho",
        "fonte_complementar": {
            "status": "CONFIRMADA_CATEGORIA",
            "instituicao": "Ministério da Saúde — SVSA — Saúde do Trabalhador",
            "titulo": "Vigilância em Saúde do Trabalhador (VISAT) — Doenças e Agravos Relacionados ao Trabalho",
            "url": "https://www.gov.br/saude/pt-br/composicao/svsa/saude-do-trabalhador/vigilancia-em-saude-do-trabalhador-vigisat",
            "tipo_correspondencia": "CONFIRMADA_CATEGORIA",
            "confianca": "MEDIA",
            "justificativa": (
                "A página VISAT menciona explicitamente 'transtornos mentais relacionados ao trabalho' "
                "na lista de doenças e agravos de notificação compulsória. "
                "A página geral serve como fonte de categoria. Não há página individual específica."
            ),
        }
    },
    {
        "id": "pneumoconioses",
        "nome": "Pneumoconioses relacionadas ao trabalho",
        "fonte_complementar": {
            "status": "CONFIRMADA_CATEGORIA",
            "instituicao": "Ministério da Saúde — SVSA — Saúde do Trabalhador",
            "titulo": "Vigilância em Saúde do Trabalhador (VISAT) — Doenças e Agravos Relacionados ao Trabalho",
            "url": "https://www.gov.br/saude/pt-br/composicao/svsa/saude-do-trabalhador/vigilancia-em-saude-do-trabalhador-vigisat",
            "tipo_correspondencia": "CONFIRMADA_CATEGORIA",
            "confianca": "MEDIA",
            "justificativa": (
                "A página VISAT menciona explicitamente 'pneumoconioses' na lista de doenças "
                "e agravos de notificação compulsória relacionados ao trabalho. "
                "A página geral serve como fonte de categoria."
            ),
        }
    },

    # === HTLV ===
    {
        "id": "htlv",
        "nome": "HTLV-1/2",
        "fonte_complementar": {
            "status": "CONFIRMADA_DIRETA",
            "instituicao": "Ministério da Saúde",
            "titulo": "HTLV — Saúde de A a Z",
            "url": "https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/h/htlv",
            "tipo_correspondencia": "CONFIRMADA_DIRETA",
            "confianca": "ALTA",
            "justificativa": (
                "Página oficial do Ministério da Saúde no glossário Saúde de A a Z. "
                "Contém: descrição, transmissão (vertical, sexual, sanguínea), sinais e sintomas "
                "(ATLL, HAM), diagnóstico, tratamento, prevenção e boletim epidemiológico. "
                "Fonte completa e específica sobre HTLV-1/2."
            ),
        }
    },

    # === ANOMALIAS CONGÊNITAS ===
    {
        "id": "anomalias_congenitas",
        "nome": "Anomalias congênitas",
        "fonte_complementar": {
            "status": "CONFIRMADA_DIRETA",
            "instituicao": "Ministério da Saúde",
            "titulo": "Anomalias Congênitas — Saúde de A a Z",
            "url": "https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/a/anomalias-congenitas",
            "tipo_correspondencia": "CONFIRMADA_DIRETA",
            "confianca": "ALTA",
            "justificativa": (
                "Página oficial do Ministério da Saúde no glossário Saúde de A a Z. "
                "Contém: descrição, principais tipos, causas e fatores de risco, prevenção, "
                "diagnóstico, tratamento e acompanhamento, atendimento no SUS, "
                "vigilância em saúde (Sinasc, SIM, SIH, Sinan). Fonte completa e abrangente."
            ),
        }
    },

    # === DOENÇA FALCIFORME ===
    {
        "id": "doenca_falciforme",
        "nome": "Doença Falciforme",
        "fonte_complementar": {
            "status": "CONFIRMADA_DIRETA",
            "instituicao": "Ministério da Saúde",
            "titulo": "Doença Falciforme — Saúde de A a Z",
            "url": "https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/d/doenca-falciforme",
            "tipo_correspondencia": "CONFIRMADA_DIRETA",
            "confianca": "ALTA",
            "justificativa": (
                "Página oficial do Ministério da Saúde no glossário Saúde de A a Z. "
                "Contém: descrição (doença genética hereditária, mutação HbS), diagnóstico "
                "(triagem neonatal, eletroforese de hemoglobina), manifestações clínicas, "
                "dados epidemiológicos no Brasil (1.087 casos/ano, 3,75/10.000 NV, "
                "60-100 mil pacientes estimados). Fonte específica e completa."
            ),
        }
    },

    # === MONKEYPOX / MPOX ===
    {
        "id": "monkeypox",
        "nome": "Monkeypox (Mpox)",
        "fonte_complementar": {
            "status": "CONFIRMADA_DIRETA",
            "instituicao": "Ministério da Saúde",
            "titulo": "Mpox — Saúde de A a Z",
            "url": "https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/m/mpox",
            "tipo_correspondencia": "CONFIRMADA_DIRETA",
            "confianca": "ALTA",
            "justificativa": (
                "Página oficial do Ministério da Saúde no glossário Saúde de A a Z. "
                "Contém: descrição (doença infecciosa por MPXV, zoonótica), transmissão "
                "(contato direto com lesões, secreções, objetos contaminados), sinais e sintomas "
                "(incubação 3-16 dias, lesões cutâneas, linfonodos, febre), diagnóstico "
                "(PCR de secreção), tratamento (suporte), prevenção, vacinação. "
                "Nota: o Ministério da Saúde utiliza a nomenclatura 'Mpox'."
            ),
        }
    },

    # === EVENTOS ADVERSOS PÓS-VACINAÇÃO ===
    {
        "id": "eventos_adversos",
        "nome": "Eventos adversos graves ou óbitos pós-vaccinação",
        "fonte_complementar": {
            "status": "CONFIRMADA_DIRETA",
            "instituicao": "Ministério da Saúde — PNI",
            "titulo": "Segurança das Vacinas — ESAVI (Eventos Supostamente Atribuíveis à Vacinação ou Imunização)",
            "url": "https://www.gov.br/saude/pt-br/vacinacao/esavi",
            "tipo_correspondencia": "CONFIRMADA_DIRETA",
            "confianca": "ALTA",
            "justificativa": (
                "Página oficial do Programa Nacional de Imunizações sobre segurança de vacinas. "
                "Contém: definição de ESAVI, classificação (esperados/inesperados, EAG/EANG/Erro de Imunização), "
                "critérios de evento adverso grave (hospitalização, risco à vida, incapacidade, "
                "anomalia congênita, óbito), notificação (e-SUS Notifica, em até 24h para graves), "
                "investigação (em até 48h), sistemas (VigiMed para cidadãos). "
                "Fonte oficial específica sobre vigilância de eventos adversos pós-vacinação."
            ),
        }
    },

    # === ESP ===
    {
        "id": "esp",
        "nome": "Evento de Saúde Pública (ESP)",
        "fonte_complementar": {
            "status": "CONFIRMADA_CATEGORIA",
            "instituicao": "Ministério da Saúde — SVSA — CIEVS",
            "titulo": "Centro de Informações Estratégicas em Vigilância em Saúde (CIEVS)",
            "url": "https://www.gov.br/saude/pt-br/composicao/svsa/cievs",
            "tipo_correspondencia": "CONFIRMADA_CATEGORIA",
            "confianca": "MEDIA",
            "justificativa": (
                "ESP é um conceito de vigilância definido no Regulamento Sanitário Internacional (RSI). "
                "O CIEVS é o órgão do Ministério da Saúde responsável pela detecção, monitoramento e "
                "resposta a ESP. A página do CIEVS contextualiza o conceito. "
                "Campos como 'agente_causador' e 'período_de_incubação' NÃO se aplicam a ESP."
            ),
        }
    },

    # === DISSEMINAÇÃO INTENCIONAL ===
    {
        "id": "disseminacao_intencional",
        "nome": "Doenças com Suspeita de Disseminação Intencional",
        "fonte_complementar": {
            "status": "REVISÃO_MANUAL",
            "instituicao": None,
            "titulo": None,
            "url": None,
            "tipo_correspondencia": "REVISÃO_MANUAL",
            "confianca": "N/A",
            "justificativa": (
                "Categoria de vigilância relacionada a bioterrorismo (Antraz pneumônico, Tularemia, Varíola). "
                "Não foi localizada página oficial específica do Ministério da Saúde que descreva esta "
                "categoria como entidade única. Trata-se de um conceito de vigilância e não de uma doença. "
                "Recomenda-se manter sem fonte ou referenciar documentos do RSI/OMS."
            ),
        }
    },

    # === ÓBITO INFANTIL E MATERNO ===
    {
        "id": "obito",
        "nome": "Óbito (Infantil e Materno)",
        "fonte_complementar": {
            "status": "CONFIRMADA_CATEGORIA",
            "instituicao": "Ministério da Saúde — SVSA",
            "titulo": "Vigilância do Óbito Materno, Infantil e Fetal",
            "url": "https://www.gov.br/saude/pt-br/composicao/svsa/vigilancia-de-doencas-cronicas-nao-transmissiveis/vigilancia-do-obito-materno-infantil-e-fetal",
            "tipo_correspondencia": "CONFIRMADA_CATEGORIA",
            "confianca": "MEDIA",
            "justificativa": (
                "Óbito infantil e materno são eventos/desfechos de vigilância, monitorados pelo SIM "
                "(Sistema de Informação sobre Mortalidade). A página de Vigilância do Óbito do MS "
                "contextualiza esses eventos. Campos como 'agente_causador' e 'incubação' NÃO se aplicam. "
                "A entidade deve ser tratada como evento de vigilância, não como doença."
            ),
        }
    },
]


# ============================================================
# GERAÇÃO DOS ARQUIVOS
# ============================================================

def gerar_json():
    output = {
        "metadata": {
            "fase": "FASE 3.2",
            "descricao": "Fontes oficiais complementares para entidades sem SINAN nem CVE-SP",
            "total_entidades_analisadas": len(FONTES),
            "data_consulta": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "fonte_primaria": "Ministério da Saúde — gov.br/saude",
            "inconsistencia_11_12": {
                "relatorio_fase_3_1": "Reportou 11 entidades sem fonte",
                "json_validado": "12 entidades sem dados SINAN e sem dados CVE-SP",
                "causa": "O relatório textual listou 12 nomes mas declarou contagem 11 (erro de contagem)",
                "resolucao": "Confirmadas 12 entidades sem fonte no JSON validado",
                "status": "RESOLVIDA — 12 entidades reais"
            }
        },
        "entidades": FONTES,
    }

    with open(SAIDA_JSON, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print(f"  [OK] {SAIDA_JSON}")


def gerar_relatorio():
    linhas = []
    linhas.append("=" * 70)
    linhas.append("FASE 3.2 — RELATÓRIO DE FONTES COMPLEMENTARES")
    linhas.append(f"Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    linhas.append("=" * 70)
    linhas.append("")

    # Inconsistência
    linhas.append("-" * 70)
    linhas.append("INCONSISTÊNCIA 11 × 12 — RESOLVIDA")
    linhas.append("-" * 70)
    linhas.append("")
    linhas.append("O relatório da FASE 3.1 declarou 'Sem fonte: 11' mas listou 12 nomes.")
    linhas.append("")
    linhas.append("CAUSA: Erro de contagem no relatório textual. O JSON validado contém")
    linhas.append("exatamente 12 entidades sem dados SINAN e sem dados CVE-SP.")
    linhas.append("")
    linhas.append("CONFIRMAÇÃO (via auditoria do JSON):")
    linhas.append("  Entidades sem SINAN e sem CVE-SP no JSON validado: 12")
    linhas.append("")
    linhas.append("STATUS: RESOLVIDA. São 12 entidades reais sem fonte, não 11.")
    linhas.append("")

    # Resumo
    confirmadas = [f for f in FONTES if f["fonte_complementar"]["tipo_correspondencia"] == "CONFIRMADA_DIRETA"]
    categorias = [f for f in FONTES if f["fonte_complementar"]["tipo_correspondencia"] == "CONFIRMADA_CATEGORIA"]
    revisao = [f for f in FONTES if f["fonte_complementar"]["tipo_correspondencia"] == "REVISÃO_MANUAL"]

    linhas.append("=" * 70)
    linhas.append("RESUMO")
    linhas.append("=" * 70)
    linhas.append(f"Entidades realmente sem fonte: 12")
    linhas.append(f"Fontes encontradas:              {len(confirmadas) + len(categorias)}")
    linhas.append(f"  CONFIRMADA_DIRETA:             {len(confirmadas)}")
    linhas.append(f"  CONFIRMADA_CATEGORIA:          {len(categorias)}")
    linhas.append(f"  REVISÃO_MANUAL:                {len(revisao)}")
    linhas.append(f"Sem fonte após pesquisa:         {len(revisao)}")
    linhas.append("")
    linhas.append(f"Instituição principal: Ministério da Saúde (gov.br/saude)")
    linhas.append(f"Fontes utilizadas: Saúde de A a Z, VISAT, PNI/ESAVI, CIEVS, SVSA")
    linhas.append("")

    # Detalhamento
    linhas.append("=" * 70)
    linhas.append("DETALHAMENTO POR ENTIDADE")
    linhas.append("=" * 70)

    for i, f in enumerate(FONTES):
        fc = f["fonte_complementar"]
        linhas.append("")
        linhas.append(f"--- {i+1:2d}. {f['nome']} ---")
        linhas.append(f"  ID: {f['id']}")
        linhas.append(f"  FONTE: {fc['titulo'] or '—'}")
        linhas.append(f"  INSTITUIÇÃO: {fc['instituicao'] or '—'}")
        linhas.append(f"  URL: {fc['url'] or '—'}")
        linhas.append(f"  TIPO: {fc['tipo_correspondencia']}")
        linhas.append(f"  CONFIANÇA: {fc['confianca']}")
        linhas.append(f"  JUSTIFICATIVA: {fc['justificativa']}")

    linhas.append("")
    linhas.append("=" * 70)
    linhas.append("ESTATÍSTICAS FINAIS")
    linhas.append("=" * 70)

    # Por categoria
    linhas.append("")
    linhas.append("CONFIRMADA_DIRETA (6):")
    for f in confirmadas:
        linhas.append(f"  ✅ {f['nome']} → {f['fonte_complementar']['url']}")

    linhas.append("")
    linhas.append("CONFIRMADA_CATEGORIA (5):")
    for f in categorias:
        linhas.append(f"  📋 {f['nome']} → {f['fonte_complementar']['url']}")

    linhas.append("")
    linhas.append("REVISÃO_MANUAL (1):")
    for f in revisao:
        linhas.append(f"  ❓ {f['nome']} — sem fonte oficial localizada")

    linhas.append("")
    linhas.append("=" * 70)
    linhas.append("FASE 3.2 CONCLUÍDA")
    linhas.append("=" * 70)

    return "\n".join(linhas)


# ============================================================
# MAIN
# ============================================================

def main():
    print("=" * 70)
    print("FASE 3.2 — GERAÇÃO DE FONTES COMPLEMENTARES")
    print("=" * 70)
    print()

    confirmadas = [f for f in FONTES if f["fonte_complementar"]["tipo_correspondencia"] == "CONFIRMADA_DIRETA"]
    categorias = [f for f in FONTES if f["fonte_complementar"]["tipo_correspondencia"] == "CONFIRMADA_CATEGORIA"]
    revisao = [f for f in FONTES if f["fonte_complementar"]["tipo_correspondencia"] == "REVISÃO_MANUAL"]

    print(f"Entidades analisadas: {len(FONTES)}")
    print(f"  CONFIRMADA_DIRETA:    {len(confirmadas)}")
    print(f"  CONFIRMADA_CATEGORIA: {len(categorias)}")
    print(f"  REVISÃO_MANUAL:       {len(revisao)}")
    print()

    gerar_json()
    txt = gerar_relatorio()
    with open(SAIDA_TXT, "w", encoding="utf-8") as f:
        f.write(txt)
    print(f"  [OK] {SAIDA_TXT}")
    print()

    print("=" * 70)
    print("FASE 3.2 CONCLUÍDA")
    print(f"Entidades realmente sem fonte: 12")
    print(f"Fontes complementares encontradas: {len(confirmadas) + len(categorias)}")
    print(f"Sem fonte após pesquisa: {len(revisao)}")
    print(f"Revisão manual: {len(revisao)}")
    print()
    print("Inconsistência 11 × 12:")
    print("  RESOLVIDA — São 12 entidades reais no JSON validado")
    print()
    print(f"Arquivos:")
    print(f"  {SAIDA_JSON}")
    print(f"  {SAIDA_TXT}")
    print("=" * 70)


if __name__ == "__main__":
    main()
