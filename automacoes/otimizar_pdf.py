import os
import re

# --- REGRAS DE NEGÓCIO ---
PASTAS_IDIOMAS = ['en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 'ja', 'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk']
PASTAS_IGNORADAS = ['downloads', 'biblioteca', 'blog', 'blog-templates', 'locales', 'fonts']
ARQUIVOS_IGNORADOS = [
    'footer.html', 
    'menu-global.html', 
    'global-body-elements.html', 
    'downloads.html', 
    'menu-lateral.html', 
    '_language_selector.html', 
    'googlefc0a17cdd552164b.html'
]

# --- BLOCO DE TEXTO NOVO EVENTO ---
TRECHO_NOVO_EVENTO = """document.getElementById("btnGerarPDF").addEventListener("click", function() {
  const btn = this;
  const textoOriginal = btn.innerHTML;

  // Se a biblioteca já foi carregada nesta sessão, apenas gera o PDF
  if (typeof window.jspdf !== 'undefined') {
    gerarPDF();
    return;
  }

  // Dá um feedback visual rápido para o usuário não clicar duas vezes
  btn.innerHTML = "Carregando gerador...";
  btn.style.opacity = "0.7";
  btn.style.pointerEvents = "none";

  // Cria e injeta o script principal do jsPDF
  const scriptMain = document.createElement('script');
  scriptMain.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
  document.body.appendChild(scriptMain);

  scriptMain.onload = function() {
    // Assim que o principal carregar, injeta o plugin AutoTable
    const scriptPlugin = document.createElement('script');
    scriptPlugin.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js";
    document.body.appendChild(scriptPlugin);

    scriptPlugin.onload = function() {
      // Quando ambos carregarem, restaura o botão e dispara a geração do PDF
      btn.innerHTML = textoOriginal;
      btn.style.opacity = "1";
      btn.style.pointerEvents = "auto";
      gerarPDF();
    };
  };
});"""

# --- FUNÇÕES ---

def obter_htmls_permitidos(diretorio_raiz="."):
    arquivos_validos = []

    for root, dirs, files in os.walk(diretorio_raiz):
        caminho_relativo = os.path.relpath(root, diretorio_raiz)
        partes_caminho = caminho_relativo.split(os.sep)

        # 1. Bloqueia pastas ignoradas
        if any(pasta in PASTAS_IGNORADAS for pasta in partes_caminho):
            dirs[:] = [] 
            continue
            
        # 2. Permite apenas Raiz e Pastas de Idiomas
        if caminho_relativo != '.':
            if partes_caminho[0] not in PASTAS_IDIOMAS:
                dirs[:] = [] 
                continue

        # 3. Filtra os arquivos HTML
        for arquivo in files:
            if arquivo.endswith('.html') and arquivo not in ARQUIVOS_IGNORADOS:
                caminho_completo = os.path.join(root, arquivo)
                arquivos_validos.append(caminho_completo)

    return arquivos_validos

def processar_arquivo(caminho_arquivo):
    with open(caminho_arquivo, 'r', encoding='utf-8') as f:
        conteudo = f.read()

    novo_conteudo = conteudo
    
    # 1. Regex para a Trava do PDF:
    # Procura 'function gerarPDF() {' seguido de qualquer espaço/quebra de linha
    # até chegar no fechamento da condição 'return; }'
    padrao_trava = re.compile(r'function\s+gerarPDF\(\)\s*\{\s*if\s*\(\s*typeof\s+window\.jspdf\s*===\s*["\']undefined["\']\s*\)\s*\{\s*console\.warn\([^)]+\);\s*return;\s*\}', re.DOTALL)
    
    if padrao_trava.search(novo_conteudo):
        novo_conteudo = padrao_trava.sub('function gerarPDF() {', novo_conteudo)

    # 2. Regex para o Evento Antigo do Botão:
    # Procura a linha do addEventListener independente de espaços ou aspas simples/duplas
    padrao_evento = re.compile(r'document\.getElementById\(\s*["\']btnGerarPDF["\']\s*\)\.addEventListener\(\s*["\']click["\']\s*,\s*gerarPDF\s*\);?')
    
    if padrao_evento.search(novo_conteudo):
        # Escapamos contra-barras no trecho novo caso existam para não bugar o regex de substituição
        substituicao_segura = TRECHO_NOVO_EVENTO.replace('\\', '\\\\')
        novo_conteudo = padrao_evento.sub(substituicao_segura, novo_conteudo)

    # Verifica se houve mudança para salvar
    if novo_conteudo != conteudo:
        with open(caminho_arquivo, 'w', encoding='utf-8') as f:
            f.write(novo_conteudo)
        return True 
    
    return False

# --- EXECUÇÃO PRINCIPAL ---
def executar():
    print("Iniciando varredura nos arquivos HTML...")
    
    # Busca a partir da raiz atual
    arquivos = obter_htmls_permitidos(".")
    
    alterados = 0
    nao_alterados = 0

    for arquivo in arquivos:
        sucesso = processar_arquivo(arquivo)
        if sucesso:
            alterados += 1
        else:
            nao_alterados += 1

    # Log de Saída Exigido
    print("-" * 40)
    print("Resumo da Operação:")
    print(f"Arquivos mapeados: {len(arquivos)}")
    print(f"Arquivos alterados: {alterados}")
    print(f"Arquivos que não precisaram ser alterados: {nao_alterados}")
    print("-" * 40)

if __name__ == "__main__":
    executar()