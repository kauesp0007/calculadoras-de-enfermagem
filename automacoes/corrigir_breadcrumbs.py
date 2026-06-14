import os
import re
import json

DIRETORIOS = [
    ".", "en", "es", "de", "it", "fr", "hi", "zh", "ar", "ja", 
    "ru", "ko", "tr", "nl", "pl", "sv", "id", "vi", "uk"
]

DOMAIN = "https://www.calculadorasdeenfermagem.com.br"

def get_base_url(lang_dir):
    if lang_dir == ".":
        return f"{DOMAIN}/"
    return f"{DOMAIN}/{lang_dir}/"

arquivos_alterados = 0
arquivos_intactos = 0
log_detalhado = []

print("Iniciando correção cirúrgica dos Breadcrumbs (JSON-LD)...")

for diretorio in DIRETORIOS:
    if not os.path.exists(diretorio):
        continue

    base_lang_url = get_base_url(diretorio)

    for arquivo in os.listdir(diretorio):
        if not arquivo.endswith(".html"):
            continue

        # Ignorar modulares do sistema que não possuem breadcrumbs ou SEO próprio
        if arquivo in ["footer.html", "menu-global.html", "global-body-elements.html", "downloads.html", "menu-lateral.html", "_language_selector.html", "googlefc0a17cdd552164b.html"]:
            continue

        caminho = os.path.join(diretorio, arquivo)

        try:
            with open(caminho, "r", encoding="utf-8") as f:
                html = f.read()

            # 1. Obter a URL Canônica real da página para usar como 'item'
            canonical_match = re.search(r'<link[^>]*rel="canonical"[^>]*href="([^"]+)"', html, re.IGNORECASE)
            canonical_url = canonical_match.group(1) if canonical_match else f"{base_lang_url}{arquivo}"

            # 2. Localizar blocos JSON-LD
            script_pattern = re.compile(r'(<script[^>]*type="application/ld\+json"[^>]*>)(.*?)(</script>)', re.IGNORECASE | re.DOTALL)

            modificado_no_arquivo = False
            novo_html = html

            # Iterar por todos os blocos JSON-LD encontrados no HTML
            for match in script_pattern.finditer(html):
                script_open = match.group(1)
                json_str = match.group(2).strip()
                script_close = match.group(3)

                # Ignorar se for vazio ou se for um template (<!-- SCHEMA_ORG -->)
                if not json_str or json_str.startswith('<!--'):
                    continue

                try:
                    # Parseia o texto para um objeto Python estruturado
                    dados = json.loads(json_str)
                    modificou_json = False

                    # Lógica para injetar o 'item' faltante
                    def fix_item_list(item_list):
                        mod = False
                        for i, item in enumerate(item_list):
                            if isinstance(item, dict) and item.get('@type') == 'ListItem':
                                if 'item' not in item:
                                    # Se for o último degrau, recebe a URL da própria página.
                                    # Se for um degrau intermediário, recebe a URL da home do idioma.
                                    if i == len(item_list) - 1:
                                        item['item'] = canonical_url
                                    else:
                                        item['item'] = base_lang_url
                                    mod = True
                        return mod

                    # O JSON-LD pode ser um dicionário raiz ou estar dentro de um @graph
                    if isinstance(dados, dict):
                        if '@graph' in dados and isinstance(dados['@graph'], list):
                            for obj in dados['@graph']:
                                if obj.get('@type') == 'BreadcrumbList' and 'itemListElement' in obj:
                                    if fix_item_list(obj['itemListElement']):
                                        modificou_json = True
                        elif dados.get('@type') == 'BreadcrumbList' and 'itemListElement' in dados:
                            if fix_item_list(dados['itemListElement']):
                                modificou_json = True

                    if modificou_json:
                        # Gera o JSON corrigido mantendo a indentação visual
                        novo_json_str = json.dumps(dados, ensure_ascii=False, indent=2)
                        bloco_antigo = match.group(0)
                        bloco_novo = f"{script_open}\n{novo_json_str}\n{script_close}"
                        novo_html = novo_html.replace(bloco_antigo, bloco_novo)
                        modificado_no_arquivo = True

                except json.JSONDecodeError:
                    pass # Ignora erros de JSON malformado silenciosamente para não quebrar a automação

            if modificado_no_arquivo:
                with open(caminho, "w", encoding="utf-8") as f:
                    f.write(novo_html)
                arquivos_alterados += 1
                log_detalhado.append(f"[CORRIGIDO] {caminho} | Atributo 'item' injetado.")
            else:
                arquivos_intactos += 1

        except Exception as e:
            log_detalhado.append(f"[ERRO] {caminho}: {e}")

caminho_log = "log_breadcrumbs.txt"
with open(caminho_log, "w", encoding="utf-8") as log:
    log.write("======================================================================\n")
    log.write("         RELATÓRIO DE CORREÇÃO SCHEMA.ORG (BREADCRUMBS)               \n")
    log.write("======================================================================\n\n")
    log.write(f"Total de arquivos corrigidos: {arquivos_alterados}\n")
    log.write(f"Total de arquivos intactos/corretos: {arquivos_intactos}\n\n")
    log.write("Detalhamento por arquivo modificado:\n")
    log.write("----------------------------------------------------------------------\n")
    for linha in log_detalhado:
        if "[CORRIGIDO]" in linha or "[ERRO]" in linha:
            log.write(f"{linha}\n")

print("\n==========================================")
print("Correção do JSON-LD concluída!")
print(f"Arquivos salvos do erro no Google Search Console: {arquivos_alterados}")
print(f"O log de alterações foi salvo em: {os.path.abspath(caminho_log)}")
print("==========================================")