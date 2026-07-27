import os
import re
import time
import json
import subprocess
from datetime import datetime
from dotenv import load_dotenv
from openai import OpenAI

# =========================================================================
# 🟢 1. ÁREA DE CONFIGURAÇÃO DIÁRIA (ALTERE APENAS AQUI) 🟢
# =========================================================================

# Arquivos que você quer traduzir (coloque um ou vários)
ARQUIVOS_PARA_TRADUZIR = [
    "fast.html"
]

# Idiomas de destino
IDIOMAS_ALVO = [
    "en", "es", "fr", "it", "de", "hi", "zh", "ar", 
    "ja", "ru", "ko", "tr", "nl", "pl", "sv", "id", "vi", "uk"
]

# Limites de Tokens / Blocos (Ajuste se necessário)
LIMITE_ITENS_JSON = 30 # Quantas strings JS/HTML traduzir por vez no Lote

# Dicionário para forçar a IA a entender o idioma corretamente
NOMES_IDIOMAS = {
    "en": "Inglês (Americano)", "es": "Espanhol", "fr": "Francês",
    "it": "Italiano", "de": "Alemão", "hi": "Hindi", "zh": "Chinês (Mandarim)",
    "ja": "Japonês", "ru": "Russo", "ko": "Coreano", "ar": "Árabe",
    "tr": "Turco", "nl": "Holandês", "pl": "Polonês", "sv": "Sueco",
    "id": "Indonésio", "vi": "Vietnamita", "uk": "Ucraniano"
}

# =========================================================================
# 2. CONFIGURAÇÃO DE APIS E CORES
# =========================================================================
load_dotenv()

client_openai = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
client_deepseek = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com" # Sem /v1 conforme doc oficial
)

C_AZUL = "\033[94m"
C_VERDE = "\033[92m"
C_AMARELO = "\033[93m"
C_VERMELHO = "\033[91m"
C_ROXO = "\033[95m"
RESET = "\033[0m"

# Load balancer (Round-Robin)
_provedor_atual_idx = 0

# =========================================================================
# 3. SISTEMA DE FALLBACK E LOAD BALANCER
# =========================================================================
def chamar_ia_com_fallback(instrucao_sistema, conteudo_usuario, is_json=False):
    global _provedor_atual_idx
    tentativas = 10
    espera_erro = 10
    
    provedores = [
        {"nome": "OpenAI", "client": client_openai, "modelo": "gpt-4o"},
        {"nome": "DeepSeek", "client": client_deepseek, "modelo": "deepseek-v4-pro"}
    ]

    prompt_texto = json.dumps(conteudo_usuario, ensure_ascii=False) if is_json else conteudo_usuario
    idx_inicial = _provedor_atual_idx
    _provedor_atual_idx = (_provedor_atual_idx + 1) % len(provedores)

    for tentativa in range(1, tentativas + 1):
        idx_tentativa = (idx_inicial + tentativa - 1) % len(provedores)
        provedor_atual = provedores[idx_tentativa]
        
        cliente = provedor_atual["client"]
        modelo = provedor_atual["modelo"]
        nome_api = provedor_atual["nome"]

        print(f"        {C_ROXO}⟳ Tentativa {tentativa}/{tentativas} via {nome_api}...{RESET}", end="\r")

        try:
            kwargs = {
                "model": modelo,
                "messages": [
                    {"role": "system", "content": instrucao_sistema},
                    {"role": "user", "content": prompt_texto}
                ],
                "temperature": 0.1
            }
            if is_json: kwargs["response_format"] = {"type": "json_object"}

            response = cliente.chat.completions.create(**kwargs)
            resultado = response.choices[0].message.content.strip()
            
            print(f"        {C_VERDE}✓ Sucesso via {nome_api}!{RESET}                           ")
            
            if is_json:
                resultado = re.sub(r'^```(json|html)?\s*', '', resultado, flags=re.IGNORECASE)
                resultado = re.sub(r'\s*```$', '', resultado)
                return json.loads(resultado)
            else:
                return resultado

        except Exception as e:
            print(f"        {C_VERMELHO}✗ Erro no {nome_api}: {e}{RESET}")
            if tentativa < tentativas:
                print(f"        {C_AMARELO}Aguardando {espera_erro}s para o fallback...{RESET}")
                time.sleep(espera_erro)
            else:
                print(f"        {C_VERMELHO}🚨 Falha crítica após 10 tentativas.{RESET}")
                return conteudo_usuario

