"""Camada de proteção: isola scripts, styles, SVG e comentários.

REGRAS:
- Scripts JSON-LD (type="application/ld+json") NÃO são protegidos: eles são
  processados determinísticamente pelo schema_extractor (nunca vão para a IA).
- Scripts inline sem src ficam disponíveis em separado (scripts_inline) para o
  js_extractor traduzir apenas as strings.
- Nunca protege indiscriminadamente: a extração de strings continua possível.
"""

import re
from dataclasses import dataclass, field

PADRAO_BLOCOS = re.compile(
    r'(<(script|style|svg)\b[^>]*>.*?</\2>)',
    re.IGNORECASE | re.DOTALL,
)
PADRAO_COMENTARIOS = re.compile(r'<!--.*?-->', re.DOTALL)


@dataclass
class ProtecaoResultado:
    html_protegido: str
    blocos: dict = field(default_factory=dict)          # placeholder -> código original
    scripts_inline: dict = field(default_factory=dict)  # placeholder -> script inline
    contador: int = 0


def proteger_html(html):
    """Substitui blocos técnicos por placeholders e devolve o mapa de restauração."""
    resultado = ProtecaoResultado(html_protegido=html)

    def novo_placeholder():
        ph = f'<div translate="no" id="TRV2_PROT_{resultado.contador}"></div>'
        resultado.contador += 1
        return ph

    def proteger_bloco(match):
        codigo = match.group(1)
        tag = match.group(2).lower()

        # Schema JSON-LD é tratado por Python — permanece intacto no HTML.
        if tag == "script" and "application/ld+json" in codigo.lower():
            return codigo

        ph = novo_placeholder()
        resultado.blocos[ph] = codigo
        if tag == "script" and "src=" not in codigo.lower():
            resultado.scripts_inline[ph] = codigo
        return ph

    def proteger_comentario(match):
        ph = novo_placeholder()
        resultado.blocos[ph] = match.group(0)
        return ph

    resultado.html_protegido = PADRAO_BLOCOS.sub(
        proteger_bloco, resultado.html_protegido
    )
    resultado.html_protegido = PADRAO_COMENTARIOS.sub(
        proteger_comentario, resultado.html_protegido
    )

    return resultado


def restaurar_html(html_traduzido, blocos):
    """Devolve os blocos protegidos para o HTML final."""
    resultado = html_traduzido
    for placeholder, codigo in blocos.items():
        resultado = resultado.replace(placeholder, codigo)
    return resultado
