import os
import subprocess
from datetime import datetime
from dotenv import load_dotenv
import deepl
import re
import requests
import json
import time

# Carrega a chave do arquivo .env silenciosamente
load_dotenv()

CHAVE_API = os.getenv("DEEPL_API_KEY")
CHAVE_DEEPSEEK = os.getenv("DEEPSEEK_API_KEY")
if not CHAVE_API:
    raise ValueError("Chave da API não encontrada. Verifique se o arquivo .env existe e contém a DEEPL_API_KEY.")
if not CHAVE_DEEPSEEK:
    raise ValueError("Chave do DeepSeek não encontrada. Adicione DEEPSEEK_API_KEY no arquivo .env para traduzir os scripts dinâmicos.")

def traduzir_meta_seo_com_deepseek(html, idioma_alvo):
    """
    Isola os conteúdos das tags de SEO e traduz de forma independente usando o DeepSeek,
    garantindo adaptação cultural e de palavras-chave.
    """
    padrao_meta = re.compile(r'(<meta\s+(?:name|property)="(?:description|keywords|og:title|og:description)"\s+content=")([^"]+)("\s*/?>)', re.IGNORECASE)
    matches = list(padrao_meta.finditer(html))
    
    if not matches:
        return html
        
    # Extrai os textos em PT para um dicionário (JSON)
    dict_textos = {f"t{i}": m.group(2) for i, m in enumerate(matches)}
    
    instrucoes = f"""
    Você é um especialista em SEO internacional e localização na área da saúde/enfermagem.
    Traduza os valores num JSON do Português para o idioma com o código ISO '{idioma_alvo}'.
    
    REGRAS INEGOCIÁVEIS:
    1. Adapte os termos para as palavras-chave com maior volume de busca na enfermagem neste idioma alvo.
    2. NÃO modifique as chaves do JSON.
    3. RETORNE EXCLUSIVAMENTE UM JSON VÁLIDO. Sem explicações e sem marcações markdown.
    """
    
    # URL LIMPA: sem formatação de colchetes!
    url = "https://api.deepseek.com/chat/completions"
    headers = {
        "Authorization": f"Bearer {CHAVE_DEEPSEEK}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": instrucoes},
            {"role": "user", "content": json.dumps(dict_textos, ensure_ascii=False)}
        ],
        "temperature": 0.1,
        "response_format": {"type": "json_object"}
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=120)
        response.raise_for_status()
        resultado = response.json()["choices"][0]["message"]["content"].strip()
        
        # Limpeza caso deepseek envie markdown
        if resultado.startswith("```"):
            resultado = re.sub(r'^```(json)?\n', '', resultado, flags=re.IGNORECASE)
            resultado = re.sub(r'\n```$', '', resultado)
            
        traducoes = json.loads(resultado)
        
        # Substitui no HTML original (de trás para frente para não afetar os índices dos matches anteriores)
        html_modificado = html
        for i, m in reversed(list(enumerate(matches))):
            chave = f"t{i}"
            if chave in traducoes:
                novo_texto = traducoes[chave].replace('"', "'") # Proteção contra aspas acidentais no HTML
                bloco_novo = m.group(1) + novo_texto + m.group(3)
                html_modificado = html_modificado[:m.start()] + bloco_novo + html_modificado[m.end():]
                
        return html_modificado
    except Exception as e:
        print(f"\n⚠️ Erro ao adaptar SEO com DeepSeek (mantendo SEO original): {e}")
        return html

