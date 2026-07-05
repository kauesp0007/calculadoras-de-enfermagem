import os
import re

# ==========================================
# CONFIGURAÇÕES E RESTRIÇÕES
# ==========================================
DIRETORIO_RAIZ = '.'
PASTAS_PERMITIDAS = {
    'en', 'es', 'fr', 'it', 'de', 'hi', 'zh', 'ja', 'ru', 'ko', 
    'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk', 'ar'
}
ARQUIVOS_PROIBIDOS = {
    'footer.html', 'menu-global.html', 'global-body-elements.html', 
    'downloads.html', 'menu-lateral.html', '_language_selector.html', 
    'googlefc0a17cdd552164b.html'
}

# ==========================================
# BLOCOS CORRETOS PARA INJEÇÃO (Formatados para iniciar na Coluna 1)
# ==========================================
BLOCO_HEADER = (
    '<style id="anti-cls-placeholders">#global-header-container{display:block;width:100%;min-height:96px;background-color:transparent}@media(max-width:768px){#global-header-container{min-height:60px}}#language-selector-placeholder{display:block;width:100%;min-height:48px;background-color:transparent}#footer-placeholder{display:block;min-height:520px;background-color:transparent}@media(min-width:768px){#footer-placeholder{min-height:277px}}</style>\n'
    '<div id="global-header-container"></div>\n'
    '<div id="language-selector-placeholder"></div>'
)

BLOCO_FOOTER = (
    '<div id="footer-placeholder"></div>\n'
    '<script>\n'
    'document.addEventListener("DOMContentLoaded", () => {\n'
    'setTimeout(() => {\n'
    'fetch("footer.html")\n'
    '.then((response) => response.text())\n'
    '.then((data) => {\n'
    'document.getElementById("footer-placeholder").innerHTML = data;\n'
    '});\n'
    '}, 150);\n'
    '});\n'
    '</script>'
)

BLOCO_SCRIPTS = (
    '<script src="/global-scripts.js" defer=""></script>\n'
    '<script src="/lang-selector.js" defer=""></script>'
)

# ==========================================
# FUNÇÃO DE VALIDAÇÃO PREMATURA (EARLY EXIT)
# ==========================================
def arquivo_ja_esta_correto(texto):
    """
    Verifica se o HTML já está 100% aderente às regras e não precisa sofrer processamento.
    """
    # 1. Não pode existir font awesome via CDN
    if re.search(r'<link[^>]*href=["\'][^"\']*font-awesome[^"\']*["\'][^>]*>', texto, re.IGNORECASE): 
        return False

    texto_validacao = texto.replace('\r\n', '\n')

    # 2. Os blocos literais devem estar presentes exatos
    if BLOCO_HEADER not in texto_validacao: return False
    if BLOCO_SCRIPTS not in texto_validacao: return False
    if BLOCO_FOOTER not in texto_validacao: return False

    # 3. Contagem rigorosa: Nenhuma duplicidade e nenhum ausente
    if texto_validacao.count('id="anti-cls-placeholders"') != 1: return False
    if texto_validacao.count('id="global-header-container"') != 1: return False
    if texto_validacao.count('id="language-selector-placeholder"') != 1: return False
    if texto_validacao.count('id="footer-placeholder"') != 1: return False
    if texto_validacao.count('global-scripts.js') != 1: return False
    if texto_validacao.count('lang-selector.js') != 1: return False

    # 4. Posicionamento do footer imediatamente antes do </body>
    if not re.search(re.escape(BLOCO_FOOTER) + r'\s*</body>', texto_validacao):
        return False

    # 5. Posicionamento dos scripts imediatamente após o </main>
    if not re.search(r'</main>\s*' + re.escape(BLOCO_SCRIPTS), texto_validacao, re.IGNORECASE):
        return False

    # 6. Posicionamento do Header Block imediatamente antes de <main
    if not re.search(re.escape(BLOCO_HEADER) + r'\s*<main\b', texto_validacao, re.IGNORECASE):
        return False

    return True

