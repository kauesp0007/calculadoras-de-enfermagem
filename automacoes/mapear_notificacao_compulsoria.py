#!/usr/bin/env python3
"""
FASE 1 — MAPEAMENTO ESTRUTURAL DA LISTA DE NOTIFICAÇÃO COMPULSÓRIA

Analisa notificacao-compulsoria.html e identifica:
- Agravos-base (doença/agravo/evento principal)
- Variações de notificação (formas específicas do mesmo agravo)
- Subtipos, eventos, e itens para revisão manual

Referência estrutural: lista-de-doencas-de-notificacao-compulsoria.html
"""

import os
import re
import json
from datetime import datetime

# ── Config ──────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML_FILE = os.path.join(BASE_DIR, "notificacao-compulsoria.html")
AUTOMACOES_DIR = os.path.join(BASE_DIR, "automacoes")
MAPA_JSON = os.path.join(AUTOMACOES_DIR, "mapa_notificacao_compulsoria.json")
RELATORIO_TXT = os.path.join(AUTOMACOES_DIR, "relatorio_mapa_notificacao_compulsoria.txt")


# ── Extração do HTML ────────────────────────────────────
def extrair_entradas(caminho_html):
    """Extrai todas as entradas do array dadosNotificacao do HTML."""
    with open(caminho_html, "r", encoding="utf-8") as f:
        conteudo = f.read()

    padrao = r'\{\s*nome\s*:\s*"([^"]+)"\s*,'
    nomes_raw = re.findall(padrao, conteudo)

    entradas = []
    for nome in nomes_raw:
        bloco_inicio = conteudo.find(f'nome: "{nome}"')
        bloco = conteudo[bloco_inicio:bloco_inicio + 500]
        class_match = re.search(r'classificacao\s*:\s*"([^"]+)"', bloco)
        classificacao = class_match.group(1) if class_match else "Desconhecida"
        entradas.append({"nome": nome, "classificacao": classificacao})

    # Remove duplicatas preservando ordem
    vistos = set()
    unicas = []
    for e in entradas:
        if e["nome"] not in vistos:
            vistos.add(e["nome"])
            unicas.append(e)
    return unicas


# ── Normalização ────────────────────────────────────────
def normalizar(texto):
    """Normaliza para comparação: lowercase, sem acentos, espaços normalizados."""
    import unicodedata
    if not texto:
        return ""
    t = texto.lower().strip()
    t = unicodedata.normalize('NFKD', t).encode('ascii', 'ignore').decode('ascii')
    t = re.sub(r'\s+', ' ', t)
    t = re.sub(r'[^a-z0-9\s]', '', t)
    return t.strip()


# ── Regras de Agrupamento ──────────────────────────────
def extrair_nucleo(nome):
    """
    Extrai o 'núcleo' do nome removendo sufixos de variação.
    Ex: 'Dengue - Óbitos' → 'dengue'
        'Doença aguda pelo vírus Zika em gestante' → 'doenca aguda pelo virus zika'
    """
    n = normalizar(nome)
    # Remove sufixos de variação comuns
    sufixos = [
        r'\s*[-–]\s*obitos?\s*$',
        r'\s*[-–]\s*casos?\s*$',
        r'\s+em\s+gestante.*$',
        r'\s+em\s+areas?\s+sem\s+transmissao.*$',
        r'\s*[-–]\s*caso\s+grave\s+internado\s+ou\s+obito\s*$',
        r'\s*\(.*?\)\s*$',
    ]
    for suf in sufixos:
        n = re.sub(suf, '', n)
    return n.strip()


