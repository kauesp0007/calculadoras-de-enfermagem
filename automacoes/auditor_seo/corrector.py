"""Corretor "Replace In Place" — modifica HTML sem reconstruí-lo.

Estratégia:
    1. Lê o HTML como string
    2. Localiza o trecho exato a modificar (por posição de linha ou regex cirúrgico)
    3. Substitui APENAS o atributo/valor necessário
    4. NUNCA usa soup.prettify() ou reconstrói o documento
"""

import re
import json
from pathlib import Path

from .head_parser import HeadParser
from .auditor import PlanoCorrecao
from .logger import get_logger

log = get_logger("corrector")


def aplicar_correcoes(plano: PlanoCorrecao) -> str:
    """Aplica todas as correções do plano ao HTML.

    Trabalha diretamente com o HTML como string, modificando
    apenas os trechos necessários via string replacement.

    Args:
        plano: PlanoCorrecao gerado pelo auditor.

    Returns:
        HTML corrigido como string.
    """
    html = plano.caminho.read_text(encoding="utf-8")
    parser = HeadParser(plano.caminho)
    linhas = html.split("\n")

    # ── 1. Canonical ─────────────────────────────────────────────────
    if plano.canonical_corrigir:
        html = _substituir_atributo(html, "canonical", "href",
                                     parser.get_canonical(), plano.canonical_novo)

    if plano.canonical_adicionar:
        linha = parser.posicao_para_canonical()
        indent = parser.get_indentacao(linha) if linha >= 0 else "  "
        nova_linha = f'{indent}<link href="{plano.canonical_novo}" rel="canonical"/>'
        linhas = html.split("\n")
        linhas.insert(linha, nova_linha)
        html = "\n".join(linhas)

    # ── 2. OG:URL ────────────────────────────────────────────────────
    if plano.og_url_corrigir:
        html = _substituir_atributo(html, "og:url", "content",
                                     parser.get_og_url(), plano.og_url_novo)

    # ── 3. Twitter:URL ───────────────────────────────────────────────
    if plano.twitter_url_corrigir:
        html = _substituir_atributo(html, "twitter:url", "content",
                                     parser.get_twitter_url(), plano.twitter_url_novo)

    if plano.twitter_url_adicionar:
        linha = parser.posicao_para_twitter_url()
        if linha >= 0:
            indent = parser.get_indentacao(linha - 1) if linha > 0 else ""
            nova_linha = f'{indent}<meta content="{plano.twitter_url_novo}" name="twitter:url"/>'
            linhas = html.split("\n")
            linhas.insert(linha, nova_linha)
            html = "\n".join(linhas)

    # ── 4. Hreflang ──────────────────────────────────────────────────
    for lang_code, novo_href in plano.hreflangs_corrigir:
        html = _substituir_hreflang(html, lang_code, novo_href)

    for lang_code, novo_href in plano.hreflangs_adicionar:
        linha = parser.posicao_para_hreflang()
        if linha >= 0:
            indent = parser.get_indentacao(linha) if linha < len(linhas) else "  "
            nova_linha = f'{indent}<link href="{novo_href}" hreflang="{lang_code}" rel="alternate"/>'
            linhas = html.split("\n")
            # Insere após o último hreflang existente
            ultima_linha_hreflang = linha
            for i in range(linha, len(linhas)):
                if 'hreflang="' in linhas[i] and 'rel="alternate"' in linhas[i]:
                    ultima_linha_hreflang = i
            linhas.insert(ultima_linha_hreflang + 1, nova_linha)
            html = "\n".join(linhas)

    # ── 5. JSON-LD ───────────────────────────────────────────────────
    if plano.jsonld_campos:
        jsonld_raw = parser.get_jsonld()
        if jsonld_raw:
            try:
                data = json.loads(jsonld_raw)
                for campo, novo_valor in plano.jsonld_campos.items():
                    _set_jsonld_campo(data, campo, novo_valor)
                novo_jsonld = json.dumps(data, indent=2, ensure_ascii=False)
                # Preserva indentação original (2 spaces)
                html = html.replace(jsonld_raw, novo_jsonld, 1)
            except (json.JSONDecodeError, Exception) as e:
                log.error("Erro ao modificar JSON-LD de %s: %s", plano.caminho.name, e)

    return html


def _substituir_atributo(html: str, elemento: str, atributo: str,
                          valor_antigo: str, valor_novo: str) -> str:
    """Substitui um atributo específico em um elemento do HTML.

    Usa regex cirúrgica ancorada no tipo de elemento (canonical, og:url,
    twitter:url) para evitar dupla-substituição quando dois elementos
    compartilham o mesmo valor antigo (ex: canonical e og:url ambos
    apontando para a raiz do domínio).

    Estratégia:
        1. Localiza a tag completa pelo identificador único (rel="canonical",
           property="og:url", name="twitter:url").
        2. Faz string replace do valor antigo → novo APENAS dentro dessa tag.
        3. Substitui a tag antiga pela nova no HTML completo.
    """
    if not valor_antigo or valor_antigo == valor_novo:
        return html

    if elemento == "canonical":
        # <link ... rel="canonical" ... href="OLD" ... >
        regex = re.compile(
            r'<link\b[^>]*?\brel\s*=\s*"canonical"[^>]*?>',
            re.IGNORECASE
        )
        match = regex.search(html)
        if match:
            old_tag = match.group(0)
            new_tag = old_tag.replace(
                f'{atributo}="{valor_antigo}"', f'{atributo}="{valor_novo}"'
            )
            return html.replace(old_tag, new_tag, 1)

    elif elemento in ("og:url", "twitter:url"):
        prop_attr = "property" if elemento == "og:url" else "name"
        regex = re.compile(
            r'<meta\b[^>]*?\b' + prop_attr + r'\s*=\s*"'
            + re.escape(elemento) + r'"[^>]*?>',
            re.IGNORECASE
        )
        match = regex.search(html)
        if match:
            old_tag = match.group(0)
            new_tag = old_tag.replace(
                f'{atributo}="{valor_antigo}"', f'{atributo}="{valor_novo}"'
            )
            return html.replace(old_tag, new_tag, 1)

    # Fallback: substituição simples (para outros elementos)
    return html.replace(valor_antigo, valor_novo, 1)
    return novo_html


def _substituir_hreflang(html: str, lang: str, novo_href: str) -> str:
    """Substitui o href de um hreflang específico."""
    # Padrão: hreflang="<lang>" ... href="<url>"
    padrao = re.compile(
        rf'(hreflang="{re.escape(lang)}"[^>]*href=")([^"]*)(")',
        re.IGNORECASE,
    )
    match = padrao.search(html)
    if match:
        url_antiga = match.group(2)
        if url_antiga != novo_href:
            return html[:match.start(2)] + novo_href + html[match.end(2):]
    return html


def _set_jsonld_campo(obj, caminho: str, valor: str):
    """Define um campo no JSON-LD pelo caminho (ex: '@graph[2].url')."""
    partes = caminho.split(".")
    atual = obj

    for parte in partes[:-1]:
        if parte.startswith("@graph[") and isinstance(atual, dict):
            idx = int(parte[7:-1])
            atual = atual["@graph"][idx]
        elif parte in atual:
            atual = atual[parte]

    ultimo = partes[-1]
    if ultimo == "mainEntityOfPage":
        if isinstance(atual.get("mainEntityOfPage"), dict):
            atual["mainEntityOfPage"]["@id"] = valor
        else:
            atual["mainEntityOfPage"] = valor
    elif ultimo == "url":
        atual["url"] = valor
