"""
MAIN.PY — Orquestrador do Pipeline de Tradução em 8 Etapas
===========================================================
Fluxo completo:
  extract.py → translate.py → merge.py → localize.py

Uso:
  python main.py extrair                          # Etapas 1-3
  python main.py traduzir waterlow.html en        # Etapas 4-6
  python main.py reinserir waterlow.html en       # Etapa 7
  python main.py localizar waterlow.html en       # Etapa 8
  python main.py tudo waterlow.html en            # Pipeline completo
  python main.py tudo --todos en                  # Todos os arquivos
"""

import os
import sys
import json
import time
import glob
from dotenv import load_dotenv

# Adiciona diretório do tradutor ao path
PASTA_TRADUTOR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, PASTA_TRADUTOR)

from extract import processar_todos_arquivos, PASTA_CACHE
from translate import traduzir_arquivo, carregar_cache_permanente, salvar_cache_permanente
from merge import reinserir_para_idioma, PASTA_OUTPUT
from localize import localizar_html

# ============================================================
# CONFIGURAÇÃO
# ============================================================

load_dotenv(os.path.join(os.path.dirname(PASTA_TRADUTOR), ".env"))

IDIOMAS_SUPORTADOS = ["en", "es", "de", "it", "fr", "hi", "zh", "ar",
                       "ja", "ru", "ko", "tr", "nl", "pl", "sv", "id", "vi", "uk"]

ARQUIVOS_IGNORAR = [
    'file-list.txt', 'ga-credentials.json', 'analytics-data.json',
    'ads.txt', 'BingSiteAuth.xml', 'CNAME', 'ENFERMEIRO.TXT',
    'package.json', 'package-lock.json',
]

# ============================================================
# COMANDOS
# ============================================================

def cmd_extrair():
    """Etapas 1-3: Extrai textos de todos os arquivos."""
    print("=" * 60)
    print("📋 ETAPAS 1-3: Extração de textos")
    print("=" * 60)
    processar_todos_arquivos()
    print("\n✅ Extração concluída. Cache salvo em tradutor/cache/")


def cmd_traduzir(arquivo, idioma):
    """Etapas 4-6: Traduz textos de um arquivo."""
    print("=" * 60)
    print(f"🌐 ETAPAS 4-6: Tradução — {arquivo} → {idioma}")
    print("=" * 60)
    
    resultado = traduzir_arquivo(arquivo, idioma)
    
    if resultado:
        # Salva traduções para uso no merge
        pasta_temp = os.path.join(PASTA_TRADUTOR, "temp")
        os.makedirs(pasta_temp, exist_ok=True)
        arquivo_trad = os.path.join(pasta_temp, f"{arquivo}_{idioma}.json")
        with open(arquivo_trad, 'w', encoding='utf-8') as f:
            json.dump(resultado, f, ensure_ascii=False, indent=2)
        
        print(f"\n✅ {len(resultado)} textos traduzidos. Resultado salvo em {arquivo_trad}")
    else:
        print(f"\n❌ Falha na tradução.")


def cmd_reinserir(arquivo, idioma):
    """Etapa 7: Reinsere traduções no arquivo."""
    print("=" * 60)
    print(f"🔀 ETAPA 7: Reinserção — {arquivo} → {idioma}")
    print("=" * 60)
    
    # Carrega traduções do passo anterior
    pasta_temp = os.path.join(PASTA_TRADUTOR, "temp")
    arquivo_trad = os.path.join(pasta_temp, f"{arquivo}_{idioma}.json")
    
    if not os.path.exists(arquivo_trad):
        print(f"  ⚠️ Traduções não encontradas. Execute 'traduzir' primeiro.")
        return
    
    with open(arquivo_trad, 'r', encoding='utf-8') as f:
        traducoes = json.load(f)
    
    # Converte chaves de string para int (JSON serializa como string)
    traducoes_int = {int(k): v for k, v in traducoes.items()}
    
    reinserir_para_idioma(arquivo, idioma, traducoes_int)
    print(f"\n✅ Arquivo salvo em tradutor/output/{idioma}/{arquivo}")


def cmd_tudo(arquivo, idioma):
    """Pipeline completo para um arquivo."""
    inicio_total = time.time()
    
    print("=" * 60)
    print(f"🚀 PIPELINE COMPLETO — {arquivo} → {idioma}")
    print("=" * 60)
    
    # Etapas 1-3: Extrair (se cache não existir)
    cache_path = os.path.join(PASTA_CACHE, f"{arquivo}.json")
    if not os.path.exists(cache_path):
        print("\n📋 [1-3/7] Extraindo textos...")
        processar_todos_arquivos([f"*{os.path.splitext(arquivo)[1]}"])
    
    # Etapas 4-6: Traduzir
    print(f"\n🌐 [4-6/7] Traduzindo para {idioma}...")
    resultado = traduzir_arquivo(arquivo, idioma)
    
    if not resultado:
        print("\n❌ Pipeline interrompido: falha na tradução.")
        return
    
    # Etapa 7: Reinserir
    print(f"\n🔀 [7/8] Reinserindo textos...")
    traducoes_int = {int(k) if isinstance(k, str) else k: v for k, v in resultado.items()}
    caminho_saida = reinserir_para_idioma(arquivo, idioma, traducoes_int)
    
    # Etapa 8: Localizar (canonical, hreflang, lang, fonts, SEO)
    if caminho_saida:
        print(f"\n🌍 [8/8] Aplicando regras de localização...")
        with open(caminho_saida, 'r', encoding='utf-8') as f:
            html = f.read()
        html_localizado = localizar_html(html, idioma)
        with open(caminho_saida, 'w', encoding='utf-8') as f:
            f.write(html_localizado)
    
    tempo_total = time.time() - inicio_total
    print(f"\n✅ Pipeline completo em {tempo_total:.1f}s")
    print(f"   📁 Saída: tradutor/output/{idioma}/{arquivo}")