# Regras de agrupamento: mapeia palavra-chave → id do agravo-base
RULES = [
    # HIV (exemplo da referência)
    {
        "id": "hiv",
        "nome_base": "HIV / AIDS",
        "padroes": [r'\bhiv\b', r'\baids\b', r'\bimunodeficiencia\b.*\bhumana\b'],
    },
    # DENGUE
    {
        "id": "dengue",
        "nome_base": "Dengue",
        "padroes": [r'\bdengue\b'],
    },
    # ZIKA
    {
        "id": "zika",
        "nome_base": "Zika",
        "padroes": [r'\bzika\b'],
    },
    # CHIKUNGUNYA
    {
        "id": "chikungunya",
        "nome_base": "Chikungunya",
        "padroes": [r'\bchikungunya\b'],
    },
    # MALÁRIA
    {
        "id": "malaria",
        "nome_base": "Malária",
        "padroes": [r'\bmalaria\b'],
    },
    # DOENÇA DE CHAGAS
    {
        "id": "chagas",
        "nome_base": "Doença de Chagas",
        "padroes": [r'\bchagas\b'],
    },
    # HEPATITES
    {
        "id": "hepatites",
        "nome_base": "Hepatites Virais",
        "padroes": [r'\bhepatite\b', r'\bhepatites\b'],
    },
    # HTLV
    {
        "id": "htlv",
        "nome_base": "HTLV",
        "padroes": [r'\bhtlv\b', r'\blinfotropico\b'],
    },
    # COVID-19 / CORONAVÍRUS / SRAG
    {
        "id": "covid19",
        "nome_base": "COVID-19 / Coronavírus",
        "padroes": [r'\bcovid\b', r'\bcoronavirus\b', r'\bsrag\b.*\bcoronavirus\b',
                     r'\bsindrome\s+gripal\b.*\bcovid\b'],
    },
    # SÍNDROMES INFLAMATÓRIAS PÓS-COVID
    {
        "id": "sim_covid",
        "nome_base": "Síndrome Inflamatória Multissistêmica (SIM) pós-COVID-19",
        "padroes": [r'\bsim.a\b', r'\bsim.p\b', r'\binflamatoria\s+multissistemica\b'],
    },
    # RUBÉOLA / SARAMPO / EXANTEMÁTICAS
    {
        "id": "exantematicas",
        "nome_base": "Doenças Exantemáticas (Sarampo e Rubéola)",
        "padroes": [r'\brubeola\b', r'\bsarampo\b', r'\bexantematicas\b'],
    },
    # TÉTANO
    {
        "id": "tetano",
        "nome_base": "Tétano",
        "padroes": [r'\btetano\b'],
    },
    # SÍFILIS
    {
        "id": "sifilis",
        "nome_base": "Sífilis",
        "padroes": [r'\bsifilis\b'],
    },
    # TOXOPLASMOSE
    {
        "id": "toxoplasmose",
        "nome_base": "Toxoplasmose",
        "padroes": [r'\btoxoplasmose\b'],
    },
    # LEISHMANIOSE
    {
        "id": "leishmaniose",
        "nome_base": "Leishmaniose",
        "padroes": [r'\bleishmaniose\b'],
    },
    # FEBRE AMARELA
    {
        "id": "febre_amarela",
        "nome_base": "Febre Amarela",
        "padroes": [r'\bfebre\s+amarela\b'],
    },
    # FEBRE MACULOSA / RIQUETSIOSES
    {
        "id": "febre_maculosa",
        "nome_base": "Febre Maculosa e Riquetisioses",
        "padroes": [r'\bfebre\s+maculosa\b', r'\briquetsiose\b'],
    },
    # FEBRE DO NILO
    {
        "id": "febre_nilo",
        "nome_base": "Febre do Nilo Ocidental e Arboviroses",
        "padroes": [r'\bfebre\s+do\s+nilo\b'],
    },
    # FEBRE TIFOIDE
    {
        "id": "febre_tifoide",
        "nome_base": "Febre Tifoide",
        "padroes": [r'\bfebre\s+tifoide\b'],
    },
    # DOENÇA INVASIVA / MENINGITE (ANTES de Influenza para não capturar Haemophilus)
    {
        "id": "doenca_invasiva",
        "nome_base": "Doença Invasiva / Meningites",
        "padroes": [r'\bdoenca\s+invasiva\b', r'\bmeningococica\b', r'\bmeningite\b',
                     r'\bhaemophilus\b'],
    },
    # INFLUENZA (apenas influenza como doença viral, não Haemophilus)
    {
        "id": "influenza",
        "nome_base": "Influenza",
        "padroes": [r'\binfluenza\s+humana\b', r'\binfluenza\s+produzida\b'],
    },
    # POLIOMIELITE / PARALISIA FLÁCIDA
    {
        "id": "polio",
        "nome_base": "Poliomielite / Paralisia Flácida Aguda",
        "padroes": [r'\bpoliomielite\b', r'\bparalisia\s+flacida\b'],
    },
    # RAIVA
    {
        "id": "raiva",
        "nome_base": "Raiva",
        "padroes": [r'\braiva\b'],
    },
    # ACIDENTE DE TRABALHO
    {
        "id": "acidente_trabalho",
        "nome_base": "Acidente de Trabalho",
        "padroes": [r'\bacidente\s+de\s+trabalho\b'],
    },
    # ACIDENTE POR ANIMAL PEÇONHENTO
    {
        "id": "animal_peconhento",
        "nome_base": "Acidente por Animal Peçonhento",
        "padroes": [r'\banimal\s+peconhento\b'],
    },
    # ACIDENTE POR ANIMAL TRANSMISSOR DA RAIVA
    {
        "id": "animal_raiva",
        "nome_base": "Acidente por Animal Transmissor da Raiva",
        "padroes": [r'\banimal\s+potencialmente\s+transmissor\b'],
    },
    # DOENÇAS RELACIONADAS AO TRABALHO (DRT)
    {
        "id": "drt",
        "nome_base": "Doenças Relacionadas ao Trabalho",
        "padroes": [
            r'\brelacionado[s]?\s+ao\s+trabalho\b',
            r'\bocupacionais\b',
            r'\bdisturbio\s+de\s+voz\b',
            r'\bler\b.*\bdort\b',
            r'\bperda\s+auditiva\b',
            r'\bpneumoconiose\b',
            r'\btranstornos?\s+mentais?\b.*\btrabalho\b',
        ],
    },
    # VIOLÊNCIA
    {
        "id": "violencia",
        "nome_base": "Violência",
        "padroes": [r'\bviolencia\b'],
    },
    # VARICELA (ANTES de Óbito para não capturar "óbito" no nome)
    {
        "id": "varicela",
        "nome_base": "Varicela",
        "padroes": [r'\bvaricela\b'],
    },
    # ÓBITO (apenas óbito infantil/materno; não captura eventos adversos)
    {
        "id": "obito",
        "nome_base": "Óbito (Infantil e Materno)",
        "padroes": [r'\bobito\s*\(\s*infantil\b', r'\bobito\s*\(\s*materno\b'],
    },
    # CÂNCER
    {
        "id": "cancer",
        "nome_base": "Câncer Relacionado ao Trabalho",
        "padroes": [r'\bcancer\b'],
    },
    # DOENÇA INVASIVA / MENINGITE
    {
        "id": "doenca_invasiva",
        "nome_base": "Doença Invasiva / Meningites",
        "padroes": [r'\bdoenca\s+invasiva\b', r'\bmeningococica\b', r'\bmeningite\b'],
    },
    # DISSEMINAÇÃO INTENCIONAL (sem variola para não capturar monkeypox)
    {
        "id": "disseminacao_intencional",
        "nome_base": "Doenças com Suspeita de Disseminação Intencional",
        "padroes": [r'\bdisseminacao\s+intencional\b', r'\bantraz\b', r'\btularemia\b'],
    },
    # FEBRES HEMORRÁGICAS
    {
        "id": "febres_hemorragicas",
        "nome_base": "Febres Hemorrágicas Emergentes/Reemergentes",
        "padroes": [r'\bfebres?\s+hemorragicas?\b', r'\bebola\b', r'\bmarburg\b', r'\blassa\b', r'\barenavirus\b'],
    },
    # EVENTO DE SAÚDE PÚBLICA
    {
        "id": "esp",
        "nome_base": "Evento de Saúde Pública (ESP)",
        "padroes": [r'\bevento\s+de\s+saude\s+publica\b.*\bameaca\b'],
    },
    # EVENTOS ADVERSOS PÓS-VACINAÇÃO
    {
        "id": "evento_vacina",
        "nome_base": "Eventos Adversos Pós-Vacinação",
        "padroes": [r'\beventos?\s+adversos?\b.*\bvacin\b', r'\bpos.vacinacao\b'],
    },
    # MONKEYPOX / MPOX
    {
        "id": "monkeypox",
        "nome_base": "Monkeypox (Mpox)",
        "padroes": [r'\bmonkeypox\b', r'\bmpox\b'],
    },
]


