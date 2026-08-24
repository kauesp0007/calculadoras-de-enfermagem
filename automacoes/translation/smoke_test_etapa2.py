"""Teste de fumaça da Etapa 2 — NÃO chama API e NÃO modifica o site.

Inclui:
- proteção/restauração de scripts, styles, SVG e comentários;
- extração HTML/SEO/Schema/JS sobre uma amostra sintética;
- reconstrução determinística + validação estrutural;
- dry-run completo sobre capurro.html (somente leitura).

Uso (a partir da raiz do repositório):
    py -m automacoes.translation.smoke_test_etapa2
"""

from automacoes.translation import config, logger
from automacoes.translation.batcher import montar_lotes
from automacoes.translation.extractor import deduplicar
from automacoes.translation.html_extractor import extrair_unidades_html
from automacoes.translation.js_extractor import extrair_unidades_js
from automacoes.translation.protection import proteger_html
from automacoes.translation.rebuild import montar_html_final
from automacoes.translation.schema_extractor import extrair_unidades_schema
from automacoes.translation.seo_extractor import extrair_unidades_seo
from automacoes.translation.validator import (
    validar_json_resposta, validar_html_estrutura, validar_schema_json,
)

HTML_AMOSTRA = """<!doctype html>
<html lang="pt-BR">
<head>
<title>Método de Capurro: Idade Gestacional</title>
<meta name="description" content="Calculadora do Método de Capurro para avaliação neonatal."/>
<meta property="og:url" content="https://www.calculadorasdeenfermagem.com.br/capurro.html"/>
<link rel="canonical" href="https://www.calculadorasdeenfermagem.com.br/capurro.html"/>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"O que é o Capurro?","acceptedAnswer":{"@type":"Answer","text":"Método para estimar a idade gestacional."}}],"inLanguage":"pt-BR"}</script>
<style>body{color:red}</style>
<script>/* comentário interno */</script>
<script>
  const btn = document.getElementById("btnCalcular");
  btn.addEventListener("click", function(){ showToast("Resultado positivo"); });
  const msg = "Conduta de Enfermagem";
</script>
</head>
<body>
<h1>Método de Capurro</h1>
<p>Ferramenta de <strong>apoio</strong> para enfermeiros.</p>
<img src="/img/logo.webp" alt="Logotipo Calculadoras de Enfermagem">
<button aria-label="Calcular escore">Calcular</button>
<!-- comentário que não deve ser traduzido -->
</body>
</html>"""


def _traducoes_falsas(unidades):
    """Tradução fake [KO] apenas para exercitar a reconstrução."""
    return {u.id: f"{u.texto} [KO]" for u in unidades}


