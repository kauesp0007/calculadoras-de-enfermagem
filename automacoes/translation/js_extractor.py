"""Extrator de strings traduzíveis de JavaScript inline.

Estratégia conservadora e segura:
- Extrai apenas literais simples (sem interpolação ${...} / {{...}}).
- Ignora strings em contextos técnicos (getElementById, addEventListener,
  classList, localStorage, etc.).
- Preserva aspas originais: substitui somente o conteúdo do literal.
- Scripts sem strings extraíveis permanecem intactos (nada vai para a API).
"""

import re

from automacoes.translation.extractor import UnidadeTraduzivel

PADRAO_STRING_DUPLA = re.compile(r'"([^"\n]*)"')
PADRAO_STRING_SIMPLES = re.compile(r"'([^'\n]*)'")

# Identificadores imediatamente anteriores que indicam uso técnico (NÃO traduzir).
IDENTIFICADORES_TECNICOS = {
    "getElementById", "querySelector", "querySelectorAll", "addEventListener",
    "removeEventListener", "setAttribute", "removeAttribute", "getAttribute",
    "classList", "dataset", "localStorage", "sessionStorage", "getItem",
    "setItem", "removeItem", "createElement", "appendChild", "replaceChild",
    "console", "document", "window", "location", "fetch", "carregarTraducoes",
    "new", "Option", "style", "src", "href", "id", "name", "className",
    "innerHTML", "outerHTML", "textContent", "add", "remove", "toggle",
    "contains", "getContext", "setInterval", "setTimeout", "import",
    "log", "error", "warn", "info", "debug",
}

PADRAO_ULTIMO_IDENT = re.compile(r'([A-Za-z_$][\w$]*)\s*\(?\s*$')
PADRAO_PROPRIEDADE = re.compile(r'\.[A-Za-z_$][\w$]*\s*=\s*$')


def _eh_tecnico(antes):
    """Analisa apenas o identificador imediatamente anterior à string.

    `antes` é uma fatia do código imediatamente antes do literal; a aspa de
    abertura fica em `match.start(1) - 1`, então é removida aqui antes da
    análise. O padrão aceita um parêntese de chamada (`getElementById("x")`)
    e a atribuição de propriedade (`img.src = "x"`), descartando ambos.
    """
    antes = antes.rstrip().rstrip('"\'')
    m = PADRAO_ULTIMO_IDENT.search(antes)
    if m and m.group(1) in IDENTIFICADORES_TECNICOS:
        return True
    if PADRAO_PROPRIEDADE.search(antes):
        return True
    return False


def extrair_unidades_js(codigo, idioma_destino="en", prefixo="js"):
    """Retorna (unidades, faixas) — faixas = (inicio, fim, id) para reconstrução."""
    unidades = []
    faixas = []

    def registrar(match):
        valor = match.group(1)
        inicio, fim = match.start(1), match.end(1)
        antes = codigo[max(0, inicio - 60):inicio]

        if not valor or not any(ch.isalpha() for ch in valor):
            return
        if "${" in valor or "{{" in valor:
            return
        # Fragmentos com marcação HTML ou interpolação (pedaços de template
        # literal entre ${...}) NUNCA vão para a API — risco de corrupção.
        if "<" in valor or ">" in valor:
            return
        if "{" in valor or "}" in valor or "$" in valor:
            return
        # Dentro de template literal (crases): nenhuma parte é traduzida.
        if codigo[:inicio].count("`") % 2 == 1:
            return
        if _eh_tecnico(antes):
            return

        u = UnidadeTraduzivel(
            f"{prefixo}_{len(unidades)}", "js_message", "script", valor,
            idioma_destino=idioma_destino,
            extra={"inicio": inicio, "fim": fim},
        )
        unidades.append(u)
        faixas.append((inicio, fim, u.id))

    # OBSERVAÇÃO IMPORTANTE: NÃO existe passada para template literals (``).
    # O padrão `([^`$]+)` casaria os trechos ENTRE dois templates adjacentes
    # (ex.: `` `a${x}`.prop = `b${y}` ``), enviando código à API e causando
    # corrupção real (caso badge_/bar_ do capurro ko). Templates NUNCA são
    # traduzidos; strings com aspas dentro deles são descartadas pela guarda
    # de crases ímpares em `registrar`.
    for m in PADRAO_STRING_DUPLA.finditer(codigo):
        registrar(m)
    for m in PADRAO_STRING_SIMPLES.finditer(codigo):
        registrar(m)

    return unidades, faixas


def reconstruir_js(codigo, unidades, traducoes):
    """Aplica traduções apenas no conteúdo dos literais (aspas preservadas)."""
    resultado = codigo
    itens = sorted(
        [
            (u.extra["inicio"], u.extra["fim"], traducoes.get(u.id, u.texto))
            for u in unidades
            if "inicio" in u.extra and "fim" in u.extra
        ],
        key=lambda x: -x[0],
    )
    for inicio, fim, trad in itens:
        resultado = resultado[:inicio] + trad + resultado[fim:]
    return resultado
