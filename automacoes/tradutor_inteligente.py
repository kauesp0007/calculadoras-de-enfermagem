import os
import subprocess
from datetime import datetime
from dotenv import load_dotenv
import deepl
from deepl.exceptions import QuotaExceededException, TooManyRequestsException
import re
import sys

# Adiciona diretório atual ao path para importar o módulo IA
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    from tradutor_html_ia import traduzir_html_completo as _traduzir_html_via_ia
    _IA_DISPONIVEL = True
except ImportError:
    _IA_DISPONIVEL = False
    print("⚠️ Módulo tradutor_html_ia.py não encontrado. Fallback IA indisponível.")
import requests
import json
import time

# Carrega a chave do arquivo .env silenciosamente
load_dotenv()

CHAVE_API = os.getenv("DEEPL_API_KEY")
CHAVE_DEEPSEEK = os.getenv("DEEPSEEK_API_KEY")
CHAVE_OPENAI = os.getenv("OPENAI_API_KEY")
if not CHAVE_API:
    raise ValueError("Chave da API não encontrada. Verifique se o arquivo .env existe e contém a DEEPL_API_KEY.")
if not CHAVE_DEEPSEEK:
    raise ValueError("Chave do DeepSeek não encontrada. Adicione DEEPSEEK_API_KEY no arquivo .env para traduzir os scripts dinâmicos.")

def traduzir_meta_seo_com_deepseek(html, idioma_alvo):
    """
    Isola os conteúdos das tags de SEO e traduz de forma independente usando o DeepSeek,
    garantindo adaptação cultural e de palavras-chave.
    Funciona com content="..." antes OU depois de name/property="..." (formato XHTML).
    """
    campos = r'(?:description|keywords|og:title|og:description|og:site_name|twitter:title|twitter:description|author)'
    
    # Padrão 1: content="..." ... name|property="campo" (formato XHTML mais comum)
    p1 = re.compile(rf'(<meta\s+content=")([^"]+)("[^>]*?(?:name|property)="{campos}"[^>]*/?>)', re.IGNORECASE)
    # Padrão 2: name|property="campo" ... content="..." (formato alternativo)
    p2 = re.compile(rf'(<meta\s+(?:name|property)="{campos}"[^>]*?content=")([^"]+)("[^>]*/?>)', re.IGNORECASE)
    
    matches = []
    for p in [p1, p2]:
        for m in p.finditer(html):
            matches.append(m)
    
    # Remove duplicatas (mesma posição no HTML)
    seen = set()
    unique_matches = []
    for m in matches:
        if m.start() not in seen:
            seen.add(m.start())
            unique_matches.append(m)
    
    if not unique_matches:
        return html
        
    # Extrai os textos em PT para um dicionário (JSON)
    dict_textos = {f"t{i}": m.group(2) for i, m in enumerate(unique_matches)}
    
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
        "model": "deepseek-v4-pro",
        "messages": [
            {"role": "system", "content": instrucoes},
            {"role": "user", "content": json.dumps(dict_textos, ensure_ascii=False)}
        ],
        "temperature": 0.1,
        "response_format": {"type": "json_object"}
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=45)
        response.raise_for_status()
        resultado = response.json()["choices"][0]["message"]["content"].strip()
        
        # Limpeza caso deepseek envie markdown
        if resultado.startswith("```"):
            resultado = re.sub(r'^```(json)?\n', '', resultado, flags=re.IGNORECASE)
            resultado = re.sub(r'\n```$', '', resultado)
            
        traducoes = json.loads(resultado)
        
        # Substitui no HTML original (de trás para frente para não afetar os índices)
        html_modificado = html
        for i, m in reversed(list(enumerate(unique_matches))):
            chave = f"t{i}"
            if chave in traducoes:
                novo_texto = traducoes[chave].replace('"', "'") # Proteção contra aspas acidentais no HTML
                bloco_novo = m.group(1) + novo_texto + m.group(3)
                html_modificado = html_modificado[:m.start()] + bloco_novo + html_modificado[m.end():]
                
        return html_modificado
    except requests.HTTPError as e:
        detalhe = e.response.text[:500] if e.response is not None else ""
        print(f"\n⚠️ Erro ao adaptar SEO com DeepSeek (mantendo SEO original): {e}. {detalhe}")
        return html
    except Exception as e:
        print(f"\n⚠️ Erro ao adaptar SEO com DeepSeek (mantendo SEO original): {e}")
        return html


