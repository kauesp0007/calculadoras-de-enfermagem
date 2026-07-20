import os
import re
import time

# ==============================================================================
# CONFIGURAÇÕES DO SCRIPT
# ==============================================================================
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

IDIOMAS = [
    'en', 'es', 'fr', 'it', 'de', 'hi', 'zh', 'ja', 'ru', 
    'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk', 'ar'
]

PASTAS_PERMITIDAS = [BASE_DIR] + [os.path.join(BASE_DIR, lang) for lang in IDIOMAS]

ARQUIVOS_PROIBIDOS = [
    'menu-global.html', 'footer.html', '_language_selector.html', 
    'global-body-elements.html', 'offline.html', 'downloads.html', 'googlefc0a17cdd552164b.html'
]

# Script minificado de injeção imediata para zerar o CLS
SCRIPT_IMEDIATO = """
<script id="anti-cls-acessibilidade">
(function(){try{var f=localStorage.getItem("fontSize");if(f&&f!=="1"){var s=["1em","1.15em","1.3em","1.5em","2em"];var i=Math.min(Math.max(parseInt(f,10),1),s.length);document.documentElement.style.fontSize=s[i-1];}if(localStorage.getItem("darkMode")==="true"){document.documentElement.classList.add("dark-mode");}}catch(e){}})();
</script>
"""

# ==============================================================================
# NÚCLEO DO AUTOMATIZADOR
# ==============================================================================
def corrigir_cls_reflow():
    arquivos_modificados = 0
    arquivos_ignorados = 0
    
    print("🚀 Iniciando injeção do Anti-CLS de Acessibilidade...")
    print("-" * 60)
    inicio = time.time()

    for pasta in PASTAS_PERMITIDAS:
        if not os.path.exists(pasta):
            continue
            
        for arquivo in os.listdir(pasta):
            if arquivo.endswith(".html") and arquivo not in ARQUIVOS_PROIBIDOS:
                caminho = os.path.join(pasta, arquivo)
                
                try:
                    with open(caminho, 'r', encoding='utf-8') as f:
                        conteudo = f.read()
                    
                    conteudo_original = conteudo
                    
                    # INJETAR: Script Imediato de Acessibilidade (Prevenção de CLS)
                    # Se o script já existe, não duplica
                    if 'id="anti-cls-acessibilidade"' not in conteudo:
                        # Injeta cirurgicamente no primeiro </head> do documento (protegendo laudos PDF)
                        conteudo = re.sub(
                            r'</head>', 
                            f'{SCRIPT_IMEDIATO.strip()}\n</head>', 
                            conteudo, 
                            count=1, 
                            flags=re.IGNORECASE
                        )
                        
                    # Salva apenas se houve injeção do script
                    if conteudo != conteudo_original:
                        with open(caminho, 'w', encoding='utf-8') as f:
                            f.write(conteudo)
                        arquivos_modificados += 1
                        print(f"✅ Otimizado: {os.path.relpath(caminho, BASE_DIR)}")
                    else:
                        arquivos_ignorados += 1
                            
                except Exception as e:
                    print(f"❌ Erro em {arquivo}: {e}")

    tempo_total = time.time() - inicio
    
    print("-" * 60)
    print("🎯 Otimização de Reflow/CLS Concluída!")
    print(f"✨ Arquivos Atualizados: {arquivos_modificados}")
    print(f"👍 Já estavam limpos:    {arquivos_ignorados}")
    print(f"⏱️  Tempo de execução:   {tempo_total:.2f} segundos")

if __name__ == "__main__":
    corrigir_cls_reflow()