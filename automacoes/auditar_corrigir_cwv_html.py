#!/usr/bin/env python3
"""Audita CWV e corrige dimensoes ausentes de imagens locais com baixo risco."""

from __future__ import annotations

import argparse
import importlib.util
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import unquote, urlsplit

from PIL import Image


ROOT = Path(__file__).resolve().parent.parent
SCANNER_PATH = Path(__file__).with_name("reservar_espaco_multiplex.py")
spec = importlib.util.spec_from_file_location("scanner_multiplex", SCANNER_PATH)
scanner = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(scanner)

IMG = re.compile(r"<img\b[^>]*>", re.IGNORECASE)
SRC = re.compile(r"\bsrc\s*=\s*([\"'])(.*?)\1", re.IGNORECASE | re.DOTALL)
WIDTH = re.compile(r"\bwidth\s*=", re.IGNORECASE)
HEIGHT = re.compile(r"\bheight\s*=", re.IGNORECASE)
IFRAME = re.compile(r"<iframe\b[^>]*>", re.IGNORECASE | re.DOTALL)
SCRIPT_SRC = re.compile(r"<script\b[^>]*\bsrc\s*=\s*[^>]*>", re.IGNORECASE)
CSS_ASYNC = re.compile(
    r'<link\b(?=[^>]*(?:/public/output\.css|/global-styles\.css))'
    r'(?=[^>]*(?:\bonload\s*=|\brel=["\']preload["\']))[^>]*>',
    re.IGNORECASE,
)


def cli() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Audita HTMLs e adiciona width/height a imagens locais.")
    parser.add_argument("--aplicar", action="store_true", help="Grava correcoes; sem isto apenas audita.")
    parser.add_argument("--relatorio", type=Path, default=ROOT / "relatorios" / "auditoria-cwv-html.json")
    return parser.parse_args()


def local_image(html_path: Path, src: str) -> Path | None:
    if not src or any(token in src for token in ("${", "{{", "<%")):
        return None
    parsed = urlsplit(src)
    if parsed.scheme or parsed.netloc or src.startswith(("data:", "blob:", "//")):
        return None
    clean = unquote(parsed.path).replace("\\", "/")
    candidates = []
    if clean.startswith("/"):
        candidates.append(ROOT / clean.lstrip("/"))
    else:
        candidates.extend((html_path.parent / clean, ROOT / clean, ROOT / clean.lstrip("./")))
    for candidate in candidates:
        try:
            resolved = candidate.resolve()
            resolved.relative_to(ROOT.resolve())
        except (OSError, ValueError):
            continue
        if resolved.is_file():
            return resolved
    return None


def dimensions(path: Path) -> tuple[int, int] | None:
    try:
        with Image.open(path) as image:
            width, height = image.size
        if width > 0 and height > 0:
            return width, height
    except (OSError, ValueError):
        return None
    return None


def add_dimensions(tag: str, width: int, height: int) -> str:
    if WIDTH.search(tag) or HEIGHT.search(tag):
        return tag
    closing = "/>" if tag.rstrip().endswith("/>") else ">"
    position = tag.rfind(closing)
    return tag[:position].rstrip() + f' width="{width}" height="{height}"' + tag[position:]


def audit_file(path: Path, apply: bool) -> dict[str, object]:
    original = path.read_text(encoding="utf-8")
    fixed_count = 0
    unresolved: list[str] = []

    def fix_image(match: re.Match[str]) -> str:
        nonlocal fixed_count
        tag = match.group(0)
        if WIDTH.search(tag) and HEIGHT.search(tag):
            return tag
        source = SRC.search(tag)
        if not source:
            unresolved.append("imagem sem src estatico")
            return tag
        image_path = local_image(path, source.group(2).strip())
        size = dimensions(image_path) if image_path else None
        if not size:
            unresolved.append(source.group(2).strip())
            return tag
        changed = add_dimensions(tag, *size)
        fixed_count += changed != tag
        return changed

    changed = IMG.sub(fix_image, original)
    if apply and changed != original:
        path.write_text(changed, encoding="utf-8", newline="")

    blocking_scripts = []
    for tag in SCRIPT_SRC.findall(original):
        # type=module ja e deferido por definicao.
        if not re.search(r"\b(?:async|defer)\b", tag, re.IGNORECASE) and not re.search(
            r'\btype\s*=\s*["\']module["\']', tag, re.IGNORECASE
        ):
            src = SRC.search(tag)
            blocking_scripts.append(src.group(2) if src else tag[:120])

    iframe_without_reservation = []
    for tag in IFRAME.findall(original):
        has_attributes = WIDTH.search(tag) and HEIGHT.search(tag)
        has_css_height = bool(re.search(r'(?:\bh-|min-h-|aspect-)', tag, re.IGNORECASE))
        if not has_css_height:
            # Considera altura declarada por seletor iframe ou por uma das
            # classes do elemento no CSS inline da propria pagina.
            classes = re.search(r'\bclass\s*=\s*["\']([^"\']+)', tag, re.IGNORECASE)
            selectors = [r'iframe(?:\b|[^\{]*)']
            if classes:
                selectors.extend(r'\.' + re.escape(name) + r'\b' for name in classes.group(1).split())
            has_css_height = any(
                re.search(selector + r'[^\{]*\{[^\}]*\bheight\s*:', original, re.IGNORECASE)
                for selector in selectors
            )
        if not has_attributes and not has_css_height:
            src = SRC.search(tag)
            iframe_without_reservation.append(src.group(2) if src else "iframe dinamico")

    return {
        "arquivo": str(path.relative_to(ROOT)),
        "imagens_corrigiveis": fixed_count,
        "imagens_nao_resolvidas": unresolved,
        "css_estrutural_assincrono": len(CSS_ASYNC.findall(original)),
        "iframes_sem_reserva": iframe_without_reservation,
        "scripts_bloqueantes_revisao_manual": blocking_scripts,
    }


def main() -> int:
    options = cli()
    results = [audit_file(path, options.aplicar) for path in scanner.eligible_files()]
    summary = {
        "arquivos": len(results),
        "imagens_com_dimensoes_adicionadas": sum(int(row["imagens_corrigiveis"]) for row in results),
        "imagens_nao_resolvidas": sum(len(row["imagens_nao_resolvidas"]) for row in results),
        "css_estrutural_assincrono": sum(int(row["css_estrutural_assincrono"]) for row in results),
        "iframes_sem_reserva": sum(len(row["iframes_sem_reserva"]) for row in results),
        "scripts_para_revisao_manual": sum(len(row["scripts_bloqueantes_revisao_manual"]) for row in results),
    }
    payload = {
        "gerado_em": datetime.now(timezone.utc).isoformat(),
        "modo": "aplicado" if options.aplicar else "auditoria",
        "resumo": summary,
        "resultados": results,
    }
    options.relatorio.parent.mkdir(parents=True, exist_ok=True)
    options.relatorio.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(payload | {"resultados": f"{len(results)} registros no relatorio"}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
