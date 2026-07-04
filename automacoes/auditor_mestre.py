import os
import glob
import json
import time
import re
from bs4 import BeautifulSoup
import concurrent.futures

# Opcional para as integrações de IA (Requer: pip install openai requests)
try:
    from openai import OpenAI
    import requests
except ImportError:
    print("Aviso: Instale as bibliotecas para usar as IAs: pip install openai requests beautifulsoup4")

class Config:
    # Insira suas chaves aqui
    OPENAI_API_KEY = "sk-sua-chave-openai"
    DEEPSEEK_API_KEY = "sk-sua-chave-deepseek"
    DEEPL_API_KEY = "sua-chave-deepl"
    
    # Configurações do Site
    BASE_DIR = os.getcwd() # Ou coloque o caminho exato ex: r"C:\calculadoras-de-enfermagem"
    URL_BASE = "https://www.calculadorasdeenfermagem.com.br"
    
    # Limites (Para não gastar muita API testando)
    MAX_PAGINAS_IA = 5 

class MotoresIA:
    @staticmethod
    def auditar_seo_com_openai(titulo, descricao):
        """Usa OpenAI para avaliar a qualidade persuasiva do SEO"""
        if Config.OPENAI_API_KEY == "sk-sua-chave-openai":
            return "Chave OpenAI não configurada. Pulo da análise semântica."
            
        client = OpenAI(api_key=Config.OPENAI_API_KEY)
        prompt = f"""
        Você é um especialista em SEO. Avalie esta página de enfermagem:
        Título: {titulo}
        Descrição: {descricao}
        Responda em 2 linhas: A descrição é persuasiva e chamativa para profissionais de saúde clicarem? O que melhorar?
        """
        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=100
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            return f"Erro na API OpenAI: {str(e)}"

    @staticmethod
    def traduzir_verificar_deepl(texto, idioma_alvo="EN-US"):
        """Usa DeepL para verificar a fidelidade de uma tradução"""
        if Config.DEEPL_API_KEY == "sua-chave-deepl":
            return "Chave DeepL não configurada."
            
        url = "https://api-free.deepl.com/v2/translate" # Mude para api.deepl.com se for a versão Pro
        payload = {
            "auth_key": Config.DEEPL_API_KEY,
            "text": texto,
            "target_lang": idioma_alvo
        }
        try:
            response = requests.post(url, data=payload)
            return response.json()['translations'][0]['text']
        except Exception as e:
            return f"Erro DeepL: {str(e)}"

