"""Gerenciamento do banco de dados SQLite.

Schema, migrações, CRUD e consultas para a tabela de documentos.
"""

import sqlite3
import json
from datetime import datetime
from pathlib import Path
from typing import Optional

from .config import DB_PATH
from .logger import get_logger

log = get_logger("database")

# ── Schema SQL ────────────────────────────────────────────────────────

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS documentos (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Identificação
    hash_sha256         TEXT NOT NULL UNIQUE,
    nome_original       TEXT NOT NULL,
    nome_novo           TEXT,
    caminho             TEXT NOT NULL,
    tamanho_bytes       INTEGER,

    -- Datas
    data_processamento  TEXT,
    data_modificacao    TEXT,
    versao              INTEGER DEFAULT 1,

    -- Metadados extraídos (campos semânticos)
    titulo              TEXT,
    subtitulo           TEXT,
    autor               TEXT,
    instituicao         TEXT,
    orgao_governamental TEXT,
    ministerio          TEXT,
    conselho            TEXT,
    universidade        TEXT,
    hospital            TEXT,
    secretaria_saude    TEXT,
    editora             TEXT,
    cidade              TEXT,
    estado              TEXT,
    pais                TEXT,
    idioma              TEXT,
    ano_publicacao      INTEGER,
    ano_revisao         INTEGER,
    versao_doc          TEXT,
    codigo_interno      TEXT,
    doi                 TEXT,
    isbn                TEXT,
    issn                TEXT,
    palavras_chave      TEXT,
    especialidade       TEXT,
    categoria           TEXT,
    tipo_documental     TEXT,
    resumo              TEXT,
    num_paginas         INTEGER,

    -- Classificação
    area_conhecimento   TEXT,
    status              TEXT DEFAULT 'processado',

    -- Erro
    erro_msg            TEXT,

    -- Auditoria
    created_at          TEXT DEFAULT (datetime('now','localtime')),
    updated_at          TEXT DEFAULT (datetime('now','localtime'))
);

