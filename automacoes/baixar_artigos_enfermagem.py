#!/usr/bin/env python3
"""Busca e baixa artigos de enfermagem com PDF em acesso aberto.

Fonte: API publica do Europe PMC. O programa nunca tenta contornar paywalls.
Usa somente a biblioteca padrao do Python 3.10+.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
import time
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen

try:
    # Faz o urllib usar os certificados confiaveis do Windows/macOS/Linux.
    import truststore

    truststore.inject_into_ssl()
except ImportError:
    truststore = None


API_URL = "https://www.ebi.ac.uk/europepmc/webservices/rest/search"
DEFAULT_QUERY = (
    '(TITLE_ABS:"enfermagem" OR KW:"enfermagem" OR KW:"nursing" OR BODY:"enfermagem" '
    'OR JOURNAL:"Revista Brasileira de Enfermagem" '
    'OR JOURNAL:"Texto & Contexto Enfermagem" '
    'OR JOURNAL:"Revista Latino-Americana de Enfermagem")'
)
BRAZIL_FILTER = (
    '(AFF:"Brasil" OR AFF:"Brazil" '
    'OR JOURNAL:"Revista Brasileira de Enfermagem" '
    'OR JOURNAL:"Texto & Contexto Enfermagem" '
    'OR JOURNAL:"Revista Latino-Americana de Enfermagem" '
    'OR JOURNAL:"Acta Paulista de Enfermagem" '
    'OR JOURNAL:"Escola Anna Nery" '
    'OR JOURNAL:"Revista da Escola de Enfermagem da USP")'
)
USER_AGENT = "BibliotecaEnfermagem/1.0 (download de artigos open access)"
CSV_FIELDS = (
    "id", "titulo", "autores", "revista", "ano", "doi", "pmcid",
    "idioma", "criterio_brasil", "licenca", "url_pdf", "arquivo", "status", "erro",
)


def argumentos() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Baixa PDFs de artigos de enfermagem em acesso aberto (Europe PMC)."
    )
    parser.add_argument(
        "--tema", default="", help='Tema adicional, por exemplo: "seguranca do paciente".'
    )
    parser.add_argument("--de", dest="ano_inicio", type=int, help="Ano inicial.")
    parser.add_argument("--ate", dest="ano_fim", type=int, help="Ano final.")
    parser.add_argument("--limite", type=int, default=20, help="Maximo de artigos (padrao: 20).")
    parser.add_argument(
        "--saida", type=Path,
        default=Path(__file__).resolve().parent.parent / "docs",
        help="Pasta para PDFs e manifestos.",
    )
    parser.add_argument("--email", help="E-mail de contato enviado no User-Agent (recomendado).")
    parser.add_argument("--pausa", type=float, default=0.5, help="Pausa entre downloads, em segundos.")
    parser.add_argument("--simular", action="store_true", help="Lista resultados sem baixar PDFs.")
    args = parser.parse_args()
    if args.limite < 1 or args.limite > 1000:
        parser.error("--limite deve estar entre 1 e 1000")
    if args.ano_inicio and args.ano_fim and args.ano_inicio > args.ano_fim:
        parser.error("--de nao pode ser maior que --ate")
    if args.pausa < 0:
        parser.error("--pausa nao pode ser negativa")
    return args


def montar_consulta(args: argparse.Namespace) -> str:
    # Europe PMC usa o codigo bibliografico ISO 639-2 "por" para portugues.
    # O filtro brasileiro combina afiliacao no Brasil e periodicos nacionais.
    partes = [DEFAULT_QUERY, "LANG:por", BRAZIL_FILTER, "OPEN_ACCESS:Y"]
    if args.tema.strip():
        tema = args.tema.strip().replace('"', " ")
        alternativas = [f'TITLE_ABS:"{tema}"', f'BODY:"{tema}"']
        nome_escala = re.sub(r"^escala\s+de\s+", "", tema, flags=re.IGNORECASE).strip()
        if nome_escala != tema and nome_escala:
            alternativas.extend((f'TITLE_ABS:"{nome_escala}"', f'BODY:"{nome_escala}"'))
        partes.append("(" + " OR ".join(alternativas) + ")")
    if args.ano_inicio or args.ano_fim:
        inicio = args.ano_inicio or 1800
        fim = args.ano_fim or datetime.now().year
        partes.append(f"FIRST_PDATE:[{inicio}-01-01 TO {fim}-12-31]")
    return " AND ".join(partes)


def requisitar(url: str, email: str | None, tentativas: int = 3) -> bytes:
    agente = USER_AGENT + (f"; contact={email}" if email else "")
    ultimo_erro: Exception | None = None
    for tentativa in range(tentativas):
        try:
            req = Request(url, headers={"User-Agent": agente, "Accept": "application/json, application/pdf"})
            with urlopen(req, timeout=45) as resposta:
                return resposta.read()
        except (HTTPError, URLError, TimeoutError) as exc:
            ultimo_erro = exc
            if tentativa + 1 < tentativas:
                time.sleep(2 ** tentativa)
    dica = ""
    if "CERTIFICATE_VERIFY_FAILED" in str(ultimo_erro) and truststore is None:
        dica = " Instale os certificados nativos com: python -m pip install --user truststore"
    raise RuntimeError(f"falha apos {tentativas} tentativas: {ultimo_erro}.{dica}")


def buscar(consulta: str, limite: int, email: str | None) -> list[dict[str, Any]]:
    resultados: list[dict[str, Any]] = []
    cursor = "*"
    while len(resultados) < limite:
        params = urlencode({
            "query": consulta, "format": "json", "resultType": "core",
            "pageSize": min(100, limite - len(resultados)), "cursorMark": cursor,
        })
        dados = json.loads(requisitar(f"{API_URL}?{params}", email))
        lote = dados.get("resultList", {}).get("result", [])
        if not lote:
            break
        resultados.extend(lote)
        novo_cursor = dados.get("nextCursorMark")
        if not novo_cursor or novo_cursor == cursor:
            break
        cursor = novo_cursor
    return resultados[:limite]


def url_pdf(artigo: dict[str, Any]) -> str:
    lista = artigo.get("fullTextUrlList", {}).get("fullTextUrl", [])
    if isinstance(lista, dict):
        lista = [lista]
    for item in lista:
        url = str(item.get("url", ""))
        estilo = str(item.get("documentStyle", "")).lower()
        acesso = str(item.get("availability", "")).lower()
        if url.startswith("https://") and (estilo == "p" or ".pdf" in url.lower()) and "open" in acesso:
            return url
    pmcid = str(artigo.get("pmcid", ""))
    if pmcid:
        return f"https://europepmc.org/articles/{pmcid}?pdf=render"
    return ""


def slug(texto: str, maximo: int = 100) -> str:
    normal = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()
    normal = re.sub(r"[^a-zA-Z0-9]+", "-", normal).strip("-").lower()
    return (normal[:maximo].rstrip("-") or "artigo")


def registro(artigo: dict[str, Any]) -> dict[str, str]:
    titulo = str(artigo.get("title") or "Artigo sem titulo")
    identificador = str(artigo.get("pmcid") or artigo.get("doi") or artigo.get("id") or slug(titulo))
    return {
        "id": identificador,
        "titulo": titulo,
        "autores": str(artigo.get("authorString") or ""),
        "revista": str(artigo.get("journalTitle") or ""),
        "ano": str(artigo.get("pubYear") or ""),
        "doi": str(artigo.get("doi") or ""),
        "pmcid": str(artigo.get("pmcid") or ""),
        "idioma": "portugues",
        "criterio_brasil": criterio_brasileiro(artigo),
        "licenca": str(artigo.get("license") or "acesso aberto; consulte o PDF"),
        "url_pdf": url_pdf(artigo),
        "arquivo": "", "status": "pendente", "erro": "",
    }


def criterio_brasileiro(artigo: dict[str, Any]) -> str:
    """Explica qual sinal brasileiro presente nos metadados aceitou o artigo."""
    revista = str(artigo.get("journalTitle") or "")
    revistas_brasileiras = (
        "revista brasileira de enfermagem", "texto & contexto enfermagem",
        "revista latino-americana de enfermagem", "acta paulista de enfermagem",
        "escola anna nery", "revista da escola de enfermagem da usp",
    )
    if any(nome in revista.lower() for nome in revistas_brasileiras):
        return "periodico brasileiro de enfermagem"
    metadados = json.dumps(artigo, ensure_ascii=False).lower()
    if "brasil" in metadados or "brazil" in metadados:
        return "afiliacao de autor no Brasil"
    return "filtro brasileiro da busca"


def carregar_registros(caminho: Path) -> dict[str, dict[str, str]]:
    if not caminho.exists():
        return {}
    try:
        dados = json.loads(caminho.read_text(encoding="utf-8"))
        return {
            str(item["id"]): {campo: str(item.get(campo, "")) for campo in CSV_FIELDS}
            for item in dados.get("artigos", []) if item.get("id")
        }
    except (OSError, ValueError, TypeError):
        return {}


def salvar_manifestos(saida: Path, itens: Iterable[dict[str, str]], consulta: str) -> None:
    registros = list(itens)
    (saida / "manifesto.json").write_text(json.dumps({
        "atualizado_em": datetime.now(timezone.utc).isoformat(),
        "fonte": "Europe PMC", "consulta": consulta, "artigos": registros,
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    with (saida / "manifesto.csv").open("w", encoding="utf-8-sig", newline="") as arquivo:
        escritor = csv.DictWriter(arquivo, fieldnames=CSV_FIELDS)
        escritor.writeheader()
        escritor.writerows(registros)


def main() -> int:
    args = argumentos()
    consulta = montar_consulta(args)
    args.saida.mkdir(parents=True, exist_ok=True)
    manifesto = args.saida / "manifesto.json"
    anteriores = carregar_registros(manifesto)
    print(f"Buscando no Europe PMC: {consulta}")
    try:
        # Busca tambem alem dos primeiros resultados ja presentes no manifesto.
        # Assim, execucoes seguintes encontram artigos diferentes em vez de apenas
        # reencontrar e ignorar sempre o mesmo conjunto inicial.
        limite_busca = min(1000, args.limite + len(anteriores))
        artigos = buscar(consulta, limite_busca, args.email)
    except (RuntimeError, ValueError) as exc:
        print(f"Erro na busca: {exc}", file=sys.stderr)
        return 1

    novos: list[dict[str, str]] = []
    for numero, artigo in enumerate(artigos, 1):
        if len(novos) >= args.limite:
            break
        item = registro(artigo)
        print(f"[{numero}/{len(artigos)}] {item['titulo']}")
        if item["id"] in anteriores:
            existente = anteriores[item["id"]]
            arquivo_existente = args.saida / existente.get("arquivo", "")
            if existente.get("arquivo") and arquivo_existente.exists():
                print("  Ja existe; download ignorado.")
                continue
        elif not item["url_pdf"]:
            item["status"] = "PDF aberto nao localizado"
        elif args.simular:
            item["status"] = "simulacao"
        else:
            nome = f"{slug(item['id'], 35)}-{slug(item['titulo'])}.pdf"
            destino = args.saida / nome
            try:
                conteudo = requisitar(item["url_pdf"], args.email)
                if not conteudo.lstrip().startswith(b"%PDF-"):
                    raise ValueError("a resposta nao e um arquivo PDF")
                destino.write_bytes(conteudo)
                item["arquivo"] = nome
                item["status"] = "baixado"
            except (RuntimeError, ValueError, OSError) as exc:
                item["status"] = "erro"
                item["erro"] = str(exc)
            time.sleep(args.pausa)
        anteriores.pop(item["id"], None)
        novos.append(item)

    registros = list(anteriores.values()) + novos
    salvar_manifestos(args.saida, registros, consulta)
    baixados = sum(item["status"] == "baixado" for item in novos)
    print(f"Concluido: {baixados} PDF(s) baixado(s); {len(novos)} novo(s) registro(s).")
    print(f"Manifesto: {manifesto}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
