import os
import subprocess
from datetime import datetime
from dotenv import load_dotenv
import re
import requests
import json
import time

# Carrega a chave do arquivo .env silenciosamente
load_dotenv()

CHAVE_OPENAI = os.getenv("OPENAI_API_KEY")
CHAVE_DEEPSEEK = os.getenv("DEEPSEEK_API_KEY")
if not CHAVE_OPENAI:
    raise ValueError("Chave da API OpenAI não encontrada. Adicione OPENAI_API_KEY no arquivo .env.")
if not CHAVE_DEEPSEEK:
    raise ValueError("Chave do DeepSeek não encontrada. Adicione DEEPSEEK_API_KEY no arquivo .env para traduzir os scripts dinâmicos.")

def traduzir_meta_seo_com_deepseek(html, idioma_alvo):
    """
    Isola os conteúdos das tags de SEO e traduz de forma independente usando o DeepSeek,
    garantindo adaptação cultural e de palavras-chave.
    Regex INDEPENDENTE de ordem de atributos (content pode vir antes ou depois de name/property).
    """
    # Encontra tags <meta> com name/property de SEO, independente da ordem dos atributos
    padrao_tag = re.compile(
        r'<meta\s+'
        r'(?=[^>]*\b(?:name|property)="(?:description|keywords|og:title|og:description|twitter:title|twitter:description)")'
        r'[^>]*/?>',
        re.IGNORECASE
    )
    matches = list(padrao_tag.finditer(html))

    if not matches:
        return html

    # Extrai os textos do atributo content (posição independente) e guarda posições
    dict_textos = {}
    conteudos_info = []  # [(start, end, texto_original), ...]
    for i, m in enumerate(matches):
        tag = m.group(0)
        content_match = re.search(r'\bcontent="([^"]*)"', tag, re.IGNORECASE)
        if content_match:
            dict_textos[f"t{i}"] = content_match.group(1)
            conteudos_info.append((m.start(), m.end(), content_match.group(1)))

    if not dict_textos:
        return html

    instrucoes = f"""
    Você é um especialista em SEO internacional e localização na área da saúde/enfermagem.
    Traduza os valores num JSON do Português para o idioma com o código ISO '{idioma_alvo}'.
    
    REGRAS INEGOCIÁVEIS:
    1. Adapte os termos para as palavras-chave com maior volume de busca na enfermagem neste idioma alvo.
    2. NÃO modifique as chaves do JSON.
    3. RETORNE EXCLUSIVAMENTE UM JSON VÁLIDO. Sem explicações e sem marcações markdown.
    """

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
        response = requests.post(url, headers=headers, json=payload, timeout=40)
        response.raise_for_status()
        resultado = response.json()["choices"][0]["message"]["content"].strip()

        if resultado.startswith("```"):
            resultado = re.sub(r'^```(json)?\n', '', resultado, flags=re.IGNORECASE)
            resultado = re.sub(r'\n```$', '', resultado)

        traducoes = json.loads(resultado)

        # Substitui no HTML (de trás para frente para preservar índices)
        html_modificado = html
        for i, (start, end, original) in reversed(list(enumerate(conteudos_info))):
            chave = f"t{i}"
            if chave in traducoes:
                novo_texto = traducoes[chave].replace('"', "'")
                tag_original = html_modificado[start:end]
                tag_nova = tag_original.replace(f'content="{original}"', f'content="{novo_texto}"')
                html_modificado = html_modificado[:start] + tag_nova + html_modificado[end:]

        return html_modificado
    except Exception as e:
        print(f"\n⚠️ Erro ao adaptar SEO com DeepSeek (mantendo SEO original): {e}")
        return html