# ==========================================
# LÓGICA PRINCIPAL COM PROTEÇÃO CONTRA DELEÇÃO MASSIVA
# ==========================================
def processar_html(filepath, contadores):
    with open(filepath, 'r', encoding='utf-8') as f:
        texto_original = f.read()

    # Normalizar quebras de linha para segurança da lógica
    texto_modificado = texto_original.replace('\r\n', '\n')

    # Validação rápida
    if arquivo_ja_esta_correto(texto_modificado):
        contadores['arquivos_ja_corrigidos_anteriormente'] += 1
        return

    # Contagem para o log visual (Antes de fazer modificações)
    if texto_modificado.count('id="anti-cls-placeholders"') > 1 or texto_modificado.count('id="global-header-container"') > 1 or texto_modificado.count('id="footer-placeholder"') > 1:
        contadores['codigos_duplicados_corrigidos'] += 1
    if 'fetch("/footer.html")' in texto_modificado or 'src="global-scripts.js"' in texto_modificado:
        contadores['caminhos_incorretos_corrigidos'] += 1

    # ---------------------------------------------------------
    # CORREÇÃO 5: Font Awesome CDN
    # ---------------------------------------------------------
    texto_modificado = re.sub(r'<link[^>]*href=["\'][^"\']*font-awesome[^"\']*["\'][^>]*>\n?', '', texto_modificado, flags=re.IGNORECASE)

    # ---------------------------------------------------------
    # CORREÇÃO 3: Footer Block (MÉTODO CIRÚRGICO SEGURO)
    # ---------------------------------------------------------
    # 1. Remove o script do footer COMPLETO se ele estiver isolado em sua própria tag
    texto_modificado = re.sub(
        r'<script>\s*document\.addEventListener\(\s*["\']DOMContentLoaded["\']\s*,\s*(?:function\s*\(\)\s*\{|\(\)\s*=>\s*\{)\s*setTimeout\s*\(\s*(?:function\s*\(\)\s*\{|\(\)\s*=>\s*\{)\s*fetch\s*\(\s*["\']/?footer\.html["\']\s*\)[\s\S]*?\}\s*,\s*150\s*\)\s*;?\s*\}\s*\)\s*;?\s*</script>\n?',
        '', texto_modificado, flags=re.IGNORECASE
    )

    # 2. Se o footer estiver INJETADO dentro da tag <script> principal da página (junto com calculadoras),
    # remove APENAS a função setTimeout, preservando intacto todo o resto do seu JS!
    texto_modificado = re.sub(
        r'setTimeout\s*\(\s*(?:function\s*\(\)\s*\{|\(\)\s*=>\s*\{)\s*fetch\s*\(\s*["\']/?footer\.html["\']\s*\)[\s\S]*?\}\s*,\s*150\s*\)\s*;?',
        '', texto_modificado, flags=re.IGNORECASE
    )
    
    # 3. Limpeza de sobras (caso a tag <script> original fique apenas com um event listener vazio)
    texto_modificado = re.sub(
        r'<script>\s*document\.addEventListener\(\s*["\']DOMContentLoaded["\']\s*,\s*(?:function\s*\(\)\s*\{|\(\)\s*=>\s*\{)\s*\}\s*\)\s*;?\s*</script>\n?',
        '', texto_modificado, flags=re.IGNORECASE
    )

    # 4. Exclui a div isolada do footer
    texto_modificado = re.sub(r'<div[^>]*id=["\']footer-placeholder["\'][^>]*>\s*</div>\n?', '', texto_modificado, flags=re.IGNORECASE)

    # ---------------------------------------------------------
    # CORREÇÃO 4: Scripts da tag Main
    # ---------------------------------------------------------
    texto_modificado = re.sub(r'<script[^>]*src=["\'][^"\']*global-scripts\.js["\'][^>]*>\s*</script>\n?', '', texto_modificado, flags=re.IGNORECASE)
    texto_modificado = re.sub(r'<script[^>]*src=["\'][^"\']*lang-selector\.js["\'][^>]*>\s*</script>\n?', '', texto_modificado, flags=re.IGNORECASE)

    # ---------------------------------------------------------
    # CORREÇÃO 1 e 2: Header Block Seguro (Deletar antigas)
    # ---------------------------------------------------------
    # Apaga as tags de anti-cls, global header e language selector de qualquer lugar do código
    texto_modificado = re.sub(r'<style[^>]*id=["\']anti-cls-placeholders["\'][^>]*>.*?</style>\n?', '', texto_modificado, flags=re.IGNORECASE | re.DOTALL)
    texto_modificado = re.sub(r'<div[^>]*id=["\']global-header-container["\'][^>]*>\s*</div>\n?', '', texto_modificado, flags=re.IGNORECASE)
    texto_modificado = re.sub(r'<div[^>]*id=["\']language-selector-placeholder["\'][^>]*>\s*</div>\n?', '', texto_modificado, flags=re.IGNORECASE)

    # ---------------------------------------------------------
    # INJEÇÕES (Escrevendo o novo código nos locais corretos)
    # ---------------------------------------------------------
    # Injetar Header Block (Sempre antes da abertura da tag <main)
    texto_modificado = re.sub(r'(<main\b)', BLOCO_HEADER + '\n' + r'\1', texto_modificado, count=1, flags=re.IGNORECASE)

    # Injetar Footer (Sempre antes do fechamento do body)
    texto_modificado = re.sub(r'(</body>)', BLOCO_FOOTER + '\n' + r'\1', texto_modificado, flags=re.IGNORECASE)

    # Injetar Scripts Globais (Sempre após a main)
    texto_modificado = re.sub(r'(</main>)', r'\1\n' + BLOCO_SCRIPTS, texto_modificado, flags=re.IGNORECASE)

    # ==========================================
    # SALVAMENTO
    # ==========================================
    if texto_modificado != texto_original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(texto_modificado)
        contadores['htmls_modificados'] += 1
    else:
        contadores['htmls_nao_modificados'] += 1