def classificar_entrada(nome):
    """
    Classifica uma entrada: retorna (agravo_base_id, tipo, razao).
    tipo pode ser: AGRAVO_BASE, VARIACAO_NOTIFICACAO, SUBTIPO, EVENTO, REVISAO_MANUAL
    """
    n = normalizar(nome)

    # Verifica cada regra
    for rule in RULES:
        for padrao in rule["padroes"]:
            if re.search(padrao, n):
                # Encontrou correspondência. Agora determina o tipo.
                if rule["id"] == "drt":
                    return (rule["id"], "VARIACAO_NOTIFICACAO",
                            f"Agrupado em '{rule['nome_base']}' (padrão: {padrao})")
                elif rule["id"] == "hiv":
                    return (rule["id"], "VARIACAO_NOTIFICACAO",
                            f"Agrupado em '{rule['nome_base']}' (padrão: {padrao})")
                elif rule["id"] == "violencia":
                    return (rule["id"], "VARIACAO_NOTIFICACAO",
                            f"Agrupado em '{rule['nome_base']}' (padrão: {padrao})")
                elif rule["id"] == "obito":
                    return (rule["id"], "VARIACAO_NOTIFICACAO",
                            f"Agrupado em '{rule['nome_base']}' (padrão: {padrao})")
                elif rule["id"] in ("disseminacao_intencional", "febres_hemorragicas"):
                    return (rule["id"], "SUBTIPO",
                            f"Agrupado em '{rule['nome_base']}' (padrão: {padrao})")
                elif rule["id"] in ("sim_covid", "exantematicas", "dengue", "zika",
                                     "chikungunya", "malaria", "chagas", "hepatites",
                                     "htlv", "covid19", "tetano", "sifilis",
                                     "toxoplasmose", "leishmaniose", "polio",
                                     "raiva", "doenca_invasiva", "varicela", "cancer",
                                     "febre_amarela", "febre_maculosa", "febre_nilo",
                                     "febre_tifoide", "influenza",
                                     "acidente_trabalho", "animal_peconhento",
                                     "animal_raiva"):
                    return (rule["id"], "VARIACAO_NOTIFICACAO",
                            f"Agrupado em '{rule['nome_base']}' (padrão: {padrao})")
                elif rule["id"] in ("esp", "evento_vacina", "monkeypox"):
                    return (rule["id"], "EVENTO",
                            f"Classificado como EVENTO '{rule['nome_base']}'")
                else:
                    return (rule["id"], "VARIACAO_NOTIFICACAO",
                            f"Agrupado em '{rule['nome_base']}'")

    # Itens que não casaram com nenhuma regra → são agravos-base individuais
    return (None, "AGRAVO_BASE", "Agravo/doença/evento independente")


