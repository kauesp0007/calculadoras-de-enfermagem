"""UI Catalog Engine — Ponto de entrada.

Analisa o Design System completo do projeto Calculadoras de Enfermagem.
NUNCA modifica arquivos.

Saídas:
    CATALOGO_DE_IDENTIDADE_VISUAL/CATALOGO_DO_DESIGN_SYSTEM.txt
    CATALOGO_DE_IDENTIDADE_VISUAL/CATALOGO_DO_DESIGN_SYSTEM.md
"""

import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from automacoes.ui_catalog_engine.config import (
    CSS_FILES, HTML_DIRS, MAX_HTML_SAMPLE, OUTPUT_DIR, TXT_OUTPUT, MD_OUTPUT, BASE_DIR,
)
from automacoes.ui_catalog_engine.parsers.css_parser import parse_css_files
from automacoes.ui_catalog_engine.parsers.html_parser import parse_html_for_components
from automacoes.ui_catalog_engine.reporters.txt_reporter import generate_txt
from automacoes.ui_catalog_engine.reporters.md_reporter import generate_md


def main():
    print("=" * 60)
    print("  UI Catalog Engine — Design System")
    print("=" * 60)
    print()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Etapa 1: Coletar HTMLs
    print("[1/3] Coletando arquivos HTML...")
    t0 = time.perf_counter()
    html_files = []
    for d in HTML_DIRS:
        if d.exists():
            found = sorted(d.glob("*.html"))
            if MAX_HTML_SAMPLE and len(found) > MAX_HTML_SAMPLE:
                found = found[:MAX_HTML_SAMPLE]
            html_files.extend(found)
    print(f"      {len(html_files)} HTMLs para análise")
    print()

    # Etapa 2: Analisar CSS
    print("[2/3] Analisando CSS (cores, fontes, tipografia, espaçamentos...")
    t1 = time.perf_counter()
    existing_css = [f for f in CSS_FILES if f.exists()]
    css_data = parse_css_files(existing_css)
    print(f"      {css_data['colors']['total_unique']} cores, "
          f"{css_data['fonts']['total_families']} fontes, "
          f"{len(css_data['css_variables'])} variáveis CSS")
    print(f"      ({time.perf_counter() - t1:.2f}s)")
    print()

    # Etapa 3: Analisar HTML
    print("[3/3] Analisando HTML (Tailwind, componentes, padrões)...")
    t2 = time.perf_counter()
    html_data = parse_html_for_components(html_files)
    print(f"      {html_data['tailwind_classes']['total_unique']:,} classes Tailwind, "
          f"{html_data['tailwind_classes']['total_uses']:,} usos totais")
    print(f"      Heros: {html_data['components']['total_heros']}, "
          f"Cards: {html_data['components']['total_cards']}, "
          f"Botões: {html_data['components']['total_buttons']}")
    print(f"      ({time.perf_counter() - t2:.2f}s)")
    print()

    # Gerar relatórios
    print("Gerando relatórios...")
    TXT_OUTPUT.write_text(generate_txt(css_data, html_data), encoding="utf-8")
    MD_OUTPUT.write_text(generate_md(css_data, html_data), encoding="utf-8")

    print(f"  [OK] {TXT_OUTPUT}")
    print(f"  [OK] {MD_OUTPUT}")
    print()
    print(f"  Tempo total: {time.perf_counter() - t0:.2f}s")
    print()
    print("=" * 60)
    print("  CATÁLOGO DO DESIGN SYSTEM CONCLUÍDO")
    print("=" * 60)


if __name__ == "__main__":
    main()
