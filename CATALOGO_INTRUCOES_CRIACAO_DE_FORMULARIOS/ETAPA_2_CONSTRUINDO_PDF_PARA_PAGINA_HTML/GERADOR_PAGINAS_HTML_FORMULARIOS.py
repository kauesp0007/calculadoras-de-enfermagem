# -*- coding: utf-8 -*-
"""
GERADOR_PAGINAS_HTML_FORMULARIOS.py
Gerador Automatizado de Páginas HTML com Visualizador de PDF A4 a 100%
Calculadoras de Enfermagem — www.calculadorasdeenfermagem.com.br
"""

import os
import json
import argparse

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_PATH = os.path.join(SCRIPT_DIR, "TEMPLATE_PAGINA_FORMULARIO_CANONICA.html")
ROOT_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))

# Metadados das Escalas Clínicas para Geração Canônica
FORMULARIOS_METADATA = [
    {
        "nome": "Escala de Aldrete e Kroulik",
        "slug": "formulario_escala_de_aldrete.html",
        "pdf": "formulario_escala_de_aldrete.pdf",
        "desc": "Ficha da Escala de Aldrete e Kroulik para avaliação da recuperação pós-anestésica (SRPA), preenchimento e impressão em folha A4.",
        "sub": "Avaliação do Índice de Recuperação Pós-Anestésica (SRPA) para Alta Segura",
        "uso": "A Escala de Aldrete e Kroulik avalia cinco parâmetros fisiológicos vitais (atividade motora, respiração, circulação, consciência e saturação de O2) para determinar a aptidão de alta da Sala de Recuperação Pós-Anestésica.",
        "ref": "Aldrete JA, Kroulik D. A postanesthetic recovery score. Anesth Analg, 1970.",
        "keywords": "Escala de Aldrete, SRPA, recuperação pós-anestésica, alta cirúrgica, formulário para imprimir, enfermagem",
        "aspects": ["Recuperação Pós-Anestésica", "SRPA", "Critérios de Alta", "Enfermagem Perioperatória"]
    },
    {
        "nome": "Escore APACHE II",
        "slug": "formulario_escala_de_apache.html",
        "pdf": "formulario_escala_de_apache.pdf",
        "desc": "Ficha do Escore APACHE II para avaliação de gravidade e prognóstico em UTI, preenchimento e impressão em formulário A4.",
        "sub": "Acute Physiology and Chronic Health Evaluation II para Pacientes Críticos em UTI",
        "uso": "O escore APACHE II quantifica a gravidade fisiológica aguda, idade e condições de saúde crônica nas primeiras 24 horas de admissão na UTI para estimar o risco de mortalidade hospitalar.",
        "ref": "Knaus WA, et al. APACHE II: a severity of disease classification system. Crit Care Med, 1985.",
        "keywords": "APACHE II, gravidade em UTI, terapia intensiva, mortalidade em UTI, formulário para imprimir, enfermagem",
        "aspects": ["Terapia Intensiva", "UTI", "Gravidade Fisiológica", "Prognóstico"]
    },
    {
        "nome": "Escala de Braden",
        "slug": "formulario_escala_de_braden.html",
        "pdf": "formulario_escala_de_braden.pdf",
        "desc": "Ficha da Escala de Braden para avaliação do risco de lesão por pressão (LPP), preenchimento e impressão em formulário A4.",
        "sub": "Avaliação Preditiva do Risco de Lesão por Pressão (LPP) em Pacientes Hospitalizados",
        "uso": "A Escala de Braden avalia 6 subescalas críticas: percepção sensorial, umidade, atividade, mobilidade, nutrição e fricção/cisalhamento para direcionar protocolos preventivos de lesão por pressão.",
        "ref": "Bergstrom N, Braden BJ, et al. The Braden Scale for Predicting Pressure Sore Risk. Nurs Res, 1987.",
        "keywords": "Escala de Braden, lesão por pressão, LPP, prevenção de úlcera, formulário para imprimir, enfermagem",
        "aspects": ["Lesão por Pressão", "Segurança do Paciente", "Prevenção de LPP", "Cuidados de Enfermagem"]
    }
]

def gerar_pagina_formulario(metadata, template_str, destino_dir):
    """Compila o template HTML com os metadados da escala e grava no diretório de destino."""
    registry = json.load(open(os.path.join(ROOT_DIR, 'scripts', 'assistential-preview-map.json'), encoding='utf-8'))
    form = next((e for e in registry if e['pdf'] == '/FORMULARIOS_DE_ESCALAS/' + metadata['pdf']), None)
    if form is None: raise ValueError('Registre o PDF no mapa antes de criar a pagina')
    quality = json.load(open(os.path.join(ROOT_DIR, 'scripts', 'assistential-preview-quality.json'), encoding='utf-8'))
    image = next(e for e in quality if e['id'] == form['id'] and e['language'] == form['language'])
    html = template_str
    for name, value in {'FORM_ID':form['id'],'CATALOG_PATH':form['catalog'],'PREVIEW_PATH':'/'+image['preview'],'PREVIEW_WIDTH':image['width'],'PREVIEW_HEIGHT':image['height']}.items():
        html = html.replace('{{'+name+'}}', str(value))
    html = html.replace("{{NOME_CANONICO}}", metadata["nome"])
    html = html.replace("{{SLUG_HTML}}", metadata["slug"])
    html = html.replace("{{NOME_ARQUIVO_PDF}}", metadata["pdf"])
    html = html.replace("{{META_DESCRIPTION}}", metadata["desc"])
    html = html.replace("{{SUBTITULO_CLINICO}}", metadata["sub"])
    html = html.replace("{{DESCRICAO_USO_CLINICO}}", metadata["uso"])
    html = html.replace("{{REFERENCIA_CIENTIFICA}}", metadata["ref"])
    html = html.replace("{{KEYWORDS}}", metadata["keywords"])
    html = html.replace("{{ASPECTOS_JSON}}", json.dumps(metadata["aspects"], ensure_ascii=False))

    saida = os.path.join(destino_dir, metadata["slug"])
    if os.path.exists(saida): raise FileExistsError("Nao sobrescrever pagina existente: " + saida)
    with open(saida, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"✅ Página HTML gerada com sucesso: {saida}")

def main():
    if not os.path.exists(TEMPLATE_PATH):
        raise FileNotFoundError(f"Template canônico não encontrado em: {TEMPLATE_PATH}")

    with open(TEMPLATE_PATH, "r", encoding="utf-8") as f:
        template_str = f.read()

    parser=argparse.ArgumentParser();parser.add_argument("--output",required=True,help="Pasta de staging; nunca sobrescrever HTML publicado")
    args=parser.parse_args();os.makedirs(args.output,exist_ok=True)
    print(f"Iniciando compilação de formulários HTML em: {ROOT_DIR}")
    for item in FORMULARIOS_METADATA:
        gerar_pagina_formulario(item, template_str, args.output)
    print("Processo concluído com êxito!")

if __name__ == "__main__":
    main()

