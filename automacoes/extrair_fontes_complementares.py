#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FASE 3.3 — EXTRAÇÃO DAS FONTES COMPLEMENTARES
===============================================
Extrai dados brutos das 11 fontes complementares (MS Saúde de A a Z,
VISAT, ESAVI, CIEVS, SVSA) para entidades sem SINAN nem CVE-SP.

Saída:
- automacoes/dados_fontes_complementares_brutos.json
- automacoes/relatorio_extracao_fontes_complementares.txt
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


# ============================================================
# CONFIGURAÇÃO
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CORR_FONTES = os.path.join(BASE_DIR, "correspondencias_fontes_complementares.json")
SAIDA_JSON = os.path.join(BASE_DIR, "dados_fontes_complementares_brutos.json")
SAIDA_TXT = os.path.join(BASE_DIR, "relatorio_extracao_fontes_complementares.txt")

TIMEOUT = 30
RETRIES = 2
DELAY = 1.5

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)


def criar_ssl_context():
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return ctx


# ============================================================
# HTML PARSER
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
        return raw.strip()


# ============================================================
# PARSER DE SEÇÕES (adaptado para gov.br)
# ============================================================

SECOES_GOVBR = [
    (r'(?:descri[çc][ãa]o|o\s+que\s+(?:é|s[ãa]o)|defini[çc][ãa]o|apresenta[çc][ãa]o|introdu[çc][ãa]o)', "descricao"),
    (r'(?:causas?\s+e\s+fatores\s+de\s+risco|causas?|fatores\s+de\s+risco|etiologia)', "causas"),
    (r'(?:agente\s+(?:causador|etiol[óo]gico)|pat[óo]geno)', "agente_causador"),
    (r'(?:transmiss[aã]o|forma\s+de\s+transmiss[aã]o|como\s+se\s+transmite)', "forma_de_transmissao"),
    (r'(?:per[íi]odo\s+de\s+incuba[çc][ãa]o|incuba[çc][ãa]o)', "periodo_de_incubacao"),
    (r'(?:sinais?\s+e\s+sintomas|sintomas|manifesta[çc][õo]es|quadro\s+cl[íi]nico)', "sinais_e_sintomas"),
    (r'(?:diagn[óo]stico)', "diagnostico"),
    (r'(?:tratamento|tratamento\s+e\s+acompanhamento|conduta)', "tratamento"),
    (r'(?:preven[çc][ãa]o|medidas\s+preventivas|profilaxia)', "medidas_preventivas"),
    (r'(?:vacina[çc][ãa]o)', "vacinacao"),
    (r'(?:vigil[âa]ncia|vigil[âa]ncia\s+em\s+sa[úu]de|monitoramento)', "vigilancia"),
    (r'(?:no\s+brasil|epidemiologia|dados\s+epidemiol[óo]gicos|situa[çc][ãa]o)', "epidemiologia"),
    (r'(?:incid[eê]ncia)', "incidencia"),
    (r'(?:preval[eê]ncia)', "prevalencia"),
    (r'(?:complica[çc][õo]es)', "complicacoes"),
    (r'(?:notifica[çc][ãa]o|notifica[çc][ãa]o\s+compuls[óo]ria)', "notificacao"),
    (r'(?:atendimento|acesso|servi[çc]os)', "atendimento"),
    (r'(?:mais\s+informa[çc][õo]es|saiba\s+mais)', "mais_informacoes"),
]


