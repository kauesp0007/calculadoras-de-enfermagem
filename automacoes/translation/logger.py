"""Log estruturado do sistema de tradução v2.

GARANTIA ABSOLUTA: este módulo NUNCA registra chaves de API.
Os chamadores devem passar apenas textos descritivos.
"""

import logging

from automacoes.translation import config


def _criar_logger():
    config.PASTA_LOGS.mkdir(parents=True, exist_ok=True)

    logger = logging.getLogger("traducao_v2")
    logger.setLevel(logging.INFO)
    logger.propagate = False

    if not logger.handlers:
        fmt = logging.Formatter(
            "%(asctime)s | %(levelname)-7s | %(message)s",
            "%Y-%m-%d %H:%M:%S",
        )

        arquivo = logging.FileHandler(str(config.CAMINHO_LOG), encoding="utf-8")
        arquivo.setFormatter(fmt)
        logger.addHandler(arquivo)

        console = logging.StreamHandler()
        console.setFormatter(fmt)
        logger.addHandler(console)

    return logger


logger = _criar_logger()


def info(msg):
    logger.info(msg)


def aviso(msg):
    logger.warning(msg)


def erro(msg):
    logger.error(msg)


def sucesso(msg):
    logger.info(msg)
