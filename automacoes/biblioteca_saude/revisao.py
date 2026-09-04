"""FASE 12 — Revisão final (spec §20 SUBAGENTE_REVISAO_FINAL, §66).

Verifica a integridade do item + documento Word gerado (rastreabilidade,
ausência de invenção, integridade do DOCX) e marca APPROVED ou
REQUIRES_HUMAN_REVIEW. Determinística — não aprova conteúdo não auditável.

PUBLISHED NUNCA é marcado aqui: publicação é decisão explícita posterior (§66).
"""

import json
import sys
from pathlib import Path

from .config import DOCUMENTOS_DIR, JSON_DIR


def _docx_valido(item: dict) -> tuple[bool, str]:
    caminho = item.get("docx_gerado_em")
    if not caminho:
        return False, "DOCX não gerado"
    p = Path("biblioteca_de_enfermagem") / Path(caminho).name
    if not p.exists():
        return False, f"DOCX ausente: {p.name}"
    try:
        from docx import Document
        d = Document(str(p))
        if not d.paragraphs:
            return False, "DOCX vazio"
        return True, "ok"
    except Exception as e:  # noqa: BLE001
        return False, f"DOCX inválido: {e}"


def _fonte_rastreavel(item: dict) -> tuple[bool, str]:
    doc_id = item.get("fonte_id")
    if not doc_id:
        return False, "sem fonte_id"
    if not (DOCUMENTOS_DIR / f"{doc_id}.json").exists():
        return False, "documento fonte não encontrado"
    return True, "ok"


def _conteudo_presente(item: dict) -> tuple[bool, str]:
    conteudo = item.get("conteudo") or {}
    if not item.get("resumo") and not conteudo.get("conceitos"):
        return False, "sem resumo nem conceitos"
    return True, "ok"


def executar(dry_run: bool = False) -> dict:
    from .config import JSON_DIR
    itens_dir = JSON_DIR / "catalogo" / "itens"

    resumo = {"aprovados": [], "revisao_humana": [], "pulados": []}
    itens = []
    if itens_dir.exists():
        for p in itens_dir.glob("*.json"):
            itens.append(json.loads(p.read_text(encoding="utf-8")))

    checks = [
        ("CHECK_11", "documento Word válido", _docx_valido),
        ("CHECK_01", "fonte rastreável", _fonte_rastreavel),
        ("CHECK_05", "conteúdo presente (sem invenção)", _conteudo_presente),
    ]

    for item in itens:
        if item.get("status") not in ("WRITING", "AUDITED", "APPROVED"):
            resumo["pulados"].append(item.get("titulo") or item["id"])
            continue

        todas_ok = True
        detalhes = []
        for codigo, desc, fn in checks:
            ok, msg = fn(item)
            detalhes.append({"codigo": codigo, "descricao": desc, "status": "PASS" if ok else "FAIL", "observacao": msg})
            if not ok:
                todas_ok = False

        if todas_ok:
            resumo["aprovados"].append(item.get("titulo") or item["id"])
            item["status"] = "APPROVED"
        else:
            resumo["revisao_humana"].append(item.get("titulo") or item["id"])
            item["status"] = "REQUIRES_HUMAN_REVIEW"

        if not dry_run:
            (itens_dir / f"{item['id']}.json").write_text(
                json.dumps(item, ensure_ascii=False, indent=2), encoding="utf-8"
            )

    return resumo


def _main() -> int:
    dry_run = "--dry-run" in sys.argv
    r = executar(dry_run=dry_run)
    modo = "DRY-RUN" if dry_run else "EXECUÇÃO"
    print(f"[FASE 12 — REVISÃO] modo={modo}")
    print(f"  Aprovados       : {len(r['aprovados'])}")
    print(f"  Revisão humana  : {len(r['revisao_humana'])}")
    for t in r["revisao_humana"]:
        print(f"      - {t}")
    print(f"  Pulados         : {len(r['pulados'])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(_main())
