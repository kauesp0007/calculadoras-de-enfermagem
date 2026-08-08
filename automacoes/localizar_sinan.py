#!/usr/bin/env python3
"""
FASE 2 — LOCALIZAÇÃO DAS FONTES OFICIAIS DO SINAN

Para cada uma das 48 entidades epidemiológicas do mapa final consolidado,
localiza a página correspondente no portal SINAN.

NÃO extrai dados epidemiológicos — apenas URL e classificação.
"""

import os
import re
import json
import time
import unicodedata
import urllib.request
import urllib.error
import ssl
from datetime import datetime

# ── Config ──────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUTOMACOES_DIR = os.path.join(BASE_DIR, "automacoes")
MAPA_FINAL = os.path.join(AUTOMACOES_DIR, "mapa_notificacao_compulsoria_final.json")
CORRESP_JSON = os.path.join(AUTOMACOES_DIR, "correspondencias_sinan_notificacao.json")
CORRESP_TXT = os.path.join(AUTOMACOES_DIR, "relatorio_correspondencias_sinan.txt")

SINAN_URLS = [
    "https://portalsinan.saude.gov.br/doencas-e-agravos",
    "https://portalsinan.saude.gov.br/doencas-e-agravos?start=1",
]
SINAN_BASE = "https://portalsinan.saude.gov.br"
REQUEST_TIMEOUT = 15
DELAY = 0.6


# ── Utilidades ──────────────────────────────────────────
def normalizar(texto):
    if not texto:
        return ""
    t = texto.lower().strip()
    t = unicodedata.normalize('NFKD', t).encode('ascii', 'ignore').decode('ascii')
    t = re.sub(r'\s+', ' ', t)
    t = re.sub(r'[^a-z0-9\s]', '', t)
    return t.strip()


def palavras_chave(texto):
    palavras = normalizar(texto).split()
    return [p for p in palavras if len(p) >= 3]


def ctx_ssl():
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return ctx


def fetch(url):
    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0",
            "Accept": "text/html",
            "Accept-Language": "pt-BR,pt;q=0.9",
        })
        with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT, context=ctx_ssl()) as r:
            raw = r.read()
            for enc in ["utf-8", "latin-1", "iso-8859-1"]:
                try:
                    return raw.decode(enc)
                except UnicodeDecodeError:
                    continue
            return raw.decode("utf-8", errors="replace")
    except Exception as e:
        return None


# ── Extrair índice SINAN ────────────────────────────────
def construir_indice():
    print("\n[1/3] Construindo índice do SINAN...")
    todos = []

    for url in SINAN_URLS:
        print(f"  Acessando: {url}")
        html = fetch(url)
        if not html:
            continue

        # Padrão: <a href="/nome-da-doenca">Nome da Doença</a>
        for m in re.finditer(r'<a\s+href="/([^"]+)"[^>]*>\s*([^<]+)\s*</a>', html):
            href = m.group(1).strip()
            nome = m.group(2).strip()

            if not nome or len(nome) < 3:
                continue
            if any(s in href.lower() for s in [
                'component/', 'templates/', 'images/', 'media/', 'javascript',
                'acessibilidade', 'mapa-do-site', 'perguntas', 'contato',
                'funcionamentos', 'downloads', 'legislacao', 'dados-epidemiologicos',
                'calendario', 'novidades', 'o-sinan', 'sinan-net', 'sinan-dengue',
                'sinan-influenza', 'sistemas-auxiliares', 'resp', 'sime',
            ]):
                continue
            if nome.lower() in ['acessibilidade', 'mapa do site', 'fale conosco',
                                 'perguntas frequentes']:
                continue

            todos.append({
                "nome": nome,
                "nome_norm": normalizar(nome),
                "url": SINAN_BASE + "/" + href,
            })

    # Dedup
    vistos = set()
    unicos = []
    for t in todos:
        if t["nome_norm"] not in vistos and len(t["nome_norm"]) >= 4:
            vistos.add(t["nome_norm"])
            unicos.append(t)

    print(f"  Total: {len(unicos)} links únicos no SINAN")
    return unicos


