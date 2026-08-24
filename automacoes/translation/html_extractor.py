"""Extrator de unidades traduzíveis do HTML (textos visíveis e atributos).

Trabalha sobre o HTML JÁ PROTEGIDO (scripts/styles/svg viram placeholders),
portanto nunca envia tags, código ou URLs para a API.

Posições (extra["inicio"]/["fim"]) permitem reconstrução determinística
via `reconstruir_com_posicoes` do módulo extractor.
"""

import re

from automacoes.translation.extractor import UnidadeTraduzivel

# Tags cujo texto interno recebe contexto específico (heading, botão, etc.)
TAGS_COM_CONTEXTO = (
    "h1|h2|h3|h4|h5|h6|button|label|a|p|li|td|th|option|summary|figcaption|title"
)

PADRAO_TAG_TEXTO = re.compile(
    r'<(' + TAGS_COM_CONTEXTO + r')\b[^>]*>([^<]+)<',
    re.IGNORECASE,
)
PADRAO_TEXTO_GENERICO = re.compile(r'>([^<]+)<')
PADRAO_ATRIBUTO = re.compile(
    r'\b(alt|title|placeholder|aria-label|aria-description)="([^"]+)"',
    re.IGNORECASE,
)


def _intervalo_com_strip(match, grupo):
    """Posições do grupo já ajustadas para o texto sem espaços das bordas."""
    bruto = match.group(grupo)
    texto = bruto.strip()
    if not texto:
        return None, None, None
    inicio = match.start(grupo) + (len(bruto) - len(bruto.lstrip()))
    fim = match.end(grupo) - (len(bruto) - len(bruto.rstrip()))
    return inicio, fim, texto


def extrair_unidades_html(html_protegido, idioma_destino="en", prefixo="h"):
    """Retorna a lista de UnidadeTraduzivel do HTML protegido."""
    unidades = []
    faixas_cobertas = []

    # Scripts JSON-LD permanecem no HTML protegido: cobrir suas faixas para
    # que o JSON bruto NÃO seja extraído como texto genérico (o Schema é
    # tratado pelo schema_extractor).
    for m in re.finditer(
        r'<script\b[^>]*>.*?</script>', html_protegido,
        re.IGNORECASE | re.DOTALL,
    ):
        faixas_cobertas.append((m.start(), m.end()))

    def ja_coberto(inicio, fim):
        return any(inicio < f_fim and fim > f_ini for f_ini, f_fim in faixas_cobertas)

    def adicionar(tipo, contexto, texto, inicio, fim, extra=None):
        u = UnidadeTraduzivel(
            f"{prefixo}_{len(unidades)}", tipo, contexto, texto,
            idioma_destino=idioma_destino,
            extra={"inicio": inicio, "fim": fim, **(extra or {})},
        )
        unidades.append(u)
        faixas_cobertas.append((inicio, fim))

    # Pass 1: textos com tag/contexto conhecido
    for m in PADRAO_TAG_TEXTO.finditer(html_protegido):
        inicio, fim, texto = _intervalo_com_strip(m, 2)
        if texto is None or ja_coberto(inicio, fim):
            continue
        tag = m.group(1).lower()
        adicionar("html_text", tag, texto, inicio, fim)

    # Pass 2: textos genéricos restantes (ex.: pedaços separados por <strong>)
    for m in PADRAO_TEXTO_GENERICO.finditer(html_protegido):
        inicio, fim, texto = _intervalo_com_strip(m, 1)
        if texto is None or ja_coberto(inicio, fim):
            continue
        adicionar("html_text", "texto", texto, inicio, fim)

    # Pass 3: atributos textuais
    for m in PADRAO_ATRIBUTO.finditer(html_protegido):
        nome_attr = m.group(1).lower()
        inicio, fim, texto = _intervalo_com_strip(m, 2)
        if texto is None:
            continue
        adicionar(
            "attribute", nome_attr, texto, inicio, fim,
            extra={"tipo_substituicao": "atributo", "atributo": nome_attr},
        )

    return unidades