def traduzir_title_tag(html, idioma_alvo):
    """
    Traduz APENAS a tag <title> do <head> usando DeepSeek.
    Função isolada para não interferir na tradução dos meta tags SEO.
    """
    title_match = re.search(r'<title>([^<]+)</title>', html, re.IGNORECASE)
    if not title_match:
        return html
    
    texto_original = title_match.group(1)
    
    instrucoes = f"""
    Traduza o seguinte título de página do Português para o idioma '{idioma_alvo}'.
    Área: saúde/enfermagem. Use nomenclatura médica e siglas do idioma alvo.
    RETORNE APENAS o texto traduzido, sem aspas, sem explicações.
    """
    
    url = "https://api.deepseek.com/chat/completions"
    headers = {
        "Authorization": f"Bearer {CHAVE_DEEPSEEK}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "deepseek-v4-pro",
        "messages": [
            {"role": "system", "content": instrucoes},
            {"role": "user", "content": texto_original}
        ],
        "temperature": 0.1
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=45)
        response.raise_for_status()
        texto_traduzido = response.json()["choices"][0]["message"]["content"].strip()
        texto_traduzido = texto_traduzido.replace('"', "'")
        
        html_mod = html[:title_match.start()] + f"<title>{texto_traduzido}</title>" + html[title_match.end():]
        return html_mod
    except requests.HTTPError as e:
        detalhe = e.response.text[:500] if e.response is not None else ""
        print(f"      ⚠️ Title não traduzido (mantendo original): {e}. {detalhe}")
        return html
    except Exception as e:
        print(f"      ⚠️ Title não traduzido (mantendo original): {e}")
        return html