# ── Construção do Mapa ─────────────────────────────────
def construir_mapa(entradas):
    """Constrói o mapa estrutural agrupando entradas por agravo-base."""

    # Primeira passagem: classificar cada entrada
    classificadas = []
    for entrada in entradas:
        agravo_id, tipo, razao = classificar_entrada(entrada["nome"])
        classificadas.append({
            "nome_original": entrada["nome"],
            "classificacao": entrada["classificacao"],
            "agravo_base_id": agravo_id,
            "tipo": tipo,
            "razao": razao,
        })

    # Agrupar por agravo_base_id
    agravos_base = []
    independentes = []
    agrupados = {}

    for c in classificadas:
        if c["agravo_base_id"] is None:
            # Agravo independente (base própria)
            independentes.append({
                "id": normalizar(c["nome_original"]).replace(" ", "_")[:40],
                "nome_base": c["nome_original"],
                "tipo_entrada": c["tipo"],
                "entradas": [{
                    "nome_original": c["nome_original"],
                    "classificacao": c["classificacao"],
                    "tipo": c["tipo"],
                    "razao": c["razao"],
                }],
            })
        else:
            aid = c["agravo_base_id"]
            if aid not in agrupados:
                # Encontra o nome_base da regra
                nome_base = c["nome_original"]
                for rule in RULES:
                    if rule["id"] == aid:
                        nome_base = rule["nome_base"]
                        break
                agrupados[aid] = {
                    "id": aid,
                    "nome_base": nome_base,
                    "entradas": [],
                }
            agrupados[aid]["entradas"].append({
                "nome_original": c["nome_original"],
                "classificacao": c["classificacao"],
                "tipo": c["tipo"],
                "razao": c["razao"],
            })

    # Combina tudo: agrupados primeiro, depois independentes
    resultado = list(agrupados.values()) + independentes

    # Ordena: agravos com múltiplas entradas primeiro
    resultado.sort(key=lambda x: (-len(x["entradas"]), x["nome_base"].lower()))

    return resultado, classificadas


