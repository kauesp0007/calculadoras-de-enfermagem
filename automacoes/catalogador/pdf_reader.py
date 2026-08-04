"""Extração de metadados e texto de PDFs.

Utiliza PyMuPDF (fitz) como leitor principal e pdfplumber como fallback.
"""

from pathlib import Path
from typing import Optional

import fitz  # PyMuPDF

from .config import PDF_MAX_PAGES_TEXT, PDF_MIN_CHARS_FOR_TEXT
from .logger import get_logger

log = get_logger("pdf_reader")


class PDFReader:
    """Lê e extrai metadados e texto de arquivos PDF."""

    def __init__(self, caminho: Path):
        """Inicializa o leitor para um arquivo PDF.

        Args:
            caminho: Caminho para o arquivo PDF.
        """
        self.caminho = caminho
        self._doc: Optional[fitz.Document] = None

    @property
    def doc(self) -> fitz.Document:
        """Abre o documento PyMuPDF (com cache)."""
        if self._doc is None:
            self._doc = fitz.open(str(self.caminho))
        return self._doc

    def close(self):
        """Fecha o documento."""
        if self._doc:
            self._doc.close()
            self._doc = None

    # ── Metadados ────────────────────────────────────────────────────

    def extrair_metadados(self) -> dict:
        """Extrai metadados internos do PDF.

        Returns:
            Dicionário com metadados (título, autor, assunto, etc.).
        """
        try:
            meta = self.doc.metadata or {}
        except Exception as e:
            log.warning("Erro ao ler metadados de %s: %s", self.caminho.name, e)
            meta = {}

        # Normaliza: converte None para string vazia
        resultado = {}
        for chave in ("title", "author", "subject", "keywords", "creator",
                       "producer", "creationDate", "modDate", "trapped",
                       "format", "encryption"):
            valor = meta.get(chave)
            resultado[chave] = valor.strip() if isinstance(valor, str) else ""

        # Extrai datas do formato PDF (D:YYYYMMDDHHmmSS)
        for campo_data in ("creationDate", "modDate"):
            raw = resultado.get(campo_data, "")
            if raw.startswith("D:"):
                resultado[campo_data + "_iso"] = self._parse_pdf_date(raw)
            else:
                resultado[campo_data + "_iso"] = raw

        # Tenta extrair metadados XMP (mais ricos)
        try:
            xmp = self.doc.xref_get_key(-1, "Metadata")
            if xmp and len(xmp) > 1:
                resultado["xmp_raw"] = xmp[1][:5000]  # limita tamanho
        except Exception:
            resultado["xmp_raw"] = ""

        return resultado

    @staticmethod
    def _parse_pdf_date(pdf_date: str) -> str:
        """Converte data PDF (D:20230101120000+01'00') para ISO 8601."""
        import re
        match = re.match(
            r"D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})", pdf_date
        )
        if match:
            y, m, d, h, mi, s = match.groups()
            return f"{y}-{m}-{d}T{h}:{mi}:{s}"
        return pdf_date

    # ── Texto ────────────────────────────────────────────────────────

    def extrair_texto(self, max_paginas: Optional[int] = None) -> str:
        """Extrai texto do PDF usando PyMuPDF.

        Args:
            max_paginas: Máximo de páginas a extrair. Default: PDF_MAX_PAGES_TEXT.

        Returns:
            Texto concatenado de todas as páginas processadas.
        """
        max_paginas = max_paginas or PDF_MAX_PAGES_TEXT
        total = min(len(self.doc), max_paginas)
        partes = []

        for i in range(total):
            try:
                pagina = self.doc[i]
                texto = pagina.get_text("text")
                if texto:
                    partes.append(texto.strip())
            except Exception as e:
                log.debug("Erro ao extrair texto da página %d de %s: %s",
                          i + 1, self.caminho.name, e)

        texto_completo = "\n\n".join(partes)
        return texto_completo

    def extrair_texto_pdfplumber(self, max_paginas: Optional[int] = None) -> str:
        """Fallback: extrai texto usando pdfplumber (melhor para tabelas).

        Args:
            max_paginas: Máximo de páginas. Default: PDF_MAX_PAGES_TEXT.

        Returns:
            Texto extraído ou string vazia em caso de falha.
        """
        try:
            import pdfplumber
        except ImportError:
            log.warning("pdfplumber não instalado. Instale com: pip install pdfplumber")
            return ""

        max_paginas = max_paginas or PDF_MAX_PAGES_TEXT
        partes = []

        try:
            with pdfplumber.open(str(self.caminho)) as pdf:
                total = min(len(pdf.pages), max_paginas)
                for i in range(total):
                    try:
                        texto = pdf.pages[i].extract_text()
                        if texto:
                            partes.append(texto.strip())
                    except Exception as e:
                        log.debug("pdfplumber erro pág %d de %s: %s",
                                  i + 1, self.caminho.name, e)
        except Exception as e:
            log.warning("pdfplumber falhou ao abrir %s: %s", self.caminho.name, e)

        return "\n\n".join(partes)

    # ── Informações ──────────────────────────────────────────────────

    @property
    def num_paginas(self) -> int:
        """Número total de páginas do PDF."""
        try:
            return len(self.doc)
        except Exception:
            return 0

    @property
    def tamanho_bytes(self) -> int:
        """Tamanho do arquivo em bytes."""
        try:
            return self.caminho.stat().st_size
        except OSError:
            return 0

    @property
    def data_modificacao(self) -> str:
        """Data da última modificação do arquivo (ISO 8601)."""
        try:
            from datetime import datetime
            mtime = self.caminho.stat().st_mtime
            return datetime.fromtimestamp(mtime).isoformat()
        except OSError:
            return ""

    def tem_texto_suficiente(self, texto: str) -> bool:
        """Verifica se o texto extraído é suficiente ou precisa de OCR."""
        return len(texto.strip()) >= PDF_MIN_CHARS_FOR_TEXT

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()