# ── Correspondência ─────────────────────────────────────
def similaridade_exata(entidade_norm, sinan_norm):
    return entidade_norm == sinan_norm


def similaridade_contida(entidade_norm, sinan_norm):
    return entidade_norm in sinan_norm or sinan_norm in entidade_norm


def score_palavras(entidade_nome, sinan_nome):
    kw1 = set(palavras_chave(entidade_nome))
    kw2 = set(palavras_chave(sinan_nome))
    if not kw1 or not kw2:
        return 0
    inter = kw1 & kw2
    return round((len(inter) / max(len(kw1), len(kw2))) * 100, 1)


def encontrar_melhor(entidade, indice):
    """Encontra a melhor página SINAN para uma entidade."""
    nome = entidade["nome"]
    nome_norm = normalizar(nome)
    tipo = entidade.get("tipo_entidade", "doenca")

    # Nível 1: match exato
    for s in indice:
        if similaridade_exata(nome_norm, s["nome_norm"]):
            return (s, "CONFIRMADA_DIRETA", "ALTA")

    # Nível 2: substring
    for s in indice:
        if similaridade_contida(nome_norm, s["nome_norm"]):
            return (s, "CONFIRMADA_DIRETA", "ALTA")

    # Nível 3: palavras-chave
    candidatos = []
    for s in indice:
        sc = score_palavras(nome, s["nome"])
        if sc >= 60:
            candidatos.append((s, sc))

    candidatos.sort(key=lambda x: x[1], reverse=True)

    if not candidatos:
        return (None, "NAO_ENCONTRADA", "N/A")

    if len(candidatos) == 1:
        if candidatos[0][1] >= 80:
            return (candidatos[0][0], "CONFIRMADA_DIRETA", "ALTA")
        elif candidatos[0][1] >= 70:
            return (candidatos[0][0], "PROVAVEL", "MEDIA")
        else:
            return (candidatos[0][0], "PROVAVEL", "BAIXA")

    # Múltiplos candidatos
    if candidatos[0][1] >= 85 and (candidatos[0][1] - candidatos[1][1]) >= 15:
        return (candidatos[0][0], "CONFIRMADA_DIRETA", "ALTA")

    if candidatos[0][1] >= 60:
        return (candidatos, "REVISAO_MANUAL", "BAIXA")

    return (None, "NAO_ENCONTRADA", "N/A")


# ── Entidades do mapa ───────────────────────────────────
def extrair_entidades(mapa):
    """Extrai lista plana de todas as entidades epidemiológicas."""
    entidades = []

    for g in mapa.get("grupos_organizadores", []):
        grupo_nome = g["nome_grupo"]
        for e in g.get("entidades", []):
            entidades.append({
                "nome": e["nome"],
                "tipo_entidade": e.get("tipo_entidade", "doenca"),
                "grupo_organizador": grupo_nome,
                "entradas_notificacao": [en["nome_original_html"] for en in e.get("entradas", [])],
            })

    for ind in mapa.get("entidades_independentes", []):
        for e in ind.get("entidades", []):
            entradas = [en["nome_original_html"] for en in e.get("entradas", [])]
            entidades.append({
                "nome": e["nome"],
                "tipo_entidade": e.get("tipo_entidade", "doenca"),
                "grupo_organizador": None,
                "entradas_notificacao": entradas,
            })

    return entidades


