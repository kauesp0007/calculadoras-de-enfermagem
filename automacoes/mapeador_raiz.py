import os
import json
import re

ARQUIVOS_ALVO = [
    "prism.html", "qsofa.html", "ramsay.html", "Richmond.html", 
    "saps.html", "silverman.html", "sofá.html", "tinetti.html", 
    "waterlow.html", "zarit.html", "moca.html"
]

def é_texto_traduzivel(texto_bruto):
    # 1. Limpa as variáveis/interpolações temporariamente para a análise
    texto_limpo = re.sub(r'__INTERP_\d+__', '', texto_bruto)
    texto_limpo = re.sub(r'\$\{[^}]+\}', '', texto_limpo)
    
    # 2. Remove tags HTML e verifica se sobrou TEXTO REAL
    texto_sem_html = re.sub(r'<[^>]+>', '', texto_limpo).strip()
    if len(texto_sem_html) < 2 or not re.search(r'[a-zA-ZÀ-ÿ]', texto_sem_html):
        return False
        
    texto_analise = texto_limpo.strip()
    
    # 3. Ignora strings SEM espaços (identificadores de código: chaves JSON, IDs, classes CSS, etc.)
    #    Só permite se tiver acentos PT ou for uma frase com pontuação natural
    if ' ' not in texto_analise:
        # Lista de exceções: palavras PT curtas que são texto real sem espaços
        pt_single_words = {'sim', 'não', 'nao', 'nome', 'idade', 'setor', 'leito', 'total',
                          'máximo', 'maximo', 'obtido', 'grau', 'status', 'normal', 'alterado'}
        if texto_analise.lower() not in pt_single_words:
            return False
    
    # 4. JSON-LD e SEO Markup
    if texto_analise.startswith('@'):
        return False
        
    # 5. Extensões de arquivo, URLs, paths
    if re.search(r'\.(pdf|json|html|png|jpg|webp|svg|js|css|ico)$', texto_analise, re.IGNORECASE):
        return False
    if texto_analise.startswith(('http', 'www', '/', '#', '.', 'data-')):
        return False
        
    # 6. Datas formato ISO
    if re.match(r'^\d{4}-\d{2}-\d{2}T', texto_analise):
        return False
        
    # 7. Medidas, números isolados e cálculos
    if re.match(r'^[+\-]?\d+(\.\d+)?\s*(em|px|rem|vh|vw|%|s|ms|deg)?$', texto_analise):
        return False
        
    # 8. Funções CSS inline (ex: rotate(0deg))
    if re.match(r'^[a-z\-]+\([^)]*\)$', texto_analise):
        return False
        
    # 9. Classes Tailwind e estilos inline
    if re.match(r'^[a-z0-9\-:\s\[\]\.\/]+$', texto_analise):
        kws_css = ['text-', 'bg-', 'font-', 'border-', 'flex', 'gap-', 'items-', 'mt-', 'mb-', 'pt-', 'pb-', 'rounded']
        if any(kw in texto_analise for kw in kws_css):
            return False
    if any(kw in texto_analise for kw in ['background-color:', 'width:', 'color:', 'font-size:', 'display:']):
        return False
        
    return True

def extrair_strings_js_avancado(codigo_js):
    strings_detectadas = []
    
    # =========================================================================
    # PASSO A: Isolar e processar as Template Literals (crases) PRIMEIRO
    # =========================================================================
    padrao_template = re.compile(r'`([^`]*)`')
    codigo_sem_templates = codigo_js
    
    for match_tmpl in padrao_template.finditer(codigo_js):
        bloco_completo = match_tmpl.group(0)
        conteudo = match_tmpl.group(1)
        
        # MÁSCARA: Oculta o template do código para a próxima etapa não ler
        # atributos HTML (ex: id="${item.id}") como se fossem strings normais
        codigo_sem_templates = codigo_sem_templates.replace(bloco_completo, "__TMPL_MASK__")
        
        if not conteudo.strip():
            continue
            
        interps = re.findall(r'\$\{[^}]+\}', conteudo)
        texto_limpo = conteudo
        for i, interp in enumerate(interps):
            texto_limpo = texto_limpo.replace(interp, f'__INTERP_{i}__', 1)
            
        if é_texto_traduzivel(texto_limpo):
            strings_detectadas.append({
                "texto_original": texto_limpo,
                "delimitador": '`',
                "bloco_exato": bloco_completo,
                "tipo": "template",
                "interpolacoes": interps
            })
            
    # =========================================================================
    # PASSO B: Processar strings normais (" " ou ' ') apenas no que sobrou
    # =========================================================================
    padrao_string = re.compile(r'"([^"\\]*(?:\\.[^"\\]*)*)"|\'([^\'\\]*(?:\\.[^\'\\]*)*)\'')
    for match in padrao_string.finditer(codigo_sem_templates):
        if match.group(1) is not None:
            delimitador = '"'
            conteudo = match.group(1)
        else:
            delimitador = "'"
            conteudo = match.group(2)
            
        if é_texto_traduzivel(conteudo):
            strings_detectadas.append({
                "texto_original": conteudo,
                "delimitador": delimitador,
                "bloco_exato": match.group(0),
                "tipo": "string"
            })

    return strings_detectadas

def main():
    banco_de_strings = {}
    arquivos_alterados = 0
    arquivos_nao_alterados = 0

    for nome_arquivo in ARQUIVOS_ALVO:
        caminho_completo = os.path.join(os.getcwd(), nome_arquivo)
        
        if not os.path.exists(caminho_completo):
            arquivos_nao_alterados += 1
            print(f"Arquivo não localizado na raiz: {nome_arquivo}")
            continue
            
        try:
            with open(caminho_completo, 'r', encoding='utf-8') as f:
                conteudo_html = f.read()
            
            regex_script_inline = re.compile(r'<script\b(?![^>]*\bsrc=)[^>]*>(.*?)</script>', re.IGNORECASE | re.DOTALL)
            blocos_js = regex_script_inline.findall(conteudo_html)
            
            strings_do_arquivo = []
            for bloco in blocos_js:
                strings_do_arquivo.extend(extrair_strings_js_avancado(bloco))
                
            if strings_do_arquivo:
                chave_nome = os.path.splitext(nome_arquivo)[0]
                banco_de_strings[chave_nome] = strings_do_arquivo
                arquivos_alterados += 1
            else:
                arquivos_nao_alterados += 1
                
        except Exception as e:
            print(f"Erro ao processar {nome_arquivo}: {e}")
            arquivos_nao_alterados += 1

    with open("banco_strings_js.json", "w", encoding="utf-8") as f:
        json.dump(banco_de_strings, f, ensure_ascii=False, indent=4)

    print("\n--- Resumo do Mapeamento ULTRA Cirúrgico ---")
    print(f"Arquivos mapeados com sucesso: {arquivos_alterados}")
    print(f"Arquivos ignorados/sem strings válidas: {arquivos_nao_alterados}")
    print("Banco de dados gerado: banco_strings_js.json")

if __name__ == "__main__":
    main()