def preparar_html_para_traducao_texto(caminho_arquivo, idioma_alvo):
    """
    Trata o HTML puramente como texto, garantindo rotas, footer, SEO, hreflang,
    canonical e tags principais sejam ajustados com alta precisão.
    """
    with open(caminho_arquivo, 'r', encoding='utf-8') as f:
        html = f.read()

    # ==========================================
    # 1. SUBSTITUIÇÃO CIRÚRGICA DO FOOTER E ROTAS (INTACTO)
    # ==========================================
    footer_novo = """<div id="footer-placeholder"></div>
<script>
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
      fetch("footer.html")
        .then((response) => response.text())
        .then((data) => {
          document.getElementById("footer-placeholder").innerHTML = data;
        });
    }, 150);
  });
</script>"""

    marcador_inicio = '<div id="footer-placeholder"></div>'
    marcador_fim = '</script>'
    
    idx_inicio = html.rfind(marcador_inicio)
    
    if idx_inicio != -1:
        idx_fim = html.find(marcador_fim, idx_inicio)
        if idx_fim != -1:
            idx_fim += len(marcador_fim) 
            bloco_antigo = html[idx_inicio:idx_fim]
            html = html.replace(bloco_antigo, footer_novo)

    regras_rotas = {
        'href="global-styles.css"': 'href="/global-styles.css"',
        'href="./global-styles.css"': 'href="/global-styles.css"',
        'src="lang-selector.js"': 'src="/lang-selector.js"',
        'src="./lang-selector.js"': 'src="/lang-selector.js"',
        'href="_language_selector.html"': 'href="/_language_selector.html"',
        'href="./_language_selector.html"': 'href="/_language_selector.html"',
        'href="manifest.json"': 'href="/manifest.json"',
        'src="ce-calculadora-padrao.js"': 'src="/ce-calculadora-padrao.js"',
        'src="/global-scripts.js"': 'src="global-scripts.js"',
        'src="./global-scripts.js"': 'src="global-scripts.js"',
        'href="/global-body-elements.html"': 'href="global-body-elements.html"',
        'href="./global-body-elements.html"': 'href="global-body-elements.html"',
        'href="/menu-global.html"': 'href="menu-global.html"',
        'href="./menu-global.html"': 'href="menu-global.html"',
        'src="img/': 'src="/img/',
        'src="../img/': 'src="/img/'
    }

    for antigo, novo in regras_rotas.items():
        html = html.replace(antigo, novo)

    # ==========================================
    # 2. ATUALIZAR A TAG LANG HTML
    # ==========================================
    mapa_locales = {
        "en": "en-US",
        "es": "es-ES",
        "fr": "fr-FR",
        "it": "it-IT",
        "de": "de-DE",
        "hi": "hi-IN",
        "zh": "zh-CN",
        "ja": "ja-JP",
        "ru": "ru-RU",
        "ko": "ko-KR",
        "tr": "tr-TR",
        "nl": "nl-NL",
        "pl": "pl-PL",
        "sv": "sv-SE",
        "id": "id-ID",
        "vi": "vi-VN",
        "uk": "uk-UA",
        "ar": "ar-SA"
    }
    
    locale_completo = mapa_locales.get(idioma_alvo, idioma_alvo)
    html = re.sub(r'<html\s+lang="pt-BR">', f'<html lang="{locale_completo}">', html, flags=re.IGNORECASE)

    # ==========================================
    # 3. ATUALIZAR LINK CANONICAL CIRURGICAMENTE
    # ==========================================
    # O Regex captura o inicio (Grupo 1), o nome do arquivo html (Grupo 2) e o fechamento da tag (Grupo 3)
    padrao_canonical = re.compile(r'(<link\s+rel="canonical"\s+href="https://www\.calculadorasdeenfermagem\.com\.br)/([^"]+)("\s*/?>)', re.IGNORECASE)
    # E injeta a pasta do idioma_alvo entre a URL e o nome do arquivo
    html = padrao_canonical.sub(rf'\1/{idioma_alvo}/\2\3', html)

    # ==========================================
    # 4. REORDENAR TAGS HREFLANG
    # ==========================================
    padrao_hreflang = re.compile(r'<link\s+rel="alternate"\s+hreflang="([^"]+)"\s+href="([^"]+)"\s*/?>', re.IGNORECASE)
    hreflang_matches = list(padrao_hreflang.finditer(html))
    
    if hreflang_matches:
        start_idx = hreflang_matches[0].start()
        end_idx = hreflang_matches[-1].end()
        
        tags = [m.group(0) for m in hreflang_matches]
        
        tag_alvo = None
        tags_restantes = []
        
        for tag in tags:
            # Captura exatamente a tag correspondente ao idioma alvo atual
            if f'hreflang="{idioma_alvo}"' in tag.lower():
                tag_alvo = tag
            else:
                tags_restantes.append(tag)
                
        if tag_alvo:
            # Coloca a tag do idioma alvo no topo
            tags_reordenadas = [tag_alvo] + tags_restantes
            bloco_novo = "\n    ".join(tags_reordenadas)
            html = html[:start_idx] + bloco_novo + html[end_idx:]

    # ==========================================
    # 5. TRADUZIR META TAGS SEO CIRURGICAMENTE
    # ==========================================
    html = traduzir_meta_seo_com_deepseek(html, idioma_alvo)

    return html

