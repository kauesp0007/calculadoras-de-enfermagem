"""Ponto de entrada do Repository Catalog Engine — Fases 1 a 5.

Uso:
    python -m automacoes.repository_catalog_engine.main

Saídas (em CATALOGO_DO_SITE/):
    Fase 1: CATALOGO_DO_REPOSITORIO.txt / .md
    Fase 2: ANALISE_ESTRUTURAL.txt / .md
    Fase 3: DEPENDENCIAS.txt / MAPA_DE_DEPENDENCIAS.md
    Fase 4: MAPA_DE_NAVEGACAO.txt / .md
    Fase 5: AUDITORIA_TECNICA.txt / .md
"""

import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from automacoes.repository_catalog_engine.scanner import scan_repository
from automacoes.repository_catalog_engine.analyzer import analyze
from automacoes.repository_catalog_engine.tree_builder import build_tree
from automacoes.repository_catalog_engine.report_generator import generate as generate_fase1
from automacoes.repository_catalog_engine.content_parser import parse_file
from automacoes.repository_catalog_engine.dependency_mapper import (
    build_dependency_map, generate_txt as dep_txt, generate_md as dep_md,
)
from automacoes.repository_catalog_engine.navigation_mapper import (
    build_navigation_map, generate_txt as nav_txt, generate_md as nav_md,
)
from automacoes.repository_catalog_engine.auditor import (
    audit, generate_txt as aud_txt, generate_md as aud_md,
)
from automacoes.repository_catalog_engine.config import (
    OUTPUT_DIR, FASE2_TXT, FASE2_MD, FASE3_TXT, FASE3_MD,
    FASE4_TXT, FASE4_MD, FASE5_TXT, FASE5_MD,
)


def main():
    """Executa o pipeline completo (Fases 1 a 5)."""
    total_start = time.perf_counter()

    print("=" * 60)
    print("  Repository Catalog Engine — Fases 1 a 5")
    print("=" * 60)
    print()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # ═══════════════════════════════════════════════════════════════
    # FASE 1
    # ═══════════════════════════════════════════════════════════════
    print("-" * 60)
    print("  FASE 1 — Catalogo do Repositorio")
    print("-" * 60)
    t0 = time.perf_counter()
    files, total_dirs = scan_repository()
    stats = analyze(files, total_dirs)
    tree = build_tree(files)
    generate_fase1(stats, tree)
    print(f"  {len(files):,} arquivos | {total_dirs:,} pastas | {stats['total_languages']} idiomas | {time.perf_counter() - t0:.2f}s")
    print()

    # ═══════════════════════════════════════════════════════════════
    # FASE 2
    # ═══════════════════════════════════════════════════════════════
    print("-" * 60)
    print("  FASE 2 — Analise Estrutural")
    print("-" * 60)
    t0 = time.perf_counter()

    parsed_content = {}
    h_parsed = c_parsed = j_parsed = js_parsed = m_parsed = 0
    for f in files:
        result = parse_file(f)
        if result:
            parsed_content[str(f["relative_path"])] = result
            t = f["type"]
            if t == "html": h_parsed += 1
            elif t == "css": c_parsed += 1
            elif t == "js": js_parsed += 1
            elif t == "json": j_parsed += 1
            elif t == "sistema" and f["extension"] == ".md": m_parsed += 1

    _generate_fase2(parsed_content)
    print(f"  HTML:{h_parsed:,} CSS:{c_parsed:,} JS:{js_parsed:,} JSON:{j_parsed:,} MD:{m_parsed:,} | {time.perf_counter() - t0:.2f}s")
    print()

    # ═══════════════════════════════════════════════════════════════
    # FASE 3
    # ═══════════════════════════════════════════════════════════════
    print("-" * 60)
    print("  FASE 3 — Mapa de Dependencias")
    print("-" * 60)
    t0 = time.perf_counter()
    dep_map = build_dependency_map(files, parsed_content)
    FASE3_TXT.write_text(dep_txt(dep_map), encoding="utf-8")
    FASE3_MD.write_text(dep_md(dep_map), encoding="utf-8")
    print(f"  HTML->CSS:{dep_map['total_html_css_edges']:,} HTML->JS:{dep_map['total_html_js_edges']:,} HTML->IMG:{dep_map['total_html_img_edges']:,} Quebradas:{dep_map['total_broken_refs']:,} | {time.perf_counter() - t0:.2f}s")
    print()

    # ═══════════════════════════════════════════════════════════════
    # FASE 4
    # ═══════════════════════════════════════════════════════════════
    print("-" * 60)
    print("  FASE 4 — Mapa de Navegacao")
    print("-" * 60)
    t0 = time.perf_counter()
    nav_map = build_navigation_map(files, parsed_content)
    FASE4_TXT.write_text(nav_txt(nav_map), encoding="utf-8")
    FASE4_MD.write_text(nav_md(nav_map), encoding="utf-8")
    print(f"  Links internos:{nav_map['total_internal_links']:,} externos:{nav_map['total_external_links']:,} Orfas:{nav_map['total_orphan_pages']:,} | {time.perf_counter() - t0:.2f}s")
    print()

    # ═══════════════════════════════════════════════════════════════
    # FASE 5
    # ═══════════════════════════════════════════════════════════════
    print("-" * 60)
    print("  FASE 5 — Auditoria Tecnica")
    print("-" * 60)
    t0 = time.perf_counter()
    audit_result = audit(files, stats, parsed_content, dep_map, nav_map)
    FASE5_TXT.write_text(aud_txt(audit_result), encoding="utf-8")
    FASE5_MD.write_text(aud_md(audit_result), encoding="utf-8")
    print(f"  Problemas:{audit_result['total_findings']} (C:{audit_result['critical']} A:{audit_result['high']} M:{audit_result['medium']} B:{audit_result['low']}) | {time.perf_counter() - t0:.2f}s")
    print()

    # ═══════════════════════════════════════════════════════════════
    print("=" * 60)
    print("  CATALOGACAO COMPLETA (Fases 1-5)")
    print("=" * 60)
    print(f"  Tempo total: {time.perf_counter() - total_start:.2f}s")
    print(f"  Saidas em: {OUTPUT_DIR}/")
    for name in ["CATALOGO_DO_REPOSITORIO", "ANALISE_ESTRUTURAL",
                 "DEPENDENCIAS / MAPA_DE_DEPENDENCIAS",
                 "MAPA_DE_NAVEGACAO", "AUDITORIA_TECNICA"]:
        print(f"    {name}.txt / .md")
    print()


