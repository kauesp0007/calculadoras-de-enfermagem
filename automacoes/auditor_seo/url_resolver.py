"""Determinação automática de URLs a partir do caminho do arquivo."""

from pathlib import Path
from .config import DOMINIO, IDIOMAS, RAIZ


def resolver_url(caminho_absoluto: Path) -> str:
    """Determina a URL canônica de uma página a partir do seu caminho.

    Regras:
        - index.html na raiz → https://www.calculadorasdeenfermagem.com.br/
        - <lang>/<page>.html  → https://www.calculadorasdeenfermagem.com.br/<lang>/<page>.html
        - <page>.html         → https://www.calculadorasdeenfermagem.com.br/<page>.html

    Args:
        caminho_absoluto: Caminho absoluto do arquivo .html.

    Returns:
        URL canônica completa.
    """
    try:
        relativo = caminho_absoluto.relative_to(RAIZ)
    except ValueError:
        return f"{DOMINIO}/{caminho_absoluto.name}"

    partes = relativo.parts

    # index.html na raiz → URL base
    if len(partes) == 1 and partes[0] == "index.html":
        return f"{DOMINIO}/"

    # Monta URL
    url_partes = [DOMINIO]
    for p in partes:
        url_partes.append(p)
    return "/".join(url_partes)


def resolver_urls_hreflang(nome_arquivo: str) -> dict:
    """Gera as URLs hreflang para todos os idiomas.

    Para um arquivo 'fugulin.html', gera:
        {
            'pt-br': 'https://www.calculadorasdeenfermagem.com.br/fugulin.html',
            'en':    'https://www.calculadorasdeenfermagem.com.br/en/fugulin.html',
            'es':    'https://www.calculadorasdeenfermagem.com.br/es/fugulin.html',
            ...
            'x-default': 'https://www.calculadorasdeenfermagem.com.br/fugulin.html',
        }

    Args:
        nome_arquivo: Nome do arquivo (ex: 'fugulin.html').

    Returns:
        Dicionário {lang_code: url}.
    """
    urls = {}
    for lang_code, pasta in IDIOMAS:
        if pasta:
            urls[lang_code] = f"{DOMINIO}/{pasta}/{nome_arquivo}"
        else:
            urls[lang_code] = f"{DOMINIO}/{nome_arquivo}"

    # x-default sempre aponta para pt-br (raiz)
    urls["x-default"] = f"{DOMINIO}/{nome_arquivo}"
    return urls


def extrair_nome_arquivo(caminho_absoluto: Path) -> str:
    """Extrai o nome do arquivo (ex: 'fugulin.html') do caminho absoluto.

    Para arquivos em pastas de idioma (es/fugulin.html), retorna 'fugulin.html'.
    """
    return caminho_absoluto.name
