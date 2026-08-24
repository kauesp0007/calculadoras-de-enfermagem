"""Glossário médico por idioma — consultado ANTES da API.

Arquivo de dados: automacoes/traducao_glossario.json
"""

import json

from automacoes.translation import config


def carregar_glossario(caminho=None):
    caminho = caminho or config.CAMINHO_GLOSSARIO
    try:
        with open(caminho, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def consultar_glossario(texto, idioma_destino, idioma_origem="pt-BR", glossario=None):
    """Retorna a tradução preferencial do termo, ou None se não existir."""
    glossario = glossario if glossario is not None else carregar_glossario()
    origem = glossario.get(idioma_origem, {})
    entrada = origem.get(texto)
    if isinstance(entrada, dict):
        return entrada.get(idioma_destino)
    return None
