"""Gerador de relatórios TXT — Design System."""

from typing import Dict


def generate_txt(css_data: Dict, html_data: Dict) -> str:
    """Gera o catálogo completo em formato texto."""
    L = []  # lines
    h = "=" * 72
    s = "-" * 72

    # ═══════════════════════════════════════════════════════════════
    L.append(h)
    L.append("  CATÁLOGO DO DESIGN SYSTEM")
    L.append("  Calculadoras de Enfermagem")
    L.append("  UI Catalog Engine v1.0")
    L.append(h)
    L.append("")

    # ── 1. PALETA DE CORES ──────────────────────────────────────
    L.append(s)
    L.append("  1. PALETA DE CORES")
    L.append(s)
    colors = css_data["colors"]
    L.append(f"  Total de cores únicas: {colors['total_unique']}")
    L.append("")

    L.append("  TOP 30 CORES MAIS UTILIZADAS:")
    for c in colors["top_colors"][:30]:
        cats = ", ".join(c["cats"]) if c["cats"] else "-"
        L.append(f"  {c['color']:<22} {c['count']:>6}x  [{cats}]")

    if colors.get("by_category"):
        L.append("")
        L.append("  POR CATEGORIA:")
        for cat, items in colors["by_category"].items():
            L.append(f"  [{cat}] ({len(items)} cores)")
            for item in items[:5]:
                L.append(f"    {item['color']:<22} {item['count']:>5}x")
    L.append("")

    # ── 2. VARIÁVEIS CSS ────────────────────────────────────────
    L.append(s)
    L.append(f"  2. VARIÁVEIS CSS ({len(css_data['css_variables'])} encontradas)")
    L.append(s)
    for v in css_data["css_variables"][:30]:
        val = v["value"][:60]
        L.append(f"  {v['name']:<35} = {val}")
    L.append("")

    # ── 3. FONTES ───────────────────────────────────────────────
    L.append(s)
    L.append("  3. FONTES E TIPOGRAFIA")
    L.append(s)
    fonts = css_data["fonts"]
    L.append(f"  Famílias: {', '.join(fonts['families'])}")
    L.append(f"  Pesos utilizados: {fonts['weights_used']}")
    L.append(f"  Arquivos de fonte: {len(fonts['font_files'])}")
    for ff in fonts["font_faces"][:10]:
        L.append(f"    {ff['family']} @ {ff['weight']} ({ff['file']})")
    L.append("")

    typo = css_data["typography"]
    L.append(f"  Line-heights: {typo['line_heights']}")
    L.append(f"  Letter-spacings: {typo['letter_spacings']}")
    L.append(f"  Text transforms: {typo['text_transforms']}")
    L.append("")

    # ── 4. ESPAÇAMENTOS ─────────────────────────────────────────
    L.append(s)
    L.append("  4. ESPAÇAMENTOS")
    L.append(s)
    sp = css_data["spacing"]
    L.append(f"  Margins únicos: {len(sp['margins'])}")
    for m in sp["margins"][:15]:
        L.append(f"    margin: {m}")
    L.append(f"  Paddings únicos: {len(sp['paddings'])}")
    for p in sp["paddings"][:15]:
        L.append(f"    padding: {p}")
    L.append(f"  Gaps: {sp['gaps']}")
    L.append("")

    # ── 5. BORDAS E SOMBRAS ────────────────────────────────────
    L.append(s)
    L.append("  5. BORDAS E SOMBRAS")
    L.append(s)
    borders = css_data["borders"]
    L.append(f"  Border-radius: {borders['radius_values']}")
    L.append(f"  Estilos de borda: {len(borders['border_styles'])}")
    shadows = css_data["shadows"]
    L.append(f"  Sombras únicas: {shadows['unique_shadows']}")
    for s, c in shadows["top_shadows"][:8]:
        L.append(f"  {c:>3}x  {s[:90]}")
    L.append("")

    # ── 6. ANIMAÇÕES ────────────────────────────────────────────
    L.append(s)
    L.append("  6. ANIMAÇÕES E TRANSIÇÕES")
    L.append(s)
    anim = css_data["animations"]
    L.append(f"  Transições: {len(anim['transitions'])}")
    for t in anim["transitions"][:8]:
        L.append(f"    {t[:80]}")
    L.append(f"  Keyframe animations: {anim['keyframe_animations']}")
    L.append(f"  Transforms: {anim['transforms']}")
    L.append("")

    # ── 7. BREAKPOINTS ──────────────────────────────────────────
    L.append(s)
    L.append("  7. RESPONSIVIDADE (BREAKPOINTS)")
    L.append(s)
    bp = css_data["breakpoints"]
    L.append(f"  Total media queries: {bp['total_media_queries']}")
    for b in bp["breakpoints_found"][:20]:
        L.append(f"  {b}")
    L.append("")

    # ── 8. ÍCONES ───────────────────────────────────────────────
    L.append(s)
    L.append("  8. ÍCONES")
    L.append(s)
    icons = css_data["icons"]
    L.append(f"  Bibliotecas: {icons['libraries'] or 'SVG inline (sem biblioteca externa)'}")
    L.append(f"  SVGs inline: {icons['svg_inline_count']}")
    L.append(f"  Data URIs: {icons['inline_data_uris']}")
    L.append("")

    # ── 9. TAILWIND ─────────────────────────────────────────────
    L.append(s)
    L.append("  9. TAILWIND CSS — CLASSES MAIS UTILIZADAS")
    L.append(s)
    tw = html_data["tailwind_classes"]
    L.append(f"  Classes únicas: {tw['total_unique']:,}")
    L.append(f"  Usos totais:    {tw['total_uses']:,}")
    L.append("")
    L.append("  TOP 50 CLASSES:")
    for item in tw["top_100"][:50]:
        L.append(f"  {item['class']:<35} {item['count']:>6,}x")
    L.append("")
    L.append("  POR CATEGORIA TAILWIND:")
    for cat, count in tw["by_category"].items():
        bar = "█" * min(count // max(1, tw["total_uses"]) * 30, 30)
        L.append(f"  {cat:<15} {count:>8,} usos  {bar}")
    L.append("")

    # ── 10. COMPONENTES DETECTADOS ──────────────────────────────
    L.append(s)
    L.append("  10. COMPONENTES DETECTADOS")
    L.append(s)
    comps = html_data["components"]
    summary = html_data["components_summary"]
    L.append(f"  Heros:       {comps['total_heros']:,}")
    L.append(f"  Cards:       {comps['total_cards']:,}")
    L.append(f"  Botões:      {comps['total_buttons']:,}")
    L.append(f"  Modais:      {comps['total_modals']:,}")
    L.append(f"  Breadcrumbs: {comps['total_breadcrumbs']:,}")
    L.append(f"  Tabelas:     {comps['total_tables']:,}")
    L.append(f"  Layouts:     {', '.join(html_data['layouts_detected'])}")
    L.append(f"  Custom CSS:  {html_data['custom_selectors']:,} seletores")
    L.append("")

    # ── 11. DESIGN TOKENS ───────────────────────────────────────
    L.append(s)
    L.append("  11. DESIGN TOKENS (RESUMO)")
    L.append(s)
    L.append(f"  Cores        : {colors['total_unique']}")
    L.append(f"  Fontes       : {fonts['total_families']}")
    L.append(f"  Pesos        : {len(fonts['weights_used'])}")
    L.append(f"  Breakpoints  : {bp['total_media_queries']}")
    L.append(f"  Sombras      : {shadows['unique_shadows']}")
    L.append(f"  Animações    : {anim['keyframe_animations']}")
    L.append(f"  TW Classes   : {tw['total_unique']:,}")
    L.append(f"  Componentes  : {sum(summary.values()):,} instâncias")
    L.append("")

    # ── 12. RESUMO EXECUTIVO ────────────────────────────────────
    L.append(s)
    L.append("  12. RESUMO EXECUTIVO")
    L.append(s)
    L.append(f"  Cores únicas.............. {colors['total_unique']}")
    L.append(f"  Variáveis CSS............. {len(css_data['css_variables'])}")
    L.append(f"  Famílias de fonte......... {fonts['total_families']}")
    L.append(f"  Pesos tipográficos........ {len(fonts['weights_used'])}")
    L.append(f"  Heros detectados.......... {comps['total_heros']}")
    L.append(f"  Cards detectados.......... {comps['total_cards']}")
    L.append(f"  Botões detectados......... {comps['total_buttons']}")
    L.append(f"  Classes Tailwind únicas... {tw['total_unique']:,}")
    L.append(f"  Media queries............. {bp['total_media_queries']}")
    L.append("")

    L.append(h)
    L.append("  Fim do catálogo. UI Catalog Engine v1.0")
    L.append(h)

    return "\n".join(L)
