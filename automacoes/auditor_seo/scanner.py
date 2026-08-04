"""Varredura recursiva de arquivos HTML com filtros de exclusão."""

from pathlib import Path
from .config import RAIZ, PASTAS_IGNORAR, ARQUIVOS_IGNORAR
from .logger import get_logger

log = get_logger("scanner")


def escanear_htmls(raiz: Path = None) -> list[Path]:
    """Varre recursivamente a raiz do projeto em busca de arquivos .html.

    Aplica filtros de:
        - Pastas ignoradas (downloads, biblioteca, node_modules, etc.)
        - Arquivos ignorados permanentemente (footer.html, menu-global.html, etc.)

    Args:
        raiz: Pasta raiz. Default: RAIZ do config.

    Returns:
        Lista ordenada de caminhos absolutos para arquivos .html.
    """
    raiz = raiz or RAIZ
    arquivos = []

    for caminho in raiz.rglob("*.html"):
        # Verifica se está em pasta ignorada
        partes = caminho.relative_to(raiz).parts
        if any(p in PASTAS_IGNORAR for p in partes):
            log.debug("IGNORADO (pasta): %s", caminho.relative_to(raiz))
            continue

        # Verifica se é arquivo ignorado
        if caminho.name in ARQUIVOS_IGNORAR:
            log.debug("IGNORADO (arquivo): %s", caminho.relative_to(raiz))
            continue

        arquivos.append(caminho)

    log.info("Scan concluído: %d arquivos HTML encontrados", len(arquivos))
    return sorted(arquivos)
