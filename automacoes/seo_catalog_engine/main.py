"""SEO Catalog Engine — Catálogo completo da arquitetura de SEO.

Analisa todos os HTMLs do projeto (raiz + 18 idiomas + blog).
NUNCA modifica arquivos. Apenas leitura, análise e documentação.

Saída: CATALOGO_SEO_METAS_HEAD/
"""

import re
import sys
import json as json_mod
from pathlib import Path
from collections import defaultdict, Counter
from typing import Dict, List, Set, Optional, Tuple

# ═══════════════════════════════════════════════════════════════════
# CONFIG
# ═══════════════════════════════════════════════════════════════════

BASE_DIR = Path(__file__).resolve().parent.parent.parent
OUTPUT_DIR = BASE_DIR / "CATALOGO_SEO_METAS_HEAD"
TXT_OUT = OUTPUT_DIR / "CATALOGO_SEO_DO_PROJETO.txt"
MD_OUT = OUTPUT_DIR / "CATALOGO_SEO_DO_PROJETO.md"

LANGUAGE_FOLDERS = [
    "en", "es", "de", "it", "fr", "hi", "zh",
    "ar", "ja", "ru", "ko", "tr", "nl", "pl",
    "sv", "id", "vi", "uk",
]

IGNORE_DIRS = {".git", ".github", ".vscode", "__pycache__", ".ai",
               "node_modules", "logs", "temp", "automacoes", "docs",
               "DOCS", "public", "src", "css", "js", "img", "fonts",
               "downloads", "biblioteca", "CATALOGO_DO_SITE",
               "CATALOGO_DE_IDENTIDADE_VISUAL", "CATALOGO_SEO_METAS_HEAD",
               "CATALOGO_DE_ESTRUTURA_FISICA"}


# ═══════════════════════════════════════════════════════════════════
# SCANNER
# ═══════════════════════════════════════════════════════════════════

def scan_all_html() -> List[Path]:
    """Varre raiz, pastas de idioma e blog. Retorna todos os HTMLs."""
    html_files = []

    # Raiz
    for f in sorted(BASE_DIR.glob("*.html")):
        if f.name not in {".html"}:
            html_files.append(f)

    # Pastas de idioma
    for lang in LANGUAGE_FOLDERS:
        lang_dir = BASE_DIR / lang
        if lang_dir.exists():
            for f in sorted(lang_dir.glob("*.html")):
                html_files.append(f)

    # Blog
    blog_dir = BASE_DIR / "blog"
    if blog_dir.exists():
        for f in sorted(blog_dir.glob("*.html")):
            html_files.append(f)

    # Conta
    conta_dir = BASE_DIR / "conta"
    if conta_dir.exists():
        for f in sorted(conta_dir.glob("*.html")):
            html_files.append(f)

    return html_files


# ═══════════════════════════════════════════════════════════════════
# PARSER
# ═══════════════════════════════════════════════════════════════════

def parse_html_seo(filepath: Path) -> Dict:
    """Extrai todas as informações de SEO de um arquivo HTML."""
    try:
        content = filepath.read_text(encoding="utf-8", errors="replace")
    except Exception:
        return _empty_result(filepath)

    rel = str(filepath.relative_to(BASE_DIR))
    # Detecta idioma pelo caminho
    lang = "pt"
    parts = Path(rel).parts
    if len(parts) >= 2 and parts[0] in LANGUAGE_FOLDERS:
        lang = parts[0]
    elif parts[0] == "blog":
        lang = "pt"
    elif parts[0] == "conta":
        lang = "pt"

    # Extrai head (entre <head> e </head>)
    head_match = re.search(r'<head[^>]*>(.*?)</head>', content, re.DOTALL | re.I)
    head = head_match.group(1) if head_match else ""

    result = {
        "file": rel,
        "name": filepath.name,
        "language": lang,
        "location": _detect_location(rel),
        "size_bytes": len(content),
        "title": _extract_title(head),
        "meta_description": _extract_meta(head, "description"),
        "meta_keywords": _extract_meta(head, "keywords"),
        "meta_robots": _extract_meta(head, "robots"),
        "meta_viewport": _extract_meta(head, "viewport"),
        "meta_author": _extract_meta(head, "author"),
        "meta_theme_color": _extract_meta_name(head, "theme-color"),
        "canonical": _extract_canonical(head),
        "hreflangs": _extract_hreflangs(head),
        "open_graph": _extract_open_graph(head),
        "twitter": _extract_twitter(head),
        "schemas": _extract_schemas(head, content),
        "favicon": _extract_favicon(head),
        "preloads": _extract_preloads(head),
        "preconnects": _extract_preconnects(head),
        "dns_prefetch": _extract_dns_prefetch(head),
        "css_files": _extract_css(head),
        "scripts": _extract_scripts(head),
        "fonts_used": _extract_fonts_inline(head),
        "images_og": _extract_og_image(head),
        "charset": _extract_charset(head),
        "links_internal": _extract_internal_links(content),
        "links_external": _extract_external_links(content),
        "h1_count": len(re.findall(r'<h1[>\s]', content, re.I)),
        "img_count": len(re.findall(r'<img[^>]+src=', content, re.I)),
        "img_with_alt": len(re.findall(r'<img[^>]+alt=["\'][^"\']', content, re.I)),
    }
    return result


