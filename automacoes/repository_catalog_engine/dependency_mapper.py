"""Mapeador de dependências — Fase 3.

Constrói um grafo completo de dependências entre arquivos do repositório.
Identifica: HTML→CSS, HTML→JS, HTML→Imagens, CSS→Fontes, JS→Módulos, etc.
"""

from pathlib import Path
from typing import List, Dict, Set
from collections import defaultdict

from .config import BASE_DIR


def build_dependency_map(
    files: List[Dict],
    parsed_content: Dict[str, Dict],
) -> Dict:
    """Constrói o mapa completo de dependências.

    Args:
        files: Lista de metadados do scanner.
        parsed_content: Dicionário {relative_path: parsed_data} do content_parser.

    Returns:
        Dicionário com grafos de dependência por tipo.
    """
    # ── Normalizador de caminhos ────────────────────────────────────
    def normalize(path: str) -> str:
        """Normaliza um caminho para comparação."""
        if path.startswith("http"):
            return path
        # Remove query strings e hashes
        path = path.split("?")[0].split("#")[0]
        if path.startswith("/"):
            path = path[1:]  # remove leading /
        return path.lower()

    # ── Construir mapa de arquivos existentes ────────────────────────
    existing_files = set()
    for f in files:
        existing_files.add(str(f["relative_path"]).lower().replace("\\", "/"))

    # ── Grafos ───────────────────────────────────────────────────────
    html_to_css = defaultdict(set)     # HTML → CSS
    html_to_js = defaultdict(set)      # HTML → JS
    html_to_img = defaultdict(set)     # HTML → imagens
    html_to_json = defaultdict(set)    # HTML → JSON
    html_to_fonts = defaultdict(set)   # HTML → fontes
    css_to_fonts = defaultdict(set)    # CSS → fontes
    css_to_img = defaultdict(set)      # CSS → imagens
    js_to_modules = defaultdict(set)   # JS → módulos
    js_to_json = defaultdict(set)      # JS → JSON
    js_to_apis = defaultdict(set)      # JS → APIs
    external_libs = defaultdict(set)   # Bibliotecas externas usadas
    broken_refs = []                   # Referências quebradas

    for rel_str, parsed in parsed_content.items():
        file_type = parsed.get("_type", "")

        if file_type == "html":
            html_path = rel_str

            # CSS
            for css in parsed.get("css", []):
                norm = normalize(css)
                html_to_css[html_path].add(css)
                if not css.startswith("http") and not _exists(norm, existing_files):
                    broken_refs.append({"from": html_path, "to": css, "type": "CSS"})

            # JS
            for js in parsed.get("scripts", []):
                norm = normalize(js)
                html_to_js[html_path].add(js)
                if not js.startswith("http") and not _exists(norm, existing_files):
                    broken_refs.append({"from": html_path, "to": js, "type": "JS"})
                if "http" in js:
                    external_libs["js_external"].add(js)

            # Imagens
            for img in parsed.get("images", []):
                norm = normalize(img)
                html_to_img[html_path].add(img)
                if not img.startswith("http") and not _exists(norm, existing_files):
                    broken_refs.append({"from": html_path, "to": img, "type": "Imagem"})

            # Fontes
            for font in parsed.get("fonts_used", []):
                html_to_fonts[html_path].add(font)

            # Preloads
            for pre in parsed.get("preloads", []):
                norm = normalize(pre)
                if not pre.startswith("http") and not _exists(norm, existing_files):
                    broken_refs.append({"from": html_path, "to": pre, "type": "Preload"})

            # Links externos
            for link in parsed.get("links_external", []):
                external_libs["external_links"].add(link)

            # Preconnects
            for pc in parsed.get("preconnects", []):
                external_libs["preconnects"].add(pc)

        elif file_type == "css":
            css_path = rel_str
            for img in parsed.get("images", []):
                css_to_img[css_path].add(img)
            for font in parsed.get("fonts", []):
                css_to_fonts[css_path].add(font)

        elif file_type == "js":
            js_path = rel_str
            for imp in parsed.get("local_imports", []):
                js_to_modules[js_path].add(imp)
            for api in parsed.get("api_calls", []):
                js_to_apis[js_path].add(api)
            for url in parsed.get("external_urls", []):
                external_libs["js_external"].add(url)

    # ── Sumários ─────────────────────────────────────────────────────
    return {
        "html_to_css": {k: sorted(v) for k, v in html_to_css.items()},
        "html_to_js": {k: sorted(v) for k, v in html_to_js.items()},
        "html_to_img": {k: sorted(v) for k, v in html_to_img.items()},
        "html_to_fonts": {k: sorted(v) for k, v in html_to_fonts.items()},
        "css_to_fonts": {k: sorted(v) for k, v in css_to_fonts.items()},
        "css_to_img": {k: sorted(v) for k, v in css_to_img.items()},
        "js_to_modules": {k: sorted(v) for k, v in js_to_modules.items()},
        "js_to_apis": {k: sorted(v) for k, v in js_to_apis.items()},
        "external_libraries": {k: sorted(v) for k, v in external_libs.items()},
        "broken_references": broken_refs,
        # Estatísticas
        "total_html_css_edges": sum(len(v) for v in html_to_css.values()),
        "total_html_js_edges": sum(len(v) for v in html_to_js.values()),
        "total_html_img_edges": sum(len(v) for v in html_to_img.values()),
        "total_broken_refs": len(broken_refs),
    }


