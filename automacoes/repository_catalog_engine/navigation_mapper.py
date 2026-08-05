"""Mapeador de navegação — Fase 4.

Analisa links internos/externos, estrutura de navegação, páginas órfãs,
fluxo entre páginas, estrutura do blog/biblioteca/downloads.
"""

from pathlib import Path
from typing import List, Dict, Set
from collections import defaultdict
from urllib.parse import urlparse

from .config import BASE_DIR, LANGUAGE_FOLDERS


def build_navigation_map(
    files: List[Dict],
    parsed_content: Dict[str, Dict],
) -> Dict:
    """Constrói o mapa completo de navegação do site.

    Returns:
        Dicionário com:
        - internal_links: {page: [targets]}
        - external_links: {page: [urls]}
        - backlinks: {page: [pages that link to it]}
        - orphan_pages: páginas sem links de entrada
        - duplicate_pages: páginas com mesmo nome em diferentes pastas
        - language_nav: links entre idiomas
        - blog_structure: estrutura do blog
        - breadcrumb_pages: páginas com/sem breadcrumb
    """
    # ── Mapa de todos os HTMLs ──────────────────────────────────────
    html_files = [f for f in files if f["type"] == "html"]
    html_paths = {str(f["relative_path"]) for f in html_files}

    # ── Links internos ──────────────────────────────────────────────
    internal_links = defaultdict(set)
    external_links = defaultdict(set)
    backlinks = defaultdict(set)

    for rel_str, parsed in parsed_content.items():
        if parsed.get("_type") != "html":
            continue

        source = rel_str
        for link in parsed.get("links_internal", []):
            normalized = _normalize_link(link)
            internal_links[source].add(normalized)
            backlinks[normalized].add(source)

        for link in parsed.get("links_external", []):
            external_links[source].add(link)

    # ── Páginas órfãs (sem backlinks) ───────────────────────────────
    orphan_pages = []
    for f in html_files:
        rel = str(f["relative_path"])
        if rel not in backlinks and rel != "index.html":
            orphan_pages.append(rel)

    # ── Páginas duplicadas ──────────────────────────────────────────
    name_groups = defaultdict(list)
    for f in html_files:
        name = f["name"].lower()
        name_groups[name].append(str(f["relative_path"]))

    duplicate_pages = {
        name: paths
        for name, paths in name_groups.items()
        if len(paths) > 1
    }

    # ── Navegação entre idiomas ─────────────────────────────────────
    language_nav = defaultdict(list)
    for rel_str, parsed in parsed_content.items():
        if parsed.get("_type") != "html":
            continue
        for hl in parsed.get("hreflangs", []):
            language_nav[rel_str].append(hl)

    # ── Breadcrumbs ─────────────────────────────────────────────────
    pages_with_breadcrumb = 0
    pages_without_breadcrumb = []

    for rel_str, parsed in parsed_content.items():
        if parsed.get("_type") != "html":
            continue
        # Detecta breadcrumb olhando por padrões comuns
        content = ""
        try:
            content = (BASE_DIR / rel_str).read_text(encoding="utf-8", errors="replace")
        except Exception:
            pass

        has_breadcrumb = (
            'aria-label="Breadcrumb"' in content or
            'aria-label="breadcrumb"' in content or
            'class="breadcrumb' in content.lower() or
            'nav class="flex text-sm mb-6' in content
        )
        if has_breadcrumb:
            pages_with_breadcrumb += 1
        else:
            pages_without_breadcrumb.append(rel_str)

    # ── Estrutura do blog ───────────────────────────────────────────
    blog_files = [f for f in html_files if str(f["relative_path"]).startswith("blog/")]
    blog_structure = {
        "total": len(blog_files),
        "pages": sorted([str(f["relative_path"]) for f in blog_files]),
    }

    # ── Estrutura da biblioteca ─────────────────────────────────────
    bib_files = [f for f in html_files if str(f["relative_path"]).startswith("biblioteca/")]
    bib_structure = {
        "total": len(bib_files),
        "pages": sorted([str(f["relative_path"]) for f in bib_files]),
    }

    # ── Estrutura dos downloads ─────────────────────────────────────
    dl_files = [f for f in html_files if str(f["relative_path"]).startswith("downloads/")]
    dl_structure = {
        "total": len(dl_files),
        "pages": sorted([str(f["relative_path"]) for f in dl_files]),
    }

    # ── Páginas inacessíveis (fora do fluxo principal) ───────────────
    # Páginas que não estão linkadas de lugar nenhum E não são index
    inaccessible = [
        p for p in orphan_pages
        if not p.endswith("index.html") and "index.html" not in p
    ]

    return {
        "internal_links": {k: sorted(v) for k, v in internal_links.items()},
        "external_links": {k: sorted(v) for k, v in external_links.items()},
        "backlinks": {k: sorted(v) for k, v in backlinks.items()},
        "orphan_pages": sorted(orphan_pages),
        "inaccessible_pages": sorted(inaccessible),
        "duplicate_pages": duplicate_pages,
        "language_nav": {k: v for k, v in language_nav.items()},
        "pages_with_breadcrumb": pages_with_breadcrumb,
        "pages_without_breadcrumb": pages_without_breadcrumb,
        "blog_structure": blog_structure,
        "biblioteca_structure": bib_structure,
        "downloads_structure": dl_structure,
        "total_html": len(html_files),
        "total_internal_links": sum(len(v) for v in internal_links.values()),
        "total_external_links": sum(len(v) for v in external_links.values()),
        "total_orphan_pages": len(orphan_pages),
        "total_duplicate_names": len(duplicate_pages),
    }


