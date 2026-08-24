"""SEO manager — Etapa 4.

Ajusta URLs do idioma em canonical, og:url e twitter:url. Idempotente:
se o caminho já começa com `/{idioma}/`, nada é alterado.
"""

import re

from automacoes.translation import config

_DOMINIO_ESCAPADO = re.escape(config.DOMINIO)

_PADRAO_CANONICAL = re.compile(
    r'(<link\s+'
    r'(?=[^>]*\brel="canonical")'
    r'[^>]*\bhref="' + _DOMINIO_ESCAPADO + r'/)([^"]*)"',
    re.IGNORECASE,
)


def _padrao_meta(atributo):
    """Meta com name/property específico, ordem de atributos independente."""
    return re.compile(
        r'(<meta\s+(?=[^>]*\b' + re.escape(atributo) + r')'
        r'[^>]*\bcontent="' + _DOMINIO_ESCAPADO + r'/)([^"]*)"',
        re.IGNORECASE,
    )


def _sub_url(idioma_destino):
    def _substituir(m):
        caminho = m.group(2)
        if caminho.startswith(f"{idioma_destino}/"):
            return m.group(0)  # já ajustado — idempotente
        return f'{m.group(1)}{idioma_destino}/{"" if not caminho else caminho}"'
    return _substituir


def aplicar(html, idioma_destino):
    """Ajusta canonical + og:url + twitter:url para a pasta do idioma."""
    html = _PADRAO_CANONICAL.sub(_sub_url(idioma_destino), html)

    for atributo in ('property="og:url"', 'name="twitter:url"'):
        html = _padrao_meta(atributo).sub(_sub_url(idioma_destino), html)

    return html
