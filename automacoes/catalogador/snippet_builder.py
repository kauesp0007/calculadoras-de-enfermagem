"""Construtor de snippets para envio à API DeepSeek.

Monta trechos relevantes do documento para classificação semântica,
minimizando o consumo de tokens.

Envia APENAS:
    - Metadados internos do PDF
    - Capa (primeiros caracteres)
    - Primeiros headings/seções
    - Sumário (se detectado)
"""

from pathlib import Path
from typing import Optional

from .config import (
    SNIPPET_CAPA_CHARS,
    SNIPPET_HEADING_CHARS,
    SNIPPET_MAX_HEADINGS,
    SNIPPET_MAX_TOTAL_CHARS,
)
from .utils import detectar_sumario
from .logger import get_logger

log = get_logger("snippet_builder")


class SnippetBuilder:
    """Constrói o snippet otimizado para envio à IA."""

    def __init__(
        self,
        texto_completo: str,
        metadados: dict,
        num_paginas: int,
        nome_arquivo: str,
    ):
        """Inicializa o builder.

        Args:
            texto_completo: Texto completo extraído do PDF.
            metadados: Metadados internos (dict do PDFReader).
            num_paginas: Número total de páginas.
            nome_arquivo: Nome original do arquivo.
        """
        self.texto = texto_completo
        self.metadados = metadados
        self.num_paginas = num_paginas
        self.nome_arquivo = nome_arquivo

    def construir(self) -> dict:
        """Constrói o dicionário de snippet para envio à IA.

        Returns:
            Dicionário com as seções:
                - cabecalho: metadados + nome + páginas
                - capa: primeiros caracteres
                - headings: primeiras seções
                - sumario: sumário (se detectado)
                - total_chars: total de caracteres no snippet
        """
        snippet = {}

        # ── Cabeçalho ────────────────────────────────────────────────
        snippet["cabecalho"] = self._montar_cabecalho()

        # ── Capa ─────────────────────────────────────────────────────
        capa = self.texto[:SNIPPET_CAPA_CHARS].strip()
        snippet["capa"] = capa if capa else "(texto não disponível)"

        # ── Headings ─────────────────────────────────────────────────
        snippet["headings"] = self._extrair_headings()

        # ── Sumário ──────────────────────────────────────────────────
        sumario = detectar_sumario(self.texto)
        snippet["sumario"] = sumario if sumario else ""

        # ── Total ───────────────────────────────────────────────────
        total = sum(
            len(str(v)) for v in snippet.values() if isinstance(v, str)
        )
        snippet["total_chars"] = total

        # Trunca se exceder o limite
        if total > SNIPPET_MAX_TOTAL_CHARS:
            log.info(
                "Snippet excede limite (%d > %d chars). Truncando...",
                total, SNIPPET_MAX_TOTAL_CHARS,
            )
            snippet = self._truncar(snippet)

        return snippet

    def _montar_cabecalho(self) -> str:
        """Monta o cabeçalho com metadados e informações básicas."""
        meta = self.metadados
        partes = [
            f"NOME DO ARQUIVO: {self.nome_arquivo}",
            f"PÁGINAS: {self.num_paginas}",
        ]

        if meta.get("title"):
            partes.append(f"TÍTULO (metadado PDF): {meta['title']}")
        if meta.get("author"):
            partes.append(f"AUTOR (metadado PDF): {meta['author']}")
        if meta.get("subject"):
            partes.append(f"ASSUNTO (metadado PDF): {meta['subject']}")
        if meta.get("keywords"):
            partes.append(f"PALAVRAS-CHAVE (metadado PDF): {meta['keywords']}")
        if meta.get("creator"):
            partes.append(f"CRIADOR (software): {meta['creator']}")
        if meta.get("creationDate_iso"):
            partes.append(f"DATA CRIAÇÃO PDF: {meta['creationDate_iso']}")
        if meta.get("modDate_iso"):
            partes.append(f"DATA MODIFICAÇÃO PDF: {meta['modDate_iso']}")

        return "\n".join(partes)

    def _extrair_headings(self) -> str:
        """Extrai os primeiros headings/seções do texto.

        Estratégia: procura por linhas que parecem títulos de seção
        (caixa alta, numeradas, padrões como "1.", "Capítulo", etc.).
        """
        import re

        linhas = self.texto.split("\n")
        headings = []
        chars_total = 0

        # Padrões de heading
        padroes_heading = [
            r"^\d+[\.\)]\s+[A-ZÁÉÍÓÚÂÊÔÃÕÀÇ][\w\s,;:]+",  # 1. Título
            r"^(Capítulo|CAPÍTULO|Seção|SEÇÃO|Parte|PARTE)\s",
            r"^[A-ZÁÉÍÓÚÂÊÔÃÕÀÇ][A-ZÁÉÍÓÚÂÊÔÃÕÀÇ\s]{10,}$",  # CAIXA ALTA
        ]

        for linha in linhas:
            linha = linha.strip()
            if not linha or len(linha) < 5:
                continue

            for padrao in padroes_heading:
                if re.match(padrao, linha):
                    trecho = linha[:SNIPPET_HEADING_CHARS]
                    headings.append(trecho)
                    chars_total += len(trecho)
                    break

            if len(headings) >= SNIPPET_MAX_HEADINGS * 3:  # margem extra
                break

        # Limita ao máximo configurado
        headings = headings[:SNIPPET_MAX_HEADINGS]
        return "\n".join(headings)

    def _truncar(self, snippet: dict) -> dict:
        """Trunca o snippet para caber no limite de tokens."""
        limite_por_secao = SNIPPET_MAX_TOTAL_CHARS // 3
        for chave in ("capa", "headings", "sumario"):
            if chave in snippet and isinstance(snippet[chave], str):
                snippet[chave] = snippet[chave][:limite_por_secao]

        total = sum(
            len(str(v)) for v in snippet.values() if isinstance(v, str)
        )
        snippet["total_chars"] = total
        return snippet
