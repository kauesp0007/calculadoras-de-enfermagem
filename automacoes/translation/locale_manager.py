"""Locale manager — Etapa 4.

Troca `<html lang="pt-BR">` pelo locale completo do idioma de destino
(ex.: "ko" → "ko-KR"). 100% determinístico, sem IA.
"""

import re

from automacoes.translation import config

_PADRAO_LANG = re.compile(r'<html\s+lang="pt-BR">', re.IGNORECASE)

# og:locale usa sublinhado (pt_BR, en_US, ...) e pode ter o content antes ou
# depois do property. Regex independente da ordem dos atributos.
_PADRAO_OG_LOCALE = re.compile(
    r'<meta\s+(?=[^>]*\bproperty="og:locale")'
    r'[^>]*\bcontent="([^"]*)"[^>]*/?>',
    re.IGNORECASE,
)


def _locale_underscore(idioma_destino):
    """Converte o locale (en-US → en_US) para o formato do og:locale."""
    return config.MAPA_LOCALES.get(idioma_destino, idioma_destino).replace("-", "_")


def aplicar(html, idioma_destino):
    """Atualiza o atributo lang da tag <html> e o meta og:locale."""
    locale = config.MAPA_LOCALES.get(idioma_destino, idioma_destino)
    html = _PADRAO_LANG.sub(f'<html lang="{locale}">', html)

    # og:locale deve refletir o idioma da própria página (não o da raiz).
    og_locale = _locale_underscore(idioma_destino)

    def _sub_og(m):
        return re.sub(
            r'content="[^"]*"',
            f'content="{og_locale}"',
            m.group(0),
            count=1,
            flags=re.IGNORECASE,
        )

    return _PADRAO_OG_LOCALE.sub(_sub_og, html)
