"""Auditoria de qualidade do HTML traduzido — Etapa 5.

- Verificação estrutural (reusa o validator).
- Detecção heurística de textos que ficaram em português (textos visíveis
  + campos traduzíveis do Schema JSON-LD; scripts/styles/svgs são ignorados).
- Comparação com a versão existente do tradutor legado (regressão).
"""

import json
import re

from automacoes.translation import logger, validator
from automacoes.translation.schema_extractor import CAMPOS_TRADUZIVEIS

# Palavras típicas do conteúdo em pt-BR (heurística de "resto em português").
PALAVRAS_PORTUGUESAS = {
    "enfermagem", "paciente", "avaliação", "avaliacao", "calcular",
    "calculadora", "resultado", "clique", "preencha", "digite", "selecione",
    "não", "nao", "para", "como", "uma", "dos", "das", "idade",
    "gestacional", "pontuação", "pontuacao", "escore", "mês", "meses",
    "anos", "dias", "horas", "peso", "altura", "nome", "nascimento",
    "profissional", "campo", "obrigatório", "obrigatorio", "ferramenta",
    "apoio", "escala", "recém", "nascido", "você", "voce", "sua", "seu",
    "com", "mais", "menos", "entre", "sobre", "exemplo", "atendimento",
    "cuidados", "unidade", "insira", "pressione", "abaixo", "acima",
    "método", "metodo",
}

_PADRAO_TEXTO_VISIVEL = re.compile(r'>([^<]+)<')
_PADRAO_PALAVRAS = re.compile(r"[a-zà-úç]+", re.IGNORECASE)
_PADRAO_LANG = re.compile(r'<html\s+lang="([^"]+)"', re.IGNORECASE)
_PADRAO_CANONICAL = re.compile(
    r'<link\s+(?=[^>]*\brel="canonical")[^>]*\bhref="([^"]+)"',
    re.IGNORECASE,
)
_PADRAO_HREFLANG = re.compile(
    r'<link\s+(?=[^>]*\brel="alternate")[^>]*\bhreflang="([^"]+)"',
    re.IGNORECASE,
)
_PADRAO_BLOCOS_TECNICOS = re.compile(
    r'<(script|style|svg)\b[^>]*>.*?</\1>', re.IGNORECASE | re.DOTALL
)
_PADRAO_JSON_LD = re.compile(
    r'<script\s+type="application/ld\+json"[^>]*>\s*(.*?)\s*</script>',
    re.IGNORECASE | re.DOTALL,
)


def _tem_palavras_portuguesas(texto):
    palavras = {p.lower() for p in _PADRAO_PALAVRAS.findall(texto)}
    return bool(palavras & PALAVRAS_PORTUGUESAS)


def _textos_visiveis(html):
    limpo = _PADRAO_BLOCOS_TECNICOS.sub("", html)
    return [m.group(1).strip() for m in _PADRAO_TEXTO_VISIVEL.finditer(limpo)]


def _campos_schema(html):
    """Valores textuais traduzíveis dos blocos JSON-LD."""
    campos = []
    for m in _PADRAO_JSON_LD.finditer(html):
        try:
            dados = json.loads(m.group(1))
        except json.JSONDecodeError:
            continue

        def caminhar(obj):
            if isinstance(obj, dict):
                for chave, valor in obj.items():
                    if isinstance(valor, str) and chave in CAMPOS_TRADUZIVEIS:
                        campos.append(valor)
                    else:
                        caminhar(valor)
            elif isinstance(obj, list):
                for item in obj:
                    caminhar(item)

        caminhar(dados)
    return campos


def textos_em_portugues(html):
    """Textos visíveis + campos do Schema com palavras típicas do pt-BR."""
    encontrados = []
    for texto in _textos_visiveis(html):
        if texto and _tem_palavras_portuguesas(texto):
            encontrados.append(texto)
    for campo in _campos_schema(html):
        if _tem_palavras_portuguesas(campo):
            encontrados.append(campo)
    return encontrados


def _contar_tags(html, tag):
    return len(re.findall(rf'<{tag}\b', html, re.IGNORECASE))


def comparar_com_legado(html_v2, html_legado):
    """Diferenças estruturais entre o resultado v2 e a versão do legado.

    Cada chave devolve uma tupla (legado, v2).
    """
    m_lang = _PADRAO_LANG.search(html_legado)
    m_canon = _PADRAO_CANONICAL.search(html_legado)
    m_href = _PADRAO_HREFLANG.search(html_legado)
    v_lang = _PADRAO_LANG.search(html_v2)
    v_canon = _PADRAO_CANONICAL.search(html_v2)
    v_href = _PADRAO_HREFLANG.search(html_v2)

    return {
        "tamanho_chars": (len(html_legado), len(html_v2)),
        "lang": (
            m_lang.group(1) if m_lang else None,
            v_lang.group(1) if v_lang else None,
        ),
        "canonical": (
            m_canon.group(1) if m_canon else None,
            v_canon.group(1) if v_canon else None,
        ),
        "primeiro_hreflang": (
            m_href.group(1) if m_href else None,
            v_href.group(1) if v_href else None,
        ),
        "tags_script": (_contar_tags(html_legado, "script"),
                        _contar_tags(html_v2, "script")),
        "tags_style": (_contar_tags(html_legado, "style"),
                       _contar_tags(html_v2, "style")),
        "tags_svg": (_contar_tags(html_legado, "svg"),
                     _contar_tags(html_v2, "svg")),
    }


def relatorio(html_final, html_original, caminho_legado=None):
    """Relatório completo de auditoria sobre o HTML final."""
    ok, problemas = validator.validar_html_estrutura(html_original, html_final)
    rel = {
        "estrutura_ok": ok,
        "problemas": problemas,
        "tamanho_chars": (len(html_original), len(html_final)),
        "textos_portugues_restantes": textos_em_portugues(html_final),
    }
    if caminho_legado and caminho_legado.exists():
        rel["legado"] = comparar_com_legado(
            html_final, caminho_legado.read_text(encoding="utf-8")
        )
    return rel


def imprimir_relatorio(rel):
    """Exibe o relatório de auditoria no log."""
    logger.info("=== AUDITORIA ===")
    logger.info(
        f"Estrutura: ok={rel['estrutura_ok']} problemas={rel['problemas']}"
    )
    logger.info(
        f"Tamanho (original → final): {rel['tamanho_chars'][0]} → "
        f"{rel['tamanho_chars'][1]} chars"
    )
    restantes = rel["textos_portugues_restantes"]
    if restantes:
        logger.aviso(
            f"{len(restantes)} textos possivelmente em português "
            f"(exemplos: {restantes[:5]})"
        )
    else:
        logger.info("Nenhum texto em português detectado.")

    if "legado" in rel:
        legado = rel["legado"]
        logger.info("Comparação com a versão do tradutor legado (legado → v2):")
        for chave, (antes, depois) in legado.items():
            logger.info(f"  {chave}: {antes} → {depois}")
