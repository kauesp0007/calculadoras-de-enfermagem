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
    "en"
]

# Limites de Tokens / Blocos (Ajuste se necessário)
LIMITE_CARACTERES_HTML = 3500  # Tamanho do bloco HTML para não estourar tokens
LIMITE_ITENS_JSON = 20         # Quantas strings JS/SEO traduzir por vez

# =========================================================================
# 2. CONFIGURAÇÃO DE APIS E CORES
# =========================================================================
load_dotenv()

client_openai = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
client_deepseek = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com"
)

C_AZUL = "\033[94m"
C_VERDE = "\033[92m"
C_AMARELO = "\033[93m"
C_VERMELHO = "\033[91m"
C_ROXO = "\033[95m"
RESET = "\033[0m"

# =========================================================================
# 3. SISTEMA DE FALLBACK (OPENAI <-> DEEPSEEK)
# =========================================================================
def chamar_ia_com_fallback(instrucao_sistema, conteudo_usuario, is_json=False):
    """Alterna entre APIs se houver erro, tenta 10 vezes com 10s de intervalo."""
    tentativas = 10
    espera_erro = 10
    
    provedores = [
        {"nome": "OpenAI", "client": client_openai, "modelo": "gpt-4o"},
        {"nome": "DeepSeek", "client": client_deepseek, "modelo": "deepseek-chat"}
    ]

    prompt_texto = json.dumps(conteudo_usuario, ensure_ascii=False) if is_json else conteudo_usuario

    for tentativa in range(1, tentativas + 1):
        provedor_atual = provedores[(tentativa - 1) % len(provedores)]
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
                return json.loads(resultado)
            else:
                # CORREÇÃO: Regex na mesma linha para evitar SyntaxError
                resultado = re.sub(r'^```html\s*', '', resultado)
                resultado = re.sub(r'\s*```$', '', resultado)
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
# 4. CHUNKING (DIVISÃO DE BLOCOS)
# =========================================================================
def dividir_dicionario(dicionario, tamanho_lote):
    itens = list(dicionario.items())
    return [dict(itens[i:i + tamanho_lote]) for i in range(0, len(itens), tamanho_lote)]

def dividir_html_em_blocos(html, limite_chars):
    linhas = html.splitlines(True)
    blocos, bloco_atual = [], ""
    for linha in linhas:
        if len(bloco_atual) + len(linha) > limite_chars and bloco_atual:
            blocos.append(bloco_atual)
            bloco_atual = linha
        else:
            bloco_atual += linha
    if bloco_atual: blocos.append(bloco_atual)
    return blocos

