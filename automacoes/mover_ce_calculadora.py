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
    'global-body-elements.html', 'offline.html', 'downloads.html'
]

# ==============================================================================
# NÚCLEO DO MIGRADOR
# ==============================================================================
def migrar_script_calculadora():
    arquivos_modificados = 0
    arquivos_ignorados = 0
    arquivos_nao_possuem = 0
    
    print("🚀 Iniciando migração do 'ce-calculadora-padrao.js' para a <head>...")
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
                    
                    # 🚀 OTIMIZAÇÃO: Se o arquivo não usa esse script, pula instantaneamente!
                    if 'ce-calculadora-padrao.js' not in conteudo:
                        arquivos_nao_possuem += 1
                        continue
                        
                    conteudo_original = conteudo
                    
                    # Verifica se existe um <head> principal no documento
                    head_match = re.search(r'<head>(.*?)</head>', conteudo, flags=re.IGNORECASE | re.DOTALL)
                    
                    if head_match:
                        miolo_head = head_match.group(1)
                        
                        # Se o script JÁ estiver na head principal, pula o arquivo
                        if 'ce-calculadora-padrao.js' in miolo_head:
                            arquivos_ignorados += 1
                            continue
                            
                        # 1. RECORTAR: Remove o script original de baixo do </main> ou do meio do arquivo
                        # A regex pega com ou sem "/ce", e com ou sem "defer", garantindo a limpeza
                        conteudo = re.sub(r'<script\s+(?:[^>]*?\s+)?src="[^"]*ce-calculadora-padrao\.js"[^>]*></script>\s*', '', conteudo, count=1)
                        
                        # 2. COLAR: Injeta o script limpo antes do </head>
                        # Mantido o SEGURANÇA (count=1) para não tocar em strings de laudos PDF!
                        novo_script = '<script src="/ce-calculadora-padrao.js" defer></script>\n'
                        conteudo = re.sub(r'</head>', f'{novo_script}</head>', conteudo, count=1, flags=re.IGNORECASE)
                        
                        # Salva o arquivo se houve mudança
                        if conteudo != conteudo_original:
                            with open(caminho, 'w', encoding='utf-8') as f:
                                f.write(conteudo)
                            arquivos_modificados += 1
                            print(f"✅ Movido: {os.path.relpath(caminho, BASE_DIR)}")
                        else:
                            arquivos_ignorados += 1
                            
                except Exception as e:
                    print(f"❌ Erro em {arquivo}: {e}")

    tempo_total = time.time() - inicio
    
    print("-" * 60)
    print("🎯 Migração Concluída!")
    print(f"✨ Arquivos Atualizados: {arquivos_modificados}")
    print(f"👍 Já estavam na <head>: {arquivos_ignorados}")
    print(f"⏩ Não possuem o script: {arquivos_nao_possuem}")
    print(f"⏱️  Tempo de execução:   {tempo_total:.2f} segundos")

if __name__ == "__main__":
    migrar_script_calculadora()