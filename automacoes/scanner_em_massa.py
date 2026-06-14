import os
import re

# 1. Whitelist Estrita de Diretórios
diretorios_permitidos = [
    ".", "en", "es", "de", "it", "fr", "hi", "zh", "ar", "ja", 
    "ru", "ko", "tr", "nl", "pl", "sv", "id", "vi", "uk"
]

# Mapa para descobrir qual é o idioma "dono" da pasta atual
mapa_idiomas_tags = {
    ".": "pt-BR", "en": "en", "es": "es", "de": "de", "it": "it", 
    "fr": "fr", "hi": "hi", "zh": "zh", "ar": "ar", "ja": "ja", 
    "ru": "ru", "ko": "ko", "tr": "tr", "nl": "nl", "pl": "pl", 
    "sv": "sv", "id": "id", "vi": "vi", "uk": "uk"
}

# Bloqueio de arquivos modulares
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

print("Iniciando a reordenação cirúrgica das tags hreflang...")

arquivos_alterados = 0
arquivos_nao_alterados = 0
log_detalhado = []

for dir_permitido in diretorios_permitidos:
    if not os.path.exists(dir_permitido):
        continue
        
    # Identifica o idioma alvo baseado na pasta em que o script está iterando
    idioma_alvo = mapa_idiomas_tags[dir_permitido]
    
    for arquivo in os.listdir(dir_permitido):
        if arquivo.endswith(".html") and arquivo not in arquivos_ignoradas:
            caminho_completo = os.path.join(dir_permitido, arquivo)
            if not os.path.isfile(caminho_completo):
                continue

            try:
                # Leitura bruta linha a linha
                with open(caminho_completo, "r", encoding="utf-8") as f:
                    linhas = f.readlines()
                
                linhas_sem_hreflang = []
                bloco_hreflang = []
                indice_insercao = -1
                
                for linha in linhas:
                    # Captura apenas as linhas de hreflang
                    if '<link' in linha and 'rel="alternate"' in linha and 'hreflang=' in linha:
                        # Guarda a posição exata de onde o bloco de hreflang começou no HTML
                        if indice_insercao == -1:
                            indice_insercao = len(linhas_sem_hreflang) 
                        
                        # Extrai a sigla do idioma para saber quem é quem
                        match = re.search(r'hreflang=["\']([^"\']+)["\']', linha, re.IGNORECASE)
                        idioma_linha = match.group(1).lower() if match else ""
                        
                        bloco_hreflang.append({
                            'linha_completa': linha,
                            'idioma': idioma_linha
                        })
                    else:
                        # Tudo que não é hreflang vai para a lista de preservação intacta
                        linhas_sem_hreflang.append(linha)
                
                # Só prossegue se encontrou tags suficientes para reordenar
                if len(bloco_hreflang) > 1:
                    ordem_original = [item['idioma'] for item in bloco_hreflang]
                    
                    linhas_alvo = []
                    linhas_xdefault = []
                    linhas_meio = []
                    
                    # Separa o dono da página, o x-default e o resto
                    for item in bloco_hreflang:
                        if item['idioma'] == idioma_alvo.lower():
                            linhas_alvo.append(item)
                        elif item['idioma'] == "x-default":
                            linhas_xdefault.append(item)
                        else:
                            linhas_meio.append(item)
                            
                    # Constrói o novo bloco na ordem perfeita exigida
                    bloco_hreflang_ordenado = linhas_alvo + linhas_meio + linhas_xdefault
                    ordem_nova = [item['idioma'] for item in bloco_hreflang_ordenado]
                    
                    # Se a ordem precisou ser alterada, aplica e salva
                    if ordem_original != ordem_nova:
                        # Reinsere as linhas ordenadas exatamente no mesmo buraco de onde saíram
                        for item in reversed(bloco_hreflang_ordenado):
                            linhas_sem_hreflang.insert(indice_insercao, item['linha_completa'])
                        
                        with open(caminho_completo, "w", encoding="utf-8") as f:
                            f.writelines(linhas_sem_hreflang)
                            
                        arquivos_alterados += 1
                        log_detalhado.append(f"[REORDENADO] {caminho_completo} | Nova ordem: {', '.join(ordem_nova)}")
                    else:
                        arquivos_nao_alterados += 1
                        log_detalhado.append(f"[OK] {caminho_completo} | A ordem já estava perfeita.")
                else:
                    arquivos_nao_alterados += 1
                    
            except Exception as e:
                log_detalhado.append(f"[ERRO] {caminho_completo} | Falha no processo: {e}")

# Geração do log transparente
caminho_log = "log_reordenacao_hreflang.txt"
with open(caminho_log, "w", encoding="utf-8") as log:
    log.write("======================================================================\n")
    log.write("         RELATÓRIO DE REORDENAÇÃO DE HREFLANG (SEO INTERNACIONAL)     \n")
    log.write("======================================================================\n\n")
    log.write(f"Total de arquivos com ordem corrigida: {arquivos_alterados}\n")
    log.write(f"Total de arquivos já corretos/intactos: {arquivos_nao_alterados}\n\n")
    log.write("Detalhamento por arquivo modificado:\n")
    log.write("----------------------------------------------------------------------\n")
    for linha in log_detalhado:
        # Registra apenas os modificados ou com erro para facilitar a sua leitura
        if "[REORDENADO]" in linha or "[ERRO]" in linha:
            log.write(f"{linha}\n")

print("\n==========================================")
print("Reordenação das tags concluída com total segurança!")
print(f"Arquivos que sofreram ajustes de ordem: {arquivos_alterados}")
print(f"Arquivos perfeitamente intactos: {arquivos_nao_alterados}")
print(f"O log de alterações foi salvo em: {os.path.abspath(caminho_log)}")
print("==========================================")