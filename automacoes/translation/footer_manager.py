"""Footer manager — Etapa 4.

Substitui o bloco do footer (placeholder + script) pelo bloco canônico
com `fetch("footer.html")` RELATIVO — comportamento exigido nas páginas
dos 18 idiomas (bloco de footer próprio da pasta).
"""

_FOOTER_CANONICO = """<div id="footer-placeholder"></div>
<script>
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
      fetch("footer.html")
        .then((response) => response.text())
        .then((data) => {
          document.getElementById("footer-placeholder").innerHTML = data;
        });
    }, 150);
  });
</script>"""

_MARCADOR_INICIO = '<div id="footer-placeholder"></div>'
_MARCADOR_FIM = "</script>"


def aplicar(html, idioma_destino=None):
    """Troca o bloco do footer pelo canônico com fetch relativo."""
    idx_inicio = html.rfind(_MARCADOR_INICIO)
    if idx_inicio == -1:
        return html

    idx_fim = html.find(_MARCADOR_FIM, idx_inicio)
    if idx_fim == -1:
        return html
    idx_fim += len(_MARCADOR_FIM)

    bloco_antigo = html[idx_inicio:idx_fim]
    if bloco_antigo == _FOOTER_CANONICO:
        return html  # idempotente

    return html.replace(bloco_antigo, _FOOTER_CANONICO)