# ── Relatório ───────────────────────────────────────────
def gerar_relatorio(entradas, mapa, classificadas):
    os.makedirs(AUTOMACOES_DIR, exist_ok=True)
    agora = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Contagens
    total_entradas = len(entradas)
    total_agravos = len(mapa)
    multiplas = [a for a in mapa if len(a["entradas"]) > 1]
    unicas = [a for a in mapa if len(a["entradas"]) == 1]
    variacoes = [c for c in classificadas if c["tipo"] == "VARIACAO_NOTIFICACAO"]
    subtipos = [c for c in classificadas if c["tipo"] == "SUBTIPO"]
    eventos = [c for c in classificadas if c["tipo"] == "EVENTO"]
    revisao = [c for c in classificadas if c["tipo"] == "REVISAO_MANUAL"]
    bases_puras = [c for c in classificadas if c["tipo"] == "AGRAVO_BASE" and c["agravo_base_id"] is None]

    # ── TXT ──
    linhas = []
    linhas.append("=" * 70)
    linhas.append("MAPA ESTRUTURAL DA LISTA DE NOTIFICAÇÃO COMPULSÓRIA")
    linhas.append(f"Data: {agora}")
    linhas.append("")
    linhas.append(f"Total de entradas encontradas no HTML: {total_entradas}")
    linhas.append(f"Total de agravos-base identificados:   {total_agravos}")
    linhas.append(f"  - Agravos com múltiplas entradas:    {len(multiplas)}")
    linhas.append(f"  - Agravos com uma única entrada:     {len(unicas)}")
    linhas.append("")

    # Agravos com múltiplas entradas
    linhas.append("-" * 70)
    linhas.append(f"AGRAVOS COM MÚLTIPLAS ENTRADAS DE NOTIFICAÇÃO ({len(multiplas)})")
    linhas.append("")
    for ag in multiplas:
        linhas.append(f"AGRAVO-BASE: {ag['nome_base']}  [{ag['id']}]")
        linhas.append(f"  Entradas: {len(ag['entradas'])}")
        for i, e in enumerate(ag["entradas"], 1):
            linhas.append(f"    {i}. {e['nome_original']}")
            linhas.append(f"       Tipo: {e['tipo']}")
            linhas.append(f"       Periodicidade: {e['classificacao']}")
            linhas.append(f"       Razão: {e['razao']}")
        linhas.append("")

    # Agravos com uma entrada
    linhas.append("-" * 70)
    linhas.append(f"AGRAVOS COM UMA ÚNICA ENTRADA ({len(unicas)})")
    linhas.append("")
    for i, ag in enumerate(unicas, 1):
        e = ag["entradas"][0]
        linhas.append(f"  {i:2d}. {e['nome_original']}")
        linhas.append(f"       Periodicidade: {e['classificacao']}")
    linhas.append("")

    # Revisão manual
    if revisao:
        linhas.append("-" * 70)
        linhas.append(f"REVISÃO MANUAL ({len(revisao)})")
        linhas.append("")
        for i, c in enumerate(revisao, 1):
            linhas.append(f"  {i}. {c['nome_original']}")
            linhas.append(f"     Razão: {c['razao']}")
        linhas.append("")

    # Resumo
    linhas.append("=" * 70)
    linhas.append("RESUMO")
    linhas.append(f"Entradas totais no HTML:              {total_entradas}")
    linhas.append(f"Agravos-base identificados:           {total_agravos}")
    linhas.append(f"Agravos com múltiplas entradas:       {len(multiplas)}")
    linhas.append(f"Entradas classificadas como variação: {len(variacoes)}")
    linhas.append(f"Entradas classificadas como subtipo:  {len(subtipos)}")
    linhas.append(f"Entradas classificadas como evento:   {len(eventos)}")
    linhas.append(f"Entradas Agravo-Base independentes:   {len(bases_puras)}")
    linhas.append(f"Revisão manual:                       {len(revisao)}")
    linhas.append("=" * 70)

    with open(RELATORIO_TXT, "w", encoding="utf-8") as f:
        f.write("\n".join(linhas))

    # ── JSON ──
    json_data = {
        "metadata": {
            "data_execucao": agora,
            "fonte_html": os.path.basename(HTML_FILE),
            "fonte_referencia": "lista-de-doencas-de-notificacao-compulsoria.html",
            "total_entradas_html": total_entradas,
            "total_agravos_base": total_agravos,
            "agravos_multiplas_entradas": len(multiplas),
        },
        "agravos_base": []
    }

    for ag in mapa:
        entries = []
        for e in ag["entradas"]:
            entries.append({
                "nome_original_html": e["nome_original"],
                "classificacao": e["classificacao"],
                "tipo": e["tipo"],
                "razao": e["razao"],
            })
        json_data["agravos_base"].append({
            "id": ag["id"],
            "nome_base": ag["nome_base"],
            "quantidade_entradas": len(ag["entradas"]),
            "entradas": entries,
        })

    with open(MAPA_JSON, "w", encoding="utf-8") as f:
        json.dump(json_data, f, ensure_ascii=False, indent=2)

    return {
        "total_entradas": total_entradas,
        "total_agravos": total_agravos,
        "multiplas": len(multiplas),
        "variacoes": len(variacoes),
        "subtipos": len(subtipos),
        "eventos": len(eventos),
        "revisao": len(revisao),
    }


