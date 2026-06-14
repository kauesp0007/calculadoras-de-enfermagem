import os
import re

# 1. Whitelist Estrita de Diretórios
diretorios_permitidos = [
    ".", "en", "es", "de", "it", "fr", "hi", "zh", "ar", "ja", 
    "ru", "ko", "tr", "nl", "pl", "sv", "id", "vi", "uk"
]

# 2. Bloqueio de arquivos modulares
arquivos_ignoradas = [
    "footer.html", 
    "menu-global.html", 
    "global-body-elements.html", 
    "downloads.html", 
    "menu-lateral.html", 
    "_language_selector.html", 
    "googlefc0a17cdd552164b.html",
    "downloads.template.html",
    "item.template.html",
    "index.template.html",
    "post.template.html"
]

# Regex poderosa para extrair tags HTML inteiras (mesmo que pulem linhas)
tag_pattern = re.compile(
    r'(<!--[\s\S]*?-->|'
    r'<script[\s\S]*?<\/script>|'
    r'<noscript[\s\S]*?<\/noscript>|'
    r'<title>[\s\S]*?<\/title>|'
    r'<style[\s\S]*?<\/style>|'
    r'<meta[^>]*>|'
    r'<link[^>]*>|'
    r'<base[^>]*>)',
    re.IGNORECASE
)

arquivos_alterados = 0
arquivos_nao_alterados = 0
log_detalhado = []

print("Iniciando a reestruturação em massa do <head> para resolver recursos bloqueantes...")

