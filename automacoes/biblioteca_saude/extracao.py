"""FASE 5 — Extração de texto (spec §5, §51, §54).

Extrai o texto bruto de cada documento INGESTED e salva em `extratos/<id>.txt`.
O texto bruto é um artefato intermediário usado pelas fases 6-9 (catalogação,
indexação, análise). O arquivo original NUNCA é modificado (§54).

- PDF  : PyMuPDF (fitz) — reusa a mesma lib do automacoes/catalogador.
- TXT/MD/CSV : leitura direta.
- DOCX/EPUB : suporte a adicionar (docx via python-docx / mammoth — FASE posterior).
- PDF sem texto (escaneado) : marcado para OCR (reusar ocr_engine do catalogador).
"""

import json
import sys
from pathlib import Path

from .config import ENTRADA_DIR, DOCUMENTOS_DIR, EXTRATOS_DIR
from .ingestao import carregar_indice, salvar_indice

MIN_CHARS_PARA_TEXTO = 200  # abaixo disso, considera sem texto (OCR pendente)

try:
    import fitz  # PyMuPDF
    HAS_FITZ = True
except ImportError:
    HAS_FITZ = False

EXTENSOES_TEXTO_PURO = {".txt", ".md", ".csv"}


def _ler_registro(info: dict) -> dict:
    return json.loads((DOCUMENTOS_DIR / f"{info['id']}.json").read_text(encoding="utf-8"))


def _gravar_registro(reg: dict) -> None:
    (DOCUMENTOS_DIR / f"{reg['id']}.json").write_text(
        json.dumps(reg, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def extrair_texto_pdf(caminho: Path):
    """Retorna (texto, num_paginas). Levanta exceção se PyMuPDF indisponível."""
    if not HAS_FITZ:
        raise RuntimeError("PyMuPDF (fitz) indisponível no interpretador atual")
    doc = fitz.open(str(caminho))
    try:
        partes = [pagina.get_text() for pagina in doc]
        return "\n".join(partes), doc.page_count
    finally:
        doc.close()


def extrair_texto_txt(caminho: Path):
    return caminho.read_text(encoding="utf-8", errors="replace"), None


def extrair_texto(caminho: Path):
    """Retorna (texto, num_paginas) ou (None, None) quando não suportado."""
    ext = caminho.suffix.lower()
    if ext == ".pdf":
        return extrair_texto_pdf(caminho)
    if ext in EXTENSOES_TEXTO_PURO:
        return extrair_texto_txt(caminho)
    return None, None  # docx/epub/etc — a implementar


def executar(dry_run: bool = False) -> dict:
    indice = carregar_indice()
    resumo = {"extraidos": [], "sem_texto": [], "nao_suportados": [], "pulados": []}

    for nome, info in indice["documentos"].items():
        reg = _ler_registro(info)
        if reg.get("status") != "INGESTED":
            resumo["pulados"].append(nome)
            continue

        caminho = ENTRADA_DIR / nome
        texto, num_paginas = extrair_texto(caminho)

        if texto is None:
            resumo["nao_suportados"].append(nome)
            continue

        reg["num_paginas"] = num_paginas
        reg["tamanho_texto_chars"] = len(texto)

        if len(texto.strip()) < MIN_CHARS_PARA_TEXTO:
            reg["status"] = "REQUIRES_HUMAN_REVIEW"
            reg["motivo"] = "texto insuficiente — OCR pendente"
            resumo["sem_texto"].append(nome)
            if not dry_run:
                _gravar_registro(reg)
            continue

        reg["status"] = "EXTRACTED"
        reg["texto_extraido_em"] = f"extratos/{reg['id']}.txt"
        resumo["extraidos"].append(nome)

        if not dry_run:
            EXTRATOS_DIR.mkdir(parents=True, exist_ok=True)
            (EXTRATOS_DIR / f"{reg['id']}.txt").write_text(texto, encoding="utf-8")
            _gravar_registro(reg)
            indice["documentos"][nome]["status"] = "EXTRACTED"

    if not dry_run and (resumo["extraidos"] or resumo["sem_texto"]):
        salvar_indice(indice)

    return resumo


def _main() -> int:
    dry_run = "--dry-run" in sys.argv
    resumo = executar(dry_run=dry_run)
    modo = "DRY-RUN" if dry_run else "EXECUÇÃO"
    print(f"[FASE 5 — EXTRAÇÃO] modo={modo}")
    for k, v in resumo.items():
        print(f"  {k.capitalize():16}: {len(v)}")
        if k in ("extraidos", "sem_texto", "nao_suportados"):
            for nome in v:
                print(f"      - {nome}")
    return 0


if __name__ == "__main__":
    raise SystemExit(_main())
