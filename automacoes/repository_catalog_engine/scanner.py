"""Scanner do repositório.

Responsável exclusivamente por caminhar o repositório e coletar
metadados de cada arquivo. NUNCA modifica, move ou apaga arquivos.

Retorna uma lista de dicionários com informações de cada arquivo.
"""

import os
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional

from .config import (
    BASE_DIR, IGNORE_DIRS, IGNORE_FILES, IGNORE_EXTENSIONS,
    IMAGE_EXTENSIONS, VIDEO_EXTENSIONS, DOCUMENT_EXTENSIONS,
    FONT_EXTENSIONS, SYSTEM_EXTENSIONS,
    LANGUAGE_FOLDERS, SPECIAL_DIRS,
)

# ── Mapeamentos de extensão → tipo ────────────────────────────────────
HTML_EXTENSIONS = {".html", ".htm"}
CSS_EXTENSIONS = {".css"}
JS_EXTENSIONS = {".js", ".mjs", ".cjs"}
JSON_EXTENSIONS = {".json", ".geojson"}


def _classify_extension(ext: str) -> str:
    """Classifica uma extensão em uma categoria de tipo de arquivo."""
    ext = ext.lower()
    if ext in HTML_EXTENSIONS:
        return "html"
    if ext in CSS_EXTENSIONS:
        return "css"
    if ext in JS_EXTENSIONS:
        return "js"
    if ext in JSON_EXTENSIONS:
        return "json"
    if ext in IMAGE_EXTENSIONS:
        return "imagem"
    if ext in VIDEO_EXTENSIONS:
        return "video"
    if ext in DOCUMENT_EXTENSIONS:
        return "documento"
    if ext in FONT_EXTENSIONS:
        return "fonte"
    if ext in SYSTEM_EXTENSIONS:
        return "sistema"
    return "outros"


def _detect_language(file_path: Path, relative_path: Path) -> Optional[str]:
    """Detecta o idioma de um arquivo HTML baseado no caminho.

    Lógica:
    - Se está em /en/ → inglês
    - Se está em /es/ → espanhol
    - Se está na raiz → português (padrão)
    - Se está em /blog/ ou /downloads/ → português
    - Se está em /biblioteca/ → verificar subpasta de idioma
    """
    if file_path.suffix.lower() not in HTML_EXTENSIONS:
        return None

    parts = relative_path.parts
    if len(parts) >= 2 and parts[0] in LANGUAGE_FOLDERS:
        return parts[0]

    # Raiz ou pastas especiais → português
    return "pt"


def _detect_special_dir(relative_path: Path) -> Optional[str]:
    """Detecta se o arquivo está em uma pasta especial."""
    if len(relative_path.parts) >= 1:
        first_dir = relative_path.parts[0]
        for key, value in SPECIAL_DIRS.items():
            if first_dir.lower() == key.lower():
                return value
    return None


def _should_ignore(entry: os.DirEntry, root_path: Path) -> bool:
    """Decide se um arquivo ou pasta deve ser ignorado."""
    name = entry.name

    # Ignorar pastas
    if entry.is_dir():
        return name in IGNORE_DIRS or name.startswith(".")

    # Ignorar arquivos específicos
    if name in IGNORE_FILES:
        return True

    # Ignorar por extensão
    ext = Path(name).suffix.lower()
    if ext in IGNORE_EXTENSIONS:
        return True

    # Ignorar arquivos ocultos
    if name.startswith("."):
        return True

    return False


def scan_repository() -> List[Dict]:
    """Varre o repositório completo e retorna metadados de cada arquivo.

    Returns:
        Lista de dicionários, cada um representando um arquivo:
        {
            "name": str,           # nome do arquivo
            "path": Path,          # caminho absoluto
            "relative_path": Path, # caminho relativo à raiz
            "extension": str,      # extensão (ex: ".html")
            "type": str,           # categoria (html, css, js, imagem, etc.)
            "size_bytes": int,     # tamanho em bytes
            "language": str|None,  # idioma (apenas para HTML)
            "special_dir": str|None, # pasta especial (blog, conta, etc.)
            "modified": str,       # data de modificação ISO
        }
    """
    files = []
    total_dirs = 0

    for root, dirs, filenames in os.walk(BASE_DIR):
        # Converte para Path
        root_path = Path(root)

        # Filtra diretórios a ignorar
        dirs[:] = [
            d for d in dirs
            if d not in IGNORE_DIRS and not d.startswith(".")
        ]

        # Processa com DirEntry para melhor performance
        with os.scandir(root) as entries:
            for entry in entries:
                if _should_ignore(entry, root_path):
                    continue

                if entry.is_dir():
                    total_dirs += 1
                    continue

                if not entry.is_file():
                    continue

                file_path = Path(entry.path)
                relative = file_path.relative_to(BASE_DIR)
                ext = file_path.suffix.lower()

                try:
                    stat = entry.stat()
                    size = stat.st_size
                    mtime = datetime.fromtimestamp(stat.st_mtime).isoformat()
                except OSError:
                    size = 0
                    mtime = ""

                file_info = {
                    "name": entry.name,
                    "path": file_path,
                    "relative_path": relative,
                    "extension": ext if ext else "(sem extensão)",
                    "type": _classify_extension(ext),
                    "size_bytes": size,
                    "language": _detect_language(file_path, relative),
                    "special_dir": _detect_special_dir(relative),
                    "modified": mtime,
                }

                files.append(file_info)

    return files, total_dirs
