import os

# ==========================================
# PASSO 1: CONFIGURAÇÕES DE SEGURANÇA E ESCOPO
# ==========================================

# 1. Escopo de Atuação: Apenas as 18 pastas de idiomas permitidas
PASTAS_IDIOMAS = [
    'en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 
    'ja', 'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'
]

# 2. Pastas Ignoradas: Onde o script JAMAIS deve entrar
PASTAS_IGNORADAS = [
    'downloads', 'biblioteca', 'blog', 'blog-templates', 'locales', 'fonts'
]

# 3. Arquivos Ignorados: HTMLs de estrutura que NÃO devem ser alterados
ARQUIVOS_IGNORADOS = [
    'footer.html', 'menu-global.html', 'global-body-elements.html', 
    'downloads.html', 'menu-lateral.html', '_language_selector.html', 
    'googlefc0a17cdd552164b.html'
]

print("Passo 1 concluído: Regras de segurança definidas.")

# ==========================================
# PASSO 2: MOTOR DE VARREDURA E SUBSTITUIÇÃO
# ==========================================

arquivos_alterados = 0
arquivos_nao_alterados = 0

# String original presente nos HTMLs[cite: 1, 2]
texto_busca = "'/banco_nanda.json'"
# Nova string com o caminho absoluto para o banco em inglês
texto_substituicao = "'/banco_nanda_en.json'"

# Diretório raiz onde o script está sendo executado
diretorio_raiz = os.getcwd()

# Inicia a varredura restrita APENAS às pastas de idiomas
for pasta_idioma in PASTAS_IDIOMAS:
    caminho_pasta_idioma = os.path.join(diretorio_raiz, pasta_idioma)
    
    # Verifica se a pasta do idioma existe antes de entrar
    if not os.path.exists(caminho_pasta_idioma):
        continue
        
    for root, dirs, files in os.walk(caminho_pasta_idioma):
        
        # Filtro de segurança: remove as pastas ignoradas da varredura atual
        dirs[:] = [d for d in dirs if d not in PASTAS_IGNORADAS]
        
        for file in files:
            # Ignora arquivos não-HTML e arquivos da lista de proibidos
            if not file.endswith('.html') or file in ARQUIVOS_IGNORADOS:
                continue
                
            caminho_arquivo = os.path.join(root, file)
            
            # Abre o arquivo em modo leitura preservando os caracteres (utf-8)
            with open(caminho_arquivo, 'r', encoding='utf-8') as f:
                conteudo = f.read()
            
            # Checa se o arquivo utiliza a ferramenta NANDA em português
            if texto_busca in conteudo:
                # Realiza a troca para o banco em inglês
                novo_conteudo = conteudo.replace(texto_busca, texto_substituicao)
                
                # Abre o arquivo em modo escrita e salva a alteração
                with open(caminho_arquivo, 'w', encoding='utf-8') as f:
                    f.write(novo_conteudo)
                    
                arquivos_alterados += 1
            else:
                # Se for um HTML válido mas não usar o NANDA, ou já estiver alterado
                arquivos_nao_alterados += 1

print("Passo 2 concluído: Lógica de varredura inserida.")

# ==========================================
# PASSO 3: LOG OBRIGATÓRIO DE SAÍDA
# ==========================================

print("\n==========================================")
print("RELATÓRIO DE EXECUÇÃO: ATUALIZAÇÃO NANDA")
print("==========================================")
print(f"Arquivos que foram alterados: {arquivos_alterados}")
print(f"Arquivos que não precisaram ser alterados: {arquivos_nao_alterados}")
print("==========================================")
print("Processo finalizado com segurança.\n")