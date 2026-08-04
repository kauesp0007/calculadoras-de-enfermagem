"""Gerenciamento de backups com SHA-256 e restore automático."""

import hashlib
import shutil
from datetime import datetime
from pathlib import Path
from .config import BACKUPS_DIR
from .logger import get_logger

log = get_logger("backup")


def hash_arquivo(caminho: Path) -> str:
    """Calcula SHA-256 de um arquivo."""
    sha = hashlib.sha256()
    with open(caminho, "rb") as f:
        while chunk := f.read(65536):
            sha.update(chunk)
    return sha.hexdigest()


def criar_backup(caminho: Path) -> tuple[str, Path]:
    """Cria backup de um arquivo antes da modificação.

    Args:
        caminho: Caminho do arquivo a ser backpeado.

    Returns:
        (hash_sha256, caminho_do_backup)
    """
    h = hash_arquivo(caminho)

    # Pasta do backup com timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    pasta_backup = BACKUPS_DIR / timestamp
    pasta_backup.mkdir(parents=True, exist_ok=True)

    # Nome do backup: <hash_short>_<nome_original>
    nome_backup = f"{h[:12]}_{caminho.name}"
    destino = pasta_backup / nome_backup

    shutil.copy2(caminho, destino)
    log.debug("Backup criado: %s", destino.name)
    return h, destino


def restaurar_backup(caminho_original: Path, caminho_backup: Path) -> bool:
    """Restaura arquivo a partir do backup.

    Args:
        caminho_original: Caminho do arquivo a ser restaurado.
        caminho_backup: Caminho do backup.

    Returns:
        True se restaurou com sucesso.
    """
    try:
        shutil.copy2(caminho_backup, caminho_original)
        log.warning("RESTAURADO do backup: %s", caminho_original.name)
        return True
    except Exception as e:
        log.error("Falha ao restaurar backup de %s: %s", caminho_original.name, e)
        return False
