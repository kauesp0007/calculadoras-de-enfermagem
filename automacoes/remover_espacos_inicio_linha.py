#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from pathlib import Path

# Diretório raiz (onde o script está)
ROOT = Path(__file__).resolve().parent

# Pastas que NÃO devem ser percorridas
EXCLUDED_DIRS = {
    "downloads",
    "biblioteca",
    "blog",
    "blog-templates",
    "node_modules",
    ".git",
}

# Arquivos HTML que NÃO devem ser alterados
EXCLUDED_FILES = {
    "footer.html",
    "menu-global.html",
    "global-body-elements.html",
    "downloads.html",
    "menu-lateral.html",
    "_language_selector.html",
    "googlefc0a17cdd552164b.html",
}


def should_skip(path: Path) -> bool:
    """Verifica se o arquivo está dentro de uma pasta ignorada."""
    return any(part in EXCLUDED_DIRS for part in path.parts)


def process_file(file_path: Path):
    """Remove apenas espaços e TABs do início de cada linha."""

    with open(file_path, "r", encoding="utf-8", newline="") as f:
        lines = f.readlines()

    changed = False
    new_lines = []

    for line in lines:
        new_line = line.lstrip(" \t")

        if new_line != line:
            changed = True

        new_lines.append(new_line)

    if changed:
        with open(file_path, "w", encoding="utf-8", newline="") as f:
            f.writelines(new_lines)

    return changed


def main():

    total = 0
    modified = 0

    for html in ROOT.rglob("*.html"):

        if should_skip(html):
            continue

        if html.name in EXCLUDED_FILES:
            continue

        total += 1

        try:
            if process_file(html):
                modified += 1
                print(f"[ALTERADO] {html.relative_to(ROOT)}")
            else:
                print(f"[OK]       {html.relative_to(ROOT)}")

        except Exception as e:
            print(f"[ERRO] {html.relative_to(ROOT)} -> {e}")

    print("\n==============================")
    print(f"Arquivos analisados : {total}")
    print(f"Arquivos alterados  : {modified}")
    print(f"Arquivos sem alteração: {total - modified}")
    print("==============================")


if __name__ == "__main__":
    main()