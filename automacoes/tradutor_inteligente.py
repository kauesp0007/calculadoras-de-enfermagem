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
        'src="/global-scripts.js"': 'src="/global-scripts.js"',
        'src=".global-scripts.js"': 'src="/global-scripts.js"',
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
    # 5. AJUSTE CIRÚRGICO DE FONTES ESPECÍFICAS
    # ==========================================
    fontes_especificas = {
        "ar": {
            "css": "@font-face { font-family: 'Arabic'; src: url('/fonts/arabic/arabic-regular.woff2') format('woff2'); font-weight: 400; font-display: optional; }\n    @font-face { font-family: 'Arabic'; src: url('/fonts/arabic/arabic-700.woff2') format('woff2'); font-weight: 700; font-display: optional; }",
            "preload": '<link rel="preload" href="/fonts/arabic/arabic-regular.woff2" as="font" type="font/woff2" crossorigin>\n  <link rel="preload" href="/fonts/arabic/arabic-700.woff2" as="font" type="font/woff2" crossorigin>'
        },
        "zh": {
            "css": "@font-face { font-family: 'Chinese'; src: url('/fonts/chinese/chinese-regular.woff2') format('woff2'); font-weight: 400; font-display: optional; }",
            "preload": '<link rel="preload" href="/fonts/chinese/chinese-regular.woff2" as="font" type="font/woff2" crossorigin>'
        },
        "hi": {
            "css": "@font-face { font-family: 'Devanagari'; src: url('/fonts/devanagari/devanagari-regular.woff2') format('woff2'); font-weight: 400; font-display: optional; }\n    @font-face { font-family: 'Devanagari'; src: url('/fonts/devanagari/devanagari-700.woff2') format('woff2'); font-weight: 700; font-display: optional; }",
            "preload": '<link rel="preload" href="/fonts/devanagari/devanagari-regular.woff2" as="font" type="font/woff2" crossorigin>\n  <link rel="preload" href="/fonts/devanagari/devanagari-700.woff2" as="font" type="font/woff2" crossorigin>'
        },
        "ja": {
            "css": "@font-face { font-family: 'Japanese'; src: url('/fonts/japanese/japanese-regular.woff2') format('woff2'); font-weight: 400; font-display: optional; }\n    @font-face { font-family: 'Japanese'; src: url('/fonts/japanese/japanese-700.woff2') format('woff2'); font-weight: 700; font-display: optional; }",
            "preload": '<link rel="preload" href="/fonts/japanese/japanese-regular.woff2" as="font" type="font/woff2" crossorigin>\n  <link rel="preload" href="/fonts/japanese/japanese-700.woff2" as="font" type="font/woff2" crossorigin>'
        },
        "ko": {
            "css": "@font-face { font-family: 'Korean'; src: url('/fonts/korean/korean-regular.woff2') format('woff2'); font-weight: 400; font-display: optional; }\n    @font-face { font-family: 'Korean'; src: url('/fonts/korean/korean-700.woff2') format('woff2'); font-weight: 700; font-display: optional; }",
            "preload": '<link rel="preload" href="/fonts/korean/korean-regular.woff2" as="font" type="font/woff2" crossorigin>\n  <link rel="preload" href="/fonts/korean/korean-700.woff2" as="font" type="font/woff2" crossorigin>'
        }
    }

    if idioma_alvo in fontes_especificas:
        # Injeta o novo CSS logo após a abertura da tag <style id="critical-fonts">
        tag_style = r'(<style\s+id="critical-fonts"[^>]*>\s*)'
        if re.search(tag_style, html, re.IGNORECASE):
            html = re.sub(tag_style, rf'\1{fontes_especificas[idioma_alvo]["css"]}\n    ', html, count=1, flags=re.IGNORECASE)
        
        # Remove APENAS os @font-face originais de Inter e Nunito
        html = re.sub(r'@font-face\s*\{\s*font-family:\s*[\'"](?:Inter|Nunito Sans)[\'"][^\}]+\}\s*', '', html, flags=re.IGNORECASE)

        # Injeta os preloads novos na posição do primeiro preload original a ser removido (para manter no mesmo bloco do head)
        primeiro_preload = r'<link\s+rel="preload"\s+href="/fonts/(?:inter|nunito)/[^>]+>'
        if re.search(primeiro_preload, html, re.IGNORECASE):
            html = re.sub(primeiro_preload, fontes_especificas[idioma_alvo]["preload"], html, count=1, flags=re.IGNORECASE)
            
        # Remove todos os outros preloads originais de Inter e Nunito restantes
        html = re.sub(r'<link\s+rel="preload"\s+href="/fonts/(?:inter|nunito)/[^>]+>\s*', '', html, flags=re.IGNORECASE)

    # ==========================================
    # 6. TRADUZIR META TAGS SEO CIRURGICAMENTE
    # ==========================================
    html = traduzir_meta_seo_com_deepseek(html, idioma_alvo)

    return html

