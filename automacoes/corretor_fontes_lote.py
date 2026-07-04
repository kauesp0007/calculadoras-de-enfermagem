import os
import re

# =========================================================================
# 1. DICIONÁRIOS CIRÚRGICOS DE FONTES POR IDIOMA
# =========================================================================
fontes_especificas = {
    "ar": {
        "css": "@font-face { font-family: 'Arabic'; src: url('/fonts/arabic/arabic-regular.woff2') format('woff2'); font-weight: 400; font-display: optional; }\n    @font-face { font-family: 'Arabic'; src: url('/fonts/arabic/arabic-700.woff2') format('woff2'); font-weight: 700; font-display: optional; }",
        "preload": '<link rel="preload" href="/fonts/arabic/arabic-regular.woff2" as="font" type="font/woff2" crossorigin>\n  <link rel="preload" href="/fonts/arabic/arabic-700.woff2" as="font" type="font/woff2" crossorigin>',
        "nome_fonte": "Arabic"
    },
    "zh": {
        "css": "@font-face { font-family: 'Chinese'; src: url('/fonts/chinese/chinese-regular.woff2') format('woff2'); font-weight: 400; font-display: optional; }",
        "preload": '<link rel="preload" href="/fonts/chinese/chinese-regular.woff2" as="font" type="font/woff2" crossorigin>',
        "nome_fonte": "Chinese"
    },
    "hi": {
        "css": "@font-face { font-family: 'Devanagari'; src: url('/fonts/devanagari/devanagari-regular.woff2') format('woff2'); font-weight: 400; font-display: optional; }\n    @font-face { font-family: 'Devanagari'; src: url('/fonts/devanagari/devanagari-700.woff2') format('woff2'); font-display: optional; }",
        "preload": '<link rel="preload" href="/fonts/devanagari/devanagari-regular.woff2" as="font" type="font/woff2" crossorigin>\n  <link rel="preload" href="/fonts/devanagari/devanagari-700.woff2" as="font" type="font/woff2" crossorigin>',
        "nome_fonte": "Devanagari"
    },
    "ja": {
        "css": "@font-face { font-family: 'Japanese'; src: url('/fonts/japanese/japanese-regular.woff2') format('woff2'); font-weight: 400; font-display: optional; }\n    @font-face { font-family: 'Japanese'; src: url('/fonts/japanese/japanese-700.woff2') format('woff2'); font-weight: 700; font-display: optional; }",
        "preload": '<link rel="preload" href="/fonts/japanese/japanese-regular.woff2" as="font" type="font/woff2" crossorigin>\n  <link rel="preload" href="/fonts/japanese/japanese-700.woff2" as="font" type="font/woff2" crossorigin>',
        "nome_fonte": "Japanese"
    },
    "ko": {
        "css": "@font-face { font-family: 'Korean'; src: url('/fonts/korean/korean-regular.woff2') format('woff2'); font-weight: 400; font-display: optional; }\n    @font-face { font-family: 'Korean'; src: url('/fonts/korean/korean-700.woff2') format('woff2'); font-weight: 700; font-display: optional; }",
        "preload": '<link rel="preload" href="/fonts/korean/korean-regular.woff2" as="font" type="font/woff2" crossorigin>\n  <link rel="preload" href="/fonts/korean/korean-700.woff2" as="font" type="font/woff2" crossorigin>',
        "nome_fonte": "Korean"
    }
}

# =========================================================================
# 2. REGRAS DE PROTEÇÃO DO REPOSITÓRIO (IGNORAR MÓDULOS E PASTAS SISTEMA)
# =========================================================================
PASTAS_ALVO = ['ar', 'hi', 'zh', 'ja', 'ko']
PASTAS_IGNORADAS = ['downloads', 'biblioteca', 'blog', 'blog-templates', 'locales', 'fonts']
ARQUIVOS_IGNORADOS = [
    "footer.html", "menu-global.html", "global-body-elements.html",
    "downloads.html", "menu-lateral.html", "_language_selector.html", 
    "googlefc0a17cdd552164b.html"
]

