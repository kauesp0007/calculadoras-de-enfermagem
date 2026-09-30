#!/usr/bin/env python3
"""Generate reviewable translations of the six recovered public clinical guides.

The intact Portuguese guides are the source of truth. Outputs go only to a
temporary artifact directory; this job does not commit or deploy translations.
"""

from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from automacoes.translation import hooks, orchestrator

TARGETS = (
    ("integracoes_classificacao_wifi.html", "de"),
    ("integracoes_classificacao_wifi.html", "it"),
    ("integracoes_classificacao_wifi.html", "pl"),
    ("integracoes_classificacao_wifi.html", "tr"),
    ("integracoes_calculadora_de_gasometria.html", "pl"),
    ("guia_rapido_dispositivos.html", "sv"),
)


def article_numbers(html: str) -> list[str]:
    """Compare numerical clinical material in the article, not SEO or scripts."""
    article = re.search(r'<main\b[^>]*>(.*?)</main>', html, re.S | re.I)
    if not article:
        raise ValueError("Clinical article missing")
    content = re.sub(r"<[^>]+>", " ", article.group(1))
    return sorted(re.findall(r"(?<![\w])\d+(?:[.,]\d+)?", content))


def main() -> int:
    if not os.getenv("DEEPSEEK_API_KEY"):
        raise RuntimeError("Translation provider credential unavailable")

    output = Path(os.environ.get("RECOVERED_GUIDES_OUTPUT", "/tmp/recovered-guides"))
    output.mkdir(parents=True, exist_ok=True)
    hooks.apos_salvar = lambda *_args: None  # Do not change repository logs/build.

    original_translate = orchestrator.traduzir_payload
    successful_batches = 0

    def counted_translate(*args, **kwargs):
        nonlocal successful_batches
        result = original_translate(*args, **kwargs)
        successful_batches += 1
        return result

    orchestrator.traduzir_payload = counted_translate
    results = []
    for filename, language in TARGETS:
        source = ROOT / filename
        successful_batches = 0
        result = orchestrator.traduzir_arquivo(
            source,
            language,
            modo="real",
            usar_memoria=False,
            pasta_saida=output / language,
            provider="deepseek",
        )
        if successful_batches != result["lotes"] or not result["estrutura_ok"]:
            raise RuntimeError(
                f"Incomplete translation {language}/{filename}: "
                f"{successful_batches}/{result['lotes']} batches; {result['problemas']}"
            )
        path = output / language / filename
        if result["caminho_saida"] != str(path) or not path.is_file():
            raise RuntimeError(f"Missing generated file: {path}")
        content = path.read_text(encoding="utf-8")
        if "OPENAI_BLOCK" in content or content.count("/global-scripts.js") != 1:
            raise RuntimeError(f"Invalid script/placeholder in {path}")
        if not re.search(r'<html[^>]*lang="' + language + r'\b', content, re.I):
            raise RuntimeError(f"Document language incorrect in {path}")
        if article_numbers(source.read_text(encoding="utf-8")) != article_numbers(content):
            raise RuntimeError(f"Clinical numbers changed in {path}")
        results.append({"path": f"{language}/{filename}", "batches": successful_batches,
                        "units": result["unidades_total"], "source": filename})
        print(f"COMPLETE: {language}/{filename}: {successful_batches} batches")

    (output / "translation-report.json").write_text(
        json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