def main():
    logger.info("=== Smoke test da Etapa 2 (extração/validação) ===")

    # ---- 1. Proteção ----
    protecao = proteger_html(HTML_AMOSTRA)
    logger.info(
        f"Proteção: {len(protecao.blocos)} blocos protegidos, "
        f"{len(protecao.scripts_inline)} scripts inline separados"
    )
    assert len(protecao.blocos) == 4          # style + 2 scripts + comentário final
    # (scripts inline aparecem em blocos E em scripts_inline — subconjunto útil)
    assert len(protecao.scripts_inline) == 2  # script comentário + script principal
    assert 'TRV2_PROT_0' in protecao.html_protegido
    assert 'application/ld+json' in protecao.html_protegido  # schema NÃO protegido

    # ---- 2. Extração HTML ----
    unidades_html = extrair_unidades_html(protecao.html_protegido, "ko")
    textos = [u.texto for u in unidades_html]
    assert "Método de Capurro" in textos
    assert "Logotipo Calculadoras de Enfermagem" in textos
    assert "Calcular escore" in textos
    assert "apoio" in textos  # pedaço separado por <strong>
    logger.info(f"Extração HTML: {len(unidades_html)} unidades")

    # ---- 3. Extração SEO ----
    unidades_seo = extrair_unidades_seo(protecao.html_protegido, "ko")
    seo_textos = [u.texto for u in unidades_seo]
    assert "Calculadora do Método de Capurro para avaliação neonatal." in seo_textos
    logger.info(f"Extração SEO: {len(unidades_seo)} unidades ({[u.tipo for u in unidades_seo]})")

    # ---- 4. Extração Schema ----
    unidades_schema, blocos_schema = extrair_unidades_schema(protecao.html_protegido, "ko")
    assert len(unidades_schema) == 2  # name da pergunta + text da resposta
    assert len(blocos_schema) == 1
    logger.info(f"Extração Schema: {len(unidades_schema)} unidades")

    # ---- 5. Extração JS (scripts_extraidos é reutilizado na reconstrução) ----
    scripts_extraidos = {}
    unidades_js = []
    for placeholder, codigo in protecao.scripts_inline.items():
        ujs, _ = extrair_unidades_js(
            codigo, "ko", prefixo=f"js_{len(scripts_extraidos)}"
        )
        scripts_extraidos[placeholder] = (codigo, ujs)
        unidades_js.extend(ujs)
    textos_js = [u.texto for u in unidades_js]
    assert "Resultado positivo" in textos_js
    assert "Conduta de Enfermagem" in textos_js
    assert "btnCalcular" not in textos_js
    assert "click" not in textos_js
    logger.info(f"Extração JS: {len(unidades_js)} unidades → {textos_js}")

    # ---- 6. Reconstrução determinística completa (via rebuild) ----
    todas = unidades_html + unidades_seo + unidades_schema + unidades_js
    trads = _traducoes_falsas(todas)

    html_final, ok_rebuild, prob_rebuild = montar_html_final(
        HTML_AMOSTRA, protecao,
        unidades_html + unidades_seo,
        unidades_schema, blocos_schema, scripts_extraidos,
        trads, "ko",
    )
    assert ok_rebuild, prob_rebuild

    assert "Método de Capurro [KO]" in html_final
    assert "Resultado positivo [KO]" in html_final
    assert "getElementById(\"btnCalcular\")" in html_final
    assert '<html lang="pt-BR">' in html_final  # lang é alterado pelos managers (Etapa 4)
    logger.info("Reconstrução completa OK (textos traduzidos, código preservado)")

    # ---- 7. Validações ----
    ok, problemas = validar_html_estrutura(HTML_AMOSTRA, html_final)
    logger.info(f"Validação estrutural do reconstruído: ok={ok} problemas={problemas}")
    assert ok

    ok_json, prob_json = validar_schema_json(
        html_final.split('<script type="application/ld+json">')[1].split('</script>')[0]
    )
    assert ok_json
    assert '"inLanguage":"ko-KR"' in html_final
    assert 'https://schema.org' in html_final  # @context preservado

    payload = {"u001": {"type": "html_text", "context": "h1", "text": "Capurro"}}
    ok_r, prob_r = validar_json_resposta(payload, {"u001": "카푸로", "u999": "extra"})
    assert ok_r is False and prob_r
    ok_r2, _ = validar_json_resposta(payload, {"u001": "카푸로"})
    assert ok_r2 is True

    # ---- 8. Dry-run completo sobre capurro.html (somente leitura) ----
    caminho = config.PASTA_PROJETO / "capurro.html"
    if caminho.exists():
        html_real = caminho.read_text(encoding="utf-8")
        prot = proteger_html(html_real)
        u_html = extrair_unidades_html(prot.html_protegido, "ko")
        u_seo = extrair_unidades_seo(prot.html_protegido, "ko")
        u_schema, _ = extrair_unidades_schema(prot.html_protegido, "ko")
        u_js = []
        for codigo in prot.scripts_inline.values():
            u_js += extrair_unidades_js(codigo, "ko")[0]
        tudo = u_html + u_seo + u_schema + u_js
        novas, stats = deduplicar(tudo, set())
        chars = sum(len(u.texto) for u in novas)
        lotes = montar_lotes(novas)
        logger.info(
            f"DRY-RUN capurro.html → ko: {stats} | novas={len(novas)} | "
            f"caracteres a enviar={chars} | lotes={len(lotes)} | "
            f"HTML original={len(html_real)} chars"
        )
        assert len(novas) > 50
        assert chars < len(html_real)  # economia real vs. HTML cru
    else:
        logger.aviso("capurro.html não encontrado na raiz — dry-run pulado.")

    logger.info("✅ Smoke test da Etapa 2 concluído com sucesso.")


if __name__ == "__main__":
    main()
