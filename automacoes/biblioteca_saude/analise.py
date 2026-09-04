"""FASE 9 — Análise semântica (spec §20 SUBAGENTE_ANALISTA, §51, §52, §69).

Extrai conceitos, procedimentos, evidências e conclusões de cada documento
CATALOGED usando IA (DeepSeek, reusando a config do catalogador), com:

- cache por hash (não reprocessa documento inalterado — §50);
- snippet limitado (economia de contexto — §51);
- fallback honesto: se a IA falhar, marca REQUIRES_HUMAN_REVIEW — NUNCA inventa (§12).

Gera um "item de conhecimento" por documento em `catalogo/itens/<doc_id>.json`.
"""

import json
import sys
from pathlib import Path

from automacoes.catalogador.config import (
    DEEPSEEK_API_KEY,
    DEEPSEEK_BASE_URL,
    DEEPSEEK_MODEL,
    DEEPSEEK_TIMEOUT,
)

from .config import DOCUMENTOS_DIR, EXTRATOS_DIR, JSON_DIR
from .ingestao import carregar_indice, salvar_indice

ITENS_DIR = JSON_DIR / "catalogo" / "itens"
CACHE_PATH = JSON_DIR / "catalogo" / "analises_cache.json"

MAX_CHARS_INICIO = 8000
MAX_CHARS_MEIO = 4000

PROMPT_ANALISE = """Você é um analista de conhecimento em saúde/enfermagem.
Analise o trecho fornecido e extraia conceitos, procedimentos e evidências.
Retorne EXCLUSIVAMENTE um JSON válido, sem texto adicional antes ou depois.
NUNCA invente: extraia apenas o que está explicitamente no texto. Se não houver
informação, use null (para campos textuais) ou [] (para listas).

Retorne EXATAMENTE este formato:
{
  "resumo": "string ou null",
  "conceitos": ["string"],
  "procedimentos": ["string"],
  "medicamentos": ["string"],
  "equipamentos": ["string"],
  "escalas": ["string"],
  "classificacoes": ["string"],
  "diagnosticos": ["string"],
  "intervencoes": ["string"],
  "metodologia": "string ou null",
  "resultados": "string ou null",
  "conclusoes": "string ou null",
  "recomendacoes": "string ou null",
  "publico_alvo": "string ou null",
  "populacao_estudada": "string ou null"
}"""


def _carregar_cache() -> dict:
    if CACHE_PATH.exists():
        return json.loads(CACHE_PATH.read_text(encoding="utf-8"))
    return {}


def _salvar_cache(cache: dict) -> None:
    CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")


def _ler_registro(info: dict) -> dict:
    return json.loads((DOCUMENTOS_DIR / f"{info['id']}.json").read_text(encoding="utf-8"))


