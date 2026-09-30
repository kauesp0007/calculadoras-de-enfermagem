"""Hreflang manager — Etapa 4.

Reconstrói o bloco canonical + hreflang de forma determinística e completa:

    canonical (idioma alvo) → pt-br → 18 idiomas → x-default

Adiciona as tags de idioma que estiverem faltando no HTML traduzido,
garantindo o cluster hreflang completo mesmo quando o arquivo de origem
está incompleto.
"""

import re

from automacoes.translation import config

_DOMINIO_ESCAPADO = re.escape(config.DOMINIO)

_PADRAO_CANONICAL = re.compile(
    r'<link\s+[^>]*\brel="canonical"[^>]*/?>',
    re.IGNORECASE,
)

_PADRAO_HREFLANG = re.compile(
    r'<link\s+[^>]*\bhreflang="([^"]*)"[^>]*/?>',
    re.IGNORECASE,
)

_PADRAO_HREF = re.compile(
    r'\bhref="' + _DOMINIO_ESCAPADO + r'/([^"]*)"',
    re.IGNORECASE,
)


def _tag(url, lang=None):
    if lang:
        return f'<link href="{url}" hreflang="{lang}" rel="alternate"/>'
    return f'<link href="{url}" rel="canonical"/>'


def _extrair_pagina(matches_hreflang):
    """Extrai o caminho da página (sem o prefixo de idioma) das tags hreflang."""
    for m in matches_hreflang:
        tag = m.group(0)
        hm = _PADRAO_HREF.search(tag)
        if not hm:
            continue
        partes = hm.group(1).split("/")
        if partes and partes[0].lower() in config.IDIOMAS_SUPORTADOS:
            partes = partes[1:]
        if partes:
            return "/".join(partes)
    return None


def aplicar(html, idioma_destino):
    """Constrói o bloco canonical + hreflang completo e determinístico."""
    m_canonical = _PADRAO_CANONICAL.search(html)
    ms_hreflang = list(_PADRAO_HREFLANG.finditer(html))
    if m_canonical is None or not ms_hreflang:
        return html

    pagina = _extrair_pagina(ms_hreflang)
    if not pagina:
        return html

    inicio = m_canonical.start()
    fim = max(m.end() for m in ms_hreflang)

    eol = "\r\n" if "\r\n" in html else "\n"

    linhas = [
        _tag(f"{config.DOMINIO}/{idioma_destino}/{pagina}"),
        _tag(f"{config.DOMINIO}/{pagina}", lang="pt-br"),
    ]
    for idioma in config.IDIOMAS_SUPORTADOS:
        linhas.append(_tag(f"{config.DOMINIO}/{idioma}/{pagina}", lang=idioma))
    linhas.append(_tag(f"{config.DOMINIO}/{pagina}", lang="x-default"))

    bloco = eol.join(linhas)
    return html[:inicio] + bloco + html[fim:]
