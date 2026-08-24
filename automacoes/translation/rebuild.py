"""Reconstrução determinística do HTML final + gravação segura — Etapa 3.

A IA nunca devolve HTML: ela devolve apenas textos isolados. Este módulo
recompõe o documento original com as traduções e valida a estrutura antes
de permitir a gravação.

TODAS as edições (textos posicionais + blocos JSON-LD) são calculadas
sobre o HTML protegido e aplicadas em uma ÚNICA passada decrescente,
evitando deslocamento de posições.
"""

from pathlib import Path

from automacoes.translation import logger
from automacoes.translation.js_extractor import reconstruir_js
from automacoes.translation.protection import restaurar_html
from automacoes.translation.schema_extractor import construir_edicoes_schema
from automacoes.translation.validator import validar_html_estrutura


def montar_html_final(html_original, protecao, unidades_posicionais,
                      unidades_schema, blocos_schema, scripts_extraidos,
                      traducoes, idioma_destino):
    """Reconstrói o HTML completo e valida a estrutura.

    Retorna (html_final, ok, problemas). Se `ok` for False, o arquivo
    NÃO deve ser salvo (fail-safe).
    """
    # 1. Coleta TODAS as edições sobre o HTML protegido
    edicoes = []
    for u in unidades_posicionais:
        if "inicio" not in u.extra or "fim" not in u.extra:
            continue
        trad = traducoes.get(u.id, u.texto)
        if u.extra.get("tipo_substituicao") == "atributo":
            trad = trad.replace('"', "'")
        edicoes.append((u.extra["inicio"], u.extra["fim"], trad))

    edicoes += construir_edicoes_schema(
        blocos_schema, unidades_schema, traducoes, idioma_destino
    )

    # 2. Aplica em passada única decrescente (posições sempre válidas)
    html = protecao.html_protegido
    for inicio, fim, novo in sorted(edicoes, key=lambda e: -e[0]):
        html = html[:inicio] + novo + html[fim:]

    # 3. Scripts inline: aplica as traduções dentro de cada script
    codigos_traduzidos = {}
    for placeholder, (codigo, unidades_js) in scripts_extraidos.items():
        codigos_traduzidos[placeholder] = reconstruir_js(
            codigo, unidades_js, traducoes
        )

    # 4. Restaura blocos protegidos (style/svg/comentários/scripts)
    html_final = restaurar_html(html, {**protecao.blocos, **codigos_traduzidos})

    # 5. Validação estrutural — qualquer problema impede a gravação
    ok, problemas = validar_html_estrutura(html_original, html_final)

    return html_final, ok, problemas


def gravar_arquivo(caminho_saida, html, idioma_destino):
    """Grava o HTML final em UTF-8, criando a pasta se necessário."""
    caminho = Path(caminho_saida)
    caminho.parent.mkdir(parents=True, exist_ok=True)
    caminho.write_text(html, encoding="utf-8")
    logger.sucesso(f"Arquivo gravado ({idioma_destino}): {caminho}")