for dir_permitido in diretorios_permitidos:
    if not os.path.exists(dir_permitido):
        continue
        
    for arquivo in os.listdir(dir_permitido):
        if arquivo.endswith(".html") and arquivo not in arquivos_ignoradas:
            caminho_completo = os.path.join(dir_permitido, arquivo)
            if not os.path.isfile(caminho_completo):
                continue

            try:
                with open(caminho_completo, "r", encoding="utf-8") as f:
                    conteudo = f.read()
                
                head_match = re.search(r'(<head>)(.*?)(</head>)', conteudo, re.IGNORECASE | re.DOTALL)
                
                if not head_match:
                    continue
                    
                head_content = head_match.group(2)
                tags_encontradas = tag_pattern.findall(head_content)
                
                buckets = {
                    'charset_viewport': [],
                    'dns_preconnect': [],
                    'title_e_metas': [],
                    'css_assincrono': [], # Mudámos o CSS crítico para cá
                    'html_preloads': [],
                    'async_css_e_noscripts': [], # Inclui FontAwesome e outros
                    'font_preloads': [],
                    'seo_hreflang': [],
                    'favicon': [],
                    'schema': [],
                    'outros': []
                }
                
                for tag in tags_encontradas:
                    t_lower = tag.lower()
                    
                    if t_lower.startswith('<!--'):
                        continue
                        
                    elif t_lower.startswith('<meta'):
                        if 'charset=' in t_lower or 'name="viewport"' in t_lower:
                            buckets['charset_viewport'].append(tag)
                        else:
                            buckets['title_e_metas'].append(tag)
                            
                    elif t_lower.startswith('<title'):
                        buckets['title_e_metas'].insert(0, tag)
                        
                    elif t_lower.startswith('<link'):
                        if 'rel="dns-prefetch"' in t_lower or 'rel="preconnect"' in t_lower:
                            buckets['dns_preconnect'].append(tag)
                        elif 'rel="canonical"' in t_lower or 'rel="alternate"' in t_lower:
                            buckets['seo_hreflang'].append(tag)
                        # SOLUÇÃO PARA O CSS BLOQUEANTE:
                        elif 'rel="stylesheet"' in t_lower and ('output.css' in t_lower or 'global-styles.css' in t_lower):
                            # Transforma o stylesheet bloqueante num carregamento assíncrono
                            href_match = re.search(r'href="(.*?)"', tag, re.IGNORECASE)
                            if href_match:
                                href = href_match.group(1)
                                async_tag = f'<link rel="preload" href="{href}" as="style" onload="this.onload=null;this.rel=\'stylesheet\'">'
                                noscript_tag = f'<noscript><link rel="stylesheet" href="{href}"></noscript>'
                                buckets['css_assincrono'].append(async_tag)
                                buckets['css_assincrono'].append(noscript_tag)
                        elif 'rel="preload"' in t_lower:
                            if 'onload=' in t_lower:
                                buckets['async_css_e_noscripts'].append(tag)
                            elif 'as="style"' in t_lower or '.css"' in t_lower:
                                # Captura preloads de CSS existentes e certifica-se de que estão na secção correta
                                buckets['css_assincrono'].append(tag)
                            elif 'as="fetch"' in t_lower or '.html"' in t_lower:
                                buckets['html_preloads'].append(tag)
                            elif 'as="font"' in t_lower or '.woff2"' in t_lower:
                                buckets['font_preloads'].append(tag)
                            else:
                                buckets['outros'].append(tag)
                        elif 'rel="stylesheet"' in t_lower:
                            buckets['async_css_e_noscripts'].append(tag)
                        elif 'rel="icon"' in t_lower or 'shortcut icon' in t_lower:
                            buckets['favicon'].append(tag)
                        else:
                            buckets['outros'].append(tag)
                            
                    elif t_lower.startswith('<script'):
                        if 'application/ld+json' in t_lower:
                            buckets['schema'].append(tag)
                        else:
                            buckets['outros'].append(tag)
                            
                    elif t_lower.startswith('<noscript'):
                        buckets['async_css_e_noscripts'].append(tag)
                        
                    else:
                        buckets['outros'].append(tag)

                # SOLUÇÃO PARA FONT AWESOME BLOQUEANTE:
                # Vamos garantir que o FontAwesome é carregado de forma assíncrona, caso não esteja na lista.
                fa_url = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
                has_fa = any(fa_url in tag for tag in buckets['async_css_e_noscripts'])
                if not has_fa:
                     buckets['async_css_e_noscripts'].append(f'<link rel="preload" href="{fa_url}" as="style" onload="this.onload=null;this.rel=\'stylesheet\'">')
                     buckets['async_css_e_noscripts'].append(f'<noscript><link rel="stylesheet" href="{fa_url}"></noscript>')

                def build_section(titulo, itens):
                    if not itens: return ""
                    section = f"  <!-- {titulo} -->\n"
                    # Removemos itens duplicados para manter o head limpo
                    itens_unicos = list(dict.fromkeys(itens))
                    for item in itens_unicos:
                        linhas = item.split('\n')
                        section += f"  {linhas[0].strip()}\n"
                        for linha in linhas[1:]:
                            section += f"    {linha.strip()}\n"
                    return section + "\n"

                novo_head = "\n"
                novo_head += build_section("1. Charset e Viewport", buckets['charset_viewport'])
                novo_head += build_section("2. DNS e Preconnects", buckets['dns_preconnect'])
                novo_head += build_section("3. Title e Metatags (SEO e Redes Sociais)", buckets['title_e_metas'])
                # A Nova ordem: CSS Carregado Assincronamente
                novo_head += build_section("4. CSS Principal (Carregamento Assíncrono)", buckets['css_assincrono'])
                novo_head += build_section("5. Preloads de Módulos HTML", buckets['html_preloads'])
                novo_head += build_section("6. CSS Adicional (Ícones e Fontes Extras)", buckets['async_css_e_noscripts'])
                novo_head += build_section("7. Fontes Locais", buckets['font_preloads'])
                novo_head += build_section("8. SEO Internacional (Canonical e Hreflang)", buckets['seo_hreflang'])
                novo_head += build_section("9. Favicon", buckets['favicon'])
                novo_head += build_section("10. Schema Markup", buckets['schema'])
                novo_head += build_section("11. Outros Scripts/Tags", buckets['outros'])

                novo_head_completo = novo_head.rstrip() + "\n"
                novo_html = conteudo[:head_match.start(2)] + novo_head_completo + conteudo[head_match.start(3):]

                if conteudo != novo_html:
                    with open(caminho_completo, "w", encoding="utf-8") as f:
                        f.write(novo_html)
                    arquivos_alterados += 1
                    log_detalhado.append(f"[REORGANIZADO & OTIMIZADO] {caminho_completo}")
                else:
                    arquivos_nao_alterados += 1

            except Exception as e:
                log_detalhado.append(f"[ERRO] {caminho_completo} | {e}")

caminho_log = "log_otimizacao_head_v2.txt"
with open(caminho_log, "w", encoding="utf-8") as log:
    log.write("======================================================================\n")
    log.write("         RELATÓRIO DE OTIMIZAÇÃO DO <HEAD> (CSS & FONTES)             \n")
    log.write("======================================================================\n\n")
    log.write(f"Arquivos otimizados: {arquivos_alterados}\n")
    log.write(f"Arquivos intactos: {arquivos_nao_alterados}\n\n")
    log.write("Detalhamento:\n")
    log.write("----------------------------------------------------------------------\n")
    for linha in log_detalhado:
        log.write(f"{linha}\n")

print("\n==========================================")
print("Otimização de recursos bloqueantes no <head> concluída!")
print(f"Arquivos processados e salvos: {arquivos_alterados}")
print(f"Log detalhado salvo em: {os.path.abspath(caminho_log)}")
print("==========================================")