def main():
    print("Iniciando varredura automatizada com Regex Cirúrgica...")
    
    contadores = {
        'htmls_modificados': 0,
        'arquivos_ja_corrigidos_anteriormente': 0,
        'htmls_nao_modificados': 0,
        'codigos_duplicados_corrigidos': 0,
        'caminhos_incorretos_corrigidos': 0,
    }

    base_dir = os.path.abspath(DIRETORIO_RAIZ)

    for root, dirs, files in os.walk(base_dir):
        rel_path = os.path.relpath(root, base_dir)
        partes_path = rel_path.split(os.sep)
        
        if partes_path[0] not in PASTAS_PERMITIDAS:
            continue

        for file in files:
            if not file.endswith('.html'):
                continue
                
            if file in ARQUIVOS_PROIBIDOS:
                continue

            filepath = os.path.join(root, file)
            try:
                processar_html(filepath, contadores)
            except Exception as e:
                print(f"Erro ao processar {filepath}: {e}")

    # Log Final no Terminal
    print("\n" + "="*60)
    print(" 🛠️  RELATÓRIO DA AUTOMAÇÃO CONCLUÍDA")
    print("="*60)
    print(f"📄 HTMLs modificados e salvos: {contadores['htmls_modificados']}")
    print(f"✔️  Arquivos JÁ CORRIGIDOS anteriormente: {contadores['arquivos_ja_corrigidos_anteriormente']}")
    print(f"✔️  HTMLs Não Modificados (Estrutura intocada): {contadores['htmls_nao_modificados']}")
    print(f"🗑️  Ação de Duplicidades Excluídas: {contadores['codigos_duplicados_corrigidos']}")
    print(f"🔗 Ação de Caminhos Incorretos Corrigidos: {contadores['caminhos_incorretos_corrigidos']}")
    print("="*60)

if __name__ == "__main__":
    main()