def traduzir_schema_ld_json_com_deepseek(html, idioma_alvo):
    """
    Encontra blocos <script type="application/ld+json"> e traduz os textos
    legíveis (name, description, headline etc.) preservando a estrutura JSON.
    Também atualiza o campo 'inLanguage' para o idioma alvo.
    """
    padrao_schema = re.compile(
        r'(<script\s+type="application/ld\+json"[^>]*>)\s*'
        r'(.*?)'
        r'(</script>)',
        re.IGNORECASE | re.DOTALL
    )
    matches = list(padrao_schema.finditer(html))

    if not matches:
        return html

    instrucoes = f"""
    Você é um especialista em SEO técnico e Schema.org.
    Traduza os valores textuais do JSON-LD abaixo do Português para o idioma '{idioma_alvo}'.
    O JSON contém marcação schema.org (Organization, WebSite, SoftwareApplication, CollectionPage, FAQPage, BreadcrumbList, etc).

    REGRAS INEGOCIÁVEIS:
    1. Traduza APENAS os valores das chaves de texto legível: name, description, headline, text, about, abstract.
    2. NÃO altere URLs, @id, @type, @context, datas, números ou chaves técnicas.
    3. Atualize o campo \"inLanguage\" para \"{idioma_alvo}\" (se houver).
    4. MANTENHA a estrutura JSON exatamente igual (chaves, arrays, objetos).
    5. RETORNE EXCLUSIVAMENTE UM JSON VÁLIDO. Sem explicações, sem marcações markdown.
    """

    url = "https://api.deepseek.com/chat/completions"
    headers = {
        "Authorization": f"Bearer {CHAVE_DEEPSEEK}",
        "Content-Type": "application/json"
    }

    html_modificado = html
    for i, m in reversed(list(enumerate(matches))):
        tag_abertura = m.group(1)
        json_interno = m.group(2).strip()
        tag_fechamento = m.group(3)

        if not json_interno:
            continue

        # Atualiza URLs raiz no schema para apontar para a pasta do idioma
        # Ex: "url": "https://...com.br/" → "url": "https://...com.br/{idioma}/"
        # Ex: "@id": "https://...com.br/#org" → "@id": "https://...com.br/{idioma}/#org"
        # NÃO altera URLs de assets (ex: /assets/logo.png, /iconpages-*.webp)
        json_interno = re.sub(
            r'https://www\.calculadorasdeenfermagem\.com\.br/(?="|#)',
            f'https://www.calculadorasdeenfermagem.com.br/{idioma_alvo}/',
            json_interno
        )

        try:
            payload = {
                "model": "deepseek-chat",
                "messages": [
                    {"role": "system", "content": instrucoes},
                    {"role": "user", "content": json_interno}
                ],
                "temperature": 0.0,
                "response_format": {"type": "json_object"}
            }

            response = requests.post(url, headers=headers, json=payload, timeout=40)
            response.raise_for_status()
            resultado = response.json()["choices"][0]["message"]["content"].strip()

            if resultado.startswith("```"):
                resultado = re.sub(r'^```(json)?\n', '', resultado, flags=re.IGNORECASE)
                resultado = re.sub(r'\n```$', '', resultado)

            # Valida que o resultado é JSON válido
            json.loads(resultado)

            bloco_novo = f'{tag_abertura}\n{resultado}\n{tag_fechamento}'
            html_modificado = html_modificado[:m.start()] + bloco_novo + html_modificado[m.end():]

        except Exception as e:
            print(f"      ⚠️ Erro ao traduzir schema JSON-LD (mantendo original): {e}")
            continue

    return html_modificado

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
        'src="./global-scripts.js"': 'src="/global-scripts.js"',
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
    # Regex INDEPENDENTE de ordem de atributos. O / fica DENTRO do grupo 1.
    # Aceita path vazio (ex: index.html canonical = /).
    padrao_canonical = re.compile(
        r'(<link\s+'
        r'(?=[^>]*\brel="canonical")'
        r'[^>]*\bhref="https://www\.calculadorasdeenfermagem\.com\.br/)([^"]*)"',
        re.IGNORECASE
    )
    html = padrao_canonical.sub(
        lambda m: f'{m.group(1)}{idioma_alvo}/{"" if not m.group(2) else m.group(2)}"',
        html
    )

    # ==========================================
    # 3b. ATUALIZAR META OG:URL E TWITTER:URL
    # ==========================================
    # Atualiza a URL base nos meta tags og:url e twitter:url para incluir a pasta do idioma
    for attr in ('property="og:url"', 'name="twitter:url"'):
        html = re.sub(
            rf'(<meta\s+(?=[^>]*\b{attr})[^>]*\bcontent="https://www\.calculadorasdeenfermagem\.com\.br)/([^"]*)"',
            rf'\1/{idioma_alvo}/\2"',
            html,
            flags=re.IGNORECASE
        )

    # ==========================================
    # 4. REORDENAR TAGS HREFLANG
    # ==========================================
    # Regex INDEPENDENTE de ordem de atributos (href, hreflang e rel em qualquer ordem)
    padrao_hreflang = re.compile(
        r'<link\s+'
        r'(?=[^>]*\brel="alternate")'
        r'(?=[^>]*\bhreflang="([^"]*)")'
        r'[^>]*\bhref="([^"]*)"'
        r'[^>]*/?>',
        re.IGNORECASE
    )
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
    # 5. AJUSTE CIRÚRGICO DE FONTES ESPECÍFICAS (IDIOMAS NÃO-LATINOS)
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

        # Injeta os preloads novos na posição do primeiro preload original (ordem-independente: href e rel em qualquer posição)
        primeiro_preload = r'<link\s+(?=[^>]*\brel="preload")(?=[^>]*\bhref="/fonts/(?:inter|nunito)/)[^>]*>'
        if re.search(primeiro_preload, html, re.IGNORECASE):
            html = re.sub(primeiro_preload, fontes_especificas[idioma_alvo]["preload"], html, count=1, flags=re.IGNORECASE)

        # Remove todos os outros preloads originais de Inter e Nunito restantes (ordem-independente)
        html = re.sub(r'<link\s+(?=[^>]*\brel="preload")(?=[^>]*\bhref="/fonts/(?:inter|nunito)/)[^>]*>\s*', '', html, flags=re.IGNORECASE)

    # ==========================================
    # 6. TRADUZIR META TAGS SEO (DEEPSEEK)
    # ==========================================
    html = traduzir_meta_seo_com_deepseek(html, idioma_alvo)

    # ==========================================
    # 7. TRADUZIR SCHEMA JSON-LD (DEEPSEEK)
    # ==========================================
    html = traduzir_schema_ld_json_com_deepseek(html, idioma_alvo)

    return html

