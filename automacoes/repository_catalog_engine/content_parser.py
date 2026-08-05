"""Parser de conteúdo de arquivos — Fase 2.

Analisa o conteúdo interno de HTML, CSS, JS, JSON e Markdown.
Extrai imports, dependências, recursos utilizados.
NUNCA modifica arquivos.
"""

import re
import json as json_mod
from pathlib import Path
from typing import List, Dict, Set, Optional
from collections import defaultdict

from .config import BASE_DIR


# ── HTML Parser ───────────────────────────────────────────────────────

def parse_html(content: str, rel_path: Path) -> Dict:
    """Extrai todas as dependências e metadados de um arquivo HTML.

    Returns:
        Dicionário com listas de scripts, CSS, imagens, links, etc.
    """
    result = {
        "scripts": [],          # <script src="...">
        "scripts_inline": 0,    # <script> sem src (conteúdo inline)
        "css": [],              # <link rel="stylesheet" href="...">
        "css_inline": 0,        # <style> tags
        "images": [],           # <img src="...">
        "preloads": [],         # <link rel="preload" href="...">
        "preconnects": [],      # <link rel="preconnect" href="...">
        "dns_prefetch": [],     # <link rel="dns-prefetch" href="...">
        "fonts_used": [],       # @font-face ou font-family
        "meta_tags": [],        # <meta ...>
        "schemas": [],          # <script type="application/ld+json">
        "links_internal": [],   # <a href="/...">
        "links_external": [],   # <a href="https://...">
        "iframes": [],          # <iframe src="...">
        "videos": [],           # <video><source src="...">
        "canonical": None,      # <link rel="canonical" href="...">
        "hreflangs": [],        # <link rel="alternate" hreflang="...">
        "title": None,          # <title>
        "description": None,    # <meta name="description">
        "keywords": None,       # <meta name="keywords">
        "h1_count": 0,          # Quantidade de <h1>
        "img_alt_missing": 0,   # Imagens sem alt
    }

    # Scripts com src
    for m in re.finditer(r'<script[^>]+src=["\']([^"\']+)["\']', content, re.I):
        result["scripts"].append(m.group(1))

    # Scripts inline
    result["scripts_inline"] = len(re.findall(r'<script[^>]*>(?!\s*</script>)', content, re.I))

    # CSS externo
    for m in re.finditer(r'<link[^>]+rel=["\']stylesheet["\'][^>]+href=["\']([^"\']+)["\']', content, re.I):
        result["css"].append(m.group(1))
    # Também pega <link> com href primeiro e rel depois
    for m in re.finditer(r'<link[^>]+href=["\']([^"\']+\.css[^"\']*)["\'][^>]+rel=["\']stylesheet["\']', content, re.I):
        css_url = m.group(1)
        if css_url not in result["css"]:
            result["css"].append(css_url)

    # Imagens
    for m in re.finditer(r'<img[^>]+src=["\']([^"\']+)["\']', content, re.I):
        result["images"].append(m.group(1))
    # Imagens sem alt
    result["img_alt_missing"] = len(re.findall(r'<img(?![^>]*alt=["\'])[^>]*>', content, re.I))

    # CSS inline
    result["css_inline"] = len(re.findall(r'<style[^>]*>', content, re.I))

    # Preloads
    for m in re.finditer(r'<link[^>]+rel=["\']preload["\'][^>]+href=["\']([^"\']+)["\']', content, re.I):
        result["preloads"].append(m.group(1))

    # Preconnects
    for m in re.finditer(r'<link[^>]+rel=["\']preconnect["\'][^>]+href=["\']([^"\']+)["\']', content, re.I):
        result["preconnects"].append(m.group(1))

    # DNS Prefetch
    for m in re.finditer(r'<link[^>]+rel=["\']dns-prefetch["\'][^>]+href=["\']([^"\']+)["\']', content, re.I):
        result["dns_prefetch"].append(m.group(1))

    # Meta tags
    for m in re.finditer(r'<meta[^>]+name=["\']([^"\']+)["\'][^>]+content=["\']([^"\']*)["\']', content, re.I):
        result["meta_tags"].append({"name": m.group(1), "content": m.group(2)})

    # Schema.org
    if 'application/ld+json' in content:
        result["schemas"].append("ld+json presente")

    # Links internos
    for m in re.finditer(r'href=["\'](/[^"\']+)["\']', content):
        href = m.group(1)
        if not href.startswith("//"):
            result["links_internal"].append(href)

    # Links externos
    for m in re.finditer(r'href=["\'](https?://[^"\']+)["\']', content):
        result["links_external"].append(m.group(1))

    # Canonical
    canon = re.search(r'<link[^>]+rel=["\']canonical["\'][^>]+href=["\']([^"\']+)["\']', content, re.I)
    if canon:
        result["canonical"] = canon.group(1)

    # Hreflangs
    for m in re.finditer(r'<link[^>]+hreflang=["\']([^"\']+)["\'][^>]+href=["\']([^"\']+)["\']', content, re.I):
        result["hreflangs"].append({"lang": m.group(1), "href": m.group(2)})

    # Title
    title = re.search(r'<title>([^<]+)</title>', content, re.I)
    if title:
        result["title"] = title.group(1).strip()

    # Description
    desc = re.search(r'<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']+)["\']', content, re.I)
    if desc:
        result["description"] = desc.group(1)

    # Keywords
    kw = re.search(r'<meta[^>]+name=["\']keywords["\'][^>]+content=["\']([^"\']+)["\']', content, re.I)
    if kw:
        result["keywords"] = kw.group(1)

    # H1 count
    result["h1_count"] = len(re.findall(r'<h1[>\s]', content, re.I))

    # Fontes (@font-face ou font-family)
    fonts = set()
    for m in re.finditer(r'font-family:\s*["\']?([^"\';\}]+)["\']?', content, re.I):
        font = m.group(1).strip().split(",")[0].strip().strip('"').strip("'")
        if font:
            fonts.add(font)
    result["fonts_used"] = sorted(fonts)

    # iFrames
    for m in re.finditer(r'<iframe[^>]+src=["\']([^"\']+)["\']', content, re.I):
        result["iframes"].append(m.group(1))

    # Vídeos
    for m in re.finditer(r'<source[^>]+src=["\']([^"\']+)["\']', content, re.I):
        result["videos"].append(m.group(1))

    # Dedup e limpeza
    for key in ["scripts", "css", "images", "links_internal", "links_external"]:
        result[key] = sorted(set(result[key]))

    return result


# ── CSS Parser ────────────────────────────────────────────────────────

def parse_css(content: str, rel_path: Path) -> Dict:
    """Extrai dependências de um arquivo CSS."""
    result = {
        "imports": [],
        "images": [],
        "fonts": [],
        "external_resources": [],
    }

    # @import
    for m in re.finditer(r'@import\s+(?:url\(["\']?)?([^"\')\s]+)', content, re.I):
        url = m.group(1).strip('"').strip("'")
        result["imports"].append(url)

    # Imagens (background, url())
    for m in re.finditer(r'url\(["\']?([^"\')\s]+)["\']?\)', content, re.I):
        url = m.group(1)
        if any(url.lower().endswith(ext) for ext in [".webp", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico"]):
            result["images"].append(url)

    # Fontes
    for m in re.finditer(r'font-family:\s*["\']?([^"\';\}]+)["\']?', content, re.I):
        font = m.group(1).strip().split(",")[0].strip().strip('"').strip("'")
        if font:
            result["fonts"].append(font)

    # Recursos externos
    for m in re.finditer(r'url\(["\']?(https?://[^"\')\s]+)["\']?\)', content, re.I):
        result["external_resources"].append(m.group(1))

    return result


# ── JS Parser ─────────────────────────────────────────────────────────

def parse_js(content: str, rel_path: Path) -> Dict:
    """Extrai dependências de um arquivo JavaScript."""
    result = {
        "imports": [],
        "exports": [],
        "fetch_calls": [],
        "api_calls": [],
        "external_urls": [],
        "local_imports": [],
    }

    # import ... from "..."
    for m in re.finditer(r'import\s+.*?from\s+["\']([^"\']+)["\']', content, re.I):
        result["imports"].append(m.group(1))

    # import "..."
    for m in re.finditer(r'import\s+["\']([^"\']+)["\']', content, re.I):
        mod = m.group(1)
        if mod not in result["imports"]:
            result["imports"].append(mod)

    # export
    for m in re.finditer(r'export\s+(default\s+)?(class|function|const|let|var|async\s+function)\s+(\w+)', content):
        result["exports"].append(m.group(3))

    # fetch()
    for m in re.finditer(r'fetch\(["\']([^"\']+)["\']', content):
        result["fetch_calls"].append(m.group(1))

    # URLs externas em strings
    for m in re.finditer(r'["\'](https?://[^"\']+)["\']', content):
        url = m.group(1)
        if "firebase" in url or "gstatic" in url or "cdn" in url or "googleapis" in url:
            result["external_urls"].append(url)

    # APIs internas (fetch com caminho relativo)
    result["api_calls"] = [
        u for u in result["fetch_calls"]
        if u.startswith("/") and not u.startswith("//")
    ]

    # Imports locais
    result["local_imports"] = [
        i for i in result["imports"]
        if i.startswith("/") or i.startswith("./") or i.startswith("../")
    ]

    return result


# ── JSON Parser ───────────────────────────────────────────────────────

def parse_json(content: str, rel_path: Path) -> Dict:
    """Extrai informações de um arquivo JSON."""
    result = {
        "keys": [],
        "top_level_keys": [],
        "item_count": 0,
        "size_category": "empty",
    }

    try:
        data = json_mod.loads(content)
        if isinstance(data, dict):
            result["top_level_keys"] = list(data.keys())
            result["item_count"] = len(data)
        elif isinstance(data, list):
            result["top_level_keys"] = [f"[{i}]" for i in range(min(3, len(data)))]
            result["item_count"] = len(data)

        # Categoria por tamanho
        c = result["item_count"]
        if c == 0:
            result["size_category"] = "vazio"
        elif c < 50:
            result["size_category"] = "pequeno"
        elif c < 500:
            result["size_category"] = "médio"
        elif c < 5000:
            result["size_category"] = "grande"
        else:
            result["size_category"] = "muito grande"

    except (json_mod.JSONDecodeError, ValueError):
        result["parse_error"] = True

    return result


# ── Markdown Parser ────────────────────────────────────────────────────

def parse_markdown(content: str, rel_path: Path) -> Dict:
    """Extrai informações de um arquivo Markdown."""
    result = {
        "headings": [],
        "links": [],
        "images": [],
        "code_blocks": 0,
    }

    # Headings
    for m in re.finditer(r'^(#{1,6})\s+(.+)$', content, re.MULTILINE):
        result["headings"].append({"level": len(m.group(1)), "title": m.group(2).strip()})

    # Links [text](url)
    for m in re.finditer(r'\[([^\]]+)\]\(([^)]+)\)', content):
        result["links"].append({"text": m.group(1), "url": m.group(2)})

    # Imagens ![alt](url)
    for m in re.finditer(r'!\[([^\]]*)\]\(([^)]+)\)', content):
        result["images"].append({"alt": m.group(1), "url": m.group(2)})

    # Code blocks
    result["code_blocks"] = len(re.findall(r'```', content)) // 2

    return result


# ── Dispatcher ─────────────────────────────────────────────────────────

PARSERS = {
    ".html": parse_html,
    ".htm": parse_html,
    ".css": parse_css,
    ".js": parse_js,
    ".mjs": parse_js,
    ".cjs": parse_js,
    ".json": parse_json,
    ".md": parse_markdown,
}


def parse_file(file_info: Dict) -> Optional[Dict]:
    """Analisa o conteúdo de um arquivo usando o parser apropriado.

    Args:
        file_info: Dicionário com metadados do scanner (deve conter 'path').

    Returns:
        Dicionário com as dependências extraídas, ou None se não parseável.
    """
    ext = file_info["extension"].lower()
    parser = PARSERS.get(ext)

    if not parser:
        return None

    try:
        content = file_info["path"].read_text(encoding="utf-8", errors="replace")
        result = parser(content, file_info["relative_path"])
        result["_file"] = str(file_info["relative_path"])
        result["_type"] = file_info["type"]
        return result
    except Exception:
        return None