# =========================================================================
# 4. CHUNKING
# =========================================================================
def dividir_dicionario(dicionario, tamanho_lote):
    itens = list(dicionario.items())
    return [dict(itens[i:i + tamanho_lote]) for i in range(0, len(itens), tamanho_lote)]

# =========================================================================
# 5. REGRAS E LÓGICAS (BLINDAGEM HTML)
# =========================================================================
def preparar_html_para_traducao_texto(html, idioma_alvo):
    # 1. SUBSTITUIÇÃO CIRÚRGICA DO FOOTER
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

    idx_inicio = html.rfind('<div id="footer-placeholder"></div>')
    if idx_inicio != -1:
        idx_fim = html.find('</script>', idx_inicio)
        if idx_fim != -1:
            idx_fim += 9
            html = html[:idx_inicio] + footer_novo + html[idx_fim:]

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
    for antigo, novo in regras_rotas.items(): html = html.replace(antigo, novo)

    mapa_locales = {
        "en": "en-US", "es": "es-ES", "fr": "fr-FR", "it": "it-IT", "de": "de-DE",
        "hi": "hi-IN", "zh": "zh-CN", "ja": "ja-JP", "ru": "ru-RU", "ko": "ko-KR",
        "tr": "tr-TR", "nl": "nl-NL", "pl": "pl-PL", "sv": "sv-SE", "id": "id-ID",
        "vi": "vi-VN", "uk": "uk-UA", "ar": "ar-SA"
    }
    locale_completo = mapa_locales.get(idioma_alvo, idioma_alvo)
    html = re.sub(r'<html\s+lang="pt-BR">', f'<html lang="{locale_completo}">', html, flags=re.IGNORECASE)
    
    if idioma_alvo == "ar": html = html.replace(f'<html lang="{locale_completo}">', f'<html lang="{locale_completo}" dir="rtl">')

    og_locale = locale_completo.replace("-", "_")
    html = re.sub(r'<meta\s+content="pt_BR"\s+property="og:locale"\s*/?>', f'<meta content="{og_locale}" property="og:locale"/>', html, flags=re.IGNORECASE)
    html = re.sub(r'(<meta\s+content="https://www\.calculadorasdeenfermagem\.com\.br)/([^"]+)("\s+property="og:url"\s*/?>)', rf'\1/{idioma_alvo}/\2\3', html, flags=re.IGNORECASE)
    html = re.sub(r'(<meta\s+content="https://www\.calculadorasdeenfermagem\.com\.br)/([^"]+)("\s+name="twitter:url"\s*/?>)', rf'\1/{idioma_alvo}/\2\3', html, flags=re.IGNORECASE)

    mapa_bandeiras = {
        "en": "bandeira-eua", "es": "bandeira-espanha", "fr": "bandeira-franca",
        "it": "bandeira-italia", "de": "bandeira-alemanha", "hi": "bandeira-india",
        "zh": "bandeira-china", "ja": "bandeira-japao", "ru": "bandeira-russia",
        "ko": "bandeira-coreia-sul", "tr": "bandeira-turquia", "nl": "bandeira-holanda",
        "pl": "bandeira-polonia", "sv": "bandeira-suecia", "id": "bandeira-indonesia",
        "vi": "bandeira-vietna", "uk": "bandeira-ucrania", "ar": "bandeira-arabia-saudita"
    }
    if idioma_alvo in mapa_bandeiras:
        html = re.sub(r'bandeira-[a-z-]+\.webp', f'{mapa_bandeiras[idioma_alvo]}.webp', html, flags=re.IGNORECASE)

    match_canonical = re.search(r'<link\s+(?=[^>]*\brel="canonical")(?=[^>]*\bhref="https://www\.calculadorasdeenfermagem\.com\.br(?:/[a-z]{2}(?:-[A-Z]{2})?)?/([^"]+)")[^>]*/?>', html, re.IGNORECASE)
    if match_canonical:
        filename = match_canonical.group(1)
        novo_canonical = f'<link href="https://www.calculadorasdeenfermagem.com.br/{idioma_alvo}/{filename}" rel="canonical"/>'
        html = html[:match_canonical.start()] + novo_canonical + html[match_canonical.end():]

    padrao_hreflang = re.compile(r'<link\s+(?=[^>]*\brel="alternate")(?=[^>]*\bhreflang="([^"]+)")(?=[^>]*\bhref="([^"]+)")[^>]*/?>', re.IGNORECASE)
    hreflang_matches = list(padrao_hreflang.finditer(html))
    
    if hreflang_matches:
        start_idx = hreflang_matches[0].start()
        end_idx = hreflang_matches[-1].end()
        entries = [{'lang': m.group(1), 'url': m.group(2)} for m in hreflang_matches]
        
        idx_pt, idx_alvo = None, None
        for i, e in enumerate(entries):
            if e['lang'].lower() == 'pt-br': idx_pt = i
            if e['lang'].lower() == idioma_alvo.lower(): idx_alvo = i
        
        if idx_pt is not None and idx_alvo is not None:
            url_pt = entries[idx_pt]['url']
            url_alvo = entries[idx_alvo]['url']
            entries[idx_pt]['lang'] = idioma_alvo
            entries[idx_pt]['url'] = url_alvo
            entries[idx_alvo]['lang'] = 'pt-br'
            entries[idx_alvo]['url'] = url_pt
        
        novas_tags = [f'<link href="{e["url"]}" hreflang="{e["lang"]}" rel="alternate"/>' for e in entries]
        tag_alvo_str, tags_restantes = None, []
        for tag in novas_tags:
            if f'hreflang="{idioma_alvo}"' in tag.lower(): tag_alvo_str = tag
            else: tags_restantes.append(tag)
        
        tags_finais = [tag_alvo_str] + tags_restantes if tag_alvo_str else novas_tags
        html = html[:start_idx] + "\n    ".join(tags_finais) + html[end_idx:]

    fontes_especificas = {
        "ar": {"css": "@font-face { font-family: 'Arabic'; src: url('/fonts/arabic/arabic-regular.woff2') format('woff2'); font-weight: 400; font-display: optional; }\n    @font-face { font-family: 'Arabic'; src: url('/fonts/arabic/arabic-700.woff2') format('woff2'); font-weight: 700; font-display: optional; }", "preload": '<link rel="preload" href="/fonts/arabic/arabic-regular.woff2" as="font" type="font/woff2" crossorigin>\n  <link rel="preload" href="/fonts/arabic/arabic-700.woff2" as="font" type="font/woff2" crossorigin>'},
        "zh": {"css": "@font-face { font-family: 'Chinese'; src: url('/fonts/chinese/chinese-regular.woff2') format('woff2'); font-weight: 400; font-display: optional; }", "preload": '<link rel="preload" href="/fonts/chinese/chinese-regular.woff2" as="font" type="font/woff2" crossorigin>'},
        "hi": {"css": "@font-face { font-family: 'Devanagari'; src: url('/fonts/devanagari/devanagari-regular.woff2') format('woff2'); font-weight: 400; font-display: optional; }\n    @font-face { font-family: 'Devanagari'; src: url('/fonts/devanagari/devanagari-700.woff2') format('woff2'); font-weight: 700; font-display: optional; }", "preload": '<link rel="preload" href="/fonts/devanagari/devanagari-regular.woff2" as="font" type="font/woff2" crossorigin>\n  <link rel="preload" href="/fonts/devanagari/devanagari-700.woff2" as="font" type="font/woff2" crossorigin>'},
        "ja": {"css": "@font-face { font-family: 'Japanese'; src: url('/fonts/japanese/japanese-regular.woff2') format('woff2'); font-weight: 400; font-display: optional; }\n    @font-face { font-family: 'Japanese'; src: url('/fonts/japanese/japanese-700.woff2') format('woff2'); font-weight: 700; font-display: optional; }", "preload": '<link rel="preload" href="/fonts/japanese/japanese-regular.woff2" as="font" type="font/woff2" crossorigin>\n  <link rel="preload" href="/fonts/japanese/japanese-700.woff2" as="font" type="font/woff2" crossorigin>'},
        "ko": {"css": "@font-face { font-family: 'Korean'; src: url('/fonts/korean/korean-regular.woff2') format('woff2'); font-weight: 400; font-display: optional; }\n    @font-face { font-family: 'Korean'; src: url('/fonts/korean/korean-700.woff2') format('woff2'); font-weight: 700; font-display: optional; }", "preload": '<link rel="preload" href="/fonts/korean/korean-regular.woff2" as="font" type="font/woff2" crossorigin>\n  <link rel="preload" href="/fonts/korean/korean-700.woff2" as="font" type="font/woff2" crossorigin>'}
    }

    if idioma_alvo in fontes_especificas:
        font_info = fontes_especificas[idioma_alvo]
        tag_style = r'(<style\s+id="critical-fonts"[^>]*>\s*)'
        if re.search(tag_style, html, re.IGNORECASE):
            html = re.sub(tag_style, rf'\1{font_info["css"]}\n    ', html, count=1, flags=re.IGNORECASE)
        else:
            html = re.sub(r'(<style[^>]*>)', rf'\1\n    {font_info["css"]}', html, count=1, flags=re.IGNORECASE)
        
        html = re.sub(r'@font-face\s*\{\s*font-family:\s*[\'"](?:Inter|Nunito Sans|Nunito)[\'"][^\}]+\}\s*', '', html, flags=re.IGNORECASE)
        padrao_fonte_preload = re.compile(r'<link\s+(?=[^>]*\brel="preload")(?=[^>]*\bhref="[^"]*/(?:inter|nunito)[^"]*")[^>]*/?>', re.IGNORECASE)
        matches_fontes = list(padrao_fonte_preload.finditer(html))
        if matches_fontes:
            primeiro = matches_fontes[0]
            html = html[:primeiro.start()] + font_info["preload"] + html[primeiro.end():]
            html = padrao_fonte_preload.sub('', html)
            html = re.sub(r'\n\s*\n\s*\n', '\n\n', html)

    return html