def cmd_tudo_todos(idioma):
    """Pipeline completo para TODOS os arquivos HTML."""
    print("=" * 60)
    print(f"🚀 PIPELINE COMPLETO — TODOS OS ARQUIVOS → {idioma}")
    print("=" * 60)
    
    # Primeiro extrai tudo
    print("\n📋 [1-3/7] Extraindo textos de todos os arquivos...")
    processar_todos_arquivos()
    
    # Lista todos os caches gerados
    caches = glob.glob(os.path.join(PASTA_CACHE, "*.json"))
    arquivos = []
    for c in caches:
        nome_base = os.path.basename(c).replace('.json', '')
        if nome_base != '_indice' and nome_base not in ARQUIVOS_IGNORAR:
            arquivos.append(nome_base)
    
    print(f"\n📊 {len(arquivos)} arquivos para processar")
    
    sucessos = 0
    falhas = 0
    
    for i, arquivo in enumerate(arquivos):
        print(f"\n{'='*60}")
        print(f"[{i+1}/{len(arquivos)}] {arquivo}")
        print(f"{'='*60}")
        
        try:
            resultado = traduzir_arquivo(arquivo, idioma)
            if resultado:
                traducoes_int = {int(k) if isinstance(k, str) else k: v
                                 for k, v in resultado.items()}
                caminho_saida = reinserir_para_idioma(arquivo, idioma, traducoes_int)
                
                # Etapa 8: Localizar
                if caminho_saida and os.path.exists(caminho_saida):
                    with open(caminho_saida, 'r', encoding='utf-8') as f:
                        html = f.read()
                    html_localizado = localizar_html(html, idioma)
                    with open(caminho_saida, 'w', encoding='utf-8') as f:
                        f.write(html_localizado)
                
                sucessos += 1
            else:
                falhas += 1
        except Exception as e:
            print(f"  ❌ Erro: {e}")
            falhas += 1
        
        # Pausa entre arquivos
        if i < len(arquivos) - 1:
            print(f"  ⏳ Aguardando 5s entre arquivos...")
            time.sleep(5)
    
    print(f"\n{'='*60}")
    print(f"📊 RESUMO: {sucessos} ✅ | {falhas} ❌")
    print(f"   📁 Saída: tradutor/output/{idioma}/")
    print(f"{'='*60}")


# ============================================================
# HELP
# ============================================================

def mostrar_ajuda():
    print("""
╔══════════════════════════════════════════════════════════╗
║        PIPELINE DE TRADUÇÃO — 7 ETAPAS                   ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  COMANDOS:                                               ║
║                                                          ║
║  python main.py extrair                                  ║
║    Etapas 1-3: Extrai textos de HTML/JS/JSON            ║
║    → cache/{arquivo}.json                                ║
║                                                          ║
║  python main.py traduzir <arquivo> <idioma>              ║
║    Etapas 4-6: Traduz textos via APIs                    ║
║    Ex: python main.py traduzir waterlow.html en          ║
║                                                          ║
║  python main.py reinserir <arquivo> <idioma>             ║
║    Etapa 7: Reinsere textos no arquivo                   ║
║    Ex: python main.py reinserir waterlow.html en         ║
║                                                          ║
║  python main.py tudo <arquivo> <idioma>                  ║
║    Pipeline completo para UM arquivo                     ║
║                                                          ║
║  python main.py tudo --todos <idioma>                    ║
║    Pipeline completo para TODOS os arquivos              ║
║                                                          ║
║  Idiomas: en, es, de, it, fr, hi, zh, ar, ja, ru,       ║
║           ko, tr, nl, pl, sv, id, vi, uk                 ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
""")


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":
    if len(sys.argv) < 2:
        mostrar_ajuda()
        sys.exit(0)
    
    comando = sys.argv[1].lower()
    
    if comando == "extrair":
        cmd_extrair()
    
    elif comando == "traduzir":
        if len(sys.argv) < 4:
            print("Uso: python main.py traduzir <arquivo> <idioma>")
            sys.exit(1)
        cmd_traduzir(sys.argv[2], sys.argv[3])
    
    elif comando == "reinserir":
        if len(sys.argv) < 4:
            print("Uso: python main.py reinserir <arquivo> <idioma>")
            sys.exit(1)
        cmd_reinserir(sys.argv[2], sys.argv[3])
    
    elif comando == "tudo":
        if len(sys.argv) < 3:
            print("Uso: python main.py tudo <arquivo|--todos> <idioma>")
            sys.exit(1)
        
        if sys.argv[2] == "--todos":
            if len(sys.argv) < 4:
                print("Uso: python main.py tudo --todos <idioma>")
                sys.exit(1)
            cmd_tudo_todos(sys.argv[3])
        else:
            if len(sys.argv) < 4:
                print("Uso: python main.py tudo <arquivo> <idioma>")
                sys.exit(1)
            cmd_tudo(sys.argv[2], sys.argv[3])
    
    elif comando in ["help", "--help", "-h", "ajuda"]:
        mostrar_ajuda()
    
    else:
        print(f"Comando desconhecido: {comando}")
        mostrar_ajuda()
