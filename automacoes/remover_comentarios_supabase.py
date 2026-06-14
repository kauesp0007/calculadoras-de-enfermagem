import os
import re

# Lista exata das pastas de idiomas
DIRETORIOS = [
    ".", "en", "es", "de", "it", "fr", "hi", "zh", "ar", "ja", 
    "ru", "ko", "tr", "nl", "pl", "sv", "id", "vi", "uk"
]

# Lista de arquivos a serem ignorados (INCLUINDO O FÓRUM)
ARQUIVOS_IGNORADOS = [
    "footer.html", "menu-global.html", "global-body-elements.html", 
    "downloads.html", "menu-lateral.html", "_language_selector.html", 
    "googlefc0a17cdd552164b.html", "downloads.template.html", 
    "item.template.html", "index.template.html", "post.template.html",
    "forum-enfermagem.html" # PROTEGIDO: O fórum mantém a seção de comentários intacta
]

arquivos_alterados = 0
arquivos_intactos = 0
log_detalhado = []

print("Iniciando a remoção cirúrgica do Supabase e caixas de comentários...")

for diretorio in DIRETORIOS:
    if not os.path.exists(diretorio):
        continue

    for arquivo in os.listdir(diretorio):
        if not arquivo.endswith(".html") or arquivo in ARQUIVOS_IGNORADOS:
            continue

        caminho = os.path.join(diretorio, arquivo)

        try:
            with open(caminho, "r", encoding="utf-8") as f:
                html = f.read()

            html_original = html

            # 1. Remover scripts que contêm lógicas e chaves do Supabase
            def remover_scripts_supabase(match):
                conteudo = match.group(0)
                # Verifica se o bloco de script contém URLs ou variáveis exclusivas da lógica do Supabase
                if "SUPABASE_URL" in conteudo or "supabase.co" in conteudo.lower():
                    return ""
                return conteudo
            
            html = re.sub(r'<script[^>]*>.*?</script>', remover_scripts_supabase, html, flags=re.IGNORECASE | re.DOTALL)

            # 2. Remover a seção visual do HTML da caixa de comentários
            html = re.sub(r'<section[^>]*id=["\']page-comments["\'][^>]*>.*?</section>', '', html, flags=re.IGNORECASE | re.DOTALL)

            # 3. Limpeza estética (Remoção dos comentários do desenvolvedor deixados no HTML)
            html = re.sub(r'<!--\s*Supabase \(cliente\)\s*-->', '', html, flags=re.IGNORECASE)
            html = re.sub(r'<!--\s*Comentários da Página \(Supabase\) - SEM MODERAÇÃO\s*-->', '', html, flags=re.IGNORECASE)
            html = re.sub(r'<!-- =+[\s\S]*?COMENTÁRIOS DA PÁGINA[\s\S]*?=+ -->', '', html, flags=re.IGNORECASE)
            html = re.sub(r'<!-- =+[\s\S]*?COMENTÁRIOS COMPACTOS[\s\S]*?=+ -->', '', html, flags=re.IGNORECASE)
            
            # 4. Remove espaços vazios excessivos que possam ter ficado após a deleção dos blocos
            html = re.sub(r'\n\s*\n\s*\n+', '\n\n', html)

            # Salva apenas se o arquivo realmente foi modificado
            if html != html_original:
                with open(caminho, "w", encoding="utf-8") as f:
                    f.write(html)
                arquivos_alterados += 1
                log_detalhado.append(f"[LIMPO] {caminho} -> Comentários Supabase removidos.")
            else:
                arquivos_intactos += 1

        except Exception as e:
            log_detalhado.append(f"[ERRO] Falha ao processar {caminho}: {e}")

# Gerar Log
caminho_log = "log_remocao_supabase.txt"
with open(caminho_log, "w", encoding="utf-8") as log:
    log.write("======================================================================\n")
    log.write("      RELATÓRIO DE REMOÇÃO DE COMENTÁRIOS SUPABASE EM MASSA           \n")
    log.write("======================================================================\n\n")
    log.write(f"Total de arquivos otimizados: {arquivos_alterados}\n")
    log.write(f"Total de arquivos ignorados (intactos ou fórum protegido): {arquivos_intactos}\n\n")
    log.write("Detalhamento por arquivo:\n")
    log.write("----------------------------------------------------------------------\n")
    for linha in log_detalhado:
        log.write(f"{linha}\n")

print("\n==========================================")
print("Limpeza do Supabase concluída com sucesso!")
print(f"Arquivos processados e salvos: {arquivos_alterados}")
print(f"O log de alterações foi salvo em: {os.path.abspath(caminho_log)}")
print("==========================================")