def traduzir_meta_seo_com_deepseek(html, idioma_alvo):
    campos = r'(?:description|keywords|og:title|og:description|og:site_name|twitter:title|twitter:description|author)'
    p1 = re.compile(rf'(<meta\s+content=")([^"]+)("[^>]*?(?:name|property)="{campos}"[^>]*/?>)', re.IGNORECASE)
    p2 = re.compile(rf'(<meta\s+(?:name|property)="{campos}"[^>]*?content=")([^"]+)("[^>]*/?>)', re.IGNORECASE)
    
    matches = []
    for p in [p1, p2]: matches.extend(list(p.finditer(html)))
    
    seen = set()
    unique_matches = []
    for m in matches:
        if m.start() not in seen:
            seen.add(m.start())
            unique_matches.append(m)
    
    if not unique_matches: return html
        
    dict_textos = {f"t{i}": m.group(2) for i, m in enumerate(unique_matches)}
    
    nome_idioma = NOMES_IDIOMAS.get(idioma_alvo, idioma_alvo)
    instrucoes = f"""Você é especialista em SEO internacional na área da saúde. Traduza os valores do JSON do Português para '{nome_idioma}'.
    REGRAS INEGOCIÁVEIS:
    1. Adapte os termos para as palavras-chave da enfermagem/saúde local.
    2. NÃO modifique as chaves do JSON.
    3. RETORNE EXCLUSIVAMENTE UM JSON VÁLIDO. Sem marcações markdown."""
    
    lotes_seo = dividir_dicionario(dict_textos, LIMITE_ITENS_JSON)
    dict_traduzido = {}
    for lote in lotes_seo:
        res = chamar_ia_com_fallback(instrucoes, lote, is_json=True)
        if isinstance(res, dict): dict_traduzido.update(res)
    
    for i, m in reversed(list(enumerate(unique_matches))):
        chave = f"t{i}"
        if chave in dict_traduzido:
            novo_content = dict_traduzido[chave].replace('"', "'")
            nova_tag = f"{m.group(1)}{novo_content}{m.group(3)}"
            html = html[:m.start()] + nova_tag + html[m.end():]
            
    return html

