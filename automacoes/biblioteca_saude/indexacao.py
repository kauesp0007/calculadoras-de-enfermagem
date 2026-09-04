"""FASE 7 — Indexação (spec §18, §36, §60).

Gera índices invertidos persistentes e entidades agregadas a partir dos
documentos CATALOGED, e atualiza o manifesto da biblioteca.

100% determinístico — NÃO usa IA. Permite consulta rápida sem varrer todos os
documentos a cada busca.
"""

import json
import sys
from collections import defaultdict
from pathlib import Path

from .config import DOCUMENTOS_DIR, JSON_DIR
from .ingestao import carregar_indice

INDICES_DIR = JSON_DIR / "indices"
INSTITUICOES_DIR = JSON_DIR / "instituicoes"
ASSUNTOS_DIR = JSON_DIR / "assuntos"
ESPECIALIDADES_DIR = JSON_DIR / "especialidades"
PROFISSOES_DIR = JSON_DIR / "profissoes"
MANIFEST = JSON_DIR / "manifest.json"


def _carregar_catalogados() -> list[dict]:
    indice = carregar_indice()
    docs = []
    for info in indice["documentos"].values():
        p = DOCUMENTOS_DIR / f"{info['id']}.json"
        if not p.exists():
            continue
        reg = json.loads(p.read_text(encoding="utf-8"))
        if reg.get("status") == "CATALOGED":
            docs.append(reg)
    return docs


def _gravar_json(caminho: Path, dados) -> None:
    caminho.parent.mkdir(parents=True, exist_ok=True)
    caminho.write_text(json.dumps(dados, ensure_ascii=False, indent=2), encoding="utf-8")


def _indice_de(campo, docs) -> dict:
    """Índice invertido: valor -> [ids]."""
    idx = defaultdict(list)
    for d in docs:
        valor = d.get(campo)
        if valor is None:
            chave = "não identificado na fonte"
            idx[chave].append(d["id"])
        elif isinstance(valor, list):
            for v in valor:
                idx[v].append(d["id"])
        else:
            idx[str(valor)].append(d["id"])
    return dict(idx)


def _entidades(indice: dict) -> list[dict]:
    return [{"nome": k, "documentos": len(v), "ids": v} for k, v in sorted(indice.items())]


def executar(dry_run: bool = False) -> dict:
    docs = _carregar_catalogados()

    indices = {
        "por_ano": _indice_de("ano_publicacao", docs),
        "por_tipo": _indice_de("tipo_documental", docs),
        "por_especialidade": _indice_de("especialidade", docs),
        "por_assunto": _indice_de("assuntos", docs),
        "por_instituicao": _indice_de("instituicao", docs),
        "por_profissao": _indice_de("profissoes_relacionadas", docs),
    }

    entidades = {
        "instituicoes": _entidades(indices["por_instituicao"]),
        "assuntos": _entidades(indices["por_assunto"]),
        "especialidades": _entidades(indices["por_especialidade"]),
        "profissoes": _entidades(indices["por_profissao"]),
    }

    estatisticas = {
        "documentos": len(docs),
        "instituicoes": len(entidades["instituicoes"]),
        "assuntos": len(entidades["assuntos"]),
        "especialidades": len(entidades["especialidades"]),
        "profissoes": len(entidades["profissoes"]),
    }

    if not dry_run:
        _gravar_json(INDICES_DIR / "por_ano.json", indices["por_ano"])
        _gravar_json(INDICES_DIR / "por_tipo.json", indices["por_tipo"])
        _gravar_json(INDICES_DIR / "por_especialidade.json", indices["por_especialidade"])
        _gravar_json(INDICES_DIR / "por_assunto.json", indices["por_assunto"])
        _gravar_json(INDICES_DIR / "por_instituicao.json", indices["por_instituicao"])
        _gravar_json(INDICES_DIR / "por_profissao.json", indices["por_profissao"])
        _gravar_json(INSTITUICOES_DIR / "instituicoes.json", entidades["instituicoes"])
        _gravar_json(ASSUNTOS_DIR / "assuntos.json", entidades["assuntos"])
        _gravar_json(ESPECIALIDADES_DIR / "especialidades.json", entidades["especialidades"])
        _gravar_json(PROFISSOES_DIR / "profissoes.json", entidades["profissoes"])

        # Atualiza manifesto (§60)
        if MANIFEST.exists():
            manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
            manifest["estatisticas"].update(estatisticas)
            _gravar_json(MANIFEST, manifest)

    return {"indices": indices, "entidades": entidades, "estatisticas": estatisticas}


def _main() -> int:
    dry_run = "--dry-run" in sys.argv
    r = executar(dry_run=dry_run)
    modo = "DRY-RUN" if dry_run else "EXECUÇÃO"
    print(f"[FASE 7 — INDEXAÇÃO] modo={modo}")
    print(f"  Documentos indexados : {r['estatisticas']['documentos']}")
    print(f"  Instituições         : {r['estatisticas']['instituicoes']}")
    print(f"  Assuntos             : {r['estatisticas']['assuntos']}")
    print(f"  Especialidades       : {r['estatisticas']['especialidades']}")
    print(f"  Profissões           : {r['estatisticas']['profissoes']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(_main())
