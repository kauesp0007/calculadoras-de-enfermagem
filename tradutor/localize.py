"""
LOCALIZE.PY — Pós-processamento de HTML (Etapa 8)
===================================================
Aplica TODAS as regras de localização do tradutor_inteligente.py:
  - Rotas absolutas
  - Footer padronizado
  - Lang HTML
  - OG:locale, OG:url, OG:image (bandeiras)
  - Twitter:url
  - Canonical
  - Hreflang (swap pt-br ↔ idioma alvo)
  - Fontes específicas (ar, zh, hi, ja, ko)
  - Tradução SEO e Title via DeepSeek
"""

import os
import re
import json
import requests
from dotenv import load_dotenv

# ============================================================
# CONFIGURAÇÃO
# ============================================================

RAIZ_PROJETO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PASTA_TRADUTOR = os.path.dirname(os.path.abspath(__file__))

load_dotenv(os.path.join(RAIZ_PROJETO, ".env"))
CHAVE_DEEPSEEK = os.getenv("DEEPSEEK_API_KEY")

# ============================================================
# LOCALES E MAPAS
# ============================================================

MAPA_LOCALES = {
    "en": "en-US", "es": "es-ES", "fr": "fr-FR", "it": "it-IT",
    "de": "de-DE", "hi": "hi-IN", "zh": "zh-CN", "ja": "ja-JP",
    "ru": "ru-RU", "ko": "ko-KR", "tr": "tr-TR", "nl": "nl-NL",
    "pl": "pl-PL", "sv": "sv-SE", "id": "id-ID", "vi": "vi-VN",
    "uk": "uk-UA", "ar": "ar-SA"
}

MAPA_BANDEIRAS = {
    "en": "bandeira-eua", "es": "bandeira-espanha", "fr": "bandeira-franca",
    "it": "bandeira-italia", "de": "bandeira-alemanha", "hi": "bandeira-india",
    "zh": "bandeira-china", "ja": "bandeira-japao", "ru": "bandeira-russia",
    "ko": "bandeira-coreia-sul", "tr": "bandeira-turquia", "nl": "bandeira-holanda",
    "pl": "bandeira-polonia", "sv": "bandeira-suecia", "id": "bandeira-indonesia",
    "vi": "bandeira-vietna", "uk": "bandeira-ucrania", "ar": "bandeira-arabia-saudita"
}

