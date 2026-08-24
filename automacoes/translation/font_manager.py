"""Font manager — Etapa 4.

Idiomas não-latinos (ar, zh, hi, ja, ko) recebem @font-face próprio dentro
do `<style id="critical-fonts">`, preloads das fontes especiais no lugar do
primeiro preload Inter/Nunito e remoção dos @font-face e preloads originais.

Mesmo comportamento do tradutor legado (font-display: swap, igual às
páginas já publicadas dos idiomas).
"""

import re

from automacoes.translation import config

FONTES_ESPECIFICAS = {
    "ar": {
        "css": "@font-face { font-family: 'Arabic'; src: url('/fonts/arabic/arabic-regular.woff2') format('woff2'); font-weight: 400; font-display: swap; }\n    @font-face { font-family: 'Arabic'; src: url('/fonts/arabic/arabic-700.woff2') format('woff2'); font-weight: 700; font-display: swap; }",
        "preload": '<link rel="preload" href="/fonts/arabic/arabic-regular.woff2" as="font" type="font/woff2" crossorigin>\n  <link rel="preload" href="/fonts/arabic/arabic-700.woff2" as="font" type="font/woff2" crossorigin>',
    },
    "zh": {
        "css": "@font-face { font-family: 'Chinese'; src: url('/fonts/chinese/chinese-regular.woff2') format('woff2'); font-weight: 400; font-display: swap; }",
        "preload": '<link rel="preload" href="/fonts/chinese/chinese-regular.woff2" as="font" type="font/woff2" crossorigin>',
    },
    "hi": {
        "css": "@font-face { font-family: 'Devanagari'; src: url('/fonts/devanagari/devanagari-regular.woff2') format('woff2'); font-weight: 400; font-display: swap; }\n    @font-face { font-family: 'Devanagari'; src: url('/fonts/devanagari/devanagari-700.woff2') format('woff2'); font-weight: 700; font-display: swap; }",
        "preload": '<link rel="preload" href="/fonts/devanagari/devanagari-regular.woff2" as="font" type="font/woff2" crossorigin>\n  <link rel="preload" href="/fonts/devanagari/devanagari-700.woff2" as="font" type="font/woff2" crossorigin>',
    },
    "ja": {
        "css": "@font-face { font-family: 'Japanese'; src: url('/fonts/japanese/japanese-regular.woff2') format('woff2'); font-weight: 400; font-display: swap; }\n    @font-face { font-family: 'Japanese'; src: url('/fonts/japanese/japanese-700.woff2') format('woff2'); font-weight: 700; font-display: swap; }",
        "preload": '<link rel="preload" href="/fonts/japanese/japanese-regular.woff2" as="font" type="font/woff2" crossorigin>\n  <link rel="preload" href="/fonts/japanese/japanese-700.woff2" as="font" type="font/woff2" crossorigin>',
    },
    "ko": {
        "css": "@font-face { font-family: 'Korean'; src: url('/fonts/korean/korean-regular.woff2') format('woff2'); font-weight: 400; font-display: swap; }\n    @font-face { font-family: 'Korean'; src: url('/fonts/korean/korean-700.woff2') format('woff2'); font-weight: 700; font-display: swap; }",
        "preload": '<link rel="preload" href="/fonts/korean/korean-regular.woff2" as="font" type="font/woff2" crossorigin>\n  <link rel="preload" href="/fonts/korean/korean-700.woff2" as="font" type="font/woff2" crossorigin>',
    },
}

_PADRAO_TAG_STYLE = re.compile(
    r'(<style\s+id="critical-fonts"[^>]*>\s*)', re.IGNORECASE
)
_PADRAO_FONT_FACE_ORIGINAL = re.compile(
    r'@font-face\s*\{\s*font-family:\s*[\'"](?:Inter|Nunito Sans)[\'"][^\}]+\}\s*',
    re.IGNORECASE,
)
_PADRAO_PRELOAD_ORIGINAL = re.compile(
    r'<link\s+(?=[^>]*\brel="preload")'
    r'(?=[^>]*\bhref="/fonts/(?:inter|nunito)/)[^>]*>\s*',
    re.IGNORECASE,
)


def aplicar(html, idioma_destino):
    """Ajusta fontes para idiomas não-latinos; sem efeito nos demais."""
    if idioma_destino not in config.IDIOMAS_FONTES_ESPECIAIS:
        return html

    dados = FONTES_ESPECIFICAS[idioma_destino]

    if dados["css"] in html:
        return html  # já ajustado — idempotente

    # 1. Injeta o CSS da fonte especial no início do critical-fonts
    html = _PADRAO_TAG_STYLE.sub(
        lambda m: f'{m.group(1)}{dados["css"]}\n    ',
        html, count=1,
    )

    # 2. Remove os @font-face originais (Inter e Nunito Sans)
    html = _PADRAO_FONT_FACE_ORIGINAL.sub("", html)

    # 3. Troca o primeiro preload original pelos preloads da fonte especial
    html = _PADRAO_PRELOAD_ORIGINAL.sub(dados["preload"], html, count=1)

    # 4. Remove os preloads originais restantes
    html = _PADRAO_PRELOAD_ORIGINAL.sub("", html)

    return html