def traduzir_lote_js_com_deepseek(dicionario_scripts, idioma_alvo):
    """
    Função otimizada que extrai as strings do JS antes de enviar para a IA,
    evitando que a IA corrompa a sintaxe do código (como template literals).
    """
    # 1. Extração cirúrgica de strings do JavaScript
    strings_para_traduzir = {}
    mapeamento_scripts = {}
    contador_string = 0

    for id_script, codigo_js in dicionario_scripts.items():
        # Usa regex para encontrar strings entre aspas simples ('...') ou duplas ("...")
        # Ignora strings vazias ou muito curtas (ex: chaves de objetos, IDs curtos)
        # Ignora template literals (`...`) por enquanto, pois geralmente contém lógica
        padrao_string = re.compile(r'(["\'])(.*?)\1')
        
        novo_codigo_js = codigo_js
        mapeamento_scripts[id_script] = []

        for match in padrao_string.finditer(codigo_js):
            delimitador = match.group(1)
            conteudo = match.group(2)
            
            # Filtro de segurança: só traduz se parecer texto legível (tem espaços, não é um caminho/ID)
            if len(conteudo) > 3 and " " in conteudo and not conteudo.startswith(('/', '#', '.', 'data-')) and not conteudo.endswith('.html'):
                id_string = f"STR_{contador_string}"
                strings_para_traduzir[id_string] = conteudo
                mapeamento_scripts[id_script].append({
                    'original': match.group(0), # A string completa com as aspas
                    'id': id_string,
                    'delimitador': delimitador
                })
                contador_string += 1

    if not strings_para_traduzir:
        print("      ↳ Nenhuma string de texto legível encontrada no JS. Mantendo original.")
        return dicionario_scripts

    print(f"      ↳ Enviando {len(strings_para_traduzir)} fragmentos de texto do JS para o DeepSeek...")

    # 2. Comunicação com o DeepSeek (Apenas as strings!)
    instrucoes_sistema = f"""
    Você é um tradutor especializado em localização de interfaces para a área da saúde/enfermagem.
    Traduza as mensagens/textos do Português para o idioma '{idioma_alvo}'.
    
    REGRAS CRÍTICAS:
    1. Retorne APENAS o JSON válido. Sem explicações, sem blocos markdown (```json).
    2. As chaves do JSON (STR_0, STR_1...) DEVEM ser mantidas intactas.
    3. Traduza o valor. Mantenha eventuais pontuações finais, mas NÃO adicione aspas extras.
    """
    
    url = "https://api.deepseek.com/chat/completions"
    headers = {
        "Authorization": f"Bearer {CHAVE_DEEPSEEK}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": instrucoes_sistema},
            {"role": "user", "content": json.dumps(strings_para_traduzir, ensure_ascii=False)}
        ],
        "temperature": 0.0,
        "response_format": {"type": "json_object"}
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=90)
        response.raise_for_status()
        resultado = response.json()["choices"][0]["message"]["content"].strip()
        
        # Limpeza caso deepseek envie markdown
        if resultado.startswith("```"):
            resultado = re.sub(r'^```(json)?\n', '', resultado, flags=re.IGNORECASE)
            resultado = re.sub(r'\n```$', '', resultado)
            
        traducoes = json.loads(resultado)
        
        # 3. Reconstrução do JavaScript
        retorno_seguro = {}
        for id_script, codigo_js in dicionario_scripts.items():
            codigo_reconstruido = codigo_js
            # Substitui as strings traduzidas de volta no código
            for item in mapeamento_scripts[id_script]:
                id_str = item['id']
                texto_traduzido = traducoes.get(id_str)
                
                if texto_traduzido:
                    # Protege aspas dentro da string traduzida
                    texto_traduzido = texto_traduzido.replace(item['delimitador'], f"\\{item['delimitador']}")
                    string_traduzida_com_aspas = f"{item['delimitador']}{texto_traduzido}{item['delimitador']}"
                    # Substitui a original pela traduzida (cuidado extra com replace para não trocar partes erradas)
                    codigo_reconstruido = codigo_reconstruido.replace(item['original'], string_traduzida_com_aspas, 1)
            
            retorno_seguro[id_script] = codigo_reconstruido
            
        return retorno_seguro

    except json.JSONDecodeError as e:
        print(f"\n❌ ERRO DE JSON DO DEEPSEEK: O modelo quebrou a formatação.")
        print(f"Resposta bruta da IA: {resultado[:300]}...")
        return dicionario_scripts
    except Exception as e:
        print(f"\n⚠️ Erro geral ao traduzir scripts com DeepSeek: {e}")
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
    
    arquivos_originais = ["objetivo.html"] 
    idiomas_alvo = ["en", "es", "de", "it", "fr", "zh", "ar", "ja", "ru", "ko", "tr", "nl", "pl", "sv", "id", "vi", "uk"] 
    
    # =========================================================================

    for arquivo_original in arquivos_originais:
        for idioma_alvo in idiomas_alvo:
            print(f"\n{C_AMARELO}======================================================={RESET}")
            print(f"{C_AZUL}▶ ARQUIVO DE ORIGEM: {C_AMARELO}{arquivo_original}{RESET}")
            print(f"{C_AZUL}▶ IDIOMA ALVO:       {C_AMARELO}{idioma_alvo} {C_VERDE}(Destino: ./{idioma_alvo}/){RESET}")
            print(f"{C_AMARELO}======================================================={RESET}\n")

            if os.path.exists(arquivo_original):
                print(f"{C_AZUL}[1/4]{RESET} Preparando HTML (Rotas, Canonical, Hreflang, Lang, Fontes e SEO)...")
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