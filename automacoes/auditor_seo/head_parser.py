"""Parser cirúrgico do <head> — localiza, extrai e identifica posições."""

import re
import json
from pathlib import Path
from typing import Optional
from bs4 import BeautifulSoup, Tag

from .config import DOMINIO
from .logger import get_logger

log = get_logger("head_parser")


class HeadParser:
    """Analisa o <head> de um HTML e extrai elementos SEO com precisão."""

    def __init__(self, caminho: Path):
        self.caminho = caminho
        self.html_original = caminho.read_text(encoding="utf-8")
        self.soup = BeautifulSoup(self.html_original, "html.parser")
        self.head = self.soup.find("head")
        self._linhas = self.html_original.split("\n")

    # ── Canonical ────────────────────────────────────────────────────

    def get_canonical(self) -> Optional[str]:
        """Retorna o href do canonical existente, ou None."""
        tag = self.head.find("link", rel="canonical") if self.head else None
        if tag and tag.get("href"):
            return tag["href"].strip()
        return None

    def has_canonical(self) -> bool:
        """Verifica se existe uma tag canonical."""
        return self.get_canonical() is not None

    # ── OG:URL ──────────────────────────────────────────────────────

    def get_og_url(self) -> Optional[str]:
        """Retorna o content do og:url, ou None."""
        tag = self.head.find("meta", property="og:url") if self.head else None
        if tag and tag.get("content"):
            return tag["content"].strip()
        return None

    # ── Twitter:URL ─────────────────────────────────────────────────

    def get_twitter_url(self) -> Optional[str]:
        """Retorna o content do twitter:url, ou None."""
        tag = self.head.find("meta", attrs={"name": "twitter:url"}) if self.head else None
        if tag and tag.get("content"):
            return tag["content"].strip()
        return None

    # ── Hreflang ────────────────────────────────────────────────────

    def get_hreflangs(self) -> dict[str, str]:
        """Retorna dicionário {lang: href} de todos os hreflangs."""
        result = {}
        if not self.head:
            return result
        for tag in self.head.find_all("link", rel="alternate"):
            hreflang = tag.get("hreflang")
            href = tag.get("href")
            if hreflang and href:
                result[hreflang.strip()] = href.strip()
        return result

    # ── JSON-LD / Schema ────────────────────────────────────────────

    def get_jsonld(self) -> Optional[str]:
        """Retorna o conteúdo bruto do <script type='application/ld+json'>, ou None."""
        tag = self.head.find("script", type="application/ld+json") if self.head else None
        if tag and tag.string:
            return tag.string.strip()
        return None

    def get_jsonld_parsed(self) -> Optional[dict]:
        """Faz parse do JSON-LD e retorna como dict, ou None."""
        raw = self.get_jsonld()
        if not raw:
            return None
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            log.warning("JSON-LD inválido em %s", self.caminho.name)
            return None

    # ── Posições de inserção ────────────────────────────────────────

    def encontrar_linha(self, marcador: str) -> int:
        """Encontra o número da linha (0-based) que contém o marcador."""
        for i, linha in enumerate(self._linhas):
            if marcador in linha:
                return i
        return -1

    def posicao_para_canonical(self) -> int:
        """Linha onde inserir canonical (antes do Favicon)."""
        linha = self.encontrar_linha("<!-- 9. Favicon -->")
        if linha >= 0:
            return linha
        linha = self.encontrar_linha("rel=\"icon\"")
        return linha if linha >= 0 else self.encontrar_linha("</head>") - 1

    def posicao_para_twitter_url(self) -> int:
        """Linha onde inserir twitter:url (após twitter:description ou twitter:image)."""
        for marcador in ("name=\"twitter:image\"", "name=\"twitter:description\"",
                          "name=\"twitter:title\"", "name=\"twitter:card\""):
            linha = self.encontrar_linha(marcador)
            if linha >= 0:
                return linha + 1
        return -1

    def posicao_para_jsonld(self) -> int:
        """Linha onde inserir JSON-LD (antes de <!-- 11. Outros Scripts -->)."""
        linha = self.encontrar_linha("<!-- 11. Outros Scripts")
        if linha >= 0:
            return linha
        linha = self.encontrar_linha("</head>")
        return linha - 1 if linha >= 0 else -1

    def posicao_para_hreflang(self) -> int:
        """Linha onde inserir hreflangs (dentro da seção 8, após canonical)."""
        linha = self.encontrar_linha("rel=\"canonical\"")
        if linha >= 0:
            return linha + 1
        return self.posicao_para_canonical()

    def get_indentacao(self, linha_num: int) -> str:
        """Extrai a indentação (espaços/tabs) de uma linha."""
        if 0 <= linha_num < len(self._linhas):
            linha = self._linhas[linha_num]
            match = re.match(r"^(\s*)", linha)
            return match.group(1) if match else ""
        return ""
