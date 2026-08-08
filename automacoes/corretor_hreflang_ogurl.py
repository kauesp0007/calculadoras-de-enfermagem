"""
CORRETOR DE HREFLANG & OG:URL -- Varredura Inteligente
======================================================
1. Verifica se og:url nas pastas de idiomas aponta para a página correta (não pt-BR).
2. Identifica quais páginas da raiz têm tradução real para cada idioma.
3. Remove hreflang que apontam para traduções inexistentes.
4. Exclui item.template.html dos hreflangs e das verificações.
5. NÃO escaneia nem altera pastas/arquivos proibidos.

Uso: python automacoes/corretor_hreflang_ogurl.py [--dry-run] [--fix]
"""

import os
import re
import sys
from pathlib import Path
from collections import defaultdict

# ═══════════════════════════════════════════════════════════
# CONFIGURAÇÃO
# ═══════════════════════════════════════════════════════════

RAIZ = Path(__file__).resolve().parent.parent
DOMINIO = "https://www.calculadorasdeenfermagem.com.br"

# Pastas de idiomas (excluindo a raiz pt-BR)
PASTAS_IDIOMAS = [
    "en", "es", "de", "it", "fr",
    "hi", "zh", "ar", "ja", "ru",
    "ko", "tr", "nl", "pl", "sv",
    "id", "vi", "uk",
]

# Pastas que NUNCA devem ser escaneadas ou alteradas
PASTAS_PROIBIDAS = {
    "downloads", "biblioteca", "blog", "blog-templates",
    "locales", "fonts", "node_modules", ".git", "backups_seo",
    "automacoes", "logs", "public", "src", "test_catalogador",
    "partials", ".chrome-perfil-pci", "docs", "imagens",
    "imagens_customizadas_web", "img", "js", "provas-pdf",
    "relatorios", "scripts", "tradutor", "translator", ".vscode",
    "videos", "yourdomain.com", "posts-markdown", "conta",
    ".github", "CATALOGO_DA_ARQUITETURA_ESTRUTURAL",
    "CATALOGO_DE_ESTRUTURA_FISICA", "CATALOGO_DE_IDENTIDADE_VISUAL",
    "CATALOGO_SEO_METAS_HEAD",
}

# Arquivos que NUNCA devem ser processados
ARQUIVOS_PROIBIDOS = {
    "footer.html", "menu-global.html", "global-body-elements.html",
    "downloads.html", "menu-lateral.html", "_language_selector.html",
    "googlefc0a17cdd552164b.html",
}

# Arquivos que devem ser EXCLUÍDOS dos hreflangs mas podem existir na raiz
ARQUIVOS_EXCLUIR_HREFLANG = {
    "item.template.html",
}

# ═══════════════════════════════════════════════════════════
# FUNÇÕES AUXILIARES
# ═══════════════════════════════════════════════════════════

def diretorio_eh_proibido(caminho: Path) -> bool:
    """Verifica se qualquer parte do caminho contém uma pasta proibida."""
    partes = set(caminho.relative_to(RAIZ).parts)
    return bool(partes & PASTAS_PROIBIDAS)


def arquivo_eh_proibido(nome: str) -> bool:
    """Verifica se o arquivo está na lista de proibidos."""
    return nome in ARQUIVOS_PROIBIDOS


def arquivo_excluido_hreflang(nome: str) -> bool:
    """Verifica se o arquivo deve ser excluído dos hreflangs."""
    return nome in ARQUIVOS_EXCLUIR_HREFLANG


def _ler_html(caminho: Path) -> str:
    """Lê arquivo HTML preservando quebras de linha originais (CRLF ou LF)."""
    with open(caminho, "r", encoding="utf-8", newline="") as f:
        return f.read()


def _salvar_html(caminho: Path, html: str):
    """Salva arquivo HTML preservando quebras de linha originais."""
    with open(caminho, "w", encoding="utf-8", newline="") as f:
        f.write(html)


def extrair_og_url(html: str) -> str | None:
    """Extrai o valor do meta og:url (ordem-independente)."""
    padrao = re.compile(
        r'<meta\s+'
        r'(?=[^>]*\bproperty="og:url")'
        r'[^>]*\bcontent="([^"]*)"'
        r'[^>]*/?>',
        re.IGNORECASE
    )
    match = padrao.search(html)
    return match.group(1) if match else None