def _empty_result(filepath: Path) -> Dict:
    rel = str(filepath.relative_to(BASE_DIR))
    return {"file": rel, "name": filepath.name, "language": "?", "location": "?",
            "size_bytes": 0, "title": None, "meta_description": None,
            "meta_keywords": None, "meta_robots": None, "meta_viewport": None,
            "meta_author": None, "meta_theme_color": None, "canonical": None,
            "hreflangs": [], "open_graph": {}, "twitter": {}, "schemas": [],
            "favicon": None, "preloads": [], "preconnects": [], "dns_prefetch": [],
            "css_files": [], "scripts": [], "fonts_used": [], "images_og": None,
            "charset": None, "links_internal": [], "links_external": [],
            "h1_count": 0, "img_count": 0, "img_with_alt": 0}


def _detect_location(rel: str) -> str:
    parts = Path(rel).parts
    if len(parts) == 1:
        return "raiz"
    if parts[0] in LANGUAGE_FOLDERS:
        return f"idioma/{parts[0]}"
    return parts[0]


def _extract_title(head: str) -> Optional[str]:
    m = re.search(r'<title>([^<]+)</title>', head, re.I)
    return m.group(1).strip() if m else None


def _extract_meta(head: str, name: str) -> Optional[str]:
    m = re.search(rf'<meta[^>]+name=["\']{name}["\'][^>]+content=["\']([^"\']+)["\']', head, re.I)
    if not m:
        m = re.search(rf'<meta[^>]+content=["\']([^"\']+)["\'][^>]+name=["\']{name}["\']', head, re.I)
    return m.group(1).strip() if m else None


def _extract_meta_name(head: str, name: str) -> Optional[str]:
    m = re.search(rf'<meta[^>]+name=["\']{name}["\'][^>]+content=["\']([^"\']+)["\']', head, re.I)
    return m.group(1).strip() if m else None


def _extract_canonical(head: str) -> Optional[str]:
    # Tenta rel antes de href
    m = re.search(r'<link[^>]+rel=["\']canonical["\'][^>]+href=["\']([^"\']+)["\']', head, re.I)
    # Tenta href antes de rel (ordem invertida)
    if not m:
        m = re.search(r'<link[^>]+href=["\']([^"\']+)["\'][^>]+rel=["\']canonical["\']', head, re.I)
    return m.group(1) if m else None


def _extract_hreflangs(head: str) -> List[Dict]:
    result = []
    # Padrão 1: hreflang antes de href
    for m in re.finditer(r'<link[^>]+hreflang=["\']([^"\']+)["\'][^>]+href=["\']([^"\']+)["\']', head, re.I):
        result.append({"lang": m.group(1), "href": m.group(2)})
    # Padrão 2: href antes de hreflang
    for m in re.finditer(r'<link[^>]+href=["\']([^"\']+)["\'][^>]+hreflang=["\']([^"\']+)["\']', head, re.I):
        result.append({"lang": m.group(2), "href": m.group(1)})
    # Padrão 3: alternativo com rel=alternate
    for m in re.finditer(r'<link[^>]+rel=["\']alternate["\'][^>]+hreflang=["\']([^"\']+)["\'][^>]+href=["\']([^"\']+)["\']', head, re.I):
        if {"lang": m.group(1), "href": m.group(2)} not in result:
            result.append({"lang": m.group(1), "href": m.group(2)})
    return result


def _extract_open_graph(head: str) -> Dict:
    og = {}
    for m in re.finditer(r'<meta[^>]+property=["\']og:(\w+)["\'][^>]+content=["\']([^"\']+)["\']', head, re.I):
        og[m.group(1)] = m.group(2)
    return og


def _extract_twitter(head: str) -> Dict:
    tw = {}
    for m in re.finditer(r'<meta[^>]+name=["\']twitter:(\w+)["\'][^>]+content=["\']([^"\']+)["\']', head, re.I):
        tw[m.group(1)] = m.group(2)
    return tw


