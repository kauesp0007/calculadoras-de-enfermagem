"""Gerador de saídas: renomeação de arquivos, JSON, CSV e atualização do DB.

Responsável por:
    1. Renomear o arquivo físico no disco
    2. Inserir/atualizar registro no SQLite
    3. Regenerar manifesto.json (índice completo)
    4. Regenerar manifesto.csv (índice completo)
"""

import json
import csv
import shutil
from datetime import datetime
from pathlib import Path
from typing import Optional

from .config import DOCS_DIR, MANIFESTO_JSON_PATH, MANIFESTO_CSV_PATH
from .database import Database
from .rename_engine import RenameEngine
from .logger import get_logger

log = get_logger("output_generator")


class OutputGenerator:
    """Gera todas as saídas do pipeline de catalogação."""

    def __init__(self, db: Database):
        self.db = db
        self.rename_engine = RenameEngine()

    # ── Renomeação ──────────────────────────────────────────────────

    def renomear_arquivo(
        self,
        caminho_original: Path,
        nome_novo: str,
        simular: bool = False,
    ) -> tuple[bool, Optional[Path]]:
        """Renomeia o arquivo PDF no disco.

        Args:
            caminho_original: Caminho atual do arquivo.
            nome_novo: Novo nome (já normalizado, com extensão .pdf).
            simular: Se True, apenas simula, não renomeia.

        Returns:
            (sucesso, novo_caminho): Tupla com resultado e novo Path.
        """
        novo_caminho = caminho_original.parent / nome_novo

        # Se já existe arquivo com o nome novo, adiciona sufixo
        if novo_caminho.exists() and novo_caminho != caminho_original:
            base = nome_novo[:-4]
            contador = 1
            while novo_caminho.exists():
                novo_nome = f"{base}_{contador}.pdf"
                novo_caminho = caminho_original.parent / novo_nome
                contador += 1
                if contador > 100:
                    log.error("Não foi possível gerar nome único para %s", nome_novo)
                    return False, None

        if simular:
            log.info("[SIMULAÇÃO] Renomearia: %s → %s", caminho_original.name, nome_novo)
            return True, novo_caminho

        try:
            caminho_original.rename(novo_caminho)
            log.info("Renomeado: %s → %s", caminho_original.name, nome_novo)
            return True, novo_caminho
        except OSError as e:
            log.error("Erro ao renomear %s: %s", caminho_original.name, e)
            # Fallback: copia + remove original
            try:
                shutil.copy2(caminho_original, novo_caminho)
                caminho_original.unlink()
                log.info("Renomeado (fallback copy): %s → %s", caminho_original.name, nome_novo)
                return True, novo_caminho
            except OSError as e2:
                log.error("Falha no fallback de renomeação: %s", e2)
                return False, None

    # ── Registro no Banco ───────────────────────────────────────────

    def salvar_registro(
        self,
        hash_sha256: str,
        nome_original: str,
        nome_novo: str,
        caminho: Path,
        tamanho_bytes: int,
        num_paginas: int,
        metadados_ia: dict,
        versao: int = 1,
    ) -> bool:
        """Salva o registro completo no banco de dados.

        Args:
            hash_sha256: Hash do arquivo.
            nome_original: Nome original do arquivo.
            nome_novo: Novo nome gerado.
            caminho: Caminho completo do arquivo.
            tamanho_bytes: Tamanho em bytes.
            num_paginas: Número de páginas.
            metadados_ia: Dicionário com metadados extraídos pela IA.
            versao: Versão do documento (1 = novo, 2+ = revisão).

        Returns:
            True se salvou com sucesso.
        """
        try:
            dados = {
                "hash_sha256": hash_sha256,
                "nome_original": nome_original,
                "nome_novo": nome_novo,
                "caminho": str(caminho),
                "tamanho_bytes": tamanho_bytes,
                "num_paginas": num_paginas,
                "data_processamento": datetime.now().isoformat(),
                "data_modificacao": datetime.fromtimestamp(
                    caminho.stat().st_mtime
                ).isoformat() if caminho.exists() else "",
                "versao": versao,
                "status": "processado",
                **metadados_ia,  # espalha todos os metadados da IA
            }

            inserido, atualizado = self.db.upsert(hash_sha256, dados)
            return inserido or atualizado
        except Exception as e:
            log.error("Erro ao salvar registro no banco: %s", e)
            return False

    def salvar_erro(
        self,
        hash_sha256: str,
        nome_original: str,
        caminho: Path,
        erro_msg: str,
    ):
        """Registra um erro de processamento no banco."""
        try:
            dados = {
                "hash_sha256": hash_sha256,
                "nome_original": nome_original,
                "caminho": str(caminho),
                "data_processamento": datetime.now().isoformat(),
                "status": "erro",
                "erro_msg": erro_msg,
            }
            self.db.upsert(hash_sha256, dados)
        except Exception as e:
            log.error("Erro ao registrar falha no banco: %s", e)

    # ── Manifesto JSON ──────────────────────────────────────────────

    def gerar_manifesto_json(self) -> bool:
        """Regenera o arquivo manifesto.json com índice completo.

        Returns:
            True se gerou com sucesso.
        """
        try:
            documentos = self.db.listar_todos()

            # Desserializa campos JSON armazenados como string
            for doc in documentos:
                for campo in ("autor", "palavras_chave"):
                    if doc.get(campo) and isinstance(doc[campo], str):
                        try:
                            doc[campo] = json.loads(doc[campo])
                        except json.JSONDecodeError:
                            doc[campo] = [doc[campo]]

            manifesto = {
                "gerado_em": datetime.now().isoformat(),
                "total_documentos": len(documentos),
                "estatisticas": self._gerar_estatisticas(documentos),
                "documentos": documentos,
            }

            MANIFESTO_JSON_PATH.parent.mkdir(parents=True, exist_ok=True)
            with open(MANIFESTO_JSON_PATH, "w", encoding="utf-8") as f:
                json.dump(manifesto, f, ensure_ascii=False, indent=2)

            log.info("Manifesto JSON gerado: %s (%d docs)",
                     MANIFESTO_JSON_PATH, len(documentos))
            return True
        except Exception as e:
            log.error("Erro ao gerar manifesto JSON: %s", e)
            return False

    # ── Manifesto CSV ───────────────────────────────────────────────

    def gerar_manifesto_csv(self) -> bool:
        """Regenera o arquivo manifesto.csv com índice completo.

        Returns:
            True se gerou com sucesso.
        """
        try:
            documentos = self.db.listar_todos()

            if not documentos:
                log.warning("Nenhum documento para exportar CSV.")
                return False

            # Colunas do CSV
            colunas = [
                "id", "hash_sha256", "nome_original", "nome_novo", "caminho",
                "tamanho_bytes", "data_processamento", "versao",
                "titulo", "autor", "instituicao", "ano_publicacao",
                "tipo_documental", "area_conhecimento", "palavras_chave",
                "categoria", "status",
            ]

            MANIFESTO_CSV_PATH.parent.mkdir(parents=True, exist_ok=True)
            with open(MANIFESTO_CSV_PATH, "w", encoding="utf-8-sig", newline="") as f:
                writer = csv.DictWriter(f, fieldnames=colunas, extrasaction="ignore")
                writer.writeheader()

                for doc in documentos:
                    # Achata listas para string no CSV
                    row = dict(doc)
                    for campo in ("autor", "palavras_chave"):
                        val = row.get(campo)
                        if isinstance(val, list):
                            row[campo] = "; ".join(str(v) for v in val)
                    writer.writerow(row)

            log.info("Manifesto CSV gerado: %s (%d docs)",
                     MANIFESTO_CSV_PATH, len(documentos))
            return True
        except Exception as e:
            log.error("Erro ao gerar manifesto CSV: %s", e)
            return False

    # ── Regenerar tudo ──────────────────────────────────────────────

    def regenerar_manifestos(self) -> bool:
        """Regenera JSON e CSV em sequência."""
        ok_json = self.gerar_manifesto_json()
        ok_csv = self.gerar_manifesto_csv()
        return ok_json and ok_csv

    # ── Estatísticas ────────────────────────────────────────────────

    @staticmethod
    def _gerar_estatisticas(documentos: list[dict]) -> dict:
        """Gera estatísticas agregadas dos documentos."""
        total = len(documentos)
        if total == 0:
            return {"total": 0}

        tipos = {}
        areas = {}
        anos = {}
        status = {}

        for doc in documentos:
            tipo = doc.get("tipo_documental") or "nao_classificado"
            tipos[tipo] = tipos.get(tipo, 0) + 1

            area = doc.get("area_conhecimento") or "nao_classificado"
            areas[area] = areas.get(area, 0) + 1

            ano = doc.get("ano_publicacao")
            if ano:
                anos[str(ano)] = anos.get(str(ano), 0) + 1

            st = doc.get("status") or "desconhecido"
            status[st] = status.get(st, 0) + 1

        return {
            "total": total,
            "por_tipo": tipos,
            "por_area": areas,
            "por_ano": dict(sorted(anos.items(), reverse=True)),
            "por_status": status,
        }
