"""
Minifica o bloco <style id="critical-fonts"> em todos os HTMLs.
Move o bloco minificado para acima de <link as="style" href="/public/output.css".
Respeita fontes específicas de cada idioma (ar, hi, zh, ja, ko).
Não duplica, não quebra código.

Autor: GitHub Copilot
Data: 2026-07-06
"""

import os
import re
import glob

# ============================================================
# CONFIGURAÇÃO
# ============================================================

IDIOMAS = ["en", "es", "de", "it", "fr", "hi", "zh", "ar",
           "ja", "ru", "ko", "tr", "nl", "pl", "sv", "id", "vi", "uk"]

PASTAS_EXCLUIDAS = {
    "downloads", "biblioteca", "blog", "blog-templates",
    "locales", "fonts", "node_modules", ".git", "public",
    "img", "automacoes", "assets", "css", "font", "js",
    "admin", "src", "dist", ".vscode", "institucionais",
}

ARQUIVOS_EXCLUIDOS = {
    "footer.html", "menu-global.html", "global-body-elements.html",
    "downloads.html", "menu-lateral.html", "_language_selector.html",
    "googlefc0a17cdd552164b.html",
}

# Regex para encontrar o bloco <style id="critical-fonts"> inteiro
PADRAO_CRITICAL_FONTS = re.compile(
    r'<style\s+id="critical-fonts"\s*>(.*?)</style>',
    re.IGNORECASE | re.DOTALL
)

# Âncora: linha que contém o link do output.css
ANCORA_OUTPUT_CSS = '<link as="style" href="/public/output.css"'


def minificar_css(css_content):
    """Minifica o conteúdo CSS: remove quebras de linha e espaços extras."""
    # Remove comentários CSS
    css = re.sub(r'/\*.*?\*/', '', css_content, flags=re.DOTALL)
    # Remove quebras de linha e tabs
    css = css.replace('\n', '').replace('\r', '').replace('\t', ' ')
    # Remove espaços antes/depois de { } ; :
    css = re.sub(r'\s*\{\s*', '{', css)
    css = re.sub(r'\s*\}\s*', '}', css)
    css = re.sub(r'\s*;\s*', ';', css)
    css = re.sub(r'\s*:\s*', ':', css)
    # Remove espaços múltiplos
    css = re.sub(r'\s{2,}', ' ', css)
    # Remove espaço após último }
    css = css.strip()
    return f'<style id="critical-fonts">{css}</style>'


def deve_processar(caminho):
    """Verifica se o arquivo/pasta deve ser processado."""
    nome = os.path.basename(caminho)
    if nome.lower() in {a.lower() for a in ARQUIVOS_EXCLUIDOS}:
        return False
    partes = os.path.normpath(caminho).split(os.sep)
    for parte in partes:
        if parte.lower() in {p.lower() for p in PASTAS_EXCLUIDAS}:
            return False
    return True


def processar_arquivo(caminho):
    """
    Processa um arquivo HTML:
    1. Encontra <style id="critical-fonts"> existente
    2. Minifica o conteúdo
    3. Verifica se já existe versão minificada no local correto
    4. Remove bloco antigo e insere minificado acima da âncora
    Retorna: 'alterado', 'ja_minificado', 'sem_bloco', 'erro'
    """
    try:
        with open(caminho, 'r', encoding='utf-8') as f:
            html = f.read()
    except Exception as e:
        return 'erro'

    # 1. Encontra o bloco critical-fonts
    match_cf = PADRAO_CRITICAL_FONTS.search(html)
    if not match_cf:
        return 'sem_bloco'

    bloco_original = match_cf.group(0)
    css_conteudo = match_cf.group(1)
    bloco_minificado = minificar_css(css_conteudo)

    # 2. Verifica se já está minificado (sem quebras de linha no CSS interno)
    if '\n' not in css_conteudo.strip() and bloco_minificado in html:
        return 'ja_minificado'

    # 3. Encontra a âncora
    pos_ancora = html.find(ANCORA_OUTPUT_CSS)
    if pos_ancora == -1:
        # Tenta variação: <link as="style" href="/public/output.css"
        # Se não achar, não mexe
        return 'sem_ancora'

    # 4. Verifica se o bloco minificado JÁ está acima da âncora
    # (procura pelo bloco minificado nas 500 posições antes da âncora)
    antes = html[max(0, pos_ancora - 600):pos_ancora]
    if bloco_minificado in antes:
        # Já está minificado e na posição correta
        # Remove o bloco original se ainda existir em outro lugar
        html_sem_original = html.replace(bloco_original, '', 1)
        if html_sem_original != html:
            with open(caminho, 'w', encoding='utf-8') as f:
                f.write(html_sem_original)
            return 'alterado'  # Removeu duplicata
        return 'ja_minificado'

    # 5. Remove o bloco original
    html = html.replace(bloco_original, '', 1)

    # 6. Re-encontra a âncora (pode ter mudado de posição)
    pos_ancora = html.find(ANCORA_OUTPUT_CSS)
    if pos_ancora == -1:
        return 'sem_ancora'

    # 7. Encontra o início da linha da âncora
    inicio_linha = html.rfind('\n', 0, pos_ancora)
    if inicio_linha == -1:
        inicio_linha = 0
    else:
        inicio_linha += 1  # depois do \n

    # 8. Insere o bloco minificado exatamente acima
    html = (
        html[:inicio_linha] +
        bloco_minificado + '\n' +
        html[inicio_linha:]
    )

    # 9. Salva
    with open(caminho, 'w', encoding='utf-8') as f:
        f.write(html)

    return 'alterado'


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    raiz = os.path.dirname(script_dir)
    os.chdir(raiz)
    print(f"📂 Raiz: {raiz}")
    print("=" * 60)
    print("🔍 Minificando <style id='critical-fonts'> em todos os HTMLs...")
    print("=" * 60)

    resultados = {
        'alterado': [],
        'ja_minificado': [],
        'sem_bloco': [],
        'sem_ancora': [],
        'erro': [],
    }

    total = 0

    # Raiz + pastas de idiomas
    pastas = [''] + IDIOMAS
    for pasta in pastas:
        if pasta and not os.path.isdir(pasta):
            continue
        padrao = os.path.join(pasta, '*.html') if pasta else '*.html'
        for arquivo in glob.glob(padrao):
            if not deve_processar(arquivo):
                continue
            total += 1
            resultado = processar_arquivo(arquivo)
            resultados[resultado].append(arquivo)

    # Relatório
    print()
    print("=" * 60)
    print("📊 RELATÓRIO FINAL")
    print("=" * 60)
    print(f"  🔧 Alterados (minificados):     {len(resultados['alterado'])}")
    print(f"  ✅ Já estavam minificados:      {len(resultados['ja_minificado'])}")
    print(f"  ⚠️  Sem bloco critical-fonts:    {len(resultados['sem_bloco'])}")
    print(f"  ⚠️  Sem âncora output.css:       {len(resultados['sem_ancora'])}")
    print(f"  ❌ Erros:                        {len(resultados['erro'])}")
    print(f"  📄 Total escaneados:             {total}")
    print("=" * 60)

    if resultados['alterado']:
        print("\n📝 Arquivos alterados:")
        for a in resultados['alterado']:
            print(f"  ✅ {a}")

    if resultados['sem_ancora']:
        print("\n⚠️  Arquivos sem âncora (não alterados):")
        for a in resultados['sem_ancora']:
            print(f"  - {a}")

    print("\n✅ Concluído!")


if __name__ == "__main__":
    main()
