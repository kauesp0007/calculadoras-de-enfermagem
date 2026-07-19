import os

# ==========================================
# CONFIGURAÇÕES DO AUTOMATIZADOR
# ==========================================
IDIOMAS_VALIDOS = ['en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 'ja', 'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk']

PASTAS_IGNORADAS = ['downloads', 'biblioteca', 'blog', 'blog-templates', 'locales', 'fonts', 'node_modules', '.git']

ARQUIVOS_IGNORADOS = ['footer.html', 'menu-global.html', 'global-body-elements.html', 'downloads.html', 'menu-lateral.html', '_language_selector.html', 'googlefc0a17cdd552164b.html']
EXTENSAO_ALVO = '.html'

# Note que a quebra de linha inicial está removida para alinhar perfeitamente no seu HTML
NOVAS_FONTES = '<link as="font" crossorigin="" href="/fonts/fa-solid/fa-solid-900.woff2" rel="preload" type="font/woff2"/>\n<link as="font" crossorigin="" href="/fonts/fa-brands/fa-brands-400.woff2" rel="preload" type="font/woff2"/>'

def deve_processar_pasta(root_path):
    # Padroniza as barras para evitar problemas entre Windows e Mac/Linux
    clean_path = os.path.normpath(root_path).replace('\\', '/')
    partes = clean_path.split('/')
    
    # Bloqueio de pastas ignoradas
    for ignorada in PASTAS_IGNORADAS:
        if ignorada in partes:
            return False
            
    # Permite a execução na raiz do site
    if clean_path == '.':
        return True
        
    # Permite a execução exata no primeiro nível das pastas de idiomas válidas
    if len(partes) == 1 and partes[0] in IDIOMAS_VALIDOS:
        return True
        
    return False

def iniciar_scan():
    arquivos_modificados = 0
    arquivos_ignorados = 0
    arquivos_ja_atualizados = 0

    print("\nIniciando inserção de preloads FontAwesome...")
    print("-" * 65)

    for root, dirs, files in os.walk('.'):
        # Filtra subpastas bloqueadas em tempo real para otimizar memória
        dirs[:] = [d for d in dirs if d not in PASTAS_IGNORADAS and not d.startswith('.')]

        if not deve_processar_pasta(root):
            continue

        for file in files:
            if file.endswith(EXTENSAO_ALVO) and file not in ARQUIVOS_IGNORADOS:
                filepath = os.path.join(root, file)
                
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                    # ========================================================
                    # PROTEÇÃO CORRIGIDA:
                    # Agora exige que exista o caminho da fonte E a palavra "preload"
                    # Isso evita que o script seja enganado pela tag <style>
                    # ========================================================
                    if 'href="/fonts/fa-solid/fa-solid-900.woff2"' in content and 'rel="preload"' in content:
                        arquivos_ja_atualizados += 1
                        continue
                        
                    # Divide o conteúdo em linhas para injeção precisa
                    linhas = content.split('\n')
                    idx_insercao = -1
                    
                    # 1º Tentativa: Inserir logo antes da seção 8 de SEO
                    for i, linha in enumerate(linhas):
                        if '<!-- 8. SEO' in linha:
                            idx_insercao = i
                            break
                    
                    # 2º Tentativa: Se não achar SEO, encontra a última fonte carregada
                    if idx_insercao == -1:
                        for i in range(len(linhas)-1, -1, -1):
                            if '<link' in linhas[i] and '.woff2' in linhas[i] and 'preload' in linhas[i]:
                                idx_insercao = i + 1
                                break
                    
                    if idx_insercao != -1:
                        # Insere as novas fontes no índice exato
                        linhas.insert(idx_insercao, NOVAS_FONTES)
                        novo_conteudo = '\n'.join(linhas)
                        
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(novo_conteudo)
                        arquivos_modificados += 1
                    else:
                        arquivos_ignorados += 1
                        
                except Exception as e:
                    print(f"ERRO: Não foi possível processar o arquivo {filepath}: {e}")
                    arquivos_ignorados += 1

    # Log Final Formatado
    print("-" * 65)
    print("RESUMO DA AVALIAÇÃO E EXECUÇÃO:")
    print(f" [✓] Arquivos modificados com sucesso   : {arquivos_modificados}")
    print(f" [-] Arquivos que não precisaram        : {arquivos_ja_atualizados}")
    print(f" [!] Arquivos ignorados (sem padrão)    : {arquivos_ignorados}")
    print("-" * 65)
    print("Processo concluído com segurança.\n")

if __name__ == '__main__':
    iniciar_scan()