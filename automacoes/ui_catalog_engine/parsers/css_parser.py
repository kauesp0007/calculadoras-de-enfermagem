"""Parser CSS — Extrai cores, fontes, tipografia, espaçamentos e animações."""

import re
from collections import defaultdict
from typing import Dict, List, Set


def parse_css_files(css_files: List) -> Dict:
    """Analisa arquivos CSS e extrai todo o Design System.

    Returns:
        Dicionário com: colors, fonts, typography, spacing,
        borders, shadows, animations, breakpoints, icons.
    """
    all_css = ""
    for css_file in css_files:
        try:
            content = css_file.read_text(encoding="utf-8", errors="replace")
            all_css += content + "\n"
        except Exception:
            pass

    return {
        "colors": _extract_colors(all_css),
        "css_variables": _extract_css_variables(all_css),
        "fonts": _extract_fonts(all_css),
        "typography": _extract_typography(all_css),
        "spacing": _extract_spacing(all_css),
        "borders": _extract_borders(all_css),
        "shadows": _extract_shadows(all_css),
        "animations": _extract_animations(all_css),
        "breakpoints": _extract_breakpoints(all_css),
        "icons": _extract_icons(all_css),
    }


# ═══════════════════════════════════════════════════════════════════
# CORES
# ═══════════════════════════════════════════════════════════════════

def _extract_colors(css: str) -> Dict:
    """Extrai todas as cores do CSS."""
    colors = defaultdict(lambda: {"count": 0, "categories": set(), "examples": []})

    # HEX (#RGB, #RRGGBB, #RRGGBBAA)
    for m in re.finditer(r'#([0-9a-fA-F]{3,8})\b', css):
        hex_val = f"#{m.group(1)}"
        if len(hex_val) in (4, 7, 9):  # #RGB, #RRGGBB, #RRGGBBAA
            colors[hex_val.upper()]["count"] += 1

    # RGB / RGBA
    for m in re.finditer(r'rgba?\s*\(([^)]+)\)', css):
        colors[f"rgb({m.group(1)})"]["count"] += 1

    # HSL / HSLA
    for m in re.finditer(r'hsla?\s*\(([^)]+)\)', css):
        colors[f"hsl({m.group(1)})"]["count"] += 1

    # Categorizar por contexto
    for hex_val, data in list(colors.items())[:100]:
        context = _find_color_context(css, hex_val)
        if context:
            data["examples"].append(context[:80])
        data["categories"] = _categorize_color(hex_val, context or "")

    # Ordenar por frequência
    sorted_colors = sorted(colors.items(), key=lambda x: x[1]["count"], reverse=True)

    return {
        "total_unique": len(colors),
        "top_colors": [
            {"color": c, "count": d["count"], "cats": sorted(d["categories"]),
             "example": d["examples"][0] if d["examples"] else ""}
            for c, d in sorted_colors[:50]
        ],
        "by_category": _group_by_category(colors),
    }


def _find_color_context(css: str, color: str) -> str:
    """Encontra o contexto onde a cor é usada."""
    idx = css.find(color)
    if idx < 0:
        return ""
    start = max(0, idx - 120)
    end = min(len(css), idx + len(color) + 80)
    snippet = css[start:end]
    # Encontra o seletor mais próximo
    selector_match = re.search(r'([.#][\w-]+(?:\s+[.#][\w-]+)*)\s*\{[^}]*' + re.escape(color), snippet)
    if selector_match:
        return selector_match.group(1).strip()
    return snippet[:80].strip().replace("\n", " ")


def _categorize_color(color: str, context: str) -> Set[str]:
    """Categoriza uma cor baseada no contexto."""
    cats = set()
    cl = (color + context).lower()

    if "navy" in cl or "#1a3e74" in cl or "#1e4d8c" in cl or "#163269" in cl:
        cats.add("Primária")
    if "green" in cl or "#16a34a" in cl or "success" in cl:
        cats.add("Sucesso")
    if "red" in cl or "#e11d48" in cl or "error" in cl or "danger" in cl:
        cats.add("Erro")
    if "amber" in cl or "#d97706" in cl or "warning" in cl:
        cats.add("Aviso")
    if "blue" in cl and "navy" not in cl:
        cats.add("Informação")
    if "slate" in cl or "gray" in cl or "grey" in cl:
        cats.add("Neutra")
    if "white" in cl or "#fff" in cl or "#ffffff" in cl:
        cats.add("Fundo")
    if "text" in context.lower():
        cats.add("Texto")
    if "bg" in context.lower() or "background" in context.lower():
        cats.add("Fundo")
    if "border" in context.lower():
        cats.add("Borda")
    if "shadow" in context.lower() or "box-shadow" in context.lower():
        cats.add("Sombra")
    if not cats:
        cats.add("Outros")
    return cats