# ============================================================
# CONFIGURAÇÃO DAS CHAMADAS DE TRADUÇÃO EM LOTE (anti-timeout)
# ============================================================
TIMEOUT_CONEXAO_LOTE = 30   # segundos para conectar
TIMEOUT_LEITURA_LOTE = 300  # segundos para receber a resposta completa
MAX_TENTATIVAS_LOTE = 3     # tentativas por requisição (retry com backoff)
MAX_CHARS_POR_LOTE = 40000  # tamanho máximo (caracteres) por requisição em lote

def dividir_lote_por_tamanho(dicionario_scripts, max_chars=MAX_CHARS_POR_LOTE):
    """Divide o dicionário em pedaços menores para evitar timeouts de leitura."""
    lotes = []
    atual = {}
    tamanho_atual = 0
    for chave, valor in dicionario_scripts.items():
        peso = len(chave) + len(valor)
        if atual and (tamanho_atual + peso > max_chars):
            lotes.append(atual)
            atual = {}
            tamanho_atual = 0
        atual[chave] = valor
        tamanho_atual += peso
    if atual:
        lotes.append(atual)
    return lotes

def _traduzir_lote_js_deepseek_unico(dicionario_scripts, idioma_alvo):
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
        response = requests.post(url, headers=headers, json=payload, timeout=(TIMEOUT_CONEXAO_LOTE, TIMEOUT_LEITURA_LOTE))
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
        raise

