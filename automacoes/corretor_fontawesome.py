import os
import json
import re

JSON_FILE = "relatorio_auditoria_seo.json"

# Regras de exclusão rigorosas baseadas nas restrições do projeto
PASTAS_EXCLUIDAS = ['downloads', 'biblioteca', 'blog', 'blog-templates', 'locales', 'fonts']
FICHEIROS_EXCLUIDOS = [
    'footer.html', 'menu-global.html', 'global-body-elements.html', 
    'downloads.html', 'menu-lateral.html', '_language_selector.html', 
    'googlefc0a17cdd552164b.html'
]

def deve_ignorar_ficheiro(filepath):
    """Verifica se o ficheiro está nas listas de exclusão de pastas ou nomes."""
    nome_ficheiro = os.path.basename(filepath)
    if nome_ficheiro in FICHEIROS_EXCLUIDOS:
        return True
        
    # Normaliza o caminho para garantir que a leitura de pastas funciona em Windows/Mac/Linux
    partes_caminho = filepath.replace('\\', '/').split('/')
    for pasta in PASTAS_EXCLUIDAS:
        if pasta in partes_caminho:
            return True
            
    return False

def remover_fontawesome(conteudo_html):
    """Remove as tags <link> e preloads relacionados ao FontAwesome utilizando Regex para manter a formatação intacta."""
    # 1. Remove ficheiros CSS do font-awesome (locais ou CDN)
    novo_html = re.sub(r'<link[^>]*href=["\'][^"\']*(fontawesome|font-awesome)[^"\']*["\'][^>]*>\s*', '', conteudo_html, flags=re.IGNORECASE)
    
    # 2. Remove os preloads das fontes específicas fa-solid e fa-brands
    novo_html = re.sub(r'<link[^>]*href=["\'][^"\']*fa-(solid|brands)[^"\']*["\'][^>]*>\s*', '', novo_html, flags=re.IGNORECASE)
    
    # 3. Limpa eventuais blocos <noscript> que tenham ficado vazios após a remoção
    novo_html = re.sub(r'<noscript>\s*</noscript>\s*', '', novo_html, flags=re.IGNORECASE)
    
    return novo_html

def main():
    if not os.path.exists(JSON_FILE):
        print(f"❌ Erro: O ficheiro {JSON_FILE} não foi encontrado. Execute o auditor_mestre.py primeiro.")
        return

    print("⚙️ A iniciar o corretor de FontAwesome fantasma...")
    
    with open(JSON_FILE, 'r', encoding='utf-8') as f:
        relatorio = json.load(f)

    alterados = 0
    ignorados = 0

    for item in relatorio:
        filepath = item.get('arquivo')
        dados_fontes = item.get('dados_fontes', {})
        
        # Verifica a condição de erro: FontAwesome carregado mas 0 ícones utilizados
        carregado = dados_fontes.get('font_awesome_carregado', False)
        usos = dados_fontes.get('qtd_icones_fa_usados', -1)
        
        if carregado and usos == 0:
            if deve_ignorar_ficheiro(filepath):
                ignorados += 1
                continue
                
            if os.path.exists(filepath):
                with open(filepath, 'r', encoding='utf-8') as f:
                    conteudo_original = f.read()
                    
                conteudo_limpo = remover_fontawesome(conteudo_original)
                
                # Só escreve se realmente houve mudança
                if conteudo_original != conteudo_limpo:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(conteudo_limpo)
                    alterados += 1
                    print(f"✅ Limpo: {filepath}")
                else:
                    ignorados += 1
            else:
                ignorados += 1
        else:
            # Não tem FA inútil, logo é ignorado
            ignorados += 1

    # Log final conforme as diretrizes do projeto
    print("\n" + "="*45)
    print("🎯 RELATÓRIO DE CORREÇÃO: FONT AWESOME")
    print("="*45)
    print(f"Ficheiros alterados (Otimizados): {alterados}")
    print(f"Ficheiros que não precisaram de alteração: {ignorados}")
    print("="*45)

if __name__ == "__main__":
    main()