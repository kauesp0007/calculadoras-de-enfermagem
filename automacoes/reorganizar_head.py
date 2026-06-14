import os
import re
from datetime import datetime

# ==========================================
# 1. CONFIGURAÇÕES E REGRAS DE SEGURANÇA
# ==========================================

DIRETORIO_RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

PASTAS_PROIBIDAS = ['downloads', 'biblioteca', 'blog', 'node_modules', '.git', '.vscode', 'src', 'public']
ARQUIVOS_PROIBIDOS = [
    'footer.html', 
    'menu-global.html', 
    'global-body-elements.html', 
    'downloads.html', 
    'menu-lateral.html', 
    '_language_selector.html', 
    'googlefc0a17cdd552164b.html'
]
IDIOMAS_PERMITIDOS = ['en', 'es', 'fr', 'it', 'de', 'hi', 'zh', 'ja', 'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk', 'ar']

# ==========================================
# 2. FUNÇÃO DE VARREDURA
# ==========================================

def obter_arquivos_html():
    arquivos_alvo = []
    
    for root, dirs, files in os.walk(DIRETORIO_RAIZ):
        dirs[:] = [d for d in dirs if d not in PASTAS_PROIBIDAS]
        
        pasta_atual = os.path.basename(root)
        na_raiz = (root == DIRETORIO_RAIZ)
        em_idioma = (pasta_atual in IDIOMAS_PERMITIDOS)
        
        if not (na_raiz or em_idioma):
            continue

        for file in files:
            if file.endswith('.html') and file not in ARQUIVOS_PROIBIDOS:
                caminho_completo = os.path.join(root, file)
                arquivos_alvo.append(caminho_completo)
                
    return arquivos_alvo

# ==========================================
# 3. MOTOR CIRÚRGICO DE SUBSTITUIÇÃO
# ==========================================

def processar_arquivo(caminho):
    try:
        with open(caminho, 'r', encoding='utf-8') as f:
            conteudo = f.read()

        match_head = re.search(r'(<head.*?>)(.*?)(</head>)', conteudo, re.IGNORECASE | re.DOTALL)
        if not match_head:
            return False

        head_abertura = match_head.group(1)
        head_html = match_head.group(2)
        head_fechamento = match_head.group(3)

        # 1. Extração Cirúrgica de Metadados (Evita duplicação)
        title = re.search(r'<title>\s*(.*?)\s*</title>', head_html, re.IGNORECASE | re.DOTALL)
        title_text = title.group(1).strip() if title else "Calculadoras de Enfermagem"

        desc = re.search(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']', head_html, re.IGNORECASE | re.DOTALL)
        desc_text = desc.group(1).strip() if desc else ""

        canonical = re.search(r'<link\s+rel=["\']canonical["\']\s+href=["\'](.*?)["\']', head_html, re.IGNORECASE)
        canonical_url = canonical.group(1).strip() if canonical else "https://www.calculadorasdeenfermagem.com.br/"

        og_title = re.search(r'<meta\s+property=["\']og:title["\']\s+content=["\'](.*?)["\']', head_html, re.IGNORECASE)
        og_title_text = og_title.group(1).strip() if og_title else title_text

        og_desc = re.search(r'<meta\s+property=["\']og:description["\']\s+content=["\'](.*?)["\']', head_html, re.IGNORECASE)
        og_desc_text = og_desc.group(1).strip() if og_desc else desc_text

        og_img = re.search(r'<meta\s+property=["\']og:image["\']\s+content=["\'](.*?)["\']', head_html, re.IGNORECASE)
        og_img_tag = f'<meta property="og:image" content="{og_img.group(1).strip()}">\n' if og_img else ''

        og_type = re.search(r'<meta\s+property=["\']og:type["\']\s+content=["\'](.*?)["\']', head_html, re.IGNORECASE)
        og_type_text = og_type.group(1).strip() if og_type else "website"

        # 2. Extração dos Blocos Intocáveis
        hreflangs = re.findall(r'<link\s+rel=["\']alternate["\']\s+hreflang=.*?>', head_html, re.IGNORECASE)
        hreflang_block = "\n".join(hreflangs)

        outras_metas = re.findall(r'<meta\s+(?:name|property)=["\'](?:twitter:|author|og:locale|og:site_name).*?["\']\s+content=["\'].*?["\']\s*/?>', head_html, re.IGNORECASE)
        twitter_block = "\n".join(outras_metas)

        # 3. Fronteira de Preservação (Estilos Locais, Scripts e Schema JSON-LD)
        boundary_match = re.search(r'(<!--\s*10\.\s*Schema Markup\s*-->|<script type="application/ld\+json">|<style.*?>|<!--\s*11\.\s*Outros Scripts/Tags\s*-->)', head_html, re.IGNORECASE)
        restante_head = head_html[boundary_match.start():] if boundary_match else ""

        # 4. Injeção do Novo Template
        novo_head_conteudo = f"""
<!-- =====================================================
1. CONFIGURAÇÕES BÁSICAS DO DOCUMENTO
===================================================== -->
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title_text}</title>
<meta name="description" content="{desc_text}">
<link rel="canonical" href="{canonical_url}">
<link rel="icon" href="/img/favicon.ico">

<!-- =====================================================
2. SEO / IDIOMAS
===================================================== -->
{hreflang_block}

<!-- =====================================================
3. OPEN GRAPH / SOCIAL
===================================================== -->
<meta property="og:title" content="{og_title_text}">
<meta property="og:description" content="{og_desc_text}">
{og_img_tag}<meta property="og:type" content="{og_type_text}">
{twitter_block}

<!-- =====================================================
4. PRECONNECT
(Abre conexão antes de baixar arquivos)
===================================================== -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://cdnjs.cloudflare.com">
<link rel="preconnect" href="https://cdn.jsdelivr.net">

<!-- =====================================================
5. DNS PREFETCH
(Compatibilidade com navegadores antigos)
===================================================== -->
<link rel="dns-prefetch" href="//fonts.googleapis.com">
<link rel="dns-prefetch" href="//fonts.gstatic.com">
<link rel="dns-prefetch" href="//cdnjs.cloudflare.com">
<link rel="dns-prefetch" href="//cdn.jsdelivr.net">

<!-- =====================================================
6. FONTES CRÍTICAS LOCAIS
(Carrega antes do CSS)
===================================================== -->
<link rel="preload" href="/fonts/arabic/arabic-regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/arabic/arabic-700.woff2" as="font" type="font/woff2" crossorigin>

<!-- =====================================================
7. CSS PRINCIPAL DO SITE
===================================================== -->
<link rel="preload" href="/public/output.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="/public/output.css"></noscript>
<link rel="preload" href="/global-styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="/global-styles.css"></noscript>

<!-- =====================================================
8. CSS EXTERNOS
(Font Awesome)
===================================================== -->
<link rel="preload" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" as="style" crossorigin onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"></noscript>

<!-- =====================================================
9. OPEN DYSLEXIC
===================================================== -->
<link rel="preload" href="https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.3/open-dyslexic-regular.min.css" as="style" crossorigin onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.3/open-dyslexic-regular.min.css"></noscript>

<!-- =====================================================
10. MÓDULOS HTML GLOBAIS
(Fetch)
===================================================== -->
<link rel="preload" href="/menu-global.html" as="fetch" crossorigin="anonymous">
<link rel="preload" href="/global-body-elements.html" as="fetch" crossorigin="anonymous">

{restante_head}"""

        novo_head_completo = head_abertura + novo_head_conteudo + "\n</head>"
        novo_conteudo = conteudo[:match_head.start()] + novo_head_completo + conteudo[match_head.end():]

        # Verifica se houve alteração e salva
        if conteudo != novo_conteudo:
            with open(caminho, 'w', encoding='utf-8') as f:
                f.write(novo_conteudo)
            return True
        return False

    except Exception as e:
        print(f"Erro ao processar {caminho}: {e}")
        return False

