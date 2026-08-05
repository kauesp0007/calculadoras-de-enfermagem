"""Parser HTML + Tailwind — Análise de componentes e classes."""

import re
from pathlib import Path
from collections import defaultdict
from typing import Dict, List


def parse_html_for_components(html_files: List[Path]) -> Dict:
    """Analisa arquivos HTML para detectar componentes e classes Tailwind.

    Returns:
        Dicionário com: tailwind_classes, components, layouts, buttons, etc.
    """
    all_tw_classes = defaultdict(int)      # classe -> contagem
    components_found = defaultdict(list)    # tipo -> [arquivos]
    buttons = []
    cards = []
    heros = []
    inputs_found = []
    modals = []
    breadcrumbs = []
    tables = []
    icons_used = set()
    layouts = set()
    selectors_custom = defaultdict(int)

    for html_file in html_files:
        try:
            content = html_file.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue

        rel = str(html_file.relative_to(Path(__file__).resolve().parent.parent.parent.parent))

        # Classes Tailwind (class="...")
        for m in re.finditer(r'class=["\']([^"\']+)["\']', content):
            classes = m.group(1).split()
            for cls in classes:
                if cls and not cls.startswith("{"):  # ignora templates
                    all_tw_classes[cls] += 1

        # Classes CSS customizadas (className, id-based)
        for m in re.finditer(r'class=["\']([^"\']+)["\']', content):
            for cls in m.group(1).split():
                if cls.startswith(".") or cls.startswith("#"):
                    selectors_custom[cls] += 1

        # ── Detecção de componentes ──────────────────────────────

        # Hero sections
        if _has_hero(content):
            heros.append(rel)
            components_found["Hero"].append(rel)

        # Cards
        card_count = len(re.findall(r'class=["\'][^"\']*\b(?:card|rounded-2xl\s+shadow|shadow-xl\s+border)', content))
        if card_count:
            cards.append({"file": rel, "count": card_count})
            components_found["Cards"].append(rel)

        # Botões
        btn_matches = re.findall(r'<(?:button|a)[^>]*class=["\'][^"\']*\b(?:btn|button)[^"\']*["\']', content)
        if btn_matches:
            for btn in btn_matches:
                cls_match = re.search(r'class=["\']([^"\']+)["\']', btn)
                buttons.append({"file": rel, "classes": cls_match.group(1) if cls_match else ""})
            components_found["Botões"].append(rel)

        # Inputs
        input_count = len(re.findall(r'<input[^>]*>', content))
        select_count = len(re.findall(r'<select[^>]*>', content))
        if input_count or select_count:
            inputs_found.append({"file": rel, "inputs": input_count, "selects": select_count})

        # Modais
        if re.search(r'(?:modal|popup|overlay|dialog)', content, re.I):
            modals.append(rel)
            components_found["Modais"].append(rel)

        # Breadcrumbs
        if re.search(r'(?:breadcrumb|aria-label=["\'](?:Breadcrumb|breadcrumb))', content):
            breadcrumbs.append(rel)
            components_found["Breadcrumb"].append(rel)

        # Tabelas
        table_count = len(re.findall(r'<table[^>]*>', content))
        if table_count:
            tables.append({"file": rel, "count": table_count})
            components_found["Tabelas"].append(rel)

        # Ícones SVG inline
        svg_icons = set(re.findall(r'<svg[^>]*>.*?</svg>', content, re.DOTALL))
        for svg in svg_icons:
            path_hint = re.search(r'viewBox="([^"]*)"', svg)
            if path_hint:
                icons_used.add(f"SVG viewBox={path_hint.group(1)}")
        icons_used.update(re.findall(r'class=["\'][^"\']*\b(?:fa[srb]-|fas\s|far\s|fab\s)', content))

        # Layouts
        if "grid" in content:
            layouts.add("CSS Grid")
        if "flex" in content:
            layouts.add("Flexbox")
        if "sticky" in content:
            layouts.add("Sticky")

    # Top classes Tailwind
    top_tailwind = sorted(all_tw_classes.items(), key=lambda x: x[1], reverse=True)[:100]

    # Agrupar por categoria Tailwind
    tw_by_category = _categorize_tailwind(all_tw_classes)

    return {
        "tailwind_classes": {
            "total_unique": len(all_tw_classes),
            "total_uses": sum(all_tw_classes.values()),
            "top_100": [{"class": c, "count": n} for c, n in top_tailwind],
            "by_category": tw_by_category,
        },
        "components": {
            "heros": heros,
            "total_heros": len(heros),
            "cards": cards,
            "total_cards": len(cards),
            "buttons": buttons[:30],
            "total_buttons": len(buttons),
            "inputs": inputs_found[:20],
            "modals": modals,
            "total_modals": len(modals),
            "breadcrumbs": breadcrumbs,
            "total_breadcrumbs": len(breadcrumbs),
            "tables": tables[:10],
            "total_tables": len(tables),
        },
        "components_summary": {k: len(v) for k, v in components_found.items()},
        "layouts_detected": sorted(layouts),
        "icons_inline_count": len(icons_used),
        "custom_selectors": len(selectors_custom),
    }


def _has_hero(content: str) -> bool:
    """Detecta se a página tem uma hero section."""
    patterns = [
        r'class=["\'][^"\']*\bhero[^"\']*["\']',
        r'bg-gradient-to-br\s+from-\[#1A3E74\]',
        r'class=["\'][^"\']*\bmeem-card-navy\b',
        r'class=["\'][^"\']*\bfugulin-card-navy\b',
        r'class=["\'][^"\']*\blogin-card-navy\b',
    ]
    return any(re.search(p, content) for p in patterns)


def _categorize_tailwind(classes: Dict) -> Dict:
    """Agrupa classes Tailwind por categoria."""
    categories = defaultdict(int)

    prefixes = {
        "Layout": ["container", "grid", "flex", "block", "inline", "hidden", "relative",
                    "absolute", "fixed", "sticky", "z-", "overflow"],
        "Espaçamento": ["p-", "m-", "gap-", "space-", "px-", "py-", "pt-", "pb-", "pl-", "pr-",
                        "mx-", "my-", "mt-", "mb-", "ml-", "mr-"],
        "Tipografia": ["text-", "font-", "leading-", "tracking-", "uppercase", "lowercase",
                       "capitalize", "truncate", "whitespace"],
        "Cores": ["bg-", "text-", "border-", "ring-", "from-", "to-", "via-"],
        "Bordas": ["rounded", "border-", "outline-", "ring-", "divide-"],
        "Sombras": ["shadow", "drop-shadow"],
        "Tamanhos": ["w-", "h-", "max-w-", "max-h-", "min-w-", "min-h-", "size-"],
        "Flexbox": ["flex-", "justify-", "items-", "content-", "self-", "order-"],
        "Grid": ["grid-", "col-", "row-", "gap-"],
        "Efeitos": ["opacity-", "blur-", "brightness-", "contrast-", "grayscale", "backdrop-",
                    "transition", "duration-", "ease-", "transform", "scale-", "rotate-", "translate-"],
        "Responsivo": ["sm:", "md:", "lg:", "xl:", "2xl:"],
        "Estados": ["hover:", "focus:", "active:", "disabled:", "group-hover:", "focus-within:"],
    }

    for cls, count in classes.items():
        for cat, prefixes_list in prefixes.items():
            for prefix in prefixes_list:
                if cls.startswith(prefix) or cls == prefix:
                    categories[cat] += count
                    break

    return dict(sorted(categories.items(), key=lambda x: x[1], reverse=True))
