#!/usr/bin/env python3
"""Corrige o carregamento tardio dos CSS estruturais que provoca CLS."""

from __future__ import annotations

import argparse
import importlib.util
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
SCANNER = Path(__file__).with_name("reservar_espaco_multiplex.py")
spec = importlib.util.spec_from_file_location("scanner_multiplex", SCANNER)
scanner = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(scanner)

ASYNC_LINK = re.compile(
    r'<link\s+(?=[^>]*\bhref=["\'](?P<href>/public/output\.css|/global-styles\.css)["\'])'
    r'(?=[^>]*\brel=["\']preload["\'])(?=[^>]*\bas=["\']style["\'])'
    r'(?=[^>]*\bonload=["\'][^"\']*rel\s*=\s*[\\\']stylesheet[\\\'][^"\']*["\'])[^>]*/?>',
    re.IGNORECASE,
)
NOSCRIPT_LINK = re.compile(
    r'<noscript>\s*<link\s+(?=[^>]*\bhref=["\'](?P<href>/public/output\.css|/global-styles\.css)["\'])'
    r'(?=[^>]*\brel=["\']stylesheet["\'])[^>]*/?>\s*</noscript>',
    re.IGNORECASE,
)
PRELOAD_LINK = re.compile(
    r'<link\s+(?=[^>]*\bhref=["\'](?P<href>/public/output\.css|/global-styles\.css)["\'])'
    r'(?=[^>]*\brel=["\']preload["\'])[^>]*/?>',
    re.IGNORECASE,
)


def arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Troca preload/onload de CSS por stylesheet normal.")
    parser.add_argument("--aplicar", action="store_true", help="Grava as alteracoes; sem isso apenas simula.")
    return parser.parse_args()


def fix(text: str) -> tuple[str, int, int]:
    hrefs: list[str] = []

    # Remove hints preload redundantes quando a mesma folha ja possui um
    # <link rel="stylesheet"> efetivo na pagina.
    changed = text
    redundant_count = 0
    for href in ("/public/output.css", "/global-styles.css"):
        has_stylesheet = re.search(
            rf'<link\s+(?=[^>]*\bhref=["\']{re.escape(href)}["\'])'
            rf'(?=[^>]*\brel=["\']stylesheet["\'])[^>]*>',
            changed,
            re.IGNORECASE,
        )
        if has_stylesheet:
            pattern = re.compile(
                rf'<link\s+(?=[^>]*\bhref=["\']{re.escape(href)}["\'])'
                rf'(?=[^>]*\brel=["\']preload["\'])[^>]*/?>\s*',
                re.IGNORECASE,
            )
            changed, removed = pattern.subn("", changed)
            redundant_count += removed

    def remember(match: re.Match[str]) -> str:
        href = match.group("href")
        if href not in hrefs:
            hrefs.append(href)
        return ""

    changed, async_count = ASYNC_LINK.subn(remember, changed)
    async_count += redundant_count
    changed, noscript_count = NOSCRIPT_LINK.subn("", changed)
    if not hrefs:
        return changed, async_count, noscript_count

    newline = "\r\n" if "\r\n" in text else "\n"
    normal = newline.join(f'<link href="{href}" rel="stylesheet">' for href in hrefs)
    # Insere no local da primeira linha removida, antes de compactar linhas vazias.
    first = ASYNC_LINK.search(text)
    assert first is not None
    prefix_after_removal = ASYNC_LINK.sub("", text[:first.start()])
    insertion = len(prefix_after_removal)
    changed = changed[:insertion] + normal + changed[insertion:]
    changed = re.sub(r"(?:\r?\n)[ \t]*(?:\r?\n)[ \t]*(?:\r?\n)+", newline * 2, changed)
    return changed, async_count, noscript_count


def main() -> int:
    options = arguments()
    stats = {"elegiveis": 0, "alterados": 0, "links_async_removidos": 0, "noscript_removidos": 0}
    for path in scanner.eligible_files():
        stats["elegiveis"] += 1
        original = path.read_text(encoding="utf-8")
        changed, async_count, noscript_count = fix(original)
        if changed != original:
            stats["alterados"] += 1
            stats["links_async_removidos"] += async_count
            stats["noscript_removidos"] += noscript_count
            if options.aplicar:
                path.write_text(changed, encoding="utf-8", newline="")
    stats["modo"] = "aplicado" if options.aplicar else "simulacao"
    print(json.dumps(stats, ensure_ascii=False, indent=2))
    if not options.aplicar and stats["alterados"]:
        print("Use --aplicar para gravar as alteracoes.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