def traduzir_lote_js_com_deepseek(dicionario_scripts, idioma_alvo):
    strings_para_traduzir = {}
    mapeamento_scripts = {}
    contador_string = 0

    for id_script, codigo_js in dicionario_scripts.items():
        padrao_string = re.compile(r'(["\'])(.*?)\1')
        mapeamento_scripts[id_script] = []

        for match in padrao_string.finditer(codigo_js):
            conteudo = match.group(2)
            if len(conteudo) > 3 and " " in conteudo and not conteudo.startswith(('/', '#', '.', 'data-')) and not conteudo.endswith('.html'):
                id_string = f"STR_JS_{contador_string}"
                strings_para_traduzir[id_string] = conteudo
                mapeamento_scripts[id_script].append({'original': match.group(0), 'id': id_string, 'delimitador': match.group(1), 'tipo': 'string'})
                contador_string += 1

        padrao_template = re.compile(r'`([^`]*)`')
        for match_tmpl in padrao_template.finditer(codigo_js):
            conteudo = match_tmpl.group(1)
            if not conteudo.strip(): continue
            interps = re.findall(r'\$\{[^}]+\}', conteudo)
            texto_limpo = conteudo
            for i, interp in enumerate(interps): texto_limpo = texto_limpo.replace(interp, f'__INTERP_{i}__', 1)
            tem_texto = bool(re.search(r'[a-zA-ZÀ-ÿ]', re.sub(r'__INTERP_\d+__', '', texto_limpo)))
            if not tem_texto: continue
            
            id_string = f"STR_JS_{contador_string}"
            strings_para_traduzir[id_string] = texto_limpo
            mapeamento_scripts[id_script].append({'original': match_tmpl.group(0), 'id': id_string, 'delimitador': '`', 'tipo': 'template', 'interpolacoes': interps})
            contador_string += 1

    if not strings_para_traduzir: return dicionario_scripts

    nome_idioma = NOMES_IDIOMAS.get(idioma_alvo, idioma_alvo)
    instrucoes = f"""Você é tradutor de interfaces médicas. Traduza os valores do JSON do Português para '{nome_idioma}'.
    REGRAS CRÍTICAS:
    1. Retorne APENAS o JSON válido.
    2. Chaves intactas.
    3. NÃO adicione aspas extras.
    4. Placeholders (__INTERP_0__) DEVEM ser mantidos EXATAMENTE como estão.
    5. Preserve tags HTML internas."""
    
    lotes_js = dividir_dicionario(strings_para_traduzir, LIMITE_ITENS_JSON)
    dict_traduzido = {}
    for lote in lotes_js:
        res = chamar_ia_com_fallback(instrucoes, lote, is_json=True)
        if isinstance(res, dict): dict_traduzido.update(res)

    for id_script, itens in mapeamento_scripts.items():
        codigo_atual = dicionario_scripts[id_script]
        for item in itens:
            if item['id'] in dict_traduzido:
                texto_trad = dict_traduzido[item['id']]
                if item['tipo'] == 'template':
                    for i, interp in enumerate(item.get('interpolacoes', [])):
                        texto_trad = texto_trad.replace(f'__INTERP_{i}__', interp)
                codigo_atual = codigo_atual.replace(item['original'], f"{item['delimitador']}{texto_trad}{item['delimitador']}")
        dicionario_scripts[id_script] = codigo_atual
            
    return dicionario_scripts

