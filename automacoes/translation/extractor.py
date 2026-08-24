"""Unidades traduzíveis, hash e deduplicação — núcleo da economia de tokens.

Cada unidade é um texto isolado (HTML visível, atributo, meta, mensagem JS,
campo de Schema etc.). A API recebe SOMENTE essas unidades, nunca o HTML/JS
completo.
"""

import hashlib
import re
from dataclasses import dataclass, field

# Identificadores técnicos que nunca devem ser traduzidos.
TERMOS_NAO_TRADUZIVEIS = {
    "click", "change", "input", "submit", "load", "error", "mouseover",
    "keydown", "keyup", "focus", "blur", "smooth", "DOMContentLoaded",
    "touchstart", "touchend", "scroll", "resize", "openai", "json",
}

PADRAO_SOMENTE_NUMEROS = re.compile(r"^[\d\s.,;:+\-/()%°<>'\"*]+$")
PADRAO_URL_OU_CAMINHO = re.compile(r"^(https?://|/|\.\./|\./|#|mailto:)", re.IGNORECASE)


def gerar_hash(tipo, contexto, texto, idioma_origem="pt-BR", idioma_destino="en"):
    """SHA256(idioma_origem + idioma_destino + tipo + contexto + texto)."""
    bruto = "\x1f".join([idioma_origem, idioma_destino, tipo, contexto, texto])
    return hashlib.sha256(bruto.encode("utf-8")).hexdigest()


def texto_traduzivel(texto):
    """Filtro local: elimina vazios, números puros, símbolos, URLs e tokens técnicos."""
    if not texto or not isinstance(texto, str):
        return False
    t = texto.strip()
    if len(t) < 2:
        return False
    if PADRAO_URL_OU_CAMINHO.match(t):
        return False
    if PADRAO_SOMENTE_NUMEROS.match(t):
        return False
    # Precisa conter pelo menos uma letra real.
    if not any(ch.isalpha() for ch in t):
        return False
    # Token técnico puro (palavra isolada conhecida).
    if t.lower() in TERMOS_NAO_TRADUZIVEIS:
        return False
    return True


@dataclass
class UnidadeTraduzivel:
    id: str
    tipo: str
    contexto: str
    texto: str
    idioma_origem: str = "pt-BR"
    idioma_destino: str = "en"
    hash: str = field(init=False, default="")
    extra: dict = field(default_factory=dict)

    def __post_init__(self):
        self.hash = gerar_hash(
            self.tipo, self.contexto, self.texto,
            self.idioma_origem, self.idioma_destino,
        )


def deduplicar(unidades, hashes_existentes):
    """Remove inválidas e duplicadas; separa o que já está no cache.

    Retorna (novas, estatisticas):
    - `novas`: lista única (1ª ocorrência) de unidades válidas cujo hash
      NÃO existe no cache — somente estas devem ir para a API.
    """
    vistos = set()
    novas = []
    stats = {"total": 0, "duplicadas": 0, "invalidas": 0, "em_cache": 0}

    for u in unidades:
        stats["total"] += 1

        if not texto_traduzivel(u.texto):
            stats["invalidas"] += 1
            continue

        if u.hash in vistos:
            stats["duplicadas"] += 1
            continue
        vistos.add(u.hash)

        if u.hash in hashes_existentes:
            stats["em_cache"] += 1
            continue

        novas.append(u)

    return novas, stats


def reconstruir_com_posicoes(texto, unidades, traducoes):
    """Aplica traduções nas posições registradas (de trás para frente).

    - Texto normal: substitui exatamente o trecho original.
    - Atributos (extra["tipo_substituicao"] == "atributo"): sanitiza aspas
      duplas para não quebrar o valor HTML.
    """
    resultado = texto
    itens = []
    for u in unidades:
        if "inicio" not in u.extra or "fim" not in u.extra:
            continue
        trad = traducoes.get(u.id, u.texto)
        if u.extra.get("tipo_substituicao") == "atributo":
            trad = trad.replace('"', "'")
        itens.append((u.extra["inicio"], u.extra["fim"], trad))

    for inicio, fim, trad in sorted(itens, key=lambda x: -x[0]):
        resultado = resultado[:inicio] + trad + resultado[fim:]

    return resultado