def _exists(normalized_path: str, existing_files: Set[str]) -> bool:
    """Verifica se um caminho normalizado existe no conjunto de arquivos."""
    return normalized_path in existing_files


# ── Geradores de Relatório ─────────────────────────────────────────────

def generate_txt(dep_map: Dict) -> str:
    """Gera relatório de dependências em texto."""
    lines = []
    lines.append("=" * 72)
    lines.append("  MAPA DE DEPENDÊNCIAS")
    lines.append("=" * 72)
    lines.append("")

    # Resumo
    lines.append(f"Total arestas HTML→CSS:    {dep_map['total_html_css_edges']:,}")
    lines.append(f"Total arestas HTML→JS:     {dep_map['total_html_js_edges']:,}")
    lines.append(f"Total arestas HTML→Imagem:  {dep_map['total_html_img_edges']:,}")
    lines.append(f"Referências quebradas:      {dep_map['total_broken_refs']:,}")
    lines.append("")

    # Referências quebradas
    if dep_map["broken_references"]:
        lines.append("─" * 72)
        lines.append("  REFERÊNCIAS QUEBRADAS")
        lines.append("─" * 72)
        for ref in dep_map["broken_references"][:50]:
            lines.append(f"  {ref['type']:8} | {ref['from']}")
            lines.append(f"           → {ref['to']}")
        lines.append("")

    # Bibliotecas externas
    lines.append("─" * 72)
    lines.append("  BIBLIOTECAS EXTERNAS")
    lines.append("─" * 72)
    for cat, urls in dep_map["external_libraries"].items():
        lines.append(f"  [{cat}] ({len(urls)} recursos)")
        for url in sorted(urls)[:10]:
            lines.append(f"    {url}")
        if len(urls) > 10:
            lines.append(f"    ... +{len(urls) - 10} mais")
        lines.append("")

    # Top HTML com mais dependências
    lines.append("─" * 72)
    lines.append("  TOP 20 HTML COM MAIS DEPENDÊNCIAS")
    lines.append("─" * 72)
    # Combina contagens
    dep_count = {}
    for html in dep_map["html_to_css"]:
        dep_count[html] = (
            len(dep_map["html_to_css"].get(html, [])) +
            len(dep_map["html_to_js"].get(html, [])) +
            len(dep_map["html_to_img"].get(html, []))
        )
    for html, count in sorted(dep_count.items(), key=lambda x: x[1], reverse=True)[:20]:
        lines.append(f"  {count:>4} deps | {html}")

    lines.append("")
    return "\n".join(lines)


def generate_md(dep_map: Dict) -> str:
    """Gera relatório de dependências em Markdown."""
    lines = []
    lines.append("# 🔗 Mapa de Dependências")
    lines.append("")
    lines.append("## 📊 Resumo")
    lines.append("")
    lines.append("| Métrica | Valor |")
    lines.append("|---|---|")
    lines.append(f"| Arestas HTML→CSS | **{dep_map['total_html_css_edges']:,}** |")
    lines.append(f"| Arestas HTML→JS | **{dep_map['total_html_js_edges']:,}** |")
    lines.append(f"| Arestas HTML→Imagem | **{dep_map['total_html_img_edges']:,}** |")
    lines.append(f"| Referências quebradas | **{dep_map['total_broken_refs']:,}** |")
    lines.append("")

    if dep_map["broken_references"]:
        lines.append("## ⚠️ Referências Quebradas")
        lines.append("")
        lines.append("| Tipo | Origem | Destino |")
        lines.append("|---|---|---|")
        for ref in dep_map["broken_references"][:30]:
            lines.append(f"| {ref['type']} | `{ref['from']}` | `{ref['to']}` |")
        lines.append("")

    lines.append("## 🌐 Bibliotecas Externas")
    lines.append("")
    for cat, urls in dep_map["external_libraries"].items():
        lines.append(f"### {cat} ({len(urls)})")
        for url in sorted(urls)[:5]:
            lines.append(f"- {url}")
        if len(urls) > 5:
            lines.append(f"- *...+{len(urls) - 5} mais*")
        lines.append("")

    return "\n".join(lines)
