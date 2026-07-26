"""
MERGE.PY — Etapa 7 do Pipeline de Tradução
===========================================
Lê o cache de extração + traduções e reinsere os textos
traduzidos nos arquivos originais, preservando 100% da estrutura.
"""

import os
import re
import json
import shutil

# ============================================================
# CONFIGURAÇÃO
# ============================================================

RAIZ_PROJETO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PASTA_TRADUTOR = os.path.dirname(os.path.abspath(__file__))
PASTA_CACHE = os.path.join(PASTA_TRADUTOR, "cache")
PASTA_OUTPUT = RAIZ_PROJETO  # Salva direto na raiz: ./{idioma}/arquivo.html

# ============================================================
# REINSERÇÃO
# ============================================================

def reinserir_textos(nome_arquivo, traducoes, pasta_saida=None):
    """
    Reinsere os textos traduzidos no arquivo original.
    
    Args:
        nome_arquivo: nome do arquivo original (ex: 'waterlow.html')
        traducoes: dict {id_original: texto_traduzido}
        pasta_saida: se fornecido, salva em output/{idioma}/ (default: None = sobrescreve)
    
    Returns:
        caminho do arquivo salvo
    """
    caminho_original = os.path.join(RAIZ_PROJETO, nome_arquivo)
    cache_path = os.path.join(PASTA_CACHE, f"{nome_arquivo}.json")
    
    if not os.path.exists(caminho_original):
        print(f"  ⚠️ Arquivo original não encontrado: {nome_arquivo}")
        return None
    
    if not os.path.exists(cache_path):
        print(f"  ⚠️ Cache não encontrado para {nome_arquivo}")
        return None
    
    # Carrega arquivo original e cache de posições
    with open(caminho_original, 'r', encoding='utf-8') as f:
        conteudo = f.read()
    
    with open(cache_path, 'r', encoding='utf-8') as f:
        metadados = json.load(f)
    
    # Converte metadados para dict por ID
    posicoes = {item['id']: item for item in metadados}
    
    # Ordena por posição (de trás para frente para não quebrar índices)
    substituicoes = []
    for id_original, texto_traduzido in traducoes.items():
        if id_original not in posicoes:
            continue
        
        item = posicoes[id_original]
        texto_original = item['texto_original']
        
        # Não substitui se a tradução for igual ao original
        if texto_traduzido == texto_original:
            continue
        
        substituicoes.append({
            'start': item['start'],
            'end': item['end'],
            'texto_novo': texto_traduzido,
        })
    
    # Ordena do final para o início (para não quebrar índices)
    substituicoes.sort(key=lambda x: x['start'], reverse=True)
    
    # Aplica substituições
    conteudo_lista = list(conteudo)
    for sub in substituicoes:
        conteudo_lista[sub['start']:sub['end']] = sub['texto_novo']
    
    conteudo_final = ''.join(conteudo_lista)
    
    # === VALIDAÇÃO DE INTEGRIDADE ===
    erros = validar_integridade(conteudo, conteudo_final)
    if erros:
        print(f"  ⚠️ ALERTA DE INTEGRIDADE ({len(erros)} violações):")
        for e in erros[:5]:
            print(f"     - {e}")
    
    # Salva
    if pasta_saida:
        os.makedirs(pasta_saida, exist_ok=True)
        caminho_saida = os.path.join(pasta_saida, nome_arquivo)
    else:
        caminho_saida = caminho_original
    
    with open(caminho_saida, 'w', encoding='utf-8') as f:
        f.write(conteudo_final)
    
    print(f"  ✅ {len(substituicoes)} textos reinseridos → {caminho_saida}")
    return caminho_saida


def validar_integridade(original, traduzido):
    """
    Valida se estruturas críticas foram preservadas após tradução.
    Retorna lista de violações (vazia = OK).
    """
    erros = []
    
    # Contagem de elementos estruturais
    checks = [
        ('${', 'template literals'),
        ('<svg', 'SVGs'),
        ('class=', 'classes CSS'),
        ('id=', 'IDs HTML'),
        ('href=', 'links'),
        ('src=', 'sources'),
        ('style=', 'styles inline'),
        ('<script', 'scripts'),
        ('</script>', 'fechamento scripts'),
        ('<style', 'estilos'),
        ('</style>', 'fechamento estilos'),
    ]
    
    for token, nome in checks:
        c_orig = original.count(token)
        c_trad = traduzido.count(token)
        if c_orig != c_trad:
            erros.append(f"{nome}: {c_orig} → {c_trad} (diff={c_trad - c_orig})")
    
    return erros


def reinserir_para_idioma(nome_arquivo, idioma, traducoes):
    """
    Reinsere textos no arquivo, salvando em output/{idioma}/.
    """
    pasta_saida = os.path.join(PASTA_OUTPUT, idioma)
    return reinserir_textos(nome_arquivo, traducoes, pasta_saida)


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 3:
        print("Uso: python merge.py <arquivo.html> <idioma>")
        sys.exit(1)
    
    arquivo = sys.argv[1]
    idioma = sys.argv[2]
    
    print("=" * 60)
    print(f"🔀 MERGE — {arquivo} → {idioma}")
    print("=" * 60)
    
    # Aqui as traduções viriam do translate.py ou de um arquivo
    # No pipeline real, o main.py coordena isso
