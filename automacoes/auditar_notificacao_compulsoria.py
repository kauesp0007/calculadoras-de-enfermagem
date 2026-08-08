#!/usr/bin/env python3
"""
FASE 1 — Auditoria de Correspondência
notificacao-compulsoria.html ↔ SINAN (portalsinan.saude.gov.br)

Extrai os itens do HTML, acessa a lista do SINAN e gera:
- Relatório TXT (automacoes/relatorio_notificacao_compulsoria.txt)
- JSON de auditoria (automacoes/auditoria_notificacao_compulsoria.json)
"""

import os
import re
import json
import time
import unicodedata
import urllib.request
import urllib.error
import ssl
import html.parser as htmlparser
from datetime import datetime

# ── Config ──────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML_FILE = os.path.join(BASE_DIR, "notificacao-compulsoria.html")
AUTOMACOES_DIR = os.path.join(BASE_DIR, "automacoes")
RELATORIO_FILE = os.path.join(AUTOMACOES_DIR, "relatorio_notificacao_compulsoria.txt")
AUDITORIA_JSON = os.path.join(AUTOMACOES_DIR, "auditoria_notificacao_compulsoria.json")

SINAN_URL = "https://portalsinan.saude.gov.br/doencas-e-agravos?showall=1&limitstart="
SINAN_BASE = "https://portalsinan.saude.gov.br"
REQUEST_TIMEOUT = 20
DELAY_BETWEEN_REQUESTS = 0.8

# ── Normalização ────────────────────────────────────────
def normalizar(texto):
    """Normaliza string para comparação: lowercase, sem acentos, espaços normalizados."""
    if not texto:
        return ""
    t = texto.lower().strip()
    t = unicodedata.normalize('NFKD', t).encode('ascii', 'ignore').decode('ascii')
    t = re.sub(r'\s+', ' ', t)
    t = re.sub(r'[^a-z0-9\s]', '', t)
    return t.strip()


def similaridade_exata(nome_html, nome_sinan):
    """Compara dois nomes normalizados e retorna True se forem idênticos."""
    return normalizar(nome_html) == normalizar(nome_sinan)


def similaridade_parcial(nome_html, nome_sinan):
    """Verifica se um dos nomes está contido no outro após normalização."""
    nh = normalizar(nome_html)
    ns = normalizar(nome_sinan)
    if not nh or not ns:
        return False
    return nh in ns or ns in nh


def extrair_palavras_chave(nome):
    """Extrai palavras-chave significativas (>=3 letras) do nome normalizado.
    Remove prefixos como DRT, e palavras muito curtas ou genéricas."""
    palavras = normalizar(nome).split()
    stopwords = {'por', 'com', 'sem', 'das', 'dos', 'para', 'que', 'nao', 'como',
                 'ate', 'das', 'aos', 'nas', 'nos', 'pelo', 'pela', 'entre',
                 'mais', 'tambem', 'outras', 'outros', 'incluindo', 'forma',
                 'formas', 'caso', 'casos', 'grave', 'graves'}
    palavras_filtradas = []
    for p in palavras:
        # Remove prefixo DRT para correspondência com itens do SINAN
        if p == 'drt':
            continue
        if len(p) >= 3 and p not in stopwords:
            palavras_filtradas.append(p)
    return palavras_filtradas


def normalizar_sinan(nome):
    """Normalização específica para nomes do SINAN, removendo prefixos DRT."""
    n = normalizar(nome)
    # Remove prefixo "DRT " dos nomes do SINAN
    if n.startswith('drt '):
        n = n[4:]
    return n


def similaridade_exata(nome_html, nome_sinan):
    """Compara dois nomes normalizados e retorna True se forem idênticos."""
    nh = normalizar(nome_html)
    ns = normalizar_sinan(nome_sinan)
    return nh == ns


