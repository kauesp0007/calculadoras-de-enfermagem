"""Gerador de relatórios Markdown — Design System."""

from typing import Dict


def generate_md(css_data: Dict, html_data: Dict) -> str:
    """Gera o catálogo completo em formato Markdown."""
    L = []
    colors = css_data["colors"]
    fonts = css_data["fonts"]
    typo = css_data["typography"]
    sp = css_data["spacing"]
    borders = css_data["borders"]
    shadows = css_data["shadows"]
    anim = css_data["animations"]
    bp = css_data["breakpoints"]
    icons = css_data["icons"]
    tw = html_data["tailwind_classes"]
    comps = html_data["components"]

    L.append("# 🎨 Catálogo do Design System")
    L.append("")
    L.append("**Calculadoras de Enfermagem** — UI Catalog Engine v1.0")
    L.append("")

    # ── 1. PALETA DE CORES ──────────────────────────────────────
    L.append("## 1. 🎨 Paleta de Cores")
    L.append("")
    L.append(f"**Total de cores únicas:** {colors['total_unique']}")
    L.append("")
    L.append("### Top 20 Cores Mais Utilizadas")
    L.append("")
    L.append("| Cor | Usos | Categoria |")
    L.append("|---|---|---|")
    for c in colors["top_colors"][:20]:
        cats = ", ".join(c["cats"]) if c["cats"] else "-"
        L.append(f"| `{c['color']}` | {c['count']}x | {cats} |")
    L.append("")

    # ── 2. VARIÁVEIS CSS ────────────────────────────────────────
    L.append("## 2. 📐 Variáveis CSS")
    L.append("")
    L.append(f"**Total:** {len(css_data['css_variables'])} variáveis")
    L.append("")
    L.append("| Variável | Valor |")
    L.append("|---|---|")
    for v in css_data["css_variables"][:25]:
        L.append(f"| `{v['name']}` | `{v['value'][:50]}` |")
    L.append("")

    # ── 3. FONTES ───────────────────────────────────────────────
    L.append("## 3. 🔤 Fontes e Tipografia")
    L.append("")
    L.append(f"### Famílias: {', '.join(fonts['families'])}")
    L.append("")
    L.append(f"**Pesos:** {fonts['weights_used']}")
    L.append("")
    L.append("### @font-face Declaradas")
    L.append("")
    L.append("| Família | Peso | Arquivo |")
    L.append("|---|---|---|")
    for ff in fonts["font_faces"][:10]:
        L.append(f"| {ff['family']} | {ff['weight']} | `{ff['file']}` |")
    L.append("")

    L.append(f"**Line-heights:** {typo['line_heights']}")
    L.append("")
    L.append(f"**Letter-spacings:** {typo['letter_spacings']}")
    L.append("")

    # ── 4. ESPAÇAMENTOS ─────────────────────────────────────────
    L.append("## 4. 📏 Espaçamentos")
    L.append("")
    L.append(f"- **Margins únicos:** {len(sp['margins'])}")
    L.append(f"- **Paddings únicos:** {len(sp['paddings'])}")
    L.append(f"- **Gaps:** {sp['gaps']}")
    L.append("")

    # ── 5. BORDAS E SOMBRAS ────────────────────────────────────
    L.append("## 5. 🔲 Bordas e Sombras")
    L.append("")
    L.append(f"**Border-radius:** {borders['radius_values']}")
    L.append("")
    L.append(f"**Sombras únicas:** {shadows['unique_shadows']}")
    L.append("")
    L.append("| Usos | Sombra |")
    L.append("|---|---|")
    for s, c in shadows["top_shadows"][:8]:
        L.append(f"| {c}x | `{s[:80]}` |")
    L.append("")

    # ── 6. ANIMAÇÕES ────────────────────────────────────────────
    L.append("## 6. ✨ Animações e Transições")
    L.append("")
    L.append(f"- **Transições:** {len(anim['transitions'])}")
    L.append(f"- **Keyframes:** {anim['keyframe_animations']}")
    L.append("")

    # ── 7. BREAKPOINTS ──────────────────────────────────────────
    L.append("## 7. 📱 Responsividade")
    L.append("")
    L.append(f"**Total media queries:** {bp['total_media_queries']}")
    L.append("")
    for b in bp["breakpoints_found"][:15]:
        L.append(f"- `{b}`")
    L.append("")

    # ── 8. ÍCONES ───────────────────────────────────────────────
    L.append("## 8. 🎯 Ícones")
    L.append("")
    L.append(f"**Bibliotecas:** {icons['libraries'] or 'SVG inline'}")
    L.append(f"**SVGs inline:** {icons['svg_inline_count']}")
    L.append("")

    # ── 9. TAILWIND ─────────────────────────────────────────────
    L.append("## 9. 🧩 Tailwind CSS — Classes")
    L.append("")
    L.append(f"- **Classes únicas:** {tw['total_unique']:,}")
    L.append(f"- **Usos totais:** {tw['total_uses']:,}")
    L.append("")
    L.append("### Top 30 Classes")
    L.append("")
    L.append("| Classe | Usos |")
    L.append("|---|---|")
    for item in tw["top_100"][:30]:
        L.append(f"| `{item['class']}` | {item['count']:,}x |")
    L.append("")

    L.append("### Por Categoria")
    L.append("")
    L.append("| Categoria | Usos |")
    L.append("|---|---|")
    for cat, count in tw["by_category"].items():
        L.append(f"| {cat} | {count:,} |")
    L.append("")

    # ── 10. COMPONENTES ─────────────────────────────────────────
    L.append("## 10. 🧱 Componentes Detectados")
    L.append("")
    L.append("| Componente | Instâncias |")
    L.append("|---|---|")
    L.append(f"| Hero | {comps['total_heros']:,} |")
    L.append(f"| Cards | {comps['total_cards']:,} |")
    L.append(f"| Botões | {comps['total_buttons']:,} |")
    L.append(f"| Modais | {comps['total_modals']:,} |")
    L.append(f"| Breadcrumbs | {comps['total_breadcrumbs']:,} |")
    L.append(f"| Tabelas | {comps['total_tables']:,} |")
    L.append("")

    # ── 11. DESIGN TOKENS ───────────────────────────────────────
    L.append("## 11. 🎯 Design Tokens")
    L.append("")
    L.append("| Token | Valor |")
    L.append("|---|---|")
    L.append(f"| Cores | {colors['total_unique']} |")
    L.append(f"| Fontes | {fonts['total_families']} |")
    L.append(f"| Pesos tipográficos | {len(fonts['weights_used'])} |")
    L.append(f"| Breakpoints | {bp['total_media_queries']} |")
    L.append(f"| Sombras | {shadows['unique_shadows']} |")
    L.append(f"| Animações | {anim['keyframe_animations']} |")
    L.append(f"| Classes Tailwind | {tw['total_unique']:,} |")
    L.append("")

    # ── 12. RESUMO ──────────────────────────────────────────────
    L.append("## 12. 📊 Resumo Executivo")
    L.append("")
    L.append("| Métrica | Quantidade |")
    L.append("|---|---|")
    L.append(f"| Cores únicas | **{colors['total_unique']}** |")
    L.append(f"| Variáveis CSS | **{len(css_data['css_variables'])}** |")
    L.append(f"| Famílias de fonte | **{fonts['total_families']}** |")
    L.append(f"| Heros detectados | **{comps['total_heros']}** |")
    L.append(f"| Cards detectados | **{comps['total_cards']}** |")
    L.append(f"| Botões detectados | **{comps['total_buttons']}** |")
    L.append(f"| Classes Tailwind | **{tw['total_unique']:,}** |")
    L.append(f"| Media queries | **{bp['total_media_queries']}** |")
    L.append("")
    L.append("---")
    L.append("*UI Catalog Engine v1.0 — Apenas leitura*")

    return "\n".join(L)
