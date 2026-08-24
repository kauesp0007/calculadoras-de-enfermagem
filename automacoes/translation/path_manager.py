"""Path manager — Etapa 4.

Corrige rotas para as páginas dentro de pastas de idioma:
- Assets e scripts do site passam para caminho absoluto (`/...`).
- Modulares que as páginas dos 18 idiomas carregam via fetch relativo
  (`menu-global.html`, `global-body-elements.html`) ficam relativos.

Mesmas regras do tradutor legado; todas idempotentes.
"""

REGRAS_ROTAS = {
    'href="global-styles.css"': 'href="/global-styles.css"',
    'href="./global-styles.css"': 'href="/global-styles.css"',
    'src="lang-selector.js"': 'src="/lang-selector.js"',
    'src="./lang-selector.js"': 'src="/lang-selector.js"',
    'href="_language_selector.html"': 'href="/_language_selector.html"',
    'href="./_language_selector.html"': 'href="/_language_selector.html"',
    'href="manifest.json"': 'href="/manifest.json"',
    'src="ce-calculadora-padrao.js"': 'src="/ce-calculadora-padrao.js"',
    'src="./global-scripts.js"': 'src="/global-scripts.js"',
    'href="/global-body-elements.html"': 'href="global-body-elements.html"',
    'href="./global-body-elements.html"': 'href="global-body-elements.html"',
    'href="/menu-global.html"': 'href="menu-global.html"',
    'href="./menu-global.html"': 'href="menu-global.html"',
    'src="img/': 'src="/img/',
    'src="../img/': 'src="/img/',
}


def aplicar(html, idioma_destino=None):
    """Aplica as correções de rotas (idioma não é necessário)."""
    for antigo, novo in REGRAS_ROTAS.items():
        html = html.replace(antigo, novo)
    return html
