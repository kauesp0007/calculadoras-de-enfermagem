"""Teste de fumaça da Etapa 5 — CLI, integração dos managers e auditoria.

SEM chamadas reais à API: tradução fake + saída em pasta temporária.
"""

import shutil
from contextlib import contextmanager

from automacoes.translation import audit, config, logger
from automacoes.translation import hooks, orchestrator, providers
from automacoes.translation.js_extractor import extrair_unidades_js

HTML_AMOSTRA = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
<title>Capurro</title>
<meta content="Calculadora do Método de Capurro." name="description"/>
<meta property="og:url" content="https://www.calculadorasdeenfermagem.com.br/capurro.html"/>
<style id="critical-fonts">@font-face{font-family:'Inter';src:url('/fonts/inter/inter-regular.woff2') format('woff2');font-weight:400;font-display:swap}</style>
<link as="font" crossorigin="" href="/fonts/inter/inter-regular.woff2" rel="preload" type="font/woff2"/>
<link href="https://www.calculadorasdeenfermagem.com.br/capurro.html" rel="canonical"/>
<link href="https://www.calculadorasdeenfermagem.com.br/en/capurro.html" hreflang="en" rel="alternate"/>
<link href="https://www.calculadorasdeenfermagem.com.br/ko/capurro.html" hreflang="ko" rel="alternate"/>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage","name":"Método de Capurro"}</script>
</head>
<body>
<h1>Método de Capurro</h1>
<p>Ferramenta de apoio para enfermeiros.</p>
<img src="img/logo.webp" alt="Logotipo"/>
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

PASTA_TESTE = config.PASTA_CACHE / "teste_etapa5"
_TRADUZIR_ORIGINAL = orchestrator.traduzir_payload


def _tradutor_fake(payload, idioma_destino, provider=None):
    return {chave: f"{item['text']} [KO]" for chave, item in payload.items()}


@contextmanager
def _ambiente_fake():
    orchestrator.traduzir_payload = _tradutor_fake
    hook_original = hooks.apos_salvar
    hooks.apos_salvar = lambda *a, **k: None
    try:
        yield
    finally:
        orchestrator.traduzir_payload = _TRADUZIR_ORIGINAL
        hooks.apos_salvar = hook_original


