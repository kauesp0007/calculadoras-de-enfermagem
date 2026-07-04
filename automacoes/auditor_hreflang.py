import os
import glob
import json
from bs4 import BeautifulSoup
import concurrent.futures

BASE_DIR = os.getcwd()

# Regras do projeto
PASTAS_IDIOMAS = ['en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 'ja', 'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk']
PASTAS_EXCLUIDAS = ['downloads', 'biblioteca', 'blog', 'blog-templates', 'locales', 'fonts', 'node_modules', '.git']
FICHEIROS_EXCLUIDOS = [
    'footer.html', 'menu-global.html', 'global-body-elements.html', 
    'downloads.html', 'menu-lateral.html', '_language_selector.html', 
    'googlefc0a17cdd552164b.html'
]

def obter_ficheiros_html_validos():
    """Recolhe todos os ficheiros HTML válidos respeitando as regras de exclusão."""
    ficheiros_validos = []
    padrao = os.path.join(BASE_DIR, '**', '*.html')
    todos_html = glob.glob(padrao, recursive=True)
    
    for filepath in todos_html:
        nome_ficheiro = os.path.basename(filepath)
        partes_caminho = filepath.replace('\\', '/').split('/')
        
        if nome_ficheiro in FICHEIROS_EXCLUIDOS:
            continue
        if any(pasta in partes_caminho for pasta in PASTAS_EXCLUIDAS):
            continue
            
        ficheiros_validos.append(filepath)
        
    return ficheiros_validos

def identificar_idioma_pela_pasta(filepath):
    """Descobre qual é o idioma da página com base na pasta onde ela está."""
    partes_caminho = filepath.replace('\\', '/').split('/')
    for idioma in PASTAS_IDIOMAS:
        if idioma in partes_caminho:
            return idioma
    return 'pt' # Se não está em nenhuma pasta de idioma estrangeiro, é a raiz (português)

def auditar_pagina(filepath):
    """Analisa as tags hreflang de uma página específica."""
    idioma_real = identificar_idioma_pela_pasta(filepath)
    # Adaptação para o padrão de hreflang do HTML
    idioma_esperado_hreflang = 'pt-br' if idioma_real == 'pt' else idioma_real 
    
    resultado = {
        "arquivo": os.path.relpath(filepath, BASE_DIR),
        "idioma_pasta": idioma_real,
        "erros": [],
        "hreflang_encontrados": 0
    }
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f.read(), 'html.parser')
            
        # Procura todas as tags <link rel="alternate" hreflang="...">
        tags_hreflang = soup.find_all('link', rel='alternate', hreflang=True)
        resultado["hreflang_encontrados"] = len(tags_hreflang)
        
        if len(tags_hreflang) == 0:
            resultado["erros"].append("Página sem NENHUMA tag hreflang.")
            return resultado
            
        # Regra de Ouro: A primeira tag DEVE ser o idioma atual
        primeiro_hreflang = tags_hreflang[0].get('hreflang', '').lower()
        
        if primeiro_hreflang != idioma_esperado_hreflang:
            resultado["erros"].append(f"Ordem Incorreta: O primeiro hreflang é '{primeiro_hreflang}', mas deveria ser '{idioma_esperado_hreflang}'.")
            
        # Verifica se tem os 19 idiomas (18 estrangeiros + 1 pt-br)
        if len(tags_hreflang) < 19:
            resultado["erros"].append(f"Faltam idiomas. Encontrados apenas {len(tags_hreflang)}/19 tags hreflang.")
            
    except Exception as e:
        resultado["erros"].append(f"Erro ao ler HTML: {str(e)}")
        
    return resultado

def main():
    print("⚙️ A iniciar a Auditoria de Hreflang (SEO Internacional)...")
    ficheiros = obter_ficheiros_html_validos()
    print(f"📚 Encontrados {len(ficheiros)} ficheiros para analisar.")
    
    # Processamento em paralelo para ser ultrarrápido
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        relatorio = list(executor.map(auditar_pagina, ficheiros))
        
    # Filtra apenas as páginas que têm problemas
    paginas_com_erros = [item for item in relatorio if len(item['erros']) > 0]
    
    # Guarda o relatório
    ficheiro_relatorio = "relatorio_hreflang.json"
    with open(ficheiro_relatorio, 'w', encoding='utf-8') as f:
        json.dump(paginas_com_erros, f, indent=4, ensure_ascii=False)
        
    # Resumo no terminal
    print("\n" + "="*50)
    print("🎯 RESULTADO DA AUDITORIA DE HREFLANG")
    print("="*50)
    print(f"Total de páginas analisadas: {len(relatorio)}")
    print(f"✅ Páginas com Hreflang Perfeito: {len(relatorio) - len(paginas_com_erros)}")
    print(f"❌ Páginas com Erros de Ordem/Falta: {len(paginas_com_erros)}")
    print("="*50)
    
    if paginas_com_erros:
        print(f"📝 O detalhe de todos os erros foi guardado em: {ficheiro_relatorio}")

if __name__ == "__main__":
    main()