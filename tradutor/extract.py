"""
EXTRACT.PY - Etapas 1, 2 e 3 do Pipeline de Traducao
=====================================================
Usa extrair_textos_traduziveis() do tradutor_html_ia.py
(funcao cirurgica ja validada, sem corromper HTML).
"""

import os
import sys
import json
import glob

RAIZ_PROJETO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PASTA_CACHE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cache")

sys.path.insert(0, os.path.join(RAIZ_PROJETO, "automacoes"))
from tradutor_html_ia import extrair_textos_traduziveis


def extrair_textos(conteudo, nome_arquivo):
    textos_brutos = extrair_textos_traduziveis(conteudo)
    textos = []
    for i, t in enumerate(textos_brutos):
        linha = conteudo[:t['start']].count('\n') + 1
        textos.append({
            "id": i, "arquivo": nome_arquivo, "linha": linha,
            "texto_original": t['text'].strip(),
            "texto_bruto": t['text'],
            "tipo": "text_node",
            "start": t['start'], "end": t['end'],
        })
    return textos


def processar_todos_arquivos(padroes=None):
    if padroes is None:
        padroes = ["*.html", "*.js", "*.json"]
    os.makedirs(PASTA_CACHE, exist_ok=True)
    todos_textos = []
    arquivos_processados = 0

    for padrao in padroes:
        for caminho in glob.glob(os.path.join(RAIZ_PROJETO, padrao)):
            nome = os.path.basename(caminho)
            if nome.startswith('.') or nome.startswith('build') or nome.startswith('CACHE'):
                continue
            if nome in ['file-list.txt','ga-credentials.json','analytics-data.json',
                        'ads.txt','BingSiteAuth.xml','CNAME','ENFERMEIRO.TXT']:
                continue
            try:
                with open(caminho, 'r', encoding='utf-8') as f:
                    conteudo = f.read()
            except Exception as e:
                print(f"  !! Erro ao ler {nome}: {e}")
                continue

            textos = extrair_textos(conteudo, nome)
            if textos:
                with open(os.path.join(PASTA_CACHE, f"{nome}.json"), 'w', encoding='utf-8') as f:
                    json.dump(textos, f, ensure_ascii=False, indent=2)
                todos_textos.extend(textos)
                arquivos_processados += 1
                print(f"  OK {nome}: {len(textos)} textos")

    indice = {"total_arquivos": arquivos_processados, "total_textos": len(todos_textos),
              "arquivos": list(set(t["arquivo"] for t in todos_textos))}
    with open(os.path.join(PASTA_CACHE, "_indice.json"), 'w', encoding='utf-8') as f:
        json.dump(indice, f, ensure_ascii=False, indent=2)
    print(f"\nTotal: {arquivos_processados} arquivos, {len(todos_textos)} textos")
    return todos_textos


if __name__ == "__main__":
    print("=" * 60)
    print("EXTRACT - Extraindo textos de HTML/JS/JSON")
    print("=" * 60)
    processar_todos_arquivos()