class AuditorHTML:
    def __init__(self, filepath):
        self.filepath = filepath
        self.erros = []
        self.avisos = []
        self.dados = {}
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                self.html_raw = f.read()
            self.soup = BeautifulSoup(self.html_raw, 'html.parser')
        except Exception as e:
            self.erros.append(f"Erro ao ler arquivo: {str(e)}")
            self.soup = None

    def analisar_basico(self):
        if not self.soup: return
        
        # 1. Verifica Título
        title_tag = self.soup.find('title')
        if not title_tag or not title_tag.string:
            self.erros.append("Falta a tag <title>")
            self.dados['titulo'] = ""
        else:
            titulo = title_tag.string.strip()
            self.dados['titulo'] = titulo
            if len(titulo) < 30 or len(titulo) > 65:
                self.avisos.append(f"Tamanho do Título subótimo ({len(titulo)} chars). Ideal 30-65.")
                
        # 2. Verifica Meta Description
        desc_tag = self.soup.find('meta', attrs={'name': 'description'})
        if not desc_tag or not desc_tag.get('content'):
            self.erros.append("Falta a <meta name='description'>")
            self.dados['descricao'] = ""
        else:
            descricao = desc_tag['content'].strip()
            self.dados['descricao'] = descricao
            if len(descricao) < 100 or len(descricao) > 160:
                self.avisos.append(f"Tamanho da Descrição subótima ({len(descricao)} chars). Ideal 100-160.")
                
        # 3. Verifica Canonical
        canonical_tag = self.soup.find('link', attrs={'rel': 'canonical'})
        if not canonical_tag:
            self.erros.append("Falta tag Canonical. Risco de conteúdo duplicado.")
            
        # 4. Verifica Viewport
        viewport = self.soup.find('meta', attrs={'name': 'viewport'})
        if not viewport:
            self.erros.append("Falta tag Viewport (Mobile Friendly).")

        # 5. Verifica Estrutura H1
        h1_tags = self.soup.find_all('h1')
        if len(h1_tags) == 0:
            self.erros.append("Página sem tag <h1>.")
        elif len(h1_tags) > 1:
            self.avisos.append(f"Múltiplos <h1> detectados ({len(h1_tags)}). Recomendado apenas 1.")

    def analisar_fontes(self):
        if not self.soup: return
        
        # 1. Mapeamento de preloads (Quais fontes estão na prioridade máxima de download)
        fontes_preload = []
        for link in self.soup.find_all('link', rel='preload', as_='font'):
            href = link.get('href', '')
            if href: fontes_preload.append(href)
            
        self.dados['fontes_preload'] = fontes_preload
        
        # 2. Varredura de FontAwesome Local
        # Procura link tag de CSS que carregue fontawesome localmente
        has_fontawesome_css = bool(self.soup.find('link', href=lambda x: x and ('fontawesome' in x.lower() or 'fa-' in x.lower())))
        # Conta uso real no corpo da página
        icones_fa = self.soup.find_all(class_=re.compile(r'\bfa-.*\b'))
        
        self.dados['font_awesome_carregado'] = has_fontawesome_css
        self.dados['qtd_icones_fa_usados'] = len(icones_fa)
        
        if has_fontawesome_css and len(icones_fa) == 0:
            self.avisos.append("CRÍTICO PARA PERFORMANCE: FontAwesome carregado localmente via CSS, mas NENHUM ícone 'fa-' foi encontrado. Remova o link.")
            
        # 3. Varredura Open Dyslexic Local
        has_dyslexic = bool(self.soup.find('link', href=lambda x: x and 'open-dyslexic' in x.lower()))
        self.dados['open_dyslexic_carregado'] = has_dyslexic
        if has_dyslexic:
            # Apenas documentamos se existe uso de uma class dyslexic no body, opcionalmente
            uso_dyslexic = bool(self.soup.find(class_=re.compile(r'dyslexic')))
            if not uso_dyslexic:
                self.avisos.append("INFO: Open Dyslexic CSS carregado, verificar se o JS de acessibilidade realmente ativa isso nesta página.")

        # 4. Auditoria de Fontes @font-face vs Preload (LCP/Performance)
        font_faces_declarados = set()
        style_blocks = self.soup.find_all('style')
        for style in style_blocks:
            if style.string:
                # Encontra urls de woff2, woff locais declarados no css inline
                urls = re.findall(r"url\(['\"]?(.*?\.(?:woff2|woff|ttf))['\"]?\)", style.string, re.IGNORECASE)
                for u in urls:
                    font_faces_declarados.add(u)
                    
        self.dados['fontes_declaradas_css'] = list(font_faces_declarados)
        
        # Verifica se as fontes locais essenciais (Inter/Nunito) declaradas receberam preload
        for font_url in font_faces_declarados:
            font_lower = font_url.lower()
            if 'inter' in font_lower or 'nunito' in font_lower:
                # Verifica se o href do preload termina igual ou contém a mesma fonte
                is_preloaded = any(font_lower in p.lower() or p.lower().endswith(font_lower.split('/')[-1]) for p in fontes_preload)
                if not is_preloaded:
                    self.avisos.append(f"Fonte essencial '{font_url}' declarada no @font-face, mas SEM preload. Isso prejudica o LCP.")