def _group_by_category(colors: Dict) -> Dict:
    """Agrupa cores por categoria."""
    groups = defaultdict(list)
    for color, data in colors.items():
        for cat in data["categories"]:
            groups[cat].append({"color": color, "count": data["count"]})
    return {k: sorted(v, key=lambda x: x["count"], reverse=True)[:10] for k, v in groups.items()}


# ═══════════════════════════════════════════════════════════════════
# VARIÁVEIS CSS
# ═══════════════════════════════════════════════════════════════════

def _extract_css_variables(css: str) -> List[Dict]:
    """Extrai variáveis CSS (--nome)."""
    vars_found = {}
    for m in re.finditer(r'(--[\w-]+)\s*:\s*([^;]+);', css):
        name, value = m.group(1), m.group(2).strip()
        if name not in vars_found:
            vars_found[name] = value

    return sorted([{"name": k, "value": v} for k, v in vars_found.items()],
                  key=lambda x: x["name"])


# ═══════════════════════════════════════════════════════════════════
# FONTES
# ═══════════════════════════════════════════════════════════════════

def _extract_fonts(css: str) -> Dict:
    """Extrai todas as fontes e suas configurações."""
    font_families = set()
    font_faces = []
    font_files = []

    # @font-face
    for m in re.finditer(r'@font-face\s*\{([^}]+)\}', css):
        block = m.group(1)
        family = re.search(r"font-family:\s*['\"]?([^'\";}]+)['\"]?", block)
        weight = re.search(r"font-weight:\s*(\d+)", block)
        style = re.search(r"font-style:\s*(\w+)", block)
        display = re.search(r"font-display:\s*(\w+)", block)
        src = re.search(r"src:\s*url\(['\"]?([^'\")\s]+)['\"]?\)", block)

        font_faces.append({
            "family": family.group(1).strip() if family else "?",
            "weight": weight.group(1) if weight else "400",
            "style": style.group(1) if style else "normal",
            "display": display.group(1) if display else "swap",
            "file": src.group(1) if src else "",
        })
        if family:
            font_families.add(family.group(1).strip().strip("'").strip('"'))
        if src:
            font_files.append(src.group(1))

    # font-family em regras normais
    for m in re.finditer(r"font-family:\s*['\"]?([^'\"\}]+)['\"]?", css):
        fam = m.group(1).strip().split(",")[0].strip().strip("'").strip('"')
        if fam and "sans" not in fam.lower() and "serif" not in fam.lower() and "mono" not in fam.lower():
            font_families.add(fam)

    # Pesos utilizados
    weights_used = set()
    for m in re.finditer(r"font-weight:\s*(\d+)", css):
        weights_used.add(int(m.group(1)))

    # Tamanhos
    sizes = set()
    for m in re.finditer(r"font-size:\s*([^;]+);", css):
        sizes.add(m.group(1).strip())

    return {
        "families": sorted(font_families),
        "total_families": len(font_families),
        "font_faces": font_faces,
        "font_files": sorted(set(font_files)),
        "weights_used": sorted(weights_used),
        "sizes_used": sorted(sizes),
    }


# ═══════════════════════════════════════════════════════════════════
# TIPOGRAFIA
# ═══════════════════════════════════════════════════════════════════

def _extract_typography(css: str) -> Dict:
    """Analisa hierarquia tipográfica."""
    headings = {}
    for i in range(1, 7):
        patterns = []
        # Procura estilos para h1-h6
        for m in re.finditer(rf'h{i}\s*{{([^}}]+)}}', css):
            patterns.append(m.group(1).strip())
        headings[f"h{i}"] = patterns

    # Line-heights
    line_heights = set()
    for m in re.finditer(r"line-height:\s*([^;]+);", css):
        line_heights.add(m.group(1).strip())

    # Letter-spacing
    letter_spacings = set()
    for m in re.finditer(r"letter-spacing:\s*([^;]+);", css):
        letter_spacings.add(m.group(1).strip())

    # Text transforms
    text_transforms = set()
    for m in re.finditer(r"text-transform:\s*(\w+)", css):
        text_transforms.add(m.group(1))

    return {
        "headings": headings,
        "line_heights": sorted(line_heights),
        "letter_spacings": sorted(letter_spacings),
        "text_transforms": sorted(text_transforms),
    }