def mesclar_traducao(html_localizado, html_traduzido):
    """
    Mantém o body já traduzido do arquivo existente, mas:
    1. Substitui o <head> pelo novo (SEO, title, canonical, hreflang atualizados)
    2. Injeta os scripts inline traduzidos do html_traduzido no body existente
    """
    # --- Extrai <head> do html_traduzido ---
    head_novo = re.search(r'<head\b[^>]*>.*?</head>', html_traduzido, re.IGNORECASE | re.DOTALL)
    head_antigo = re.search(r'<head\b[^>]*>.*?</head>', html_localizado, re.IGNORECASE | re.DOTALL)
    
    if not head_novo or not head_antigo:
        return html_localizado
    
    # 1. Substitui o <head>
    resultado = (
        html_localizado[:head_antigo.start()]
        + head_novo.group(0)
        + html_localizado[head_antigo.end():]
    )
    
    # 2. Encontra scripts inline (sem src) no html_traduzido e no html_localizado
    padrao_script = re.compile(r'(<script\b(?!.*\bsrc=)[^>]*>)(.*?)(</script>)', re.IGNORECASE | re.DOTALL)
    
    scripts_traduzidos = list(padrao_script.finditer(html_traduzido))
    scripts_localizados = list(padrao_script.finditer(resultado))
    
    # Substitui de trás para frente para preservar índices
    for s_trad, s_loc in zip(reversed(scripts_traduzidos), reversed(scripts_localizados)):
        if s_trad.group(2).strip() != s_loc.group(2).strip():
            # Scripts diferentes → injeta a versão traduzida
            resultado = (
                resultado[:s_loc.start()]
                + s_trad.group(0)
                + resultado[s_loc.end():]
            )
    
    return resultado

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
    # 2.1 ATUALIZAR OG:LOCALE, OG:URL E OUTRAS METAS FIXAS
    # ==========================================
    og_locale = locale_completo.replace("-", "_")  # hi-IN → hi_IN
    html = re.sub(
        r'<meta\s+content="pt_BR"\s+property="og:locale"\s*/?>',
        f'<meta content="{og_locale}" property="og:locale"/>',
        html, flags=re.IGNORECASE
    )
    # Atualiza og:url com o caminho do idioma
    html = re.sub(
        r'(<meta\s+content="https://www\.calculadorasdeenfermagem\.com\.br)/([^"]+)("\s+property="og:url"\s*/?>)',
        rf'\1/{idioma_alvo}/\2\3',
        html, flags=re.IGNORECASE
    )
    # Atualiza twitter:url se existir
    html = re.sub(
        r'(<meta\s+content="https://www\.calculadorasdeenfermagem\.com\.br)/([^"]+)("\s+name="twitter:url"\s*/?>)',
        rf'\1/{idioma_alvo}/\2\3',
        html, flags=re.IGNORECASE
    )
    # Atualiza og:image para usar a bandeira correta do idioma
    mapa_bandeiras = {
        "en": "bandeira-eua", "es": "bandeira-espanha", "fr": "bandeira-franca",
        "it": "bandeira-italia", "de": "bandeira-alemanha", "hi": "bandeira-india",
        "zh": "bandeira-china", "ja": "bandeira-japao", "ru": "bandeira-russia",
        "ko": "bandeira-coreia-sul", "tr": "bandeira-turquia", "nl": "bandeira-holanda",
        "pl": "bandeira-polonia", "sv": "bandeira-suecia", "id": "bandeira-indonesia",
        "vi": "bandeira-vietna", "uk": "bandeira-ucrania", "ar": "bandeira-arabia-saudita"
    }
    if idioma_alvo in mapa_bandeiras:
        html = re.sub(
            r'bandeira-[a-z-]+\.webp',
            f'{mapa_bandeiras[idioma_alvo]}.webp',
            html, flags=re.IGNORECASE
        )

    # ==========================================
    # 3. ATUALIZAR LINK CANONICAL (ordem-independente, XHTML/HTML)
    # ==========================================
    # Lookaheads: encontra canonical com href="..." e rel="canonical" em qualquer ordem
    match_canonical = re.search(
        r'<link\s+'
        r'(?=[^>]*\brel="canonical")'
        r'(?=[^>]*\bhref="https://www\.calculadorasdeenfermagem\.com\.br(?:/[a-z]{2}(?:-[A-Z]{2})?)?/([^"]+)")'
        r'[^>]*/?>',
        html, re.IGNORECASE
    )
    if match_canonical:
        filename = match_canonical.group(1)
        novo_canonical = f'<link href="https://www.calculadorasdeenfermagem.com.br/{idioma_alvo}/{filename}" rel="canonical"/>'
        html = html[:match_canonical.start()] + novo_canonical + html[match_canonical.end():]

    # ==========================================
    # 4. HREFLANG: SWAP INTELIGENTE + REORDENACAO (ordem-independente)
    # ==========================================
    # Estrategia:
    #   1. A tag pt-br (URL em portugues) vira o idioma alvo (URL traduzida)
    #   2. A tag do idioma alvo (ja existente) vira pt-br (URL em portugues)
    #   3. Resultado: idioma alvo primeiro, sem duplicidade
    # Regex com lookaheads: hreflang, href e rel="alternate" em QUALQUER ordem
    padrao_hreflang = re.compile(
        r'<link\s+'
        r'(?=[^>]*\brel="alternate")'
        r'(?=[^>]*\bhreflang="([^"]+)")'
        r'(?=[^>]*\bhref="([^"]+)")'
        r'[^>]*/?>',
        re.IGNORECASE
    )
    hreflang_matches = list(padrao_hreflang.finditer(html))
    
    if hreflang_matches:
        start_idx = hreflang_matches[0].start()
        end_idx = hreflang_matches[-1].end()
        
        # Parse todas as entradas: lang, url
        entries = []
        for m in hreflang_matches:
            entries.append({'lang': m.group(1), 'url': m.group(2)})
        
        # Encontra pt-br e idioma alvo
        idx_pt = None
        idx_alvo = None
        for i, e in enumerate(entries):
            if e['lang'].lower() == 'pt-br':
                idx_pt = i
            if e['lang'].lower() == idioma_alvo.lower():
                idx_alvo = i
        
        # SWAP: troca idiomas e URLs entre pt-br e idioma alvo
        if idx_pt is not None and idx_alvo is not None:
            url_pt = entries[idx_pt]['url']
            url_alvo = entries[idx_alvo]['url']
            entries[idx_pt]['lang'] = idioma_alvo
            entries[idx_pt]['url'] = url_alvo
            entries[idx_alvo]['lang'] = 'pt-br'
            entries[idx_alvo]['url'] = url_pt
        
        # Reconstrói todas as tags com formato consistente
        novas_tags = []
        for e in entries:
            novas_tags.append(
                f'<link href="{e["url"]}" hreflang="{e["lang"]}" rel="alternate"/>'
            )
        
        # Reordena: idioma alvo PRIMEIRO
        tag_alvo_str = None
        tags_restantes = []
        for tag in novas_tags:
            if f'hreflang="{idioma_alvo}"' in tag.lower():
                tag_alvo_str = tag
            else:
                tags_restantes.append(tag)
        
        tags_finais = [tag_alvo_str] + tags_restantes if tag_alvo_str else novas_tags
        bloco_novo = "\n    ".join(tags_finais)
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
        font_info = fontes_especificas[idioma_alvo]
        
        # === PARTE 1: CSS @font-face no <style id="critical-fonts"> ===
        tag_style = r'(<style\s+id="critical-fonts"[^>]*>\s*)'
        if re.search(tag_style, html, re.IGNORECASE):
            html = re.sub(tag_style, rf'\1{font_info["css"]}\n    ', html, count=1, flags=re.IGNORECASE)
        else:
            html = re.sub(
                r'(<style[^>]*>)',
                rf'\1\n    {font_info["css"]}',
                html, count=1, flags=re.IGNORECASE
            )
        
        # Remove @font-face originais de Inter e Nunito do CSS
        html = re.sub(
            r'@font-face\s*\{\s*font-family:\s*[\'"](?:Inter|Nunito Sans|Nunito)[\'"][^\}]+\}\s*',
            '', html, flags=re.IGNORECASE
        )

        # === PARTE 2: Preloads — SUBSTITUIÇÃO CIRÚRGICA NO LOCAL EXATO ===
        # Regex com lookaheads: encontra <link> com rel="preload" E href="...inter/nunito..."
        # em QUALQUER ordem de atributos (compatível com todos os formatos HTML/XHTML)
        padrao_fonte_preload = re.compile(
            r'<link\s+'
            r'(?=[^>]*\brel="preload")'           # lookahead: tem rel="preload"
            r'(?=[^>]*\bhref="[^"]*/(?:inter|nunito)[^"]*")'  # lookahead: href aponta para Inter/Nunito
            r'[^>]*/?>',                           # consome a tag inteira
            re.IGNORECASE
        )
        
        # Encontra TODOS os preloads de fontes Inter/Nunito no HTML
        matches_fontes = list(padrao_fonte_preload.finditer(html))
        
        if matches_fontes:
            # Estratégia: substitui o PRIMEIRO match pelos novos preloads,
            # depois remove TODOS os demais (incluindo o primeiro que já foi substituído)
            
            # 1. Substitui o primeiro preload antigo pelos novos
            primeiro = matches_fontes[0]
            html = html[:primeiro.start()] + font_info["preload"] + html[primeiro.end():]
            
            # 2. Re-escaneia e remove TODOS os preloads de Inter/Nunito restantes
            # (o primeiro já foi substituído, então só os outros serão encontrados)
            html = padrao_fonte_preload.sub('', html)
            
            # 3. Remove linhas em branco duplicadas que possam ter ficado
            html = re.sub(r'\n\s*\n\s*\n', '\n\n', html)
        else:
            # Fallback absoluto: se não encontrou por lookaheads, tenta regex simples
            # que captura href="/fonts/inter/..." ou href="/fonts/nunito/..."
            padrao_fallback = re.compile(
                r'<link\s+[^>]*href="[^"]*/(?:inter|nunito)[^"]*"[^>]*/?>',
                re.IGNORECASE
            )
            matches_fallback = list(padrao_fallback.finditer(html))
            if matches_fallback:
                primeiro = matches_fallback[0]
                html = html[:primeiro.start()] + font_info["preload"] + html[primeiro.end():]
                html = padrao_fallback.sub('', html)
                html = re.sub(r'\n\s*\n\s*\n', '\n\n', html)

    # ==========================================
    # 6. TRADUZIR META TAGS SEO CIRURGICAMENTE
    # ==========================================
    html = traduzir_meta_seo_com_deepseek(html, idioma_alvo)

    # ==========================================
    # 7. TRADUZIR TAG TITLE (isolado, sem interferir no SEO)
    # ==========================================
    html = traduzir_title_tag(html, idioma_alvo)

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
        padrao_string = re.compile(r'"([^"\\]*(?:\\.[^"\\]*)*)"|\'([^\'\\]*(?:\\.[^\'\\]*)*)\'')
        
        novo_codigo_js = codigo_js
        mapeamento_scripts[id_script] = []

        for match in padrao_string.finditer(codigo_js):
            # Novo regex: grupo 1 = conteúdo entre aspas duplas, grupo 2 = conteúdo entre aspas simples
            if match.group(1) is not None:
                delimitador = '"'
                conteudo = match.group(1)
            else:
                delimitador = "'"
                conteudo = match.group(2)
            
            # Filtro de segurança: só traduz se parecer texto legível (tem espaços, não é um caminho/ID)
            if len(conteudo) > 3 and " " in conteudo and not conteudo.startswith(('/', '#', '.', 'data-')) and not conteudo.endswith('.html'):
                id_string = f"STR_{contador_string}"
                strings_para_traduzir[id_string] = conteudo
                mapeamento_scripts[id_script].append({
                    'original': match.group(0), # A string completa com as aspas
                    'id': id_string,
                    'delimitador': delimitador,
                    'tipo': 'string',
                })
                contador_string += 1

        # === Extração de TEMPLATE LITERALS (crases `...`) ===
        # Template literals contêm texto em português + ${interpolacoes}
        # Extrai apenas o texto fora de ${...}, preservando interpolações
        padrao_template = re.compile(r'`([^`]*)`')
        for match_tmpl in padrao_template.finditer(codigo_js):
            conteudo = match_tmpl.group(1)
            if not conteudo.strip():
                continue
            
            # Encontra todas as interpolações ${...}
            interps = re.findall(r'\$\{[^}]+\}', conteudo)
            
            # Substitui cada interpolação por um placeholder único
            texto_limpo = conteudo
            for i, interp in enumerate(interps):
                texto_limpo = texto_limpo.replace(interp, f'__INTERP_{i}__', 1)
            
            # Verifica se tem texto traduzível (letras + fora de interpolações)
            tem_texto = bool(re.search(r'[a-zA-ZÀ-ÿ]', re.sub(r'__INTERP_\d+__', '', texto_limpo)))
            if not tem_texto:
                continue
            
            id_string = f"STR_{contador_string}"
            strings_para_traduzir[id_string] = texto_limpo
            mapeamento_scripts[id_script].append({
                'original': match_tmpl.group(0),
                'id': id_string,
                'delimitador': '`',
                'tipo': 'template',
                'interpolacoes': interps,
            })
            contador_string += 1

    if not strings_para_traduzir:
        print(f"      ↳ Nenhuma string de texto legível encontrada no JS ({len(dicionario_scripts)} scripts). Mantendo original.")
        return dicionario_scripts

    print(f"      ↳ Enviando {len(strings_para_traduzir)} fragmentos de texto do JS para o DeepSeek...")

    # 2. Comunicação com o DeepSeek (Apenas as strings!)
    instrucoes_sistema = f"""
    Você é um tradutor especializado em localização de interfaces para a área da saúde/enfermagem.
    Traduza as mensagens/textos do Português para o idioma '{idioma_alvo}'.
    
    REGRAS DE LOCALIZAÇÃO:
    - Use linguagem natural e culturalmente apropriada para falantes nativos do país de destino. Evite traduções literais.
    - Adapte expressões para a forma como são realmente utilizadas por profissionais de saúde no país correspondente.
    - Utilize nomenclatura médica, termos técnicos e siglas padronizadas no idioma alvo.
    - Preserve o significado clínico original de cada termo.
    
    REGRAS CRÍTICAS:
    1. Retorne APENAS o JSON válido. Sem explicações, sem blocos markdown (```json).
    2. As chaves do JSON (STR_0, STR_1...) DEVEM ser mantidas intactas.
    3. Traduza o valor. Mantenha eventuais pontuações finais, mas NÃO adicione aspas extras.
    4. Placeholders como __INTERP_0__, __INTERP_1__ etc DEVEM ser mantidos EXATAMENTE como estão.
       Eles representam variáveis JavaScript (${{...}}) e NÃO devem ser traduzidos ou alterados.
    5. Preserve tags HTML dentro do texto (ex: <strong>, <em>, <br>). Traduza APENAS o texto ao redor.
    """
    
    url = "https://api.deepseek.com/chat/completions"
    headers = {
        "Authorization": f"Bearer {CHAVE_DEEPSEEK}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "deepseek-v4-flash",
        "messages": [
            {"role": "system", "content": instrucoes_sistema},
            {"role": "user", "content": json.dumps(strings_para_traduzir, ensure_ascii=False)}
        ],
        "temperature": 0.0
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=60)
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
                    if item.get('tipo') == 'template':
                        # Template literal: restaura interpolações ${...} nos placeholders
                        texto_final = texto_traduzido
                        for i, interp in enumerate(item.get('interpolacoes', [])):
                            texto_final = texto_final.replace(f'__INTERP_{i}__', interp, 1)
                        string_final = f"`{texto_final}`"
                    else:
                        # String normal: protege aspas e reconstrói
                        texto_traduzido = texto_traduzido.replace(item['delimitador'], f"\\{item['delimitador']}")
                        string_final = f"{item['delimitador']}{texto_traduzido}{item['delimitador']}"
                    
                    codigo_reconstruido = codigo_reconstruido.replace(item['original'], string_final, 1)
            
            retorno_seguro[id_script] = codigo_reconstruido
            
        return retorno_seguro

    except json.JSONDecodeError as e:
        print(f"\n❌ ERRO DE JSON DO DEEPSEEK: O modelo quebrou a formatação.")
        print(f"Resposta bruta da IA: {resultado[:300]}...")
        return dicionario_scripts
    except Exception as e:
        print(f"\n⚠️ Erro geral ao traduzir scripts com DeepSeek: {e}")
        return dicionario_scripts

