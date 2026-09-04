"""Exportação da biblioteca para o site (spec §45, §46, §64).

Gera uma camada de leitura pública que o site pode consumir SEM conhecer a
estrutura interna dos agentes:

- `publico/biblioteca.json` — itens aprovados em formato de leitura (conteúdo,
  metadados, referências, fonte, data, status);
- `publico/index.html` — vitrine standalone (prova de conceito), NÃO integrada
  ao menu/site principal.

> A publicação formal no site (menu-global, hero card, SEO/hreflang, registro em
> relatorio_paginas.txt) é etapa posterior e exige decisão do usuário (§44).
"""

import json
import sys
from pathlib import Path

from .config import JSON_DIR
from . import api

PUBLICO_DIR = JSON_DIR / "publico"


def _dados_leitura() -> list[dict]:
    """Monta o JSON público a partir dos itens aprovados (camada de leitura)."""
    itens = api.listar_aprovados()
    saida = []
    for resumo in itens:
        item = api.obter_item(resumo["id"])
        prov = api.proveniencia(resumo["id"])
        saida.append({
            "id": resumo["id"],
            "titulo": resumo["titulo"],
            "resumo": resumo["resumo"],
            "tipo_documental": resumo["tipo_documental"],
            "instituicao": resumo["instituicao"],
            "ano": resumo["ano"],
            "conceitos": (item.get("conteudo") or {}).get("conceitos") if item else [],
            "procedimentos": (item.get("conteudo") or {}).get("procedimentos") if item else [],
            "recomendacoes": (item.get("evidencia") or {}).get("recomendacoes") if item else None,
            "referencias": item.get("referencias") if item else [],
            "fonte": {
                "documento_original": (prov or {}).get("documento_fonte"),
                "instituicao": (prov or {}).get("instituicao"),
                "ano": (prov or {}).get("ano"),
            },
            "status": resumo["status"],
        })
    return saida


def _gerar_html(itens: list[dict]) -> str:
    cards = []
    for it in itens:
        conceitos = ", ".join(it.get("conceitos") or []) or "—"
        fonte = it.get("fonte") or {}
        cards.append(
            f"""<article style="border:1px solid #ddd;border-radius:8px;padding:16px;margin:12px 0;">
  <h2 style="margin:0 0 8px;">{it.get('titulo') or 'Sem título'}</h2>
  <p style="margin:0 0 8px;color:#555;">{it.get('resumo') or ''}</p>
  <p style="margin:0;font-size:0.9em;"><strong>Conceitos:</strong> {conceitos}</p>
  <p style="margin:4px 0 0;font-size:0.85em;color:#777;">
    Fonte: {fonte.get('instituicao') or '—'} ({fonte.get('ano') or 's/ano'})
    · {it.get('tipo_documental') or '—'} · status {it.get('status')}
  </p>
</article>"""
        )

    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Biblioteca de Conhecimento em Saúde — Vitrine</title>
<style>body{{font-family:sans-serif;max-width:860px;margin:24px auto;padding:0 16px;}}</style>
</head>
<body>
<h1>Biblioteca de Conhecimento em Saúde</h1>
<p>Vitrine de demonstração gerada automaticamente. Não integrada ao site principal.</p>
{''.join(cards)}
</body>
</html>"""


def executar(dry_run: bool = False) -> dict:
    itens = _dados_leitura()
    html = _gerar_html(itens)

    if not dry_run:
        PUBLICO_DIR.mkdir(parents=True, exist_ok=True)
        (PUBLICO_DIR / "biblioteca.json").write_text(
            json.dumps(itens, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        (PUBLICO_DIR / "index.html").write_text(html, encoding="utf-8")

    return {"itens": len(itens), "html_chars": len(html)}


def _main() -> int:
    dry_run = "--dry-run" in sys.argv
    r = executar(dry_run=dry_run)
    modo = "DRY-RUN" if dry_run else "EXECUÇÃO"
    print(f"[EXPORTAÇÃO SITE] modo={modo}")
    print(f"  Itens exportados : {r['itens']}")
    if not dry_run:
        print("  Saída: biblioteca_de_enfermagem_json/publico/biblioteca.json")
        print("         biblioteca_de_enfermagem_json/publico/index.html")
    return 0


if __name__ == "__main__":
    raise SystemExit(_main())
