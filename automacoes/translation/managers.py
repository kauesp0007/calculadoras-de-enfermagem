"""Fachada dos managers — Etapa 4.

Aplica todos os ajustes determinísticos pós-tradução na MESMA ORDEM do
tradutor legado: rotas → footer → lang → SEO → hreflang → fontes.
"""

from automacoes.translation import (
    font_manager, footer_manager, hreflang_manager,
    locale_manager, path_manager, result_manager, seo_manager,
)


def aplicar_todos(html, idioma_destino):
    """Encadeia os sete managers e devolve o HTML final ajustado."""
    html = path_manager.aplicar(html)
    html = footer_manager.aplicar(html)
    html = locale_manager.aplicar(html, idioma_destino)
    html = seo_manager.aplicar(html, idioma_destino)
    html = hreflang_manager.aplicar(html, idioma_destino)
    html = font_manager.aplicar(html, idioma_destino)
    # Último: termos de resultado (limpeza determinística do que a IA deixou em pt).
    html = result_manager.aplicar(html, idioma_destino)
    return html
