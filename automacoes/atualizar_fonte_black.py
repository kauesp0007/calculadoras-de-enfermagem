import os
import re

# Regras de pastas (Raiz '' e todos os 18 idiomas)
PASTAS_PERMITIDAS = ['', 'en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 'ja', 'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk']

# Regras estritas de pastas e arquivos ignorados
PASTAS_IGNORADAS = ['downloads', 'biblioteca', 'blog', 'blog-templates', 'locales', 'fonts']
ARQUIVOS_IGNORADOS = [
    "footer.html", "menu-global.html", "global-body-elements.html", 
    "downloads.html", "menu-lateral.html", "_language_selector.html", 
    "googlefc0a17cdd552164b.html"
]

def processar_htmls():
    arquivos_alterados = 0
    arquivos_nao_alterados = 0
    diretorio_raiz = os.getcwd()

    for root, dirs, files in os.walk(diretorio_raiz):
        # Filtra pastas do sistema e pastas ignoradas do projeto
        dirs[:] = [d for d in dirs if d not in PASTAS_IGNORADAS and not d.startswith('.') and d != 'node_modules']
        
        # Analisa se a pasta atual pertence à estrutura permitida
        pasta_relativa = os.path.relpath(root, diretorio_raiz).replace('\\', '/')
        if pasta_relativa == '.':
            pasta_relativa = ''
            
        caminho_base = pasta_relativa.split('/')[0] if pasta_relativa else ''
        
        if caminho_base not in PASTAS_PERMITIDAS:
            continue

        for file in files:
            # Pula qualquer coisa que não seja HTML ou que esteja na lista de exclusão
            if not file.endswith('.html') or file in ARQUIVOS_IGNORADOS:
                continue

            caminho_arquivo = os.path.join(root, file)
            
            try:
                with open(caminho_arquivo, 'r', encoding='utf-8') as f:
                    conteudo = f.read()

                # REGRA DE IDIOMA: Se não utiliza a inter-700, ignora imediatamente (idiomas asiáticos/árabe etc)
                if 'inter-700.woff2' not in conteudo:
                    arquivos_nao_alterados += 1
                    continue

                conteudo_original = conteudo

                # --- 1. INJETAR PRELOAD (Agora verificando individualmente) ---
                # Verifica se a tag de preload ESPECÍFICA da 900 ainda não existe
                if not re.search(r'<link[^>]+href=["\']/fonts/inter/inter-900\.woff2["\'][^>]*>', conteudo):
                    
                    # Captura a indentação exata (\1) e a tag inteira da 700 (\2) independente da ordem dos atributos
                    padrao_preload_700 = r'([ \t]*)(<link[^>]+href=["\']/fonts/inter/inter-700\.woff2["\'][^>]*>)'
                    
                    # Cria a nova tag usando o exato formato que você forneceu, preservando o espaçamento inicial original
                    novo_preload = r'\1\2\n\1<link as="font" crossorigin="" href="/fonts/inter/inter-900.woff2" rel="preload" type="font/woff2"/>'
                    
                    conteudo = re.sub(padrao_preload_700, novo_preload, conteudo)

                # --- 2. INJETAR CRITICAL FONTS (Trava de Segurança) ---
                # Verifica se a regra minificada ESPECÍFICA da 900 ainda não existe
                critical_900 = "@font-face{font-family:'Inter';src:url('/fonts/inter/inter-900.woff2') format('woff2');font-weight:900;font-display:swap;size-adjust:98%;}"
                
                if critical_900 not in conteudo:
                    padrao_critical_700 = r'(@font-face\s*\{\s*font-family:\s*[\'"]Inter[\'"];\s*src:\s*url\([\'"]/fonts/inter/inter-700\.woff2[\'"]\)\s*format\([\'"]woff2[\'"]\);\s*font-weight:\s*700;\s*font-display:\s*swap;\s*size-adjust:\s*98%;?\s*\})'
                    conteudo = re.sub(padrao_critical_700, r'\1' + critical_900, conteudo)

                # Grava no arquivo somente se houve mudanças de fato
                if conteudo != conteudo_original:
                    with open(caminho_arquivo, 'w', encoding='utf-8') as f:
                        f.write(conteudo)
                    arquivos_alterados += 1
                else:
                    arquivos_nao_alterados += 1

            except Exception as e:
                print(f"Erro crítico ao tentar processar o arquivo {caminho_arquivo}: {e}")

    # LOG OBRIGATÓRIO NO TERMINAL
    print("\n" + "="*50)
    print("LOG DO AUTOMATIZADOR DE FONTES")
    print("="*50)
    print(f"Número de arquivos alterados: {arquivos_alterados}")
    print(f"Número de arquivos que não precisaram ser alterados: {arquivos_nao_alterados}")
    print("="*50 + "\n")

if __name__ == "__main__":
    processar_htmls()