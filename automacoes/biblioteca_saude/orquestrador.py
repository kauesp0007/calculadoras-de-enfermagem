"""Orquestrador do pipeline (spec §21, §76, §77).

Roda as fases em sequência, de forma incremental e idempotente. Cada fase já
verifica status/hash e reprocessa apenas o que mudou (§50, §53).

Uso:
    python -m automacoes.biblioteca_saude.orquestrador          # execução real
    python -m automacoes.biblioteca_saude.orquestrador --dry-run
    python -m automacoes.biblioteca_saude.orquestrador --ate <fase>   # ex.: --ate extracao
"""

import sys
from datetime import datetime, timezone

from . import (
    ingestao,
    hash_manager,
    extracao,
    catalogacao,
    indexacao,
    estado,
    analise,
    auditoria,
    gerador_docx,
    revisao,
    relatorio,
)
from .logger import registrar

# Ordem canônica das fases (spec §77)
FASES = [
    ("ingestao", ingestao.executar),
    ("hash", hash_manager.executar),
    ("extracao", extracao.executar),
    ("catalogacao", catalogacao.executar),
    ("indexacao", indexacao.executar),
    ("estado", estado.executar),
    ("analise", analise.executar),
    ("auditoria", auditoria.executar),
    ("docx", gerador_docx.executar),
    ("revisao", revisao.executar),
    ("relatorio", relatorio.executar),
]


def executar(dry_run: bool = False, ate: str | None = None) -> dict:
    resumo = {}
    inicio = datetime.now(timezone.utc).isoformat()
    registrar(f"ORQUESTRADOR iniciado (dry-run={dry_run}, até={ate or 'fim'})")

    for nome, fn in FASES:
        if ate and nome == ate:
            # executa esta fase e encerra
            registrar(f"FASE {nome} ...")
            fn(dry_run=dry_run)
            resumo[nome] = "ok"
            break

        registrar(f"FASE {nome} ...")
        try:
            fn(dry_run=dry_run)
            resumo[nome] = "ok"
        except Exception as e:  # noqa: BLE001
            resumo[nome] = f"erro: {e}"
            registrar(f"ERRO na fase {nome}: {e}")
            if not dry_run:
                raise

    registrar(f"ORQUESTRADOR concluído. Início: {inicio}")
    return resumo


def _main() -> int:
    dry_run = "--dry-run" in sys.argv
    ate = None
    if "--ate" in sys.argv:
        try:
            ate = sys.argv[sys.argv.index("--ate") + 1]
        except IndexError:
            pass
    resumo = executar(dry_run=dry_run, ate=ate)
    print("\n=== RESUMO DO PIPELINE ===")
    for k, v in resumo.items():
        print(f"  {k:12}: {v}")
    return 0


if __name__ == "__main__":
    raise SystemExit(_main())
