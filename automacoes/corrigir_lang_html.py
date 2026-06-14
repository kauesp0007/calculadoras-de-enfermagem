import os
import re

# Lista exata das suas pastas
DIRETORIOS = [
    ".", "en", "es", "de", "it", "fr", "hi", "zh", "ar", "ja", 
    "ru", "ko", "tr", "nl", "pl", "sv", "id", "vi", "uk"
]

# Dicionário de Mapeamento (Idioma minúsculo - PAÍS Maiúsculo)
MAPA_IDIOMAS = {
    ".": "pt-BR",    # Raiz é Brasil
    "en": "en-US",   # Inglês (Estados Unidos)
    "es": "es-ES",   # Espanhol (Espanha)
    "de": "de-DE",   # Alemão (Alemanha)
    "it": "it-IT",   # Italiano (Itália)
    "fr": "fr-FR",   # Francês (França)
    "hi": "hi-IN",   # Hindi (Índia)
    "zh": "zh-CN",   # Chinês Simplificado (China)
    "ar": "ar-SA",   # Árabe (Arábia Saudita)
    "ja": "ja-JP",   # Japonês (Japão)
    "ru": "ru-RU",   # Russo (Rússia)
    "ko": "ko-KR",   # Coreano (Coreia do Sul)
    "tr": "tr-TR",   # Turco (Turquia)
    "nl": "nl-NL",   # Holandês (Holanda)
    "pl": "pl-PL",   # Polonês (Polônia)
    "sv": "sv-SE",   # Sueco (Suécia)
    "id": "id-ID",   # Indonésio (Indonésia)
    "vi": "vi-VN",   # Vietnamita (Vietnã)
    "uk": "uk-UA"    # Ucraniano (Ucrânia)
}

arquivos_alterados = 0
arquivos_intactos = 0
log_detalhado = []

print("Iniciando a padronização cirúrgica da tag <html lang=\"...\">...")

for diretorio in DIRETORIOS:
    if not os.path.exists(diretorio):
        continue
        
    # Pega o idioma oficial que deveria estar nessa pasta
    lang_correta = MAPA_IDIOMAS.get(diretorio, "pt-BR")

    for arquivo in os.listdir(diretorio):
        if not arquivo.endswith(".html"):
            continue

        caminho = os.path.join(diretorio, arquivo)

        try:
            with open(caminho, "r", encoding="utf-8") as f:
                html = f.read()

            # Regex cirúrgica: Procura EXATAMENTE a tag <html ... lang="ALGO" ...>
            # Preserva tudo o que vem antes da aspa, o que está na aspa, e tudo o que vem depois
            padrao_lang = re.compile(r'(<html[^>]*lang\s*=\s*["\'])([^"\']*)(["\'][^>]*>)', re.IGNORECASE)
            
            # Encapsulamos a lógica numa função para que 'nonlocal' encontre a variável no escopo correto
            def processar_html(texto_html, idioma_alvo):
                teve_mudanca = False
                
                def replacer(match):
                    nonlocal teve_mudanca
                    prefixo = match.group(1)      # ex: <html lang="
                    lang_atual = match.group(2)   # ex: es ou Es-es
                    sufixo = match.group(3)       # ex: ">
                    
                    # Se o que está escrito no arquivo for diferente do padrão oficial, substitui
                    if lang_atual != idioma_alvo:
                        teve_mudanca = True
                        return f"{prefixo}{idioma_alvo}{sufixo}"
                    return match.group(0) # Retorna intacto se já estiver perfeito

                novo_texto = padrao_lang.sub(replacer, texto_html)
                return novo_texto, teve_mudanca

            # Executa a substituição encapsulada
            novo_html, modificado = processar_html(html, lang_correta)

            if modificado:
                with open(caminho, "w", encoding="utf-8") as f:
                    f.write(novo_html)
                arquivos_alterados += 1
                log_detalhado.append(f"[CORRIGIDO] {caminho} -> Atualizado para lang=\"{lang_correta}\"")
            else:
                arquivos_intactos += 1

        except Exception as e:
            log_detalhado.append(f"[ERRO] {caminho}: {e}")

# Geração de Log
caminho_log = "log_html_lang.txt"
with open(caminho_log, "w", encoding="utf-8") as log:
    log.write("======================================================================\n")
    log.write("         RELATÓRIO DE PADRONIZAÇÃO DA TAG <HTML LANG>                 \n")
    log.write("======================================================================\n\n")
    log.write(f"Total de arquivos corrigidos: {arquivos_alterados}\n")
    log.write(f"Total de arquivos já padronizados (Intactos): {arquivos_intactos}\n\n")
    log.write("Detalhamento por arquivo modificado:\n")
    log.write("----------------------------------------------------------------------\n")
    for linha in log_detalhado:
        log.write(f"{linha}\n")

print("\n==========================================")
print("Padronização do <html lang> concluída!")
print(f"Arquivos que receberam o novo padrão: {arquivos_alterados}")
print(f"Arquivos que já estavam corretos: {arquivos_intactos}")
print(f"O log de alterações foi salvo em: {os.path.abspath(caminho_log)}")
print("==========================================")