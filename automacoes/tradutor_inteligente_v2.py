"""CLI do Tradutor Inteligente v2 — Etapa 5.

Exemplos (a partir da raiz do repositório):

  py -m automacoes.tradutor_inteligente_v2 capurro.html --idiomas ko --dry-run
  py -m automacoes.tradutor_inteligente_v2 capurro.html --idiomas ko en
  py -m automacoes.tradutor_inteligente_v2 capurro.html --idiomas all
  py -m automacoes.tradutor_inteligente_v2 capurro.html --idiomas ko --audit
  py -m automacoes.tradutor_inteligente_v2 capurro.html --idiomas ko ^
      --pasta-saida automacoes/translation/cache/piloto
"""

import argparse

from automacoes.translation import audit, config, logger, orchestrator


def _imprimir_resultado(r):
    logger.info(
        f"{r['arquivo']} → {r['idioma']} ({r['modo']}): "
        f"{r['unidades_total']} unidades | {r['unidades_novas']} novas | "
        f"{r['unidades_em_cache']} em cache | {r['lotes']} lotes | "
        f"{r['caracteres_enviados']} chars | estrutura_ok={r['estrutura_ok']}"
    )


def main(argv=None):
    parser = argparse.ArgumentParser(
        description="Tradutor Inteligente v2 (localização de páginas HTML)."
    )
    parser.add_argument(
        "arquivos", nargs="+",
        help="Arquivos HTML na raiz do site (ex.: capurro.html)",
    )
    parser.add_argument(
        "--idiomas", required=True,
        help="Códigos ISO separados por espaço (ex.: 'ko en') ou 'all'.",
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Pipeline completo SEM chamadas à API e sem gravar.",
    )
    parser.add_argument(
        "--audit", action="store_true",
        help="Gera relatório de auditoria (estrutura, pt restante, legado).",
    )
    parser.add_argument(
        "--provider", default=None,
        help="Forçar provider (deepseek/openai). Padrão: config .env.",
    )
    parser.add_argument(
        "--sem-memoria", action="store_true",
        help="Ignora a memória de tradução (SQLite).",
    )
    parser.add_argument(
        "--pasta-saida", default=None,
        help="Pasta alternativa de saída (padrão: ./<idioma>/).",
    )

    args = parser.parse_args(argv)

    if args.idiomas == "all":
        idiomas = config.IDIOMAS_SUPORTADOS
    else:
        idiomas = args.idiomas.split()

    modo = "dry-run" if args.dry_run else "real"

    for arquivo in args.arquivos:
        origem = config.PASTA_PROJETO / arquivo
        if not origem.exists():
            logger.erro(f"Arquivo não encontrado: {origem}")
            continue

        for idioma in idiomas:
            resultado = orchestrator.traduzir_arquivo(
                origem, idioma, modo=modo,
                usar_memoria=not args.sem_memoria,
                pasta_saida=args.pasta_saida,
                provider=args.provider,
            )
            _imprimir_resultado(resultado)

            if args.audit:
                html_original = origem.read_text(encoding="utf-8")
                # Comparação de regressão sempre com a versão publicada
                # do idioma (produzida pelo tradutor legado), se existir.
                caminho_legado = config.PASTA_PROJETO / idioma / origem.name
                rel = audit.relatorio(
                    resultado["html_final"], html_original, caminho_legado
                )
                audit.imprimir_relatorio(rel)


if __name__ == "__main__":
    main()