def _extract_schemas(head: str, full: str) -> List[str]:
    schemas = []
    # JSON-LD
    for m in re.finditer(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', full, re.DOTALL | re.I):
        try:
            data = json_mod.loads(m.group(1))
            if isinstance(data, dict) and "@type" in data:
                schemas.append(f"JSON-LD:{data['@type']}")
            elif isinstance(data, list):
                for item in data:
                    if isinstance(item, dict) and "@type" in item:
                        schemas.append(f"JSON-LD:{item['@type']}")
        except Exception:
            schemas.append("JSON-LD:(parse error)")
    return schemas


def _extract_favicon(head: str) -> Optional[str]:
    m = re.search(r'<link[^>]+rel=["\'](?:shortcut\s+)?icon["\'][^>]+href=["\']([^"\']+)["\']', head, re.I)
    if not m:
        m = re.search(r'<link[^>]+href=["\']([^"\']+)["\'][^>]+rel=["\'](?:shortcut\s+)?icon["\']', head, re.I)
    return m.group(1) if m else None


def _extract_preloads(head: str) -> List[Dict]:
    result = []
    # href antes de rel (padrão mais comum no projeto)
    for m in re.finditer(r'<link[^>]+href=["\']([^"\']+)["\'][^>]+rel=["\']preload["\']', head, re.I):
        as_match = re.search(r'as=["\']([^"\']+)["\']', m.group(0))
        href = m.group(1)
        if not any(r["href"] == href for r in result):
            result.append({"href": href, "as": as_match.group(1) if as_match else "?"})
    # rel antes de href
    for m in re.finditer(r'<link[^>]+rel=["\']preload["\'][^>]+href=["\']([^"\']+)["\']', head, re.I):
        as_match = re.search(r'as=["\']([^"\']+)["\']', m.group(0))
        href = m.group(1)
        if not any(r["href"] == href for r in result):
            result.append({"href": href, "as": as_match.group(1) if as_match else "?"})
    return result


def _extract_preconnects(head: str) -> List[str]:
    result = []
    for m in re.finditer(r'<link[^>]+rel=["\']preconnect["\'][^>]+href=["\']([^"\']+)["\']', head, re.I):
        result.append(m.group(1))
    for m in re.finditer(r'<link[^>]+href=["\']([^"\']+)["\'][^>]+rel=["\']preconnect["\']', head, re.I):
        result.append(m.group(1))
    return result


def _extract_dns_prefetch(head: str) -> List[str]:
    result = []
    for m in re.finditer(r'<link[^>]+rel=["\']dns-prefetch["\'][^>]+href=["\']([^"\']+)["\']', head, re.I):
        result.append(m.group(1))
    for m in re.finditer(r'<link[^>]+href=["\']([^"\']+)["\'][^>]+rel=["\']dns-prefetch["\']', head, re.I):
        result.append(m.group(1))
    return result


def _extract_css(head: str) -> List[str]:
    result = []
    for m in re.finditer(r'<link[^>]+href=["\']([^"\']+\.css[^"\']*)["\']', head, re.I):
        result.append(m.group(1))
    return result


def _extract_scripts(head: str) -> List[Dict]:
    result = []
    for m in re.finditer(r'<script[^>]+src=["\']([^"\']+)["\']', head, re.I):
        script = m.group(1)
        is_defer = "defer" in m.group(0)
        is_async = "async" in m.group(0)
        result.append({"src": script, "defer": is_defer, "async": is_async})
    # Inline scripts
    inline = len(re.findall(r'<script[^>]*>(?!\s*</script>)', head, re.I))
    return result


def _extract_fonts_inline(head: str) -> List[str]:
    fonts = set()
    for m in re.finditer(r"font-family:\s*['\"]?([^'\"\}]+)['\"]?", head, re.I):
        fonts.add(m.group(1).strip().split(",")[0].strip().strip("'").strip('"'))
    return sorted(fonts)


def _extract_og_image(head: str) -> Optional[str]:
    m = re.search(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']', head, re.I)
    return m.group(1) if m else None


def _extract_charset(head: str) -> Optional[str]:
    m = re.search(r'<meta[^>]+charset=["\']([^"\']+)["\']', head, re.I)
    return m.group(1) if m else None


def _extract_internal_links(content: str) -> List[str]:
    links = set()
    for m in re.finditer(r'href=["\'](/[^"\']+)["\']', content):
        href = m.group(1)
        if not href.startswith("//"):
            links.add(href.split("?")[0].split("#")[0])
    return sorted(links)


def _extract_external_links(content: str) -> List[str]:
    links = set()
    for m in re.finditer(r'href=["\'](https?://[^"\']+)["\']', content):
        links.add(m.group(1))
    return sorted(links)


# ═══════════════════════════════════════════════════════════════════
# ANALYZER
# ═══════════════════════════════════════════════════════════════════

def analyze(all_data: List[Dict]) -> Dict:
    """Computa todas as estatísticas de SEO."""
    stats = {}
    total = len(all_data)

    # ── Resumo ──
    by_lang = Counter(d["language"] for d in all_data)
    by_loc = Counter(d["location"] for d in all_data)
    stats["total"] = total
    stats["by_language"] = dict(by_lang.most_common())
    stats["by_location"] = dict(by_loc.most_common())
    stats["languages_found"] = len(by_lang)

    # ── Title ──
    titles = [(d["file"], d["title"]) for d in all_data if d["title"]]
    title_lengths = [(d["file"], len(d["title"])) for d in all_data if d["title"]]
    missing_title = [d["file"] for d in all_data if not d["title"]]
    dup_titles = _find_duplicates([(d["file"], d["title"]) for d in all_data if d["title"]])
    too_short = [(f, l) for f, l in title_lengths if l < 30]
    too_long = [(f, l) for f, l in title_lengths if l > 60]
    stats["title"] = {
        "total_with": len(titles),
        "missing": missing_title,
        "missing_count": len(missing_title),
        "duplicates": dup_titles,
        "too_short": too_short,
        "too_short_count": len(too_short),
        "too_long": too_long,
        "too_long_count": len(too_long),
        "avg_length": sum(l for _, l in title_lengths) // max(1, len(title_lengths)),
    }

    # ── Description ──
    descs = [(d["file"], d["meta_description"]) for d in all_data if d["meta_description"]]
    desc_lengths = [(f, len(d)) for f, d in descs]
    missing_desc = [d["file"] for d in all_data if not d["meta_description"]]
    stats["description"] = {
        "total_with": len(descs),
        "missing_count": len(missing_desc),
        "too_short": [(f, l) for f, l in desc_lengths if l < 70],
        "too_long": [(f, l) for f, l in desc_lengths if l > 160],
        "avg_length": sum(l for _, l in desc_lengths) // max(1, len(desc_lengths)),
    }

    # ── Keywords ──
    with_kw = [d["file"] for d in all_data if d["meta_keywords"]]
    stats["keywords"] = {"with_keywords": len(with_kw), "without": total - len(with_kw)}

    # ── Robots ──
    robots_counts = Counter(d["meta_robots"] or "ausente" for d in all_data)
    stats["robots"] = dict(robots_counts.most_common())

    # ── Canonical ──
    with_canon = [d for d in all_data if d["canonical"]]
    without_canon = [d["file"] for d in all_data if not d["canonical"]]
    stats["canonical"] = {
        "total_with": len(with_canon),
        "missing": without_canon,
        "missing_count": len(without_canon),
    }

    # ── Hreflang ──
    hreflang_counts = Counter(len(d["hreflangs"]) for d in all_data)
    with_hr = sum(1 for d in all_data if d["hreflangs"])
    stats["hreflang"] = {
        "pages_with": with_hr,
        "pages_without": total - with_hr,
        "distribution": dict(hreflang_counts.most_common()),
        "total_clusters": sum(1 for d in all_data if len(d["hreflangs"]) >= 3),
    }

    # ── Open Graph ──
    og_fields = Counter()
    for d in all_data:
        for k in d["open_graph"]:
            og_fields[k] += 1
    with_og = sum(1 for d in all_data if d["open_graph"])
    stats["open_graph"] = {
        "pages_with": with_og,
        "pages_without": total - with_og,
        "fields_used": dict(og_fields.most_common()),
    }

    # ── Twitter ──
    tw_fields = Counter()
    for d in all_data:
        for k in d["twitter"]:
            tw_fields[k] += 1
    with_tw = sum(1 for d in all_data if d["twitter"])
    stats["twitter"] = {"pages_with": with_tw, "fields_used": dict(tw_fields.most_common())}

    # ── Schema ──
    schema_types = Counter()
    for d in all_data:
        for s in d["schemas"]:
            schema_types[s] += 1
    with_schema = sum(1 for d in all_data if d["schemas"])
    stats["schema"] = {"pages_with": with_schema, "types": dict(schema_types.most_common())}

    # ── Viewport ──
    with_vp = sum(1 for d in all_data if d["meta_viewport"])
    stats["viewport"] = {"with": with_vp, "without": total - with_vp}

    # ── Charset ──
    with_ch = sum(1 for d in all_data if d["charset"])
    stats["charset"] = {"with": with_ch, "without": total - with_ch}

    # ── Preload / Preconnect / DNS ──
    stats["preloads"] = {"pages_with": sum(1 for d in all_data if d["preloads"])}
    stats["preconnects"] = {"pages_with": sum(1 for d in all_data if d["preconnects"])}
    stats["dns_prefetch"] = {"pages_with": sum(1 for d in all_data if d["dns_prefetch"])}

    # ── Scripts (defer/async) ──
    defer_count = sum(1 for d in all_data for s in d["scripts"] if s.get("defer"))
    async_count = sum(1 for d in all_data for s in d["scripts"] if s.get("async"))
    stats["scripts"] = {"defer_uses": defer_count, "async_uses": async_count}

    # ── SEO Score por página ──
    seo_scores = []
    for d in all_data:
        score = 0
        if d["title"]: score += 1
        if d["meta_description"]: score += 1
        if d["canonical"]: score += 1
        if d["hreflangs"]: score += 1
        if d["open_graph"]: score += 1
        if d["twitter"]: score += 1
        if d["schemas"]: score += 1
        if d["meta_viewport"]: score += 1
        if d["charset"]: score += 1
        seo_scores.append((d["file"], score, d["language"]))
    stats["seo_scores"] = seo_scores
    stats["seo_complete"] = sum(1 for _, s, _ in seo_scores if s >= 8)
    stats["seo_incomplete"] = sum(1 for _, s, _ in seo_scores if s < 5)

    # ── Multilíngue ──
    name_groups = defaultdict(list)
    for d in all_data:
        name_groups[d["name"]].append({"file": d["file"], "lang": d["language"], "canonical": d["canonical"]})
    multi = {name: items for name, items in name_groups.items() if len(items) >= 2}
    stats["multilingual"] = multi
    stats["multilingual_count"] = len(multi)

    # ── Idiomas tabela ──
    lang_table = {}
    for lang in sorted(by_lang.keys()):
        lang_pages = [d for d in all_data if d["language"] == lang]
        lang_table[lang] = {
            "pages": len(lang_pages),
            "with_title": sum(1 for d in lang_pages if d["title"]),
            "with_desc": sum(1 for d in lang_pages if d["meta_description"]),
            "with_canonical": sum(1 for d in lang_pages if d["canonical"]),
            "with_hreflang": sum(1 for d in lang_pages if d["hreflangs"]),
        }
    stats["language_table"] = lang_table

    return stats


def _find_duplicates(items: List[Tuple[str, str]]) -> List[Tuple[str, List[str]]]:
    """Encontra títulos/descrições duplicadas."""
    groups = defaultdict(list)
    for file, value in items:
        if value:
            groups[value.lower().strip()].append(file)
    return [(val, files) for val, files in groups.items() if len(files) > 1]


# ═══════════════════════════════════════════════════════════════════
# REPORTERS
# ═══════════════════════════════════════════════════════════════════

def generate_txt(all_data: List[Dict], stats: Dict) -> str:
    L = []
    h, s = "=" * 72, "-" * 72

    L.append(h)
    L.append("  CATÁLOGO SEO DO PROJETO")
    L.append("  Calculadoras de Enfermagem")
    L.append(h)
    L.append("")

    # 1. Resumo
    _section(L, "1. RESUMO GERAL")
    L.append(f"  Total de HTMLs: {stats['total']:,}")
    L.append(f"  Idiomas: {stats['languages_found']}")
    for lang, count in stats["by_language"].items():
        L.append(f"    {lang}: {count:,}")
    L.append(f"  Multilíngues: {stats['multilingual_count']} clusters")
    L.append("")

    # 2. Title
    _section(L, "2. TITLE")
    t = stats["title"]
    L.append(f"  Com title: {t['total_with']:,}")
    L.append(f"  Sem title: {t['missing_count']}  {', '.join(t['missing'][:10])}")
    L.append(f"  Muito curtos (<30): {t['too_short_count']}")
    L.append(f"  Muito longos (>60): {t['too_long_count']}")
    L.append(f"  Comprimento médio: {t['avg_length']} caracteres")
    if t["duplicates"]:
        L.append(f"  Duplicados: {len(t['duplicates'])} grupos")
        for val, files in t["duplicates"][:5]:
            L.append(f"    '{val[:60]}' → {len(files)}x")
    L.append("")

    # 3. Description
    _section(L, "3. META DESCRIPTION")
    d = stats["description"]
    L.append(f"  Com description: {d['total_with']:,}")
    L.append(f"  Sem description: {d['missing_count']}")
    L.append(f"  Muito curtas (<70): {len(d['too_short'])}")
    L.append(f"  Muito longas (>160): {len(d['too_long'])}")
    L.append(f"  Comprimento médio: {d['avg_length']} caracteres")
    L.append("")

    # 4. Keywords
    _section(L, "4. META KEYWORDS")
    kw = stats["keywords"]
    L.append(f"  Com keywords: {kw['with_keywords']:,}")
    L.append(f"  Sem keywords: {kw['without']:,}")
    L.append("")

    # 5. Robots
    _section(L, "5. META ROBOTS")
    for robot, count in stats["robots"].items():
        L.append(f"  {robot}: {count:,}")
    L.append("")

    # 6. Canonical
    _section(L, "6. CANONICAL")
    c = stats["canonical"]
    L.append(f"  Com canonical: {c['total_with']:,}")
    L.append(f"  Sem canonical: {c['missing_count']}")
    L.append("")

    # 7. Hreflang
    _section(L, "7. HREFLANG")
    hr = stats["hreflang"]
    L.append(f"  Páginas com hreflang: {hr['pages_with']:,}")
    L.append(f"  Páginas sem hreflang: {hr['pages_without']:,}")
    L.append(f"  Clusters completos (3+): {hr['total_clusters']}")
    L.append("")

    # 8. Open Graph
    _section(L, "8. OPEN GRAPH")
    og = stats["open_graph"]
    L.append(f"  Páginas com OG: {og['pages_with']:,}")
    for field, count in og["fields_used"].items():
        L.append(f"    og:{field}: {count:,}")
    L.append("")

    # 9. Twitter
    _section(L, "9. TWITTER CARDS")
    tw = stats["twitter"]
    L.append(f"  Páginas com Twitter Card: {tw['pages_with']:,}")
    for field, count in tw["fields_used"].items():
        L.append(f"    twitter:{field}: {count:,}")
    L.append("")

    # 10-12
    _section(L, "10. VIEWPORT"); L.append(f"  Com viewport: {stats['viewport']['with']:,}"); L.append("")
    _section(L, "11. CHARSET"); L.append(f"  Com charset: {stats['charset']['with']:,}"); L.append("")
    _section(L, "12. META THEME-COLOR")
    with_theme = sum(1 for d in all_data if d["meta_theme_color"])
    L.append(f"  Com theme-color: {with_theme:,}"); L.append("")

    # 13. Schema
    _section(L, "13. SCHEMA.ORG")
    sc = stats["schema"]
    L.append(f"  Páginas com schema: {sc['pages_with']:,}")
    for stype, count in sc["types"].items():
        L.append(f"    {stype}: {count:,}")
    L.append("")

    # 14-17
    _section(L, "14. FAVICON")
    with_fav = sum(1 for d in all_data if d["favicon"])
    L.append(f"  Com favicon: {with_fav:,}"); L.append("")
    _section(L, "15. PRELOAD"); L.append(f"  Páginas com preload: {stats['preloads']['pages_with']:,}"); L.append("")
    _section(L, "16. PRECONNECT"); L.append(f"  Páginas com preconnect: {stats['preconnects']['pages_with']:,}"); L.append("")
    _section(L, "17. DNS-PREFETCH"); L.append(f"  Páginas com dns-prefetch: {stats['dns_prefetch']['pages_with']:,}"); L.append("")

    # 18-19
    _section(L, "18. CSS")
    css_count = Counter()
    for d in all_data:
        for css in d["css_files"]:
            css_count[css] += 1
    for css, count in css_count.most_common(10):
        L.append(f"  {count:>5}x  {css}")
    L.append("")

    _section(L, "19. JAVASCRIPT")
    js_count = Counter()
    for d in all_data:
        for s in d["scripts"]:
            js_count[s["src"]] += 1
    for js, count in js_count.most_common(15):
        L.append(f"  {count:>5}x  {js}")
    L.append("")

    # 20. Fontes
    _section(L, "20. FONTES")
    font_count = Counter()
    for d in all_data:
        for f in d["fonts_used"]:
            font_count[f] += 1
    for f, count in font_count.most_common(10):
        L.append(f"  {count:>5}x  {f}")
    L.append("")

    # 21. Imagens SEO
    _section(L, "21. IMAGENS SEO")
    with_og_img = sum(1 for d in all_data if d["images_og"])
    L.append(f"  Com og:image: {with_og_img:,}")
    total_imgs = sum(d["img_count"] for d in all_data)
    total_alts = sum(d["img_with_alt"] for d in all_data)
    L.append(f"  Total <img>: {total_imgs:,}")
    L.append(f"  Com alt: {total_alts:,} ({(total_alts/max(1,total_imgs)*100):.1f}%)")
    L.append("")

    # 22. Links
    _section(L, "22. LINKS")
    total_int = sum(len(d["links_internal"]) for d in all_data)
    total_ext = sum(len(d["links_external"]) for d in all_data)
    L.append(f"  Links internos: {total_int:,}")
    L.append(f"  Links externos: {total_ext:,}")
    L.append("")

    # 23. Idiomas tabela
    _section(L, "23. TABELA POR IDIOMA")
    L.append(f"  {'Idioma':<8} {'Páginas':>8} {'Title':>6} {'Desc':>6} {'Canon':>6} {'Hrefl':>6}")
    for lang, data in stats["language_table"].items():
        L.append(f"  {lang:<8} {data['pages']:>8} {data['with_title']:>6} {data['with_desc']:>6} {data['with_canonical']:>6} {data['with_hreflang']:>6}")
    L.append("")

    # 24. CWV
    _section(L, "24. CORE WEB VITALS (ESTRUTURAL)")
    L.append(f"  Scripts com defer: {stats['scripts']['defer_uses']}")
    L.append(f"  Scripts com async: {stats['scripts']['async_uses']}")
    L.append(f"  Páginas com preload: {stats['preloads']['pages_with']:,}")
    L.append("")

    # 25. SEO Técnico
    _section(L, "25. SEO TÉCNICO")
    L.append(f"  Robots configurados: {len(stats['robots'])} variações")
    L.append(f"  Com viewport: {stats['viewport']['with']:,}")
    L.append(f"  Com charset: {stats['charset']['with']:,}")
    L.append("")

    # 26. Multilíngue
    _section(L, "26. AGRUPAMENTO MULTILÍNGUE")
    L.append(f"  Total de clusters: {stats['multilingual_count']}")
    for name, items in sorted(stats["multilingual"].items())[:20]:
        langs = ", ".join(i["lang"] for i in items)
        L.append(f"  {name:<45} [{langs}]")
    L.append("")

    # 27. Ficha por página (amostra)
    _section(L, "27. FICHA POR PÁGINA (AMOSTRA)")
    for d in all_data[:30]:
        L.append(f"  {d['file']}")
        L.append(f"    Title: {d['title'] or 'AUSENTE'}")
        L.append(f"    Desc:  {d['meta_description'] or 'AUSENTE'}")
        L.append(f"    Canon: {d['canonical'] or 'AUSENTE'}")
        L.append(f"    Lang:  {d['language']} | Schemas: {len(d['schemas'])} | OG: {len(d['open_graph'])} | TW: {len(d['twitter'])}")
        L.append("")

    # 28-29
    _section(L, "28. ESTATÍSTICAS")
    scores = stats["seo_scores"]
    avg = sum(s for _, s, _ in scores) // max(1, len(scores))
    L.append(f"  Score SEO médio: {avg}/9")
    L.append(f"  SEO completo (8+): {stats['seo_complete']:,}")
    L.append(f"  SEO insuficiente (<5): {stats['seo_incomplete']:,}")
    L.append("")

    _section(L, "29. RESUMO EXECUTIVO")
    L.append(f"  Total de páginas....... {stats['total']:,}")
    L.append(f"  Idiomas................ {stats['languages_found']}")
    L.append(f"  Com title.............. {stats['title']['total_with']:,}")
    L.append(f"  Com description........ {stats['description']['total_with']:,}")
    L.append(f"  Com canonical.......... {stats['canonical']['total_with']:,}")
    L.append(f"  Com schema............. {stats['schema']['pages_with']:,}")
    L.append(f"  Com Open Graph......... {stats['open_graph']['pages_with']:,}")
    L.append(f"  Com Twitter Card....... {stats['twitter']['pages_with']:,}")
    L.append(f"  SEO completo (8/9)..... {stats['seo_complete']:,}")
    L.append(f"  Com problemas.......... {stats['seo_incomplete']:,}")
    L.append("")

    L.append(h)
    L.append("  Fim do catálogo. SEO Catalog Engine v1.0")
    L.append(h)
    return "\n".join(L)


def _section(L, title):
    L.append("-" * 72)
    L.append(f"  {title}")
    L.append("-" * 72)


def generate_md(all_data: List[Dict], stats: Dict) -> str:
    L = []
    t, d, c = stats["title"], stats["description"], stats["canonical"]
    og, tw, sc = stats["open_graph"], stats["twitter"], stats["schema"]

    L.append("# 🔍 Catálogo SEO do Projeto")
    L.append("")
    L.append(f"**Total de páginas:** {stats['total']:,} | **Idiomas:** {stats['languages_found']}")
    L.append("")

    # Resumo
    L.append("## 📊 Resumo Geral")
    L.append("")
    L.append("| Idioma | Páginas |")
    L.append("|---|---|")
    for lang, count in stats["by_language"].items():
        L.append(f"| {lang} | {count:,} |")
    L.append("")

    # Title
    L.append("## 📝 Title")
    L.append(f"- **Com title:** {t['total_with']:,}")
    L.append(f"- **Sem title:** {t['missing_count']}")
    L.append(f"- **Muito curtos:** {t['too_short_count']} | **Muito longos:** {t['too_long_count']}")
    L.append(f"- **Comprimento médio:** {t['avg_length']} caracteres")
    L.append("")

    # Description
    L.append("## 📄 Meta Description")
    L.append(f"- **Com description:** {d['total_with']:,} | **Sem:** {d['missing_count']}")
    L.append(f"- **Comprimento médio:** {d['avg_length']} caracteres")
    L.append("")

    # Keywords
    L.append("## 🔑 Meta Keywords")
    L.append(f"- **Com:** {stats['keywords']['with_keywords']:,} | **Sem:** {stats['keywords']['without']:,}")
    L.append("")

    # Canonical
    L.append("## 🔗 Canonical")
    L.append(f"- **Com:** {c['total_with']:,} | **Sem:** {c['missing_count']}")
    L.append("")

    # Hreflang
    L.append("## 🌐 Hreflang")
    hr = stats["hreflang"]
    L.append(f"- **Com hreflang:** {hr['pages_with']:,} | **Sem:** {hr['pages_without']:,}")
    L.append(f"- **Clusters completos:** {hr['total_clusters']}")
    L.append("")

    # OG + Twitter
    L.append("## 📢 Open Graph & Twitter")
    L.append(f"- **OG:** {og['pages_with']:,} páginas | **Twitter:** {tw['pages_with']:,} páginas")
    L.append("")

    # Schema
    L.append("## 📋 Schema.org")
    L.append(f"- **Com schema:** {sc['pages_with']:,}")
    for st, cnt in sc["types"].items():
        L.append(f"  - {st}: {cnt}x")
    L.append("")

    # Tabela idiomas
    L.append("## 🌍 Tabela por Idioma")
    L.append("")
    L.append("| Idioma | Páginas | Title | Desc | Canon | Hrefl |")
    L.append("|---|---|---|---|---|---|")
    for lang, data in stats["language_table"].items():
        L.append(f"| {lang} | {data['pages']} | {data['with_title']} | {data['with_desc']} | {data['with_canonical']} | {data['with_hreflang']} |")
    L.append("")

    # SEO Score
    L.append("## 📈 Score SEO")
    scores = stats["seo_scores"]
    avg = sum(s for _, s, _ in scores) // max(1, len(scores))
    L.append(f"- **Score médio:** {avg}/9")
    L.append(f"- **SEO completo:** {stats['seo_complete']:,} | **Insuficiente:** {stats['seo_incomplete']:,}")
    L.append("")

    # Resumo executivo
    L.append("## 📊 Resumo Executivo")
    L.append("")
    L.append("| Métrica | Valor |")
    L.append("|---|---|")
    L.append(f"| Páginas | **{stats['total']:,}** |")
    L.append(f"| Idiomas | **{stats['languages_found']}** |")
    L.append(f"| Com title | **{t['total_with']:,}** |")
    L.append(f"| Com description | **{d['total_with']:,}** |")
    L.append(f"| Com canonical | **{c['total_with']:,}** |")
    L.append(f"| Com schema | **{sc['pages_with']:,}** |")
    L.append(f"| Com Open Graph | **{og['pages_with']:,}** |")
    L.append(f"| Com Twitter Card | **{tw['pages_with']:,}** |")
    L.append(f"| SEO completo | **{stats['seo_complete']:,}** |")
    L.append(f"| Com problemas | **{stats['seo_incomplete']:,}** |")
    L.append("")
    L.append("---")
    L.append("*SEO Catalog Engine v1.0 — Apenas leitura*")

    return "\n".join(L)


# ═══════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════

def main():
    import time
    t0 = time.perf_counter()

    print("=" * 60)
    print("  SEO Catalog Engine")
    print("=" * 60)
    print()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Scan
    print("[1/3] Varrendo HTMLs...")
    html_files = scan_all_html()
    print(f"      {len(html_files)} HTMLs encontrados")

    # Parse
    print("[2/3] Analisando SEO de cada página...")
    all_data = []
    for fp in html_files:
        all_data.append(parse_html_seo(fp))
    print(f"      {len(all_data)} páginas analisadas")

    # Analyze
    print("[3/3] Computando estatísticas e gerando relatórios...")
    stats = analyze(all_data)

    TXT_OUT.write_text(generate_txt(all_data, stats), encoding="utf-8")
    MD_OUT.write_text(generate_md(all_data, stats), encoding="utf-8")

    print(f"  [OK] {TXT_OUT}")
    print(f"  [OK] {MD_OUT}")
    print(f"  Tempo total: {time.perf_counter() - t0:.2f}s")
    print()
    print(f"  Páginas: {stats['total']:,} | Idiomas: {stats['languages_found']}")
    print(f"  SEO completo: {stats['seo_complete']:,} | Insuficiente: {stats['seo_incomplete']:,}")
    print("=" * 60)


if __name__ == "__main__":
    main()
