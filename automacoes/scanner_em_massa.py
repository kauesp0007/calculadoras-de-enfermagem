import os
import re

# 1. Whitelist Estrita: O script SÓ PODE abrir a raiz (.) e as exatas 18 pastas de idiomas.
# Ele jamais entrará em node_modules, css, js, img, etc.
diretorios_permitidos = [
    ".", "en", "es", "de", "it", "fr", "hi", "zh", "ar", "ja", 
    "ru", "ko", "tr", "nl", "pl", "sv", "id", "vi", "uk"
]

mapa_idiomas_tags = {
    ".": "pt-BR", "en": "en", "es": "es", "de": "de", "it": "it", 
    "fr": "fr", "hi": "hi", "zh": "zh", "ar": "ar", "ja": "ja", 
    "ru": "ru", "ko": "ko", "tr": "tr", "nl": "nl", "pl": "pl", 
    "sv": "sv", "id": "id", "vi": "vi", "uk": "uk"
}

# Bloqueio de arquivos modulares e templates
arquivos_ignoradas = [
    "footer.html", 
    "menu-global.html", 
    "global-body-elements.html", 
    "downloads.html", 
    "menu-lateral.html", 
    "_language_selector.html", 
    "googlefc0a17cdd552164b.html",
    "downloads.template.html",
    "item.template.html",
    "index.template.html",
    "post.template.html"
]

registro_global_paginas = {}

print("Fase 1: Mapeamento estrito e exclusivo das pastas autorizadas...")

# FASE 1: Varredura Plana (sem os.walk recursivo para evitar subpastas ocultas)
for dir_permitido in diretorios_permitidos:
    if not os.path.exists(dir_permitido):
        continue
        
    tag_hreflang_atual = mapa_idiomas_tags[dir_permitido]
    
    for arquivo in os.listdir(dir_permitido):
        if arquivo.endswith(".html") and arquivo not in arquivos_ignoradas:
            caminho_completo = os.path.join(dir_permitido, arquivo)
            if os.path.isfile(caminho_completo):
                if arquivo not in registro_global_paginas:
                    registro_global_paginas[arquivo] = []
                registro_global_paginas[arquivo].append(tag_hreflang_atual)

print("Fase 2: Leitura direta de texto bruto para preservação total do código...")

arquivos_alterados = 0
arquivos_nao_alterados = 0
log_detalhado = []

# FASE 2: Modificação focada apenas nas linhas contendo "hreflang"
for dir_permitido in diretorios_permitidos:
    if not os.path.exists(dir_permitido):
        continue
        
    for arquivo in os.listdir(dir_permitido):
        if arquivo.endswith(".html") and arquivo not in arquivos_ignoradas:
            caminho_completo = os.path.join(dir_permitido, arquivo)
            if not os.path.isfile(caminho_completo):
                continue

            idiomas_validos = registro_global_paginas.get(arquivo, [])
            idiomas_validos_lower = [idioma.lower() for idioma in idiomas_validos]
            
            try:
                # Leitura em formato de lista de texto (ignora o motor do BeautifulSoup)
                with open(caminho_completo, "r", encoding="utf-8") as f:
                    linhas = f.readlines()
                
                novas_linhas = []
                fez_alteracao = False
                tags_removidas = []
                
                for linha in linhas:
                    # Isola estritamente a linha do HTML que contém a tag alternate
                    if '<link' in linha and 'rel="alternate"' in linha and 'hreflang=' in linha:
                        # Extrai via Regex a sigla do idioma atual daquela linha
                        match = re.search(r'hreflang=["\']([^"\']+)["\']', linha, re.IGNORECASE)
                        if match:
                            val_original = match.group(1)
                            val_lower = val_original.lower()
                            
                            # REGRA 1: Blindagem Absoluta do Português + Padronização W3C
                            if val_lower in ['pt', 'pt-br']:
                                if val_original != 'pt-BR':
                                    # Se encontrar pt ou pt-br, transforma em pt-BR e mantém a linha intocável
                                    linha = re.sub(r'(hreflang=["\'])[^"\']+([\'"])', r'\g<1>pt-BR\g<2>', linha, flags=re.IGNORECASE)
                                    fez_alteracao = True
                                    log_detalhado.append(f"[PADRONIZADO] {caminho_completo} | {val_original} corrigido para pt-BR")
                                novas_linhas.append(linha)
                                continue # Impede que passe pela regra de exclusão
                            
                            # REGRA 2: Preservar o x-default no final
                            if val_lower == "x-default":
                                novas_linhas.append(linha)
                                continue
                                
                            # REGRA 3: Preservar a linha se o idioma possuir tradução mapeada
                            if val_lower in idiomas_validos_lower:
                                novas_linhas.append(linha)
                                continue
                            
                            # REGRA 4: Se chegou aqui, é um idioma sem tradução. A exclusão é feita ignorando a linha (não adicionando à nova lista)
                            tags_removidas.append(val_original)
                            fez_alteracao = True
                            continue # Pula a linha órfã, excluindo-a do arquivo final

                    # Qualquer outra linha do documento (body, inputs, scripts) passa ilesa e idêntica
                    novas_linhas.append(linha)
                    
                if fez_alteracao:
                    # Salva as linhas exatamente na mesma estrutura (espaçamento/indentação) original
                    with open(caminho_completo, "w", encoding="utf-8") as f:
                        f.writelines(novas_linhas)
                    arquivos_alterados += 1
                    if tags_removidas:
                        log_detalhado.append(f"[REMOVIDO] {caminho_completo} | Órfãos excluídos: {', '.join(tags_removidas)}")
                else:
                    arquivos_nao_alterados += 1
                    
            except Exception as e:
                log_detalhado.append(f"[ERRO] {caminho_completo} | Falha no processo: {e}")

# GERAÇÃO DO LOG
caminho_log = "log_limpeza_hreflang.txt"
with open(caminho_log, "w", encoding="utf-8") as log:
    log.write("======================================================================\n")
    log.write("      RELATÓRIO DE LIMPEZA E PADRONIZAÇÃO DE HREFLANG         \n")
    log.write("======================================================================\n\n")
    log.write(f"Total de arquivos com intervenção: {arquivos_alterados}\n")
    log.write(f"Total de arquivos já corretos/intactos: {arquivos_nao_alterados}\n\n")
    log.write("Detalhamento por arquivo modificado:\n")
    log.write("----------------------------------------------------------------------\n")
    for linha in log_detalhado:
        log.write(f"{linha}\n")

print("\n==========================================")
print("Correção das tags e padronização concluídas com segurança!")
print(f"Arquivos que sofreram ajustes: {arquivos_alterados}")
print(f"Arquivos perfeitamente intactos: {arquivos_nao_alterados}")
print(f"O log seguro foi salvo em: {os.path.abspath(caminho_log)}")
print("==========================================")