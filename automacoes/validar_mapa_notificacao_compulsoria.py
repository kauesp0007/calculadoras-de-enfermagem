#!/usr/bin/env python3
"""
FASE 1.1 — VALIDAÇÃO SEMÂNTICA DO MAPA DE AGRAVOS-BASE

Analisa o mapa estrutural gerado na FASE 1 e valida cada agrupamento
segundo critérios semânticos (CONFIRMADO, CONFIRMADO_COM_RESSALVA, REVISÃO_MANUAL).

NÃO acessa o SINAN. NÃO extrai dados epidemiológicos.
"""

import os
import json
from datetime import datetime

# ── Config ──────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUTOMACOES_DIR = os.path.join(BASE_DIR, "automacoes")
MAPA_JSON = os.path.join(AUTOMACOES_DIR, "mapa_notificacao_compulsoria.json")
VALIDACAO_TXT = os.path.join(AUTOMACOES_DIR, "validacao_mapa_notificacao_compulsoria.txt")
VALIDACAO_JSON = os.path.join(AUTOMACOES_DIR, "validacao_mapa_notificacao_compulsoria.json")


# ── Regras de Validação Semântica ──────────────────────
# Cada entrada: (id_agravo, classificacao, justificativa)
VALIDACOES = {
    "drt": (
        "CONFIRMADO_COM_RESSALVA",
        "Agrupamento correto como categoria estrutural 'Doenças Relacionadas ao Trabalho'. "
        "Ressalva: são patologias distintas (câncer, dermatoses, LER/DORT, PAIR, transtornos mentais, "
        "distúrbios de voz) que compartilham o vínculo ocupacional como fator comum de notificação. "
        "Na biblioteca final, cada uma deverá preservar suas informações epidemiológicas específicas. "
        "O agravo-base atua como categoria organizadora, não como doença única."
    ),
    "zika": (
        "CONFIRMADO",
        "Todas as 4 entradas referem-se ao mesmo agente etiológico: vírus Zika (Flaviviridae). "
        "As variações representam diferentes formas de notificação: caso agudo, caso em gestante "
        "(risco de transmissão vertical), óbito e síndrome congênita. Agrupamento correto."
    ),
    "hiv": (
        "CONFIRMADO",
        "Agrupamento validado pela referência estrutural (lista-de-doencas-de-notificacao-compulsoria.html). "
        "As 3 entradas representam formas distintas de notificação do mesmo agravo-base HIV: "
        "infecção HIV, HIV/AIDS (síndrome) e HIV em gestantes (transmissão vertical). "
        "Este é o exemplo canônico de 'agravo-base com múltiplas entradas de notificação'."
    ),
    "chikungunya": (
        "CONFIRMADO",
        "As 2 entradas referem-se ao mesmo vírus Chikungunya (Togaviridae). "
        "A diferenciação é por situação epidemiológica: áreas sem transmissão/óbito (notificação imediata) "
        "e casos em áreas endêmicas (notificação semanal). Agrupamento correto."
    ),
    "dengue": (
        "CONFIRMADO",
        "As 2 entradas referem-se ao mesmo agravo: dengue (vírus DENV 1-4). "
        "A diferenciação é por desfecho/gravidade: óbitos (notificação imediata) e casos (notificação semanal). "
        "Agrupamento correto."
    ),
    "chagas": (
        "CONFIRMADO_COM_RESSALVA",
        "Agrupamento correto como 'Doença de Chagas' (Trypanosoma cruzi). "
        "Ressalva: as formas aguda e crônica possuem manifestações clínicas, períodos de incubação "
        "e abordagens terapêuticas distintas. Na biblioteca final, as informações epidemiológicas "
        "de cada forma deverão ser preservadas separadamente."
    ),
    "exantematicas": (
        "CONFIRMADO_COM_RESSALVA",
        "Agrupamento estrutural correto como 'Doenças Exantemáticas'. "
        "Ressalva importante: sarampo (Paramyxoviridae) e rubéola (Togaviridae) são vírus diferentes, "
        "com vacinas, períodos de incubação e complicações distintas. A rubéola congênita é uma "
        "complicação específica da rubéola na gestação. Na biblioteca final, cada doença deverá "
        "ter suas informações epidemiológicas individualizadas, com a síndrome congênita vinculada "
        "especificamente à rubéola."
    ),
    "hepatites": (
        "CONFIRMADO_COM_RESSALVA",
        "Agrupamento correto como categoria 'Hepatites Virais'. "
        "Ressalva: os vírus A, B, C, D e E possuem formas de transmissão, períodos de incubação, "
        "prevenção (vacinas para A e B) e tratamento completamente diferentes. "
        "A entrada 'hepatite B em gestante' é uma variação de notificação específica da hepatite B. "
        "Na biblioteca final, as informações deverão ser organizadas por tipo viral."
    ),
    "htlv": (
        "CONFIRMADO",
        "As 2 entradas referem-se ao mesmo agente: HTLV-1/2 (retrovírus). "
        "A diferenciação é por população: caso geral e gestante (risco de transmissão vertical). "
        "Agrupamento correto, análogo ao padrão HIV."
    ),
    "leishmaniose": (
        "CONFIRMADO_COM_RESSALVA",
        "Agrupamento correto como gênero 'Leishmaniose' (Leishmania spp.). "
        "Ressalva: as formas tegumentar e visceral são causadas por espécies diferentes de Leishmania, "
        "com vetores, reservatórios, manifestações clínicas e tratamento distintos. "
        "Na biblioteca final, cada forma deverá preservar suas informações específicas."
    ),
    "malaria": (
        "CONFIRMADO",
        "As 2 entradas referem-se à mesma doença: malária (Plasmodium spp.). "
        "A diferenciação é geográfica/epidemiológica: região amazônica (endêmica, notificação semanal) "
        "e extra-Amazônica (risco de reintrodução, notificação imediata). Agrupamento correto."
    ),
    "polio": (
        "REVISÃO_MANUAL",
        "Poliomielite (causada pelo poliovírus selvagem) e Paralisia Flácida Aguda (PFA) são entidades "
        "relacionadas, mas distintas. PFA é uma síndrome de vigilância que capta casos suspeitos de "
        "poliomielite, mas também pode ser causada por outros enterovírus, Guillain-Barré, etc. "
        "A notificação de PFA é o instrumento de vigilância para manter a certificação de erradicação "
        "da polio. Na biblioteca final, pode ser adequado manter o vínculo estrutural, mas com "
        "informações epidemiológicas distintas. Solicito revisão humana."
    ),
    "raiva": (
        "CONFIRMADO_COM_RESSALVA",
        "Agrupamento correto como 'Raiva' (Rhabdoviridae). "
        "Ressalva: 'Acidente por animal potencialmente transmissor da raiva' é um evento de exposição "
        "que demanda profilaxia, não uma doença em si. A 'Raiva humana' é o desfecho clínico. "
        "Na biblioteca final, convém tratar o acidente como 'evento de exposição' vinculado à raiva."
    ),
}