def similaridade_parcial(nome_html, nome_sinan):
    """Verifica se um dos nomes está contido no outro após normalização."""
    nh = normalizar(nome_html)
    ns = normalizar_sinan(nome_sinan)
    if not nh or not ns:
        return False
    return nh in ns or ns in nh


def score_similaridade(nome_html, nome_sinan):
    """
    Calcula um score de similaridade (0-100):
    - 100: match exato após normalização
    - >=85: uma string está contida na outra completamente
    - >=60: maioria das palavras-chave coincidem (>=60%)
    - >=40: pelo menos 2 palavras-chave coincidem
    """
    if similaridade_exata(nome_html, nome_sinan):
        return 100
    if similaridade_parcial(nome_html, nome_sinan):
        return 85

    kw_html = set(extrair_palavras_chave(nome_html))
    kw_sinan = set(extrair_palavras_chave(nome_sinan))

    if not kw_html or not kw_sinan:
        return 0

    intersecao = kw_html & kw_sinan
    if len(intersecao) >= 2:
        # Pelo menos 2 palavras em comum = correspondência forte
        score = 50 + (len(intersecao) / max(len(kw_html), len(kw_sinan))) * 40
        return round(min(score, 84), 1)

    # Só 1 palavra em comum
    if len(intersecao) == 1:
        palavra = list(intersecao)[0]
        # Se a palavra em comum tiver >= 6 letras, é mais confiável
        if len(palavra) >= 6:
            return 45
        return 25

    return 0


# ── Extrator HTML ───────────────────────────────────────
class DadosExtractor(htmlparser.HTMLParser):
    """Extrai os nomes dos itens do array dadosNotificacao via parse do JS inline."""
    def __init__(self):
        super().__init__()
        self.in_script = False
        self.script_content = ""
        self.itens = []

    def handle_starttag(self, tag, attrs):
        if tag == "script":
            self.in_script = True

    def handle_endtag(self, tag):
        if tag == "script":
            self.in_script = False

    def handle_data(self, data):
        if self.in_script:
            self.script_content += data + "\n"


def extrair_itens_do_html(caminho_html):
    """Extrai a lista de itens do array dadosNotificacao do HTML."""
    with open(caminho_html, "r", encoding="utf-8") as f:
        conteudo = f.read()

    # Localiza o array dadosNotificacao via regex no JavaScript inline
    # Busca padrão: { nome: "Nome da Doença", ... }
    padrao = r'\{\s*nome\s*:\s*"([^"]+)"\s*,'
    matches = re.findall(padrao, conteudo)

    itens = []
    for nome in matches:
        # Extrai classificação (Imediata/Semanal)
        bloco_inicio = conteudo.find(f'nome: "{nome}"')
        bloco = conteudo[bloco_inicio:bloco_inicio + 500]
        class_match = re.search(r'classificacao\s*:\s*"([^"]+)"', bloco)
        classificacao = class_match.group(1) if class_match else "Desconhecida"

        itens.append({
            "nome": nome,
            "classificacao": classificacao,
        })

    # Remove duplicatas preservando a ordem
    vistos = set()
    itens_unicos = []
    for item in itens:
        if item["nome"] not in vistos:
            vistos.add(item["nome"])
            itens_unicos.append(item)

    return itens_unicos


# ── Acesso ao SINAN ─────────────────────────────────────
def criar_contexto_ssl():
    """Cria contexto SSL sem verificação (necessário para alguns servidores gov.br)."""
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return ctx


def fetch_url(url, timeout=REQUEST_TIMEOUT):
    """Faz requisição GET e retorna o conteúdo decodificado ou None."""
    ctx = criar_contexto_ssl()
    try:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "text/html,application/xhtml+xml",
                "Accept-Language": "pt-BR,pt;q=0.9",
            }
        )
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
            raw = resp.read()
            # Tenta detectar encoding
            content_type = resp.headers.get("Content-Type", "")
            encodings = ["utf-8", "latin-1", "iso-8859-1", "cp1252"]
            for enc in encodings:
                try:
                    return raw.decode(enc)
                except UnicodeDecodeError:
                    continue
            return raw.decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        print(f"  [!] HTTP {e.code} ao acessar: {url}")
        return None
    except urllib.error.URLError as e:
        print(f"  [!] Erro de conexão: {e.reason}")
        return None
    except Exception as e:
        print(f"  [!] Erro inesperado: {e}")
        return None