def extrair_hreflangs(html: str) -> list[dict]:
    """
    Extrai todas as tags hreflang do HTML.
    Retorna lista de dicts: {lang, href, tag_completa, start, end}
    """
    padrao = re.compile(
        r'<link\s+'
        r'(?=[^>]*\brel="alternate")'
        r'(?=[^>]*\bhreflang="([^"]*)")'
        r'[^>]*\bhref="([^"]*)"'
        r'[^>]*/?>',
        re.IGNORECASE
    )
    resultados = []
    for m in padrao.finditer(html):
        resultados.append({
            "lang": m.group(1).lower(),
            "href": m.group(2),
            "tag_completa": m.group(0),
            "start": m.start(),
            "end": m.end(),
        })
    return resultados


def extrair_canonical(html: str) -> str | None:
    """Extrai o href do link canonical (ordem-independente)."""
    padrao = re.compile(
        r'<link\s+'
        r'(?=[^>]*\brel="canonical")'
        r'[^>]*\bhref="([^"]*)"'
        r'[^>]*/?>',
        re.IGNORECASE
    )
    match = padrao.search(html)
    return match.group(1) if match else None


def computar_url_correta(caminho_arquivo: Path) -> str:
    """
    Calcula a URL canônica correta para um arquivo HTML,
    baseado na sua posição no sistema de arquivos.
    Ex: raiz/index.html        -> https://...com.br/
        raiz/manchester.html   -> https://...com.br/manchester.html
        raiz/en/manchester.html -> https://...com.br/en/manchester.html
        raiz/en/index.html     -> https://...com.br/en/
    """
    try:
        relativo = caminho_arquivo.relative_to(RAIZ)
    except ValueError:
        return f"{DOMINIO}/{caminho_arquivo.name}"

    partes = list(relativo.parts)

    # index.html na raiz -> URL base
    if partes == ["index.html"]:
        return f"{DOMINIO}/"

    # index.html em pasta de idioma -> URL com /{lang}/
    if len(partes) == 2 and partes[1] == "index.html" and partes[0] in PASTAS_IDIOMAS:
        return f"{DOMINIO}/{partes[0]}/"

    # Monta URL completa
    return f"{DOMINIO}/{'/'.join(partes)}"


# ═══════════════════════════════════════════════════════════
# FASE 1: INVENTÁRIO -- Mapear quais arquivos existem onde
# ═══════════════════════════════════════════════════════════

def construir_inventario() -> dict[str, set]:
    """
    Varre a raiz e todas as pastas de idiomas.
    Retorna: { "nome_arquivo.html": {"pt", "en", "es", ...} }
    """
    inventario = defaultdict(set)

    # 1. Raiz (pt-BR)
    for arquivo in RAIZ.glob("*.html"):
        if arquivo_eh_proibido(arquivo.name):
            continue
        inventario[arquivo.name].add("pt")

    # 2. Pastas de idiomas
    for idioma in PASTAS_IDIOMAS:
        pasta_idioma = RAIZ / idioma
        if not pasta_idioma.is_dir():
            continue
        for arquivo in pasta_idioma.glob("*.html"):
            if arquivo_eh_proibido(arquivo.name):
                continue
            inventario[arquivo.name].add(idioma)

    return dict(inventario)


# ═══════════════════════════════════════════════════════════
# FASE 2: VERIFICAR OG:URL NAS PASTAS DE IDIOMAS
# ═══════════════════════════════════════════════════════════