def _generate_fase2(parsed_content):
    """Gera relatorio da Fase 2."""
    html_files = [v for v in parsed_content.values() if v["_type"] == "html"]

    # Scripts mais usados
    script_usage = {}
    css_usage = {}
    all_preloads = set()
    all_meta = set()
    all_fonts = set()

    for v in html_files:
        for s in v.get("scripts", []):
            script_usage[s] = script_usage.get(s, 0) + 1
        for c in v.get("css", []):
            css_usage[c] = css_usage.get(c, 0) + 1
        for p in v.get("preloads", []):
            all_preloads.add(p)
        for m in v.get("meta_tags", []):
            all_meta.add(m["name"])
        for f in v.get("fonts_used", []):
            all_fonts.add(f)

    # TXT
    txt = []
    txt.append("=" * 72)
    txt.append("  ANALISE ESTRUTURAL DOS ARQUIVOS")
    txt.append("=" * 72)
    txt.append("")
    txt.append(f"HTML analisados: {len(html_files):,}")
    txt.append("")
    txt.append("-" * 72)
    txt.append("  TOP 20 SCRIPTS MAIS UTILIZADOS")
    txt.append("-" * 72)
    for script, count in sorted(script_usage.items(), key=lambda x: x[1], reverse=True)[:20]:
        txt.append(f"  {count:>5}x  {script}")
    txt.append("")
    txt.append("-" * 72)
    txt.append("  TOP 10 CSS MAIS UTILIZADOS")
    txt.append("-" * 72)
    for css, count in sorted(css_usage.items(), key=lambda x: x[1], reverse=True)[:10]:
        txt.append(f"  {count:>5}x  {css}")
    txt.append("")
    txt.append("-" * 72)
    txt.append(f"  PRELOADS ({len(all_preloads)} recursos)")
    txt.append("-" * 72)
    for p in sorted(all_preloads):
        txt.append(f"  {p}")
    txt.append("")
    txt.append("-" * 72)
    txt.append(f"  META TAGS ({len(all_meta)} tipos)")
    txt.append("-" * 72)
    for m in sorted(all_meta):
        txt.append(f"  {m}")
    txt.append("")
    txt.append("-" * 72)
    txt.append(f"  FONTES UTILIZADAS ({len(all_fonts)})")
    txt.append("-" * 72)
    for f in sorted(all_fonts):
        txt.append(f"  {f}")

    FASE2_TXT.write_text("\n".join(txt), encoding="utf-8")

    # MD
    md = []
    md.append("# Analise Estrutural dos Arquivos")
    md.append("")
    md.append("## Top 20 Scripts Mais Utilizados")
    md.append("")
    md.append("| Uso | Script |")
    md.append("|---|---|")
    for script, count in sorted(script_usage.items(), key=lambda x: x[1], reverse=True)[:20]:
        md.append(f"| {count}x | `{script}` |")
    md.append("")
    md.append("## Top 10 CSS Mais Utilizados")
    md.append("")
    md.append("| Uso | CSS |")
    md.append("|---|---|")
    for css, count in sorted(css_usage.items(), key=lambda x: x[1], reverse=True)[:10]:
        md.append(f"| {count}x | `{css}` |")
    md.append("")
    md.append(f"## Fontes Utilizadas ({len(all_fonts)})")
    for f in sorted(all_fonts):
        md.append(f"- {f}")

    FASE2_MD.write_text("\n".join(md), encoding="utf-8")
    print(f"  [OK] {FASE2_TXT.name}")
    print(f"  [OK] {FASE2_MD.name}")


if __name__ == "__main__":
    main()