def extrair_links_sinan(html_conteudo):
    """Extrai links e nomes de doenças da página do SINAN.
    A página usa estrutura: <p><a href="/nome-da-doenca">Nome da Doença</a></p>
    dentro de <div class="lista-colunas">.
    """
    links = []

    # Padrão específico da página do SINAN:
    # <p><a href="/nome-da-doenca">Nome da Doença</a></p>
    padrao = re.compile(
        r'<a\s+href\s*=\s*"/([^"]+)"[^>]*>\s*([^<]+)\s*</a>',
        re.IGNORECASE
    )

    for match in padrao.finditer(html_conteudo):
        href = match.group(1).strip()
        texto = match.group(2).strip()

        # Filtra: ignora links de navegação, menus, etc.
        if not texto or len(texto) < 3:
            continue
        # Ignora links que são claramente de sistema/navegação
        if any(skip in href.lower() for skip in [
            'component/', 'templates/', 'images/', 'media/',
            'javascript', 'acessibilidade', 'mapa-do-site',
            'perguntas-frequentes', 'contato', 'funcionamentos',
            'downloads', 'sinan-legislacao', 'dados-epidemiologicos',
            'calendario-epidemiologico', 'novidades', 'o-sinan',
            'sinan-net', 'sinan-dengue', 'sinan-influenza',
            'sistemas-auxiliares', 'resp', 'sime',
        ]):
            continue
        # Ignora links muito genéricos
        if texto.lower() in ['acessibilidade', 'mapa do site', 'fale conosco',
                               'perguntas frequentes', 'funcionamento', 'o sinan']:
            continue

        url_full = SINAN_BASE + "/" + href
        links.append({
            "nome": texto,
            "nome_normalizado": normalizar(texto),
            "url": url_full,
        })

    # Remove duplicatas pelo nome normalizado
    vistos = set()
    links_unicos = []
    for link in links:
        if link["nome_normalizado"] not in vistos:
            vistos.add(link["nome_normalizado"])
            links_unicos.append(link)

    return links_unicos


def construir_indice_sinan():
    """Acessa a lista do SINAN e constrói índice nome -> URL."""
    print("\n" + "=" * 60)
    print("ACESSANDO PORTAL SINAN...")
    print("=" * 60)

    todos_links = []

    # Página 1 (A-G): sem parâmetro showall
    url_pag1 = "https://portalsinan.saude.gov.br/doencas-e-agravos"
    print(f"\n  Acessando página 1: {url_pag1}")
    html1 = fetch_url(url_pag1)
    if html1:
        links1 = extrair_links_sinan(html1)
        print(f"  [OK] {len(links1)} links encontrados (página 1)")
        todos_links.extend(links1)
    else:
        print("  [ERRO] Não foi possível acessar a página 1")

    # Página 2 (H-Z): ?start=1
    url_pag2 = "https://portalsinan.saude.gov.br/doencas-e-agravos?start=1"
    print(f"\n  Acessando página 2: {url_pag2}")
    html2 = fetch_url(url_pag2)
    if html2:
        links2 = extrair_links_sinan(html2)
        print(f"  [OK] {len(links2)} links encontrados (página 2)")
        todos_links.extend(links2)
    else:
        print("  [!] Não foi possível acessar a página 2 (alguns itens H-Z podem faltar)")

    time.sleep(DELAY_BETWEEN_REQUESTS)

    # Tenta também a página com showall=1 como fallback
    url_all = "https://portalsinan.saude.gov.br/doencas-e-agravos?showall=1"
    print(f"\n  [FALLBACK] Acessando showall: {url_all}")
    html_all = fetch_url(url_all)
    if html_all:
        links_all = extrair_links_sinan(html_all)
        print(f"  [OK] {len(links_all)} links encontrados (showall)")
        todos_links.extend(links_all)

    # Remove duplicatas finais
    vistos = set()
    indice_final = []
    for link in todos_links:
        if link["nome_normalizado"] not in vistos:
            vistos.add(link["nome_normalizado"])
            indice_final.append(link)

    print(f"\n  TOTAL de links únicos no índice SINAN: {len(indice_final)}")
    return indice_final


