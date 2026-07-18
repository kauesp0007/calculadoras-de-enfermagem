import os
import json
import re

JSON_FILE = "relatorio_auditoria_seo.json"

# Regras de exclusão rigorosas baseadas nas restrições do seu projeto
PASTAS_EXCLUIDAS = ['downloads', 'biblioteca', 'blog', 'blog-templates', 'locales', 'fonts', '.git', 'node_modules', 'dist', 'output', '__pycache__']
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

def analisar_html(conteudo_html):
    """
    Analisa o HTML para descobrir se o FontAwesome foi carregado
    e quantos ícones foram efetivamente usados no corpo da página.
    """
    # 1. Verifica se existe a importação do FontAwesome no <head>
    padrao_link_fa = re.compile(r'<link[^>]*href=["\'][^"\']*(fontawesome|font-awesome|fa-solid|fa-brands)[^"\']*["\'][^>]*>', re.IGNORECASE)
    carregado = bool(padrao_link_fa.search(conteudo_html))
    
    # 2. Conta os ícones usados
    # A regex procura por 'fa-' seguido de letras/numeros (ex: fa-bed, fa-house)
    padrao_icone = re.compile(r'\bfa-([a-z0-9-]+)\b', re.IGNORECASE)
    matches = padrao_icone.findall(conteudo_html)
    
    # Filtra classes base que não são ícones para não dar falso positivo
    classes_base = {'solid', 'regular', 'brands', 'fw', 'lg', 'sm', 'spin', 'pulse', '2x', '3x', '4x', '5x'}
    icones_reais = [m for m in matches if m.lower() not in classes_base]
    
    return {
        "font_awesome_carregado": carregado,
        "qtd_icones_fa_usados": len(icones_reais)
    }

def main():
    print("🔍 A iniciar o Auditor Mestre de SEO e Fontes...")
    
    diretorio_raiz = os.getcwd()
    relatorio_geral = []
    
    arquivos_analisados = 0
    arquivos_ignorados = 0

    for root, dirs, files in os.walk(diretorio_raiz):
        # Modifica a lista 'dirs' in-place para não entrar nas pastas excluídas
        dirs[:] = [d for d in dirs if d not in PASTAS_EXCLUIDAS]
        
        for file in files:
            if not file.endswith('.html'):
                continue
                
            caminho_completo = os.path.join(root, file)
            caminho_relativo = os.path.relpath(caminho_completo, diretorio_raiz).replace('\\', '/')
            
            # Se cair nas regras proibidas, ignora e pula
            if deve_ignorar_ficheiro(caminho_relativo):
                arquivos_ignorados += 1
                continue
                
            try:
                with open(caminho_completo, 'r', encoding='utf-8') as f:
                    conteudo = f.read()
                    
                dados_analise = analisar_html(conteudo)
                
                relatorio_geral.append({
                    "arquivo": caminho_relativo,
                    "dados_fontes": dados_analise
                })
                
                arquivos_analisados += 1
                
            except Exception as e:
                print(f"⚠️ Erro ao ler {caminho_relativo}: {e}")

    # Salva os resultados no JSON esperado pelo corretor
    with open(JSON_FILE, 'w', encoding='utf-8') as f:
        json.dump(relatorio_geral, f, indent=4, ensure_ascii=False)
        
    print("\n" + "="*45)
    print("📊 RELATÓRIO DE AUDITORIA CONCLUÍDO")
    print("="*45)
    print(f"Ficheiros HTML analisados: {arquivos_analisados}")
    print(f"Ficheiros ignorados pelas regras: {arquivos_ignorados}")
    print(f"Ficheiro JSON gerado com sucesso: {JSON_FILE}")
    print("="*45)
    print("👉 Agora você pode executar o 'corretor_fontawesome.py'!")

if __name__ == "__main__":
    main()