def _gravar_registro(reg: dict) -> None:
    (DOCUMENTOS_DIR / f"{reg['id']}.json").write_text(
        json.dumps(reg, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def _texto_do_documento(reg: dict) -> str:
    if reg.get("texto_extraido_em"):
        p = JSON_DIR / reg["texto_extraido_em"]
        if p.exists():
            return p.read_text(encoding="utf-8", errors="replace")
    return ""


def _montar_snippet(texto: str) -> str:
    if len(texto) <= MAX_CHARS_INICIO:
        return texto
    inicio = texto[:MAX_CHARS_INICIO]
    meio_inicio = max(MAX_CHARS_INICIO, len(texto) // 2)
    meio = texto[meio_inicio : meio_inicio + MAX_CHARS_MEIO]
    return inicio + "\n[...]\n" + meio


def _chamar_ia(texto: str):
    """Chama a DeepSeek e retorna (dict | None, erro | None)."""
    if not DEEPSEEK_API_KEY:
        return None, "DEEPSEEK_API_KEY não configurada"
    try:
        from openai import OpenAI
        client = OpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_BASE_URL, timeout=DEEPSEEK_TIMEOUT)
        resp = client.chat.completions.create(
            model=DEEPSEEK_MODEL,
            messages=[
                {"role": "system", "content": PROMPT_ANALISE},
                {"role": "user", "content": _montar_snippet(texto)},
            ],
            temperature=0.0,
            response_format={"type": "json_object"},
        )
        conteudo = resp.choices[0].message.content
        return json.loads(conteudo), None
    except Exception as e:  # noqa: BLE001
        return None, str(e)


def _listas(dados: dict, campo: str) -> list:
    v = dados.get(campo, [])
    if isinstance(v, list):
        return [str(x).strip() for x in v if x and str(x).strip()]
    if isinstance(v, str) and v.strip():
        return [v.strip()]
    return []


def executar(dry_run: bool = False, max_docs: int | None = None) -> dict:
    indice = carregar_indice()
    cache = _carregar_cache()
    resumo = {"analisados": [], "cache": [], "falhas": [], "pulados": []}

    processados = 0
    for nome, info in indice["documentos"].items():
        if max_docs is not None and processados >= max_docs:
            break

        reg = _ler_registro(info)
        if reg.get("status") != "CATALOGED":
            resumo["pulados"].append(nome)
            continue

        processados += 1
        doc_id = reg["id"]
        h = reg.get("hash_sha256")

        # cache por hash
        if h and h in cache:
            resultado = cache[h]
            resumo["cache"].append(nome)
        else:
            if dry_run:
                resumo["analisados"].append(nome)
                continue
            texto = _texto_do_documento(reg)
            resultado, erro = _chamar_ia(texto)
            if resultado is None:
                resumo["falhas"].append(nome)
                # marca item como revisão humana (não inventa)
                item = _item_erro(doc_id, reg, erro)
                _gravar_item(item)
                reg["status"] = "REQUIRES_HUMAN_REVIEW"
                reg["motivo_analise"] = f"IA indisponível: {erro}"
                _gravar_registro(reg)
                indice["documentos"][nome]["status"] = "REQUIRES_HUMAN_REVIEW"
                continue
            if h:
                cache[h] = resultado
            resumo["analisados"].append(nome)

        if not dry_run:
            item = _montar_item(doc_id, reg, resultado)
            _gravar_item(item)
            reg["status"] = "ANALYZED"
            _gravar_registro(reg)
            indice["documentos"][nome]["status"] = "ANALYZED"

    if not dry_run:
        _salvar_cache(cache)
        if resumo["analisados"] or resumo["falhas"]:
            salvar_indice(indice)

    return resumo


def _montar_item(doc_id: str, reg: dict, dados: dict) -> dict:
    from datetime import datetime, timezone
    agora = datetime.now(timezone.utc).isoformat()
    return {
        "id": "item-" + doc_id,
        "fonte_id": doc_id,
        "titulo": reg.get("titulo"),
        "tipo_documental": reg.get("tipo_documental"),
        "idioma": "pt",
        "pais": "Brasil",
        "autoria": {"instituicao": reg.get("instituicao")},
        "publicacao": {"ano_publicacao": reg.get("ano_publicacao")},
        "classificacao": {
            "especialidade": reg.get("especialidade"),
            "assuntos": reg.get("assuntos"),
            "profissoes_relacionadas": reg.get("profissoes_relacionadas"),
        },
        "conteudo": {
            "conceitos": _listas(dados, "conceitos"),
            "procedimentos": _listas(dados, "procedimentos"),
            "medicamentos": _listas(dados, "medicamentos"),
            "equipamentos": _listas(dados, "equipamentos"),
            "escalas": _listas(dados, "escalas"),
            "classificacoes": _listas(dados, "classificacoes"),
            "diagnosticos": _listas(dados, "diagnosticos"),
            "intervencoes": _listas(dados, "intervencoes"),
        },
        "evidencia": {
            "metodologia": dados.get("metodologia"),
            "resultados": dados.get("resultados"),
            "conclusoes": dados.get("conclusoes"),
            "recomendacoes": dados.get("recomendacoes"),
            "populacao_estudada": dados.get("populacao_estudada"),
        },
        "publico_alvo": dados.get("publico_alvo"),
        "resumo": dados.get("resumo"),
        "status": "ANALYZED",
        "metadados_origem": "ia_deepseek",
        "data_entrada": reg.get("data_entrada"),
        "data_processamento": agora,
        "historico_alteracoes": [],
    }


def _item_erro(doc_id: str, reg: dict, erro: str) -> dict:
    from datetime import datetime, timezone
    agora = datetime.now(timezone.utc).isoformat()
    return {
        "id": "item-" + doc_id,
        "fonte_id": doc_id,
        "titulo": reg.get("titulo"),
        "status": "REQUIRES_HUMAN_REVIEW",
        "motivo": f"análise semântica indisponível: {erro}",
        "data_entrada": reg.get("data_entrada"),
        "data_processamento": agora,
    }


def _gravar_item(item: dict) -> None:
    ITENS_DIR.mkdir(parents=True, exist_ok=True)
    (ITENS_DIR / f"{item['id']}.json").write_text(
        json.dumps(item, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def _main() -> int:
    dry_run = "--dry-run" in sys.argv
    max_docs = None
    if "--max" in sys.argv:
        try:
            max_docs = int(sys.argv[sys.argv.index("--max") + 1])
        except (IndexError, ValueError):
            pass
    resumo = executar(dry_run=dry_run, max_docs=max_docs)
    modo = "DRY-RUN" if dry_run else "EXECUÇÃO"
    print(f"[FASE 9 — ANÁLISE] modo={modo}")
    for k, v in resumo.items():
        print(f"  {k.capitalize():10}: {len(v)}")
        if k in ("analisados", "falhas"):
            for nome in v:
                print(f"      - {nome}")
    return 0


if __name__ == "__main__":
    raise SystemExit(_main())