# ═══════════════════════════════════════════════════════════════════
# ESPAÇAMENTOS
# ═══════════════════════════════════════════════════════════════════

def _extract_spacing(css: str) -> Dict:
    """Analisa padrões de espaçamento."""
    margins = set()
    paddings = set()
    gaps = set()

    for m in re.finditer(r"margin[^:]*:\s*([^;]+);", css):
        margins.add(m.group(1).strip())
    for m in re.finditer(r"padding[^:]*:\s*([^;]+);", css):
        paddings.add(m.group(1).strip())
    for m in re.finditer(r"gap:\s*([^;]+);", css):
        gaps.add(m.group(1).strip())

    return {
        "margins": sorted(margins),
        "paddings": sorted(paddings),
        "gaps": sorted(gaps),
    }


# ═══════════════════════════════════════════════════════════════════
# BORDAS E SOMBRAS
# ═══════════════════════════════════════════════════════════════════

def _extract_borders(css: str) -> Dict:
    """Analisa bordas."""
    radii = set()
    borders = set()

    for m in re.finditer(r"border-radius:\s*([^;]+);", css):
        radii.add(m.group(1).strip())
    for m in re.finditer(r"border[^r][^:]*:\s*([^;]+);", css):
        borders.add(m.group(1).strip())

    return {
        "radius_values": sorted(radii),
        "border_styles": sorted(borders)[:20],
    }


def _extract_shadows(css: str) -> Dict:
    """Analisa sombras."""
    shadows = []
    for m in re.finditer(r"(?:box-)?shadow:\s*([^;]+);", css):
        shadow_val = m.group(1).strip()
        shadows.append(shadow_val)

    # Conta ocorrências
    shadow_counts = defaultdict(int)
    for s in shadows:
        shadow_counts[s] += 1

    return {
        "unique_shadows": len(shadow_counts),
        "top_shadows": sorted(shadow_counts.items(), key=lambda x: x[1], reverse=True)[:15],
    }


# ═══════════════════════════════════════════════════════════════════
# ANIMAÇÕES
# ═══════════════════════════════════════════════════════════════════

def _extract_animations(css: str) -> Dict:
    """Analisa animações e transições."""
    transitions = set()
    animations = set()
    transforms = set()

    for m in re.finditer(r"transition:\s*([^;]+);", css):
        transitions.add(m.group(1).strip())
    for m in re.finditer(r"animation:\s*([^;]+);", css):
        animations.add(m.group(1).strip())
    for m in re.finditer(r"transform:\s*([^;]+);", css):
        transforms.add(m.group(1).strip())

    # @keyframes
    keyframe_count = len(re.findall(r'@keyframes\s+([\w-]+)', css))

    return {
        "transitions": sorted(transitions),
        "animations": sorted(animations),
        "transforms": sorted(transforms),
        "keyframe_animations": keyframe_count,
    }


# ═══════════════════════════════════════════════════════════════════
# BREAKPOINTS
# ═══════════════════════════════════════════════════════════════════

def _extract_breakpoints(css: str) -> Dict:
    """Extrai breakpoints de media queries."""
    breakpoints = set()
    for m in re.finditer(r'@media\s*\(([^)]+)\)', css):
        condition = m.group(1)
        # Extrai valores de width
        width_match = re.search(r'(?:min|max)-width:\s*(\d+)px', condition)
        if width_match:
            breakpoints.add(f"{'min' if 'min' in condition else 'max'}-width: {width_match.group(1)}px")
        else:
            breakpoints.add(condition[:60])

    return {
        "total_media_queries": len(re.findall(r'@media', css)),
        "breakpoints_found": sorted(breakpoints),
    }


# ═══════════════════════════════════════════════════════════════════
# ÍCONES
# ═══════════════════════════════════════════════════════════════════

def _extract_icons(css: str) -> Dict:
    """Detecta bibliotecas de ícones."""
    libraries = []

    if "FontAwesome" in css or "fa-" in css or "fontawesome" in css.lower():
        libraries.append("FontAwesome")
    if "bootstrap" in css.lower() and "icon" in css.lower():
        libraries.append("Bootstrap Icons")
    if "material-icon" in css.lower():
        libraries.append("Material Icons")

    # Contagem de SVGs
    svg_in_css = len(re.findall(r'<svg[^>]*>', css))
    inline_svg_data = len(re.findall(r'data:image/svg\+xml', css))

    return {
        "libraries": libraries,
        "svg_inline_count": svg_in_css,
        "inline_data_uris": inline_svg_data,
    }
