"""FASE 3 — Sistema de ingestão (spec §5, §6, §54).

Detecta novos materiais em LIVROS_PARA_O_AGENTE_LER/, identifica o formato
(extensão) e registra o documento fonte no catálogo.

Regras aplicadas:
- 100% determinístico — NÃO usa IA (§4).
- NUNCA modifica o arquivo original (§54).
- Modo dry-run disponível (--dry-run) — §42.
- O hash SHA-256 e a deduplicação entram na FASE 4 (nesta fase `hash_sha256` = null).
"""

import json
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

from .config import (
    ENTRADA_DIR,
    DOCUMENTOS_DIR,
    INDEX_DOCUMENTOS,
    EXTENSOES_ACEITAS,
    EXTENSAO_PARA_TIPO,
)


def _agora() -> str:
    return datetime.now(timezone.utc).isoformat()


def carregar_indice() -> dict:
    if INDEX_DOCUMENTOS.exists():
        return json.loads(INDEX_DOCUMENTOS.read_text(encoding="utf-8"))
    return {"documentos": {}, "atualizado_em": None}


def salvar_indice(indice: dict) -> None:
    INDEX_DOCUMENTOS.parent.mkdir(parents=True, exist_ok=True)
    indice["atualizado_em"] = _agora()
    INDEX_DOCUMENTOS.write_text(
        json.dumps(indice, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def _novo_id() -> str:
    return "doc-" + uuid.uuid4().hex[:12]


def listar_arquivos() -> list[Path]:
    """Lista os arquivos aceitos na caixa de entrada, ordenados por nome."""
    if not ENTRADA_DIR.exists():
        return []
    arquivos = []
    for p in ENTRADA_DIR.iterdir():
        if p.is_file() and p.suffix.lower() in EXTENSOES_ACEITAS:
            arquivos.append(p)
    return sorted(arquivos, key=lambda p: p.name.lower())


def registrar_documento(caminho: Path, dry_run: bool) -> dict:
    """Cria o registro do documento fonte e o grava no catálogo."""
    extensao = caminho.suffix.lower()
    registro = {
        "id": _novo_id(),
        "hash_sha256": None,  # preenchido na FASE 4
        "nome_original": caminho.name,
        "caminho_original": str(caminho.relative_to(ENTRADA_DIR.parent)).replace("\\", "/"),
        "tamanho_bytes": caminho.stat().st_size,
        "extensao": extensao,
        "mime_type": None,
        "tipo_documental": EXTENSAO_PARA_TIPO.get(extensao),
        "status": "INGESTED",
        "versao_processamento": 1,
        "data_entrada": _agora(),
        "data_processamento": None,
        "data_ultima_auditoria": None,
        "itens_conhecimento": [],
    }
    if not dry_run:
        DOCUMENTOS_DIR.mkdir(parents=True, exist_ok=True)
        (DOCUMENTOS_DIR / f"{registro['id']}.json").write_text(
            json.dumps(registro, ensure_ascii=False, indent=2), encoding="utf-8"
        )
    return registro


def executar(dry_run: bool = False) -> dict:
    """Executa a ingestão e devolve um resumo (spec §42: relata o que faria/fez)."""
    arquivos = listar_arquivos()
    indice = carregar_indice()

    novos = []
    ignorados = []
    for caminho in arquivos:
        chave = caminho.name
        if chave in indice["documentos"]:
            ignorados.append(chave)
        else:
            registro = registrar_documento(caminho, dry_run)
            novos.append(chave)
            if not dry_run:
                indice["documentos"][chave] = {
                    "id": registro["id"],
                    "extensao": registro["extensao"],
                    "tipo_documental": registro["tipo_documental"],
                    "hash_sha256": None,
                    "status": registro["status"],
                    "data_entrada": registro["data_entrada"],
                }

    if not dry_run and novos:
        salvar_indice(indice)

    return {
        "dry_run": dry_run,
        "total_arquivos": len(arquivos),
        "novos": novos,
        "ja_catalogados": ignorados,
    }


def _main() -> int:
    dry_run = "--dry-run" in sys.argv
    resumo = executar(dry_run=dry_run)
    modo = "DRY-RUN" if dry_run else "EXECUÇÃO"
    print(f"[FASE 3 — INGESTÃO] modo={modo}")
    print(f"  Arquivos detectados : {resumo['total_arquivos']}")
    print(f"  Novos               : {len(resumo['novos'])}")
    for n in resumo["novos"]:
        print(f"    + {n}")
    print(f"  Já catalogados      : {len(resumo['ja_catalogados'])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(_main())
