"""Sistema de logging para o Auditor SEO."""

import logging
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path
from .config import LOGS_DIR

LOG_FORMAT = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
LOG_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"


def configurar_logging(level: int = logging.INFO) -> logging.Logger:
    """Configura logging com rotação de arquivos.

    Returns:
        Logger raiz 'auditor_seo'.
    """
    LOGS_DIR.mkdir(parents=True, exist_ok=True)

    formatter = logging.Formatter(LOG_FORMAT, datefmt=LOG_DATE_FORMAT)

    root_logger = logging.getLogger("auditor_seo")
    root_logger.setLevel(level)
    root_logger.handlers.clear()

    # Arquivo principal
    handler = RotatingFileHandler(
        LOGS_DIR / "auditor_seo.log",
        maxBytes=5 * 1024 * 1024,
        backupCount=3,
        encoding="utf-8",
    )
    handler.setLevel(logging.DEBUG)
    handler.setFormatter(formatter)
    root_logger.addHandler(handler)

    # Erros separados
    err_handler = RotatingFileHandler(
        LOGS_DIR / "auditor_erros.log",
        maxBytes=2 * 1024 * 1024,
        backupCount=2,
        encoding="utf-8",
    )
    err_handler.setLevel(logging.WARNING)
    err_handler.setFormatter(formatter)
    root_logger.addHandler(err_handler)

    # Console (INFO+)
    console = logging.StreamHandler(sys.stdout)
    console.setLevel(logging.INFO)
    console.setFormatter(logging.Formatter("%(asctime)s  %(message)s", datefmt="%H:%M:%S"))
    root_logger.addHandler(console)

    return root_logger


def get_logger(name: str) -> logging.Logger:
    """Obtém um logger filho."""
    return logging.getLogger(f"auditor_seo.{name}")
