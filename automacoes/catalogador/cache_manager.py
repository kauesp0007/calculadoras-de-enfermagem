"""Sistema de cache em disco para reduzir chamadas à API DeepSeek.

Estratégia:
    - Cacheia a resposta completa da IA por hash SHA-256 do documento.
    - Documentos com mesmo conteúdo (hash) nunca chamam a API novamente.
    - O cache é um arquivo JSON simples, carregado em memória.
"""

import json
import threading
from pathlib import Path
from typing import Optional

from .config import CACHE_PATH
from .logger import get_logger

log = get_logger("cache_manager")


class CacheManager:
    """Gerencia cache em disco para respostas da API DeepSeek."""

    def __init__(self, cache_path: Optional[Path] = None):
        self.cache_path = cache_path or CACHE_PATH
        self._cache: dict = {}
        self._lock = threading.Lock()
        self._carregar()

    def _carregar(self):
        """Carrega o cache do disco."""
        if self.cache_path.exists():
            try:
                with open(self.cache_path, "r", encoding="utf-8") as f:
                    self._cache = json.load(f)
                log.debug("Cache carregado: %d entradas", len(self._cache))
            except (json.JSONDecodeError, IOError) as e:
                log.warning("Cache corrompido ou ilegível: %s. Criando novo.", e)
                self._cache = {}
        else:
            self._cache = {}

    def _salvar(self):
        """Persiste o cache em disco (thread-safe)."""
        with self._lock:
            try:
                self.cache_path.parent.mkdir(parents=True, exist_ok=True)
                with open(self.cache_path, "w", encoding="utf-8") as f:
                    json.dump(self._cache, f, ensure_ascii=False, indent=2)
            except IOError as e:
                log.error("Erro ao salvar cache: %s", e)

    def get(self, hash_sha256: str) -> Optional[dict]:
        """Busca uma entrada no cache pelo hash do documento.

        Args:
            hash_sha256: Hash SHA-256 do arquivo PDF.

        Returns:
            Dicionário com a resposta da IA ou None.
        """
        entry = self._cache.get(hash_sha256)
        if entry:
            log.debug("Cache HIT para hash=%s...", hash_sha256[:12])
        return entry

    def set(self, hash_sha256: str, dados: dict):
        """Armazena uma entrada no cache.

        Args:
            hash_sha256: Hash SHA-256 do arquivo PDF.
            dados: Dicionário com a resposta da IA.
        """
        self._cache[hash_sha256] = dados
        log.debug("Cache SET para hash=%s...", hash_sha256[:12])
        # Salva de forma assíncrona simples (evita I/O frequente)
        if len(self._cache) % 5 == 0:  # salva a cada 5 novas entradas
            self._salvar()

    def flush(self):
        """Força a persistência do cache em disco."""
        self._salvar()
        log.info("Cache persistido: %d entradas", len(self._cache))

    def remover(self, hash_sha256: str):
        """Remove uma entrada do cache."""
        if hash_sha256 in self._cache:
            del self._cache[hash_sha256]
            log.debug("Entrada removida do cache: %s...", hash_sha256[:12])

    def limpar(self):
        """Limpa todo o cache."""
        self._cache = {}
        self._salvar()
        log.info("Cache limpo.")

    @property
    def tamanho(self) -> int:
        """Número de entradas no cache."""
        return len(self._cache)

    def contem(self, hash_sha256: str) -> bool:
        """Verifica se o hash está no cache."""
        return hash_sha256 in self._cache
