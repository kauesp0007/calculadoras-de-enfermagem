"""Classificador: valida e estrutura a resposta JSON da DeepSeek.

Responsabilidades:
    - Validar tipos de dados (ano deve ser int, autores array, etc.)
    - Preencher valores padrão para campos ausentes
    - Normalizar tipo_documental e area_conhecimento
    - Classificação por heurística como fallback (sem IA)
"""

import re
from typing import Optional

from .logger import get_logger

log = get_logger("classifier")

# ── Valores válidos para classificação ─────────────────────────────────

TIPOS_DOCUMENTAIS_VALIDOS = {
    "artigo_cientifico", "protocolo", "pop", "procedimento_operacional_padrao",
    "resolucao", "manual", "diretriz", "guideline", "nota_tecnica", "cartilha",
    "livro", "legislacao", "portaria", "tese", "dissertacao", "monografia",
    "formulario", "checklist", "fluxograma", "apresentacao", "relatorio", "outro",
}

AREAS_CONHECIMENTO_VALIDAS = {
    "Enfermagem", "Medicina", "Emergencia", "UTI", "Pediatria", "Obstetricia",
    "Centro_Cirurgico", "Cardiologia", "Neurologia", "Farmacologia",
    "Saude_Publica", "Gestao_Hospitalar", "Seguranca_do_Paciente",
}

# Mapeamento de sinônimos → valor canônico
SINONIMOS_TIPO = {
    "artigo": "artigo_cientifico",
    "artigo científico": "artigo_cientifico",
    "paper": "artigo_cientifico",
    "p.o.p.": "pop",
    "procedimento operacional": "procedimento_operacional_padrao",
    "resolução": "resolucao",
    "parecer": "nota_tecnica",
    "nota técnica": "nota_tecnica",
    "guia": "manual",
    "guía": "manual",
    "lei": "legislacao",
    "decreto": "legislacao",
    "norma": "legislacao",
    "portaría": "portaria",
    "tcc": "monografia",
    "dissertação": "dissertacao",
    "tese de doutorado": "tese",
    "form": "formulario",
    "check list": "checklist",
    "fluxo": "fluxograma",
    "slide": "apresentacao",
    "slides": "apresentacao",
    "relatório": "relatorio",
}


