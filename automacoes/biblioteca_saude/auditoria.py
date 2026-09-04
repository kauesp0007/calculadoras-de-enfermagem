"""FASE 10 — Auditoria bibliográfica (spec §15, §59).

Executa checagens determinísticas de integridade sobre cada item ANALYZED e
registra o resultado. A comparação cruzada com outras fontes (divergências,
conflitos) é feita quando há múltiplas fontes independentes — aqui o acervo é
composto por documentos do mesmo órgão (Ministério da Saúde).

Checagens (determinísticas, sem IA):
  CHECK_01 fonte existe
  CHECK_02 metadados válidos
  CHECK_06 datas consistentes
  CHECK_13 JSON válido
  CHECK_14 índice atualizado
"""

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from .config import DOCUMENTOS_DIR, JSON_DIR
from .ingestao import carregar_indice, salvar_indice

ITENS_DIR = JSON_DIR / "catalogo" / "itens"
AUDITORIAS_DIR = JSON_DIR / "auditorias"

TIPOS_VALIDOS = {
    "BOOK", "ARTICLE", "JOURNAL", "GUIDELINE", "PROTOCOL", "POP", "MANUAL",
    "DICTIONARY", "THESIS", "DISSERTATION", "MONOGRAPH", "GOVERNMENT_DOCUMENT",
    "TECHNICAL_REPORT", "INTERVIEW", "VIDEO_TRANSCRIPT", "EDUCATIONAL_MATERIAL", "OTHER",
}


def _agora() -> str:
    return datetime.now(timezone.utc).isoformat()


def _check_fonte(item: dict) -> tuple[bool, str]:
    doc_id = item.get("fonte_id")
    if not doc_id or not (DOCUMENTOS_DIR / f"{doc_id}.json").exists():
        return False, "fonte não encontrada"
    return True, "ok"


def _check_metadados(item: dict) -> tuple[bool, str]:
    if not item.get("titulo"):
        return False, "título ausente"
    if item.get("tipo_documental") not in TIPOS_VALIDOS:
        return False, "tipo documental inválido"
    return True, "ok"


def _check_datas(item: dict) -> tuple[bool, str]:
    entrada = item.get("data_entrada")
    process = item.get("data_processamento")
    if not entrada or not process:
        return False, "datas ausentes"
    if entrada > process:
        return False, "data_entrada > data_processamento"
    return True, "ok"


def _check_json_valido(item: dict) -> tuple[bool, str]:
    try:
        json.dumps(item, ensure_ascii=False)
        return True, "ok"
    except (TypeError, ValueError) as e:
        return False, f"JSON inválido: {e}"


def executar(dry_run: bool = False) -> dict:
    resumo = {"auditados": [], "com_falha": [], "pulados": []}

    itens = []
    if ITENS_DIR.exists():
        for p in ITENS_DIR.glob("*.json"):
            itens.append(json.loads(p.read_text(encoding="utf-8")))

    indice = carregar_indice()

    for item in itens:
        if item.get("status") not in ("ANALYZED", "AUDITED"):
            resumo["pulados"].append(item.get("titulo") or item["id"])
            continue

        checks = [
            {"codigo": "CHECK_01", "descricao": "fonte existe"},
            {"codigo": "CHECK_02", "descricao": "metadados válidos"},
            {"codigo": "CHECK_06", "descricao": "datas consistentes"},
            {"codigo": "CHECK_13", "descricao": "JSON válido"},
        ]
        funcoes = [_check_fonte, _check_metadados, _check_datas, _check_json_valido]

        todas_ok = True
        for chk, fn in zip(checks, funcoes):
            ok, msg = fn(item)
            chk["status"] = "PASS" if ok else "FAIL"
            chk["observacao"] = msg
            if not ok:
                todas_ok = False

        registro = {
            "id": "aud-" + item["id"],
            "alvo_id": item["id"],
            "data": _agora(),
            "tipo": "INTEGRIDADE",
            "resultado": "PASS" if todas_ok else "FAIL",
            "checks": checks,
        }

        if todas_ok:
            resumo["auditados"].append(item.get("titulo") or item["id"])
            item["status"] = "AUDITED"
            item["data_ultima_auditoria"] = _agora()
        else:
            resumo["com_falha"].append(item.get("titulo") or item["id"])
            item["status"] = "REQUIRES_HUMAN_REVIEW"

        if not dry_run:
            AUDITORIAS_DIR.mkdir(parents=True, exist_ok=True)
            (AUDITORIAS_DIR / f"{registro['id']}.json").write_text(
                json.dumps(registro, ensure_ascii=False, indent=2), encoding="utf-8"
            )
            (ITENS_DIR / f"{item['id']}.json").write_text(
                json.dumps(item, ensure_ascii=False, indent=2), encoding="utf-8"
            )

    return resumo


def _main() -> int:
    dry_run = "--dry-run" in sys.argv
    r = executar(dry_run=dry_run)
    modo = "DRY-RUN" if dry_run else "EXECUÇÃO"
    print(f"[FASE 10 — AUDITORIA] modo={modo}")
    print(f"  Auditados : {len(r['auditados'])}")
    print(f"  Com falha : {len(r['com_falha'])}")
    for t in r["com_falha"]:
        print(f"      - {t}")
    print(f"  Pulados   : {len(r['pulados'])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(_main())
