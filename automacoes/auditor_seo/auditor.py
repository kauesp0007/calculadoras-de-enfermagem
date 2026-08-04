"""Auditor: analisa e gera plano de correção para cada arquivo."""

import json
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional

from .head_parser import HeadParser
from .url_resolver import resolver_url, resolver_urls_hreflang, extrair_nome_arquivo
from .config import IDIOMAS
from .logger import get_logger

log = get_logger("auditor")


@dataclass
class PlanoCorrecao:
    """Plano de correções para um arquivo HTML."""

    caminho: Path
    url_correta: str = ""
    urls_hreflang: dict = field(default_factory=dict)

    # Correções
    canonical_corrigir: bool = False
    canonical_novo: str = ""
    canonical_adicionar: bool = False

    og_url_corrigir: bool = False
    og_url_novo: str = ""

    twitter_url_corrigir: bool = False
    twitter_url_novo: str = ""
    twitter_url_adicionar: bool = False

    hreflangs_corrigir: list = field(default_factory=list)  # [(lang, novo_href)]
    hreflangs_adicionar: list = field(default_factory=list)

    jsonld_corrigir: bool = False
    jsonld_campos: dict = field(default_factory=dict)  # {campo: novo_valor}
    jsonld_adicionar: bool = False

    tem_alteracoes: bool = False

    # Diagnóstico
    encontrados: list = field(default_factory=list)
    corrigidos: list = field(default_factory=list)
    adicionados: list = field(default_factory=list)
    ignorados: list = field(default_factory=list)
    motivos: list = field(default_factory=list)


def auditar_arquivo(caminho: Path) -> PlanoCorrecao:
    """Analisa um arquivo HTML e gera o plano de correção.

    Args:
        caminho: Caminho absoluto do arquivo .html.

    Returns:
        PlanoCorrecao com todas as alterações necessárias.
    """
    plano = PlanoCorrecao(caminho=caminho)
    parser = HeadParser(caminho)

    # URL correta da página
    plano.url_correta = resolver_url(caminho)
    nome_arquivo = extrair_nome_arquivo(caminho)
    plano.urls_hreflang = resolver_urls_hreflang(nome_arquivo)

    # ── 1. Canonical ─────────────────────────────────────────────────
    atual = parser.get_canonical()
    if atual:
        plano.encontrados.append("canonical")
        if atual != plano.url_correta:
            plano.canonical_corrigir = True
            plano.canonical_novo = plano.url_correta
            plano.corrigidos.append("canonical")
            plano.motivos.append(f"canonical: {atual} → {plano.url_correta}")
            plano.tem_alteracoes = True
        else:
            plano.ignorados.append("canonical (já correto)")
    else:
        plano.canonical_adicionar = True
        plano.canonical_novo = plano.url_correta
        plano.adicionados.append("canonical")
        plano.motivos.append(f"canonical: ADICIONADO = {plano.url_correta}")
        plano.tem_alteracoes = True

    # ── 2. OG:URL ────────────────────────────────────────────────────
    atual = parser.get_og_url()
    if atual:
        plano.encontrados.append("og:url")
        if atual != plano.url_correta:
            plano.og_url_corrigir = True
            plano.og_url_novo = plano.url_correta
            plano.corrigidos.append("og:url")
            plano.motivos.append(f"og:url: {atual} → {plano.url_correta}")
            plano.tem_alteracoes = True
        else:
            plano.ignorados.append("og:url (já correto)")
    else:
        # og:url ausente não é adicionado — muitas páginas podem não ter OG
        plano.ignorados.append("og:url (ausente — não adicionado)")

    # ── 3. Twitter:URL ───────────────────────────────────────────────
    atual = parser.get_twitter_url()
    if atual:
        plano.encontrados.append("twitter:url")
        if atual != plano.url_correta:
            plano.twitter_url_corrigir = True
            plano.twitter_url_novo = plano.url_correta
            plano.corrigidos.append("twitter:url")
            plano.motivos.append(f"twitter:url: {atual} → {plano.url_correta}")
            plano.tem_alteracoes = True
        else:
            plano.ignorados.append("twitter:url (já correto)")
    else:
        # Só adiciona twitter:url se a página já tem twitter:card
        if parser.encontrar_linha("name=\"twitter:card\"") >= 0:
            plano.twitter_url_adicionar = True
            plano.twitter_url_novo = plano.url_correta
            plano.adicionados.append("twitter:url")
            plano.motivos.append(f"twitter:url: ADICIONADO = {plano.url_correta}")
            plano.tem_alteracoes = True

    # ── 4. Hreflang ──────────────────────────────────────────────────
    existentes = parser.get_hreflangs()
    plano.encontrados.append(f"hreflang ({len(existentes)})")

    for lang_code, url_esperada in plano.urls_hreflang.items():
        if lang_code in existentes:
            if existentes[lang_code] != url_esperada:
                plano.hreflangs_corrigir.append((lang_code, url_esperada))
                plano.corrigidos.append(f"hreflang:{lang_code}")
                plano.motivos.append(f"hreflang {lang_code}: {existentes[lang_code]} → {url_esperada}")
                plano.tem_alteracoes = True
        else:
            plano.hreflangs_adicionar.append((lang_code, url_esperada))
            plano.adicionados.append(f"hreflang:{lang_code}")
            plano.motivos.append(f"hreflang {lang_code}: ADICIONADO = {url_esperada}")
            plano.tem_alteracoes = True

    # ── 5. JSON-LD ───────────────────────────────────────────────────
    jsonld = parser.get_jsonld_parsed()
    if jsonld:
        plano.encontrados.append("json-ld")
        campos_url = _extrair_campos_url_jsonld(jsonld)

        for campo, valor_atual in campos_url.items():
            if valor_atual and valor_atual != plano.url_correta:
                plano.jsonld_campos[campo] = plano.url_correta
                plano.corrigidos.append(f"jsonld:{campo}")
                plano.motivos.append(f"jsonld {campo}: {valor_atual} → {plano.url_correta}")
                plano.tem_alteracoes = True

    return plano


def _extrair_campos_url_jsonld(obj, prefixo: str = "") -> dict:
    """Extrai recursivamente campos 'url' e 'mainEntityOfPage' de um JSON-LD.

    Suporta tanto estrutura simples quanto @graph.
    """
    resultados = {}

    if isinstance(obj, dict):
        if "url" in obj:
            resultados[f"{prefixo}url"] = obj["url"]
        if "mainEntityOfPage" in obj:
            mep = obj["mainEntityOfPage"]
            if isinstance(mep, dict) and "@id" in mep:
                resultados[f"{prefixo}mainEntityOfPage"] = mep["@id"]
            elif isinstance(mep, str):
                resultados[f"{prefixo}mainEntityOfPage"] = mep

        # Se tem @graph, itera sobre os itens
        if "@graph" in obj and isinstance(obj["@graph"], list):
            for i, item in enumerate(obj["@graph"]):
                sub = _extrair_campos_url_jsonld(item, f"@graph[{i}].")
                resultados.update(sub)

    return resultados
