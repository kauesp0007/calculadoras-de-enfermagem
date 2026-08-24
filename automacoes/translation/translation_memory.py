"""Memória de tradução persistente em SQLite.

Chave = SHA256(idioma_origem + idioma_destino + tipo + contexto + texto).
Consultada ANTES de qualquer chamada à API; reutilizada entre páginas.
"""

import sqlite3
from datetime import datetime, timezone

from automacoes.translation import config

_CRIAR_TABELA = """
CREATE TABLE IF NOT EXISTS traducoes (
    hash TEXT PRIMARY KEY,
    idioma_origem TEXT NOT NULL,
    idioma_destino TEXT NOT NULL,
    tipo TEXT NOT NULL,
    contexto TEXT NOT NULL,
    texto_original TEXT NOT NULL,
    texto_traduzido TEXT NOT NULL,
    criado_em TEXT NOT NULL
)
"""

_CRIAR_INDICE = """
CREATE INDEX IF NOT EXISTS idx_traducoes_destino
ON traducoes (idioma_destino, tipo)
"""


class MemoriaTraducao:
    """API simples sobre o banco SQLite da memória de tradução."""

    def __init__(self, caminho=None):
        self.caminho = str(caminho or config.CAMINHO_MEMORIA)
        config.PASTA_CACHE.mkdir(parents=True, exist_ok=True)
        self._conexao = sqlite3.connect(self.caminho)
        with self._conexao:
            self._conexao.execute(_CRIAR_TABELA)
            self._conexao.execute(_CRIAR_INDICE)

    # ---------- LEITURA ----------

    def obter(self, hash):
        cur = self._conexao.execute(
            "SELECT texto_traduzido FROM traducoes WHERE hash = ?", (hash,)
        )
        linha = cur.fetchone()
        return linha[0] if linha else None

    def obter_muitos(self, hashes):
        if not hashes:
            return {}
        placeholders = ",".join("?" for _ in hashes)
        cur = self._conexao.execute(
            f"SELECT hash, texto_traduzido FROM traducoes "
            f"WHERE hash IN ({placeholders})",
            tuple(hashes),
        )
        return {h: t for h, t in cur.fetchall()}

    def existe(self, hash):
        cur = self._conexao.execute(
            "SELECT 1 FROM traducoes WHERE hash = ?", (hash,)
        )
        return cur.fetchone() is not None

    # ---------- ESCRITA ----------

    def gravar(self, hash, idioma_origem, idioma_destino, tipo, contexto,
               texto_original, texto_traduzido):
        agora = datetime.now(timezone.utc).isoformat(timespec="seconds")
        self._conexao.execute(
            "INSERT OR REPLACE INTO traducoes VALUES (?,?,?,?,?,?,?,?)",
            (hash, idioma_origem, idioma_destino, tipo, contexto,
             texto_original, texto_traduzido, agora),
        )
        self._conexao.commit()

    def gravar_muitos(self, registros):
        """registros: lista de tuplas
        (hash, origem, destino, tipo, contexto, original, traduzido)."""
        if not registros:
            return
        agora = datetime.now(timezone.utc).isoformat(timespec="seconds")
        linhas = [
            (r[0], r[1], r[2], r[3], r[4], r[5], r[6], agora)
            for r in registros
        ]
        self._conexao.executemany(
            "INSERT OR REPLACE INTO traducoes VALUES (?,?,?,?,?,?,?,?)", linhas
        )
        self._conexao.commit()

    # ---------- ESTATÍSTICAS ----------

    def estatisticas(self):
        total = self._conexao.execute(
            "SELECT COUNT(*) FROM traducoes"
        ).fetchone()[0]
        por_idioma = self._conexao.execute(
            "SELECT idioma_destino, COUNT(*) FROM traducoes "
            "GROUP BY idioma_destino ORDER BY 2 DESC"
        ).fetchall()
        return {"total": total, "por_idioma": dict(por_idioma)}

    def fechar(self):
        self._conexao.close()