def _traduzir_lote_js_openai_unico(dicionario_scripts, idioma_alvo):
    """
    Função que recebe um dicionário de scripts e traduz via API da OpenAI.
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

    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {CHAVE_OPENAI}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": instrucoes_sistema},
            {"role": "user", "content": json.dumps(dicionario_scripts, ensure_ascii=False)}
        ],
        "temperature": 0.0,
        "response_format": {"type": "json_object"}
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=(TIMEOUT_CONEXAO_LOTE, TIMEOUT_LEITURA_LOTE))
        response.raise_for_status()
        dados = response.json()
        resultado = dados["choices"][0]["message"]["content"].strip()

        # Limpeza caso a OpenAI envie markdown
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
        print(f"\n⚠️ Erro ao traduzir scripts em LOTE com OpenAI (Mantendo originais intactos por segurança): {e}")
        raise

def traduzir_lote_js_com_deepseek(dicionario_scripts, idioma_alvo):
    """Lote dividido por tamanho + retry com backoff (evita read timeout)."""
    if not dicionario_scripts:
        return {}
    traducoes_gerais = {}
    lotes = dividir_lote_por_tamanho(dicionario_scripts)
    for idx, pedaco in enumerate(lotes, 1):
        if len(lotes) > 1:
            print(f"      ↳ Lote {idx}/{len(lotes)} ({len(pedaco)} scripts) → DeepSeek...")
        resultado = None
        for tentativa in range(MAX_TENTATIVAS_LOTE):
            try:
                resultado = _traduzir_lote_js_deepseek_unico(pedaco, idioma_alvo)
                break
            except Exception as e:
                if tentativa == MAX_TENTATIVAS_LOTE - 1:
                    print(f"      ⚠️ Falha final no lote {idx} (DeepSeek): mantendo originais deste pedaço. ({e})")
                    resultado = pedaco
                    break
                espera = 5 * (tentativa + 1)
                print(f"      ⏳ DeepSeek lote {idx} — tentativa {tentativa + 1} falhou. Nova tentativa em {espera}s...")
                time.sleep(espera)
        traducoes_gerais.update(resultado)
    return traducoes_gerais


def traduzir_lote_js_com_openai(dicionario_scripts, idioma_alvo):
    """Lote dividido por tamanho + retry com backoff (evita read timeout)."""
    if not dicionario_scripts:
        return {}
    traducoes_gerais = {}
    lotes = dividir_lote_por_tamanho(dicionario_scripts)
    for idx, pedaco in enumerate(lotes, 1):
        if len(lotes) > 1:
            print(f"      ↳ Lote {idx}/{len(lotes)} ({len(pedaco)} scripts) → OpenAI...")
        resultado = None
        for tentativa in range(MAX_TENTATIVAS_LOTE):
            try:
                resultado = _traduzir_lote_js_openai_unico(pedaco, idioma_alvo)
                break
            except Exception as e:
                if tentativa == MAX_TENTATIVAS_LOTE - 1:
                    print(f"      ⚠️ Falha final no lote {idx} (OpenAI): mantendo originais deste pedaço. ({e})")
                    resultado = pedaco
                    break
                espera = 5 * (tentativa + 1)
                print(f"      ⏳ OpenAI lote {idx} — tentativa {tentativa + 1} falhou. Nova tentativa em {espera}s...")
                time.sleep(espera)
        traducoes_gerais.update(resultado)
    return traducoes_gerais


def dividir_html_em_duas_partes(html):
    """Divide o HTML em duas partes aproximadamente iguais, em uma quebra de linha segura."""
    linhas = html.split('\n')
    if len(linhas) <= 1:
        meio = len(html) // 2
        return html[:meio], html[meio:]
    meio = len(linhas) // 2
    return '\n'.join(linhas[:meio]), '\n'.join(linhas[meio:])


def traduzir_html_com_deepseek_api(html_protegido, idioma_alvo):
    """Envia o HTML protegido para a API do DeepSeek e retorna o HTML traduzido."""
    instrucoes = f"""
Você é um especialista em localização de sites de saúde/enfermagem.
Traduza o conteúdo HTML do Português (pt-BR) para o idioma com código ISO '{idioma_alvo}'.