# ── Main ─────────────────────────────────────────────────
def main():
    print("=" * 70)
    print("FASE 1.1 — VALIDAÇÃO SEMÂNTICA DO MAPA")
    print("=" * 70)

    # Carregar mapa
    with open(MAPA_JSON, "r", encoding="utf-8") as f:
        mapa = json.load(f)

    agravos = mapa["agravos_base"]
    agora = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Validar cada agravo
    resultados = []
    for ag in agravos:
        aid = ag["id"]
        if aid in VALIDACOES:
            classificacao, justificativa = VALIDACOES[aid]
        else:
            # Agravos com uma única entrada (sem agrupamento) → CONFIRMADO automaticamente
            classificacao = "CONFIRMADO"
            justificativa = "Agravo/doença/evento-base independente. Entrada única, sem necessidade de agrupamento."

        resultados.append({
            "id": aid,
            "nome_base": ag["nome_base"],
            "entradas": ag["entradas"],
            "classificacao": classificacao,
            "justificativa": justificativa,
        })

    # Contagens
    confirmados = [r for r in resultados if r["classificacao"] == "CONFIRMADO"]
    com_ressalva = [r for r in resultados if r["classificacao"] == "CONFIRMADO_COM_RESSALVA"]
    revisao = [r for r in resultados if r["classificacao"] == "REVISÃO_MANUAL"]

    # ── TXT ──
    linhas = []
    linhas.append("=" * 70)
    linhas.append("VALIDAÇÃO SEMÂNTICA DO MAPA DE AGRAVOS-BASE")
    linhas.append(f"Data: {agora}")
    linhas.append("")
    linhas.append(f"Total de agravos-base analisados: {len(resultados)}")
    linhas.append("")

    # Apenas os agrupamentos (múltiplas entradas) em detalhe
    multiplas = [r for r in resultados if len(r["entradas"]) > 1]
    unicas = [r for r in resultados if len(r["entradas"]) == 1]

    linhas.append("-" * 70)
    linhas.append(f"AGRUPAMENTOS COM MÚLTIPLAS ENTRADAS ({len(multiplas)})")
    linhas.append("")

    for r in multiplas:
        linhas.append(f"AGRAVO-BASE: {r['nome_base']}  [{r['id']}]")
        linhas.append(f"Entradas: {len(r['entradas'])}")
        for i, e in enumerate(r["entradas"], 1):
            linhas.append(f"  {i}. {e['nome_original_html']}")
        linhas.append(f"CLASSIFICAÇÃO: {r['classificacao']}")
        linhas.append(f"JUSTIFICATIVA: {r['justificativa']}")
        linhas.append("")

    # Agravos independentes (apenas resumo)
    linhas.append("-" * 70)
    linhas.append(f"AGRAVOS INDEPENDENTES (entrada única): {len(unicas)}")
    linhas.append("(Todos classificados como CONFIRMADO — agravo/doença/evento-base independente)")
    linhas.append("")

    # Resumo
    linhas.append("=" * 70)
    linhas.append("RESUMO DA VALIDAÇÃO")
    linhas.append(f"Agravos-base analisados:  {len(resultados)}")
    linhas.append(f"  - Com múltiplas entradas: {len(multiplas)}")
    linhas.append(f"  - Entrada única:          {len(unicas)}")
    linhas.append("")
    linhas.append(f"CONFIRMADOS:               {len(confirmados)}")
    linhas.append(f"CONFIRMADOS COM RESSALVA:  {len(com_ressalva)}")
    linhas.append(f"REVISÃO MANUAL:            {len(revisao)}")
    linhas.append("")
    linhas.append(f"Entradas totais no HTML:   73")
    linhas.append("=" * 70)

    with open(VALIDACAO_TXT, "w", encoding="utf-8") as f:
        f.write("\n".join(linhas))

    # ── JSON ──
    json_out = {
        "metadata": {
            "data_validacao": agora,
            "fonte_mapa": os.path.basename(MAPA_JSON),
            "total_agravos_analisados": len(resultados),
        },
        "resumo": {
            "confirmados": len(confirmados),
            "confirmados_com_ressalva": len(com_ressalva),
            "revisao_manual": len(revisao),
        },
        "validacoes": []
    }

    for r in resultados:
        entries = []
        for e in r["entradas"]:
            entries.append({
                "nome_original_html": e["nome_original_html"],
                "classificacao_periodicidade": e.get("classificacao", ""),
            })
        json_out["validacoes"].append({
            "id": r["id"],
            "nome_base": r["nome_base"],
            "quantidade_entradas": len(r["entradas"]),
            "classificacao_validacao": r["classificacao"],
            "justificativa": r["justificativa"],
            "entradas": entries,
        })

    with open(VALIDACAO_JSON, "w", encoding="utf-8") as f:
        json.dump(json_out, f, ensure_ascii=False, indent=2)

    # ── Terminal ──
    print(f"\n  Agravos analisados: {len(resultados)}")
    print(f"  Agrupamentos (múltiplas entradas): {len(multiplas)}")
    print(f"  Independentes (entrada única): {len(unicas)}")
    print(f"\n  CONFIRMADOS:              {len(confirmados)}")
    print(f"  CONFIRMADOS COM RESSALVA: {len(com_ressalva)}")
    print(f"  REVISÃO MANUAL:           {len(revisao)}")
    print(f"\n  [OK] {VALIDACAO_TXT}")
    print(f"  [OK] {VALIDACAO_JSON}")
    print("=" * 70)


if __name__ == "__main__":
    main()
