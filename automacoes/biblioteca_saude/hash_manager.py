"""FASE 4 — Hash e deduplicação (spec §5, §25, §82).

Calcula o SHA-256 de cada documento, detecta duplicatas e marca alterações
para reprocessamento incremental. 100% determinístico — NÃO usa IA (§4).

Resultado por documento:
- NOVO        : hash preenchido pela primeira vez → avança para extração.
- INALTERADO  : hash igual ao registrado → NÃO reprocessa (§5).
- ALTERADO    : hash mudou → incrementa versão e volta para re-extração (§37).
- DUPLICADO   : mesmo hash de outro documento → não cria duplicata (§25).
"""

import hashlib
import json
import sys
from pathlib import Path

from .config import ENTRADA_DIR, DOCUMENTOS_DIR
from .ingestao import carregar_indice, salvar_indice


def calcular_sha256(caminho: Path) -> str:
    h = hashlib.sha256()
    with open(caminho, "rb") as f:
        for bloco in iter(lambda: f.read(65536), b""):
            h.update(bloco)
    return h.hexdigest()


def _ler_registro(info: dict) -> dict:
    caminho = DOCUMENTOS_DIR / f"{info['id']}.json"
    return json.loads(caminho.read_text(encoding="utf-8"))


def _gravar_registro(reg: dict) -> None:
    caminho = DOCUMENTOS_DIR / f"{reg['id']}.json"
    caminho.write_text(json.dumps(reg, ensure_ascii=False, indent=2), encoding="utf-8")


def executar(dry_run: bool = False) -> dict:
    indice = carregar_indice()
    resumo = {"novos": [], "inalterados": [], "alterados": [], "duplicados": [], "ausentes": []}

    # Mapa hash -> id já conhecido (para detectar duplicatas).
    hash_para_id: dict[str, str] = {}
    for info in indice["documentos"].values():
        caminho_reg = DOCUMENTOS_DIR / f"{info['id']}.json"
        if caminho_reg.exists():
            reg = json.loads(caminho_reg.read_text(encoding="utf-8"))
            if reg.get("hash_sha256"):
                hash_para_id[reg["hash_sha256"]] = info["id"]

    for nome, info in list(indice["documentos"].items()):
        caminho = ENTRADA_DIR / nome
        if not caminho.exists():
            resumo["ausentes"].append(nome)
            continue  # arquivo removido da caixa de entrada — não apagar (§40)

        h = calcular_sha256(caminho)
        reg = _ler_registro(info)
        anterior = reg.get("hash_sha256")

        # 1) Duplicata de outro documento
        if h in hash_para_id and hash_para_id[h] != info["id"]:
            reg["hash_sha256"] = h
            reg["duplicado_de"] = hash_para_id[h]
            reg["status"] = "REQUIRES_HUMAN_REVIEW"
            resumo["duplicados"].append(nome)
            if not dry_run:
                _gravar_registro(reg)

        # 2) Inalterado — não reprocessa
        elif anterior == h:
            resumo["inalterados"].append(nome)

        # 3) Novo (primeira vez)
        elif anterior is None:
            reg["hash_sha256"] = h
            resumo["novos"].append(nome)
            if not dry_run:
                _gravar_registro(reg)
                indice["documentos"][nome]["hash_sha256"] = h
                hash_para_id[h] = info["id"]

        # 4) Alterado — nova versão
        else:
            reg["hash_sha256"] = h
            reg["versao_processamento"] = reg.get("versao_processamento", 1) + 1
            reg["status"] = "INGESTED"
            resumo["alterados"].append(nome)
            if not dry_run:
                _gravar_registro(reg)
                indice["documentos"][nome]["hash_sha256"] = h
                hash_para_id[h] = info["id"]

    if not dry_run and (resumo["novos"] or resumo["alterados"] or resumo["duplicados"]):
        salvar_indice(indice)

    return resumo


def _main() -> int:
    dry_run = "--dry-run" in sys.argv
    resumo = executar(dry_run=dry_run)
    modo = "DRY-RUN" if dry_run else "EXECUÇÃO"
    print(f"[FASE 4 — HASH/DEDUP] modo={modo}")
    for k, v in resumo.items():
        print(f"  {k.capitalize():12}: {len(v)}")
        if k in ("novos", "alterados", "duplicados"):
            for nome in v:
                print(f"      - {nome}")
    return 0


if __name__ == "__main__":
    raise SystemExit(_main())
