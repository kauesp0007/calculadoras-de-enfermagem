#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from pathlib import Path

# ==========================
# RAIZ DO PROJETO
# ==========================
# O script está em /automacoes
# A raiz do projeto é a pasta pai.
ROOT = Path(__file__).resolve().parent.parent

# ==========================
# PASTAS IGNORADAS
# ==========================
EXCLUDED_DIRS = {
    "downloads",
    "biblioteca",
    "blog",
    "blog-templates",
    "node_modules",
    ".git",
}

# ==========================
# ARQUIVOS IGNORADOS
# ==========================
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
    """Retorna True se o arquivo estiver dentro de uma pasta ignorada."""
    return any(part in EXCLUDED_DIRS for part in path.parts)


def process_file(file_path: Path) -> bool:
    """
    Remove SOMENTE espaços e TABs do início de cada linha.
    Não altera mais nada.
    """

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

    print(f"Raiz do projeto: {ROOT}")
    print()

    total = 0
    modified = 0
    unchanged = 0
    errors = 0

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
                unchanged += 1
                print(f"[OK]       {html.relative_to(ROOT)}")

        except Exception as e:
            errors += 1
            print(f"[ERRO] {html.relative_to(ROOT)}")
            print(f"       {e}")

    print()
    print("=" * 40)
    print(f"Arquivos analisados : {total}")
    print(f"Arquivos alterados  : {modified}")
    print(f"Sem alteração       : {unchanged}")
    print(f"Erros               : {errors}")
    print("=" * 40)


if __name__ == "__main__":
    main()