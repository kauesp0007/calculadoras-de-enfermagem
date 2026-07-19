import os
import re

# ==========================================
# CONFIGURAÇÕES DO AUTOMATIZADOR
# ==========================================
IDIOMAS_VALIDOS = ['en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 'ja', 'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk']
PASTAS_IGNORADAS = ['downloads', 'biblioteca', 'blog', 'blog-templates', 'locales', 'fonts', 'node_modules', '.git']
ARQUIVOS_IGNORADOS = ['footer.html', 'menu-global.html', 'global-body-elements.html', 'downloads.html', 'menu-lateral.html', '_language_selector.html', 'googlefc0a17cdd552164b.html']
EXTENSAO_ALVO = '.html'

def deve_processar_pasta(root_path):
    # Padroniza as barras
    clean_path = os.path.normpath(root_path).replace('\\', '/')
    partes = clean_path.split('/')
    
    # Bloqueio de pastas ignoradas
    for ignorada in PASTAS_IGNORADAS:
        if ignorada in partes:
            return False
            
    # Permite a execução na raiz do site
    if clean_path == '.':
        return True
        
    # Permite a execução no primeiro nível das pastas de idiomas
    if len(partes) == 1 and partes[0] in IDIOMAS_VALIDOS:
        return True
        
    return False

def iniciar_scan():
    arquivos_modificados = 0
    arquivos_ignorados = 0
    arquivos_ja_atualizados = 0

    # Regex que busca a fonte específica e verifica se ELA JÁ NÃO TEM o size-adjust antes de fechar a chave }
    regex_inter = re.compile(r"(@font-face\s*\{\s*font-family:\s*['\"]Inter['\"][^}]*?font-display:\s*swap)(?!\s*;\s*size-adjust)(\s*\})", re.IGNORECASE)
    regex_nunito = re.compile(r"(@font-face\s*\{\s*font-family:\s*['\"]Nunito Sans['\"][^}]*?font-display:\s*swap)(?!\s*;\s*size-adjust)(\s*\})", re.IGNORECASE)

    print("\nIniciando sincronização de 'size-adjust' no CSS Crítico Inline...")
    print("-" * 65)

    for root, dirs, files in os.walk('.'):
        # Filtra subpastas em tempo real
        dirs[:] = [d for d in dirs if d not in PASTAS_IGNORADAS and not d.startswith('.')]

        if not deve_processar_pasta(root):
            continue

        for file in files:
            if file.endswith(EXTENSAO_ALVO) and file not in ARQUIVOS_IGNORADOS:
                filepath = os.path.join(root, file)
                
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()

                    # Verifica se Inter ou Nunito existem no arquivo (para não processar arquivos de idiomas orientais à toa)
                    if 'font-family:\'Inter\'' in content or 'font-family:"Inter"' in content or 'font-family:\'Nunito Sans\'' in content or 'font-family:"Nunito Sans"' in content:
                        
                        # Aplica as substituições
                        novo_conteudo = regex_inter.sub(r"\1;size-adjust:98%\2", content)
                        novo_conteudo = regex_nunito.sub(r"\1;size-adjust:102%\2", novo_conteudo)

                        if novo_conteudo != content:
                            with open(filepath, 'w', encoding='utf-8') as f:
                                f.write(novo_conteudo)
                            arquivos_modificados += 1
                        else:
                            # A fonte existe, mas o regex não alterou nada, sinalizando que a trava de duplicidade agiu (já tem size-adjust)
                            arquivos_ja_atualizados += 1
                    else:
                        # Arquivo html em idioma que não usa Inter ou Nunito (ex: só chinês ou árabe)
                        arquivos_ignorados += 1
                        
                except Exception as e:
                    print(f"ERRO: Não foi possível processar o arquivo {filepath}: {e}")
                    arquivos_ignorados += 1

    # Log Final Formatado
    print("-" * 65)
    print("RESUMO DA AVALIAÇÃO E EXECUÇÃO:")
    print(f" [✓] Arquivos modificados (size-adjust inserido) : {arquivos_modificados}")
    print(f" [-] Arquivos já corretos (já possuíam o ajuste) : {arquivos_ja_atualizados}")
    print(f" [!] Arquivos ignorados (outras fontes de idiomas): {arquivos_ignorados}")
    print("-" * 65)
    print("Processo concluído com segurança.\n")

if __name__ == '__main__':
    iniciar_scan()