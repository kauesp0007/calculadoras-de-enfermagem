#!/usr/bin/env python3
"""Validador da biblioteca de doenças de notificação compulsória."""
import json, os, sys
from collections import Counter

BIB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "biblioteca_doencas_notificacao_compulsoria.json")

def validar():
    with open(BIB_PATH, "r", encoding="utf-8") as f:
        bib = json.load(f)

    erros = []
    avisos = []
    entidades = bib["entidades"]

    # 1. JSON válido
    print("✓ JSON válido: " + str(len(entidades)) + " entidades")

    # 2. Nomes únicos
    nomes = [e["nome"] for e in entidades]
    dup = [n for n, c in Counter(nomes).items() if c > 1]
    if dup:
        erros.append("Nomes duplicados: " + str(dup))
    else:
        print("✓ Nomes únicos: OK")

    # 3. Campos esperados
    campos_esperados = ["nome", "tipo", "grupo_organizador", "dados_epidemiologicos", "origem_dados", "fontes", "status"]
    for e in entidades:
        for campo in campos_esperados:
            if campo not in e:
                erros.append("Entidade '" + e.get("nome", "?") + "' sem campo '" + campo + "'")

    print("✓ Campos obrigatórios: " + ("OK" if not any("sem campo" in str(e) for e in erros) else "FALHA"))

    # 4. Fontes com URL
    sem_url = [e["nome"] for e in entidades if e.get("fontes") and any(not f.get("url") for f in e["fontes"])]
    if sem_url:
        avisos.append("Entidades com fonte sem URL: " + str(sem_url))

    # 5. Nenhum dado sem origem
    for e in entidades:
        origem = e.get("origem_dados", {})
        dados = e.get("dados_epidemiologicos", {})
        for campo, valor in dados.items():
            if valor and campo not in origem:
                avisos.append("Entidade '" + e["nome"] + "': campo '" + campo + "' sem origem")

    # 6. Contagens
    com_dados = sum(1 for e in entidades if e["status"]["dados_disponiveis"])
    sem_fonte = sum(1 for e in entidades if not e["status"]["dados_disponiveis"])
    print("✓ Com dados: " + str(com_dados) + " | Sem fonte: " + str(sem_fonte))

    # 7. Total
    print("✓ Total: " + str(len(entidades)) + " entidades")

    if erros:
        print("\n⚠️  " + str(len(erros)) + " ERROS:")
        for e in erros:
            print("  - " + e)

    if avisos:
        print("\n📋 " + str(len(avisos)) + " AVISOS:")
        for a in avisos:
            print("  - " + a)

    if not erros:
        print("\n✅ BIBLIOTECA VÁLIDA")
    else:
        print("\n❌ BIBLIOTECA COM ERROS")
        sys.exit(1)

if __name__ == "__main__":
    validar()