# ── Correspondência ─────────────────────────────────────
def encontrar_correspondencia(item_html, indice_sinan):
    """
    Para um item do HTML, encontra a melhor correspondência no índice SINAN.
    Retorna (melhor_match, status, confianca).
    """
    nome_html = item_html["nome"]

    # 1. Tentar match exato
    for entry in indice_sinan:
        if similaridade_exata(nome_html, entry["nome"]):
            return (entry, "CONFIRMADA", "ALTA")

    # 2. Tentar correspondência por score
    melhores = []
    for entry in indice_sinan:
        score = score_similaridade(nome_html, entry["nome"])
        if score >= 50:  # Threshold mais baixo para capturar mais
            melhores.append((entry, score))

    melhores.sort(key=lambda x: x[1], reverse=True)

    if len(melhores) == 0:
        return (None, "NAO_ENCONTRADA", "N/A")

    # Uma única correspondência forte
    if len(melhores) == 1:
        if melhores[0][1] >= 85:
            return (melhores[0][0], "CONFIRMADA", "ALTA")
        elif melhores[0][1] >= 60:
            return (melhores[0][0], "PROVAVEL", "MEDIA")
        else:
            return (None, "NAO_ENCONTRADA", "N/A")

    # Múltiplas correspondências
    if melhores[0][1] >= 85 and (len(melhores) == 1 or (melhores[0][1] - melhores[1][1]) >= 20):
        return (melhores[0][0], "CONFIRMADA", "ALTA")

    if melhores[0][1] >= 60:
        return (melhores, "REVISAO_MANUAL", "BAIXA")

    return (None, "NAO_ENCONTRADA", "N/A")