def traduzir_lote_js_com_deepseek(dicionario_scripts, idioma_alvo):
    """
    Função otimizada que recebe um dicionário de VÁRIOS scripts e faz uma ÚNICA
    requisição ao DeepSeek, evitando erros de rate-limit e acelerando o processo.
    """
    instrucoes_sistema = f"""
    Você é um cirurgião de código sênior e especialista em localização internacional.
    Sua ÚNICA tarefa é traduzir as 'strings' (textos) legíveis por humanos do Português para o idioma '{idioma_alvo}'.
    Você receberá um objeto JSON onde as chaves são identificadores e os valores são os blocos de código JavaScript.
    
    ⚠️ REGRAS CRÍTICAS E INEGOCIÁVEIS:
    1. TRADUZA APENAS o texto final lido pelo usuário (ex: mensagens, "POSITIVO", "NEGATIVO", "Conduta de Enfermagem").
    2. NÃO ALTERE variáveis, constantes, nomes de funções, IDs de DOM, classes CSS, chaves de objeto ou lógica matemática.
    3. PRESERVE rigorosamente a estrutura de interpolação. Tudo que estiver dentro de `${{...}}` NÃO DEVE ser tocado.
    4. PRESERVE as aspas originais (simples, duplas ou crases).
    5. Se houver código HTML dentro da string, traduza APENAS a palavra legível. Não traduza classes ou tags.
    6. NÃO TRADUZA parâmetros de eventos do sistema (ex: 'click', 'DOMContentLoaded', 'smooth').
    7. DEVOLVA EXCLUSIVAMENTE UM JSON VÁLIDO contendo as mesmas chaves do original e os códigos já traduzidos. SEM marcações markdown.
    """
    
    # URL LIMPA CIRURGICAMENTE: sem formatação de colchetes!
    url = "https://api.deepseek.com/chat/completions"
    headers = {
        "Authorization": f"Bearer {CHAVE_DEEPSEEK}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": instrucoes_sistema},
            {"role": "user", "content": json.dumps(dicionario_scripts, ensure_ascii=False)}
        ],
        "temperature": 0.0, # Temperatura ZERO absoluta para forçar precisão matemática
        "response_format": {"type": "json_object"}
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=90)
        response.raise_for_status()
        dados = response.json()
        resultado = dados["choices"][0]["message"]["content"].strip()
        
        # Limpeza caso deepseek envie markdown
        if resultado.startswith("```"):
            resultado = re.sub(r'^```(json)?\n', '', resultado, flags=re.IGNORECASE)
            resultado = re.sub(r'\n```$', '', resultado)
            
        traducoes = json.loads(resultado)
        
        # Reconstrói garantindo que caso a IA omita alguma chave, o código original é mantido
        retorno_seguro = {}
        for chave, codigo_original in dicionario_scripts.items():
            retorno_seguro[chave] = traducoes.get(chave, codigo_original)
            
        return retorno_seguro
    except Exception as e:
        print(f"\n⚠️ Erro ao traduzir scripts em LOTE com DeepSeek (Mantendo originais intactos por segurança): {e}")
        return dicionario_scripts

