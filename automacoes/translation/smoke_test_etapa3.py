"""Teste de fumaça da Etapa 3 — orquestração SEM chamadas reais à API.

- Tradução fake (monkeypatch) para validar o pipeline completo.
- Teste de retry do provider com falha única e depois sucesso.
- Dry-run real sobre capurro.html (somente leitura, sem API).
- Arquivos de saída vão para cache/teste_etapa3 (removidos ao final).
"""

import json
import shutil
from contextlib import contextmanager

from automacoes.translation import config, logger
from automacoes.translation import hooks, orchestrator, providers

HTML_AMOSTRA = """<!doctype html>
<html lang="pt-BR">
<head>
<title>Método de Capurro</title>
<meta name="description" content="Calculadora do Método de Capurro."/>
<meta property="og:url" content="https://www.calculadorasdeenfermagem.com.br/capurro.html"/>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"O que é o Capurro?","acceptedAnswer":{"@type":"Answer","text":"Método para estimar a idade gestacional."}}]}</script>
<style>body{color:red}</style>
<script>
  const btn = document.getElementById("btnCalcular");
  btn.addEventListener("click", function(){ showToast("Resultado positivo"); });
</script>
</head>
<body>
<h1>Método de Capurro</h1>
<p>Ferramenta de apoio para enfermeiros.</p>
<img src="/img/logo.webp" alt="Logotipo Calculadoras de Enfermagem">
</body>
</html>"""

PASTA_TESTE = config.PASTA_CACHE / "teste_etapa3"
MEMORIA_TESTE = config.PASTA_CACHE / "teste_etapa3_memoria.sqlite"

_TRADUZIR_PAYLOAD_ORIGINAL = orchestrator.traduzir_payload


def _tradutor_fake(payload, idioma_destino, provider=None):
    """Simula a API: devolve {id: text + ' [KO]'} sem chamadas reais."""
    return {
        chave: f"{item['text']} [KO]"
        for chave, item in payload.items()
    }


@contextmanager
def _com_tradutor_fake(funcao):
    orchestrator.traduzir_payload = funcao
    try:
        yield
    finally:
        orchestrator.traduzir_payload = _TRADUZIR_PAYLOAD_ORIGINAL


@contextmanager
def _com_hook_fake(funcao):
    original = hooks.apos_salvar
    hooks.apos_salvar = funcao
    try:
        yield
    finally:
        hooks.apos_salvar = original


def main():
    logger.info("=== Smoke test da Etapa 3 (orquestração) ===")

    # ---- 1. Retry do provider (1 falha, depois sucesso) ----
    chamadas = {"n": 0}
    resposta_ok = json.dumps({"u001": "카푸로"})

    def _post_falha_depois_ok(provider, mensagens):
        chamadas["n"] += 1
        if chamadas["n"] == 1:
            raise TimeoutError("read timed out (simulado)")
        return resposta_ok

    original = providers._post_unico
    providers._post_unico = _post_falha_depois_ok
    try:
        payload = {"u001": {"type": "html_text", "context": "h1", "text": "Capurro"}}
        resultado = providers.traduzir_payload(payload, "ko", provider="deepseek")
        assert resultado == {"u001": "카푸로"}
        assert chamadas["n"] == 2
        logger.info("Retry com backoff OK (2 chamadas, 1 falha simulada)")
    finally:
        providers._post_unico = original

    # ---- 2. Pipeline completo com tradução fake (modo real em pasta teste) ----
    shutil.rmtree(PASTA_TESTE, ignore_errors=True)
    if MEMORIA_TESTE.exists():
        MEMORIA_TESTE.unlink()

    caminho_fonte = PASTA_TESTE / "origem" / "amostra.html"
    caminho_fonte.parent.mkdir(parents=True, exist_ok=True)
    caminho_fonte.write_text(HTML_AMOSTRA, encoding="utf-8")

    chamadas_hook = {"n": 0}

    def _hook_fake(arquivo, idioma_destino, caminho_saida):
        chamadas_hook["n"] += 1

    with _com_tradutor_fake(_tradutor_fake), _com_hook_fake(_hook_fake):
        resultado = orchestrator.traduzir_arquivo(
            caminho_fonte, "ko", modo="real",
            usar_memoria=True, caminho_memoria=MEMORIA_TESTE,
            pasta_saida=PASTA_TESTE / "ko",
        )

    logger.info(
        f"Pipeline: {resultado['unidades_total']} unidades, "
        f"{resultado['unidades_novas']} novas, "
        f"{resultado['caracteres_enviados']} chars, "
        f"estrutura_ok={resultado['estrutura_ok']}"
    )
    assert resultado["estrutura_ok"] is True
    assert resultado["problemas"] == []
    assert resultado["caminho_saida"]

    saida = (PASTA_TESTE / "ko" / "amostra.html").read_text(encoding="utf-8")
    assert "Método de Capurro [KO]" in saida
    assert "Resultado positivo [KO]" in saida
    assert "getElementById(\"btnCalcular\")" in saida
    assert 'body{color:red}' in saida  # style restaurado intacto
    assert '"@context":"https://schema.org"' in saida
    logger.info("Arquivo traduzido gravado e validado em pasta de teste")

    # ---- 3. Segunda execução → memória reaproveita tudo (0 chamadas) ----
    contador_chamadas = {"n": 0}

    def _fake_contador(payload, idioma_destino, provider=None):
        contador_chamadas["n"] += 1
        return _tradutor_fake(payload, idioma_destino, provider)

    with _com_tradutor_fake(_fake_contador), _com_hook_fake(_hook_fake):
        resultado2 = orchestrator.traduzir_arquivo(
            caminho_fonte, "ko", modo="real",
            usar_memoria=True, caminho_memoria=MEMORIA_TESTE,
            pasta_saida=PASTA_TESTE / "ko",
        )

    assert resultado2["unidades_em_cache"] > 0
    assert contador_chamadas["n"] == 0
    assert chamadas_hook["n"] == 2
    logger.info(
        f"Memória de tradução OK: {resultado2['unidades_em_cache']} unidades "
        f"reaproveitadas, 0 chamadas à API"
    )

    # ---- 4. Dry-run real sobre capurro.html (sem API, sem gravação) ----
    caminho_real = config.PASTA_PROJETO / "capurro.html"
    if caminho_real.exists():
        resultado3 = orchestrator.traduzir_arquivo(
            caminho_real, "ko", modo="dry-run", usar_memoria=False
        )
        logger.info(
            f"DRY-RUN capurro.html: {resultado3['unidades_total']} unidades | "
            f"{resultado3['unidades_novas']} novas | "
            f"{resultado3['caracteres_enviados']} chars | "
            f"{resultado3['lotes']} lotes | estrutura_ok="
            f"{resultado3['estrutura_ok']}"
        )
        assert resultado3["estrutura_ok"] is True
        assert resultado3["caminho_saida"] is None
        assert resultado3["unidades_novas"] > 50
    else:
        logger.aviso("capurro.html não encontrado — dry-run pulado.")

    # ---- Limpeza ----
    shutil.rmtree(PASTA_TESTE, ignore_errors=True)
    if MEMORIA_TESTE.exists():
        MEMORIA_TESTE.unlink()

    logger.info("✅ Smoke test da Etapa 3 concluído com sucesso.")


if __name__ == "__main__":
    main()