def corrigir_fontes_html(caminho_arquivo, idioma):
    with open(caminho_arquivo, 'r', encoding='utf-8') as f:
        html = f.read()
    
    html_original = html
    config_fonte = fontes_especificas[idioma]

    # Passo A: Injeta CSS correto caso ainda não exista no arquivo
    if config_fonte["nome_fonte"] not in html:
        tag_style = r'(<style\s+id="critical-fonts"[^>]*>\s*)'
        html = re.sub(tag_style, rf'\1{config_fonte["css"]}\n    ', html, count=1, flags=re.IGNORECASE)

    # Passo B: Injeta Preloads corretos caso ainda não existam
    primeiro_link_preload_novo = config_fonte["preload"].split('"')[3] 
    if primeiro_link_preload_novo not in html:
        # Regex blindada: procura qualquer <link> que tenha /fonts/inter/ ou /fonts/nunito/ independente da ordem dos atributos
        padrao_qualquer_preload_antigo = r'<link[^>]*href=["\']/fonts/(?:inter|nunito)/[^>]*>'
        
        if re.search(padrao_qualquer_preload_antigo, html, re.IGNORECASE):
            # Substitui O PRIMEIRO link antigo pelo bloco de preloads novos
            html = re.sub(padrao_qualquer_preload_antigo, config_fonte["preload"], html, count=1, flags=re.IGNORECASE)
        else:
            # Fallback se não achar âncora (injeta no final do </style>)
            html = re.sub(r'(</style>)', rf'\1\n  {config_fonte["preload"]}', html, count=1, flags=re.IGNORECASE)

    # Passo C: Limpeza Cirúrgica (Extermina todos os resquícios que sobraram)
    # 1. Remove qualquer <link> restante de inter ou nunito (independente da formatação)
    html = re.sub(r'<link[^>]*href=["\']/fonts/(?:inter|nunito)/[^>]*>\s*', '', html, flags=re.IGNORECASE)
    
    # 2. Remove qualquer bloco @font-face declarando Inter ou Nunito Sans
    html = re.sub(r'@font-face\s*\{[^}]*font-family:\s*[\'"]?(?:Inter|Nunito Sans)[\'"]?[^}]*\}\s*', '', html, flags=re.IGNORECASE)

    # Retorna True apenas se o arquivo sofreu alterações
    if html != html_original:
        with open(caminho_arquivo, 'w', encoding='utf-8') as f:
            f.write(html)
        return True
    
    return False

def iniciar_varredura():
    diretorio_raiz = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    
    arquivos_alterados = 0
    arquivos_nao_alterados = 0
    arquivos_modificados_lista = []

    print("\n🔍 Iniciando varredura cirúrgica de fontes nas pastas alvo...")

    for idioma in PASTAS_ALVO:
        caminho_pasta_idioma = os.path.join(diretorio_raiz, idioma)
        
        if not os.path.exists(caminho_pasta_idioma):
            continue

        for root, dirs, files in os.walk(caminho_pasta_idioma):
            dirs[:] = [d for d in dirs if d not in PASTAS_IGNORADAS]

            for file in files:
                if file.endswith('.html') and file not in ARQUIVOS_IGNORADOS:
                    caminho_completo = os.path.join(root, file)
                    
                    try:
                        foi_alterado = corrigir_fontes_html(caminho_completo, idioma)
                        
                        if foi_alterado:
                            arquivos_alterados += 1
                            arquivos_modificados_lista.append(caminho_completo)
                        else:
                            arquivos_nao_alterados += 1
                    except Exception as e:
                        print(f"⚠️ Erro ao processar {caminho_completo}: {e}")

    # =========================================================================
    # 3. GERAÇÃO DO LOG NO TERMINAL
    # =========================================================================
    print("\n" + "="*60)
    print(" 📊 LOG DE VARREDURA DE FONTES - RESULTADO FINAL ")
    print("="*60)
    print(f"🔹 Total de arquivos analisados: {arquivos_alterados + arquivos_nao_alterados}")
    print(f"✅ Arquivos que NÃO precisaram de alteração: {arquivos_nao_alterados}")
    print(f"🛠️  Arquivos ALTERADOS com sucesso: {arquivos_alterados}\n")
    
    if arquivos_alterados > 0:
        print("📂 Lista de arquivos atualizados:")
        for arq in arquivos_modificados_lista:
            print(f"   ↳ {os.path.relpath(arq, diretorio_raiz).replace(os.sep, '/')}")
    print("="*60 + "\n")

if __name__ == "__main__":
    iniciar_varredura()