def verificar_ogurl_pastas_idiomas(inventario: dict, dry_run: bool = True) -> list[str]:
    """
    Para cada HTML em cada pasta de idioma, verifica se og:url
    aponta para a URL correta (com a pasta do idioma).
    Corrige se --fix estiver ativo.
    """
    relatorio = []
    total_corrigidos = 0
    total_ok = 0
    total_sem_ogurl = 0

    for nome_arquivo, idiomas in inventario.items():
        for idioma in idiomas:
            if idioma == "pt":
                continue  # Só verifica pastas de idiomas

            caminho = RAIZ / idioma / nome_arquivo
            if not caminho.is_file():
                continue

            html = _ler_html(caminho)

            og_url_atual = extrair_og_url(html)
            url_correta = computar_url_correta(caminho)

            if og_url_atual is None:
                total_sem_ogurl += 1
                relatorio.append(f"  !!  {idioma}/{nome_arquivo}: og:url AUSENTE (deveria ser {url_correta})")
                continue

            if og_url_atual == url_correta:
                total_ok += 1
                continue

            # og:url incorreto -- precisa corrigir
            relatorio.append(f"  [CORRECAO] {idioma}/{nome_arquivo}: og:url INCORRETO")
            relatorio.append(f"       Atual:  {og_url_atual}")
            relatorio.append(f"       Correto: {url_correta}")

            if not dry_run:
                # Substitui apenas o valor do content no meta og:url
                html_corrigido = re.sub(
                    r'(<meta\s+(?=[^>]*\bproperty="og:url")[^>]*\bcontent=")'
                    + re.escape(og_url_atual)
                    + r'(")',
                    rf'\1{url_correta}\2',
                    html,
                    count=1,
                    flags=re.IGNORECASE
                )
                if html_corrigido != html:
                    _salvar_html(caminho, html_corrigido)
                    total_corrigidos += 1

    return relatorio, total_ok, total_corrigidos, total_sem_ogurl


# ═══════════════════════════════════════════════════════════
# FASE 3: CORRIGIR HREFLANGS NA RAIZ (REMOVER MORTO + TEMPLATE)
# ═══════════════════════════════════════════════════════════

def corrigir_hreflangs_raiz(inventario: dict, dry_run: bool = True) -> list[str]:
    """
    Para cada HTML na raiz (pt-BR):
    1. Remove item.template.html dos hreflangs
    2. Remove hreflangs que apontam para idiomas sem tradução real
    3. Remove quaisquer hreflangs para arquivos excluídos
    """
    relatorio = []
    total_arquivos = 0
    total_tags_removidas = 0

    for arquivo in RAIZ.glob("*.html"):
        if arquivo_eh_proibido(arquivo.name):
            continue

        total_arquivos += 1
        html = _ler_html(arquivo)

        hreflangs = extrair_hreflangs(html)
        if not hreflangs:
            continue

        html_original = html
        tags_removidas_neste = 0
        idiomas_com_traducao = inventario.get(arquivo.name, set())

        # Processa de trás para frente (preserva índices)
        for tag_info in reversed(hreflangs):
            lang = tag_info["lang"]
            href = tag_info["href"]
            deve_remover = False
            motivo = ""

            # 1. Remover item.template.html
            if "item.template.html" in href:
                deve_remover = True
                motivo = "item.template.html"

            # 2. Remover hreflang para idioma sem tradução
            elif lang not in ("pt", "pt-br", "x-default"):
                if lang not in idiomas_com_traducao:
                    deve_remover = True
                    motivo = f"idioma '{lang}' sem tradução para '{arquivo.name}'"

            # 3. Remover hreflang para arquivo excluído
            elif arquivo_excluido_hreflang(arquivo.name):
                deve_remover = True
                motivo = f"arquivo '{arquivo.name}' na lista de exclusão"

            if deve_remover:
                html = html[:tag_info["start"]] + html[tag_info["end"]:]
                tags_removidas_neste += 1
                relatorio.append(f"    X  {arquivo.name}: hreflang '{lang}' removido -- {motivo}")

        # Remove hreflangs para item.template.html que possam estar em outros arquivos
        for tag_info in reversed(extrair_hreflangs(html)):
            if "item.template.html" in tag_info["href"]:
                html = html[:tag_info["start"]] + html[tag_info["end"]:]
                tags_removidas_neste += 1
                relatorio.append(f"    X  {arquivo.name}: hreflang residual item.template.html removido")

        total_tags_removidas += tags_removidas_neste

        if html != html_original and not dry_run:
            _salvar_html(arquivo, html)

    return relatorio, total_arquivos, total_tags_removidas


# ═══════════════════════════════════════════════════════════
# FASE 4: REMOVER ITEM.TEMPLATE.HTML DAS PASTAS DE IDIOMAS
# ═══════════════════════════════════════════════════════════

