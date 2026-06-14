import os
from bs4 import BeautifulSoup

def preparar_html_para_traducao(caminho_arquivo, idioma_alvo):
    """
    Prepara o HTML para tradução:
    - Converte caminhos de imagens para absoluto (/img/).
    - Reordena as tags hreflang para iniciar pelo idioma_alvo.
    """
    print(f"Lendo o arquivo: {caminho_arquivo} para o idioma: {idioma_alvo}")
    with open(caminho_arquivo, 'r', encoding='utf-8') as f:
        html_conteudo = f.read()

    soup = BeautifulSoup(html_conteudo, 'html.parser')

    # 1. AJUSTAR CAMINHOS DE IMAGENS PARA ABSOLUTO
    imagens_ajustadas = 0
    for img in soup.find_all('img'):
        if img.has_attr('src'):
            src_atual = img['src']
            nome_arquivo = os.path.basename(src_atual)
            novo_caminho = f"/img/{nome_arquivo}"
            
            if src_atual != novo_caminho:
                img['src'] = novo_caminho
                imagens_ajustadas += 1

    print(f"[{imagens_ajustadas}] Caminhos de imagens ajustados para /img/.")

    # 2. REORDENAR TAGS HREFLANG
    head = soup.find('head')
    if head:
        tags_hreflang = head.find_all('link', rel='alternate', hreflang=True)
        if tags_hreflang:
            # Remove as tags atuais do head para reinseri-las na ordem correta
            for tag in tags_hreflang:
                tag.extract()
            
            # Separa a tag do idioma alvo das demais
            tag_principal = None
            outras_tags = []
            
            for tag in tags_hreflang:
                # O idioma pode estar no formato 'en' ou 'en-US', pegamos os primeiros caracteres
                if tag['hreflang'].startswith(idioma_alvo):
                    tag_principal = tag
                else:
                    outras_tags.append(tag)
            
            # Reinsere no head: primeiro o idioma alvo, depois o resto
            if tag_principal:
                head.append(tag_principal)
            for tag in outras_tags:
                head.append(tag)
                
            print("Tags hreflang reordenadas com sucesso.")

    return soup

# Bloco de execução
if __name__ == "__main__":
    # Teste prático do script atualizado
    # Coloque o caminho de um arquivo real e o código do idioma alvo (ex: 'en', 'es', 'fr')
    arquivo_teste = "exames_laboratoriais.html" 
    idioma_teste = "en"
    
    # Se o arquivo não existir, o script avisa sem quebrar
    if os.path.exists(arquivo_teste):
        print("\nIniciando preparação do HTML...")
        soup_preparado = preparar_html_para_traducao(arquivo_teste, idioma_teste)
        
        # Mostra as tags hreflang resultantes para conferência
        print("\n--- CONFERÊNCIA DAS TAGS HREFLANG ---")
        head = soup_preparado.find('head')
        if head:
            for link in head.find_all('link', rel='alternate', hreflang=True):
                print(link)
    else:
        print(f"Atenção: Configure um arquivo válido na variável 'arquivo_teste' na linha 56.")