REGRAS INEGOCIÁVEIS:
1. Traduza APENAS os textos visíveis e os atributos textuais (title, alt, placeholder, aria-label).
2. NÃO altere tags HTML, classes, IDs, atributos técnicos, URLs, caminhos de arquivos ou comentários.
3. PRESERVE exatamente os placeholders <div translate="no" id="OPENAI_BLOCK_..."></div> sem modificá-los.
4. Mantenha a estrutura, indentação e quebras de linha do HTML original.
5. RETORNE EXCLUSIVAMENTE o HTML traduzido. Sem explicações, sem marcações markdown.
"""

    url = "https://api.deepseek.com/chat/completions"
    headers = {
        "Authorization": f"Bearer {CHAVE_DEEPSEEK}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": instrucoes},
            {"role": "user", "content": html_protegido}
        ],
        "temperature": 0.0,
        "max_tokens": 16384
    }

    response = requests.post(url, headers=headers, json=payload, timeout=180)
    response.raise_for_status()
    resultado = response.json()["choices"][0]["message"]["content"].strip()

    if resultado.startswith("```"):
        resultado = re.sub(r'^```(html)?\n', '', resultado, flags=re.IGNORECASE)
        resultado = re.sub(r'\n```$', '', resultado)

    return resultado


def traduzir_html_com_openai_api(html_protegido, idioma_alvo):
    """Envia o HTML protegido para a API da OpenAI e retorna o HTML traduzido."""
    nomes_idiomas = {
        "en": "Inglês", "es": "Espanhol", "fr": "Francês", "it": "Italiano",
        "de": "Alemão", "hi": "Hindi", "zh": "Chinês (simplificado)", "ar": "Árabe",
        "ja": "Japonês", "ru": "Russo", "ko": "Coreano", "tr": "Turco",
        "nl": "Holandês", "pl": "Polonês", "sv": "Sueco", "id": "Indonésio",
        "vi": "Vietnamita", "uk": "Ucraniano"
    }
    nome_idioma = nomes_idiomas.get(idioma_alvo, idioma_alvo)

    instrucoes = f"""
Você é um especialista em localização de sites de saúde/enfermagem.
Traduza o conteúdo HTML do Português (pt-BR) para {nome_idioma} ({idioma_alvo}).

