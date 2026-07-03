import os
import re

# Configuração da URL Base do site
URL_BASE = "https://www.calculadorasdeenfermagem.com.br/"

# 1. Arquivos de modularização, sistema ou templates que devem ser ignorados
ARQUIVOS_IGNORADOS = {
    "footer.html",
    "menu-global.html",
    "global-body-elements.html",
    "downloads.html",
    "menu-lateral.html",
    "_language_selector.html",
    "googlefc0a17cdd552164b.html",
    "item.template.html",
    "downloads.template.html"
}

# 2. Pastas do sistema, mídias ou templates que não devem ser varridas
PASTAS_IGNORADAS = {
    "downloads",
    "biblioteca",
    "blog",
    "blog-templates",
    "locales",
    "fonts",
    ".git",
    "node_modules",
    "img",
    "docs",
    "videos"
}

# 3. Diretórios de idiomas oficiais permitidos para busca
PASTAS_IDIOMAS = {
    "en", "es", "de", "it", "fr", "hi", "zh", "ar", "ja", 
    "ru", "ko", "tr", "nl", "pl", "sv", "id", "vi", "uk"
}

def extrair_titulo(caminho_completo):
    """Abre o HTML e captura o conteúdo da tag <title> de forma limpa."""
    try:
        with open(caminho_completo, "r", encoding="utf-8", errors="ignore") as f:
            conteudo = f.read()
            # Expressão regular para capturar o <title> ignorando maiúsculas/minúsculas e quebras de linha
            match = re.search(r"<title>(.*?)</title>", conteudo, re.IGNORECASE | re.DOTALL)
            if match:
                # Remove espaços duplos ou quebras de linha órfãs dentro do título
                return " ".join(match.group(1).split())
            return "Sem Título Definido"
    except Exception as e:
        return f"Erro de leitura: {str(e)}"

def executar_mapeamento():
    paginas_validas = []
    total_processados = 0
    total_ignorados = 0

    # --- FASE 1: Varrer arquivos HTML da Raiz do Repositório ---
    for item in os.listdir("."):
        if os.path.isfile(item) and item.endswith(".html"):
            if item in ARQUIVOS_IGNORADOS:
                total_ignorados += 1
                continue
            
            titulo = extrair_titulo(item)
            url_absoluta = f"{URL_BASE}{item}"
            
            paginas_validas.append({
                "nome_html": item,
                "titulo": titulo,
                "caminho_absoluto": url_absoluta
            })
            total_processados += 1

    # --- FASE 2: Varrer as pastas de idiomas permitidas ---
    for pasta in os.listdir("."):
        if os.path.isdir(pasta) and pasta in PASTAS_IDIOMAS:
            caminho_pasta = os.path.join(".", pasta)
            
            for raiz, dirs, arquivos in os.walk(caminho_pasta):
                # Ignorar subpastas não autorizadas se existirem
                dirs[:] = [d for d in dirs if d not in PASTAS_IGNORADAS]
                
                for arquivo in arquivos:
                    if arquivo.endswith(".html"):
                        if arquivo in ARQUIVOS_IGNORADOS:
                            total_ignorados += 1
                            continue
                        
                        caminho_completo = os.path.join(raiz, arquivo)
                        # Normaliza o caminho relativo padrão web (ex: en/index.html)
                        caminho_relativo = os.path.relpath(caminho_completo, ".").replace("\\", "/")
                        
                        titulo = extrair_titulo(caminho_completo)
                        url_absoluta = f"{URL_BASE}{caminho_relativo}"
                        
                        paginas_validas.append({
                            "nome_html": caminho_relativo,
                            "titulo": titulo,
                            "caminho_absoluto": url_absoluta
                        })
                        total_processados += 1

    # --- FASE 3: Gravação do Relatório ---
    nome_relatorio = "relatorio_paginas.txt"
    with open(nome_relatorio, "w", encoding="utf-8") as f:
        f.write("=== RELATÓRIO DE PÁGINAS WEB ATIVAS ===\n\n")
        for pag in paginas_validas:
            f.write(f"{pag['nome_html']} = {pag['titulo']} = {pag['caminho_absoluto']}\n")

    # --- FASE 4: Log no Terminal ---
    print("\n" + "="*50)
    print("=== AVALIAÇÃO DO AUTOMATIZADOR CONCLUÍDA ===")
    print("="*50)
    print(f"Número de arquivos alterados/identificados: {total_processados}")
    print(f"Número de arquivos que não precisaram ser alterados: {total_ignorados}")
    print(f"Relatório gerado com sucesso em: {os.path.abspath(nome_relatorio)}")
    print("="*50 + "\n")

if __name__ == "__main__":
    executar_mapeamento()