# ==========================================
# 4. EXECUÇÃO PRINCIPAL
# ==========================================

def main():
    print("Iniciando reorganização cirúrgica do <head>...")
    arquivos = obter_arquivos_html()
    
    arquivos_alterados = []
    arquivos_ignorados = []

    for caminho in arquivos:
        sucesso = processar_arquivo(caminho)
        if sucesso:
            arquivos_alterados.append(caminho)
        else:
            arquivos_ignorados.append(caminho)

    # Geração do Relatório (.txt)
    caminho_log = os.path.join(os.path.dirname(__file__), f"log_reorganizacao_head_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt")
    
    with open(caminho_log, 'w', encoding='utf-8') as f:
        f.write("RELATÓRIO DE REORGANIZAÇÃO DO HEAD\n")
        f.write(f"Data: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}\n")
        f.write("="*50 + "\n")
        f.write(f"Total Analisado: {len(arquivos)}\n")
        f.write(f"Arquivos Alterados com Sucesso: {len(arquivos_alterados)}\n")
        f.write(f"Arquivos Ignorados/Sem Alteração: {len(arquivos_ignorados)}\n")
        f.write("="*50 + "\n\n")
        
        f.write("[ ARQUIVOS ALTERADOS ]\n")
        for a in arquivos_alterados:
            f.write(f"✔ {os.path.relpath(a, DIRETORIO_RAIZ)}\n")
            
        f.write("\n[ ARQUIVOS IGNORADOS / FALHAS ]\n")
        for i in arquivos_ignorados:
            f.write(f"➖ {os.path.relpath(i, DIRETORIO_RAIZ)}\n")

    print(f"\n✅ Concluído! {len(arquivos_alterados)} arquivos atualizados.")
    print(f"📄 Log detalhado gerado em: {caminho_log}")

if __name__ == "__main__":
    main()