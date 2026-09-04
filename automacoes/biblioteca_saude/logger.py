"""FASE 13 — Logs (spec §41).

Logging persistente em `logs/biblioteca_saude.log`. Cada evento é registrado
com timestamp UTC. Mantém também um histórico resumido das execuções.
"""

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from .config import LOGS_DIR, JSON_DIR

LOG_FILE = LOGS_DIR / "biblioteca_saude.log"


def registrar(evento: str, tambem_stdout: bool = True) -> str:
    ts = datetime.now(timezone.utc).isoformat()
    linha = f"{ts} | {evento}"
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(linha + "\n")
    if tambem_stdout:
        print(linha)
    return linha


def _main() -> int:
    registrar("FASE 13 — logging inicializado")
    print("Log gravado em logs/biblioteca_saude.log")
    return 0


if __name__ == "__main__":
    raise SystemExit(_main())
