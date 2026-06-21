import os
import re

# Define o caminho do bloco CSS que você quer inserir
CSS_BLOCO = """
/* ===== Estilos da Grade de Acessos Rápidos (Destaques) ===== */
.featured-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  margin-top: 1rem;
}
@media (min-width: 640px) {
  .featured-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (min-width: 1024px) {
  .featured-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
.featured-item {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  width: 100%;
  height: 100%;
}
.featured-img-wrapper {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(10, 35, 77, 0.15);
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.3s ease;
  background-color: #f3f6fa;
  aspect-ratio: 16 / 9;
  display: block;
}
.featured-img-wrapper:hover {
  transform: scale(1.04);
  box-shadow: 0 18px 35px rgba(10, 35, 77, 0.25);
}
.featured-img-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.featured-btn {
  width: 100%;
  background-color: rgba(30, 58, 138, 0.85);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 14px 16px;
  border-radius: 50px;
  font-weight: bold;
  font-size: 0.9rem;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-decoration: none;
  line-height: 1.3;
  min-height: 64px;
}
.featured-btn:hover {
  background-color: rgba(30, 58, 138, 1);
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
  color: white;
  text-decoration: none;
}
"""

def inserir_css_grade(html, css_bloco):
    """
    Insere o bloco CSS dentro de uma tag <style> no <head> se ele ainda não existir.
    Se já existir, retorna o HTML sem alterações.
    """
    # Marcador para identificar se o CSS já está presente
    marcador = "/* ===== Estilos da Grade de Acessos Rápidos (Destaques) ===== */"
    if marcador in html:
        return html  # Já tem, não altera

    # Procura por </head> para inserir antes
    pos_head = html.lower().find('</head>')
    if pos_head == -1:
        # Se não achar </head>, insere no final do documento (fallback)
        return html + f"<style>{css_bloco}</style>"

    # Vamos tentar inserir dentro de uma tag <style> existente ou criar uma nova.
    # Estratégia: Inserir um novo <style> antes de </head>
    novo_style = f"<style>{css_bloco}</style>"
    html_inserido = html[:pos_head] + novo_style + html[pos_head:]
    return html_inserido

def corrigir_index_idiomas(raiz='.', idiomas=None):
    """
    Escaneia as pastas dos idiomas e corrige os arquivos index.html que não tiverem o CSS.
    """
    if idiomas is None:
        idiomas = ['en','es','fr','it','de','hi','zh','ja','ru','ko','tr','nl','pl','sv','id','vi','uk','ar']
    
    for lang in idiomas:
        pasta = os.path.join(raiz, lang)
        index_path = os.path.join(pasta, 'index.html')
        if not os.path.exists(index_path):
            print(f"⚠️ Arquivo não encontrado: {index_path}")
            continue
        
        with open(index_path, 'r', encoding='utf-8') as f:
            conteudo = f.read()
        
        # Verifica se o bloco já está presente
        if "Estilos da Grade de Acessos Rápidos" in conteudo:
            print(f"✅ {index_path} já possui o CSS. Ignorando.")
            continue
        
        # Insere o CSS
        novo_conteudo = inserir_css_grade(conteudo, CSS_BLOCO)
        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(novo_conteudo)
        print(f"🛠️ CSS inserido em {index_path}")

if __name__ == "__main__":
    # Execute esta função após todas as traduções, antes do build
    corrigir_index_idiomas()