def proteger_e_traduzir_html(html, idioma_alvo):
    # 1. Proteção Cirúrgica de Blocos (Scripts, Styles, SVG)
    blocos_protegidos = {}
    scripts_para_traduzir = {}
    contador_blocos = 0
    
    padrao_protecao = re.compile(r'(<(script|style|svg)\b[^>]*>.*?</\2>)', re.IGNORECASE | re.DOTALL)
    
    def mascarar_bloco(match):
        nonlocal contador_blocos
        codigo_original = match.group(1)
        tag_name = match.group(2).lower()
        id_bloco = f"___BLOCO_{contador_blocos}___"
        contador_blocos += 1
        
        if tag_name == 'script' and 'src=' not in codigo_original.lower():
            scripts_para_traduzir[id_bloco] = codigo_original
        else:
            blocos_protegidos[id_bloco] = codigo_original
        return id_bloco
        
    html_mascarado = padrao_protecao.sub(mascarar_bloco, html)

    # 2. Traduzir Scripts JS
    if scripts_para_traduzir:
        print(f"    {C_AZUL}[+] Extraindo e traduzindo lógicas JS (com templates)...{RESET}")
        scripts_traduzidos = traduzir_lote_js_com_deepseek(scripts_para_traduzir, idioma_alvo)
        blocos_protegidos.update(scripts_traduzidos)

    # 3. EXTRAIR TEXTOS DO HTML E ATRIBUTOS (A MÁGICA QUE PRESERVA O LAYOUT)
    dict_textos_html = {}
    contador_txt = 0

    # 3.1 Extrair atributos traduzíveis (placeholder, title, alt)
    padrao_atributos = re.compile(r'\b(placeholder|title|alt)="([^"]+)"', re.IGNORECASE)
    def extrair_atributos(match):
        nonlocal contador_txt
        attr_name = match.group(1)
        conteudo = match.group(2)
        if len(conteudo.strip()) > 1 and re.search(r'[a-zA-ZÀ-ÿ]', conteudo):
            id_txt = f"__TXT_HTML_{contador_txt}__"
            dict_textos_html[id_txt] = conteudo
            contador_txt += 1
            return f'{attr_name}="{id_txt}"'
        return match.group(0)
    
    html_mascarado = padrao_atributos.sub(extrair_atributos, html_mascarado)

    # 3.2 Extrair textos entre tags >...<
    padrao_texto = re.compile(r'>([^<]+)<')
    def extrair_texto(match):
        nonlocal contador_txt
        conteudo = match.group(1)
        conteudo_limpo = conteudo.strip()
        # Filtro: só se tiver letras
        if len(conteudo_limpo) >= 1 and re.search(r'[a-zA-ZÀ-ÿ]', conteudo_limpo):
            id_txt = f"__TXT_HTML_{contador_txt}__"
            dict_textos_html[id_txt] = conteudo_limpo
            contador_txt += 1
            
            # Devolve preservando espaços laterais na tag do HTML
            espaco_antes = conteudo[:len(conteudo) - len(conteudo.lstrip())]
            espaco_depois = conteudo[len(conteudo.rstrip()):]
            return f">{espaco_antes}{id_txt}{espaco_depois}<"
        return match.group(0)
        
    html_mascarado = padrao_texto.sub(extrair_texto, html_mascarado)

    # 4. TRADUZIR OS TEXTOS DO HTML EM LOTES
    if dict_textos_html:
        print(f"    {C_AZUL}[+] Traduzindo {len(dict_textos_html)} textos do HTML em lotes...{RESET}")
        lotes_html = dividir_dicionario(dict_textos_html, LIMITE_ITENS_JSON)
        dict_html_traduzido = {}
        
        nome_idioma = NOMES_IDIOMAS.get(idioma_alvo, idioma_alvo)
        instrucoes_html = f"""Você é um tradutor clínico de interfaces web. Traduza os valores deste JSON do Português para '{nome_idioma}'.
        REGRAS INEGOCIÁVEIS:
        1. Mantenha todas as chaves intactas (__TXT_HTML_0__ etc).
        2. Retorne APENAS um JSON válido. Sem formatações markdown.
        3. Traduza os termos com precisão médica."""
        
        for i, lote in enumerate(lotes_html):
            print(f"      ↳ Lote HTML {i+1}/{len(lotes_html)}")
            res = chamar_ia_com_fallback(instrucoes_html, lote, is_json=True)
            if isinstance(res, dict):
                dict_html_traduzido.update(res)

        # 5. REINJETAR OS TEXTOS TRADUZIDOS NO HTML
        for chave, texto_trad in dict_html_traduzido.items():
            # Escapa aspas duplas da tradução para não quebrar os atributos HTML
            texto_seguro = str(texto_trad).replace('"', "'")
            html_mascarado = html_mascarado.replace(chave, texto_seguro)

    # 6. DESMASCARAR (RESTAURAR SCRIPTS, STYLES, SVG)
    for id_bloco, codigo_original in blocos_protegidos.items():
        html_mascarado = html_mascarado.replace(id_bloco, codigo_original)

    return html_mascarado

