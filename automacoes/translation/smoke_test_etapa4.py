"""Teste de fumaça da Etapa 4 — managers determinísticos (sem IA, sem API).

- Amostra sintética espelhando o <head> do capurro.html (critical-fonts,
  preloads, canonical, og/twitter url, hreflang, rotas e footer).
- Aplicação para ko (fonte especial) e en (latino).
- Idempotência: aplicar duas vezes produz o mesmo resultado.
- Dry-run real sobre capurro.html (somente leitura, em memória).
"""

from automacoes.translation import config, logger
from automacoes.translation import managers

HTML_AMOSTRA = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
<title>Capurro</title>
<meta content="desc" name="description"/>
<meta property="og:url" content="https://www.calculadorasdeenfermagem.com.br/capurro.html"/>
<meta name="twitter:url" content="https://www.calculadorasdeenfermagem.com.br/"/>
<style id="critical-fonts">@font-face{font-family:'Inter';src:url('/fonts/inter/inter-regular.woff2') format('woff2');font-weight:400;font-display:swap}@font-face{font-family:'Nunito Sans';src:url('/fonts/nunito/nunito-regular.woff2') format('woff2');font-weight:400;font-display:swap}</style>
<link as="font" crossorigin="" href="/fonts/inter/inter-regular.woff2" rel="preload" type="font/woff2"/>
<link as="font" crossorigin="" href="/fonts/nunito/nunito-regular.woff2" rel="preload" type="font/woff2"/>
<link href="https://www.calculadorasdeenfermagem.com.br/capurro.html" rel="canonical"/>
<link href="https://www.calculadorasdeenfermagem.com.br/en/capurro.html" hreflang="en" rel="alternate"/>
<link href="https://www.calculadorasdeenfermagem.com.br/es/capurro.html" hreflang="es" rel="alternate"/>
<link href="https://www.calculadorasdeenfermagem.com.br/ko/capurro.html" hreflang="ko" rel="alternate"/>
<link href="https://www.calculadorasdeenfermagem.com.br/capurro.html" hreflang="pt-br" rel="alternate"/>
</head>
<body>
<a href="global-styles.css">css</a>
<script src="./lang-selector.js"></script>
<a href="/menu-global.html">menu</a>
<img src="img/logo.webp" alt="logo"/>
<div id="footer-placeholder"></div>
<script>
  document.addEventListener("DOMContentLoaded", () => {
    fetch("/footer.html").then((r) => r.text()).then((data) => {
      document.getElementById("footer-placeholder").innerHTML = data;
    });
  });
</script>
</body>
</html>"""


def _posicao_hreflang(html, idioma):
    marcador = f'hreflang="{idioma}"'
    return html.find(marcador)


def main():
    logger.info("=== Smoke test da Etapa 4 (managers) ===")

    # ---- 1. Idioma com fonte especial (ko) ----
    html_ko = managers.aplicar_todos(HTML_AMOSTRA, "ko")

    # locale
    assert '<html lang="ko-KR">' in html_ko
    # SEO (canonical + og:url + twitter:url)
    assert 'https://www.calculadorasdeenfermagem.com.br/ko/capurro.html" rel="canonical"' in html_ko
    assert 'content="https://www.calculadorasdeenfermagem.com.br/ko/capurro.html"' in html_ko
    assert 'content="https://www.calculadorasdeenfermagem.com.br/ko/"' in html_ko
    # hreflang: ko primeiro
    assert _posicao_hreflang(html_ko, "ko") < _posicao_hreflang(html_ko, "en")
    assert _posicao_hreflang(html_ko, "en") < _posicao_hreflang(html_ko, "es")
    # fontes: Korean entra, Inter/Nunito saem
    assert "font-family: 'Korean'" in html_ko
    assert "font-family:'Inter'" not in html_ko
    assert "font-family:'Nunito Sans'" not in html_ko
    assert '/fonts/korean/korean-regular.woff2' in html_ko
    assert '/fonts/inter/' not in html_ko
    assert '/fonts/nunito/' not in html_ko
    # rotas
    assert 'href="/global-styles.css"' in html_ko
    assert 'src="/lang-selector.js"' in html_ko
    assert 'href="menu-global.html"' in html_ko
    assert 'href="/menu-global.html"' not in html_ko
    assert 'src="/img/logo.webp"' in html_ko
    # footer relativo
    assert 'fetch("footer.html")' in html_ko
    assert 'fetch("/footer.html")' not in html_ko
    logger.info("ko: locale, SEO, hreflang, fontes, rotas e footer OK")

    # ---- 2. Idioma latino (en) ----
    html_en = managers.aplicar_todos(HTML_AMOSTRA, "en")
    assert '<html lang="en-US">' in html_en
    assert 'https://www.calculadorasdeenfermagem.com.br/en/capurro.html" rel="canonical"' in html_en
    assert _posicao_hreflang(html_en, "en") < _posicao_hreflang(html_en, "ko")
    # fontes originais preservadas (sem fonte especial para en)
    assert "font-family:'Inter'" in html_en
    assert '/fonts/inter/inter-regular.woff2' in html_en
    assert 'Korean' not in html_en
    assert 'fetch("footer.html")' in html_en
    logger.info("en: locale, SEO, hreflang e fontes originais preservadas OK")

    # ---- 3. Idempotência ----
    html_ko_2 = managers.aplicar_todos(html_ko, "ko")
    assert html_ko_2 == html_ko
    html_en_2 = managers.aplicar_todos(html_en, "en")
    assert html_en_2 == html_en
    logger.info("Idempotência OK (2ª aplicação não altera nada)")

    # ---- 4. Dry-run real sobre capurro.html (em memória) ----
    caminho_real = config.PASTA_PROJETO / "capurro.html"
    if caminho_real.exists():
        html_real = caminho_real.read_text(encoding="utf-8")
        html_ajustado = managers.aplicar_todos(html_real, "ko")
        assert '<html lang="ko-KR">' in html_ajustado
        assert ('https://www.calculadorasdeenfermagem.com.br/ko/capurro.html'
                in html_ajustado)
        assert 'fetch("footer.html")' in html_ajustado
        assert "font-family: 'Korean'" in html_ajustado
        assert _posicao_hreflang(html_ajustado, "ko") < \
            _posicao_hreflang(html_ajustado, "en")
        logger.info("Dry-run real capurro.html → ko: todos os ajustes OK")
    else:
        logger.aviso("capurro.html não encontrado — dry-run pulado.")

    logger.info("✅ Smoke test da Etapa 4 concluído com sucesso.")


if __name__ == "__main__":
    main()
