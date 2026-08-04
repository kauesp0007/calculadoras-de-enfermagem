"""Gerenciamento de hash SHA-256 e detecção de duplicatas/versões.

Lógica de decisão:
    - hash NÃO existe no DB                            → PROCESSAR (novo)
    - hash existe E nome_original é igual              → IGNORAR (já processado)
    - hash NÃO existe, mas nome_original já existe     → PROCESSAR (nova versão)
    - hash existe, mas nome_original diferente         → IGNORAR (mesmo conteúdo, nome diferente)
"""

from pathlib import Path
from typing import Optional
from dataclasses import dataclass

from .config import DOCS_DIR
from .utils import gerar_hash_sha256
from .database import Database
from .logger import get_logger

log = get_logger("hash_manager")


@dataclass
class HashResult:
    """Resultado da verificação de hash de um arquivo."""

    hash_sha256: str
    nome_original: str
    caminho: Path
    acao: str  # "processar" | "ignorar" | "nova_versao"
    motivo: str
    versao: int = 1  # 1 = novo, 2+ = nova versão
    registro_existente: Optional[dict] = None


class HashManager:
    """Gerencia hashes e decide se um documento deve ser processado."""

    def __init__(self, db: Database):
        self.db = db

    def verificar(self, caminho: Path) -> HashResult:
        """Verifica se um arquivo deve ser processado.

        Args:
            caminho: Caminho absoluto para o arquivo PDF.

        Returns:
            HashResult com a ação recomendada.
        """
        if not caminho.exists():
            return HashResult(
                hash_sha256="",
                nome_original=caminho.name,
                caminho=caminho,
                acao="ignorar",
                motivo="Arquivo não encontrado",
            )

        # Gera hash
        hash_val = gerar_hash_sha256(caminho)
        nome = caminho.name

        # Busca no banco por hash
        registro_por_hash = self.db.buscar_por_hash(hash_val)

        if registro_por_hash:
            # Hash já existe no banco
            if registro_por_hash["nome_original"] == nome:
                return HashResult(
                    hash_sha256=hash_val,
                    nome_original=nome,
                    caminho=caminho,
                    acao="ignorar",
                    motivo="Documento já processado (hash + nome idênticos)",
                    registro_existente=registro_por_hash,
                )
            else:
                # Mesmo conteúdo, mas nome diferente (provavelmente renomeado)
                return HashResult(
                    hash_sha256=hash_val,
                    nome_original=nome,
                    caminho=caminho,
                    acao="ignorar",
                    motivo=f"Conteúdo idêntico a '{registro_por_hash['nome_original']}' (mesmo hash)",
                    registro_existente=registro_por_hash,
                )

        # Hash NÃO existe no banco
        # Verifica se o nome original já foi processado antes
        registros_por_nome = self.db.buscar_por_nome_original(nome)

        if registros_por_nome:
            # Nome já existe, mas hash diferente → NOVA VERSÃO
            versao = max(r.get("versao", 1) for r in registros_por_nome) + 1
            return HashResult(
                hash_sha256=hash_val,
                nome_original=nome,
                caminho=caminho,
                acao="nova_versao",
                motivo=f"Nova versão detectada (hash diferente, versão {versao})",
                versao=versao,
            )

        # Completamente novo
        return HashResult(
            hash_sha256=hash_val,
            nome_original=nome,
            caminho=caminho,
            acao="processar",
            motivo="Novo documento",
            versao=1,
        )

    def verificar_em_lote(self, caminhos: list[Path]) -> list[HashResult]:
        """Verifica múltiplos arquivos em lote.

        Args:
            caminhos: Lista de caminhos de arquivos PDF.

        Returns:
            Lista de HashResult.
        """
        resultados = []
        for caminho in caminhos:
            try:
                resultado = self.verificar(caminho)
                resultados.append(resultado)
                log.debug(
                    "[%s] %s → %s",
                    resultado.acao.upper(),
                    resultado.nome_original,
                    resultado.motivo,
                )
            except Exception as e:
                log.error("Erro ao verificar hash de %s: %s", caminho.name, e)
                resultados.append(
                    HashResult(
                        hash_sha256="",
                        nome_original=caminho.name,
                        caminho=caminho,
                        acao="ignorar",
                        motivo=f"Erro na verificação: {e}",
                    )
                )
        return resultados

    @staticmethod
    def listar_pdfs_na_pasta(pasta: Optional[Path] = None) -> list[Path]:
        """Lista todos os arquivos PDF em uma pasta (não recursivo).

        Args:
            pasta: Pasta a ser varrida. Default: DOCS_DIR.

        Returns:
            Lista de Paths para arquivos .pdf.
        """
        pasta = pasta or DOCS_DIR
        if not pasta.exists():
            log.warning("Pasta não encontrada: %s", pasta)
            return []
        return sorted(
            [p for p in pasta.iterdir() if p.is_file() and p.suffix.lower() == ".pdf"]
        )
