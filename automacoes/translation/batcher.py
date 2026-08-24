"""Montagem de lotes inteligentes para envio à API.

Nunca usa quantidade fixa de itens: os limites são calculados por
caracteres, número de itens e estimativa conservadora de tokens.
"""

from automacoes.translation import config

_CJK_INICIO = "\u4e00"
_CJK_FIM = "\u9fff"

# Overhead aproximado do JSON por unidade (chave id + campos type/context).
_OVERHEAD_CHARS_POR_UNIDADE = 64


def _tem_cjk(texto):
    return any(_CJK_INICIO <= ch <= _CJK_FIM for ch in texto)


def estimar_tokens(texto):
    """Heurística conservadora: ~4 chars/token (latino) e ~1,5 (CJK)."""
    if not texto:
        return 0
    divisor = 1.5 if _tem_cjk(texto) else 4.0
    return max(1, int(len(texto) / divisor))


def montar_lotes(unidades, max_chars=None, max_items=None, max_tokens=None):
    """Divide `unidades` em lotes respeitando os três limites configuráveis."""
    max_chars = max_chars or config.MAX_TRANSLATION_CHARS
    max_items = max_items or config.MAX_TRANSLATION_ITEMS
    max_tokens = max_tokens or config.MAX_TRANSLATION_TOKENS_ESTIMATED

    lotes = []
    atual = []
    chars = 0
    tokens = 0

    for u in unidades:
        peso_chars = len(u.texto) + len(u.contexto) + _OVERHEAD_CHARS_POR_UNIDADE
        peso_tokens = estimar_tokens(u.texto) + 2

        excederia = bool(atual) and (
            chars + peso_chars > max_chars
            or len(atual) + 1 > max_items
            or tokens + peso_tokens > max_tokens
        )
        if excederia:
            lotes.append(atual)
            atual = []
            chars = 0
            tokens = 0

        atual.append(u)
        chars += peso_chars
        tokens += peso_tokens

    if atual:
        lotes.append(atual)

    return lotes


def montar_payload(unidades):
    """Payload JSON estruturado {id: {type, context, text}} — sem HTML/JS."""
    return {
        u.id: {"type": u.tipo, "context": u.contexto, "text": u.texto}
        for u in unidades
    }
