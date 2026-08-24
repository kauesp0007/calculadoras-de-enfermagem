"""Orquestrador do ciclo completo de tradução — Etapa 3 (+managers Etapa 4).

Pipeline:
    ler HTML → proteger → extrair (HTML/SEO/Schema/JS) → consultar memória
    → deduplicar → montar lotes → traduzir (API, com retry) → gravar memória
    → reconstruir → validar estrutura → managers (rotas/footer/lang/SEO/
    hreflang/fontes) → revalidar → gravar arquivo (apenas modo real).

Modo dry-run: executa TUDO exceto chamadas à API e gravação de arquivos.
"""

from pathlib import Path

from automacoes.translation import config, logger
from automacoes.translation import hooks, managers
from automacoes.translation.batcher import montar_lotes, montar_payload
from automacoes.translation.extractor import deduplicar, texto_traduzivel
from automacoes.translation.html_extractor import extrair_unidades_html
from automacoes.translation.js_extractor import extrair_unidades_js
from automacoes.translation.protection import proteger_html
from automacoes.translation.providers import traduzir_payload, resolver_providers
from automacoes.translation.rebuild import gravar_arquivo, montar_html_final
from automacoes.translation.schema_extractor import extrair_unidades_schema
from automacoes.translation.seo_extractor import extrair_unidades_seo
from automacoes.translation.translation_memory import MemoriaTraducao
from automacoes.translation.validator import validar_html_estrutura


def _extrair_tudo(protecao, idioma_destino):
    """Extrai todas as unidades do HTML protegido + scripts inline."""
    unidades_html = extrair_unidades_html(
        protecao.html_protegido, idioma_destino, prefixo="h"
    )
    unidades_seo = extrair_unidades_seo(
        protecao.html_protegido, idioma_destino, prefixo="seo"
    )
    unidades_schema, blocos_schema = extrair_unidades_schema(
        protecao.html_protegido, idioma_destino, prefixo="schema"
    )
    scripts_extraidos = {}
    for placeholder, codigo in protecao.scripts_inline.items():
        ujs, _ = extrair_unidades_js(
            codigo, idioma_destino, prefixo=f"js_{len(scripts_extraidos)}"
        )
        scripts_extraidos[placeholder] = (codigo, ujs)

    return (
        unidades_html, unidades_seo, unidades_schema, blocos_schema,
        scripts_extraidos,
    )


def traduzir_arquivo(caminho_html, idioma_destino, modo="dry-run",
                     usar_memoria=True, caminho_memoria=None,
                     pasta_saida=None, provider=None):
    """Traduz um arquivo HTML. `modo`: "dry-run" ou "real".

    Retorna um dict com estatísticas. Nunca grava se a validação estrutural
    falhar (fail-safe).
    """
    if idioma_destino not in config.IDIOMAS_SUPORTADOS:
        raise ValueError(
            f"Idioma '{idioma_destino}' não suportado. "
            f"Opções: {', '.join(config.IDIOMAS_SUPORTADOS)}"
        )

    caminho = Path(caminho_html)
    html_original = caminho.read_text(encoding="utf-8")

    logger.info(f"Traduzindo {caminho.name} → {idioma_destino} (modo={modo})")

    # ---- 1. Proteção ----
    protecao = proteger_html(html_original)

    # ---- 2. Extração ----
    (unidades_html, unidades_seo, unidades_schema, blocos_schema,
     scripts_extraidos) = _extrair_tudo(protecao, idioma_destino)
    unidades_js = [u for _, (_, us) in scripts_extraidos.items() for u in us]
    todas = unidades_html + unidades_seo + unidades_schema + unidades_js

    # ---- 3. Memória + deduplicação ----
    memoria = None
    hashes_em_cache = set()
    cache = {}
    if usar_memoria:
        memoria = MemoriaTraducao(caminho_memoria)
        validas = [u for u in todas if texto_traduzivel(u.texto)]
        cache = memoria.obter_muitos({u.hash for u in validas})
        hashes_em_cache = set(cache.keys())

    novas, stats = deduplicar(todas, hashes_em_cache)

    # Traduções iniciais: o que já está em memória
    traducoes = {}
    for u in todas:
        if u.hash in cache:
            traducoes[u.id] = cache[u.hash]

    # ---- 4. Lotes ----
    lotes = montar_lotes(novas)
    chars_enviados = sum(len(u.texto) for u in novas)

    # ---- 5. Tradução ----
    if modo == "real" and novas:
        providers = resolver_providers()
        registros_memoria = []
        for indice, lote in enumerate(lotes, 1):
            provider_atual = provider or providers[
                (indice - 1) % len(providers)
            ]
            payload = montar_payload(lote)
            logger.info(
                f"Lote {indice}/{len(lotes)} ({len(lote)} itens) → "
                f"{provider_atual}"
            )
            try:
                resposta = traduzir_payload(
                    payload, idioma_destino, provider=provider_atual
                )
            except RuntimeError as e:
                logger.erro(
                    f"Lote {indice} falhou — mantendo originais deste lote. "
                    f"({e})"
                )
                continue
            for u in lote:
                if u.id in resposta:
                    traducoes[u.id] = resposta[u.id]
                    registros_memoria.append(
                        (u.hash, u.idioma_origem, u.idioma_destino, u.tipo,
                         u.contexto, u.texto, resposta[u.id])
                    )
        if memoria is not None and registros_memoria:
            memoria.gravar_muitos(registros_memoria)

    # ---- 6. Reconstrução + validação ----
    html_final, ok, problemas = montar_html_final(
        html_original, protecao,
        unidades_html + unidades_seo,
        unidades_schema, blocos_schema, scripts_extraidos,
        traducoes, idioma_destino,
    )

    # ---- 6b. Managers determinísticos (rotas, footer, lang, SEO,
    #         hreflang, fontes) + revalidação estrutural ----
    if ok:
        html_final = managers.aplicar_todos(html_final, idioma_destino)
        ok, problemas = validar_html_estrutura(html_original, html_final)

    resultado = {
        "arquivo": caminho.name,
        "idioma": idioma_destino,
        "modo": modo,
        "html_original_chars": len(html_original),
        "unidades_total": stats["total"],
        "unidades_invalidas": stats["invalidas"],
        "unidades_duplicadas": stats["duplicadas"],
        "unidades_em_cache": stats["em_cache"],
        "unidades_novas": len(novas),
        "caracteres_enviados": chars_enviados,
        "lotes": len(lotes),
        "estrutura_ok": ok,
        "problemas": problemas,
        "caminho_saida": None,
        "html_final": html_final,
    }

    if not ok:
        logger.erro(
            f"Validação estrutural FALHOU — arquivo NÃO será salvo: "
            f"{problemas}"
        )
        return resultado

    # ---- 7. Gravação (somente modo real) ----
    if modo == "real":
        pasta_base = Path(pasta_saida) if pasta_saida else \
            config.PASTA_PROJETO / idioma_destino
        caminho_saida = pasta_base / caminho.name
        gravar_arquivo(caminho_saida, html_final, idioma_destino)
        hooks.apos_salvar(caminho.name, idioma_destino, caminho_saida)
        resultado["caminho_saida"] = str(caminho_saida)

    return resultado
