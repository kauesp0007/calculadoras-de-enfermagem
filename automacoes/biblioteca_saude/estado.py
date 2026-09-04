"""FASE 8 — Memória persistente / checkpoint (spec §40, §50, §53, §83).

Consolida o estado de cada documento para permitir retomada (checkpoint) e
evitar reprocessamento desnecessário. O estado persistente já vive em:

- `catalogo/index_documentos.json` — hash + status por documento;
- `catalogo/documentos/<id>.json` — registro completo;
- `extratos/<id>.txt` — texto bruto extraído (FASE 5).

Este módulo apenas materializa um relatório consolidado de checkpoint.
"""

import json
import sys
from collections import Counter
from pathlib import Path

from .config import JSON_DIR
from .ingestao import carregar_indice


def executar(dry_run: bool = False) -> dict:
    indice = carregar_indice()
    estados = Counter()
    por_status: dict = {}
    for nome, info in indice["documentos"].items():
        st = info.get("status") or "INGESTED"
        estados[st] += 1
        por_status.setdefault(st, []).append(nome)

    checkpoint = {
        "total_documentos": len(indice["documentos"]),
        "por_status": dict(estados),
        "detalhe": {k: v for k, v in sorted(por_status.items())},
    }

    if not dry_run:
        caminho = JSON_DIR / "estatisticas" / "checkpoint.json"
        caminho.parent.mkdir(parents=True, exist_ok=True)
        caminho.write_text(
            json.dumps(checkpoint, ensure_ascii=False, indent=2), encoding="utf-8"
        )

    return checkpoint


def _main() -> int:
    dry_run = "--dry-run" in sys.argv
    c = executar(dry_run=dry_run)
    modo = "DRY-RUN" if dry_run else "EXECUÇÃO"
    print(f"[FASE 8 — CHECKPOINT] modo={modo}")
    print(f"  Total de documentos : {c['total_documentos']}")
    for st, qtd in c["por_status"].items():
        print(f"  {st:22}: {qtd}")
    return 0


if __name__ == "__main__":
    raise SystemExit(_main())
