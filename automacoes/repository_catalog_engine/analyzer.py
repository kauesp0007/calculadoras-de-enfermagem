"""Analisador de estatísticas do repositório.

Recebe a lista de arquivos do scanner e computa todas as estatísticas:
contagens, agrupamentos, totais por tipo, por extensão, por idioma, etc.
"""

from collections import defaultdict
from typing import List, Dict


def analyze(files: List[Dict], total_dirs: int) -> Dict:
    """Computa estatísticas completas a partir da lista de arquivos.

    Args:
        files: Lista de metadados retornada pelo scanner.
        total_dirs: Número total de diretórios.

    Returns:
        Dicionário com todas as estatísticas computadas.
    """
    stats = {}

    # ── Totais básicos ──────────────────────────────────────────────
    stats["total_files"] = len(files)
    stats["total_dirs"] = total_dirs

    # ── Por extensão ────────────────────────────────────────────────
    ext_count = defaultdict(int)
    ext_size = defaultdict(int)
    for f in files:
        ext = f["extension"]
        ext_count[ext] += 1
        ext_size[ext] += f["size_bytes"]

    # Ordena por quantidade decrescente
    stats["by_extension"] = sorted(
        [{"ext": k, "count": v, "size_bytes": ext_size[k]}
         for k, v in ext_count.items()],
        key=lambda x: x["count"], reverse=True
    )
    stats["total_extensions"] = len(ext_count)

    # ── Por tipo ────────────────────────────────────────────────────
    type_count = defaultdict(int)
    type_size = defaultdict(int)
    for f in files:
        t = f["type"]
        type_count[t] += 1
        type_size[t] += f["size_bytes"]

    stats["by_type"] = sorted(
        [{"type": k, "count": v, "size_bytes": type_size[k]}
         for k, v in type_count.items()],
        key=lambda x: x["count"], reverse=True
    )

    # ── Quantidades específicas ─────────────────────────────────────
    stats["html_count"] = type_count.get("html", 0)
    stats["css_count"] = type_count.get("css", 0)
    stats["js_count"] = type_count.get("js", 0)
    stats["json_count"] = type_count.get("json", 0)
    stats["image_count"] = type_count.get("imagem", 0)
    stats["video_count"] = type_count.get("video", 0)
    stats["document_count"] = type_count.get("documento", 0)
    stats["font_count"] = type_count.get("fonte", 0)
    stats["system_count"] = type_count.get("sistema", 0)

    # ── Por idioma (apenas HTML) ────────────────────────────────────
    html_files = [f for f in files if f["type"] == "html"]
    lang_count = defaultdict(int)
    for f in html_files:
        lang = f["language"] or "desconhecido"
        lang_count[lang] += 1

    stats["html_by_language"] = sorted(
        [{"language": k, "count": v} for k, v in lang_count.items()],
        key=lambda x: x["count"], reverse=True
    )
    stats["total_languages"] = len(lang_count)

    # ── HTML por localização ────────────────────────────────────────
    stats["html_root"] = sum(
        1 for f in html_files
        if f["language"] == "pt" and len(f["relative_path"].parts) == 1
    )

    # HTML em pastas de idioma
    stats["html_in_lang_folders"] = sum(
        1 for f in html_files
        if f["language"] != "pt" and f["language"] is not None
    )

    # HTML no blog
    stats["html_blog"] = sum(
        1 for f in html_files
        if f["special_dir"] == "blog"
    )

    # HTML em conta
    stats["html_conta"] = sum(
        1 for f in html_files
        if f["special_dir"] == "conta"
    )

    # ── Páginas multilíngues ────────────────────────────────────────
    # Agrupa arquivos HTML com mesmo nome em diferentes idiomas
    multilang_map = defaultdict(set)
    for f in html_files:
        name = f["name"]
        if f["language"]:
            multilang_map[name].add(f["language"])

    stats["multilingual_pages"] = sorted([
        {"page": name, "languages": sorted(langs)}
        for name, langs in multilang_map.items()
        if len(langs) >= 2
    ], key=lambda x: len(x["languages"]), reverse=True)

    # ── Por pasta especial ──────────────────────────────────────────
    special_counts = defaultdict(int)
    for f in files:
        sd = f["special_dir"]
        if sd:
            special_counts[sd] += 1

    stats["by_special_dir"] = sorted(
        [{"dir": k, "count": v} for k, v in special_counts.items()],
        key=lambda x: x["count"], reverse=True
    )

    # ── Tamanho total ───────────────────────────────────────────────
    stats["total_size_bytes"] = sum(f["size_bytes"] for f in files)

    return stats
