from pathlib import Path
from typing import Any

import cv2
import numpy as np

from config import TEMP


def validar_objeto(
    objeto: Any,
    largura_imagem: int,
    altura_imagem: int,
) -> dict[str, Any]:
    """Valida os metadados e limites de um objeto detectado."""

    if not isinstance(objeto, dict):
        raise TypeError("Cada objeto detectado deve ser um dicionário.")

    campos = {"id", "x", "y", "w", "h", "area", "arquivo"}

    if set(objeto) != campos:
        raise ValueError("Objeto detectado com estrutura inválida.")

    for campo in ("id", "x", "y", "w", "h", "area"):
        if not isinstance(objeto[campo], int):
            raise TypeError(f"O campo '{campo}' deve ser inteiro.")

    if objeto["id"] <= 0 or objeto["w"] <= 0 or objeto["h"] <= 0:
        raise ValueError("Objeto com identificador ou dimensões inválidas.")

    if objeto["x"] < 0 or objeto["y"] < 0:
        raise ValueError("Objeto com coordenadas negativas.")

    if objeto["x"] + objeto["w"] > largura_imagem:
        raise ValueError("Objeto ultrapassa a largura da imagem.")

    if objeto["y"] + objeto["h"] > altura_imagem:
        raise ValueError("Objeto ultrapassa a altura da imagem.")

    if not isinstance(objeto["arquivo"], str):
        raise TypeError("O campo 'arquivo' deve ser uma string.")

    return objeto


def exportar_objetos(
    imagem: np.ndarray,
    objetos: list[dict[str, Any]],
) -> Path:
    """Recorta e exporta em PNG todos os objetos detectados."""

    print("\n========================================")
    print("ETAPA 03 - EXPORTAR OBJETOS")
    print("========================================")

    if not isinstance(imagem, np.ndarray) or imagem.size == 0:
        raise ValueError("A imagem recebida para exportação é inválida.")

    if not isinstance(objetos, list):
        raise TypeError("Os objetos detectados devem ser uma lista.")

    pasta = TEMP / "objetos"
    pasta.mkdir(parents=True, exist_ok=True)
    altura_imagem, largura_imagem = imagem.shape[:2]

    for item in objetos:
        objeto = validar_objeto(item, largura_imagem, altura_imagem)
        x = objeto["x"]
        y = objeto["y"]
        largura = objeto["w"]
        altura = objeto["h"]
        recorte = imagem[y:y + altura, x:x + largura]

        if recorte.size == 0:
            raise ValueError(f"Recorte vazio para o objeto {objeto['id']}.")

        arquivo = pasta / objeto["arquivo"]
        sucesso = cv2.imwrite(str(arquivo), recorte)

        if not sucesso or not arquivo.is_file():
            raise RuntimeError(f"Falha ao exportar objeto: {arquivo}")

    print(f"{len(objetos)} objetos exportados.")
    return pasta
