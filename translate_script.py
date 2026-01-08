import os
import re
from deep_translator import GoogleTranslator
import time

# --- CONFIGURAÇÕES ---
PASTA_ALVO = 'vi'  # Pasta onde estão os arquivos HTML
IDIOMA_ORIGEM = 'pt'
IDIOMA_DESTINO = 'vi'

# Arquivos que NÃO devem ser alterados
ARQUIVOS_IGNORADOS = [
    "downloads.html",
    "footer.html",
    "menu-global.html",
    "global-body-elements.html",
    "_language_selector.html",
    "googlefc0a17cdd552164b.html"
]

# Padrão de INÍCIO do bloco
PADRAO_INICIO = r'(<script>\s*document\.addEventListener\("DOMContentLoaded",\s*(?:function\s*\(\)|(?:\(\s*\)|[a-zA-Z0-9_]+)\s*=>)\s*\{)'

# Padrão de FIM do bloco
PADRAO_FIM = r'(\);\s*\}\);\s*\}\);\s*</script>)'

# Lista de termos CSS para proteção
TERMOS_CSS = [
    'bg-', 'text-', 'border-', 'p-', 'm-', 'w-', 'h-', 'flex', 'grid', 'hidden', 'block',
    'rounded', 'shadow', 'font-', 'cursor-', 'hover:', 'fa-', 'btn', 'mt-', 'mb-', 'ml-', 'mr-',
    'py-', 'px-', 'justify-', 'items-', 'gap-', 'absolute', 'relative', 'fixed', 'col-', 'row-',
    'input', 'label', 'div', 'span', 'tr', 'td', 'table', 'tbody', 'thead', 'form'
]

# --- LÓGICA ---

def parece_classe_css(texto):
    """Verifica se a string parece ser CSS."""
    palavras = texto.split()
    contagem_css = 0
    for palavra in palavras:
        if any(palavra.startswith(termo) for termo in TERMOS_CSS) or re.match(r'^[a-z]+-\d+', palavra):
            contagem_css += 1
    if len(palavras) > 0 and (contagem_css / len(palavras)) > 0.5:
        return True
    return False

def parece_codigo_ou_id(texto):
    """Verifica se a string parece ser código, ID ou variável técnica."""

    # 1. Snake_case (ex: square_window, arm_recoil) - Típico de IDs
    if '_' in texto and ' ' not in texto:
        return True

    # 2. Kebab-case técnico (ex: ballard-item-title) - Típico de Classes
    # Só ignora se for tudo minúsculo e ASCII (evita ignorar "pré-natal")
    if '-' in texto and ' ' not in texto and texto.islower() and texto.isascii():
        return True

    # 3. CamelCase simples (ex: tempRetal, btnCalcular)
    if ' ' not in texto and re.match(r'^[a-z]+[A-Z][a-zA-Z0-9]*$', texto):
        return True

    # 4. Seletores dinâmicos ou arrays
    if '${' in texto and ' ' not in texto: return True
    if '[' in texto or ']' in texto or '=' in texto:
        if any(c in texto for c in ['[', ']', '=']): return True

    # 5. Tags HTML isoladas
    tags_html = ['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'input', 'label', 'select', 'option', 'button', 'form', 'img', 'ul', 'li', 'table', 'tr', 'td', 'th', 'a', 'i', 'b', 'strong']
    if texto.lower() in tags_html:
        return True

    # 6. Seletores diretos
    if texto.startswith('#') or texto.startswith('.'):
        return True

    return False

def traduzir_texto(texto):
    try:
        # Filtros Iniciais
        if len(texto) < 2 or not re.search(r'[a-zA-Z]', texto):
            return texto

        # Lista de IDs proibidos explícitos
        ids_codigo = [
            'resultado', 'conteudo', 'btnCalcular', 'btnLimpar', 'btnGerarPDF', 'btnNandaNicNoc',
            'none', 'block', 'hidden', 'selection-modal', 'modal-title', 'modal-content',
            'modal-close-btn', 'macrogotas', 'microgotas', 'change', 'click', 'submit', 'DOMContentLoaded',
            'radio', 'checkbox', 'text', 'number', 'value', 'checked', 'innerHTML', 'innerText', 'textContent',
            'input', 'post', 'get', 'target', 'name', 'id', 'class', 'style', 'type', 'src', 'href',
            'postura', 'pele', 'lanugo', 'plantares', 'mamas', 'genitalia', 'olhos_orelhas',
            'square_window', 'arm_recoil', 'popliteo', 'scarf', 'heel_to_ear'
        ]
        if texto in ids_codigo: return texto

        # Verificações de padrão
        if parece_classe_css(texto):
            print(f"   Ignorando provável CSS: '{texto}'")
            return texto

        if parece_codigo_ou_id(texto):
            print(f"   Ignorando provável ID/Código: '{texto}'")
            return texto

        print(f"   Traduzindo: '{texto}'...")
        traducao = GoogleTranslator(source=IDIOMA_ORIGEM, target=IDIOMA_DESTINO).translate(texto)
        time.sleep(0.5)
        return traducao
    except Exception as e:
        print(f"   Erro ao traduzir '{texto}': {e}")
        return texto

def processar_arquivo(caminho_arquivo):
    with open(caminho_arquivo, 'r', encoding='utf-8') as f:
        conteudo = f.read()

    regex_bloco = re.compile(PADRAO_INICIO + r'(.*?)' + PADRAO_FIM, re.DOTALL | re.IGNORECASE)
    match = regex_bloco.search(conteudo)

    if not match:
        print(f" - Bloco não encontrado em: {caminho_arquivo}")
        return

    print(f" + Processando: {caminho_arquivo}")
    cabecalho, corpo, rodape = match.group(1), match.group(2), match.group(3)

    regex_strings = re.compile(r'(["\'`])((?:(?=(\\?))\3.)*?)\1')

    def substituir_traducao(m):
        quote, texto_interno = m.group(1), m.group(2)
        # Filtro rápido antes de processar
        if not texto_interno or texto_interno.startswith('.') or texto_interno.startswith('#'):
            return f"{quote}{texto_interno}{quote}"
        return f"{quote}{traduzir_texto(texto_interno)}{quote}"

    corpo_traduzido = regex_strings.sub(substituir_traducao, corpo)
    novo_conteudo = conteudo.replace(match.group(0), cabecalho + corpo_traduzido + rodape)

    with open(caminho_arquivo, 'w', encoding='utf-8') as f:
        f.write(novo_conteudo)
    print("   Salvo.")

def main():
    print(f"--- Iniciando Tradução Segura em: {PASTA_ALVO} ---")
    if not os.path.exists(PASTA_ALVO): return

    for nome_arquivo in os.listdir(PASTA_ALVO):
        if not nome_arquivo.endswith('.html') or nome_arquivo in ARQUIVOS_IGNORADOS: continue
        processar_arquivo(os.path.join(PASTA_ALVO, nome_arquivo))

if __name__ == "__main__":
    main()