def _normalize_link(link: str) -> str:
    """Normaliza um link interno para comparação."""
    link = link.split("?")[0].split("#")[0]
    if link.startswith("/"):
        link = link[1:]
    return link.lower()


# ── Geradores ──────────────────────────────────────────────────────────

def generate_txt(nav_map: Dict) -> str:
    """Gera relatório de navegação em texto."""
    lines = []
    lines.append("=" * 72)
    lines.append("  MAPA DE NAVEGAÇÃO DO SITE")
    lines.append("=" * 72)
    lines.append("")

    lines.append(f"Total de páginas HTML:     {nav_map['total_html']:,}")
    lines.append(f"Total de links internos:   {nav_map['total_internal_links']:,}")
    lines.append(f"Total de links externos:   {nav_map['total_external_links']:,}")
    lines.append(f"Páginas órfãs:             {nav_map['total_orphan_pages']:,}")
    lines.append(f"Nomes duplicados:          {nav_map['total_duplicate_names']:,}")
    lines.append(f"Com breadcrumb:            {nav_map['pages_with_breadcrumb']:,}")
    lines.append(f"Sem breadcrumb:            {len(nav_map['pages_without_breadcrumb']):,}")
    lines.append(f"Blog:                      {nav_map['blog_structure']['total']:,} páginas")
    lines.append(f"Biblioteca:                {nav_map['biblioteca_structure']['total']:,} páginas")
    lines.append(f"Downloads:                 {nav_map['downloads_structure']['total']:,} páginas")
    lines.append("")

    # Órfãs
    if nav_map["orphan_pages"]:
        lines.append("─" * 72)
        lines.append("  PÁGINAS ÓRFÃS (sem links de entrada)")
        lines.append("─" * 72)
        for p in nav_map["orphan_pages"][:30]:
            lines.append(f"  {p}")
        lines.append("")

    # Inacessíveis
    if nav_map["inaccessible_pages"]:
        lines.append("─" * 72)
        lines.append("  PÁGINAS INACESSÍVEIS")
        lines.append("─" * 72)
        for p in nav_map["inaccessible_pages"][:20]:
            lines.append(f"  {p}")
        lines.append("")

    # Duplicadas
    if nav_map["duplicate_pages"]:
        lines.append("─" * 72)
        lines.append("  PÁGINAS COM NOME DUPLICADO")
        lines.append("─" * 72)
        for name, paths in sorted(nav_map["duplicate_pages"].items()):
            lines.append(f"  {name}:")
            for p in sorted(paths)[:5]:
                lines.append(f"    {p}")
        lines.append("")

    # Top páginas mais linkadas
    lines.append("─" * 72)
    lines.append("  TOP 20 PÁGINAS MAIS LINKADAS")
    lines.append("─" * 72)
    sorted_backlinks = sorted(nav_map["backlinks"].items(), key=lambda x: len(x[1]), reverse=True)
    for page, refs in sorted_backlinks[:20]:
        lines.append(f"  {len(refs):>4} links → {page}")

    lines.append("")
    return "\n".join(lines)


def generate_md(nav_map: Dict) -> str:
    """Gera relatório de navegação em Markdown."""
    lines = []
    lines.append("# 🧭 Mapa de Navegação do Site")
    lines.append("")
    lines.append("## 📊 Resumo")
    lines.append("")
    lines.append("| Métrica | Valor |")
    lines.append("|---|---|")
    lines.append(f"| Páginas HTML | **{nav_map['total_html']:,}** |")
    lines.append(f"| Links internos | **{nav_map['total_internal_links']:,}** |")
    lines.append(f"| Links externos | **{nav_map['total_external_links']:,}** |")
    lines.append(f"| Páginas órfãs | **{nav_map['total_orphan_pages']:,}** |")
    lines.append(f"| Com breadcrumb | {nav_map['pages_with_breadcrumb']:,} |")
    lines.append(f"| Sem breadcrumb | {len(nav_map['pages_without_breadcrumb']):,} |")
    lines.append(f"| Blog | {nav_map['blog_structure']['total']:,} páginas |")
    lines.append(f"| Biblioteca | {nav_map['biblioteca_structure']['total']:,} páginas |")
    lines.append(f"| Downloads | {nav_map['downloads_structure']['total']:,} páginas |")
    lines.append("")

    if nav_map["orphan_pages"]:
        lines.append("## ⚠️ Páginas Órfãs")
        for p in nav_map["orphan_pages"][:20]:
            lines.append(f"- `{p}`")
        lines.append("")

    if nav_map["duplicate_pages"]:
        lines.append("## 🔄 Páginas com Nome Duplicado")
        for name, paths in sorted(nav_map["duplicate_pages"].items()):
            lines.append(f"- **{name}**: {len(paths)} ocorrências")
        lines.append("")

    return "\n".join(lines)