# ── Relatório + JSON ────────────────────────────────────
def gerar_saida(entidades, resultados, indice_sinan):
    agora = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    dirs = sum(1 for r in resultados if r["status"] == "CONFIRMADA_DIRETA")
    cats = sum(1 for r in resultados if r["status"] == "CONFIRMADA_CATEGORIA")
    prov = sum(1 for r in resultados if r["status"] == "PROVAVEL")
    revs = sum(1 for r in resultados if r["status"] == "REVISAO_MANUAL")
    naos = sum(1 for r in resultados if r["status"] == "NAO_ENCONTRADA")

    # ── TXT ──
    linhas = []
    linhas.append("=" * 70)
    linhas.append("CORRESPONDÊNCIA — ENTIDADES × SINAN")
    linhas.append(f"Data: {agora}")
    linhas.append(f"Fonte: {SINAN_URLS[0]}")
    linhas.append("")
    linhas.append(f"Total de entidades: {len(entidades)}")
    linhas.append(f"Total de links SINAN: {len(indice_sinan)}")
    linhas.append("")
    linhas.append(f"CONFIRMADA_DIRETA:     {dirs}")
    linhas.append(f"CONFIRMADA_CATEGORIA:  {cats}")
    linhas.append(f"PROVÁVEL:              {prov}")
    linhas.append(f"REVISÃO_MANUAL:        {revs}")
    linhas.append(f"NÃO_ENCONTRADA:        {naos}")
    linhas.append("")
    linhas.append("-" * 70)
    linhas.append("ENTIDADES")
    linhas.append("")

    for i, r in enumerate(resultados, 1):
        linhas.append(f"{i:2d}. Entidade: {r['nome']}")
        if r.get("grupo"):
            linhas.append(f"    Grupo: {r['grupo']}")
        linhas.append(f"    Tipo: {r['tipo_entidade']}")
        linhas.append(f"    SINAN: {r['sinan_titulo'] or '—'}")
        linhas.append(f"    URL: {r['sinan_url'] or '—'}")
        linhas.append(f"    Correspondência: {r['status']}")
        linhas.append(f"    Confiança: {r['confianca']}")
        if r.get("entradas"):
            linhas.append(f"    Entradas de notificação: {len(r['entradas'])}")
        if r.get("possiveis"):
            linhas.append(f"    Possíveis SINAN:")
            for p in r["possiveis"]:
                if isinstance(p, tuple):
                    linhas.append(f"      - {p[0]['nome']} (score: {p[1]})  {p[0]['url']}")
                else:
                    linhas.append(f"      - {p['nome']}  {p['url']}")
        linhas.append("")

    # Revisão manual
    linhas.append("-" * 70)
    linhas.append("REVISÃO MANUAL")
    linhas.append("")
    for r in resultados:
        if r["status"] == "REVISAO_MANUAL":
            linhas.append(f"  {r['nome']}")
            if r.get("possiveis"):
                for p in r["possiveis"]:
                    if isinstance(p, tuple):
                        linhas.append(f"    → {p[0]['nome']} ({p[0]['url']})")
    linhas.append("")

    # Não encontradas
    linhas.append("-" * 70)
    linhas.append("NÃO ENCONTRADAS")
    linhas.append("")
    for r in resultados:
        if r["status"] == "NAO_ENCONTRADA":
            linhas.append(f"  {r['nome']}")
    linhas.append("")

    linhas.append("=" * 70)

    with open(CORRESP_TXT, "w", encoding="utf-8") as f:
        f.write("\n".join(linhas))

    # ── JSON ──
    json_out = {
        "metadata": {
            "data_consulta": agora,
            "fonte_mapa": os.path.basename(MAPA_FINAL),
            "fonte_sinan": SINAN_URLS[0],
            "total_entidades": len(entidades),
            "total_links_sinan": len(indice_sinan),
            "resumo": {
                "confirmada_direta": dirs,
                "confirmada_categoria": cats,
                "provavel": prov,
                "revisao_manual": revs,
                "nao_encontrada": naos,
            }
        },
        "entidades": []
    }

    for r in resultados:
        entry = {
            "nome": r["nome"],
            "tipo_entidade": r["tipo_entidade"],
            "grupo_organizador": r.get("grupo"),
            "sinan_titulo": r["sinan_titulo"],
            "sinan_url": r["sinan_url"],
            "status": r["status"],
            "confianca": r["confianca"],
            "entradas_notificacao": r.get("entradas", []),
        }
        if r.get("possiveis"):
            entry["possiveis_sinan"] = []
            for p in r["possiveis"]:
                if isinstance(p, tuple):
                    entry["possiveis_sinan"].append({
                        "nome": p[0]["nome"], "url": p[0]["url"], "score": p[1]
                    })
                else:
                    entry["possiveis_sinan"].append({
                        "nome": p["nome"], "url": p["url"]
                    })
        json_out["entidades"].append(entry)

    with open(CORRESP_JSON, "w", encoding="utf-8") as f:
        json.dump(json_out, f, ensure_ascii=False, indent=2)

    return dirs, cats, prov, revs, naos


