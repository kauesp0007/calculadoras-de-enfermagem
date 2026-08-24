"""Extrator de SEO: title e meta description/keywords/og/twitter.

Apenas os valores textuais dos atributos content viram unidades.
URLs (og:url, twitter:url, canonical) são tratadas pelos managers em Python.
"""

import re

from automacoes.translation.extractor import UnidadeTraduzivel

PADRAO_META_SEO = re.compile(
    r'<meta\s+'
    r'(?=[^>]*\b(?:name|property)="(description|keywords|og:title|og:description|twitter:title|twitter:description)")'
    r'[^>]*/?>',
    re.IGNORECASE,
)

MAPA_TIPO = {
    "description": "meta_description",
    "keywords": "meta_keywords",
    "og:title": "og_title",
    "og:description": "og_description",
    "twitter:title": "twitter_title",
    "twitter:description": "twitter_description",
}


def extrair_unidades_seo(html_protegido, idioma_destino="en", prefixo="seo"):
    """Extrai os conteúdos das meta tags de SEO como unidades traduzíveis."""
    unidades = []
    for m in PADRAO_META_SEO.finditer(html_protegido):
        tag = m.group(0)
        nome = m.group(1).lower()
        cm = re.search(r'\bcontent="([^"]*)"', tag, re.IGNORECASE)
        if not cm:
            continue
        valor = cm.group(1).strip()
        if not valor:
            continue
        inicio = m.start() + cm.start(1)
        fim = m.start() + cm.end(1)
        u = UnidadeTraduzivel(
            f"{prefixo}_{len(unidades)}", MAPA_TIPO.get(nome, "meta"), "meta",
            valor, idioma_destino=idioma_destino,
            extra={"inicio": inicio, "fim": fim, "tipo_substituicao": "atributo"},
        )
        unidades.append(u)
    return unidades