class Orquestrador:
    def __init__(self):
        self.arquivos_html = []
        self.relatorio = []

    def buscar_arquivos(self):
        print(f"🔍 Buscando arquivos HTML em: {Config.BASE_DIR}")
        padrao = os.path.join(Config.BASE_DIR, '**', '*.html')
        self.arquivos_html = glob.glob(padrao, recursive=True)
        # Filtra pastas de sistema ou modulos (node_modules, etc)
        self.arquivos_html = [f for f in self.arquivos_html if 'node_modules' not in f and '.git' not in f]
        print(f"📚 Encontrados {len(self.arquivos_html)} arquivos HTML.")

    def processar_arquivo(self, filepath):
        auditor = AuditorHTML(filepath)
        auditor.analisar_basico()
        auditor.analisar_fontes() # Executa a nova função de auditoria de fontes locais
        
        resultado = {
            "arquivo": os.path.relpath(filepath, Config.BASE_DIR),
            "titulo": auditor.dados.get('titulo', ''),
            "erros": auditor.erros,
            "avisos": auditor.avisos,
            "dados_fontes": {
                "preloads": auditor.dados.get('fontes_preload', []),
                "font_awesome_carregado": auditor.dados.get('font_awesome_carregado', False),
                "qtd_icones_fa_usados": auditor.dados.get('qtd_icones_fa_usados', 0),
                "open_dyslexic_carregado": auditor.dados.get('open_dyslexic_carregado', False),
                "fontes_declaradas_css": auditor.dados.get('fontes_declaradas_css', [])
            },
            "analise_ia": None
        }
        return resultado

    def executar_auditoria(self):
        self.buscar_arquivos()
        
        print("⚙️  Iniciando auditoria estrutural e de fontes multithread...")
        # Processa os arquivos em paralelo para ser muito mais rápido
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            resultados = list(executor.map(self.processar_arquivo, self.arquivos_html))
            
        self.relatorio = resultados
        
        # Opcional: Rodar IA em uma amostra de páginas
        print("\n🧠 Iniciando análise semântica por IA (Amostra)...")
        paginas_analisadas_ia = 0
        for item in self.relatorio:
            if not item['erros'] and item['titulo']: # Só analisa se tiver título
                if paginas_analisadas_ia < Config.MAX_PAGINAS_IA:
                    print(f"🤖 IA Analisando: {item['arquivo']}")
                    item['analise_ia'] = MotoresIA.auditar_seo_com_openai(
                        item['titulo'], 
                        next((a for a in item.get('avisos', [])), "Sem descrição mapeada") # Simplificado
                    )
                    paginas_analisadas_ia += 1

    def exportar_relatorio(self):
        output_file = "relatorio_auditoria_seo.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(self.relatorio, f, indent=4, ensure_ascii=False)
            
        # Resumo no terminal
        total_erros = sum(len(r['erros']) for r in self.relatorio)
        total_avisos = sum(len(r['avisos']) for r in self.relatorio)
        paginas_fa_fantasma = sum(1 for r in self.relatorio if r.get('dados_fontes', {}).get('font_awesome_carregado') and r.get('dados_fontes', {}).get('qtd_icones_fa_usados') == 0)
        
        print("\n" + "="*40)
        print("📈 RESUMO DA AUDITORIA DE SEO E FONTES LOCAIS")
        print("="*40)
        print(f"Páginas analisadas: {len(self.relatorio)}")
        print(f"Total de Erros Críticos (SEO): {total_erros}")
        print(f"Total de Avisos (Desempenho/Tamanho): {total_avisos}")
        print(f"⚠️ Páginas carregando FontAwesome inútil: {paginas_fa_fantasma}")
        print(f"Relatório completo salvo em: {output_file}")
        print("="*40)

if __name__ == "__main__":
    print("🚀 Inicializando Auditor Mestre de SEO e Estrutura...")
    orquestrador = Orquestrador()
    orquestrador.executar_auditoria()
    orquestrador.exportar_relatorio()