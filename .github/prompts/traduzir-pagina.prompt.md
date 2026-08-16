---
description: "Traduzir uma página HTML para os idiomas do site mantendo hreflang, canonical e estrutura."
agent: "Tradutor de Página"
argument-hint: "Página a traduzir e idioma(s) de destino (ex.: en, es)"
---
Traduza a página indicada para o(s) idioma(s) solicitado(s), seguindo as regras do projeto:
caminhos absolutos nos assets, footer relativo (`fetch("footer.html")`) nas pastas de idioma,
hreflang completo com x-default, e preservação de IDs/classes/JS.
