"""Validações antes de gravar qualquer arquivo.

REGRA MÁXIMA (fail-safe): é melhor não traduzir um trecho do que corromper
código. Se alguma validação falhar, o arquivo NÃO é salvo.
"""

import json
import re

TAGS_BALANCEADAS = ("div", "section", "table", "ul", "ol", "span", "p")
TAGS_CONTADAS = ("script", "style", "svg")


def validar_json_resposta(payload, resposta):
    """A resposta da API deve ser um objeto JSON com as MESMAS chaves."""
    problemas = []
    if not isinstance(resposta, dict):
        return False, ["Resposta da API não é um objeto JSON"]

    esperadas = set(payload.keys())
    recebidas = set(resposta.keys())
    faltando = esperadas - recebidas
    extras = recebidas - esperadas

    if faltando:
        problemas.append(f"Chaves ausentes na resposta: {sorted(faltando)[:10]}")
    if extras:
        problemas.append(f"Chaves extras na resposta: {sorted(extras)[:10]}")
    for chave in esperadas & recebidas:
        if not isinstance(resposta[chave], str):
            problemas.append(f"Valor não-textual na chave '{chave}'")

    return (not problemas), problemas


def validar_html_estrutura(original, final):
    """Compara a estrutura do HTML final com o original (contagens)."""
    problemas = []

    # 1. Placeholders de proteção devem permanecer idênticos
    ids_orig = set(re.findall(r'id="(TRV2_PROT_\d+)"', original))
    ids_final = set(re.findall(r'id="(TRV2_PROT_\d+)"', final))
    if ids_orig != ids_final:
        problemas.append("Placeholders de proteção alterados na tradução")

    # 2. Balanceamento de tags estruturais
    for tag in TAGS_BALANCEADAS:
        abre_o = len(re.findall(rf'<{tag}\b', original, re.IGNORECASE))
        fecha_o = len(re.findall(rf'</{tag}>', original, re.IGNORECASE))
        abre_f = len(re.findall(rf'<{tag}\b', final, re.IGNORECASE))
        fecha_f = len(re.findall(rf'</{tag}>', final, re.IGNORECASE))
        if (abre_o - fecha_o) != (abre_f - fecha_f):
            problemas.append(f"Balanceamento de <{tag}> alterado")

    # 3. Quantidade de blocos técnicos
    for tag in TAGS_CONTADAS:
        n_orig = len(re.findall(rf'<{tag}\b', original, re.IGNORECASE))
        n_final = len(re.findall(rf'<{tag}\b', final, re.IGNORECASE))
        if n_orig != n_final:
            problemas.append(f"Quantidade de <{tag}> alterada ({n_orig} → {n_final})")

    return (not problemas), problemas


def validar_schema_json(texto):
    """O bloco JSON-LD deve ser JSON válido."""
    try:
        json.loads(texto)
        return True, []
    except json.JSONDecodeError as e:
        return False, [f"Schema inválido: {e}"]
