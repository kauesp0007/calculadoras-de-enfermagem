import shutil
from pathlib import Path
from typing import Any

from config import APROVADOS, CATEGORIAS_EXTRAIVEIS, TEMP


def validar_componente(componente: Any) -> dict[str, Any]:
    """Valida os campos necessários para filtrar um componente classificado."""

    if not isinstance(componente, dict):
        raise TypeError("Cada componente deve ser um objeto.")

    campos = {
        "id",
        "arquivo",
        "tipo",
        "categoria",
        "nome",
        "descricao",
        "extrair",
    }

    if set(componente) != campos:
        raise ValueError("Componente com estrutura inválida.")

    if not isinstance(componente["id"], int) or componente["id"] <= 0:
        raise ValueError("O id do componente deve ser um inteiro positivo.")

    for campo in ("arquivo", "tipo", "categoria", "nome", "descricao"):
        if not isinstance(componente[campo], str):
            raise TypeError(f"O campo '{campo}' deve ser uma string.")

    if not isinstance(componente["extrair"], bool):
        raise TypeError("O campo 'extrair' deve ser booleano.")

    return componente


def copiar_componente(componente: dict[str, Any]) -> dict[str, Any]:
    """Copia um PNG aprovado para a área temporária de componentes aprovados."""

    origem = TEMP / "objetos" / componente["arquivo"]

    if not origem.is_file():
        raise FileNotFoundError(f"Recorte classificado não encontrado: {origem}")

    APROVADOS.mkdir(parents=True, exist_ok=True)
    destino = APROVADOS / origem.name
    shutil.copy2(origem, destino)

    return {
        **componente,
        "caminho_png": destino,
    }


def extrair_objetos(layout: dict[str, Any]) -> list[dict[str, Any]]:
    """Filtra e copia somente os componentes úteis aprovados pela OpenAI."""

    print("\n========================================")
    print("ETAPA 05 - FILTRAR OBJETOS")
    print("========================================")

    componentes = layout.get("componentes")

    if not isinstance(componentes, list):
        raise ValueError("O layout não contém uma lista de componentes.")

    aprovados: list[dict[str, Any]] = []

    for item in componentes:
        componente = validar_componente(item)

        if not componente["extrair"]:
            continue

        if componente["categoria"] not in CATEGORIAS_EXTRAIVEIS:
            raise ValueError(
                "Componente aprovado com categoria não extraível: "
                f"{componente['categoria']}"
            )

        aprovados.append(copiar_componente(componente))

    print(f"Componentes classificados: {len(componentes)}")
    print(f"Componentes aprovados: {len(aprovados)}")
    return aprovados
