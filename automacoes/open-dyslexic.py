import os
import glob
import re

BASE_DIR = os.getcwd()

# Regras de exclusão rigorosas baseadas nas restrições do projeto
PASTAS_EXCLUIDAS = ['downloads', 'biblioteca', 'blog', 'blog-templates', 'locales', 'fonts']
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

def remover_open_dyslexic(conteudo_html):
    """Remove as tags <link> (stylesheet e preload) referentes ao Open Dyslexic."""
    # Remove qualquer link que contenha 'open-dyslexic' no href
    novo_html = re.sub(r'<link[^>]*href=["\'][^"\']*open-dyslexic[^"\']*["\'][^>]*>\s*', '', conteudo_html, flags=re.IGNORECASE)
    
    # Limpa possíveis blocos <noscript> que fiquem vazios após a remoção
    novo_html = re.sub(r'<noscript>\s*</noscript>\s*', '', novo_html, flags=re.IGNORECASE)
    
    return novo_html

def main():
    print("⚙️ A iniciar o corretor do Open Dyslexic (Preparação para Lazy Load)...")
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
            
        with open(filepath, 'r', encoding='utf-8') as f:
            conteudo_original = f.read()
            
        conteudo_limpo = remover_open_dyslexic(conteudo_original)
        
        if conteudo_original != conteudo_limpo:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(conteudo_limpo)
            alterados += 1
        else:
            ignorados += 1

    print("\n" + "="*50)
    print("🎯 RELATÓRIO DE CORREÇÃO: OPEN DYSLEXIC")
    print("="*50)
    print(f"Ficheiros limpos (CSS removido do HEAD): {alterados}")
    print(f"Ficheiros ignorados ou já corretos: {ignorados}")
    print("="*50)

if __name__ == "__main__":
    main()