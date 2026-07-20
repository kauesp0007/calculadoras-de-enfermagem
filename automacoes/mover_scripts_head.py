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

# ==============================================================================
# NÚCLEO DO MIGRADOR
# ==============================================================================
def migrar_scripts():
    arquivos_modificados = 0
    arquivos_ignorados = 0
    
    print("🚀 Iniciando migração dos scripts para a <head>...")
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
                    
                    # Verifica se existe um <head> principal no documento
                    head_match = re.search(r'<head>(.*?)</head>', conteudo, flags=re.IGNORECASE | re.DOTALL)
                    
                    if head_match:
                        miolo_head = head_match.group(1)
                        
                        # Se os scripts JÁ estiverem na head principal, pula o arquivo
                        if 'global-scripts.js' in miolo_head and 'lang-selector.js' in miolo_head:
                            arquivos_ignorados += 1
                            continue
                            
                        # 1. RECORTAR: Remove os scripts originais de baixo do </main>
                        # O limitador count=1 garante que ele só remova a ocorrência real e não toque em lógicas internas
                        conteudo = re.sub(r'<script\s+src="/global-scripts\.js"[^>]*></script>\s*', '', conteudo, count=1)
                        conteudo = re.sub(r'<script\s+src="/lang-selector\.js"[^>]*></script>\s*', '', conteudo, count=1)
                        
                        # 2. COLAR: Injeta os scripts limpos antes do </head>
                        # O SEGREDO (count=1): Força a injeção APENAS no primeiro </head> do arquivo (o head verdadeiro).
                        # Isso protege o seu código JavaScript de laudos/pdf que possui "falsos" </head> em strings.
                        novos_scripts = '<script src="/global-scripts.js" defer></script>\n<script src="/lang-selector.js" defer></script>\n'
                        conteudo = re.sub(r'</head>', f'{novos_scripts}</head>', conteudo, count=1, flags=re.IGNORECASE)
                        
                        # Salva o arquivo se houve mudança
                        if conteudo != conteudo_original:
                            with open(caminho, 'w', encoding='utf-8') as f:
                                f.write(conteudo)
                            arquivos_modificados += 1
                            print(f"✅ Migrado: {os.path.relpath(caminho, BASE_DIR)}")
                        else:
                            arquivos_ignorados += 1
                            
                except Exception as e:
                    print(f"❌ Erro em {arquivo}: {e}")

    tempo_total = time.time() - inicio
    
    print("-" * 60)
    print("🎯 Migração Concluída!")
    print(f"✨ Arquivos Atualizados: {arquivos_modificados}")
    print(f"👍 Já estavam na <head>: {arquivos_ignorados}")
    print(f"⏱️  Tempo de execução:   {tempo_total:.2f} segundos")

if __name__ == "__main__":
    migrar_scripts()