FONTES_ESPECIFICAS = {
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

# ============================================================
# REGRA 1: FOOTER E ROTAS
# ============================================================

def corrigir_footer(html):
    """Substitui o bloco footer pelo padrão fetch('footer.html')."""
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
    
    return html


def corrigir_rotas(html):
    """Corrige caminhos relativos para absolutos."""
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
    
    return html


# ============================================================
# REGRA 2-3: LANG, OG TAGS
# ============================================================

def corrigir_lang_e_og(html, idioma_alvo):
    """Atualiza lang, og:locale, og:url, twitter:url, og:image."""
    locale_completo = MAPA_LOCALES.get(idioma_alvo, idioma_alvo)
    
    # Lang
    html = re.sub(r'<html\s+lang="pt-BR">', f'<html lang="{locale_completo}">', html, flags=re.IGNORECASE)
    
    # OG:Locale
    og_locale = locale_completo.replace("-", "_")
    html = re.sub(
        r'<meta\s+content="pt_BR"\s+property="og:locale"\s*/?>',
        f'<meta content="{og_locale}" property="og:locale"/>',
        html, flags=re.IGNORECASE
    )
    
    # OG:URL — adiciona /{idioma}/
    html = re.sub(
        r'(<meta\s+content="https://www\.calculadorasdeenfermagem\.com\.br)/([^"]+)("\s+property="og:url"\s*/?>)',
        rf'\1/{idioma_alvo}/\2\3',
        html, flags=re.IGNORECASE
    )
    
    # Twitter:URL
    html = re.sub(
        r'(<meta\s+content="https://www\.calculadorasdeenfermagem\.com\.br)/([^"]+)("\s+name="twitter:url"\s*/?>)',
        rf'\1/{idioma_alvo}/\2\3',
        html, flags=re.IGNORECASE
    )
    
    # OG:Image — bandeira do país
    if idioma_alvo in MAPA_BANDEIRAS:
        html = re.sub(
            r'bandeira-[a-z-]+\.webp',
            f'{MAPA_BANDEIRAS[idioma_alvo]}.webp',
            html, flags=re.IGNORECASE
        )
    
    return html


# ============================================================
# REGRA 4: CANONICAL
# ============================================================

def corrigir_canonical(html, idioma_alvo):
    """Atualiza link canonical para /{idioma}/arquivo."""
    match_canonical = re.search(
        r'<link\s+'
        r'(?=[^>]*\brel="canonical")'
        r'(?=[^>]*\bhref="https://www\.calculadorasdeenfermagem\.com\.br(?:/[a-z]{2}(?:-[A-Z]{2})?)?/([^"]+)")'
        r'[^>]*/?>',
        html, re.IGNORECASE
    )
    if match_canonical:
        filename = match_canonical.group(1)
        novo = f'<link href="https://www.calculadorasdeenfermagem.com.br/{idioma_alvo}/{filename}" rel="canonical"/>'
        html = html[:match_canonical.start()] + novo + html[match_canonical.end():]
    
    return html


# ============================================================
# REGRA 5: HREFLANG
# ============================================================

def corrigir_hreflang(html, idioma_alvo):
    """Swap pt-br ↔ idioma alvo + reordena (alvo primeiro)."""
    padrao_hreflang = re.compile(
        r'<link\s+'
        r'(?=[^>]*\brel="alternate")'
        r'(?=[^>]*\bhreflang="([^"]+)")'
        r'(?=[^>]*\bhref="([^"]+)")'
        r'[^>]*/?>',
        re.IGNORECASE
    )
    hreflang_matches = list(padrao_hreflang.finditer(html))
    
    if not hreflang_matches:
        return html
    
    start_idx = hreflang_matches[0].start()
    end_idx = hreflang_matches[-1].end()
    
    entries = []
    for m in hreflang_matches:
        entries.append({'lang': m.group(1), 'url': m.group(2)})
    
    idx_pt = None
    idx_alvo = None
    for i, e in enumerate(entries):
        if e['lang'].lower() == 'pt-br':
            idx_pt = i
        if e['lang'].lower() == idioma_alvo.lower():
            idx_alvo = i
    
    # SWAP
    if idx_pt is not None and idx_alvo is not None:
        url_pt = entries[idx_pt]['url']
        url_alvo = entries[idx_alvo]['url']
        entries[idx_pt]['lang'] = idioma_alvo
        entries[idx_pt]['url'] = url_alvo
        entries[idx_alvo]['lang'] = 'pt-br'
        entries[idx_alvo]['url'] = url_pt
    
    novas_tags = []
    for e in entries:
        novas_tags.append(f'<link href="{e["url"]}" hreflang="{e["lang"]}" rel="alternate"/>')
    
    # Reordena: idioma alvo primeiro
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
    
    return html


# ============================================================
# REGRA 6: FONTES ESPECÍFICAS
# ============================================================

def corrigir_fontes(html, idioma_alvo):
    """Substitui fontes Inter/Nunito por fontes nativas (ar, zh, hi, ja, ko)."""
    if idioma_alvo not in FONTES_ESPECIFICAS:
        return html
    
    font_info = FONTES_ESPECIFICAS[idioma_alvo]
    
    # CSS @font-face no <style>
    tag_style = r'(<style\s+id="critical-fonts"[^>]*>\s*)'
    if re.search(tag_style, html, re.IGNORECASE):
        html = re.sub(tag_style, rf'\1{font_info["css"]}\n    ', html, count=1, flags=re.IGNORECASE)
    else:
        html = re.sub(
            r'(<style[^>]*>)',
            rf'\1\n    {font_info["css"]}',
            html, count=1, flags=re.IGNORECASE
        )
    
    # Remove @font-face de Inter/Nunito
    html = re.sub(
        r'@font-face\s*\{\s*font-family:\s*[\'"](?:Inter|Nunito Sans|Nunito)[\'"][^\}]+\}\s*',
        '', html, flags=re.IGNORECASE
    )
    
    # Preloads
    padrao_fonte_preload = re.compile(
        r'<link\s+'
        r'(?=[^>]*\brel="preload")'
        r'(?=[^>]*\bhref="[^"]*/(?:inter|nunito)[^"]*")'
        r'[^>]*/?>',
        re.IGNORECASE
    )
    
    matches_fontes = list(padrao_fonte_preload.finditer(html))
    
    if matches_fontes:
        primeiro = matches_fontes[0]
        html = html[:primeiro.start()] + font_info["preload"] + html[primeiro.end():]
        html = padrao_fonte_preload.sub('', html)
        html = re.sub(r'\n\s*\n\s*\n', '\n\n', html)
    else:
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
    
    return html


# ============================================================
# REGRA 7: SEO + TITLE VIA DEEPSEEK
# ============================================================

def traduzir_seo_e_title(html, idioma_alvo):
    """Traduz meta tags SEO e <title> via DeepSeek."""
    if not CHAVE_DEEPSEEK:
        return html
    
    html = _traduzir_meta_seo(html, idioma_alvo)
    html = _traduzir_title(html, idioma_alvo)
    return html


def _traduzir_meta_seo(html, idioma_alvo):
    """Traduz meta description, keywords, og:title, og:description, etc."""
    campos = r'(?:description|keywords|og:title|og:description|og:site_name|twitter:title|twitter:description|author)'
    
    p1 = re.compile(rf'(<meta\s+content=")([^"]+)("[^>]*?(?:name|property)="{campos}"[^>]*/?>)', re.IGNORECASE)
    p2 = re.compile(rf'(<meta\s+(?:name|property)="{campos}"[^>]*?content=")([^"]+)("[^>]*/?>)', re.IGNORECASE)
    
    matches = []
    for p in [p1, p2]:
        for m in p.finditer(html):
            matches.append(m)
    
    seen = set()
    unique_matches = []
    for m in matches:
        if m.start() not in seen:
            seen.add(m.start())
            unique_matches.append(m)
    
    if not unique_matches:
        return html
    
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
    headers = {"Authorization": f"Bearer {CHAVE_DEEPSEEK}", "Content-Type": "application/json"}
    
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
        
        if resultado.startswith("```"):
            resultado = re.sub(r'^```(json)?\n', '', resultado, flags=re.IGNORECASE)
            resultado = re.sub(r'\n```$', '', resultado)
        
        traducoes = json.loads(resultado)
        
        html_modificado = html
        for i, m in reversed(list(enumerate(unique_matches))):
            chave = f"t{i}"
            if chave in traducoes:
                novo_texto = traducoes[chave].replace('"', "'")
                bloco_novo = m.group(1) + novo_texto + m.group(3)
                html_modificado = html_modificado[:m.start()] + bloco_novo + html_modificado[m.end():]
        
        return html_modificado
    except Exception as e:
        print(f"      ⚠️ SEO via DeepSeek falhou (mantendo original): {e}")
        return html


def _traduzir_title(html, idioma_alvo):
    """Traduz a tag <title>."""
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
    headers = {"Authorization": f"Bearer {CHAVE_DEEPSEEK}", "Content-Type": "application/json"}
    
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
        
        return html[:title_match.start()] + f"<title>{texto_traduzido}</title>" + html[title_match.end():]
    except Exception as e:
        print(f"      ⚠️ Title via DeepSeek falhou (mantendo original): {e}")
        return html


# ============================================================
# PIPELINE COMPLETO DE LOCALIZAÇÃO
# ============================================================

def localizar_html(html, idioma_alvo):
    """
    Aplica TODAS as regras de localização no HTML traduzido.
    Ordem: rotas → footer → lang/og → canonical → hreflang → fontes → seo/title
    """
    print(f"  🔧 [8/8] Aplicando regras de localização...")
    
    html = corrigir_rotas(html)
    html = corrigir_footer(html)
    html = corrigir_lang_e_og(html, idioma_alvo)
    html = corrigir_canonical(html, idioma_alvo)
    html = corrigir_hreflang(html, idioma_alvo)
    html = corrigir_fontes(html, idioma_alvo)
    html = traduzir_seo_e_title(html, idioma_alvo)
    
    print(f"  ✅ Localização concluída.")
    return html


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 3:
        print("Uso: python localize.py <arquivo.html> <idioma>")
        sys.exit(1)
    
    arquivo = sys.argv[1]
    idioma = sys.argv[2]
    
    caminho = os.path.join(PASTA_TRADUTOR, "output", idioma, arquivo)
    if not os.path.exists(caminho):
        print(f"Arquivo não encontrado: {caminho}")
        sys.exit(1)
    
    with open(caminho, 'r', encoding='utf-8') as f:
        html = f.read()
    
    html_localizado = localizar_html(html, idioma)
    
    with open(caminho, 'w', encoding='utf-8') as f:
        f.write(html_localizado)
    
    print(f"✅ {arquivo} localizado para {idioma}")
