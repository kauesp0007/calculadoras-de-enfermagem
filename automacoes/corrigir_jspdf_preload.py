"""
Corrige preloads de jsPDF em todos os HTMLs do site.
Troca rel="preload" (alta prioridade, gera warning se não usado) 
por rel="prefetch" (baixa prioridade, sem warning).

Autor: GitHub Copilot
Data: 2026-07-06
"""

import os
import re
import glob

# ============================================================
# CONFIGURAÇÃO
# ============================================================

# Pastas de idiomas (subpastas da raiz)
IDIOMAS = ["en", "es", "de", "it", "fr", "hi", "zh", "ar",
           "ja", "ru", "ko", "tr", "nl", "pl", "sv", "id", "vi", "uk"]

# Pastas que NÃO devem ser tocadas
PASTAS_EXCLUIDAS = {
    "downloads", "biblioteca", "blog", "blog-templates",
    "locales", "fonts", "node_modules", ".git", "public",
    "img", "automacoes", "assets", "css", "font", "js",
    "admin", "src", "dist", ".vscode",
}

# Arquivos específicos que NÃO devem ser tocados
ARQUIVOS_EXCLUIDOS = {
    "footer.html", "menu-global.html", "global-body-elements.html",
    "downloads.html", "menu-lateral.html", "_language_selector.html",
    "googlefc0a17cdd552164b.html",
}

# Padrão: encontra <link> de preload para jsPDF (ordem-independente)
PADRAO_JSPDF_PRELOAD = re.compile(
    r'<link\s+'
    r'(?=[^>]*\brel="preload")'
    r'(?=[^>]*\bhref="https://cdnjs\.cloudflare\.com/ajax/libs/jspdf[^"]*")'
    r'[^>]*/?>',
    re.IGNORECASE
)

# Padrão para extrair atributos individuais
PADRAO_ATTRS = re.compile(r'(\S+)=["\']([^"\']*)["\']')


def corrigir_tag_preload(match):
    """Converte uma tag <link rel='preload'> do jsPDF para <link rel='prefetch'>."""
    tag = match.group(0)  # A string completa da tag
    # Parse atributos
    attrs = {}
    for m in PADRAO_ATTRS.finditer(tag):
        attrs[m.group(1).lower()] = m.group(2)
    
    # Muda para prefetch e remove 'as' (não suportado em prefetch)
    attrs['rel'] = 'prefetch'
    attrs.pop('as', None)
    
    # Reconstrói a tag
    partes = ['<link']
    for nome, valor in attrs.items():
        partes.append(f'{nome}="{valor}"')
    partes.append('/>')
    
    return ' '.join(partes)


def processar_arquivo(caminho):
    """Processa um arquivo HTML corrigindo preloads de jsPDF."""
    try:
        with open(caminho, 'r', encoding='utf-8') as f:
            html = f.read()
    except Exception:
        return 0
    
    original = html
    html = PADRAO_JSPDF_PRELOAD.sub(corrigir_tag_preload, html)
    
    if html != original:
        with open(caminho, 'w', encoding='utf-8') as f:
            f.write(html)
        return 1
    return 0


def deve_processar(caminho):
    """Verifica se o arquivo/pasta deve ser processado."""
    nome = os.path.basename(caminho)
    
    # Verifica se é um arquivo excluído
    if nome.lower() in {a.lower() for a in ARQUIVOS_EXCLUIDOS}:
        return False
    
    # Verifica se está em uma pasta excluída
    partes = os.path.normpath(caminho).split(os.sep)
    for parte in partes:
        if parte.lower() in {p.lower() for p in PASTAS_EXCLUIDAS}:
            return False
    
    return True


def main():
    # Raiz do projeto = diretório pai de automacoes/
    script_dir = os.path.dirname(os.path.abspath(__file__))
    raiz = os.path.dirname(script_dir)
    os.chdir(raiz)
    print(f"📂 Diretório raiz: {raiz}")
    
    print("=" * 60)
    print("🔍 Procurando preloads de jsPDF para corrigir...")
    print("=" * 60)
    
    total_corrigidos = 0
    total_arquivos = 0
    
    # 1. Arquivos HTML na raiz
    for arquivo in glob.glob("*.html"):
        if not deve_processar(arquivo):
            continue
        total_arquivos += 1
        corrigidos = processar_arquivo(arquivo)
        if corrigidos:
            print(f"  ✅ {arquivo}")
            total_corrigidos += corrigidos
    
    # 2. Arquivos HTML nas pastas de idiomas
    for idioma in IDIOMAS:
        if not os.path.isdir(idioma):
            continue
        padrao = os.path.join(idioma, "*.html")
        for arquivo in glob.glob(padrao):
            if not deve_processar(arquivo):
                continue
            total_arquivos += 1
            corrigidos = processar_arquivo(arquivo)
            if corrigidos:
                print(f"  ✅ {arquivo}")
                total_corrigidos += corrigidos
    
    print()
    print(f"📊 Total de arquivos escaneados: {total_arquivos}")
    print(f"🔧 Total de arquivos corrigidos: {total_corrigidos}")
    
    if total_corrigidos == 0:
        print("   Nenhum preload de jsPDF encontrado para corrigir.")
    
    print("=" * 60)
    print("✅ Concluído!")
    print("=" * 60)


if __name__ == "__main__":
    main()
