"""Motor de OCR para PDFs digitalizados.

Utiliza Tesseract OCR via pytesseract com pré-processamento de imagem via Pillow.
"""

import os
import sys
from pathlib import Path
from typing import Optional

import fitz  # PyMuPDF

from .config import OCR_LANG, OCR_DPI, PDF_MAX_PAGES_TEXT
from .logger import get_logger

log = get_logger("ocr_engine")

# ── Configuração automática do Tesseract ───────────────────────────────

def _configurar_tesseract():
    """Localiza e configura o caminho do executável Tesseract."""
    import pytesseract

    # Caminhos comuns de instalação no Windows
    caminhos_windows = [
        Path(os.environ.get("ProgramFiles", "C:\\Program Files")) / "Tesseract-OCR" / "tesseract.exe",
        Path(os.environ.get("ProgramFiles(x86)", "C:\\Program Files (x86)")) / "Tesseract-OCR" / "tesseract.exe",
        Path(os.environ.get("LOCALAPPDATA", "")) / "Tesseract-OCR" / "tesseract.exe",
    ]

    for caminho in caminhos_windows:
        if caminho.exists():
            pytesseract.pytesseract.tesseract_cmd = str(caminho)
            log.debug("Tesseract configurado: %s", caminho)
            return

    # Linux/Mac: confia no PATH
    log.debug("Tesseract não encontrado em paths padrão, confiando no PATH do sistema.")

_configurar_tesseract()


class OCREngine:
    """Executa OCR em PDFs digitalizados (scanned)."""

    def __init__(self, caminho: Path):
        """Inicializa o motor de OCR.

        Args:
            caminho: Caminho para o arquivo PDF.
        """
        self.caminho = caminho
        self._doc: Optional[fitz.Document] = None
        self._tesseract_disponivel: Optional[bool] = None

    @property
    def doc(self) -> fitz.Document:
        if self._doc is None:
            self._doc = fitz.open(str(self.caminho))
        return self._doc

    def close(self):
        if self._doc:
            self._doc.close()
            self._doc = None

    @property
    def tesseract_disponivel(self) -> bool:
        """Verifica se Tesseract OCR está instalado e acessível."""
        if self._tesseract_disponivel is None:
            try:
                import pytesseract
                pytesseract.get_tesseract_version()
                self._tesseract_disponivel = True
            except Exception:
                log.warning(
                    "Tesseract OCR não encontrado. Instale: "
                    "https://github.com/UB-Mannheim/tesseract/wiki"
                )
                self._tesseract_disponivel = False
        return self._tesseract_disponivel

    def extrair_texto_ocr(
        self, max_paginas: Optional[int] = None, idioma: Optional[str] = None
    ) -> str:
        """Executa OCR nas páginas do PDF.

        Para cada página:
            1. Renderiza como imagem (300 DPI)
            2. Pré-processa (binarização)
            3. Executa Tesseract

        Args:
            max_paginas: Máximo de páginas (default: PDF_MAX_PAGES_TEXT).
            idioma: Idioma para Tesseract (default: OCR_LANG = 'por').

        Returns:
            Texto reconhecido concatenado.
        """
        if not self.tesseract_disponivel:
            log.error("Tesseract indisponível. OCR cancelado para %s", self.caminho.name)
            return ""

        import pytesseract
        from PIL import Image

        max_paginas = max_paginas or PDF_MAX_PAGES_TEXT
        idioma = idioma or OCR_LANG
        total = min(len(self.doc), max_paginas)
        partes = []

        log.info("Iniciando OCR em %s (%d páginas)...", self.caminho.name, total)

        for i in range(total):
            try:
                pagina = self.doc[i]
                # Renderiza página como imagem (matriz de pixels)
                mat = pagina.get_pixmap(dpi=OCR_DPI)
                img = Image.frombytes("RGB", [mat.width, mat.height], mat.samples)

                # Pré-processamento: binarização (threshold)
                img = self._preprocessar(img)

                # OCR
                texto = pytesseract.image_to_string(img, lang=idioma)
                if texto.strip():
                    partes.append(texto.strip())
            except Exception as e:
                log.debug("OCR falhou na página %d de %s: %s",
                          i + 1, self.caminho.name, e)

        texto_final = "\n\n".join(partes)
        log.info(
            "OCR concluído para %s: %d caracteres extraídos de %d páginas",
            self.caminho.name, len(texto_final), total,
        )
        return texto_final

    @staticmethod
    def _preprocessar(img: "Image.Image") -> "Image.Image":
        """Pré-processa imagem para melhorar OCR.

        Aplica:
            1. Conversão para escala de cinza
            2. Binarização (threshold adaptativo)
        """
        from PIL import ImageOps

        # Escala de cinza
        img_gray = img.convert("L")

        # Autocontraste (equalização)
        img_eq = ImageOps.autocontrast(img_gray, cutoff=2)

        # Binarização: Otsu threshold
        try:
            img_bin = img_eq.point(lambda p: 255 if p > 140 else 0)
        except Exception:
            img_bin = img_eq

        return img_bin

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()