# =========================================================================
# 5. REGRAS DO USUÁRIO (CÓDIGO INTACTO)
# =========================================================================
def preparar_html_para_traducao_texto(caminho_arquivo, idioma_alvo):
    with open(caminho_arquivo, 'r', encoding='utf-8') as f:
        html = f.read()

    # 1. SUBSTITUIÇÃO CIRÚRGICA DO FOOTER
    footer_novo = f"""<div id="footer-placeholder"></div>
<script>
  document.addEventListener("DOMContentLoaded", () => {{
    setTimeout(() => {{
      fetch("/footer.html")
        .then((response) => response.text())
        .then((data) => {{
          document.getElementById("footer-placeholder").innerHTML = data;
          if (typeof carregarTraducoes === "function") {{
            carregarTraducoes("{idioma_alvo}", "footer.json");
            carregarTraducoes("{idioma_alvo}", "cookies.json");
          }}
        }});
    }}, 150);
  }});
</script>"""

    idx_inicio = html.rfind('<div id="footer-placeholder"></div>')
    if idx_inicio != -1:
        idx_fim = html.find('</script>', idx_inicio)
        if idx_fim != -1:
            idx_fim += 9
            html = html[:idx_inicio] + footer_novo + html[idx_fim:]

    # Rotas
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

    # 2. LANG, LOCALES E FLAGS
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

    # 3. CANONICAL E HREFLANG SWAP
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

    # 4. FONTES ESPECÍFICAS
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
    
    instrucoes = f"""Você é especialista em SEO internacional na área da saúde. Traduza os valores num JSON do Português para '{idioma_alvo}'.
    REGRAS INEGOCIÁVEIS:
    1. Adapte os termos para as palavras-chave da enfermagem.
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

        # Strings Padrão
        for match in padrao_string.finditer(codigo_js):
            conteudo = match.group(2)
            if len(conteudo) > 3 and " " in conteudo and not conteudo.startswith(('/', '#', '.', 'data-')) and not conteudo.endswith('.html'):
                id_string = f"STR_{contador_string}"
                strings_para_traduzir[id_string] = conteudo
                mapeamento_scripts[id_script].append({'original': match.group(0), 'id': id_string, 'delimitador': match.group(1), 'tipo': 'string'})
                contador_string += 1

        # Template Literals
        padrao_template = re.compile(r'`([^`]*)`')
        for match_tmpl in padrao_template.finditer(codigo_js):
            conteudo = match_tmpl.group(1)
            if not conteudo.strip(): continue
            interps = re.findall(r'\$\{[^}]+\}', conteudo)
            texto_limpo = conteudo
            for i, interp in enumerate(interps): texto_limpo = texto_limpo.replace(interp, f'__INTERP_{i}__', 1)
            tem_texto = bool(re.search(r'[a-zA-ZÀ-ÿ]', re.sub(r'__INTERP_\d+__', '', texto_limpo)))
            if not tem_texto: continue
            
            id_string = f"STR_{contador_string}"
            strings_para_traduzir[id_string] = texto_limpo
            mapeamento_scripts[id_script].append({'original': match_tmpl.group(0), 'id': id_string, 'delimitador': '`', 'tipo': 'template', 'interpolacoes': interps})
            contador_string += 1

    if not strings_para_traduzir: return dicionario_scripts

    instrucoes = f"""Você é tradutor de interfaces de saúde. Traduza as mensagens do Português para '{idioma_alvo}'.
    REGRAS CRÍTICAS:
    1. Retorne APENAS o JSON.
    2. Chaves intactas.
    3. NÃO adicione aspas extras.
    4. Placeholders (__INTERP_0__) DEVEM ser mantidos EXATAMENTE como estão.
    5. Preserve tags HTML internas."""
    
    lotes_js = dividir_dicionario(strings_para_traduzir, LIMITE_ITENS_JSON)
    dict_traduzido = {}
    for lote in lotes_js:
        res = chamar_ia_com_fallback(instrucoes, lote, is_json=True)
        if isinstance(res, dict): dict_traduzido.update(res)

    # Restaura
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
    blocos_codigo = {}
    scripts_para_traduzir = {}
    contador = [0]
    
    padrao = re.compile(r'(<(script|style)\b[^>]*>.*?</\2>)', re.IGNORECASE | re.DOTALL)
    
    def proteger_bloco(match):
        codigo_original = match.group(1)
        tag_name = match.group(2).lower()
        id_bloco = f"___BLOCO_{contador[0]}___"
        contador[0] += 1
        
        if tag_name == 'script' and 'src=' not in codigo_original.lower():
            scripts_para_traduzir[id_bloco] = codigo_original
        else:
            blocos_codigo[id_bloco] = codigo_original
        return id_bloco
        
    html_protegido = padrao.sub(proteger_bloco, html)
    
    if scripts_para_traduzir:
        print(f"    {C_AZUL}[+] Extraindo e traduzindo lógicas JS (com templates)...{RESET}")
        scripts_traduzidos = traduzir_lote_js_com_deepseek(scripts_para_traduzir, idioma_alvo)
        blocos_codigo.update(scripts_traduzidos)
    
    print(f"    {C_AZUL}[+] Dividindo HTML puro em blocos e traduzindo via IA...{RESET}")
    blocos_html = dividir_html_em_blocos(html_protegido, LIMITE_CARACTERES_HTML)
    html_traduzido_final = ""
    
    instrucao_html = f"""Atue como parser. Traduza o texto visível deste HTML do Português para '{idioma_alvo}'.
    Mantenha TODAS as tags HTML exatas e a indentação. NÃO traduza marcadores como ___BLOCO_0___. Retorne apenas o HTML."""

    for i, bloco in enumerate(blocos_html):
        print(f"      ↳ HTML Bloco {i+1}/{len(blocos_html)}")
        bloco_trad = chamar_ia_com_fallback(instrucao_html, bloco, is_json=False)
        html_traduzido_final += bloco_trad + "\n"

    for placeholder, codigo_restaurado in blocos_codigo.items():
        html_traduzido_final = html_traduzido_final.replace(placeholder, codigo_restaurado)
        
    return html_traduzido_final

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
    print(f"{C_ROXO}Iniciando Pipeline de Tradução (Tokens Seguros + Build Automático){RESET}")
    
    for arquivo in ARQUIVOS_PARA_TRADUZIR:
        if not os.path.exists(arquivo): continue
        
        with open(arquivo, 'r', encoding='utf-8') as f:
            html_base = f.read()

        for idioma in IDIOMAS_ALVO:
            print(f"\n{C_AMARELO}======================================================={RESET}")
            print(f"{C_AZUL}▶ ARQUIVO: {arquivo} ➔ IDIOMA: {idioma.upper()}{RESET}")
            
            # Passo 1: Preparar HTML (Sua função exata)
            html_preparado = preparar_html_para_traducao_texto(html_base, idioma)
            
            # Passo 2: SEO (Sua função adaptada p/ fallback)
            html_seo = traduzir_meta_seo_com_deepseek(html_preparado, idioma)
            
            # Passo 3: Corpo e JS
            html_final = proteger_e_traduzir_html(html_seo, idioma)
            
            # Passo 4: Salvar (Sobrescrevendo)
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