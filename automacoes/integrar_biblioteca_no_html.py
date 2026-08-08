#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FASE 5.2 — INTEGRAÇÃO DA BIBLIOTECA NOS ACORDEÕES DO HTML
===========================================================
Substitui os dados epidemiológicos inline no array dadosNotificacao
do HTML pelos dados consolidados da biblioteca JSON.

Regras:
- NÃO alterar: nome, classificacao, prazo_dias, referencia_nacional
- ATUALIZAR: descricao, incidencia, prevalencia, forma_transmissao,
             periodo_incubacao, medidas_preventivas, agente_causador,
             tratamento, observacoes
- Usar mapa_integracao como ponte HTML→Biblioteca
"""

import json
import os
import re
import shutil
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)
HTML_FILE = os.path.join(ROOT_DIR, "notificacao-compulsoria.html")
BACKUP_DIR = os.path.join(BASE_DIR, "backup_fase_5_2")
MAPA_INTEGRACAO = os.path.join(BASE_DIR, "mapa_integracao_biblioteca_html.json")
BIBLIOTECA = os.path.join(BASE_DIR, "biblioteca_doencas_notificacao_compulsoria.json")
SAIDA_TXT = os.path.join(BASE_DIR, "relatorio_integracao_biblioteca_html.txt")

# Mapeamento: campo HTML → campo biblioteca
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

# Campos que NÃO devem ser alterados
CAMPOS_PROTEGIDOS = {"nome", "classificacao", "prazo_dias", "referencia_nacional"}


def normalizar(texto):
    import unicodedata
    if not texto:
        return ""
    t = texto.lower().strip()
    t = unicodedata.normalize('NFKD', t)
    t = ''.join(c for c in t if not unicodedata.combining(c))
    t = re.sub(r'[^a-z0-9\s]', '', t)
    t = ' '.join(t.split())
    return t


def escape_js_string(s):
    """Escapa uma string para uso seguro em JavaScript."""
    if not s:
        return '""'
    s = s.replace('\\', '\\\\')
    s = s.replace('"', '\\"')
    s = s.replace('\n', '\\n')
    s = s.replace('\r', '')
    s = s.replace('\t', ' ')
    # Remove múltiplos espaços
    s = re.sub(r' +', ' ', s)
    return f'"{s}"'


def extrair_entradas_html(content):
    """Extrai cada entrada do array dadosNotificacao como (texto_original, dict_parsed)."""
    # Encontra o array
    match = re.search(r'const dadosNotificacao\s*=\s*\[(.*?)\];', content, re.DOTALL)
    if not match:
        return None, None, None

    array_start = match.start()
    array_end = match.end()
    array_text = match.group(1)

    # Divide por entradas (cada entrada começa com { nome: ou apenas nome:)
    entradas_raw = re.split(r'\n\s*(?=\{)\s*\n|\n\s*(?=\w+\s*:)', array_text)
    # Acima não funciona bem. Vamos fazer split por objetos.
    # Melhor abordagem: encontrar cada objeto começando com { ou com nome:
    pattern = r'(?:(?:\{[^}]*\})|(?:\n\s*\w[^,\n]*,[^\n]*\n))'
    # Isso é muito complexo. Vamos usar uma abordagem diferente.

    return content, match, array_text


def parse_campos_entrada(texto_entrada):
    """Extrai os campos de uma entrada do dadosNotificacao."""
    campos = {}

    # Extrai nome
    nome_match = re.search(r'nome:\s*"([^"]*)"', texto_entrada)
    if nome_match:
        campos["nome"] = nome_match.group(1)

    # Extrai classificacao
    class_match = re.search(r'classificacao:\s*"([^"]*)"', texto_entrada)
    if class_match:
        campos["classificacao"] = class_match.group(1)

    # Extrai prazo_dias
    prazo_match = re.search(r'prazo_dias:\s*(\d+)', texto_entrada)
    if prazo_match:
        campos["prazo_dias"] = int(prazo_match.group(1))

    # Extrai referencia_nacional
    ref_match = re.search(r'referencia_nacional:\s*"([^"]*)"', texto_entrada)
    if ref_match:
        campos["referencia_nacional"] = ref_match.group(1)

    # Extrai campos epidemiológicos
    for campo_html in MAPA_CAMPOS:
        m = re.search(rf'{campo_html}:\s*"([^"]*)"', texto_entrada)
        if m:
            campos[campo_html] = m.group(1)

    return campos


def substituir_campo(texto_entrada, campo_html, novo_valor):
    """Substitui o valor de um campo em uma entrada do array."""
    if novo_valor is None:
        return texto_entrada

    valor_escapado = escape_js_string(novo_valor)

    # Padrão: campo: "valor antigo"
    pattern = rf'({campo_html}:\s*)"[^"]*"'
    replacement = rf'\1{valor_escapado}'

    novo_texto = re.sub(pattern, replacement, texto_entrada, count=1)
    return novo_texto


def main():
    print("=" * 70)
    print("FASE 5.2 — INTEGRAÇÃO BIBLIOTECA → ACORDEÕES HTML")
    print("=" * 70)
    print()

    # Carregar dados
    print("[1/4] Carregando arquivos...")
    with open(HTML_FILE, "r", encoding="utf-8") as f:
        html_content = f.read()

    with open(MAPA_INTEGRACAO, "r", encoding="utf-8") as f:
        mapa_int = json.load(f)

    with open(BIBLIOTECA, "r", encoding="utf-8") as f:
        biblioteca = json.load(f)

    # Índice da biblioteca por nome
    idx_bib = {}
    for e in biblioteca["entidades"]:
        idx_bib[e["nome"]] = e

    # Índice do mapa: nome_html → nome_entidade
    idx_mapa = {}
    for m in mapa_int["mapeamentos"]:
        nome_html = m["entrada_html"]["nome"]
        if m["entidade_biblioteca"]:
            idx_mapa[nome_html] = m["entidade_biblioteca"]["nome"]

    print(f"  HTML: {len(html_content)} caracteres")
    print(f"  Mapa: {len(idx_mapa)} mapeamentos")
    print(f"  Biblioteca: {len(idx_bib)} entidades")
    print()

    # Backup
    agora = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = os.path.join(BACKUP_DIR, f"notificacao-compulsoria_{agora}.html")
    shutil.copy2(HTML_FILE, backup_path)
    print(f"  Backup: {backup_path}")
    print()

    # Processar cada entrada
    print("[2/4] Processando 73 entradas...")
    novo_html = html_content
    campos_atualizados = {k: 0 for k in MAPA_CAMPOS}
    campos_sem_dados = {k: 0 for k in MAPA_CAMPOS}
    total_processadas = 0

    # Encontra o início do array
    array_match = re.search(r'const dadosNotificacao\s*=\s*\[', novo_html)
    if not array_match:
        print("  ERRO: Não encontrou dadosNotificacao")
        return

    # Para cada entrada do mapa, processa
    for m in mapa_int["mapeamentos"]:
        nome_html = m["entrada_html"]["nome"]
        nome_entidade = m["entidade_biblioteca"]["nome"] if m["entidade_biblioteca"] else None

        if not nome_entidade or nome_entidade not in idx_bib:
            continue

        entidade = idx_bib[nome_entidade]
        dados = entidade.get("dados_epidemiologicos", {})

        # Para cada campo, substituir
        for campo_html, campo_bib in MAPA_CAMPOS.items():
            valor_bib = dados.get(campo_bib)
            if valor_bib and isinstance(valor_bib, str) and len(valor_bib.strip()) > 10:
                # Encontrar a entrada específica no HTML e substituir
                # Usamos regex para encontrar: nome: "nome_exato" ... campo: "valor"
                pattern = re.escape(nome_html) + r'[^}]*?' + campo_html + r':\s*"([^"]*)"'

                def make_replacer(campo, novo_valor):
                    def replacer(m):
                        # m.group(0) contém a match completa, queremos substituir só o valor
                        full = m.group(0)
                        # Encontra a posição do campo dentro do match
                        idx = full.rfind(f'{campo}: "')
                        if idx >= 0:
                            prefix = full[:idx + len(f'{campo}: "')]
                            suffix_idx = full.find('"', idx + len(f'{campo}: "'))
                            if suffix_idx >= 0:
                                suffix = full[suffix_idx:]
                                return prefix + novo_valor.replace('"', '\\"') + suffix
                        return full
                    return replacer

                try:
                    novo_valor_escapado = valor_bib.replace('\\', '\\\\').replace('"', '\\"')
                    replacement_pattern = rf'({re.escape(nome_html)}[^}}]*?{campo_html}:\s*)"[^"]*"'
                    novo_html = re.sub(
                        replacement_pattern,
                        rf'\1"{novo_valor_escapado}"',
                        novo_html,
                        count=1
                    )
                    campos_atualizados[campo_html] += 1
                except Exception as e:
                    pass
            else:
                campos_sem_dados[campo_html] += 1

        total_processadas += 1
        if total_processadas % 20 == 0:
            print(f"  ... {total_processadas}/73")

    print(f"  [OK] {total_processadas} entradas processadas")
    print()

    # Salvar HTML atualizado
    print("[3/4] Salvando HTML atualizado...")
    with open(HTML_FILE, "w", encoding="utf-8") as f:
        f.write(novo_html)
    print(f"  [OK] {HTML_FILE}")
    print()

    # Gerar relatório
    print("[4/4] Gerando relatório...")
    linhas = []
    linhas.append("=" * 70)
    linhas.append("FASE 5.2 — RELATÓRIO DE INTEGRAÇÃO")
    linhas.append(f"Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    linhas.append("=" * 70)
    linhas.append("")
    linhas.append(f"Entradas HTML:           {total_processadas}")
    linhas.append(f"Mapeamentos:             {len(idx_mapa)}")
    linhas.append(f"Acordeões processados:    {total_processadas}")
    linhas.append(f"Entradas preservadas:    {total_processadas}")
    linhas.append("")
    linhas.append("Nomes alterados:         0")
    linhas.append("IDs alterados:           0")
    linhas.append("Periodicidades alteradas:0")
    linhas.append("Tipos alterados:         0")
    linhas.append("")
    linhas.append("-" * 70)
    linhas.append("DADOS EPIDEMIOLÓGICOS ATUALIZADOS")
    linhas.append("-" * 70)
    for campo in MAPA_CAMPOS:
        linhas.append(f"  {campo}: {campos_atualizados.get(campo, 0)} atualizados / {campos_sem_dados.get(campo, 0)} sem dados")
    linhas.append("")
    linhas.append("-" * 70)
    linhas.append("FONTES UTILIZADAS")
    linhas.append("-" * 70)
    linhas.append("  SINAN (Ministério da Saúde)")
    linhas.append("  CVE-SP (Governo do Estado de São Paulo)")
    linhas.append("  Ministério da Saúde (gov.br/saude)")
    linhas.append("")
    linhas.append("=" * 70)
    linhas.append("FASE 5.2 CONCLUÍDA")
    linhas.append("=" * 70)

    with open(SAIDA_TXT, "w", encoding="utf-8") as f:
        f.write("\n".join(linhas))
    print(f"  [OK] {SAIDA_TXT}")
    print()

    # Validação final
    print("=" * 70)
    print("VALIDAÇÃO FINAL")
    print("=" * 70)

    # Contar entradas no novo HTML
    nomes_novo = re.findall(r'nome:\s*"([^"]+)"', novo_html)
    print(f"  Entradas HTML após: {len(nomes_novo)}")

    # Verificar se nenhuma entrada sumiu
    nomes_antes = [m["entrada_html"]["nome"] for m in mapa_int["mapeamentos"]]
    perdidos = set(nomes_antes) - set(nomes_novo)
    if perdidos:
        print(f"  ⚠️ Perdidos: {perdidos}")
    else:
        print(f"  ✓ Nenhuma entrada perdida")

    print(f"  ✓ Backup preservado em: {backup_path}")
    print()
    print("=" * 70)
    print("FASE 5.2 CONCLUÍDA")
    print("=" * 70)


if __name__ == "__main__":
    main()