def main():
    logger.info("=== Smoke test da Etapa 5 (CLI + managers + auditoria) ===")
    shutil.rmtree(PASTA_TESTE, ignore_errors=True)

    fonte = PASTA_TESTE / "origem" / "amostra.html"
    fonte.parent.mkdir(parents=True, exist_ok=True)
    fonte.write_text(HTML_AMOSTRA, encoding="utf-8")

    # ---- 1. Pipeline completo com managers integrados ----
    with _ambiente_fake():
        resultado = orchestrator.traduzir_arquivo(
            fonte, "ko", modo="real", usar_memoria=False,
            pasta_saida=PASTA_TESTE / "ko",
        )

    assert resultado["estrutura_ok"] is True
    assert resultado["problemas"] == []

    saida = (PASTA_TESTE / "ko" / "amostra.html").read_text(encoding="utf-8")
    assert '<html lang="ko-KR">' in saida
    assert 'https://www.calculadorasdeenfermagem.com.br/ko/capurro.html' in saida
    assert 'fetch("footer.html")' in saida
    assert "font-family: 'Korean'" in saida
    assert "Método de Capurro [KO]" in saida
    assert 'src="/img/logo.webp"' in saida
    assert _pos_hreflang(saida, "ko") < _pos_hreflang(saida, "en")
    logger.info("Pipeline com managers: lang, SEO, fontes, footer e rotas OK")

    # ---- 2. Auditoria do resultado ----
    rel = audit.relatorio(saida, HTML_AMOSTRA, caminho_legado=None)
    assert rel["estrutura_ok"] is True
    # Tradução fake mantém o português + [KO] — detector deve encontrar
    assert any("Método" in t for t in rel["textos_portugues_restantes"])
    logger.info(
        f"Auditoria: estrutura ok, {len(rel['textos_portugues_restantes'])} "
        f"textos em pt detectados (esperado na tradução fake)"
    )

    # ---- 3. Detector de pt: texto traduzido não acusa ----
    assert audit.textos_em_portugues("<p>Capurro Method [KO]</p>") == []

    # ---- 4. Comparação com legado (regressão estrutural) ----
    legado = HTML_AMOSTRA.replace('lang="pt-BR"', 'lang="ko-KR"')
    diffs = audit.comparar_com_legado(saida, legado)
    assert diffs["lang"] == ("ko-KR", "ko-KR")
    assert diffs["canonical"][1].endswith("/ko/capurro.html")
    assert diffs["primeiro_hreflang"][1] == "ko"
    assert diffs["tags_script"] == (2, 2)
    logger.info(f"Comparação com legado OK: {diffs['tamanho_chars']}")

    # ---- 4b. Regressão: templates com marcação complexa NÃO vão à API ----
    # (bug real: `<svg ...></a>` entre ${...} era enviado à API e perdido;
    #  marcação rica também faz o modelo devolver valores nulos)
    fragmento_template = (
        'const tools = r.tools.map(t => `<a class="tool-link" '
        'href="${t.h}">${t.l}<svg viewBox="0 0 24 24"><path '
        'd="M5 12h14M13 6l6 6-6 6"/></a>`);'
    )
    ujs_frag, _ = extrair_unidades_js(fragmento_template, "ko")
    assert ujs_frag == []
    logger.info("Template com marcação complexa NÃO é extraído (regressão OK)")

    # ---- 4c. Regressão: linhas badge/bar (templates adjacentes) ------------
    linhas_badge = (
        'document.getElementById(`badge_${i.id}`).textContent = `--/${i.max}`;\n'
        'document.getElementById(`bar_${i.id}`).style.width = "0%";'
    )
    ujs_badge, _ = extrair_unidades_js(linhas_badge, "ko")
    textos_badge = [u.texto for u in ujs_badge]
    assert "badge_${i.id}" in textos_badge
    assert not any(").style" in t for t in textos_badge)  # sem trecho cruzado
    logger.info("Templates adjacentes extraídos corretamente (badge/bar OK)")

    # ---- 4d. Regressão: textContent/innerHTML visíveis SÃO traduzidos ------
    linha_text = 'st.textContent = "Ocultar painel";'
    ujs_text, _ = extrair_unidades_js(linha_text, "ko")
    assert any(u.texto == "Ocultar painel" for u in ujs_text)
    linha_tec = 'img.src = "logo.png";'
    ujs_tec, _ = extrair_unidades_js(linha_tec, "ko")
    assert ujs_tec == []
    logger.info("textContent traduzido / .src técnico ignorado (regressão OK)")

    # ---- 4e. Regressão: template do card de resultado (com <strong>) ------
    linha_msg = (
        'msg.innerHTML = `O recém-nascido obteve <strong>${somaScore} '
        'pontos</strong>.`;'
    )
    ujs_msg, _ = extrair_unidades_js(linha_msg, "ko")
    assert any(
        u.tipo == "js_template" and "<strong>" in u.texto for u in ujs_msg
    )
    logger.info("Template do card de resultado extraído (regressão OK)")

    # ---- 4f. Regressão: modelo devolve objeto completo em vez de texto ----
    import json as _json

    def _post_objeto(provider, mensagens):
        return _json.dumps(
            {"t1": {"type": "js_template", "context": "template",
                    "text": "번역된 텍스트"}},
            ensure_ascii=False,
        )

    post_original = providers._post_unico
    providers._post_unico = _post_objeto
    try:
        resultado_obj = providers.traduzir_payload(
            {"t1": {"type": "js_template", "context": "template",
                    "text": "Texto original"}},
            "ko", provider="deepseek",
        )
        assert resultado_obj == {"t1": "번역된 텍스트"}
    finally:
        providers._post_unico = post_original
    logger.info("Normalização de resposta do modelo OK (regressão OK)")

    # ---- 4g. Alternância deepseek ↔ openai com fallback (10 tentativas) ----
    sleep_original = providers.time.sleep
    cadeia_original = providers.resolver_providers
    post_original2 = providers._post_unico
    providers.time.sleep = lambda s: None

    chamadas_alt = []

    def _post_alterna(provider, mensagens):
        chamadas_alt.append(provider)
        if provider == "deepseek":
            raise TimeoutError("falha simulada no deepseek")
        return '{"t1": "성공"}'

    providers.resolver_providers = lambda: ["deepseek", "openai"]
    providers._post_unico = _post_alterna
    try:
        resultado_alt = providers.traduzir_payload(
            {"t1": {"type": "js_template", "context": "template", "text": "x"}},
            "ko",
        )
        assert resultado_alt == {"t1": "성공"}
        assert chamadas_alt == ["deepseek", "openai"]  # alternou e assumiu
    finally:
        providers._post_unico = post_original2
        providers.resolver_providers = cadeia_original

    chamadas_falha = []

    def _post_sempre_falha(provider, mensagens):
        chamadas_falha.append(provider)
        raise TimeoutError("falha total simulada")

    providers._post_unico = _post_sempre_falha
    providers.resolver_providers = lambda: ["deepseek", "openai"]
    try:
        try:
            providers.traduzir_payload(
                {"t1": {"type": "js_template", "context": "template",
                        "text": "x"}},
                "ko",
            )
            assert False, "deveria levantar RuntimeError após 10 tentativas"
        except RuntimeError:
            pass
        assert len(chamadas_falha) == 10
        assert chamadas_falha == ["deepseek", "openai"] * 5
    finally:
        providers._post_unico = post_original2
        providers.resolver_providers = cadeia_original
        providers.time.sleep = sleep_original

    logger.info("Alternância com fallback de 10 tentativas OK (regressão OK)")

    # ---- 5. CLI v2 em dry-run (sem API, sem gravação) ----
    from automacoes import tradutor_inteligente_v2
    tradutor_inteligente_v2.main([
        "--dry-run", "--idiomas", "ko",
        str(config.PASTA_PROJETO / "capurro.html"),
    ])
    logger.info("CLI v2 --dry-run executado sem erros")

    # ---- Limpeza ----
    shutil.rmtree(PASTA_TESTE, ignore_errors=True)

    logger.info("✅ Smoke test da Etapa 5 concluído com sucesso.")


def _pos_hreflang(html, idioma):
    return html.find(f'hreflang="{idioma}"')


if __name__ == "__main__":
    main()
