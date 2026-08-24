"""Extrator de strings traduzíveis de JavaScript inline.

Estratégia:
- Template literals (`` `...` ``) são extraídos por INTEIRO — o padrão usa
  pares ADJACENTES de crases (sem excluir `$`), portanto nunca casa os
  trechos entre dois templates vizinhos (bug badge_/bar_ corrigido).
- Strings com aspas simples/duplas FORA de templates também são extraídas.
- Contextos técnicos (getElementById, addEventListener, .src =, .style.*=)
  são ignorados; `.textContent =` e `.innerHTML =` SÃO traduzidos (texto
  visível ao usuário, ex.: card de resultado).
- Preserva delimitadores: substitui somente o conteúdo do literal.
"""

import re

from automacoes.translation.extractor import UnidadeTraduzivel

PADRAO_TEMPLATE = re.compile(r'`([^`]*)`')
PADRAO_STRING_DUPLA = re.compile(r'"([^"\n]*)"')
PADRAO_STRING_SIMPLES = re.compile(r"'([^'\n]*)'")
PADRAO_INTERPOLACAO = re.compile(r'\$\{[^}]*\}')
PADRAO_MARCACAO_SIMPLES = re.compile(r'</?(?:strong|em|b|i)\s*>', re.IGNORECASE)

# Identificadores imediatamente anteriores que indicam uso técnico (NÃO traduzir).
IDENTIFICADORES_TECNICOS = {
    "getElementById", "querySelector", "querySelectorAll", "addEventListener",
    "removeEventListener", "setAttribute", "removeAttribute", "getAttribute",
    "classList", "dataset", "localStorage", "sessionStorage", "getItem",
    "setItem", "removeItem", "createElement", "appendChild", "replaceChild",
    "console", "document", "window", "location", "fetch", "carregarTraducoes",
    "new", "Option", "style", "src", "href", "id", "name", "className",
    "add", "remove", "toggle", "contains", "getContext",
    "setInterval", "setTimeout", "import",
    "log", "error", "warn", "info", "debug",
}

# Atribuições `.propriedade = "..."` consideradas técnicas (NÃO traduzir).
# Obs.: textContent e innerHTML ficam FORA desta lista de propósito.
PROPRIEDADES_TECNICAS = {
    "src", "href", "id", "name", "className", "type", "action", "method",
    "target", "rel", "background", "backgroundColor", "width", "height",
    "color", "borderColor", "display", "position", "value", "checked",
    "selected", "role", "class", "for",
}

PADRAO_ULTIMO_IDENT = re.compile(r'([A-Za-z_$][\w$]*)\s*\(?\s*$')
PADRAO_PROPRIEDADE = re.compile(r'\.([A-Za-z_$][\w$]*)\s*=\s*$')
PADRAO_STYLE_PROP = re.compile(r'\.style\.[A-Za-z_$][\w$]*\s*=\s*$')


def _eh_tecnico(antes):
    """Analisa o identificador/propriedade imediatamente anterior à string.

    A aspa de abertura fica em `match.start(1) - 1`; ela é removida antes
    da análise. Parêntese de chamada (`getElementById("x")`) e atribuição de
    propriedade técnica (`img.src = "x"`, `el.style.x = "y"`) são
    descartados; `.textContent = "texto visível"` é traduzido.
    """
    antes = antes.rstrip().rstrip('"\'')
    m = PADRAO_ULTIMO_IDENT.search(antes)
    if m and m.group(1) in IDENTIFICADORES_TECNICOS:
        return True
    if PADRAO_STYLE_PROP.search(antes):
        return True
    pm = PADRAO_PROPRIEDADE.search(antes)
    if pm and pm.group(1) in PROPRIEDADES_TECNICAS:
        return True
    return False


def _texto_fora_interpolacao(valor):
    """Texto restante após remover os ${...} (decide se o template traduz)."""
    return PADRAO_INTERPOLACAO.sub("", valor)


def _marcacao_aceitavel(valor):
    """Permite só tags simples (strong/em/b/i); marcação rica (class=, svg,
    aspas em atributos) faz o modelo devolver valores nulos — fica fora."""
    if "<" not in valor:
        return True
    sobra = PADRAO_MARCACAO_SIMPLES.sub("", valor)
    return "<" not in sobra


def extrair_unidades_js(codigo, idioma_destino="en", prefixo="js"):
    """Retorna (unidades, faixas) — faixas = (inicio, fim, id) para reconstrução."""
    unidades = []
    faixas = []
    faixas_template = []

    def criar(tipo, contexto, valor, inicio, fim):
        u = UnidadeTraduzivel(
            f"{prefixo}_{len(unidades)}", tipo, contexto, valor,
            idioma_destino=idioma_destino,
            extra={"inicio": inicio, "fim": fim},
        )
        unidades.append(u)
        faixas.append((inicio, fim, u.id))

    def registrar_template(match):
        valor = match.group(1)
        inicio, fim = match.start(1), match.end(1)

        # Traduz somente se houver texto legível FORA dos ${...}.
        texto_fora = _texto_fora_interpolacao(valor)
        if not any(ch.isalpha() for ch in texto_fora):
            return
        t = texto_fora.strip()
        if not t or t.startswith(("/", "http://", "https://", "./", "../", "#")):
            return  # só variáveis, porcentagens ou caminhos — nada a traduzir
        if not _marcacao_aceitavel(valor):
            return  # marcação complexa — risco de resposta nula da API

        faixas_template.append((inicio, fim))
        criar("js_template", "template", valor, inicio, fim)

    def registrar_string(match):
        valor = match.group(1)
        inicio, fim = match.start(1), match.end(1)
        antes = codigo[max(0, inicio - 60):inicio]

        if not valor or not any(ch.isalpha() for ch in valor):
            return
        if "${" in valor or "{{" in valor:
            return
        # Marcação HTML ou interpolação fora de template não vai à API.
        if "<" in valor or ">" in valor:
            return
        if "{" in valor or "}" in valor or "$" in valor:
            return
        if any(inicio < tf and fim > ti for ti, tf in faixas_template):
            return  # dentro de um template literal já tratado
        if codigo[:inicio].count("`") % 2 == 1:
            return  # dentro de template literal
        if _eh_tecnico(antes):
            return

        criar("js_message", "script", valor, inicio, fim)

    # Passada de templates primeiro (pares adjacentes de crases — correto),
    # depois strings com aspas fora dos templates.
    for m in PADRAO_TEMPLATE.finditer(codigo):
        registrar_template(m)
    for m in PADRAO_STRING_DUPLA.finditer(codigo):
        registrar_string(m)
    for m in PADRAO_STRING_SIMPLES.finditer(codigo):
        registrar_string(m)

    return unidades, faixas


def reconstruir_js(codigo, unidades, traducoes):
    """Aplica traduções apenas no conteúdo dos literais (delimitadores preservados)."""
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

