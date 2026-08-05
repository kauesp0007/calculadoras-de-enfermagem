#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
standardize_pdf_buttons.py — Padronizador de Botões de Impressão e PDF
======================================================================

Varre todos os arquivos HTML do projeto e padroniza os botões
btnImprimir e btnGerarPDF para o componente oficial:

    <div class="action-buttons no-print">
        <button id="btnImprimir" class="btn-secondary">...</button>
        <button id="btnGerarPDF" class="btn-danger">...</button>
    </div>

Regras:
- Preserva IDs, eventos, data-*, aria-*, title, SVG paths, etc.
- Remove classes utilitárias Tailwind redundantes (flex, items-center, etc.)
- Padroniza textos: "Imprimir" e "Salvar PDF"
- Mesma largura/altura controlada via CSS
- Cria backup antes de modificar
- Gera relatório detalhado ao final

Autor: Calculadoras de Enfermagem
Data: 2026-08-05
"""

import os
import shutil
import time
from pathlib import Path
from datetime import datetime
from bs4 import BeautifulSoup, Tag

# ──────────────────────────────────────────────────────────────
# CONFIGURAÇÃO
# ──────────────────────────────────────────────────────────────

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent  # raiz do projeto

EXCLUDED_DIRS = {
    "node_modules",
    "automacoes",
    "dist",
    "src",
    "public",
    ".git",
    "__pycache__",
    "escalas-de-enfermagem",  # manter? nao, o escopo diz incluir tudo exceto os listados
}

# Pastas a INCLUIR (todas exceto as EXCLUDED_DIRS)
# O script percorre a raiz + pastas de idiomas + blog + todas as subpastas

BACKUP_DIR = PROJECT_ROOT / "automacoes" / "component_standardizer" / "backups"
REPORT_PATH = PROJECT_ROOT / "RELATORIO_PADRONIZACAO_BOTOES.txt"

# IDs oficiais dos botões
BTN_PRINT_ID = "btnImprimir"
BTN_PDF_ID = "btnGerarPDF"

# Classes oficiais do componente
BTN_PRINT_CLASS = "btn-secondary"
BTN_PDF_CLASS = "btn-danger"
CONTAINER_CLASSES = ["action-buttons", "no-print"]

# Textos padronizados
TEXT_PRINT = "Imprimir"
TEXT_PDF = "Salvar PDF"

# Classes utilitárias Tailwind que são redundantes (já cobertas pelo CSS do componente)
REDUNDANT_CLASSES = {
    "flex",
    "items-center",
    "justify-center",
    "gap-2",
    "gap-4",
    "gap-3",
    "gap-1",
    "inline-flex",
    "w-full",
    "md:w-auto",
    "flex-1",
    "max-w-sm",
    "text-center",
    "text-left",
    "text-right",
}


# ──────────────────────────────────────────────────────────────
# FUNÇÕES AUXILIARES
# ──────────────────────────────────────────────────────────────

def cria_backup(filepath: Path) -> Path:
    """Cria uma cópia de backup do arquivo antes de modificá-lo."""
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    rel = filepath.relative_to(PROJECT_ROOT)
    backup_path = BACKUP_DIR / rel
    backup_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(filepath, backup_path)
    return backup_path


def deve_processar(filepath: Path) -> bool:
    """Determina se o arquivo deve ser processado (HTML, fora de pastas excluídas)."""
    if filepath.suffix.lower() not in (".html", ".htm"):
        return False

    parts = set(filepath.relative_to(PROJECT_ROOT).parts)
    if parts & EXCLUDED_DIRS:
        return False

    return True


def limpa_classes_btn(btn: Tag) -> list:
    """
    Remove classes utilitárias redundantes do botão e retorna
    a lista limpa de classes.
    """
    if not btn.has_attr("class"):
        return []

    classes = btn["class"]
    if isinstance(classes, str):
        classes = classes.split()

    # Mantém apenas classes que NÃO são redundantes
    cleaned = [c for c in classes if c not in REDUNDANT_CLASSES]
    return cleaned


def normaliza_texto_btn(btn: Tag, texto_padrao: str) -> str:
    """
    Normaliza o texto visível do botão.
    Preserva SVGs, substitui apenas o texto.
    Retorna o texto que foi encontrado (para logging).
    """
    textos_encontrados = []

    for child in list(btn.descendants):
        if isinstance(child, Tag) and child.name == "svg":
            continue  # preserva SVG
        if isinstance(child, str):
            t = child.strip()
            if t:
                textos_encontrados.append(t)

    texto_original = " ".join(textos_encontrados).strip()

    # Remove todos os nós de texto que não sejam whitespace
    for child in list(btn.children):
        if isinstance(child, str) and child.strip():
            child.replace_with("")
        elif isinstance(child, Tag) and child.name == "svg":
            continue  # mantém SVG

    # Encontra o último SVG (se houver) e insere texto depois
    svgs = btn.find_all("svg", recursive=False)
    if svgs:
        last_svg = svgs[-1]
        # Insere texto após o último SVG
        last_svg.insert_after(f" {texto_padrao}")
    else:
        # Sem SVG, apenas define o texto
        btn.string = texto_padrao

    return texto_original


def processa_botao(btn: Tag, nova_classe: str, novo_texto: str) -> dict:
    """
    Processa um botão individual, padronizando suas classes e texto.

    Retorna um dict com informações sobre a alteração.
    """
    info = {
        "id": btn.get("id", ""),
        "classes_antigas": btn.get("class", []) if btn.has_attr("class") else [],
        "classes_novas": [],
        "texto_original": "",
        "texto_novo": novo_texto,
        "alterado": False,
    }

    if isinstance(info["classes_antigas"], str):
        info["classes_antigas"] = info["classes_antigas"].split()

    # Remove Tailwind redundantes
    cleaned = limpa_classes_btn(btn)

    # Garante que a classe oficial esteja presente
    if nova_classe not in cleaned:
        cleaned.append(nova_classe)

    # Remove outras classes de botão conflitantes
    conflitantes = {"btn-primary", "btn-danger", "btn-secondary"}
    conflitantes.discard(nova_classe)  # mantém a oficial
    cleaned = [c for c in cleaned if c not in conflitantes]

    info["classes_novas"] = cleaned
    btn["class"] = cleaned

    # Normaliza texto
    info["texto_original"] = normaliza_texto_btn(btn, novo_texto)

    # Verifica se houve alteração
    if (info["classes_antigas"] != cleaned) or (info["texto_original"] != novo_texto):
        info["alterado"] = True

    return info


def padroniza_container(btn: Tag) -> Tag | None:
    """
    Garante que o botão esteja dentro de um container padronizado:
    <div class="action-buttons no-print">

    Se já estiver em um container adequado, retorna None.
    Se precisar criar/ajustar, retorna o novo container.
    """
    parent = btn.parent
    if parent is None or not isinstance(parent, Tag):
        return None

    # Se o pai já for um div com classes de container, apenas ajusta
    if parent.name == "div":
        parent_classes = parent.get("class", [])
        if isinstance(parent_classes, str):
            parent_classes = parent_classes.split()

        has_action = "action-buttons" in parent_classes
        has_noprint = "no-print" in parent_classes

        if has_action:
            # Garante no-print
            if not has_noprint:
                parent_classes.append("no-print")
                parent["class"] = parent_classes
            return None  # já está correto

    # Procura por um container ancestral que seja action-buttons
    for ancestor in btn.parents:
        if isinstance(ancestor, Tag) and ancestor.name == "div":
            ac = ancestor.get("class", [])
            if isinstance(ac, str):
                ac = ac.split()
            if "action-buttons" in ac:
                if "no-print" not in ac:
                    ac.append("no-print")
                    ancestor["class"] = ac
                return None

    return None


def processa_arquivo(filepath: Path) -> dict:
    """
    Processa um arquivo HTML, padronizando os botões de PDF e Impressão.

    Retorna um dict com estatísticas do processamento.
    """
    result = {
        "arquivo": str(filepath.relative_to(PROJECT_ROOT)),
        "modificado": False,
        "botoes_imprimir": 0,
        "botoes_pdf": 0,
        "botoes_alterados": 0,
        "erro": None,
        "ignorado": False,
    }

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            html_original = f.read()

        soup = BeautifulSoup(html_original, "html.parser")

        altered = False

        # ── Processa btnImprimir ──
        btns_print = soup.find_all(id=BTN_PRINT_ID)
        if not btns_print:
            # Tenta por classe
            btns_print = soup.find_all(
                "button", class_=lambda c: c and "btn-secondary" in c if isinstance(c, str) else False
            )

        for btn in btns_print:
            if btn.name != "button":
                continue
            result["botoes_imprimir"] += 1
            info = processa_botao(btn, BTN_PRINT_CLASS, TEXT_PRINT)
            if info["alterado"]:
                result["botoes_alterados"] += 1
                altered = True
            padroniza_container(btn)

        # ── Processa btnGerarPDF ──
        btns_pdf = soup.find_all(id=BTN_PDF_ID)
        if not btns_pdf:
            btns_pdf = soup.find_all(
                "button", class_=lambda c: c and "btn-danger" in c if isinstance(c, str) else False
            )

        for btn in btns_pdf:
            if btn.name != "button":
                continue
            result["botoes_pdf"] += 1
            info = processa_botao(btn, BTN_PDF_CLASS, TEXT_PDF)
            if info["alterado"]:
                result["botoes_alterados"] += 1
                altered = True
            padroniza_container(btn)

        if altered:
            # Cria backup
            cria_backup(filepath)

            # Serializa preservando ao máximo a formatação original
            html_novo = soup.decode(formatter="html5")

            with open(filepath, "w", encoding="utf-8") as f:
                f.write(html_novo)

            result["modificado"] = True

    except Exception as e:
        result["erro"] = str(e)
        result["ignorado"] = True

    return result


def varre_projeto() -> list[dict]:
    """Varre todo o projeto em busca de arquivos HTML para processar."""
    resultados = []

    for root, dirs, files in os.walk(PROJECT_ROOT):
        # Remove pastas excluídas da busca
        rel_root = Path(root).relative_to(PROJECT_ROOT)
        parts = set(rel_root.parts)

        if parts & EXCLUDED_DIRS:
            dirs[:] = []  # não desce em subpastas
            continue

        for filename in files:
            filepath = Path(root) / filename
            if deve_processar(filepath):
                resultado = processa_arquivo(filepath)
                resultados.append(resultado)

    return resultados


def gera_relatorio(resultados: list[dict], tempo_total: float) -> str:
    """Gera o relatório final de padronização."""
    linhas = []
    linhas.append("=" * 70)
    linhas.append("RELATÓRIO DE PADRONIZAÇÃO DE BOTÕES (PDF / IMPRIMIR)")
    linhas.append(f"Gerado em: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    linhas.append(f"Tempo total de execução: {tempo_total:.2f} segundos")
    linhas.append("=" * 70)
    linhas.append("")

    total_arquivos = len(resultados)
    modificados = [r for r in resultados if r["modificado"]]
    ignorados = [r for r in resultados if r.get("ignorado")]
    erros = [r for r in resultados if r.get("erro")]

    total_imprimir = sum(r["botoes_imprimir"] for r in resultados)
    total_pdf = sum(r["botoes_pdf"] for r in resultados)
    total_alterados = sum(r["botoes_alterados"] for r in resultados)

    linhas.append("📊 RESUMO")
    linhas.append("-" * 40)
    linhas.append(f"  Total de HTML analisados:      {total_arquivos}")
    linhas.append(f"  Total de HTML modificados:      {len(modificados)}")
    linhas.append(f"  Botões Imprimir encontrados:    {total_imprimir}")
    linhas.append(f"  Botões Salvar PDF encontrados:  {total_pdf}")
    linhas.append(f"  Botões efetivamente alterados:  {total_alterados}")
    linhas.append(f"  Arquivos ignorados:             {len(ignorados)}")
    linhas.append(f"  Erros encontrados:              {len(erros)}")
    linhas.append("")

    if modificados:
        linhas.append("✅ ARQUIVOS MODIFICADOS")
        linhas.append("-" * 40)
        for r in modificados:
            linhas.append(f"  ✏️  {r['arquivo']}")
            linhas.append(f"      Imprimir: {r['botoes_imprimir']} | PDF: {r['botoes_pdf']}")
        linhas.append("")

    if ignorados:
        linhas.append("⚠️  ARQUIVOS IGNORADOS / COM ERRO")
        linhas.append("-" * 40)
        for r in ignorados:
            motivo = r.get("erro", "Sem botões encontrados")
            linhas.append(f"  ⚠️  {r['arquivo']}")
            linhas.append(f"      Motivo: {motivo}")
        linhas.append("")

    linhas.append("📋 ARQUIVOS SEM BOTÕES (não modificados)")
    linhas.append("-" * 40)
    sem_botoes = [r for r in resultados if not r["modificado"] and not r.get("ignorado")]
    for r in sem_botoes:
        linhas.append(f"  · {r['arquivo']}")

    linhas.append("")
    linhas.append("=" * 70)
    linhas.append("Backups armazenados em: " + str(BACKUP_DIR))
    linhas.append("=" * 70)

    return "\n".join(linhas)


# ──────────────────────────────────────────────────────────────
# EXECUÇÃO PRINCIPAL
# ──────────────────────────────────────────────────────────────

def main():
    """Função principal."""
    print("🔍 Iniciando padronização de botões PDF/Imprimir...")
    print(f"   Raiz do projeto: {PROJECT_ROOT}")
    print(f"   Backup em: {BACKUP_DIR}")
    print()

    inicio = time.time()
    resultados = varre_projeto()
    tempo_total = time.time() - inicio

    relatorio = gera_relatorio(resultados, tempo_total)

    # Salva relatório
    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        f.write(relatorio)

    print(relatorio)
    print(f"\n✅ Relatório salvo em: {REPORT_PATH}")
    print(f"📦 Backups em: {BACKUP_DIR}")


if __name__ == "__main__":
    main()
