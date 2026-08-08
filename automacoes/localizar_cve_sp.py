#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FASE 2.5 — LOCALIZAÇÃO DE FONTES EPIDEMIOLÓGICAS NO CVE-SP
===========================================================
Objetivo: Para cada entidade epidemiológica do mapa final,
localizar a página correspondente no índice A-Z do CVE-SP.

Regras:
- NÃO alterar a estrutura federal (mapa_notificacao_compulsoria_final.json)
- NÃO alterar notificacao-compulsoria.html
- CVE-SP é fonte COMPLEMENTAR de dados epidemiológicos
- Classificação federal NÃO é afetada pelo CVE-SP

Saída:
- automacoes/correspondencias_cve_sp_notificacao.json
- automacoes/relatorio_correspondencias_cve_sp_notificacao.txt
"""

import json
import os
import unicodedata
from datetime import datetime

# ============================================================
# CONFIGURAÇÃO
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MAPA_FINAL = os.path.join(BASE_DIR, "mapa_notificacao_compulsoria_final.json")
SAIDA_JSON = os.path.join(BASE_DIR, "correspondencias_cve_sp_notificacao.json")
SAIDA_TXT = os.path.join(BASE_DIR, "relatorio_correspondencias_cve_sp_notificacao.txt")

URL_INDICE = "https://saude.sp.gov.br/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/agravos-de-a-z/indice-de-a-z"
BASE_CVE = "http://www.saude.sp.gov.br"
BASE_CVE_ALT = "https://www.saude.sp.gov.br"

# ============================================================
# ÍNDICE CVE-SP (extraído manualmente do índice A-Z em 2026-08-08)
# ============================================================

INDICE_CVE_SP = {
    # A
    "Acidentes por Animais peçonhentos": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-por-vetores-e-zoonoses/agravos/animais-peconhentos/",
    "Acidentes e Violências": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-cronicas-nao-transmissiveis/violencias-e-acidentes/",
    "Arboviroses Urbanas": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-por-vetores-e-zoonoses/arboviroses-urbanas/",

    # B
    "Botulismo": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-hidrica-e-alimentar/documentos-tecnicos/botulismo",

    # C
    "Caxumba": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-respiratoria/agravos/caxumba/",
    "Chikungunya": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-por-vetores-e-zoonoses/arboviroses-urbanas/",
    "Cólera": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-hidrica-e-alimentar/documentos-tecnicos/",
    "Conjuntivite": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/oftalmologia-sanitaria/",
    "Coqueluche": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-respiratoria/agravos/coqueluche/",
    "Coronavírus": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-respiratoria/coronavirus-covid-19/",

    # D
    "Dengue": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-por-vetores-e-zoonoses/arboviroses-urbanas/",
    "Difteria": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-respiratoria/agravos/difteria/",
    "Doença de Chagas": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-por-vetores-e-zoonoses/agravos/chagas/",
    "Doença de Creutzfeldt-Jacob (DCJ)": "/resources/cve-centro-de-vigilancia-epidemiologica/areas-de-vigilancia/doencas-transmitidas-por-agua-e-alimentos/doc/proteinas/infnet_dcj.pdf",
    "Doença Diarreica Aguda": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-hidrica-e-alimentar/",
    "Doenças Transm. por Água e Alimentos (DTAA)": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-hidrica-e-alimentar/",
    "Desastres de origem natural": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-ocasionadas-pelo-meio-ambiente/",
    "Doenças Crônicas Não Transmissíveis": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-cronicas-nao-transmissiveis/",
    "Doenças Exantemáticas": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-respiratoria/agravos/rubeola-sarampo-e-sindrome-da-rubeola-congenita/",
    "DST/AIDS": "/centro-de-referencia-e-treinamento-dstaids-sp/",

    # E
    "Escarlatina": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-respiratoria/agravos/escarlatina/",
    "Escorpião": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-por-vetores-e-zoonoses/agravos/animais-peconhentos/escorpioes/",
    "Esporotricose": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-por-vetores-e-zoonoses/agravos/esporotricose/",
    "Esquistossomose": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-por-vetores-e-zoonoses/agravos/esquistossomose/",

    # F
    "Febre Amarela": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-por-vetores-e-zoonoses/agravos/febre-amarela/",
    "Febre do Nilo": "/resources/cve-centro-de-vigilancia-epidemiologica/indice-de-a-z/fnilo.html",
    "Febre Maculosa": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-por-vetores-e-zoonoses/agravos/febre-maculosa/",
    "Febre Oropouche": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-por-vetores-e-zoonoses/agravos/febre-oropouche/",
    "Febre Purpúrica": "/resources/cve-centro-de-vigilancia-epidemiologica/indice-de-a-z/fpurpurica.htm",
    "Febre Tifóide": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-hidrica-e-alimentar/documentos-tecnicos/febre-tifoide",
    "Filariose": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-por-vetores-e-zoonoses/agravos/filariose/",

    # G
    "Gestantes HIV+": "/centro-de-referencia-e-treinamento-dstaids-sp/",

    # H
    "Hanseníase": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/hanseniase/",
    "Hantaviroses": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-por-vetores-e-zoonoses/agravos/hantavirose/",
    "Hepatite A": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-hidrica-e-alimentar/",
    "Hepatites Virais": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/hepatites-virais-b-e-c/",

    # I
    "Influenza": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-respiratoria/agravos/influenza-srag-mers-cov/",

    # L
    "Leishmaniose Cutânea": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-por-vetores-e-zoonoses/agravos/leishmaniose-cutanea/",
    "Leishmaniose Visceral": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-por-vetores-e-zoonoses/agravos/leishmaniose-visceral/",
    "Leptospirose": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-por-vetores-e-zoonoses/agravos/leptospirose/",

    # M
    "Malária": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-por-vetores-e-zoonoses/agravos/malaria/",
    "Meningites": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-respiratoria/agravos/meningites/",

    # P
    "Paralisia Flácida Aguda/Poliomielite": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-hidrica-e-alimentar/documentos-tecnicos/pfapoliomielite",

    # R
    "Raiva Humana": "/resources/cve-centro-de-vigilancia-epidemiologica/indice-de-a-z/raivah.html",
    "Rotavírus": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-hidrica-e-alimentar/",
    "Rubéola": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-respiratoria/agravos/rubeola-sarampo-e-sindrome-da-rubeola-congenita/",

    # S
    "Sarampo": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-respiratoria/agravos/rubeola-sarampo-e-sindrome-da-rubeola-congenita/",
    "Sífilis": "/resources/cve-centro-de-vigilancia-epidemiologica/indice-de-a-z/sifilis.html",
    "Síndrome Hemolítico-Urêmica (SHU)": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-hidrica-e-alimentar/",
    "Síndrome da Rubéola Congênita": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-respiratoria/agravos/rubeola-sarampo-e-sindrome-da-rubeola-congenita/",
    "Síndrome Respiratória Aguda (SRAG)": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-respiratoria/agravos/influenza-srag-mers-cov/",
    "Surtos de Doenças Transmissão Alimentar": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-hidrica-e-alimentar/",

    # T
    "Tétano Acidental": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-por-vetores-e-zoonoses/agravos/tetano-acidental-e-neonatal/",
    "Tétano Neonatal": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-por-vetores-e-zoonoses/agravos/tetano-acidental-e-neonatal/",
    "Tracoma": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/oftalmologia-sanitaria/",
    "Toxoplasmose": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-hidrica-e-alimentar/documentos-tecnicos/toxoplasmose",
    "Tuberculose": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/tuberculose/",

    # V
    "Varicela": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-respiratoria/agravos/varicela/",
    "Vigilância em Saúde Ambiental": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-ocasionadas-pelo-meio-ambiente/",
    "Violências e acidentes": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-cronicas-nao-transmissiveis/violencias-e-acidentes/",

    # Z
    "Zika": "/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-por-vetores-e-zoonoses/arboviroses-urbanas/",

    # Checklist (não é agravo, mas consta no índice)
    "Checklist - Atendimento às vitimas (Aranha, Escorpião, Ofídico)": "https://www.saude.sp.gov.br/cve-centro-de-vigilancia-epidemiologica-prof.-alexandre-vranjac/areas-de-vigilancia/doencas-de-transmissao-por-vetores-e-zoonoses/agravos/animais-peconhentos/checklist-atendimento-as-vitimas",
}


# ============================================================
# FUNÇÕES AUXILIARES
# ============================================================

def normalizar(texto):
    """Normaliza texto: lowercase, remove acentos, remove pontuação extra."""
    texto = texto.lower().strip()
    # Remove acentos
    texto = unicodedata.normalize('NFKD', texto)
    texto = ''.join(c for c in texto if not unicodedata.combining(c))
    # Remove pontuação (mas mantém espaços)
    texto = ''.join(c for c in texto if c.isalnum() or c.isspace())
    # Normaliza espaços
    texto = ' '.join(texto.split())
    return texto


def palavras_chave(texto, min_len=3):
    """Extrai palavras-chave de um texto."""
    palavras = normalizar(texto).split()
    # Filtra palavras muito curtas e stopwords
    stopwords = {'por', 'com', 'dos', 'das', 'para', 'que', 'uma', 'como',
                 'pelo', 'pela', 'aos', 'nas', 'nos', 'aos', 'das', 'dos',
                 'sua', 'seu', 'sao', 'mais', 'outras', 'outros', 'outra',
                 'relacionado', 'relacionada', 'relacionados', 'relacionadas',
                 'aguda', 'agudo', 'cronica', 'cronico', 'humana', 'humano',
                 'suspeita', 'associada', 'associado'}
    return [p for p in palavras if len(p) >= min_len and p not in stopwords]


def resolver_url(caminho):
    """Resolve URL relativa para absoluta."""
    if caminho.startswith('http://') or caminho.startswith('https://'):
        return caminho
    if caminho.startswith('/resources/'):
        return f"http://www.saude.sp.gov.br{caminho}"
    if caminho.startswith('/centro-de-referencia'):
        return f"http://www.saude.sp.gov.br{caminho}"
    return f"http://www.saude.sp.gov.br{caminho}"


def pontuar_correspondencia_direta(nome_entidade, titulo_cve):
    """
    Compara o nome da entidade com o título CVE-SP para correspondência direta.
    Retorna score 0.0-1.0.
    """
    n_ent = normalizar(nome_entidade)
    n_cve = normalizar(titulo_cve)

    # Correspondência exata normalizada
    if n_ent == n_cve:
        return 1.0

    # Um contém o outro
    if n_ent in n_cve or n_cve in n_ent:
        # Se o menor tem pelo menos 70% do comprimento do maior
        razao = min(len(n_ent), len(n_cve)) / max(len(n_ent), len(n_cve))
        if razao >= 0.6:
            return 0.9
        return 0.7

    # Comparação por palavras-chave
    pk_ent = set(palavras_chave(nome_entidade))
    pk_cve = set(palavras_chave(titulo_cve))

    if not pk_ent:
        return 0.0

    intersecao = pk_ent & pk_cve
    score = len(intersecao) / len(pk_ent)

    return score


def encontrar_melhor_cve(nome_entidade, indice_cve, tipo_entidade=""):
    """
    Encontra a melhor correspondência no índice CVE-SP para uma entidade.
    Retorna (titulo, url, score, tipo_correspondencia, justificativa).
    """
    melhor_titulo = None
    melhor_score = 0.0
    melhor_url = None

    for titulo_cve, url_rel in indice_cve.items():
        score = pontuar_correspondencia_direta(nome_entidade, titulo_cve)
        if score > melhor_score:
            melhor_score = score
            melhor_titulo = titulo_cve
            melhor_url = resolver_url(url_rel)

    # Classificar o tipo de correspondência
    if melhor_score >= 0.95:
        tipo = "CONFIRMADA_DIRETA"
        confianca = "ALTA"
        just = f"Correspondência exata com '{melhor_titulo}' no CVE-SP"
    elif melhor_score >= 0.75:
        tipo = "CONFIRMADA_DIRETA"
        confianca = "MEDIA"
        just = f"Correspondência por similaridade com '{melhor_titulo}' (score={melhor_score:.2f})"
    elif melhor_score >= 0.55:
        tipo = "PROVÁVEL"
        confianca = "BAIXA"
        just = f"Correspondência provável com '{melhor_titulo}' (score={melhor_score:.2f})"
    elif melhor_score >= 0.30:
        tipo = "REVISÃO_MANUAL"
        confianca = "BAIXA"
        just = f"Correspondência fraca com '{melhor_titulo}' (score={melhor_score:.2f}) — revisão manual necessária"
    else:
        tipo = "NÃO_ENCONTRADA"
        confianca = "N/A"
        just = "Nenhuma página correspondente encontrada no índice CVE-SP A-Z"
        melhor_titulo = None

    return melhor_titulo, melhor_url, melhor_score, tipo, confianca, just


# ============================================================
# MAPEAMENTOS ESPECIAIS (CASOS CONHECIDOS)
# ============================================================

# Mapeamento manual para entidades que precisam de
# correspondência por categoria ou casos especiais

MAPEAMENTO_ESPECIAL = {
    # DRT: grupo de doenças ocupacionais sem página individual no CVE-SP
    "Câncer relacionado ao trabalho": {
        "titulo": "Doenças Crônicas Não Transmissíveis",
        "url": resolver_url(INDICE_CVE_SP["Doenças Crônicas Não Transmissíveis"]),
        "tipo": "CONFIRMADA_CATEGORIA",
        "confianca": "MEDIA",
        "justificativa": "CVE-SP não possui página específica para câncer ocupacional. "
                         "Página de Doenças Crônicas Não Transmissíveis é a categoria mais abrangente."
    },
    "Dermatoses ocupacionais": {
        "titulo": None,
        "url": None,
        "tipo": "NÃO_ENCONTRADA",
        "confianca": "N/A",
        "justificativa": "CVE-SP não possui página específica para dermatoses ocupacionais."
    },
    "Distúrbio de voz relacionado ao trabalho": {
        "titulo": None,
        "url": None,
        "tipo": "NÃO_ENCONTRADA",
        "confianca": "N/A",
        "justificativa": "CVE-SP não possui página específica para distúrbio de voz ocupacional."
    },
    "LER/DORT": {
        "titulo": None,
        "url": None,
        "tipo": "NÃO_ENCONTRADA",
        "confianca": "N/A",
        "justificativa": "CVE-SP não possui página específica para LER/DORT."
    },
    "Perda Auditiva relacionada ao trabalho (PAIR)": {
        "titulo": None,
        "url": None,
        "tipo": "NÃO_ENCONTRADA",
        "confianca": "N/A",
        "justificativa": "CVE-SP não possui página específica para PAIR."
    },
    "Transtornos mentais relacionados ao trabalho": {
        "titulo": None,
        "url": None,
        "tipo": "NÃO_ENCONTRADA",
        "confianca": "N/A",
        "justificativa": "CVE-SP não possui página específica para transtornos mentais ocupacionais."
    },

    # Exantemáticas
    "Rubéola": {
        "titulo": "Rubéola",
        "url": resolver_url(INDICE_CVE_SP["Rubéola"]),
        "tipo": "CONFIRMADA_DIRETA",
        "confianca": "ALTA",
        "justificativa": "Página individual 'Rubéola' no CVE-SP. Também presente em 'Doenças Exantemáticas' "
                         "e 'Síndrome da Rubéola Congênita'. Fonte compartilhada com Sarampo."
    },

    # Hepatites
    "Hepatites Virais (A, B, C, D, E)": {
        "titulo": "Hepatites Virais",
        "url": resolver_url(INDICE_CVE_SP["Hepatites Virais"]),
        "tipo": "CONFIRMADA_DIRETA",
        "confianca": "ALTA",
        "justificativa": "Página 'Hepatites Virais' no CVE-SP cobre hepatites B e C. "
                         "Hepatite A também possui entrada separada (Doenças de Transmissão Hídrica e Alimentar). "
                         "Fonte compartilhada: ambas as páginas podem ser usadas."
    },

    # Leishmaniose
    "Leishmaniose Tegumentar Americana": {
        "titulo": "Leishmaniose Cutânea",
        "url": resolver_url(INDICE_CVE_SP["Leishmaniose Cutânea"]),
        "tipo": "CONFIRMADA_DIRETA",
        "confianca": "ALTA",
        "justificativa": "CVE-SP utiliza o termo 'Leishmaniose Cutânea'. "
                         "Leishmaniose Tegumentar Americana = Leishmaniose Cutânea (mesma entidade, nomenclatura diferente)."
    },
    "Leishmaniose Visceral": {
        "titulo": "Leishmaniose Visceral",
        "url": resolver_url(INDICE_CVE_SP["Leishmaniose Visceral"]),
        "tipo": "CONFIRMADA_DIRETA",
        "confianca": "ALTA",
        "justificativa": "Correspondência exata com página 'Leishmaniose Visceral' no CVE-SP."
    },

    # Polio/PFA
    "Poliomielite": {
        "titulo": "Paralisia Flácida Aguda/Poliomielite",
        "url": resolver_url(INDICE_CVE_SP["Paralisia Flácida Aguda/Poliomielite"]),
        "tipo": "CONFIRMADA_DIRETA",
        "confianca": "ALTA",
        "justificativa": "Página compartilhada 'Paralisia Flácida Aguda/Poliomielite' no CVE-SP. "
                         "Fonte compartilhada: mesma página serve Poliomielite e PFA.",
        "fonte_compartilhada": True,
        "compartilhada_com": "Paralisia Flácida Aguda (PFA)"
    },
    "Paralisia Flácida Aguda (PFA)": {
        "titulo": "Paralisia Flácida Aguda/Poliomielite",
        "url": resolver_url(INDICE_CVE_SP["Paralisia Flácida Aguda/Poliomielite"]),
        "tipo": "CONFIRMADA_DIRETA",
        "confianca": "ALTA",
        "justificativa": "Página compartilhada 'Paralisia Flácida Aguda/Poliomielite' no CVE-SP. "
                         "Fonte compartilhada: mesma página serve PFA e Poliomielite.",
        "fonte_compartilhada": True,
        "compartilhada_com": "Poliomielite"
    },

    # HIV/AIDS
    "HIV / AIDS": {
        "titulo": "DST/AIDS",
        "url": resolver_url(INDICE_CVE_SP["DST/AIDS"]),
        "tipo": "CONFIRMADA_DIRETA",
        "confianca": "ALTA",
        "justificativa": "CVE-SP utiliza a página 'DST/AIDS' do CRT-SP como referência para HIV/AIDS. "
                         "Também há entrada 'Gestantes HIV+' que redireciona para a mesma página."
    },

    # COVID-19
    "Covid-19": {
        "titulo": "Coronavírus",
        "url": resolver_url(INDICE_CVE_SP["Coronavírus"]),
        "tipo": "CONFIRMADA_DIRETA",
        "confianca": "ALTA",
        "justificativa": "CVE-SP utiliza 'Coronavírus' como página abrangente para COVID-19."
    },
    "COVID-19 / Coronavírus": {
        "titulo": "Coronavírus",
        "url": resolver_url(INDICE_CVE_SP["Coronavírus"]),
        "tipo": "CONFIRMADA_DIRETA",
        "confianca": "ALTA",
        "justificativa": "Mesma página 'Coronavírus' no CVE-SP. "
                         "Nota: entidade duplicada no mapa (id repetido 'covid19')."
    },

    # Raiva
    "Raiva": {
        "titulo": "Raiva Humana",
        "url": resolver_url(INDICE_CVE_SP["Raiva Humana"]),
        "tipo": "CONFIRMADA_DIRETA",
        "confianca": "ALTA",
        "justificativa": "CVE-SP utiliza 'Raiva Humana' como título. Mesma entidade."
    },

    # Febre do Nilo
    "Febre do Nilo Ocidental e Arboviroses": {
        "titulo": "Febre do Nilo",
        "url": resolver_url(INDICE_CVE_SP["Febre do Nilo"]),
        "tipo": "CONFIRMADA_DIRETA",
        "confianca": "ALTA",
        "justificativa": "CVE-SP utiliza 'Febre do Nilo'. Mesma entidade (West Nile virus)."
    },

    # Febre Maculosa
    "Febre Maculosa e Riquetisioses": {
        "titulo": "Febre Maculosa",
        "url": resolver_url(INDICE_CVE_SP["Febre Maculosa"]),
        "tipo": "CONFIRMADA_DIRETA",
        "confianca": "ALTA",
        "justificativa": "CVE-SP utiliza 'Febre Maculosa'. Mesma entidade."
    },

    # Febre Tifoide
    "Febre Tifoide": {
        "titulo": "Febre Tifóide",
        "url": resolver_url(INDICE_CVE_SP["Febre Tifóide"]),
        "tipo": "CONFIRMADA_DIRETA",
        "confianca": "ALTA",
        "justificativa": "Variação de grafia: 'Tifoide' vs 'Tifóide'. Mesma doença (Salmonella Typhi)."
    },

    # Tétano
    "Tétano": {
        "titulo": "Tétano Acidental",
        "url": resolver_url(INDICE_CVE_SP["Tétano Acidental"]),
        "tipo": "CONFIRMADA_DIRETA",
        "confianca": "ALTA",
        "justificativa": "CVE-SP separa 'Tétano Acidental' e 'Tétano Neonatal' em entradas distintas. "
                         "Ambas apontam para a mesma página. A entidade federal 'Tétano' abrange ambos.",
        "fonte_compartilhada": True,
    },

    # Hantavirose
    "Hantavirose": {
        "titulo": "Hantaviroses",
        "url": resolver_url(INDICE_CVE_SP["Hantaviroses"]),
        "tipo": "CONFIRMADA_DIRETA",
        "confianca": "ALTA",
        "justificativa": "Variação singular/plural. Mesma entidade."
    },

    # Doença Invasiva / Meningites
    "Doença Invasiva / Meningites": {
        "titulo": "Meningites",
        "url": resolver_url(INDICE_CVE_SP["Meningites"]),
        "tipo": "CONFIRMADA_CATEGORIA",
        "confianca": "MEDIA",
        "justificativa": "CVE-SP possui página 'Meningites'. A entidade federal também inclui "
                         "'Doença Invasiva por Haemophilus Influenzae e Doença Meningocócica'. "
                         "A página de Meningites cobre parte do escopo."
    },

    # Febres Hemorrágicas
    "Febres Hemorrágicas Emergentes/Reemergentes": {
        "titulo": "Febre Purpúrica",
        "url": resolver_url(INDICE_CVE_SP["Febre Purpúrica"]),
        "tipo": "CONFIRMADA_CATEGORIA",
        "confianca": "BAIXA",
        "justificativa": "CVE-SP possui 'Febre Purpúrica' (Febre Purpúrica Brasileira) que é uma das "
                         "febres hemorrágicas listadas na entidade federal. Cobertura parcial."
    },

    # Violência
    "Violência": {
        "titulo": "Violências e acidentes",
        "url": resolver_url(INDICE_CVE_SP["Violências e acidentes"]),
        "tipo": "CONFIRMADA_CATEGORIA",
        "confianca": "MEDIA",
        "justificativa": "CVE-SP utiliza 'Violências e acidentes' como categoria abrangente. "
                         "Cobre violência doméstica, sexual e outras formas."
    },

    # Acidente de Trabalho
    "Acidente de Trabalho": {
        "titulo": "Acidentes e Violências",
        "url": resolver_url(INDICE_CVE_SP["Acidentes e Violências"]),
        "tipo": "CONFIRMADA_CATEGORIA",
        "confianca": "BAIXA",
        "justificativa": "CVE-SP agrupa acidentes e violências em página única. "
                         "Não há página específica para acidente de trabalho. "
                         "A página 'Acidentes e Violências' é a mais próxima."
    },

    # Acidente por Animal Peçonhento
    "Acidente por Animal Peçonhento": {
        "titulo": "Acidentes por Animais peçonhentos",
        "url": resolver_url(INDICE_CVE_SP["Acidentes por Animais peçonhentos"]),
        "tipo": "CONFIRMADA_DIRETA",
        "confianca": "ALTA",
        "justificativa": "Variação plural/singular. Mesma entidade."
    },

    # Síndrome Gripal suspeita de covid-19
    "Síndrome Gripal suspeita de covid-19": {
        "titulo": "Coronavírus",
        "url": resolver_url(INDICE_CVE_SP["Coronavírus"]),
        "tipo": "CONFIRMADA_CATEGORIA",
        "confianca": "MEDIA",
        "justificativa": "CVE-SP utiliza 'Coronavírus' como página abrangente. "
                         "A SRAG também possui entrada 'Síndrome Respiratória Aguda (SRAG)'."
    },

    # SIM pós-COVID
    "Síndrome Inflamatória Multissistêmica (SIM) pós-COVID-19": {
        "titulo": "Coronavírus",
        "url": resolver_url(INDICE_CVE_SP["Coronavírus"]),
        "tipo": "CONFIRMADA_CATEGORIA",
        "confianca": "BAIXA",
        "justificativa": "CVE-SP não possui página específica para SIM-A. "
                         "Página 'Coronavírus' é a categoria mais abrangente."
    },

    # SIM-P
    "Síndrome Inflamatória Multissitêmica Pediátrica (SIM-P) associada à covid-19": {
        "titulo": "Coronavírus",
        "url": resolver_url(INDICE_CVE_SP["Coronavírus"]),
        "tipo": "CONFIRMADA_CATEGORIA",
        "confianca": "BAIXA",
        "justificativa": "CVE-SP não possui página específica para SIM-P. "
                         "Página 'Coronavírus' é a categoria mais abrangente."
    },

    # Monkeypox
    "Monkeypox (Mpox)": {
        "titulo": None,
        "url": None,
        "tipo": "REVISÃO_MANUAL",
        "confianca": "N/A",
        "justificativa": "Monkeypox/Mpox não consta no índice A-Z do CVE-SP. "
                         "Pode existir em outra seção do site. Revisão manual necessária."
    },

    # Doença Falciforme
    "Doença Falciforme": {
        "titulo": None,
        "url": None,
        "tipo": "REVISÃO_MANUAL",
        "confianca": "N/A",
        "justificativa": "Doença Falciforme não consta no índice A-Z do CVE-SP. "
                         "Possivelmente coberta por Doenças Crônicas Não Transmissíveis. "
                         "Revisão manual necessária."
    },

    # DCJ
    "Doença de Creutzfeldt-Jakob (DCJ)": {
        "titulo": "Doença de Creutzfeldt-Jacob (DCJ)",
        "url": resolver_url(INDICE_CVE_SP["Doença de Creutzfeldt-Jacob (DCJ)"]),
        "tipo": "CONFIRMADA_DIRETA",
        "confianca": "ALTA",
        "justificativa": "Correspondência com página 'Doença de Creutzfeldt-Jacob (DCJ)' no CVE-SP. "
                         "Nota: a página é um PDF."
    },

    # Influenza
    "Influenza": {
        "titulo": "Influenza",
        "url": resolver_url(INDICE_CVE_SP["Influenza"]),
        "tipo": "CONFIRMADA_DIRETA",
        "confianca": "ALTA",
        "justificativa": "Correspondência exata. Página 'Influenza' também cobre SRAG e MERS-CoV."
    },

    # Evento de Saúde Pública
    "Evento de Saúde Pública (ESP)": {
        "titulo": None,
        "url": None,
        "tipo": "NÃO_ENCONTRADA",
        "confianca": "N/A",
        "justificativa": "ESP é um conceito genérico de vigilância, não um agravo específico. "
                         "CVE-SP não possui página dedicada a ESP como entidade única."
    },

    # Eventos adversos pós-vacinação
    "Eventos adversos graves ou óbitos pós-vaccinação": {
        "titulo": None,
        "url": None,
        "tipo": "NÃO_ENCONTRADA",
        "confianca": "N/A",
        "justificativa": "CVE-SP não possui página específica para eventos adversos pós-vacinação no índice A-Z."
    },

    # Disseminação intencional
    "Doenças com Suspeita de Disseminação Intencional": {
        "titulo": None,
        "url": None,
        "tipo": "NÃO_ENCONTRADA",
        "confianca": "N/A",
        "justificativa": "Categoria de vigilância (bioterrorismo), não um agravo individual. "
                         "CVE-SP não possui página dedicada no índice A-Z."
    },

    # Intoxicação Exógena
    "Intoxicação Exógena (por substâncias químicas, incluindo agrotóxicos, gases tóxicos e metais pesados)": {
        "titulo": None,
        "url": None,
        "tipo": "REVISÃO_MANUAL",
        "confianca": "N/A",
        "justificativa": "Intoxicação exógena não consta no índice A-Z do CVE-SP. "
                         "Possivelmente coberta por Vigilância em Saúde Ambiental. "
                         "Revisão manual necessária."
    },

    # Pneumoconioses
    "Pneumoconioses relacionadas ao trabalho": {
        "titulo": None,
        "url": None,
        "tipo": "NÃO_ENCONTRADA",
        "confianca": "N/A",
        "justificativa": "CVE-SP não possui página específica para pneumoconioses no índice A-Z."
    },

    # Óbito
    "Óbito (Infantil e Materno)": {
        "titulo": None,
        "url": None,
        "tipo": "REVISÃO_MANUAL",
        "confianca": "N/A",
        "justificativa": "Óbito infantil e materno não constam como agravo individual no índice A-Z. "
                         "Podem estar cobertos em outras seções do CVE-SP. Revisão manual necessária."
    },

    # Anomalias congênitas
    "Anomalias congênitas": {
        "titulo": None,
        "url": None,
        "tipo": "REVISÃO_MANUAL",
        "confianca": "N/A",
        "justificativa": "Anomalias congênitas não constam no índice A-Z do CVE-SP. "
                         "Revisão manual necessária."
    },
}


# ============================================================
# EXTRAÇÃO DE ENTIDADES
# ============================================================

def extrair_entidades(mapa):
    """Extrai todas as entidades epidemiológicas do mapa final."""
    entidades = []

    # Grupos organizadores
    for grupo in mapa.get("grupos_organizadores", []):
        nome_grupo = grupo.get("nome_grupo", "")
        for entidade in grupo.get("entidades", []):
            entidades.append({
                "nome": entidade["nome"],
                "tipo": entidade.get("tipo_entidade", ""),
                "grupo_organizador": nome_grupo,
                "num_entradas": len(entidade.get("entradas", [])),
            })

    # Entidades independentes
    for item in mapa.get("entidades_independentes", []):
        for entidade in item.get("entidades", []):
            entidades.append({
                "nome": entidade["nome"],
                "tipo": entidade.get("tipo_entidade", ""),
                "grupo_organizador": None,
                "num_entradas": len(entidade.get("entradas", [])),
            })

    return entidades


# ============================================================
# CORRESPONDÊNCIA
# ============================================================

def realizar_correspondencia(entidades):
    """Para cada entidade, encontra a página CVE-SP correspondente."""
    resultados = []

    for i, entidade in enumerate(entidades):
        nome = entidade["nome"]
        print(f"  ... {i+1}/{len(entidades)}: {nome}")

        # Verificar mapeamento especial primeiro
        if nome in MAPEAMENTO_ESPECIAL:
            especial = MAPEAMENTO_ESPECIAL[nome]
            resultado = {
                "nome": nome,
                "tipo": entidade["tipo"],
                "grupo_organizador": entidade["grupo_organizador"],
                "num_entradas": entidade["num_entradas"],
                "cve_sp": {
                    "titulo": especial["titulo"],
                    "url": especial["url"],
                    "tipo_correspondencia": especial["tipo"],
                    "confianca": especial["confianca"],
                    "justificativa": especial["justificativa"],
                    "fonte_compartilhada": especial.get("fonte_compartilhada", False),
                }
            }
            if "compartilhada_com" in especial:
                resultado["cve_sp"]["compartilhada_com"] = especial["compartilhada_com"]
        else:
            # Correspondência automática
            titulo, url, score, tipo, confianca, just = encontrar_melhor_cve(
                nome, INDICE_CVE_SP, entidade["tipo"]
            )
            resultado = {
                "nome": nome,
                "tipo": entidade["tipo"],
                "grupo_organizador": entidade["grupo_organizador"],
                "num_entradas": entidade["num_entradas"],
                "cve_sp": {
                    "titulo": titulo,
                    "url": url,
                    "tipo_correspondencia": tipo,
                    "confianca": confianca,
                    "justificativa": just,
                    "fonte_compartilhada": False,
                }
            }

        resultados.append(resultado)

    return resultados


# ============================================================
# SAÍDA
# ============================================================

def gerar_json(resultados, metadata_mapa):
    """Gera o JSON de correspondências."""
    output = {
        "metadata": {
            "fonte": "CVE-SP — Centro de Vigilância Epidemiológica 'Prof. Alexandre Vranjac'",
            "url_indice": URL_INDICE,
            "data_consulta": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "total_entidades_analisadas": len(resultados),
            "fase": "2.5 — Localização de Fontes CVE-SP",
            "mapa_referencia": "mapa_notificacao_compulsoria_final.json",
        },
        "entidades": resultados,
    }
    return output


def gerar_relatorio_txt(resultados):
    """Gera o relatório em texto."""
    linhas = []
    linhas.append("=" * 70)
    linhas.append("CORRESPONDÊNCIA — ENTIDADES × CVE-SP")
    linhas.append(f"Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    linhas.append(f"Fonte: {URL_INDICE}")
    linhas.append("")

    total = len(resultados)
    diretas = sum(1 for r in resultados if r["cve_sp"]["tipo_correspondencia"] == "CONFIRMADA_DIRETA")
    categorias = sum(1 for r in resultados if r["cve_sp"]["tipo_correspondencia"] == "CONFIRMADA_CATEGORIA")
    provaveis = sum(1 for r in resultados if r["cve_sp"]["tipo_correspondencia"] == "PROVÁVEL")
    revisoes = sum(1 for r in resultados if r["cve_sp"]["tipo_correspondencia"] == "REVISÃO_MANUAL")
    nao_encontradas = sum(1 for r in resultados if r["cve_sp"]["tipo_correspondencia"] == "NÃO_ENCONTRADA")

    linhas.append(f"Entidades analisadas: {total}")
    linhas.append("")
    linhas.append(f"CONFIRMADA_DIRETA:     {diretas}")
    linhas.append(f"CONFIRMADA_CATEGORIA:  {categorias}")
    linhas.append(f"PROVÁVEL:              {provaveis}")
    linhas.append(f"REVISÃO_MANUAL:        {revisoes}")
    linhas.append(f"NÃO_ENCONTRADA:        {nao_encontradas}")
    linhas.append("")
    linhas.append("-" * 70)
    linhas.append("ENTIDADES")
    linhas.append("")

    for i, r in enumerate(resultados):
        cve = r["cve_sp"]
        linhas.append(f" {i+1:2d}. Entidade: {r['nome']}")
        if r["grupo_organizador"]:
            linhas.append(f"     Grupo: {r['grupo_organizador']}")
        linhas.append(f"     Tipo: {r['tipo']}")
        linhas.append(f"     CVE-SP: {cve['titulo'] or '—'}")
        linhas.append(f"     URL: {cve['url'] or '—'}")
        linhas.append(f"     Correspondência: {cve['tipo_correspondencia']}")
        linhas.append(f"     Confiança: {cve['confianca']}")
        linhas.append(f"     Justificativa: {cve['justificativa']}")
        if cve.get("fonte_compartilhada"):
            compartilhada = cve.get("compartilhada_com", "sim")
            linhas.append(f"     Fonte compartilhada: {compartilhada}")
        linhas.append(f"     Entradas de notificação: {r['num_entradas']}")
        linhas.append("")

    linhas.append("=" * 70)

    return "\n".join(linhas)


# ============================================================
# MAIN
# ============================================================

def main():
    print("=" * 70)
    print("FASE 2.5 — LOCALIZAÇÃO DAS FONTES CVE-SP")
    print("=" * 70)
    print()

    # Carregar mapa final
    print("[1/3] Carregando mapa final...")
    with open(MAPA_FINAL, "r", encoding="utf-8") as f:
        mapa = json.load(f)

    entidades = extrair_entidades(mapa)
    print(f"  [OK] {len(entidades)} entidades epidemiológicas extraídas")
    print()

    # Realizar correspondência
    print(f"[2/3] Realizando correspondência para {len(entidades)} entidades...")
    resultados = realizar_correspondencia(entidades)
    print(f"  [OK] {len(resultados)} correspondências avaliadas")
    print()

    # Gerar saídas
    print("[3/3] Gerando relatórios...")

    # JSON
    json_output = gerar_json(resultados, mapa.get("metadata", {}))
    with open(SAIDA_JSON, "w", encoding="utf-8") as f:
        json.dump(json_output, f, ensure_ascii=False, indent=2)
    print(f"  [OK] {SAIDA_JSON}")

    # TXT
    txt_output = gerar_relatorio_txt(resultados)
    with open(SAIDA_TXT, "w", encoding="utf-8") as f:
        f.write(txt_output)
    print(f"  [OK] {SAIDA_TXT}")
    print()

    # Resumo
    diretas = sum(1 for r in resultados if r["cve_sp"]["tipo_correspondencia"] == "CONFIRMADA_DIRETA")
    categorias = sum(1 for r in resultados if r["cve_sp"]["tipo_correspondencia"] == "CONFIRMADA_CATEGORIA")
    provaveis = sum(1 for r in resultados if r["cve_sp"]["tipo_correspondencia"] == "PROVÁVEL")
    revisoes = sum(1 for r in resultados if r["cve_sp"]["tipo_correspondencia"] == "REVISÃO_MANUAL")
    nao_encontradas = sum(1 for r in resultados if r["cve_sp"]["tipo_correspondencia"] == "NÃO_ENCONTRADA")

    print("=" * 70)
    print("FASE 2.5 CONCLUÍDA")
    print(f"Entidades analisadas: {len(resultados)}")
    print()
    print(f"Correspondências diretas:      {diretas}")
    print(f"Correspondências por categoria:{categorias}")
    print(f"Prováveis:                     {provaveis}")
    print(f"Revisão manual:                {revisoes}")
    print(f"Não encontradas:               {nao_encontradas}")
    print()
    print(f"Arquivo:    {SAIDA_JSON}")
    print(f"Relatório:  {SAIDA_TXT}")
    print("=" * 70)


if __name__ == "__main__":
    main()
