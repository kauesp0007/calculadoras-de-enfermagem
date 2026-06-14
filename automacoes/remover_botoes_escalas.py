import os
import re

# Lista exata das pastas de idiomas
DIRETORIOS = [
    ".", "en", "es", "de", "it", "fr", "hi", "zh", "ar", "ja", 
    "ru", "ko", "tr", "nl", "pl", "sv", "id", "vi", "uk"
]

# Lista de arquivos a serem ignorados
ARQUIVOS_IGNORADOS = [
    "footer.html", "menu-global.html", "global-body-elements.html", 
    "downloads.html", "menu-lateral.html", "_language_selector.html", 
    "googlefc0a17cdd552164b.html", "downloads.template.html", 
    "item.template.html", "index.template.html", "post.template.html"
]

# Dicionário inteligente para não quebrar a localização da palavra "Calcular"
TRADUCOES_CALCULAR = {
    ".": "Calcular",
    "en": "Calculate",
    "es": "Calcular",
    "fr": "Calculer",
    "it": "Calcola",
    "de": "Berechnen",
    "hi": "गणना करें",
    "zh": "计算",
    "ja": "計算する",
    "ru": "Рассчитать",
    "ko": "계산하기",
    "tr": "Hesapla",
    "nl": "Berekenen",
    "pl": "Oblicz",
    "sv": "Beräkna",
    "id": "Hitung",
    "vi": "Tính toán",
    "uk": "Розрахувати",
    "ar": "احسب"
}

# -------------------------------------------------------------------
# PARSER INTELIGENTE: Função para remover blocos completos de JavaScript
# Ele conta as chaves '{' e '}' para não quebrar códigos aninhados
# -------------------------------------------------------------------
def remover_bloco_js(html, gatilho_inicio):
    start_idx = html.find(gatilho_inicio)
    while start_idx != -1:
        # Volta um pouco para remover os espaços/tabs antes da linha do gatilho
        while start_idx > 0 and html[start_idx - 1] in [' ', '\t']:
            start_idx -= 1
        if start_idx > 0 and html[start_idx - 1] == '\n':
            start_idx -= 1

        brace_idx = html.find('{', start_idx)
        if brace_idx == -1:
            break
            
        brace_count = 1
        current_idx = brace_idx + 1
        
        # Conta a abertura e fechamento de chaves
        while brace_count > 0 and current_idx < len(html):
            if html[current_idx] == '{':
                brace_count += 1
            elif html[current_idx] == '}':
                brace_count -= 1
            current_idx += 1
            
        end_idx = current_idx
        
        # Consome os espaços em branco e o ');' de fechamento
        while end_idx < len(html) and html[end_idx] in [' ', '\n', '\r', '\t']:
            end_idx += 1
        if html[end_idx:end_idx+2] == ');':
            end_idx += 2
        elif html[end_idx:end_idx+1] == ')':
            end_idx += 1
            if end_idx < len(html) and html[end_idx] == ';':
                end_idx += 1
                
        # Fatiar e remover o bloco
        html = html[:start_idx] + html[end_idx:]
        
        # Procura se ainda há outro bloco na mesma página
        start_idx = html.find(gatilho_inicio)
        
    return html

arquivos_alterados = 0
arquivos_intactos = 0
log_detalhado = []

print("Iniciando a cirurgia completa: HTML e JavaScript (PDF e NANDA)...")

for diretorio in DIRETORIOS:
    if not os.path.exists(diretorio):
        continue
        
    # Identifica a palavra "Calcular" correta para a pasta atual
    palavra_calcular = TRADUCOES_CALCULAR.get(diretorio, "Calcular")

    for arquivo in os.listdir(diretorio):
        if not arquivo.endswith(".html") or arquivo in ARQUIVOS_IGNORADOS:
            continue

        caminho = os.path.join(diretorio, arquivo)

        try:
            with open(caminho, "r", encoding="utf-8") as f:
                html = f.read()

            html_original = html

            # =========================================================
            # FASE 1: REMOÇÃO DO HTML
            # =========================================================
            
            # Remove completamente os botões
            html = re.sub(r'\s*<button[^>]*id=["\']btnGerarPDF["\'][^>]*>.*?</button>', '', html, flags=re.IGNORECASE | re.DOTALL)
            html = re.sub(r'\s*<button[^>]*id=["\']btnNandaNicNoc["\'][^>]*>.*?</button>', '', html, flags=re.IGNORECASE | re.DOTALL)

            # Padroniza o conteúdo de texto do botão Calcular
            def padronizar_btn_calcular(match):
                abertura_tag = match.group(1) 
                fechamento_tag = match.group(3) 
                return f"{abertura_tag}\n          {palavra_calcular}\n        {fechamento_tag}"

            html = re.sub(r'(<button[^>]*id=["\']btnCalcular["\'][^>]*>)(.*?)(</button>)', padronizar_btn_calcular, html, flags=re.IGNORECASE | re.DOTALL)


            # =========================================================
            # FASE 2: REMOÇÃO DA LÓGICA E VARIÁVEIS DO JAVASCRIPT
            # =========================================================
            
            # Remove as declarações de variáveis do JS (ex: const btnGerarPDF = document.getElementById...)
            html = re.sub(r'\s*(const|let|var)\s+btnGerarPDF\s*=\s*document\.getElementById\(["\']btnGerarPDF["\']\);?', '', html)
            html = re.sub(r'\s*(const|let|var)\s+btnNandaNicNoc\s*=\s*document\.getElementById\(["\']btnNandaNicNoc["\']\);?', '', html)

            # Remove os Blocos complexos inteiros usando o nosso Parser Seguro
            html = remover_bloco_js(html, "btnGerarPDF?.addEventListener")
            html = remover_bloco_js(html, "btnGerarPDF.addEventListener")
            html = remover_bloco_js(html, "btnNandaNicNoc?.addEventListener")
            html = remover_bloco_js(html, "btnNandaNicNoc.addEventListener")

            # Salva o arquivo apenas se alguma alteração foi feita
            if html != html_original:
                with open(caminho, "w", encoding="utf-8") as f:
                    f.write(html)
                arquivos_alterados += 1
                log_detalhado.append(f"[OTIMIZADO] {caminho} -> HTML limpo e Scripts nativos do PDF/NANDA deletados.")
            else:
                arquivos_intactos += 1

        except Exception as e:
            log_detalhado.append(f"[ERRO] Falha ao processar {caminho}: {e}")

# Geração de Log detalhado
caminho_log = "log_limpeza_botoes_e_scripts.txt"
with open(caminho_log, "w", encoding="utf-8") as log:
    log.write("======================================================================\n")
    log.write("      RELATÓRIO DE LIMPEZA DE BOTÕES E LÓGICA JS DAS ESCALAS          \n")
    log.write("======================================================================\n\n")
    log.write(f"Total de arquivos de escalas otimizados: {arquivos_alterados}\n")
    log.write(f"Total de arquivos ignorados (não eram escalas): {arquivos_intactos}\n\n")
    log.write("Detalhamento por arquivo modificado:\n")
    log.write("----------------------------------------------------------------------\n")
    for linha in log_detalhado:
        log.write(f"{linha}\n")

print("\n==========================================")
print("Limpeza HTML e Cirurgia no JavaScript concluídas com sucesso!")
print(f"Escalas otimizadas em massa: {arquivos_alterados}")
print(f"O log de alterações foi salvo em: {os.path.abspath(caminho_log)}")
print("==========================================")