def extrair_secoes_govbr(texto):
    """Extrai seções do texto de páginas gov.br."""
    dados = {}
    linhas = texto.split("\n")
    secao_atual = None
    conteudo_secoes = {}

    for linha in linhas:
        linha_strip = linha.strip()
        if not linha_strip:
            continue

        linha_lower = linha_strip.lower()
        encontrou = False
        for padrao, campo in SECOES_GOVBR:
            if re.search(rf'^{padrao}\s*$', linha_lower):
                secao_atual = campo
                conteudo_secoes[secao_atual] = []
                encontrou = True
                break

        if not encontrou and secao_atual:
            conteudo_secoes[secao_atual].append(linha_strip)

    for campo, linhas_conteudo in conteudo_secoes.items():
        dados[campo] = " ".join(linhas_conteudo).strip()

    # Fallback: se não encontrou seções, guarda primeiros parágrafos como descricao
    if not dados and texto.strip():
        paragrafos = [p.strip() for p in texto.split("\n\n") if len(p.strip()) > 50]
        if paragrafos:
            dados["descricao"] = "\n\n".join(paragrafos[:15])
            dados["observacoes"] = "Conteúdo extraído como texto contínuo — sem seções identificadas"

    # Guarda texto completo (limitado)
    dados["_conteudo_bruto"] = texto[:5000]
    return dados


# ============================================================
# HTTP
# ============================================================

def baixar_pagina(url, ssl_context):
    if not url:
        return None, None, "URL vazia"

    for tentativa in range(RETRIES + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=TIMEOUT, context=ssl_context) as resp:
                final_url = resp.geturl()
                status = resp.getcode()
                content_type = resp.headers.get("Content-Type", "")
                raw = resp.read()

                encoding = "utf-8"
                if "charset=" in content_type.lower():
                    try:
                        encoding = content_type.lower().split("charset=")[-1].split(";")[0].strip()
                    except Exception:
                        pass

                html = raw.decode(encoding, errors="replace")
                titulo_match = re.search(r'<title>(.*?)</title>', html, re.IGNORECASE | re.DOTALL)
                titulo = titulo_match.group(1).strip() if titulo_match else None

                return html, titulo, None

        except urllib.error.HTTPError as e:
            erro = f"HTTP {e.code}: {e.reason}"
            if tentativa < RETRIES:
                time.sleep(2)
                continue
            return None, None, erro
        except Exception as e:
            erro = f"{type(e).__name__}: {str(e)[:150]}"
            if tentativa < RETRIES:
                time.sleep(2)
                continue
            return None, None, erro

    return None, None, "Falha após retries"


# ============================================================
# MAIN
# ============================================================