def remover_item_template_dos_idiomas(inventario: dict, dry_run: bool = True) -> list[str]:
    """
    Remove hreflangs apontando para item.template.html também das pastas de idiomas.
    """
    relatorio = []
    total_removidos = 0

    for nome_arquivo, idiomas in inventario.items():
        for idioma in idiomas:
            if idioma == "pt":
                caminho = RAIZ / nome_arquivo
            else:
                caminho = RAIZ / idioma / nome_arquivo

            if not caminho.is_file():
                continue

            html = _ler_html(caminho)

            html_original = html
            removidos_neste = 0

            for tag_info in reversed(extrair_hreflangs(html)):
                if "item.template.html" in tag_info["href"]:
                    html = html[:tag_info["start"]] + html[tag_info["end"]:]
                    removidos_neste += 1

            if removidos_neste > 0:
                total_removidos += removidos_neste
                lang_display = "pt" if idioma == "pt" else idioma
                relatorio.append(f"    X  {lang_display}/{nome_arquivo}: {removidos_neste} hreflang(s) item.template.html removido(s)")

                if not dry_run and html != html_original:
                    _salvar_html(caminho, html)

    return relatorio, total_removidos


# ═══════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════

def main():
    dry_run = "--dry-run" in sys.argv or "--fix" not in sys.argv
    modo = "[SIMULACAO] SIMULAÇÃO (dry-run)" if dry_run else "[CORRECAO] CORREÇÃO (--fix)"

    print("=" * 70)
    print("  CORRETOR DE HREFLANG & OG:URL -- Varredura Inteligente")
    print(f"  Modo: {modo}")
    print("=" * 70)

    # ── Fase 1: Inventário ──────────────────────────────────
    print("\n[FASE 1] [FASE 1] Construindo inventário de traduções...")
    inventario = construir_inventario()

    total_arquivos_pt = sum(1 for idiomas in inventario.values() if "pt" in idiomas)
    print(f"   Arquivos PT na raiz: {total_arquivos_pt}")
    for nome, idiomas in sorted(inventario.items()):
        if "pt" in idiomas:
            outros = sorted(idiomas - {"pt"})
            if outros:
                print(f"     - {nome}: traduzido para {', '.join(outros)} ({len(outros)} idiomas)")
            else:
                print(f"     - {nome}: XX sem traduções")

    # ── Fase 2: Verificar og:url ────────────────────────────
    print("\n[FASE 2] [FASE 2] Verificando og:url nas pastas de idiomas...")
    rel_og, ok_og, corrigidos_og, sem_og = verificar_ogurl_pastas_idiomas(inventario, dry_run)
    for linha in rel_og:
        print(linha)
    print(f"\n   OK OK: {ok_og}  |  [CORRECAO] Corrigidos: {corrigidos_og}  |  !! Sem og:url: {sem_og}")

    # ── Fase 3: Corrigir hreflangs na raiz ──────────────────
    print("\n[FASE 3] [FASE 3] Corrigindo hreflangs na raiz (removendo links mortos + item.template)...")
    rel_hr, total_arq, total_tags = corrigir_hreflangs_raiz(inventario, dry_run)
    for linha in rel_hr:
        print(linha)
    print(f"\n   [ARQS] Arquivos processados: {total_arq}  |    X Tags removidas: {total_tags}")

    # ── Fase 4: Remover item.template dos idiomas ───────────
    print("\n[FASE 4] [FASE 4] Removendo item.template.html dos hreflangs nas pastas de idiomas...")
    rel_tmpl, total_tmpl = remover_item_template_dos_idiomas(inventario, dry_run)
    for linha in rel_tmpl:
        print(linha)
    print(f"\n     X Total de hreflangs item.template removidos: {total_tmpl}")

    # ── Resumo ──────────────────────────────────────────────
    print("\n" + "=" * 70)
    print("  RESUMO FINAL")
    print("=" * 70)
    print(f"  [FASE 2] og:url OK: {ok_og}")
    print(f"  [CORRECAO] og:url corrigidos: {corrigidos_og}")
    print(f"  !!  og:url ausentes: {sem_og}")
    print(f"    X  hreflangs removidos (raiz): {total_tags}")
    print(f"    X  hreflangs item.template removidos (idiomas): {total_tmpl}")
    print(f"  [ARQS] Arquivos raiz processados: {total_arq}")

    if dry_run:
        print(f"\n  >> Para aplicar as correções, execute: python automacoes/corretor_hreflang_ogurl.py --fix")
    else:
        print(f"\n  OK Todas as correções foram aplicadas!")
    print("=" * 70)


if __name__ == "__main__":
    main()
