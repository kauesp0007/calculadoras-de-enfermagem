"""FASE 14 — Dashboard / relatórios (spec §61, §60, §84).

Gera estatísticas internas da biblioteca, atualiza o manifesto e registra um
relatório consolidado em `estatisticas/relatorio.json`.
"""

import json
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

from .config import DOCUMENTOS_DIR, JSON_DIR
from .ingestao import carregar_indice

ITENS_DIR = JSON_DIR / "catalogo" / "itens"
MANIFEST = JSON_DIR / "manifest.json"


def _agora() -> str:
    return datetime.now(timezone.utc).isoformat()


def _coletar() -> dict:
    indice = carregar_indice()
    docs = []
    for info in indice["documentos"].values():
        p = DOCUMENTOS_DIR / f"{info['id']}.json"
        if p.exists():
            docs.append(json.loads(p.read_text(encoding="utf-8")))

    itens = []
    if ITENS_DIR.exists():
        for p in ITENS_DIR.glob("*.json"):
            itens.append(json.loads(p.read_text(encoding="utf-8")))

    por_status = Counter(d.get("status") for d in docs)
    itens_por_status = Counter(i.get("status") for i in itens)
    por_tipo = Counter(d.get("tipo_documental") for d in docs if d.get("status") == "CATALOGED" or d.get("status") in ("ANALYZED", "AUDITED", "APPROVED"))
    por_ano = Counter(d.get("ano_publicacao") for d in docs if d.get("ano_publicacao"))

    especialidades = Counter()
    for d in docs:
        for e in (d.get("especialidade") or []):
            especialidades[e] += 1

    return {
        "documentos": len(docs),
        "itens_conhecimento": len(itens),
        "por_status": dict(por_status),
        "itens_por_status": dict(itens_por_status),
        "por_tipo": {str(k): v for k, v in por_tipo.items()},
        "por_ano": {str(k): v for k, v in sorted(por_ano.items())},
        "por_especialidade": dict(especialidades),
        "gerado_em": _agora(),
    }


def executar(dry_run: bool = False) -> dict:
    stats = _coletar()

    # Atualiza manifesto (§60)
    manifest = {}
    if MANIFEST.exists():
        manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    manifest.setdefault("estatisticas", {})
    manifest["estatisticas"].update({
        "documentos": stats["documentos"],
        "itens_conhecimento": stats["itens_conhecimento"],
        "documentos_por_status": stats["por_status"],
    })

    relatorio = {
        "estatisticas": stats,
        "arquivos_criados": _listar_criados(),
    }

    if not dry_run:
        stats_dir = JSON_DIR / "estatisticas"
        stats_dir.mkdir(parents=True, exist_ok=True)
        (stats_dir / "relatorio.json").write_text(
            json.dumps(relatorio, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    return relatorio


def _listar_criados() -> list:
    return [
        f"biblioteca_de_enfermagem_json/{p.name}"
        for p in sorted((JSON_DIR / "catalogo" / "itens").glob("*.json"))
    ]


def _main() -> int:
    dry_run = "--dry-run" in sys.argv
    r = executar(dry_run=dry_run)
    modo = "DRY-RUN" if dry_run else "EXECUÇÃO"
    print(f"[FASE 14 — RELATÓRIO] modo={modo}")
    s = r["estatisticas"]
    print(f"  Documentos          : {s['documentos']}")
    print(f"  Itens de conhecimento: {s['itens_conhecimento']}")
    for st, q in s["por_status"].items():
        print(f"    {st:22}: {q}")
    print(f"  Por ano             : {s['por_ano']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(_main())
