#!/usr/bin/env python3
"""Reserva espaco responsivo para um anuncio Multiplex antes do rodape.

Por padrao apenas simula. Use --aplicar para editar os HTMLs elegiveis.
O processo e idempotente: um arquivo nunca recebe o marcador duas vezes.
"""

from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
LANGUAGES = (
    "en", "es", "fr", "it", "de", "hi", "zh", "ja", "ru",
    "ko", "tr", "nl", "pl", "sv", "id", "vi", "uk", "ar",
)
EXCLUDED_DIRECTORIES = {
    "downloads", "biblioteca", "blog", "blog-templates", "node_modules", ".git",
}
EXCLUDED_FILES = {
    "footer.html", "menu-global.html", "global-body-elements.html",
    "downloads.html", "_language_selector.html", "googlefc0a17cdd552164b.html",
}
START = "<!-- MULTIPLEX_AD_RESERVED_START -->"
END = "<!-- MULTIPLEX_AD_RESERVED_END -->"
AD_CLIENT = "ca-pub-6472730056006847"
AD_SLOT = "3341197364"
ADS_LOADER_FRAGMENT = "pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
STYLE = '''<style>
  .multiplex-ad-reserved {{
    box-sizing: border-box;
    display: block;
    width: calc(100% - 32px);
    max-width: 1200px;
    min-height: 260px;
    margin: 32px auto;
    overflow: visible;
  }}
  @media (max-width: 600px) {{
    .multiplex-ad-reserved {{
      width: calc(100% - 24px);
      min-height: 220px;
      margin: 24px auto;
    }}
  }}
</style>
'''.replace("{{", "{").replace("}}", "}")

FOOTER = re.compile(
    r'<div\b(?=[^>]*\bid\s*=\s*["\']footer-placeholder["\'])[^>]*>',
    re.IGNORECASE,
)
MAIN_CLOSE = re.compile(r"</main\s*>", re.IGNORECASE)


def args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Reserva espaco para Multiplex na raiz e nas 18 pastas de idiomas."
    )
    parser.add_argument("--aplicar", action="store_true", help="Edita os arquivos; sem isto apenas simula.")
    parser.add_argument("--remover", action="store_true", help="Remove reservas criadas por este programa.")
    parser.add_argument("--relatorio", type=Path, default=ROOT / "relatorios" / "multiplex-reserva.json")
    return parser.parse_args()


def eligible_files() -> list[Path]:
    files = [path for path in ROOT.glob("*.html") if path.name.lower() not in EXCLUDED_FILES]
    for language in LANGUAGES:
        directory = ROOT / language
        if directory.is_dir() and directory.name.lower() not in EXCLUDED_DIRECTORIES:
            files.extend(path for path in directory.glob("*.html") if path.name.lower() not in EXCLUDED_FILES)
    return sorted(set(files), key=lambda path: str(path).lower())


def newline_for(text: str) -> str:
    return "\r\n" if "\r\n" in text else "\n"


def ad_block(include_loader: bool) -> str:
    return f'''{START}
{STYLE.rstrip()}
<aside id="multiplex-ad-reserved" class="multiplex-ad-reserved" aria-label="Publicidade">
  <ins class="adsbygoogle"
       style="display:block;width:100%"
       data-ad-format="autorelaxed"
       data-ad-client="{AD_CLIENT}"
       data-ad-slot="{AD_SLOT}"
       data-matched-content-rows-num="1,1"
       data-matched-content-columns-num="1,4"
       data-matched-content-ui-type="image_card_sidebyside,image_card_sidebyside"></ins>
</aside>
{END}'''


def reserve(text: str) -> tuple[str, str]:
    if START in text:
        start = text.index(START)
        end = text.find(END, start)
        if end == -1:
            return text, "marcador_incompleto"
        end += len(END)
        current = text[start:end]
        is_centralized = ADS_LOADER_FRAGMENT not in current and "adsbygoogle || []).push" not in current
        if f'data-ad-slot="{AD_SLOT}"' in current and is_centralized:
            return text, "ja_configurado"
        outside = text[:start] + text[end:]
        configured = ad_block(ADS_LOADER_FRAGMENT not in outside)
        configured = configured.replace("\n", newline_for(text))
        return text[:start] + configured + text[end:], "configuracao_centralizada"
    footer = FOOTER.search(text)
    if footer:
        position = footer.start()
        method = "antes_footer"
    else:
        main_matches = list(MAIN_CLOSE.finditer(text))
        if not main_matches:
            return text, "sem_ancora_segura"
        position = main_matches[-1].end()
        method = "apos_main_sem_footer"
    nl = newline_for(text)
    block = ad_block(ADS_LOADER_FRAGMENT not in text).replace("\n", nl)
    before = text[:position].rstrip()
    after = text[position:].lstrip("\r\n")
    return before + nl * 2 + block + nl * 2 + after, method


def remove_reservation(text: str) -> tuple[str, str]:
    pattern = re.compile(
        re.escape(START) + r".*?" + re.escape(END) + r"\s*",
        re.DOTALL,
    )
    changed, count = pattern.subn("", text)
    return (changed, "removido") if count else (text, "nao_existente")


def main() -> int:
    options = args()
    results: list[dict[str, str]] = []
    changed_count = 0
    for path in eligible_files():
        original = path.read_text(encoding="utf-8", errors="strict")
        changed, status = remove_reservation(original) if options.remover else reserve(original)
        modified = changed != original
        if modified:
            changed_count += 1
            if options.aplicar:
                path.write_text(changed, encoding="utf-8", newline="")
        results.append({
            "arquivo": str(path.relative_to(ROOT)),
            "status": status,
            "alterado": str(modified).lower(),
        })

    summary: dict[str, int] = {}
    for result in results:
        summary[result["status"]] = summary.get(result["status"], 0) + 1
    payload = {
        "gerado_em": datetime.now(timezone.utc).isoformat(),
        "modo": "aplicado" if options.aplicar else "simulacao",
        "arquivos_elegiveis": len(results),
        "arquivos_alterados": changed_count,
        "resumo": summary,
        "resultados": results,
    }
    options.relatorio.parent.mkdir(parents=True, exist_ok=True)
    options.relatorio.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({key: value for key, value in payload.items() if key != "resultados"}, ensure_ascii=False, indent=2))
    if not options.aplicar and changed_count:
        print("Simulacao concluida. Use --aplicar para gravar as alteracoes.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