# ── Main ─────────────────────────────────────────────────
def main():
    print("=" * 70)
    print("FASE 1 — MAPEAMENTO ESTRUTURAL")
    print("notificacao-compulsoria.html")
    print("=" * 70)

    # 1. Extrair entradas
    print("\n[1/3] Extraindo entradas do HTML...")
    entradas = extrair_entradas(HTML_FILE)
    print(f"  [OK] {len(entradas)} entradas encontradas")

    imediatas = sum(1 for e in entradas if "Imediata" in e["classificacao"])
    semanais = sum(1 for e in entradas if "Semanal" in e["classificacao"])
    print(f"       Imediatas: {imediatas}")
    print(f"       Semanais:  {semanais}")

    # 2. Construir mapa
    print("\n[2/3] Construindo mapa estrutural...")
    mapa, classificadas = construir_mapa(entradas)

    multiplas = [a for a in mapa if len(a["entradas"]) > 1]
    unicas = [a for a in mapa if len(a["entradas"]) == 1]
    print(f"  [OK] {len(mapa)} agravos-base identificados")
    print(f"       {len(multiplas)} com múltiplas entradas")
    print(f"       {len(unicas)} com uma única entrada")

    for ag in multiplas:
        print(f"       → {ag['nome_base']}: {len(ag['entradas'])} entradas")

    # 3. Gerar relatórios
    print("\n[3/3] Gerando relatórios...")
    resumo = gerar_relatorio(entradas, mapa, classificadas)
    print(f"  [OK] JSON: {MAPA_JSON}")
    print(f"  [OK] TXT:  {RELATORIO_TXT}")

    # Resumo final
    print("\n" + "=" * 70)
    print("MAPEAMENTO CONCLUÍDO")
    print(f"Entradas encontradas:       {resumo['total_entradas']}")
    print(f"Agravos-base identificados: {resumo['total_agravos']}")
    print(f"Agravos com múltiplas entradas: {resumo['multiplas']}")
    print(f"Variações:                  {resumo['variacoes']}")
    print(f"Subtipos:                   {resumo['subtipos']}")
    print(f"Eventos:                    {resumo['eventos']}")
    print(f"Revisão manual:             {resumo['revisao']}")
    print()
    print("Arquivos:")
    print(f"  {MAPA_JSON}")
    print(f"  {RELATORIO_TXT}")
    print("=" * 70)


if __name__ == "__main__":
    main()