REGRAS INEGOCIÁVEIS:
1. Traduza APENAS os textos visíveis e os atributos textuais (title, alt, placeholder, aria-label).
2. NÃO altere tags HTML, classes, IDs, atributos técnicos, URLs, caminhos de arquivos ou comentários.
3. PRESERVE exatamente os placeholders <div translate="no" id="OPENAI_BLOCK_..."></div> sem modificá-los.
4. Mantenha a estrutura, indentação e quebras de linha do HTML original.
5. RETORNE EXCLUSIVAMENTE o HTML traduzido. Sem explicações, sem marcações markdown.
"""

    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {CHAVE_OPENAI}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": instrucoes},
            {"role": "user", "content": html_protegido}
        ],
        "temperature": 0.0,
        "max_tokens": 16384
    }

    response = requests.post(url, headers=headers, json=payload, timeout=180)
    response.raise_for_status()
    resultado = response.json()["choices"][0]["message"]["content"].strip()

    if resultado.startswith("```"):
        resultado = re.sub(r'^```(html)?\n', '', resultado, flags=re.IGNORECASE)
        resultado = re.sub(r'\n```$', '', resultado)

    return resultado


def traduzir_html_com_openai(html_preparado, idioma_alvo):
    try:
        # === 1. PROTEÇÃO CIRÚRGICA DE SCRIPTS E STYLES ===
        blocos_codigo = {}
        scripts_para_traduzir = {}
        contador = [0]
        
        # Protege scripts, styles E SVGs inline contra corrupção pelo modelo de IA
        padrao = re.compile(r'(<(script|style|svg)\b[^>]*>.*?</\2>)', re.IGNORECASE | re.DOTALL)
        
        def proteger_bloco(match):
            codigo_original = match.group(1)
            tag_name = match.group(2).lower()
            
            id_bloco = f"OPENAI_BLOCK_{contador[0]}"
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
            # Divide o lote ao meio: metade DeepSeek + metade OpenAI
            chaves = list(scripts_para_traduzir.keys())
            metade = len(chaves) // 2
            primeira_metade = {chave: scripts_para_traduzir[chave] for chave in chaves[:metade]}
            segunda_metade = {chave: scripts_para_traduzir[chave] for chave in chaves[metade:]}

            scripts_traduzidos = {}
            if primeira_metade:
                print(f"      \033[96m↳ Enviando {len(primeira_metade)} scripts para o DeepSeek...\033[0m")
                scripts_traduzidos.update(traduzir_lote_js_com_deepseek(primeira_metade, idioma_alvo))
            if segunda_metade:
                print(f"      \033[96m↳ Enviando {len(segunda_metade)} scripts para a OpenAI...\033[0m")
                scripts_traduzidos.update(traduzir_lote_js_com_openai(segunda_metade, idioma_alvo))
            
            # Reintegra os scripts traduzidos no repositório geral de blocos
            blocos_codigo.update(scripts_traduzidos)
        
        # === 3. TRADUÇÃO DO HTML DIVIDIDO (DEEPSEEK + OPENAI) ===
        print(f"      \033[96m↳ Enviando metade do HTML para o DeepSeek...\033[0m")
        print(f"      \033[96m↳ Enviando metade do HTML para a OpenAI...\033[0m")
        primeira_parte, segunda_parte = dividir_html_em_duas_partes(html_protegido)
        parte_deepseek = traduzir_html_com_deepseek_api(primeira_parte, idioma_alvo)
        parte_openai = traduzir_html_com_openai_api(segunda_parte, idioma_alvo)
        html_traduzido = parte_deepseek + "\n" + parte_openai
        
        # === 4. RESTAURAÇÃO DE SCRIPTS E STYLES ===
        for placeholder, codigo_restaurado in blocos_codigo.items():
            html_traduzido = html_traduzido.replace(placeholder, codigo_restaurado)
            
        return html_traduzido
    except Exception as e:
        print(f"\n❌ Erro na comunicação com a API da OpenAI: {e}")
        return None

if __name__ == "__main__":
    C_AMARELO = '\033[93m'
    C_VERDE   = '\033[92m'
    C_AZUL    = '\033[96m'
    C_ROXO    = '\033[95m'
    RESET     = '\033[0m'

    # =========================================================================
    # 🟢 ÁREA DE CONFIGURAÇÃO DIÁRIA (ALTERE APENAS AQUI) 🟢
    # O processamento agora usa o TRADUTOR v2 (automacoes/translation):
    # envia só os textos para a API, usa memória SQLite, valida a estrutura
    # e aplica os managers (lang, canonical, hreflang, fontes, footer, rotas).
    # =========================================================================
    
    arquivos_originais = ["capurro.html"] 
     
    idiomas_alvo = ["de", "it", "fr", "hi", "zh", "ar", "ja", "ru", "tr", "nl", "pl", "sv", "id", "vi", "uk"]

    MODO_DRY_RUN = False      # True = testa tudo SEM chamar a API nem gravar
    COM_AUDITORIA = True      # relatório pós-tradução (estrutura, pt restante, legado)
    PAUSA_ENTRE_EXECUCOES_SEGUNDOS = 40  # evita rate-limit entre páginas/idiomas

    # =========================================================================

    import sys
    from pathlib import Path

    RAIZ = Path(__file__).resolve().parent.parent
    sys.path.insert(0, str(RAIZ))  # garante o import do pacote v2

    from automacoes.translation import audit, orchestrator

    modo = "dry-run" if MODO_DRY_RUN else "real"
    salvos = 0

    for arquivo_original in arquivos_originais:
        for idioma_alvo in idiomas_alvo:
            print(f"\n{C_AMARELO}======================================================={RESET}")
            print(f"{C_AZUL}▶ ARQUIVO DE ORIGEM: {C_AMARELO}{arquivo_original}{RESET}")
            print(f"{C_AZUL}▶ IDIOMA ALVO:       {C_AMARELO}{idioma_alvo} {C_VERDE}(Destino: ./{idioma_alvo}/){RESET}")
            print(f"{C_AMARELO}======================================================={RESET}\n")

            caminho_fonte = Path(arquivo_original)
            if not caminho_fonte.exists():
                caminho_fonte = RAIZ / arquivo_original
            if not caminho_fonte.exists():
                print(f"{C_AMARELO}Atenção: o arquivo '{arquivo_original}' não foi encontrado na raiz.{RESET}")
                continue

            resultado = orchestrator.traduzir_arquivo(
                caminho_fonte, idioma_alvo, modo=modo,
            )

            print(f"{C_AZUL}[v2]{RESET} {resultado['arquivo']} → {resultado['idioma']} ({modo}): "
                  f"{resultado['unidades_total']} unidades | {resultado['unidades_novas']} novas | "
                  f"{resultado['unidades_em_cache']} em cache | {resultado['lotes']} lotes | "
                  f"{resultado['caracteres_enviados']} chars | estrutura_ok={resultado['estrutura_ok']}")
            if resultado.get("caminho_saida"):
                print(f"{C_VERDE}✅ SUCESSO! Arquivo salvo em: {resultado['caminho_saida']}{RESET}")
                salvos += 1
            if resultado["problemas"]:
                print(f"{C_AMARELO}⚠️ Validação: {resultado['problemas']}{RESET}")

            if COM_AUDITORIA:
                rel = audit.relatorio(
                    resultado["html_final"],
                    caminho_fonte.read_text(encoding="utf-8"),
                    RAIZ / idioma_alvo / caminho_fonte.name,
                )
                audit.imprimir_relatorio(rel)

            is_last_file = (arquivo_original == arquivos_originais[-1])
            is_last_lang = (idioma_alvo == idiomas_alvo[-1])
            if not (is_last_file and is_last_lang):
                print(f"{C_AMARELO}⏳ Pausa de segurança: {PAUSA_ENTRE_EXECUCOES_SEGUNDOS}s...{RESET}")
                time.sleep(PAUSA_ENTRE_EXECUCOES_SEGUNDOS)

    # ---- BUILD AUTOMÁTICO (Tailwind + Service Worker) ----
    if MODO_DRY_RUN:
        print(f"{C_AMARELO}ℹ️ Modo dry-run: build automático pulado.{RESET}")
    else:
        print(f"\n{C_ROXO}▶ INICIANDO BUILD AUTOMÁTICO (Tailwind + Service Worker){RESET}")
        for comando in [
            r".\node_modules\.bin\tailwindcss -i ./src/input.css -o ./public/output.css --minify",
            "node gerar-sw.js",
        ]:
            print(f"{C_AZUL}⚙️ Executando:{RESET} {comando}")
            try:
                subprocess.run(comando, shell=True, check=True, cwd=str(RAIZ))
            except subprocess.CalledProcessError:
                print(f"{C_AMARELO}⚠️ Aviso: o comando falhou: {comando}{RESET}")

    print(f"\n{C_VERDE}🎉 FILA DE TRADUÇÃO CONCLUÍDA (modo v2)! {salvos} arquivo(s) gravado(s).{RESET}")

    # -------------------------------------------------------------------------
    # Abaixo está o MOTOR LEGADO (DeepSeek/OpenAI antigo), mantido apenas como
    # referência. Ele NÃO é mais executado: o processamento v2 acima encerra
    # o script antes deste trecho.
    # -------------------------------------------------------------------------
    sys.exit(0)

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
                html_traduzido = traduzir_html_com_openai(html_preparado, idioma_alvo)
                
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
                        print(f"\n{C_AMARELO}⏳ Pausa de segurança: Aguardando 40 segundos para evitar bloqueios da API...{RESET}")
                        time.sleep(40)
                    # === FIM DA PAUSA DE SEGURANÇA ===
            else:
                print(f"\n{C_AMARELO}Atenção: O arquivo '{arquivo_original}' não foi encontrado na raiz.{RESET}")

    print(f"\n{C_AMARELO}======================================================={RESET}")
    print(f"{C_VERDE}🎉 TODA A FILA DE TRADUÇÃO E BUILDS FOI CONCLUÍDA!{RESET}")
    print(f"{C_AMARELO}======================================================={RESET}\n")