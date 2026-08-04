"""Sistema de logging com 3 arquivos rotativos."""

import logging
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path

from .config import (
    LOGS_DIR,
    LOG_FORMAT,
    LOG_DATE_FORMAT,
    LOG_MAX_BYTES,
    LOG_BACKUP_COUNT,
)


def configurar_logging(level: int = logging.INFO) -> logging.Logger:
    """Configura o sistema de logging com 3 arquivos + console.

    Arquivos gerados:
        logs/catalogador.log  — log geral do sistema
        logs/erros.log        — apenas WARNING e ERROR
        logs/deepseek.log     — chamadas à API DeepSeek

    Args:
        level: Nível de logging (default: INFO).

    Returns:
        Logger raiz configurado.
    """
    # Garante que a pasta de logs existe
    LOGS_DIR.mkdir(parents=True, exist_ok=True)

    # Formatter comum
    formatter = logging.Formatter(LOG_FORMAT, datefmt=LOG_DATE_FORMAT)

    # ── Logger raiz ──────────────────────────────────────────────────
    root_logger = logging.getLogger("catalogador")
    root_logger.setLevel(level)
    root_logger.handlers.clear()  # evita duplicação em reloads

    # ── Handler: catalogador.log (todos os níveis) ───────────────────
    handler_geral = RotatingFileHandler(
        LOGS_DIR / "catalogador.log",
        maxBytes=LOG_MAX_BYTES,
        backupCount=LOG_BACKUP_COUNT,
        encoding="utf-8",
    )
    handler_geral.setLevel(logging.DEBUG)
    handler_geral.setFormatter(formatter)
    root_logger.addHandler(handler_geral)

    # ── Handler: erros.log (WARNING+) ────────────────────────────────
    handler_erros = RotatingFileHandler(
        LOGS_DIR / "erros.log",
        maxBytes=LOG_MAX_BYTES,
        backupCount=LOG_BACKUP_COUNT,
        encoding="utf-8",
    )
    handler_erros.setLevel(logging.WARNING)
    handler_erros.setFormatter(formatter)
    root_logger.addHandler(handler_erros)

    # ── Handler: deepseek.log (chamadas API) ─────────────────────────
    handler_deepseek = RotatingFileHandler(
        LOGS_DIR / "deepseek.log",
        maxBytes=LOG_MAX_BYTES,
        backupCount=LOG_BACKUP_COUNT,
        encoding="utf-8",
    )
    handler_deepseek.setLevel(logging.DEBUG)
    handler_deepseek.setFormatter(formatter)
    # Será usado pelo logger específico "catalogador.deepseek"
    deepseek_logger = logging.getLogger("catalogador.deepseek")
    deepseek_logger.handlers.clear()
    deepseek_logger.addHandler(handler_deepseek)
    deepseek_logger.propagate = False  # não duplica no log geral

    # ── Handler: console (INFO+, saída colorida opcional) ────────────
    handler_console = logging.StreamHandler(sys.stdout)
    handler_console.setLevel(logging.INFO)
    # Formato mais limpo para o console
    console_fmt = logging.Formatter(
        "%(asctime)s  %(message)s", datefmt="%H:%M:%S"
    )
    handler_console.setFormatter(console_fmt)
    root_logger.addHandler(handler_console)

    return root_logger


def get_logger(name: str) -> logging.Logger:
    """Obtém um logger filho do catalogador.

    Args:
        name: Nome do módulo (ex: 'database', 'pdf_reader').

    Returns:
        Logger configurado.
    """
    return logging.getLogger(f"catalogador.{name}")
