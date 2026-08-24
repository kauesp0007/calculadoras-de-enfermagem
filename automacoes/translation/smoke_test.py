"""Teste de fumaça da Etapa 1 — NÃO chama API e NÃO modifica o site.

Uso (a partir da raiz do repositório):
    py -m automacoes.translation.smoke_test
"""

from automacoes.translation import config
from automacoes.translation import logger
from automacoes.translation.batcher import (
    montar_lotes, montar_payload, estimar_tokens,
)
from automacoes.translation.extractor import (
    UnidadeTraduzivel, gerar_hash, texto_traduzivel, deduplicar,
)
from automacoes.translation.glossary import carregar_glossario, consultar_glossario
from automacoes.translation.translation_memory import MemoriaTraducao


def _criar_unidades():
    return [
        UnidadeTraduzivel("u001", "html_text", "h1", "Método de Capurro", idioma_destino="ko"),
        UnidadeTraduzivel("u002", "html_text", "message", "Resultado positivo", idioma_destino="ko"),
        UnidadeTraduzivel("u003", "html_text", "message", "Resultado positivo", idioma_destino="ko"),  # duplicada
        UnidadeTraduzivel("u004", "html_text", "message", "", idioma_destino="ko"),                    # inválida (vazia)
        UnidadeTraduzivel("u005", "html_text", "span", "12345", idioma_destino="ko"),                  # inválida (só números)
        UnidadeTraduzivel("u006", "attribute", "img", "Logotipo da calculadora", idioma_destino="ko"),
        UnidadeTraduzivel("u007", "js_message", "toast", "Formulário limpo. Pronto para nova avaliação.", idioma_destino="ko"),
    ]


def main():
    logger.info("=== Smoke test da Etapa 1 (fundação) ===")
    logger.info(f"Provider configurado: {config.TRANSLATION_PROVIDER}")
    logger.info(
        f"Limites de lote: {config.MAX_TRANSLATION_CHARS} chars / "
        f"{config.MAX_TRANSLATION_ITEMS} itens / "
        f"{config.MAX_TRANSLATION_TOKENS_ESTIMATED} tokens"
    )

    # ---- 1. Filtro de texto e deduplicação ----
    assert texto_traduzivel("Conduta de Enfermagem") is True
    assert texto_traduzivel("") is False
    assert texto_traduzivel("12345") is False
    assert texto_traduzivel("click") is False

    unidades = _criar_unidades()
    novas, stats = deduplicar(unidades, hashes_existentes=set())
    logger.info(f"Deduplicação (sem cache): {stats}")
    assert stats["total"] == 7
    assert stats["duplicadas"] == 1
    assert stats["invalidas"] == 2
    assert len(novas) == 4

    # ---- 2. Lotes inteligentes e payload estruturado ----
    lotes = montar_lotes(novas)
    logger.info(f"Lotes montados: {len(lotes)}")
    assert len(lotes) >= 1
    payload = montar_payload(lotes[0])
    assert set(payload.keys()) == set(u.id for u in lotes[0])
    assert "text" in next(iter(payload.values()))
    logger.info(f"Exemplo de payload: {list(payload.keys())}")
    logger.info(f"Estimativa de tokens para 100 chars latinos: {estimar_tokens('a' * 100)}")

    # ---- 3. Memória de tradução (SQLite em arquivo temporário de teste) ----
    caminho_smoke = config.PASTA_CACHE / "_smoke_test.sqlite"
    memoria = MemoriaTraducao(caminho=caminho_smoke)

    h = gerar_hash("html_text", "message", "Resultado positivo", "pt-BR", "ko")
    memoria.gravar(h, "pt-BR", "ko", "html_text", "message", "Resultado positivo", "결과 양성")
    assert memoria.obter(h) == "결과 양성"
    assert memoria.existe(h) is True

    memoria.gravar_muitos([
        (gerar_hash("html_text", "h1", "Método de Capurro", "pt-BR", "ko"),
         "pt-BR", "ko", "html_text", "h1", "Método de Capurro", "카푸로 방법"),
    ])
    logger.info(f"Memória de tradução: {memoria.estatisticas()}")
    assert memoria.estatisticas()["total"] == 2

    # Dedup considerando cache: "Resultado positivo" deve cair no cache.
    novas2, stats2 = deduplicar(unidades, hashes_existentes={h})
    logger.info(f"Deduplicação (com cache): {stats2}")
    assert stats2["em_cache"] == 1
    assert len(novas2) == 3

    memoria.fechar()
    caminho_smoke.unlink(missing_ok=True)
    logger.info("Memória de teste removida com sucesso.")

    # ---- 4. Glossário ----
    glossario = carregar_glossario()
    traducao_glossario = consultar_glossario("Conduta de Enfermagem", "en", glossario=glossario)
    logger.info(f"Glossário ('Conduta de Enfermagem' → en): {traducao_glossario}")
    assert traducao_glossario == "Nursing Management"
    assert consultar_glossario("Termo Inexistente", "en", glossario=glossario) is None

    logger.info("✅ Smoke test da Etapa 1 concluído com sucesso.")


if __name__ == "__main__":
    main()
