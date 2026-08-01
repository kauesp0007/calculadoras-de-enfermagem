import json
import re
import unicodedata
from pathlib import Path
from typing import Any

from config import BASE_DIR, SAIDA


def normalizar_tag(texto: str) -> str:
    """Normaliza um texto curto para uso como tag pesquisável."""

    texto_normalizado = unicodedata.normalize("NFKD", texto)
    texto_ascii = texto_normalizado.encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "-", texto_ascii.lower()).strip("-")


def gerar_tags(componente: dict[str, Any]) -> list[str]:
    """Gera tags determinísticas a partir dos metadados do componente."""

    candidatos = [
        componente["categoria"],
        componente["tipo"],
        componente["nome"],
    ]
    tags: list[str] = []

    for candidato in candidatos:
        tag = normalizar_tag(candidato)

        if tag and tag not in tags:
            tags.append(tag)

    return tags


def validar_componente_webp(componente: Any) -> dict[str, Any]:
    """Valida metadados e existência física de um componente WEBP."""

    if not isinstance(componente, dict):
        raise TypeError("Cada componente WEBP deve ser um objeto.")

    campos = {
        "id",
        "nome",
        "tipo",
        "categoria",
        "arquivo",
        "largura",
        "altura",
        "descricao",
    }

    if set(componente) != campos:
        raise ValueError("Componente WEBP com estrutura inválida.")

    for campo in ("id", "largura", "altura"):
        if not isinstance(componente[campo], int) or componente[campo] <= 0:
            raise ValueError(f"O campo '{campo}' deve ser um inteiro positivo.")

    for campo in ("nome", "tipo", "categoria", "arquivo", "descricao"):
        if not isinstance(componente[campo], str):
            raise TypeError(f"O campo '{campo}' deve ser uma string.")

    arquivo = BASE_DIR / componente["arquivo"]

    if arquivo.suffix.lower() != ".webp" or not arquivo.is_file():
        raise FileNotFoundError(f"WEBP informado no manifesto não existe: {arquivo}")

    return componente


def montar_manifesto(
    componentes: list[dict[str, Any]],
    imagem_origem: Path,
) -> dict[str, Any]:
    """Monta e valida a estrutura completa do manifesto."""

    if not imagem_origem.is_file():
        raise FileNotFoundError(f"Imagem de origem não encontrada: {imagem_origem}")

    itens = []

    for item in componentes:
        componente = validar_componente_webp(item)
        itens.append({**componente, "tags": gerar_tags(componente)})

    manifesto = {
        "versao": "1.0",
        "origem": imagem_origem.name,
        "quantidade": len(itens),
        "componentes": itens,
    }

    texto_validado = json.dumps(manifesto, indent=4, ensure_ascii=False)
    return json.loads(texto_validado)


def gerar_manifest(
    componentes: list[dict[str, Any]],
    imagem_origem: Path,
) -> dict[str, Any]:
    """Gera o manifest.json dos componentes WEBP aprovados."""

    print("\n========================================")
    print("ETAPA 07 - GERAR MANIFEST")
    print("========================================")

    if not isinstance(componentes, list):
        raise TypeError("Os componentes WEBP devem ser uma lista.")

    manifesto = montar_manifesto(componentes, imagem_origem)
    SAIDA.mkdir(parents=True, exist_ok=True)
    arquivo = SAIDA / "manifest.json"

    with arquivo.open("w", encoding="utf-8") as fluxo:
        json.dump(manifesto, fluxo, indent=4, ensure_ascii=False)

    with arquivo.open("r", encoding="utf-8") as fluxo:
        manifesto_salvo = json.load(fluxo)

    if manifesto_salvo != manifesto:
        raise RuntimeError("O manifest.json salvo não corresponde ao conteúdo validado.")

    print(f"Componentes no manifesto: {manifesto['quantidade']}")
    print(f"Arquivo criado: {arquivo.name}")
    return manifesto