CREATE INDEX IF NOT EXISTS idx_hash ON documentos(hash_sha256);
CREATE INDEX IF NOT EXISTS idx_categoria ON documentos(categoria);
CREATE INDEX IF NOT EXISTS idx_tipo ON documentos(tipo_documental);
CREATE INDEX IF NOT EXISTS idx_area ON documentos(area_conhecimento);
CREATE INDEX IF NOT EXISTS idx_status ON documentos(status);
CREATE INDEX IF NOT EXISTS idx_ano ON documentos(ano_publicacao);
CREATE INDEX IF NOT EXISTS idx_instituicao ON documentos(instituicao);
"""


class Database:
    """Gerencia a conexão e operações no banco SQLite."""

    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = db_path or DB_PATH
        self._conn: Optional[sqlite3.Connection] = None
        self._init_db()

    # ── Conexão ─────────────────────────────────────────────────────

    @property
    def conn(self) -> sqlite3.Connection:
        """Retorna conexão ativa, criando se necessário."""
        if self._conn is None:
            self._conn = sqlite3.connect(str(self.db_path))
            self._conn.row_factory = sqlite3.Row
            self._conn.execute("PRAGMA journal_mode=WAL")      # melhor performance
            self._conn.execute("PRAGMA foreign_keys=ON")
        return self._conn

    def close(self):
        """Fecha a conexão com o banco."""
        if self._conn:
            self._conn.close()
            self._conn = None

    def _init_db(self):
        """Cria as tabelas e índices se não existirem."""
        self.conn.executescript(SCHEMA_SQL)
        self.conn.commit()
        log.debug("Banco de dados inicializado: %s", self.db_path)

    # ── CRUD ────────────────────────────────────────────────────────

    def buscar_por_hash(self, hash_sha256: str) -> Optional[dict]:
        """Busca documento pelo hash SHA-256.

        Returns:
            Dicionário com os dados ou None se não encontrado.
        """
        row = self.conn.execute(
            "SELECT * FROM documentos WHERE hash_sha256 = ?",
            (hash_sha256,),
        ).fetchone()
        return dict(row) if row else None

    def buscar_por_nome_original(self, nome: str) -> list[dict]:
        """Busca todos os registros com determinado nome original."""
        rows = self.conn.execute(
            "SELECT * FROM documentos WHERE nome_original = ?",
            (nome,),
        ).fetchall()
        return [dict(r) for r in rows]

    def buscar_por_hash_e_nome(self, hash_sha256: str, nome: str) -> Optional[dict]:
        """Busca documento exato por hash + nome original."""
        row = self.conn.execute(
            "SELECT * FROM documentos WHERE hash_sha256 = ? AND nome_original = ?",
            (hash_sha256, nome),
        ).fetchone()
        return dict(row) if row else None

    def inserir(self, dados: dict) -> int:
        """Insere um novo documento no banco.

        Args:
            dados: Dicionário com os campos do documento.

        Returns:
            ID do registro inserido.
        """
        dados["updated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        if "created_at" not in dados:
            dados["created_at"] = dados["updated_at"]

        # Serializa campos JSON (autor, palavras_chave)
        for campo_json in ("autor", "palavras_chave"):
            if campo_json in dados and isinstance(dados[campo_json], (list, dict)):
                dados[campo_json] = json.dumps(dados[campo_json], ensure_ascii=False)

        colunas = ", ".join(dados.keys())
        placeholders = ", ".join("?" for _ in dados)
        valores = list(dados.values())

        cursor = self.conn.execute(
            f"INSERT INTO documentos ({colunas}) VALUES ({placeholders})",
            valores,
        )
        self.conn.commit()
        log.info("Documento inserido: %s (hash=%s...)", dados.get("nome_original"), dados.get("hash_sha256", "")[:12])
        return cursor.lastrowid

    def atualizar(self, hash_sha256: str, dados: dict) -> bool:
        """Atualiza um documento existente pelo hash.

        Args:
            hash_sha256: Hash do documento.
            dados: Campos a atualizar.

        Returns:
            True se atualizou, False se não encontrou.
        """
        dados["updated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # Serializa campos JSON
        for campo_json in ("autor", "palavras_chave"):
            if campo_json in dados and isinstance(dados[campo_json], (list, dict)):
                dados[campo_json] = json.dumps(dados[campo_json], ensure_ascii=False)

        set_clause = ", ".join(f"{k} = ?" for k in dados)
        valores = list(dados.values()) + [hash_sha256]

        cursor = self.conn.execute(
            f"UPDATE documentos SET {set_clause} WHERE hash_sha256 = ?",
            valores,
        )
        self.conn.commit()
        atualizou = cursor.rowcount > 0
        if atualizou:
            log.info("Documento atualizado: hash=%s...", hash_sha256[:12])
        return atualizou

    def upsert(self, hash_sha256: str, dados: dict) -> tuple[bool, bool]:
        """Insere ou atualiza (INSERT OR UPDATE).

        Returns:
            (inserido, atualizado): tupla de booleanos.
        """
        existente = self.buscar_por_hash(hash_sha256)
        if existente:
            return False, self.atualizar(hash_sha256, dados)
        else:
            dados["hash_sha256"] = hash_sha256
            self.inserir(dados)
            return True, False

    # ── Consultas ───────────────────────────────────────────────────

    def contar_por_status(self) -> dict:
        """Retorna contagem de documentos por status."""
        rows = self.conn.execute(
            "SELECT status, COUNT(*) as cnt FROM documentos GROUP BY status"
        ).fetchall()
        return {r["status"]: r["cnt"] for r in rows}

    def listar_todos(self) -> list[dict]:
        """Retorna todos os documentos ordenados por data de processamento."""
        rows = self.conn.execute(
            "SELECT * FROM documentos ORDER BY data_processamento DESC"
        ).fetchall()
        return [dict(r) for r in rows]

    def listar_com_erro(self) -> list[dict]:
        """Retorna documentos com status 'erro'."""
        rows = self.conn.execute(
            "SELECT * FROM documentos WHERE status = 'erro' ORDER BY data_processamento DESC"
        ).fetchall()
        return [dict(r) for r in rows]

    def listar_ultimos(self, limite: int = 10) -> list[dict]:
        """Retorna os documentos processados mais recentemente."""
        rows = self.conn.execute(
            "SELECT nome_original, nome_novo, status, erro_msg, data_processamento "
            "FROM documentos ORDER BY data_processamento DESC LIMIT ?",
            (limite,),
        ).fetchall()
        return [dict(r) for r in rows]

    def total_tokens(self) -> int:
        """Soma de tokens usados (se armazenado em metadados)."""
        # Placeholder para feature futura
        return 0

    # ── Limpeza ─────────────────────────────────────────────────────

    def limpar_tudo(self):
        """Remove todos os registros (uso com cautela)."""
        self.conn.execute("DELETE FROM documentos")
        self.conn.commit()
        log.warning("Todos os registros foram removidos do banco.")