def main():
    print("=" * 70)
    print("FASE 3.3 — EXTRAÇÃO DAS FONTES COMPLEMENTARES")
    print("=" * 70)
    print()

    ssl_context = criar_ssl_context()

    # Carregar correspondências
    print("[1/3] Carregando correspondências...")
    with open(CORR_FONTES, "r", encoding="utf-8") as f:
        corr = json.load(f)

    entidades_fonte = corr["entidades"]
    print(f"  [OK] {len(entidades_fonte)} entidades carregadas")
    print()

    # Filtrar apenas CONFIRMADA_DIRETA e CONFIRMADA_CATEGORIA
    para_extrair = [e for e in entidades_fonte
                    if e["fonte_complementar"]["tipo_correspondencia"]
                    in ("CONFIRMADA_DIRETA", "CONFIRMADA_CATEGORIA")]

    print(f"[2/3] Extraindo {len(para_extrair)} fontes...")
    print()

    resultados = []
    erros = []
    sucessos = 0

    for i, entidade in enumerate(para_extrair):
        nome = entidade["nome"]
        fc = entidade["fonte_complementar"]
        url = fc.get("url")
        tipo = fc["tipo_correspondencia"]
        instituicao = fc.get("instituicao", "")

        print(f"  [{i+1:2d}/{len(para_extrair)}] {nome[:55]}")

        if not url:
            resultados.append({
                "nome": nome,
                "tipo_correspondencia": tipo,
                "instituicao": instituicao,
                "url": None,
                "titulo_fonte": None,
                "extracao": {"status": "SEM_URL", "data": datetime.now().isoformat(), "conteudo_bruto": None},
                "dados": None,
                "erro": "URL não fornecida",
            })
            erros.append({"entidade": nome, "erro": "URL não fornecida"})
            print(f"       ⚠️ SEM URL")
            continue

        html, titulo, erro = baixar_pagina(url, ssl_context)

        if erro:
            resultados.append({
                "nome": nome,
                "tipo_correspondencia": tipo,
                "instituicao": instituicao,
                "url": url,
                "titulo_fonte": titulo,
                "extracao": {"status": "ERRO", "data": datetime.now().isoformat(), "conteudo_bruto": None},
                "dados": None,
                "erro": erro,
            })
            erros.append({"entidade": nome, "url": url, "erro": erro})
            print(f"       ⚠️ {erro[:80]}")
            continue

        # Extrair texto
        parser = ExtratorTextoHTML()
        parser.feed(html)
        texto = parser.obter_texto()

        if not texto or len(texto) < 50:
            resultados.append({
                "nome": nome,
                "tipo_correspondencia": tipo,
                "instituicao": instituicao,
                "url": url,
                "titulo_fonte": titulo,
                "extracao": {"status": "VAZIO", "data": datetime.now().isoformat(), "conteudo_bruto": None},
                "dados": None,
                "erro": "Conteúdo vazio ou insuficiente",
            })
            erros.append({"entidade": nome, "url": url, "erro": "Conteúdo vazio"})
            print(f"       ⚠️ Conteúdo vazio")
            continue

        # Parsear seções
        dados = extrair_secoes_govbr(texto)

        # Limpar dados
        dados_limpos = {}
        campos_encontrados = []
        for k, v in dados.items():
            if k.startswith("_"):
                continue
            if v and isinstance(v, str) and v.strip():
                dados_limpos[k] = v.strip()[:4000]
                campos_encontrados.append(k)
            elif v:
                dados_limpos[k] = v

        sucessos += 1
        print(f"       ✅ {len(texto)} caracteres | Campos: {', '.join(campos_encontrados[:5])}")

        resultados.append({
            "nome": nome,
            "tipo_correspondencia": tipo,
            "instituicao": instituicao,
            "url": url,
            "titulo_fonte": titulo,
            "extracao": {
                "status": "SUCESSO",
                "data": datetime.now().isoformat(),
                "conteudo_bruto": dados.get("_conteudo_bruto", texto[:5000]),
            },
            "dados": dados_limpos,
            "erro": None,
        })

        if i < len(para_extrair) - 1:
            time.sleep(DELAY)

    print()
    print(f"  [OK] {sucessos} extraídas, {len(erros)} erros")
    print()

    # Adicionar Disseminação Intencional (sem fonte)
    disseminacao = [e for e in entidades_fonte
                    if e["fonte_complementar"]["tipo_correspondencia"] == "REVISÃO_MANUAL"]
    for ent in disseminacao:
        resultados.append({
            "nome": ent["nome"],
            "tipo_correspondencia": "REVISÃO_MANUAL",
            "instituicao": None,
            "url": None,
            "titulo_fonte": None,
            "extracao": {"status": "SEM_FONTE_ESPECIFICA", "data": datetime.now().isoformat(), "conteudo_bruto": None},
            "dados": None,
            "erro": None,
        })

    # Gerar JSON
    print("[3/3] Gerando arquivos...")

    # Coletar todos os campos encontrados
    todos_campos = set()
    for r in resultados:
        if r.get("dados"):
            for k in r["dados"]:
                todos_campos.add(k)

    json_output = {
        "metadata": {
            "fase": "FASE 3.3",
            "descricao": "Dados brutos extraídos de fontes oficiais complementares",
            "fonte": "Ministério da Saúde — gov.br/saude (Saúde de A a Z, VISAT, ESAVI, CIEVS, SVSA)",
            "total_previstas": len(para_extrair),
            "total_extraidas": sucessos,
            "total_erros": len(erros),
            "total_sem_fonte": len(disseminacao),
            "data_extracao": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        },
        "entidades": resultados,
    }

    with open(SAIDA_JSON, "w", encoding="utf-8") as f:
        json.dump(json_output, f, ensure_ascii=False, indent=2)
    print(f"  [OK] {SAIDA_JSON}")

    # Gerar TXT
    linhas = []
    linhas.append("=" * 70)
    linhas.append("FASE 3.3 — RELATÓRIO DE EXTRAÇÃO DE FONTES COMPLEMENTARES")
    linhas.append(f"Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    linhas.append("=" * 70)
    linhas.append("")
    linhas.append(f"Entidades previstas:    {len(para_extrair)}")
    linhas.append(f"Extraídas com sucesso:  {sucessos}")
    linhas.append(f"Erros:                  {len(erros)}")
    linhas.append(f"Páginas acessíveis:     {sucessos}")
    linhas.append(f"Páginas sem conteúdo útil: {len(erros)}")
    linhas.append("")
    linhas.append(f"Campos extraídos (total): {len(todos_campos)}")
    linhas.append(f"  {', '.join(sorted(todos_campos))}")
    linhas.append("")
    linhas.append("=" * 70)

    for r in resultados:
        linhas.append("")
        linhas.append(f"ENTIDADE: {r['nome']}")
        linhas.append(f"TIPO DE CORRESPONDÊNCIA: {r['tipo_correspondencia']}")
        linhas.append(f"INSTITUIÇÃO: {r['instituicao'] or '—'}")
        linhas.append(f"URL: {r['url'] or '—'}")
        linhas.append(f"TÍTULO: {r['titulo_fonte'] or '—'}")
        linhas.append(f"STATUS: {r['extracao']['status']}")

        if r.get("erro"):
            linhas.append(f"ERRO: {r['erro']}")

        if r.get("dados"):
            campos = [k for k in r["dados"] if not k.startswith("_")]
            linhas.append(f"CAMPOS ENCONTRADOS: {', '.join(campos)}")
            ausentes = [c for c in ["descricao", "agente_causador", "forma_de_transmissao",
                                     "periodo_de_incubacao", "sinais_e_sintomas", "diagnostico",
                                     "tratamento", "medidas_preventivas", "vacinacao"]
                        if c not in r["dados"]]
            if ausentes:
                linhas.append(f"CAMPOS AUSENTES: {', '.join(ausentes)}")
            linhas.append(f"CONTEÚDO EXTRAÍDO: {len(r['extracao'].get('conteudo_bruto', '') or '')} caracteres")
        else:
            linhas.append("CONTEÚDO EXTRAÍDO: —")

        if r["tipo_correspondencia"] == "CONFIRMADA_CATEGORIA":
            linhas.append("NOTA: Conteúdo extraído de fonte categorial; atribuição definitiva")
            linhas.append("      à entidade será realizada somente na FASE 4.")

        linhas.append("-" * 70)

    linhas.append("")
    linhas.append("=" * 70)
    linhas.append("FASE 3.3 CONCLUÍDA")
    linhas.append("=" * 70)

    with open(SAIDA_TXT, "w", encoding="utf-8") as f:
        f.write("\n".join(linhas))
    print(f"  [OK] {SAIDA_TXT}")
    print()

    # Resumo
    print("=" * 70)
    print("FASE 3.3 CONCLUÍDA")
    print(f"Entidades previstas: {len(para_extrair)}")
    print(f"Extraídas:           {sucessos}")
    print(f"Erros:               {len(erros)}")
    print(f"Sem fonte:           1 (Disseminação Intencional)")
    print(f"Campos extraídos:    {len(todos_campos)}")
    print()
    print(f"Arquivos:")
    print(f"  {SAIDA_JSON}")
    print(f"  {SAIDA_TXT}")
    print("=" * 70)


if __name__ == "__main__":
    main()
