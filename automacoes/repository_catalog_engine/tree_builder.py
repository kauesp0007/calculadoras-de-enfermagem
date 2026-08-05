"""Construtor da árvore de pastas.

Gera uma representação hierárquica das pastas do repositório
no formato de árvore ASCII, com contagem de arquivos por pasta.
"""

import os
from pathlib import Path
from typing import List, Dict
from collections import defaultdict

from .config import BASE_DIR, IGNORE_DIRS


def build_tree(files: List[Dict]) -> str:
    """Constrói uma árvore ASCII das pastas do repositório.

    Args:
        files: Lista de metadados retornada pelo scanner.

    Returns:
        String formatada com a árvore de diretórios.
    """
    # Conta arquivos por diretório
    dir_file_count = defaultdict(int)
    all_dirs = set()

    for f in files:
        rel = f["relative_path"]
        parent = str(rel.parent) if str(rel.parent) != "." else "(raiz)"
        dir_file_count[parent] += 1

        # Adiciona todos os diretórios ancestrais
        parts = rel.parent.parts
        for i in range(len(parts) + 1):
            if i == 0:
                all_dirs.add("(raiz)")
            else:
                all_dirs.add(str(Path(*parts[:i])))

    # Constrói estrutura aninhada
    tree_structure = {}
    for d in sorted(all_dirs):
        if d == "(raiz)":
            continue
        parts = Path(d).parts
        current = tree_structure
        for i, part in enumerate(parts):
            if part not in current:
                current[part] = {}
            current = current[part]

    # Gera a árvore formatada
    lines = []
    lines.append("(raiz)/")
    _render_tree(tree_structure, "", lines, dir_file_count)

    return "\n".join(lines)


def _render_tree(
    node: dict,
    prefix: str,
    lines: List[str],
    dir_file_count: defaultdict,
    path_parts: tuple = (),
):
    """Renderiza recursivamente a árvore de diretórios."""
    items = sorted(node.keys())
    for i, name in enumerate(items):
        is_last = (i == len(items) - 1)
        connector = "└── " if is_last else "├── "
        current_path = str(Path(*path_parts) / name) if path_parts else name
        count = dir_file_count.get(current_path, 0)

        lines.append(f"{prefix}{connector}{name}/ ({count} arquivos)")

        extension = "    " if is_last else "│   "
        _render_tree(
            node[name],
            prefix + extension,
            lines,
            dir_file_count,
            path_parts + (name,),
        )