def _extrair_blocos_script_style(html):
    """Extrai blocos <script>...</script> e <style>...</style> usando busca posicional (sem regex).
    Imune a <script>/</script> literais dentro de strings JavaScript.
    Retorna lista de (inicio, fim, tag_name)."""
    blocos = []
    i = 0
    while i < len(html):
        pos_script = html.find('<script', i)
        pos_style = html.find('<style', i)
        
        pos = -1
        tag = ''
        if pos_script != -1 and (pos_style == -1 or pos_script < pos_style):
            pos = pos_script
            tag = 'script'
        elif pos_style != -1:
            pos = pos_style
            tag = 'style'
        
        if pos == -1:
            break
        
        fim_abertura = html.find('>', pos)
        if fim_abertura == -1:
            i = pos + 1
            continue
        
        tag_abertura = html[pos:fim_abertura + 1]
        if '/>' in tag_abertura:
            i = fim_abertura + 1
            continue
        
        fechamento = f'</{tag}>'
        fim_fechamento = html.find(fechamento, fim_abertura + 1)
        if fim_fechamento == -1:
            i = fim_abertura + 1
            continue
        
        fim_total = fim_fechamento + len(fechamento)
        blocos.append((pos, fim_total, tag))
        i = fim_total
    
    return blocos

def traduzir_html_com_deepl(html_preparado, idioma_alvo):
    """
    ⚡ MODO RÁPIDO: O HTML estático já está traduzido nas pastas de idioma.
    Apenas traduz o JavaScript inline e restaura. NÃO chama DeepL nem fallback IA.
    """
    try:
        # === 1. PROTEÇÃO CIRÚRGICA DE SCRIPTS E STYLES (parser posicional, sem regex) ===
        blocos_codigo = {}
        scripts_para_traduzir = {}
        
        blocos_encontrados = _extrair_blocos_script_style(html_preparado)
        
        # Processa de trás para frente para preservar índices
        for idx_bloco, (inicio, fim, tag_name) in enumerate(reversed(blocos_encontrados)):
            codigo_original = html_preparado[inicio:fim]
            
            id_bloco = f"DEEPL_BLOCK_{len(blocos_encontrados) - 1 - idx_bloco}"
            placeholder = f'<div translate="no" id="{id_bloco}"></div>'
            
            # Extrai apenas a tag de abertura para verificar src=
            fim_tag = codigo_original.find('>')
            tag_abertura = codigo_original[:fim_tag + 1] if fim_tag != -1 else codigo_original
            
            if tag_name == 'script' and 'src=' not in tag_abertura.lower():
                scripts_para_traduzir[placeholder] = codigo_original
            else:
                blocos_codigo[placeholder] = codigo_original
            
            html_preparado = html_preparado[:inicio] + placeholder + html_preparado[fim:]
        
        # === 2. PROCESSAMENTO DEEPSEEK EM LOTE (BATCH) - APENAS JS INLINE ===
        if scripts_para_traduzir:
            print(f"      \033[96m↳ Enviando lógicas Javascript em LOTE único para o DeepSeek...\033[0m")
            scripts_traduzidos = traduzir_lote_js_com_deepseek(scripts_para_traduzir, idioma_alvo)
            blocos_codigo.update(scripts_traduzidos)
        
        # === 3. HTML ESTÁTICO JÁ TRADUZIDO - PULA DeepL/IA ===
        print(f"      \033[92m↳ HTML estático já traduzido. Pulando DeepL/IA.\033[0m")
        
        # === 4. RESTAURAÇÃO DE SCRIPTS E STYLES ===
        html_final = html_preparado
        for placeholder, codigo_restaurado in blocos_codigo.items():
            html_final = html_final.replace(placeholder, codigo_restaurado)
            
        return html_final
    except Exception as e:
        print(f"\n❌ Erro no processamento: {type(e).__name__}: {e}")
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
    
    arquivos_originais = ["rancholosamigos.html"] 
    idiomas_alvo = ["es"] 
    
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

                    # Preserva body traduzido + atualiza head + injeta scripts inline traduzidos
                    if os.path.exists(caminho_saida):
                        with open(caminho_saida, 'r', encoding='utf-8') as f:
                            html_localizado = f.read()
                        html_traduzido = mesclar_traducao(html_localizado, html_traduzido)
                    
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
                        print(f"\n{C_AMARELO}⏳ Pausa de segurança: Aguardando 25 segundos para evitar bloqueios da API...{RESET}")
                        time.sleep(25)
                    # === FIM DA PAUSA DE SEGURANÇA ===
            else:
                print(f"\n{C_AMARELO}Atenção: O arquivo '{arquivo_original}' não foi encontrado na raiz.{RESET}")

    print(f"\n{C_AMARELO}======================================================={RESET}")
    print(f"{C_VERDE}🎉 TODA A FILA DE TRADUÇÃO E BUILDS FOI CONCLUÍDA!{RESET}")
    print(f"{C_AMARELO}======================================================={RESET}\n")