def traduzir_html_com_deepl(html_preparado, idioma_alvo):
    try:
        # === 1. PROTEÇÃO CIRÚRGICA DE SCRIPTS E STYLES ===
        blocos_codigo = {}
        scripts_para_traduzir = {}
        contador = [0]
        
        padrao = re.compile(r'(<(script|style)\b[^>]*>.*?</\2>)', re.IGNORECASE | re.DOTALL)
        
        def proteger_bloco(match):
            codigo_original = match.group(1)
            tag_name = match.group(2).lower()
            
            id_bloco = f"DEEPL_BLOCK_{contador[0]}"
            contador[0] += 1
            placeholder = f'<div translate="no" id="{id_bloco}"></div>'
            
            # Se for script inline (sem src), separa num dicionário à parte para envio em LOTE
            if tag_name == 'script' and 'src=' not in codigo_original.lower():
                scripts_para_traduzir[placeholder] = codigo_original
            else:
                blocos_codigo[placeholder] = codigo_original
                
            return placeholder
            
        html_protegido = padrao.sub(proteger_bloco, html_preparado)
        
        # === 2. PROCESSAMENTO DEEPSEEK EM LOTE (BATCH) ===
        if scripts_para_traduzir:
            # Substitui as chamadas sequenciais por uma única requisição
            print(f"      \033[96m↳ Enviando lógicas Javascript em LOTE único para o DeepSeek...\033[0m")
            scripts_traduzidos = traduzir_lote_js_com_deepseek(scripts_para_traduzir, idioma_alvo)
            
            # Reintegra os scripts traduzidos no repositório geral de blocos
            blocos_codigo.update(scripts_traduzidos)
        
        # === 3. COMUNICAÇÃO COM DEEPL ===
        translator = deepl.Translator(CHAVE_API)
        
        idioma_deepl = idioma_alvo.upper()
        if idioma_deepl == "EN":
            idioma_deepl = "EN-US"
        elif idioma_deepl == "PT":
            idioma_deepl = "PT-BR"

        resultado = translator.translate_text(
            html_protegido, 
            target_lang=idioma_deepl, 
            tag_handling="html"
        )
        
        html_traduzido = resultado.text.strip()
        
        # === 4. RESTAURAÇÃO DE SCRIPTS E STYLES ===
        for placeholder, codigo_restaurado in blocos_codigo.items():
            html_traduzido = html_traduzido.replace(placeholder, codigo_restaurado)
            
        return html_traduzido
    except Exception as e:
        print(f"\n❌ Erro na comunicação com a API do DeepL: {e}")
        return None