# ── Relatório ────────────────────────────────────────────
def gerar_relatorio(itens_html, correspondencias, indice_sinan):
    """Gera o relatório TXT e o JSON de auditoria."""
    os.makedirs(AUTOMACOES_DIR, exist_ok=True)

    agora = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Contagem
    confirmadas = [c for c in correspondencias if c["status"] == "CONFIRMADA"]
    provaveis = [c for c in correspondencias if c["status"] == "PROVAVEL"]
    revisao = [c for c in correspondencias if c["status"] == "REVISAO_MANUAL"]
    nao_encontradas = [c for c in correspondencias if c["status"] == "NAO_ENCONTRADA"]

    # ── TXT ──
    linhas = []
    linhas.append("=" * 60)
    linhas.append("AUDITORIA DE CORRESPONDÊNCIA — NOTIFICAÇÃO COMPULSÓRIA")
    linhas.append(f"Data da execução: {agora}")
    linhas.append(f"Fonte do HTML: {os.path.basename(HTML_FILE)}")
    linhas.append(f"Fonte SINAN: {SINAN_URL}")
    linhas.append("")
    linhas.append(f"TOTAL DE ITENS NO HTML: {len(itens_html)}")
    linhas.append(f"TOTAL DE ITENS ENCONTRADOS NO SINAN: {len(indice_sinan)}")
    linhas.append("")

    # Confirmadas
    linhas.append("-" * 60)
    linhas.append("CORRESPONDÊNCIAS CONFIRMADAS")
    linhas.append("")
    for i, c in enumerate(confirmadas, 1):
        linhas.append(f"{i}. HTML: {c['nome_html']}")
        linhas.append(f"   SINAN: {c['nome_sinan']}")
        linhas.append(f"   URL: {c['url_sinan']}")
        linhas.append(f"   STATUS: CONFIRMADA")
        linhas.append(f"   CONFIANÇA: {c['confianca']}")
        linhas.append("")

    # Prováveis
    linhas.append("-" * 60)
    linhas.append("CORRESPONDÊNCIAS PROVÁVEIS")
    linhas.append("")
    for i, c in enumerate(provaveis, 1):
        linhas.append(f"{i}. HTML: {c['nome_html']}")
        linhas.append(f"   SINAN: {c['nome_sinan']}")
        linhas.append(f"   URL: {c['url_sinan']}")
        linhas.append(f"   STATUS: PROVÁVEL")
        linhas.append(f"   CONFIANÇA: {c['confianca']}")
        linhas.append("")

    # Revisão Manual
    linhas.append("-" * 60)
    linhas.append("REVISÃO MANUAL")
    linhas.append("")
    for i, c in enumerate(revisao, 1):
        linhas.append(f"{i}. HTML: {c['nome_html']}")
        linhas.append(f"   Possíveis correspondências:")
        if isinstance(c.get("possiveis"), list):
            for p in c["possiveis"]:
                if isinstance(p, tuple):
                    entry, score = p
                    linhas.append(f"     - {entry['nome']} (score: {score})")
                    linhas.append(f"       {entry['url']}")
                elif isinstance(p, dict):
                    linhas.append(f"     - {p['nome']}")
                    linhas.append(f"       {p['url']}")
        linhas.append(f"   STATUS: REVISÃO MANUAL")
        linhas.append("")

    # Não Encontradas
    linhas.append("-" * 60)
    linhas.append("NÃO ENCONTRADAS")
    linhas.append("")
    for i, c in enumerate(nao_encontradas, 1):
        linhas.append(f"  {i}. {c['nome_html']}")
    linhas.append("")

    # Resumo
    linhas.append("=" * 60)
    linhas.append("RESUMO")
    linhas.append(f"Itens no HTML:                {len(itens_html)}")
    linhas.append(f"Correspondências confirmadas: {len(confirmadas)}")
    linhas.append(f"Correspondências prováveis:   {len(provaveis)}")
    linhas.append(f"Revisão manual:               {len(revisao)}")
    linhas.append(f"Não encontradas:              {len(nao_encontradas)}")
    linhas.append("=" * 60)

    with open(RELATORIO_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(linhas))

    print(f"\n  [OK] Relatório: {RELATORIO_FILE}")

    # ── JSON ──
    auditoria = {
        "metadata": {
            "data_execucao": agora,
            "fonte_html": os.path.basename(HTML_FILE),
            "fonte_sinan": SINAN_URL,
            "total_itens_html": len(itens_html),
            "total_itens_sinan": len(indice_sinan),
        },
        "correspondencias": []
    }

    for c in correspondencias:
        entry = {
            "nome_html": c["nome_html"],
            "classificacao_html": c.get("classificacao", ""),
            "status": c["status"],
            "confianca": c["confianca"],
        }
        if c.get("nome_sinan"):
            entry["nome_sinan"] = c["nome_sinan"]
        if c.get("url_sinan"):
            entry["url_sinan"] = c["url_sinan"]
        if c.get("possiveis"):
            entry["possiveis_sinan"] = []
            for p in c["possiveis"]:
                if isinstance(p, tuple):
                    entry["possiveis_sinan"].append({
                        "nome": p[0]["nome"],
                        "url": p[0]["url"],
                        "score": p[1]
                    })
                elif isinstance(p, dict):
                    entry["possiveis_sinan"].append({
                        "nome": p["nome"],
                        "url": p["url"]
                    })
        auditoria["correspondencias"].append(entry)

    with open(AUDITORIA_JSON, "w", encoding="utf-8") as f:
        json.dump(auditoria, f, ensure_ascii=False, indent=2)

    print(f"  [OK] Auditoria JSON: {AUDITORIA_JSON}")

    return {
        "confirmadas": len(confirmadas),
        "provaveis": len(provaveis),
        "revisao": len(revisao),
        "nao_encontradas": len(nao_encontradas),
    }