class Classifier:
    """Valida, normaliza e classifica a resposta da IA."""

    @staticmethod
    def validar(dados_brutos: dict, nome_arquivo: str = "") -> dict:
        """Valida e normaliza os dados extraídos pela IA.

        Args:
            dados_brutos: Dicionário retornado pela DeepSeek.
            nome_arquivo: Nome original do arquivo (para heurísticas).

        Returns:
            Dicionário validado e normalizado.
        """
        resultado = {}

        # ── Campos textuais ──────────────────────────────────────────
        campos_texto = [
            "titulo", "subtitulo", "instituicao", "orgao_governamental",
            "ministerio", "conselho", "universidade", "hospital",
            "secretaria_saude", "editora", "cidade", "estado", "pais",
            "idioma", "versao", "codigo_interno", "doi", "isbn", "issn",
            "especialidade", "categoria", "resumo",
        ]
        for campo in campos_texto:
            valor = dados_brutos.get(campo)
            resultado[campo] = str(valor).strip() if valor and valor != "null" else None

        # ── Campos numéricos ─────────────────────────────────────────
        for campo_num in ("ano_publicacao", "ano_revisao"):
            valor = dados_brutos.get(campo_num)
            if valor is not None and isinstance(valor, (int, float)):
                valor_int = int(valor)
                # Valida range razoável
                if 1500 <= valor_int <= 2030:
                    resultado[campo_num] = valor_int
                else:
                    resultado[campo_num] = None
            else:
                resultado[campo_num] = None

        # ── Campos array ─────────────────────────────────────────────
        for campo_arr in ("autor", "palavras_chave"):
            valor = dados_brutos.get(campo_arr, [])
            if isinstance(valor, list):
                resultado[campo_arr] = [
                    str(v).strip() for v in valor if v and str(v).strip()
                ]
            elif isinstance(valor, str) and valor.strip():
                # Às vezes a IA retorna string em vez de array
                resultado[campo_arr] = [valor.strip()]
            else:
                resultado[campo_arr] = []

        # ── Tipo documental ──────────────────────────────────────────
        tipo = dados_brutos.get("tipo_documental", "")
        resultado["tipo_documental"] = Classifier._normalizar_tipo(tipo, nome_arquivo)

        # ── Área de conhecimento ─────────────────────────────────────
        area = dados_brutos.get("area_conhecimento", "")
        resultado["area_conhecimento"] = Classifier._normalizar_area(area, nome_arquivo)

        return resultado

    @staticmethod
    def _normalizar_tipo(tipo: str, nome_arquivo: str = "") -> Optional[str]:
        """Normaliza o tipo documental para um valor canônico."""
        if not tipo or tipo == "null":
            return Classifier._inferir_tipo_por_nome(nome_arquivo)

        tipo_limpo = tipo.strip().lower().replace("_", " ")

        # Verifica match exato
        tipo_underscore = tipo_limpo.replace(" ", "_")
        if tipo_underscore in TIPOS_DOCUMENTAIS_VALIDOS:
            return tipo_underscore

        # Verifica sinônimos
        for sinonimo, canonico in SINONIMOS_TIPO.items():
            if sinonimo in tipo_limpo:
                return canonico

        return "outro"

    @staticmethod
    def _normalizar_area(area: str, nome_arquivo: str = "") -> Optional[str]:
        """Normaliza a área de conhecimento para um valor canônico."""
        if not area or area == "null":
            return Classifier._inferir_area_por_nome(nome_arquivo)

        area_limpa = area.strip().replace(" ", "_")

        if area_limpa in AREAS_CONHECIMENTO_VALIDAS:
            return area_limpa

        # Tenta match parcial
        for area_valida in AREAS_CONHECIMENTO_VALIDAS:
            if area_valida.lower() in area_limpa.lower():
                return area_valida

        return area_limpa if area_limpa else None

    # ── Heurísticas (fallback sem IA) ───────────────────────────────

    @staticmethod
    def classificar_por_heuristica(nome_arquivo: str, texto: str) -> dict:
        """Classificação baseada em heurísticas (regex no nome e texto).

        Usado como fallback quando a API DeepSeek falha.
        """
        nome_lower = nome_arquivo.lower()
        texto_lower = texto.lower() if texto else ""

        return {
            "tipo_documental": Classifier._inferir_tipo_por_nome(nome_arquivo, texto_lower),
            "area_conhecimento": Classifier._inferir_area_por_nome(nome_arquivo, texto_lower),
            "titulo": None,
            "subtitulo": None,
            "autor": [],
            "instituicao": None,
            "orgao_governamental": None,
            "ministerio": None,
            "conselho": None,
            "universidade": None,
            "hospital": None,
            "secretaria_saude": None,
            "editora": None,
            "cidade": None,
            "estado": None,
            "pais": "Brasil",
            "idioma": "pt",
            "ano_publicacao": Classifier._extrair_ano_do_nome(nome_arquivo),
            "ano_revisao": None,
            "versao": None,
            "codigo_interno": None,
            "doi": None,
            "isbn": None,
            "issn": None,
            "palavras_chave": [],
            "especialidade": None,
            "categoria": None,
            "resumo": None,
        }

    @staticmethod
    def _inferir_tipo_por_nome(nome: str, texto: str = "") -> Optional[str]:
        """Infere o tipo documental pelo nome do arquivo."""
        nome_lower = nome.lower()

        padroes = [
            (r"artigo|paper|journal|revista|scielo|pmc\d", "artigo_cientifico"),
            (r"protocolo|protocol", "protocolo"),
            (r"\bpop[\.\-_]|procedimento.operacional", "pop"),
            (r"resolu[çc][aã]o|resolucao", "resolucao"),
            (r"manual|handbook|guia(?! prático)|guia(?! pratico)", "manual"),
            (r"diretriz|guideline", "diretriz"),
            (r"nota.t[eé]cnica|parecer", "nota_tecnica"),
            (r"cartilha|cartilla|booklet", "cartilha"),
            (r"livro|book(?!let)", "livro"),
            (r"lei |decreto|legisla[cç]", "legislacao"),
            (r"portaria|portar[ií]a", "portaria"),
            (r"tese|thesis|doutorado|phd", "tese"),
            (r"disserta[cç]|mestrado|msc", "dissertacao"),
            (r"monografia|tcc|trabalho.conclus", "monografia"),
            (r"formul[áa]rio|form\b|ficha", "formulario"),
            (r"check[_\s]?list|verifica[cç][aã]o", "checklist"),
            (r"fluxograma|fluxo|flowchart", "fluxograma"),
            (r"apresenta[cç][aã]o|slides|ppt", "apresentacao"),
            (r"relat[oó]rio|report(?!agem)", "relatorio"),
            (r"prova|concurso|gabarito|quest[oõ]es", "outro"),
        ]

        for padrao, tipo in padroes:
            if re.search(padrao, nome_lower):
                return tipo

        return "outro"

    @staticmethod
    def _inferir_area_por_nome(nome: str, texto: str = "") -> Optional[str]:
        """Infere a área de conhecimento pelo nome do arquivo."""
        nome_lower = nome.lower()
        texto_lower = texto[:2000].lower() if texto else ""

        combinado = nome_lower + " " + texto_lower

        padroes = [
            (r"enfermag|enfermeir|nursing|cofen|coren", "Enfermagem"),
            (r"medicin|m[eé]dic|clinical| physician", "Medicina"),
            (r"emerg[eê]ncia|urg[eê]ncia|pcr|parada|acls|aph|atendimento.pr[eé]", "Emergencia"),
            (r"\buti\b|intensiv|terapia.intensiva", "UTI"),
            (r"pediatr|neonat|crian[çc]|infantil|ballard|capurro|apgar", "Pediatria"),
            (r"obstetr|gesta|parto|pr[eé].natal|ginecolog", "Obstetricia"),
            (r"cir[úu]rgic|centro.cir[úu]rgico|opera[tc]|perioperat", "Centro_Cirurgico"),
            (r"cardiolog|cardiovasc|coron[áa]r|ecg|eletrocard", "Cardiologia"),
            (r"neurolog|encef[áa]l|avc|ave|glasgow", "Neurologia"),
            (r"farmac|medicamento|droga|dose|posolog", "Farmacologia"),
            (r"sa[úu]de.p[úu]blica|sus|vigil[âa]ncia|epidemio|sanit[áa]", "Saude_Publica"),
            (r"gest[aã]o.hospitalar|administra[cç][aã]o|lideran[çc]", "Gestao_Hospitalar"),
            (r"seguran[çc]a.do.paciente|evento.adverso|notifica[cç][aã]o|erro", "Seguranca_do_Paciente"),
        ]

        for padrao, area in padroes:
            if re.search(padrao, combinado):
                return area

        return "Enfermagem"  # default

    @staticmethod
    def _extrair_ano_do_nome(nome: str) -> Optional[int]:
        """Extrai ano do nome do arquivo (ex: 2024_xxx.pdf)."""
        match = re.search(r"\b(20[0-2][0-9])\b", nome)
        if match:
            ano = int(match.group(1))
            if 2000 <= ano <= 2030:
                return ano
        return None
