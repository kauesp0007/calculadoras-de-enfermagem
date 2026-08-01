from typing import Any

import cv2
import numpy as np

from config import (
    ALTURA_MAXIMA_OBJETO,
    AREA_MINIMA,
    LARGURA_MAXIMA_OBJETO,
    TEMP,
)


def detectar_regioes(imagem: np.ndarray) -> list[dict[str, Any]]:
    """Detecta componentes gráficos e retorna suas bounding boxes."""

    print("\n========================================")
    print("ETAPA 02 - DETECTAR OBJETOS")
    print("========================================")

    if not isinstance(imagem, np.ndarray) or imagem.size == 0:
        raise ValueError("A imagem recebida para detecção é inválida.")

    resultado = imagem.copy()
    cinza = cv2.cvtColor(imagem, cv2.COLOR_BGR2GRAY)
    _, threshold = cv2.threshold(cinza, 245, 255, cv2.THRESH_BINARY_INV)
    contornos, _ = cv2.findContours(
        threshold,
        cv2.RETR_LIST,
        cv2.CHAIN_APPROX_SIMPLE,
    )
    objetos: list[dict[str, Any]] = []

    for contorno in contornos:
        area = cv2.contourArea(contorno)

        if area < AREA_MINIMA:
            continue

        x, y, largura, altura = cv2.boundingRect(contorno)

        if largura > LARGURA_MAXIMA_OBJETO or altura > ALTURA_MAXIMA_OBJETO:
            continue

        identificador = len(objetos) + 1
        nome_arquivo = f"objeto_{identificador:03d}.png"
        objetos.append(
            {
                "id": identificador,
                "x": x,
                "y": y,
                "w": largura,
                "h": altura,
                "area": int(area),
                "arquivo": nome_arquivo,
            }
        )
        cv2.rectangle(
            resultado,
            (x, y),
            (x + largura, y + altura),
            (0, 255, 0),
            2,
        )

    TEMP.mkdir(parents=True, exist_ok=True)
    arquivo_debug = TEMP / "objetos_detectados.png"
    sucesso = cv2.imwrite(str(arquivo_debug), resultado)

    if not sucesso or not arquivo_debug.is_file():
        raise RuntimeError(f"Falha ao salvar imagem de detecção: {arquivo_debug}")

    print(f"Objetos encontrados: {len(objetos)}")
    return objetos