# ── Main ─────────────────────────────────────────────────
def main():
    print("=" * 60)
    print("FASE 1 — AUDITORIA DE CORRESPONDÊNCIA")
    print("notificacao-compulsoria.html ↔ SINAN")
    print("=" * 60)

    # 1. Extrair itens do HTML
    print("\n[1/3] Extraindo itens do HTML...")
    itens_html = extrair_itens_do_html(HTML_FILE)
    print(f"  [OK] {len(itens_html)} itens encontrados no HTML")

    imediatas = sum(1 for i in itens_html if "Imediata" in i.get("classificacao", ""))
    semanais = sum(1 for i in itens_html if "Semanal" in i.get("classificacao", ""))
    print(f"       Imediatas: {imediatas}")
    print(f"       Semanais:  {semanais}")

    # 2. Construir índice SINAN
    print("\n[2/3] Construindo índice do SINAN...")
    indice_sinan = construir_indice_sinan()

    if not indice_sinan:
        print("\n  [ERRO] Não foi possível obter links do SINAN.")
        print("  Verifique a conexão com a internet e tente novamente.")
        return

    # 3. Correspondência
    print("\n[3/3] Realizando correspondência...")
    correspondencias = []

    for i, item in enumerate(itens_html, 1):
        resultado = encontrar_correspondencia(item, indice_sinan)

        if resultado[1] == "REVISAO_MANUAL":
            possiveis = resultado[0]  # lista de (entry, score)
            correspondencias.append({
                "nome_html": item["nome"],
                "classificacao": item["classificacao"],
                "nome_sinan": possiveis[0][0]["nome"] if possiveis else "",
                "url_sinan": possiveis[0][0]["url"] if possiveis else "",
                "status": "REVISAO_MANUAL",
                "confianca": "BAIXA",
                "possiveis": possiveis,
            })
        elif resultado[1] == "NAO_ENCONTRADA":
            correspondencias.append({
                "nome_html": item["nome"],
                "classificacao": item["classificacao"],
                "nome_sinan": "",
                "url_sinan": "",
                "status": "NAO_ENCONTRADA",
                "confianca": "N/A",
            })
        else:
            entry, status, confianca = resultado
            correspondencias.append({
                "nome_html": item["nome"],
                "classificacao": item["classificacao"],
                "nome_sinan": entry["nome"],
                "url_sinan": entry["url"],
                "status": status,
                "confianca": confianca,
            })

        # Progresso
        if i % 10 == 0:
            print(f"  ... {i}/{len(itens_html)} processados")

        time.sleep(0.05)  # Pequena pausa

    print(f"  [OK] {len(correspondencias)} correspondências processadas")

    # 4. Gerar relatório
    print("\n[4/4] Gerando relatórios...")
    resumo = gerar_relatorio(itens_html, correspondencias, indice_sinan)

    # 5. Resumo final
    print("\n" + "=" * 60)
    print("RESULTADO DA AUDITORIA")
    print(f"Itens encontrados no HTML: {len(itens_html)}")
    print()
    print(f"Correspondências confirmadas: {resumo['confirmadas']}")
    print(f"Correspondências prováveis:   {resumo['provaveis']}")
    print(f"Revisão manual:               {resumo['revisao']}")
    print(f"Não encontradas:              {resumo['nao_encontradas']}")
    print()
    print(f"Relatório: {RELATORIO_FILE}")
    print(f"Auditoria JSON: {AUDITORIA_JSON}")
    print("=" * 60)


if __name__ == "__main__":
    main()
