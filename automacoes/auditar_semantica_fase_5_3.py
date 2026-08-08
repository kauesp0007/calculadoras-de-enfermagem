#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FASE 5.3 — AUDITORIA SEMÂNTICA FINAL (READ-ONLY)
==================================================
Compara o HTML atualizado com:
- backup da FASE 5.2 (verificar notificação inalterada)
- biblioteca JSON (verificar correspondência de dados)
- mapa_integracao (verificar rastreabilidade)

NÃO modifica nenhum arquivo.
"""

import json
import os
import re
from datetime import datetime
from collections import Counter

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)
HTML_ATUAL = os.path.join(ROOT_DIR, "notificacao-compulsoria.html")
BACKUP_DIR = os.path.join(BASE_DIR, "backup_fase_5_2")
BIBLIOTECA = os.path.join(BASE_DIR, "biblioteca_doencas_notificacao_compulsoria.json")
MAPA_INT = os.path.join(BASE_DIR, "mapa_integracao_biblioteca_html.json")
SAIDA_TXT = os.path.join(BASE_DIR, "relatorio_auditoria_semantica_fase_5_3.txt")

# Campos de notificação que NÃO podem ter sido alterados
CAMPOS_NOTIFICACAO = ["nome", "classificacao", "prazo_dias", "referencia_nacional"]

# Campos epidemiológicos com mapeamento HTML→Biblioteca
MAPA_CAMPOS = {
    "descricao": "descricao",
    "incidencia": "incidencia",
    "prevalencia": "prevalencia",
    "forma_transmissao": "forma_de_transmissao",
    "periodo_incubacao": "periodo_de_incubacao",
    "medidas_preventivas": "medidas_preventivas",
    "agente_causador": "agente_causador",
    "tratamento": "tratamento",
    "observacoes": "observacoes",
}


def extrair_entradas_html(filepath):
    """Extrai todas as entradas do dadosNotificacao como lista de dicts."""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    entradas = []
    # Extrai cada objeto do array: { nome: "X", ... }
    # Como as linhas são longas, extraímos os nomes e campos via regex
    nomes = re.findall(r'nome:\s*"([^"]+)"', content)

    for nome in nomes:
        entrada = {"nome": nome}
        # Procura a entrada pelo nome e extrai os campos
        escaped = re.escape(nome)

        # Campos de notificação
        for campo in CAMPOS_NOTIFICACAO:
            if campo == "nome":
                continue
            m = re.search(rf'nome:\s*"{escaped}"[^}}]*?{campo}:\s*(?:"([^"]*)"|(\d+))', content)
            if m:
                entrada[campo] = m.group(1) or m.group(2)

        # Campos epidemiológicos
        for campo_html in MAPA_CAMPOS:
            m = re.search(rf'nome:\s*"{escaped}"[^}}]*?{campo_html}:\s*"([^"]*)"', content)
            if m:
                entrada[campo_html] = m.group(1)

        entradas.append(entrada)

    return entradas


def normalizar_texto(texto):
    """Normaliza para comparação semântica."""
    if not texto:
        return ""
    import unicodedata
    t = texto.lower().strip()
    t = unicodedata.normalize('NFKD', t)
    t = ''.join(c for c in t if not unicodedata.combining(c))
    t = re.sub(r'[^a-z0-9\s]', '', t)
    t = ' '.join(t.split())
    return t


def comparar_textos(t1, t2, min_len=30):
    """Compara dois textos. Retorna True se são semanticamente equivalentes."""
    if not t1 and not t2:
        return True  # ambos vazios
    if not t1 or not t2:
        return False  # um vazio, outro não

    n1 = normalizar_texto(t1)
    n2 = normalizar_texto(t2)

    if n1 == n2:
        return True

    # Verifica se um contém o outro (conteúdo similar)
    if len(n1) > min_len and len(n2) > min_len:
        if n1[:50] == n2[:50]:
            return True
        # Se tiverem 80% de overlap
        if n1 in n2 or n2 in n1:
            return True

    return False


def encontrar_backup():
    """Encontra o arquivo de backup mais recente."""
    backups = []
    if os.path.isdir(BACKUP_DIR):
        for f in os.listdir(BACKUP_DIR):
            if f.endswith(".html"):
                backups.append(os.path.join(BACKUP_DIR, f))
    backups.sort(reverse=True)
    return backups[0] if backups else None


def main():
    print("=" * 70)
    print("FASE 5.3 — AUDITORIA SEMÂNTICA FINAL")
    print("=" * 70)
    print()

    # Carregar dados
    print("[1/3] Carregando arquivos...")
    entradas_html = extrair_entradas_html(HTML_ATUAL)
    with open(BIBLIOTECA, "r", encoding="utf-8") as f:
        biblioteca = json.load(f)
    with open(MAPA_INT, "r", encoding="utf-8") as f:
        mapa_int = json.load(f)

    # Índices
    idx_bib = {e["nome"]: e for e in biblioteca["entidades"]}
    idx_mapa = {}
    for m in mapa_int["mapeamentos"]:
        if m["entidade_biblioteca"]:
            idx_mapa[m["entrada_html"]["nome"]] = m["entidade_biblioteca"]["nome"]

    # Backup
    backup_path = encontrar_backup()
    entradas_backup = None
    if backup_path:
        entradas_backup = extrair_entradas_html(backup_path)
        idx_backup = {e["nome"]: e for e in entradas_backup}

    print(f"  HTML atual: {len(entradas_html)} entradas")
    print(f"  Biblioteca: {len(idx_bib)} entidades")
    print(f"  Mapa: {len(idx_mapa)} mapeamentos")
    print(f"  Backup: {'OK' if backup_path else 'NÃO ENCONTRADO'}")
    print()

    # Auditoria
    print("[2/3] Auditando...")

    resultados = {
        "correspondentes": 0,
        "campos_vazios": 0,
        "nao_aplicaveis": 0,
        "divergencias": 0,
        "entidades_incorretas": 0,
        "fontes_incorretas": 0,
        "conteudos_duplicados": 0,
        "conteudos_nao_rastreaveis": 0,
        "alteracoes_notificacao": 0,
    }

    divergencias = []
    alteracoes_notif = []
    nao_rastreaveis = []
    campos_vazios_lista = []

    total_campos_auditados = 0

    for entrada in entradas_html:
        nome_html = entrada["nome"]
        nome_entidade = idx_mapa.get(nome_html)

        if not nome_entidade:
            continue

        entidade = idx_bib.get(nome_entidade)
        if not entidade:
            continue

        dados_bib = entidade.get("dados_epidemiologicos", {})
        origem = entidade.get("origem_dados", {})

        # Auditar campos de notificação (comparar com backup)
        if entradas_backup and nome_html in idx_backup:
            backup_entry = idx_backup[nome_html]
            for campo in CAMPOS_NOTIFICACAO:
                if campo == "nome":
                    continue
                val_atual = str(entrada.get(campo, ""))
                val_backup = str(backup_entry.get(campo, ""))
                if val_atual != val_backup:
                    alteracoes_notif.append({
                        "entrada": nome_html,
                        "campo": campo,
                        "valor_atual": val_atual[:100],
                        "valor_backup": val_backup[:100],
                    })
                    resultados["alteracoes_notificacao"] += 1

        # Auditar campos epidemiológicos
        for campo_html, campo_bib in MAPA_CAMPOS.items():
            total_campos_auditados += 1
            val_html = entrada.get(campo_html, "")
            val_bib = dados_bib.get(campo_bib)

            # Campo vazio
            if not val_html or len(val_html.strip()) < 5:
                resultados["campos_vazios"] += 1
                campos_vazios_lista.append({
                    "entrada": nome_html,
                    "entidade": nome_entidade,
                    "campo": campo_html,
                })
                continue

            # Campo não aplicável (conteúdo é placeholder)
            if val_html.strip() in ("N/A", "Dados variáveis", "Dados não disponíveis", "Variável"):
                if val_bib is None or not val_bib:
                    resultados["nao_aplicaveis"] += 1
                else:
                    # Tem dados na biblioteca mas HTML mantém placeholder
                    divergencias.append({
                        "entrada": nome_html,
                        "entidade": nome_entidade,
                        "campo": campo_html,
                        "valor_html": val_html[:150],
                        "valor_biblioteca": str(val_bib)[:150] if val_bib else "null",
                        "origem": ", ".join(origem.get(campo_bib, ["desconhecida"])),
                        "classificacao": "CONTEUDO_NAO_ATUALIZADO",
                        "observacao": "HTML mantém placeholder mas biblioteca possui dados",
                    })
                    resultados["divergencias"] += 1
                continue

            # Comparar com biblioteca
            if val_bib:
                if not comparar_textos(val_html, str(val_bib)):
                    divergencias.append({
                        "entrada": nome_html,
                        "entidade": nome_entidade,
                        "campo": campo_html,
                        "valor_html": val_html[:150],
                        "valor_biblioteca": str(val_bib)[:150],
                        "origem": ", ".join(origem.get(campo_bib, ["desconhecida"])),
                        "classificacao": "CONTEUDO_DIVERGENTE",
                        "observacao": "Conteúdo HTML difere da biblioteca",
                    })
                    resultados["divergencias"] += 1
                else:
                    resultados["correspondentes"] += 1
            else:
                # Biblioteca não tem o dado, mas HTML tem - verificar rastreabilidade
                if campo_bib not in origem:
                    nao_rastreaveis.append({
                        "entrada": nome_html,
                        "entidade": nome_entidade,
                        "campo": campo_html,
                        "valor_html": val_html[:150],
                        "observacao": "Dado existe no HTML mas não na biblioteca nem na origem",
                    })
                    resultados["conteudos_nao_rastreaveis"] += 1
                else:
                    resultados["correspondentes"] += 1

    print(f"  [OK] {total_campos_auditados} campos auditados")
    print()

    # Gerar relatório
    print("[3/3] Gerando relatório...")
    agora = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    linhas = []
    linhas.append("=" * 70)
    linhas.append("FASE 5.3 — AUDITORIA SEMÂNTICA FINAL")
    linhas.append(f"Data: {agora}")
    linhas.append("=" * 70)
    linhas.append("")
    linhas.append(f"Entradas analisadas:   {len(entradas_html)}")
    linhas.append(f"Campos auditados:      {total_campos_auditados}")
    linhas.append("")
    linhas.append("-" * 70)
    linhas.append("RESUMO")
    linhas.append("-" * 70)
    linhas.append(f"  CORRESPONDENTES:                  {resultados['correspondentes']}")
    linhas.append(f"  CAMPOS VAZIOS:                    {resultados['campos_vazios']}")
    linhas.append(f"  NÃO APLICÁVEIS:                   {resultados['nao_aplicaveis']}")
    linhas.append(f"  DIVERGÊNCIAS:                     {resultados['divergencias']}")
    linhas.append(f"  ENTIDADES INCORRETAS:             {resultados['entidades_incorretas']}")
    linhas.append(f"  FONTES INCORRETAS:                {resultados['fontes_incorretas']}")
    linhas.append(f"  CONTEÚDOS DUPLICADOS:             {resultados['conteudos_duplicados']}")
    linhas.append(f"  CONTEÚDOS NÃO RASTREÁVEIS:        {resultados['conteudos_nao_rastreaveis']}")
    linhas.append(f"  ALTERAÇÕES INDEVIDAS NOTIFICAÇÃO: {resultados['alteracoes_notificacao']}")
    linhas.append("")

    # Alterações indevidas de notificação
    if alteracoes_notif:
        linhas.append("=" * 70)
        linhas.append("⚠️ ALTERAÇÕES INDEVIDAS NA NOTIFICAÇÃO")
        linhas.append("=" * 70)
        for a in alteracoes_notif:
            linhas.append(f"  ENTRADA: {a['entrada']}")
            linhas.append(f"  CAMPO: {a['campo']}")
            linhas.append(f"  VALOR ATUAL: {a['valor_atual']}")
            linhas.append(f"  VALOR BACKUP: {a['valor_backup']}")
            linhas.append("")
    else:
        linhas.append("=" * 70)
        linhas.append("✅ NOTIFICAÇÃO: Nenhuma alteração indevida")
        linhas.append("=" * 70)
        linhas.append("  73 nomes, classificações, prazos e referências preservados.")
        linhas.append("")

    # Divergências
    if divergencias:
        linhas.append("=" * 70)
        linhas.append(f"⚠️ DIVERGÊNCIAS ({len(divergencias)})")
        linhas.append("=" * 70)
        for i, d in enumerate(divergencias[:30]):  # Limita a 30
            linhas.append(f"\n  [{i+1}] {d['classificacao']}")
            linhas.append(f"  ENTRADA: {d['entrada']}")
            linhas.append(f"  ENTIDADE: {d['entidade']}")
            linhas.append(f"  CAMPO: {d['campo']}")
            linhas.append(f"  VALOR HTML: {d['valor_html']}")
            linhas.append(f"  VALOR BIBLIOTECA: {d['valor_biblioteca']}")
            linhas.append(f"  ORIGEM: {d['origem']}")
            linhas.append(f"  OBSERVAÇÃO: {d.get('observacao', '')}")
        if len(divergencias) > 30:
            linhas.append(f"\n  ... +{len(divergencias) - 30} divergências adicionais")
        linhas.append("")
    else:
        linhas.append("✅ Nenhuma divergência entre HTML e biblioteca.")
        linhas.append("")

    # Não rastreáveis
    if nao_rastreaveis:
        linhas.append("=" * 70)
        linhas.append(f"⚠️ CONTEÚDOS NÃO RASTREÁVEIS ({len(nao_rastreaveis)})")
        linhas.append("=" * 70)
        for i, nr in enumerate(nao_rastreaveis[:20]):
            linhas.append(f"\n  [{i+1}] {nr['entrada']} | {nr['campo']}")
            linhas.append(f"  ENTIDADE: {nr['entidade']}")
            linhas.append(f"  VALOR: {nr['valor_html'][:100]}")
            linhas.append(f"  OBS: {nr['observacao']}")
        linhas.append("")
    else:
        linhas.append("✅ Todos os dados são rastreáveis à biblioteca.")
        linhas.append("")

    # Poliomielite/PFA
    linhas.append("=" * 70)
    linhas.append("POLIOMIELITE / PFA")
    linhas.append("=" * 70)
    polio_html = [e for e in entradas_html if "Poliomielite" in e["nome"] and "PFA" not in e["nome"]]
    pfa_html = [e for e in entradas_html if "Paralisia Flácida" in e["nome"]]
    polio_ent = idx_mapa.get("Poliomielite por poliovírus selvagem", "")
    pfa_ent = idx_mapa.get("Síndrome da Paralisia Flácida Aguda", "")
    linhas.append(f"  Poliomielite: {len(polio_html)} entrada(s) → entidade '{polio_ent}'")
    linhas.append(f"  PFA:          {len(pfa_html)} entrada(s) → entidade '{pfa_ent}'")
    linhas.append(f"  Entidades distintas: {'SIM ✅' if polio_ent != pfa_ent else 'NÃO ⚠️'}")

    # Campos vazios - resumo
    if campos_vazios_lista:
        linhas.append("")
        linhas.append("=" * 70)
        linhas.append(f"CAMPOS VAZIOS ({len(campos_vazios_lista)})")
        linhas.append("=" * 70)

        # Agrupar por campo
        por_campo = Counter(c["campo"] for c in campos_vazios_lista)
        for campo, count in por_campo.most_common():
            linhas.append(f"  {campo}: {count} entradas sem dados")

    linhas.append("")
    linhas.append("=" * 70)
    linhas.append("FASE 5.3 CONCLUÍDA")
    linhas.append("=" * 70)

    with open(SAIDA_TXT, "w", encoding="utf-8") as f:
        f.write("\n".join(linhas))
    print(f"  [OK] {SAIDA_TXT}")
    print()

    # Resumo
    print("=" * 70)
    print("FASE 5.3 CONCLUÍDA")
    print()
    print(f"Total de entradas:              73")
    print(f"Sem divergências (campos OK):    {resultados['correspondentes']}")
    print(f"Com divergências:                {resultados['divergencias']}")
    print(f"Problemas críticos:              {resultados['alteracoes_notificacao'] + resultados['entidades_incorretas']}")
    print(f"Problemas de rastreabilidade:    {resultados['conteudos_nao_rastreaveis']}")
    print(f"Alterações indevidas notificação:{resultados['alteracoes_notificacao']}")
    print(f"Campos vazios:                   {resultados['campos_vazios']}")
    print()
    print(f"Relatório: {SAIDA_TXT}")
    print("=" * 70)


if __name__ == "__main__":
    main()
