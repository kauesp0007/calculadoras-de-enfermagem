"""
Substitui 'font-display: optional' por 'font-display: swap' 
apenas dentro do bloco <style id="critical-fonts"> em todos os arquivos HTML.

Autor: Gemini
Data: 2026-07-18
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

# Regex para encontrar o bloco <style id="critical-fonts"> e seu conteúdo interno
PADRAO_CRITICAL_FONTS = re.compile(
    r'(<style\s+id="critical-fonts"[^>]*>)(.*?)(</style>)',
    re.IGNORECASE | re.DOTALL
)

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
    1. Encontra <style id="critical-fonts">
    2. Substitui 'font-display: optional' ou 'font-display:optional' por 'font-display: swap' apenas dentro deste bloco.
    """
    try:
        with open(caminho, 'r', encoding='utf-8') as f:
            html = f.read()
    except Exception as e:
        return 'erro'

    html_original = html

    def substituir_no_bloco(match):
        tag_abertura = match.group(1)
        conteudo_css = match.group(2)
        tag_fechamento = match.group(3)

        # Substitui 'optional' por 'swap', lidando com possíveis espaços
        # regex: font-display:\s*optional\s*;?
        novo_css = re.sub(r'font-display:\s*optional\s*;?', 'font-display:swap;', conteudo_css, flags=re.IGNORECASE)
        
        # Como o regex anterior pode ter adicionado um ponto e vírgula extra no final, vamos limpar se houver duplicidade
        novo_css = novo_css.replace(';;', ';')
        # E se era a última regra sem ponto e vírgula antes do '}'
        novo_css = novo_css.replace(';}', '}')

        return f"{tag_abertura}{novo_css}{tag_fechamento}"

    # Aplica a substituição apenas dentro dos blocos encontrados
    html_modificado = PADRAO_CRITICAL_FONTS.sub(substituir_no_bloco, html)

    if html_original != html_modificado:
        with open(caminho, 'w', encoding='utf-8') as f:
            f.write(html_modificado)
        return 'alterado'
    else:
        # Se encontrou o bloco, mas não precisou mudar, assumimos que já está com 'swap' ou não tem 'font-display'
        match_cf = PADRAO_CRITICAL_FONTS.search(html)
        if match_cf:
             if 'font-display:swap' in match_cf.group(2).replace(' ', '') or 'font-display: swap' in match_cf.group(2):
                 return 'ja_corrigido'
             else:
                 return 'sem_alteracao_necessaria'
        return 'sem_bloco'

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    raiz = os.path.dirname(script_dir)
    os.chdir(raiz)
    
    print(f"📂 Raiz: {raiz}")
    print("=" * 60)
    print("🔍 Substituindo 'font-display: optional' por 'swap' no CSS inline...")
    print("=" * 60)

    resultados = {
        'alterado': [],
        'ja_corrigido': [],
        'sem_bloco': [],
        'sem_alteracao_necessaria': [],
        'erro': [],
    }

    total = 0

    # Adiciona a raiz e as pastas de idiomas à lista de busca
    pastas = [''] + IDIOMAS
    
    for pasta in pastas:
        if pasta and not os.path.isdir(pasta):
            continue
        
        # Padrão de busca para a raiz ou para a subpasta
        padrao = os.path.join(pasta, '*.html') if pasta else '*.html'
        
        for arquivo in glob.glob(padrao):
            if not deve_processar(arquivo):
                continue
                
            total += 1
            resultado = processar_arquivo(arquivo)
            resultados[resultado].append(arquivo)

    # Relatório Final
    print()
    print("=" * 60)
    print("📊 RELATÓRIO FINAL DA CORREÇÃO DE FONTES")
    print("=" * 60)
    print(f"  🔧 Arquivos Corrigidos ('swap' aplicado): {len(resultados['alterado'])}")
    print(f"  ✅ Já estavam com 'swap':                 {len(resultados['ja_corrigido'])}")
    print(f"  ⚠️  Sem bloco critical-fonts:             {len(resultados['sem_bloco'])}")
    print(f"  ❌ Erros de leitura/escrita:              {len(resultados['erro'])}")
    print(f"  📄 Total de arquivos escaneados:          {total}")
    print("=" * 60)

    if resultados['alterado'] and len(resultados['alterado']) <= 20:
        print("\n📝 Arquivos alterados:")
        for a in resultados['alterado']:
            print(f"  ✅ {a}")
    elif len(resultados['alterado']) > 20:
        print(f"\n📝 {len(resultados['alterado'])} arquivos foram alterados (lista ocultada devido ao tamanho).")

    print("\n✅ Script concluído!")

if __name__ == "__main__":
    main()