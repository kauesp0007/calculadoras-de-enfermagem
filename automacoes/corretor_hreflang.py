import os
import glob
import re

BASE_DIR = os.getcwd()
DOMINIO = "https://www.calculadorasdeenfermagem.com.br"

# Regras do projeto
PASTAS_IDIOMAS = ['en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 'ja', 'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk']
PASTAS_EXCLUIDAS = ['downloads', 'biblioteca', 'blog', 'blog-templates', 'locales', 'fonts', 'node_modules', '.git']
FICHEIROS_EXCLUIDOS = [
    'footer.html', 'menu-global.html', 'global-body-elements.html', 
    'downloads.html', 'menu-lateral.html', '_language_selector.html', 
    'googlefc0a17cdd552164b.html'
]

def deve_ignorar_ficheiro(filepath):
    """Verifica se o ficheiro está nas listas de exclusão de pastas ou nomes."""
    nome_ficheiro = os.path.basename(filepath)
    if nome_ficheiro in FICHEIROS_EXCLUIDOS:
        return True
        
    partes_caminho = filepath.replace('\\', '/').split('/')
    for pasta in PASTAS_EXCLUIDAS:
        if pasta in partes_caminho:
            return True
            
    return False

def identificar_idioma_pela_pasta(filepath):
    """Descobre qual é o idioma da página com base na pasta onde ela está."""
    partes_caminho = filepath.replace('\\', '/').split('/')
    for idioma in PASTAS_IDIOMAS:
        if idioma in partes_caminho:
            return idioma
    return 'pt' # Raiz (português)

def gerar_bloco_hreflang(idioma_atual, nome_ficheiro):
    """Gera as 19 tags hreflang, garantindo que o idioma da página atual é o primeiro."""
    todos_idiomas = ['pt'] + PASTAS_IDIOMAS.copy()
    
    # Reordenar: O idioma da página atual tem de ser sempre o primeiro da lista
    if idioma_atual in todos_idiomas:
        todos_idiomas.remove(idioma_atual)
    todos_idiomas.insert(0, idioma_atual)
    
    tags = []
    for lang in todos_idiomas:
        codigo_hreflang = "pt-br" if lang == "pt" else lang
        
        # Constrói o URL absoluto dependendo se é a raiz ou uma pasta traduzida
        if lang == "pt":
            url = f"{DOMINIO}/{nome_ficheiro}"
        else:
            url = f"{DOMINIO}/{lang}/{nome_ficheiro}"
            
        tags.append(f'<link rel="alternate" hreflang="{codigo_hreflang}" href="{url}" />')
        
    return "\n    ".join(tags)

def corrigir_hreflang(conteudo_html, idioma_atual, nome_ficheiro):
    """Substitui as tags antigas pelo novo bloco perfeito."""
    # 1. Remove qualquer tag hreflang antiga para evitar duplicados
    novo_html = re.sub(r'<link[^>]*rel=["\']alternate["\'][^>]*hreflang=["\'][^"\']*["\'][^>]*>\s*', '', conteudo_html, flags=re.IGNORECASE)
    
    # 2. Gera o novo bloco organizado
    bloco_hreflang = f"<!-- Hreflang Global (Automático) -->\n    {gerar_bloco_hreflang(idioma_atual, nome_ficheiro)}"
    
    # 3. Injeta o novo bloco preferencialmente após o Canonical, ou antes do fecho do HEAD
    if re.search(r'<link[^>]*rel=["\']canonical["\'][^>]*>', novo_html, flags=re.IGNORECASE):
        # Utiliza Regex para colocar o hreflang exatamente depois da tag canonical
        novo_html = re.sub(
            r'(<link[^>]*rel=["\']canonical["\'][^>]*>\s*)',
            r'\g<1>' + bloco_hreflang.replace('\\', '\\\\') + '\n    ',
            novo_html,
            count=1,
            flags=re.IGNORECASE
        )
    else:
        # Fallback de segurança
        novo_html = novo_html.replace('</head>', f'    {bloco_hreflang}\n  </head>')
        
    return novo_html

def main():
    print("⚙️ A iniciar o Corretor de Hreflang (Reorganização Global)...")
    padrao = os.path.join(BASE_DIR, '**', '*.html')
    arquivos = glob.glob(padrao, recursive=True)

    alterados = 0
    ignorados = 0

    for filepath in arquivos:
        if 'node_modules' in filepath or '.git' in filepath: 
            continue
            
        if deve_ignorar_ficheiro(filepath):
            ignorados += 1
            continue
            
        nome_ficheiro = os.path.basename(filepath)
        idioma = identificar_idioma_pela_pasta(filepath)
        
        with open(filepath, 'r', encoding='utf-8') as f:
            conteudo_original = f.read()
            
        conteudo_limpo = corrigir_hreflang(conteudo_original, idioma, nome_ficheiro)
        
        if conteudo_original != conteudo_limpo:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(conteudo_limpo)
            alterados += 1
        else:
            ignorados += 1

    # Log final conforme as regras de automação
    print("\n" + "="*50)
    print("🎯 RELATÓRIO DE CORREÇÃO: HREFLANG E SEO INTERNACIONAL")
    print("="*50)
    print(f"Ficheiros reparados (Hreflang perfeito): {alterados}")
    print(f"Ficheiros ignorados ou protegidos: {ignorados}")
    print("="*50)

if __name__ == "__main__":
    main()