# ── Main ─────────────────────────────────────────────────
def main():
    print("=" * 70)
    print("FASE 2 — LOCALIZAÇÃO DAS FONTES SINAN")
    print("=" * 70)

    # 1. Carregar mapa final
    print("\n[1/3] Carregando mapa final...")
    with open(MAPA_FINAL, "r", encoding="utf-8") as f:
        mapa = json.load(f)
    entidades = extrair_entidades(mapa)
    print(f"  [OK] {len(entidades)} entidades epidemiológicas extraídas")

    # 2. Construir índice SINAN
    indice = construir_indice()

    # 3. Correspondência
    print(f"\n[2/3] Realizando correspondência para {len(entidades)} entidades...")
    resultados = []

    for i, ent in enumerate(entidades, 1):
        resultado = encontrar_melhor(ent, indice)

        r = {
            "nome": ent["nome"],
            "tipo_entidade": ent["tipo_entidade"],
            "grupo": ent.get("grupo_organizador"),
            "entradas": ent.get("entradas_notificacao", []),
        }

        if resultado[1] == "REVISAO_MANUAL":
            possiveis = resultado[0]
            r["sinan_titulo"] = possiveis[0][0]["nome"] if possiveis else ""
            r["sinan_url"] = possiveis[0][0]["url"] if possiveis else ""
            r["status"] = "REVISAO_MANUAL"
            r["confianca"] = resultado[2]
            r["possiveis"] = possiveis
        elif resultado[1] == "NAO_ENCONTRADA":
            r["sinan_titulo"] = ""
            r["sinan_url"] = ""
            r["status"] = "NAO_ENCONTRADA"
            r["confianca"] = "N/A"
        else:
            entry, status, conf = resultado
            r["sinan_titulo"] = entry["nome"]
            r["sinan_url"] = entry["url"]
            r["status"] = status
            r["confianca"] = conf

        resultados.append(r)

        if i % 10 == 0:
            print(f"  ... {i}/{len(entidades)}")

    print(f"  [OK] {len(resultados)} correspondências avaliadas")

    # 4. Gerar saída
    print(f"\n[3/3] Gerando relatórios...")
    dirs, cats, prov, revs, naos = gerar_saida(entidades, resultados, indice)
    print(f"  [OK] {CORRESP_JSON}")
    print(f"  [OK] {CORRESP_TXT}")

    # Resumo terminal
    print("\n" + "=" * 70)
    print("FASE 2 CONCLUÍDA")
    print(f"Entidades analisadas: {len(entidades)}")
    print()
    print(f"Correspondências diretas:      {dirs}")
    print(f"Correspondências por categoria:{cats}")
    print(f"Prováveis:                     {prov}")
    print(f"Revisão manual:                {revs}")
    print(f"Não encontradas:               {naos}")
    print()
    print(f"Arquivo:    {CORRESP_JSON}")
    print(f"Relatório:  {CORRESP_TXT}")
    print("=" * 70)


if __name__ == "__main__":
    main()
