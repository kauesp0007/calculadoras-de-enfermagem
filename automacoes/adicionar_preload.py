# Complete, well-commented, runnable code for this single file
import os
import re

# =====================================================================
# CONFIGURAÇÕES DE DIRETÓRIO E EXCLUSÕES
# =====================================================================
# Diretório raiz onde o script vai começar a procurar os arquivos HTML
DIRETORIO_RAIZ = '.' # '.' significa a pasta atual onde o script está rodando

# Pastas que o script NUNCA deve entrar (ex: repositórios, pastas de build, etc)
PASTAS_PROIBIDAS = {
    '.git',
    '.github',
    'node_modules',
    'locales', # Ignora a pasta com os JSONs de tradução
    'fonts',   # Ignora as fontes (Inter, Nunito, etc)
    'css',     # Opcional: ganha velocidade ignorando pastas não-HTML
    'js',
    'assets',
    'images',
    'img',
    'downloads',
    'blog-templates',
    'blog,',
    'locales',
    'biblioteca'
}

# Ficheiros HTML modulares que NÃO devem receber a tag (fragmentos sem <head>)
ARQUIVOS_PROIBIDOS = {
    'menu-global.html',
    'global-body-elements.html',
    'footer-placeholder.html',
    'cookie-banner.html',
    'language-selector.html',
    'downloads.html'
}

# A tag que queremos injetar no mobile/desktop
TAG_PRELOAD = '    <link rel="preload" href="https://www.calculadorasdeenfermagem.com.br/icontopbar1-calculadoras-de-enfermagem.webp" as="image" type="image/webp" fetchpriority="high">\n'

def injetar_preload():
    arquivos_modificados = 0
    arquivos_ignorados = 0
    arquivos_com_erro = 0

    print("🚀 Iniciando a varredura e injeção do Preload de LCP...")

    # Percorre todas as pastas e arquivos a partir do DIRETORIO_RAIZ
    for pasta_atual, sub_pastas, arquivos in os.walk(DIRETORIO_RAIZ):
        
        # Modifica a lista sub_pastas 'in-place' para o os.walk não entrar nas proibidas
        sub_pastas[:] = [d for d in sub_pastas if d not in PASTAS_PROIBIDAS]

        for arquivo in arquivos:
            # Só processa arquivos com extensão .html
            if not arquivo.endswith('.html'):
                continue

            # Pula os arquivos que estão na lista de proibidos
            if arquivo in ARQUIVOS_PROIBIDOS:
                arquivos_ignorados += 1
                continue

            caminho_completo = os.path.join(pasta_atual, arquivo)

            try:
                with open(caminho_completo, 'r', encoding='utf-8') as f:
                    conteudo = f.read()

                # Verifica se a tag (ou o link da imagem) já existe para evitar duplicação
                if "icontopbar1-calculadoras-de-enfermagem.webp" in conteudo and "rel=\"preload\"" in conteudo:
                    arquivos_ignorados += 1
                    continue

                # Verifica se o arquivo tem a tag <head> (essencial para injetar o preload)
                if '<head' not in conteudo.lower():
                    print(f"⚠️ Aviso: Nenhuma tag <head> encontrada em {caminho_completo}. Ignorando.")
                    arquivos_ignorados += 1
                    continue

                # Expressão regular para encontrar a tag <head> (lidando com atributos como <head lang="pt">)
                # O r'\1\n' mantém a tag <head> original e adiciona a nossa tag na linha de baixo
                novo_conteudo = re.sub(
                    r'(<head[^>]*>)', 
                    r'\1\n' + TAG_PRELOAD, 
                    conteudo, 
                    count=1, 
                    flags=re.IGNORECASE
                )

                # Salva o arquivo modificado com a nova formatação
                with open(caminho_completo, 'w', encoding='utf-8') as f:
                    f.write(novo_conteudo)
                
                arquivos_modificados += 1

            except Exception as e:
                print(f"❌ Erro ao processar {caminho_completo}: {e}")
                arquivos_com_erro += 1

    print("\n" + "="*50)
    print("🎯 RELATÓRIO FINAL DE EXECUÇÃO")
    print("="*50)
    print(f"✅ Arquivos atualizados com sucesso: {arquivos_modificados}")
    print(f"⏭️  Arquivos ignorados (já tinham ou proibidos): {arquivos_ignorados}")
    print(f"❌ Erros de leitura/escrita: {arquivos_com_erro}")
    print("="*50)

if __name__ == "__main__":
    injetar_preload()