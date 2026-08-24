"""Hreflang manager — Etapa 4.

Move a tag <link rel="alternate" hreflang="IDIOMA"> do idioma de destino
para o topo do bloco hreflang (mesmo comportamento do tradutor legado).
"""

import re

_PADRAO_HREFLANG = re.compile(
    r'<link\s+'
    r'(?=[^>]*\brel="alternate")'
    r'(?=[^>]*\bhreflang="([^"]*)")'
    r'[^>]*\bhref="([^"]*)"'
    r'[^>]*/?>',
    re.IGNORECASE,
)


def aplicar(html, idioma_destino):
    """Reordena o bloco hreflang colocando o idioma alvo primeiro."""
    matches = list(_PADRAO_HREFLANG.finditer(html))
    if not matches:
        return html

    inicio_bloco = matches[0].start()
    fim_bloco = matches[-1].end()
    tags = [m.group(0) for m in matches]

    tag_alvo = None
    restantes = []
    for tag in tags:
        if f'hreflang="{idioma_destino}"' in tag.lower():
            tag_alvo = tag
        else:
            restantes.append(tag)

    if tag_alvo is None:
        return html

    bloco_novo = "\n    ".join([tag_alvo] + restantes)
    return html[:inicio_bloco] + bloco_novo + html[fim_bloco:]
