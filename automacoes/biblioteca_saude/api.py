"""FASE 15 — Camada de comunicação com o site (spec §45, §46, §64).

Camada de LEITURA que o site (ou qualquer consumidor) usa para acessar o
conhecimento estruturado sem conhecer a estrutura interna dos agentes.
Retorna conteúdo, metadados, referências, fonte, data e status.

A página nunca deve depender do conteúdo bruto dos livros (§64) — ela consome
esta camada, que por sua vez lê `biblioteca_de_enfermagem_json/`.

> A integração real com páginas do site é etapa posterior e controlada (§44).
> Esta camada é apenas a interface de leitura pronta para esse uso.
"""

import json
from pathlib import Path

from .config import DOCUMENTOS_DIR, JSON_DIR

ITENS_DIR = JSON_DIR / "catalogo" / "itens"


def _carregar_itens() -> list[dict]:
    itens = []
    if ITENS_DIR.exists():
        for p in ITENS_DIR.glob("*.json"):
            try:
                itens.append(json.loads(p.read_text(encoding="utf-8")))
            except json.JSONDecodeError:
                continue
    return itens


def listar_aprovados() -> list[dict]:
    """Retorna um resumo dos itens APPROVED (título, resumo, fonte, status)."""
    return [
        {
            "id": i["id"],
            "titulo": i.get("titulo"),
            "resumo": i.get("resumo"),
            "tipo_documental": i.get("tipo_documental"),
            "instituicao": (i.get("autoria") or {}).get("instituicao"),
            "ano": (i.get("publicacao") or {}).get("ano_publicacao"),
            "status": i.get("status"),
        }
        for i in _carregar_itens()
        if i.get("status") == "APPROVED"
    ]


def buscar(termo: str) -> list[dict]:
    """Busca case-insensitive em título, resumo e conceitos."""
    t = (termo or "").lower()
    if not t:
        return listar_aprovados()
    resultados = []
    for i in _carregar_itens():
        if i.get("status") not in ("APPROVED", "AUDITED", "ANALYZED"):
            continue
        alvo = " ".join([
            i.get("titulo") or "",
            i.get("resumo") or "",
            " ".join((i.get("conteudo") or {}).get("conceitos") or []),
        ]).lower()
        if t in alvo:
            resultados.append({
                "id": i["id"],
                "titulo": i.get("titulo"),
                "resumo": i.get("resumo"),
                "fonte_id": i.get("fonte_id"),
                "status": i.get("status"),
            })
    return resultados


def obter_item(item_id: str) -> dict | None:
    for i in _carregar_itens():
        if i["id"] == item_id:
            return i
    return None


def proveniencia(item_id: str) -> dict | None:
    """Responde 'de onde veio esta informação?' (§11)."""
    item = obter_item(item_id)
    if not item:
        return None
    fonte_id = item.get("fonte_id")
    reg = None
    if fonte_id:
        p = DOCUMENTOS_DIR / f"{fonte_id}.json"
        if p.exists():
            reg = json.loads(p.read_text(encoding="utf-8"))
    return {
        "item_id": item_id,
        "titulo": item.get("titulo"),
        "documento_fonte": (reg or {}).get("nome_original") if reg else None,
        "caminho_original": (reg or {}).get("caminho_original") if reg else None,
        "instituicao": (item.get("autoria") or {}).get("instituicao"),
        "ano": (item.get("publicacao") or {}).get("ano_publicacao"),
        "tipo_documental": item.get("tipo_documental"),
        "hash_sha256": (reg or {}).get("hash_sha256") if reg else None,
        "status": item.get("status"),
    }


def _main() -> int:
    import sys
    aprovados = listar_aprovados()
    print(f"[FASE 15 — CAMADA DE COMUNICAÇÃO]")
    print(f"  Itens aprovados: {len(aprovados)}")
    if sys.argv[1:]:
        termo = " ".join(sys.argv[1:])
        print(f"  Busca por '{termo}':")
        for r in buscar(termo):
            print(f"    - {r['titulo']} [{r['status']}]")
    else:
        for a in aprovados:
            print(f"    - {a['titulo']} ({a['ano'] or 's/ano'})")
    return 0


if __name__ == "__main__":
    raise SystemExit(_main())
