"""Extrator de Schema.org (JSON-LD).

- A IA recebe SOMENTE os campos textuais traduzíveis (name, description,
  headline, text, about, abstract, caption), como unidades isoladas.
- Ajustes técnicos (inLanguage e URLs raiz) são feitos em Python,
  deterministicamente, na reconstrução.
"""

import json
import re

from automacoes.translation import config
from automacoes.translation.extractor import UnidadeTraduzivel

CAMPOS_TRADUZIVEIS = {
    "name", "description", "headline", "text", "about", "abstract", "caption",
}

PADRAO_SCHEMA = re.compile(
    r'(<script\s+type="application/ld\+json"[^>]*>)\s*(.*?)\s*(</script>)',
    re.IGNORECASE | re.DOTALL,
)


def _coletar_campos(obj, caminho):
    """Retorna [(caminho, valor)] dos campos textuais traduzíveis."""
    achados = []
    if isinstance(obj, dict):
        for chave, valor in obj.items():
            novo = caminho + [chave]
            if isinstance(valor, str) and chave.lower() in CAMPOS_TRADUZIVEIS:
                achados.append((novo, valor))
            else:
                achados.extend(_coletar_campos(valor, novo))
    elif isinstance(obj, list):
        for i, item in enumerate(obj):
            achados.extend(_coletar_campos(item, caminho + [i]))
    return achados


def extrair_unidades_schema(html_protegido, idioma_destino="en", prefixo="schema"):
    """Retorna (unidades, blocos) dos scripts JSON-LD presentes."""
    unidades = []
    blocos = []

    for m in PADRAO_SCHEMA.finditer(html_protegido):
        json_texto = m.group(2).strip()
        try:
            dados = json.loads(json_texto)
        except json.JSONDecodeError:
            continue

        indice = len(blocos)
        for caminho, valor in _coletar_campos(dados, []):
            contexto = str(caminho[-1]) if caminho else "texto"
            u = UnidadeTraduzivel(
                f"{prefixo}_{len(unidades)}", "schema_field", contexto, valor,
                idioma_destino=idioma_destino,
                extra={"indice_bloco": indice, "caminho": caminho},
            )
            unidades.append(u)

        blocos.append({
            "indice": indice,
            "inicio": m.start(),
            "fim": m.end(),
            "tag_abertura": m.group(1),
            "dados": dados,
        })

    return unidades, blocos


def _aplicar_campos(dados, caminho, traducoes):
    """Aplica traduções por caminho (tuplas) na estrutura do JSON."""
    if isinstance(dados, dict):
        for chave, valor in dados.items():
            novo = caminho + [chave]
            alvo = tuple(novo)
            if alvo in traducoes and isinstance(valor, str):
                dados[chave] = traducoes[alvo]
            else:
                _aplicar_campos(valor, novo, traducoes)
    elif isinstance(dados, list):
        for i, item in enumerate(dados):
            alvo = tuple(caminho + [i])
            if alvo in traducoes and isinstance(item, str):
                dados[i] = traducoes[alvo]
            else:
                _aplicar_campos(item, caminho + [i], traducoes)


def _ajustes_tecnicos(dados, idioma_destino):
    """inLanguage e URLs raiz — 100% Python, sem IA."""
    locale = config.MAPA_LOCALES.get(idioma_destino, idioma_destino)
    dominio = config.DOMINIO

    def corrigir_url(valor):
        if not isinstance(valor, str):
            return valor
        if valor.startswith(dominio + "/"):
            resto = valor[len(dominio) + 1:]
            if resto == "" or resto.startswith("#"):
                return f"{dominio}/{idioma_destino}/{resto}"
        return valor

    def caminhar(obj):
        if isinstance(obj, dict):
            for chave in list(obj.keys()):
                if chave == "inLanguage":
                    obj[chave] = locale
                elif isinstance(obj[chave], str):
                    obj[chave] = corrigir_url(obj[chave])
                else:
                    caminhar(obj[chave])
        elif isinstance(obj, list):
            for i, item in enumerate(obj):
                if isinstance(item, str):
                    obj[i] = corrigir_url(item)
                else:
                    caminhar(item)

    caminhar(dados)


def construir_edicoes_schema(blocos, unidades, traducoes, idioma_destino):
    """Calcula as edições (inicio, fim, novo_bloco) de cada bloco JSON-LD.

    As posições são relativas ao HTML protegido — o chamador deve aplicá-las
    em uma ÚNICA passada decrescente junto com as edições posicionais.
    """
    edicoes = []

    trad_por_bloco = {}
    for u in unidades:
        bloco = u.extra["indice_bloco"]
        trad_por_bloco.setdefault(bloco, {})[tuple(u.extra["caminho"])] = \
            traducoes.get(u.id, u.texto)

    for bloco in blocos:
        dados = bloco["dados"]
        trad = trad_por_bloco.get(bloco["indice"], {})
        if trad:
            _aplicar_campos(dados, [], trad)
        _ajustes_tecnicos(dados, idioma_destino)

        novo_json = json.dumps(dados, ensure_ascii=False, separators=(",", ":"))
        novo_bloco = f'{bloco["tag_abertura"]}{novo_json}</script>'
        edicoes.append((bloco["inicio"], bloco["fim"], novo_bloco))

    return edicoes


def reconstruir_schema(html, blocos, unidades, traducoes, idioma_destino):
    """Reconstrói os blocos JSON-LD com traduções + ajustes técnicos."""
    resultado = html
    edicoes = construir_edicoes_schema(
        blocos, unidades, traducoes, idioma_destino
    )
    for inicio, fim, novo_bloco in sorted(edicoes, key=lambda e: -e[0]):
        resultado = resultado[:inicio] + novo_bloco + resultado[fim:]
    return resultado