if __name__ == "__main__":
    C_AMARELO = '\033[93m'
    C_VERDE   = '\033[92m'
    C_AZUL    = '\033[96m'
    C_ROXO    = '\033[95m'
    RESET     = '\033[0m'

    # =========================================================================
    # 🟢 ÁREA DE CONFIGURAÇÃO DIÁRIA (ALTERE APENAS AQUI) 🟢
    # =========================================================================
    
    arquivos_originais = ["gestacional.html"] 
    idiomas_alvo = ["en", "es", "de", "it", "fr", "zh", "ar", "ja", "ru", "ko", "tr", "nl", "pl", "sv", "id", "vi", "uk"] 
    
    # =========================================================================

    for arquivo_original in arquivos_originais:
        for idioma_alvo in idiomas_alvo:
            print(f"\n{C_AMARELO}======================================================={RESET}")
            print(f"{C_AZUL}▶ ARQUIVO DE ORIGEM: {C_AMARELO}{arquivo_original}{RESET}")
            print(f"{C_AZUL}▶ IDIOMA ALVO:       {C_AMARELO}{idioma_alvo} {C_VERDE}(Destino: ./{idioma_alvo}/){RESET}")
            print(f"{C_AMARELO}======================================================={RESET}\n")

            if os.path.exists(arquivo_original):
                print(f"{C_AZUL}[1/4]{RESET} Preparando HTML (Rotas, Canonical, Hreflang, Lang e SEO)...")
                html_preparado = preparar_html_para_traducao_texto(arquivo_original, idioma_alvo)
                
                print(f"{C_AZUL}[2/4]{RESET} Processando APIs e traduzindo HTML...")
                html_traduzido = traduzir_html_com_deepl(html_preparado, idioma_alvo)
                
                if html_traduzido:
                    print(f"{C_AZUL}[3/4]{RESET} Salvando arquivo na pasta do idioma...")
                    pasta_destino = f"./{idioma_alvo}/"
                    os.makedirs(pasta_destino, exist_ok=True)
                    
                    nome_arquivo = os.path.basename(arquivo_original)
                    caminho_saida = os.path.join(pasta_destino, nome_arquivo)
                    
                    with open(caminho_saida, 'w', encoding='utf-8') as f:
                        f.write(html_traduzido)
                        
                    print(f"{C_VERDE}✅ SUCESSO! Arquivo salvo em: {caminho_saida}{RESET}\n")

                    print(f"{C_AMARELO}======================================================={RESET}")
                    print(f"{C_ROXO}▶ INICIANDO PROCESSO DE BUILD E CACHE AUTOMÁTICO{RESET}")
                    print(f"{C_AMARELO}======================================================={RESET}\n")

                    comandos_build = [
                        r".\node_modules\.bin\tailwindcss -i ./src/input.css -o ./public/output.css --minify",
                        "node gerar-sw.js",
                    ]

                    for comando in comandos_build:
                        print(f"{C_AZUL}⚙️ Executando:{RESET} {comando}")
                        try:
                            subprocess.run(comando, shell=True, check=True)
                        except subprocess.CalledProcessError as e:
                            print(f"\n{C_AMARELO}⚠️ Aviso: O comando falhou: {comando}{RESET}")
                    
                    try:
                        with open("log_traducoes.txt", "a", encoding="utf-8") as log_file:
                            data_atual = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
                            log_file.write(f"[{data_atual}] HTML traduzido: '{arquivo_original}' | Idioma alvo: '{idioma_alvo}' | Destino: '{caminho_saida}'\n")
                        print(f"{C_VERDE}📝 Log gerado/atualizado com sucesso em log_traducoes.txt.{RESET}")
                    except Exception as e:
                        print(f"{C_AMARELO}⚠️ Aviso: Erro ao escrever o log: {e}{RESET}")

                    print(f"\n{C_VERDE}🚀 CICLO COMPLETO FINALIZADO PARA '{arquivo_original}' EM '{idioma_alvo}'!{RESET}")
                    
                    # === INÍCIO DA PAUSA DE SEGURANÇA (RATE LIMIT) ===
                    # Verifica se este é o último idioma do último arquivo para não esperar à toa no final
                    is_last_file = (arquivo_original == arquivos_originais[-1])
                    is_last_lang = (idioma_alvo == idiomas_alvo[-1])
                    
                    if not (is_last_file and is_last_lang):
                        print(f"\n{C_AMARELO}⏳ Pausa de segurança: Aguardando 120 segundos para evitar bloqueios da API...{RESET}")
                        time.sleep(120)
                    # === FIM DA PAUSA DE SEGURANÇA ===
            else:
                print(f"\n{C_AMARELO}Atenção: O arquivo '{arquivo_original}' não foi encontrado na raiz.{RESET}")

    print(f"\n{C_AMARELO}======================================================={RESET}")
    print(f"{C_VERDE}🎉 TODA A FILA DE TRADUÇÃO E BUILDS FOI CONCLUÍDA!{RESET}")
    print(f"{C_AMARELO}======================================================={RESET}\n")