# =========================================================================
# 6. FUNÇÃO DE BUILD
# =========================================================================
def rodar_scripts_de_build():
    comandos = [
        r".\node_modules\.bin\tailwindcss -i ./src/input.css -o ./public/output.css --minify",
        "node gerar-sw.js"
    ]
    print(f"\n  {C_AMARELO}⚙️ Rodando Scripts de Build...{RESET}")
    for comando in comandos:
        try:
            subprocess.run(comando, shell=True, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
            print(f"      {C_VERDE}✓ {comando}{RESET}")
        except subprocess.CalledProcessError:
            print(f"      {C_VERMELHO}✗ Falha: {comando}{RESET}")

# =========================================================================
# 7. FLUXO PRINCIPAL
# =========================================================================
def main():
    print(f"{C_ROXO}Iniciando Pipeline de Tradução (Text Masking + Build Automático){RESET}")
    
    for arquivo in ARQUIVOS_PARA_TRADUZIR:
        if not os.path.exists(arquivo): 
            print(f"{C_VERMELHO}Arquivo {arquivo} não encontrado.{RESET}")
            continue
        
        # Lê da raiz usando utf-8-sig para remover o BOM (\ufeff)
        with open(arquivo, 'r', encoding='utf-8-sig') as f:
            html_base = f.read()

        for idioma in IDIOMAS_ALVO:
            print(f"\n{C_AMARELO}======================================================={RESET}")
            print(f"{C_AZUL}▶ ARQUIVO: {arquivo} ➔ IDIOMA: {idioma.upper()}{RESET}")
            
            # Passo 1: Preparar HTML (agora recebe o conteúdo direto da memória)
            html_preparado = preparar_html_para_traducao_texto(html_base, idioma)
            
            # Passo 2: SEO
            html_seo = traduzir_meta_seo_com_deepseek(html_preparado, idioma)
            
            # Passo 3: Corpo e JS (agora via Extração de Texto)
            html_final = proteger_e_traduzir_html(html_seo, idioma)
            
            # Passo 4: Salvar (Sobrescrevendo na pasta do idioma)
            pasta_destino = f"./{idioma}/"
            os.makedirs(pasta_destino, exist_ok=True)
            caminho_saida = os.path.join(pasta_destino, arquivo)
            
            with open(caminho_saida, 'w', encoding='utf-8') as f:
                f.write(html_final)
                
            print(f"\n{C_VERDE}✅ SUCESSO! Salvo em: {caminho_saida}{RESET}")
            
            # Passo 5: Build
            rodar_scripts_de_build()
            
            # Passo 6: Pausa 25s
            if not (arquivo == ARQUIVOS_PARA_TRADUZIR[-1] and idioma == IDIOMAS_ALVO[-1]):
                print(f"  {C_AMARELO}⏳ Pausa de 25s para resfriar a API...{RESET}")
                time.sleep(25)

if __name__ == "__main__":
    main()
