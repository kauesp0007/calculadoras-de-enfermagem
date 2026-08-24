"""Locale manager — Etapa 4.

Troca `<html lang="pt-BR">` pelo locale completo do idioma de destino
(ex.: "ko" → "ko-KR"). 100% determinístico, sem IA.
"""

import re

from automacoes.translation import config

_PADRAO_LANG = re.compile(r'<html\s+lang="pt-BR">', re.IGNORECASE)


def aplicar(html, idioma_destino):
    """Atualiza o atributo lang da tag <html>."""
    locale = config.MAPA_LOCALES.get(idioma_destino, idioma_destino)
    return _PADRAO_LANG.sub(f'<html lang="{locale}">', html)
