import re
import unicodedata
from pathlib import Path
from typing import Any

import cv2

from config import BIBLIOTECA, QUALIDADE_WEBP


def normalizar_nome(texto: str) -> str:
    """Converte um nome em identificador seguro para arquivo."""

    texto_normalizado = unicodedata.normalize("NFKD", texto)
    texto_ascii = texto_normalizado.encode("ascii", "ignore").decode("ascii")
    nome = re.sub(r"[^a-z0-9]+", "_", texto_ascii.lower()).strip("_")
    return nome or "componente"


def validar_png(componente: dict[str, Any]) -> Path:
    """Valida e retorna o caminho PNG temporário de um componente aprovado."""

    caminho = componente.get("caminho_png")

    if not isinstance(caminho, Path):
        raise TypeError("O componente não possui um caminho PNG válido.")

    if not caminho.is_file():
        raise FileNotFoundError(f"PNG aprovado não encontrado: {caminho}")

    return caminho


def converter_componente(componente: dict[str, Any]) -> dict[str, Any]:
    """Converte um componente PNG aprovado para WEBP na biblioteca."""

    caminho_png = validar_png(componente)
    imagem = cv2.imread(str(caminho_png), cv2.IMREAD_UNCHANGED)

    if imagem is None:
        raise RuntimeError(f"OpenCV não conseguiu abrir: {caminho_png}")

    altura, largura = imagem.shape[:2]
    categoria = normalizar_nome(componente["categoria"])
    nome_base = normalizar_nome(componente["nome"])
    nome_arquivo = f"{componente['id']:03d}_{nome_base}.webp"
    pasta_categoria = BIBLIOTECA / categoria
    pasta_categoria.mkdir(parents=True, exist_ok=True)
    destino = pasta_categoria / nome_arquivo

    sucesso = cv2.imwrite(
        str(destino),
        imagem,
        [cv2.IMWRITE_WEBP_QUALITY, QUALIDADE_WEBP],
    )

    if not sucesso or not destino.is_file():
        raise RuntimeError(f"Falha ao exportar WEBP: {destino}")

    return {
        "id": componente["id"],
        "nome": componente["nome"],
        "tipo": componente["tipo"],
        "categoria": componente["categoria"],
        "arquivo": destino.relative_to(BIBLIOTECA.parent).as_posix(),
        "largura": largura,
        "altura": altura,
        "descricao": componente["descricao"],
    }


def exportar_webp(
    componentes: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Converte todos os componentes aprovados para WEBP."""

    print("\n========================================")
    print("ETAPA 06 - EXPORTAR WEBP")
    print("========================================")

    if not isinstance(componentes, list):
        raise TypeError("Os componentes aprovados devem ser uma lista.")

    componentes_webp = [
        converter_componente(componente)
        for componente in componentes
    ]

    print(f"WEBP gerados: {len(componentes_webp)}")
    print(f"Qualidade: {QUALIDADE_WEBP}")
    return componentes_webp
