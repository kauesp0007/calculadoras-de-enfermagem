from pathlib import Path

import cv2
import numpy as np


def abrir_imagem(caminho: Path) -> np.ndarray:
    """Abre e valida uma imagem utilizando OpenCV."""

    print("\n========================================")
    print("ETAPA 01 - ABRIR IMAGEM")
    print("========================================")

    if not caminho.is_file():
        raise FileNotFoundError(f"Imagem não encontrada: {caminho}")

    imagem = cv2.imread(str(caminho), cv2.IMREAD_COLOR)

    if imagem is None:
        raise RuntimeError(f"O OpenCV não conseguiu abrir a imagem: {caminho}")

    if imagem.ndim != 3 or imagem.shape[2] != 3:
        raise ValueError(f"Imagem com canais inválidos: {caminho}")

    altura, largura, canais = imagem.shape

    if largura <= 0 or altura <= 0:
        raise ValueError(f"Imagem com dimensões inválidas: {caminho}")

    print(f"Arquivo: {caminho.name}")
    print(f"Largura: {largura}px")
    print(f"Altura: {altura}px")
    print(f"Canais: {canais}")
    return imagem
