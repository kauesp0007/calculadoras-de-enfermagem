import os
import re
import time
import subprocess
import deepl
from dotenv import load_dotenv

# Cores para o terminal (Inspirado no seu tradutor_inteligente.py)
C_AMARELO = '\033[93m'
C_VERDE   = '\033[92m'
C_AZUL    = '\033[96m'
C_ROXO    = '\033[95m'
RESET     = '\033[0m'

# Muda o diretório de execução para a raiz do projeto (um nível acima de 'automacoes/')
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Carrega a chave API do DeepL do arquivo .env (que está na raiz)
load_dotenv()
DEEPL_API_KEY = os.getenv("DEEPL_API_KEY")

if not DEEPL_API_KEY:
    raise ValueError("Chave da API não encontrada. Verifique se o arquivo .env existe e contém a DEEPL_API_KEY.")

# Lista de pastas de idiomas em ordem alfabética
idiomas = sorted([
    "ar", "de", "en", "es", "fr", "hi", "id", "it", "ja", 
    "ko", "nl", "pl", "ru", "sv", "tr", "uk", "vi", "zh"
])

# O Novo Bloco Base em Português
NOVO_BLOCO_PT = """
      <!-- INÍCIO: BANNER HERO OTIMIZADO -->
      <section class="mt-2 mb-8" aria-label="Apresentação da Plataforma">
        
        <!-- Bloco Oculto para SEO e Acessibilidade -->
        <div class="sr-only">
          <h1>Calculadoras de Enfermagem, Simulados e Escalas Clínicas</h1>
          <p>Plataforma completa com calculadoras de enfermagem, escalas clínicas, cálculo de dosagem de medicamentos e simulados de concursos públicos. Ideal para estudantes, técnicos e enfermeiros que buscam otimizar a prática diária, reforçar a segurança do paciente e se preparar para provas.</p>
        </div>

        <!-- ATENÇÃO: Se diminuir a altura da imagem, altere o valor 397 no aspect-ratio e no height abaixo -->
        <div class="w-full rounded-xl overflow-hidden shadow-xl bg-[#1A3E74]" style="aspect-ratio: 1280 / 397;">
          <img 
            src="/img/banner_index_h1_calculadoras-de-enfermagem-{LANG}.webp" 
            alt="Profissional de enfermagem ao lado do título Calculadoras de Enfermagem" 
            width="1280" 
            height="397" 
            fetchpriority="high" 
            loading="eager" 
            decoding="sync"
            class="w-full h-auto object-cover block" 
          />
        </div>

      </section>
      <!-- FIM: BANNER HERO OTIMIZADO -->

      <!-- INÍCIO: SEÇÃO DE APRESENTAÇÃO E MINICARDS -->
      <section class="mb-12 -mt-4" aria-label="Sobre a Plataforma">
        
        <!-- Título e Texto (w-full e whitespace-nowrap garantem a linha única no Desktop) -->
        <div class="mb-4 w-full">
          <!-- Subtítulo colado ao texto (mb-1) e com fonte ajustada -->
          <h2 class="text-lg md:text-xl xl:text-2xl font-bold text-[#1A3E74] font-nunito leading-tight mb-1 xl:whitespace-nowrap">
            Tecnologia e conhecimento para uma enfermagem mais eficiente, com domínio e sustentável.
          </h2>
          <p class="text-gray-600 text-xs md:text-sm font-inter xl:whitespace-nowrap">
            Ferramentas clínicas, protocolos, escalas e conteúdo educacional para estudantes, enfermeiros, gestores e instituições de saúde — com responsabilidade digital e impacto mensurável.
          </p>
        </div>

        <!-- Grade de Minicards (Sombreamento Forte, Escuro e Profissional) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          
          <!-- Card 1 -->
          <div class="bg-white rounded-xl p-4 shadow-[0_8px_20px_rgba(26,62,116,0.25)] border border-[#1A3E74]/30 flex flex-col hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(26,62,116,0.4)] transition-all duration-300">
            <div class="text-[#1A3E74] text-xl mb-2" aria-hidden="true">
              <i class="fa-solid fa-earth-americas"></i>
            </div>
            <h3 class="text-[#1A3E74] font-bold text-xs uppercase tracking-wide mb-1">Alcance Global</h3>
            <p class="text-gray-600 text-[11px] leading-relaxed">Tradução para mais de 18 idiomas, abrangendo mais de 140 países.</p>
          </div>

          <!-- Card 2 -->
          <div class="bg-white rounded-xl p-4 shadow-[0_8px_20px_rgba(26,62,116,0.25)] border border-[#1A3E74]/30 flex flex-col hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(26,62,116,0.4)] transition-all duration-300">
            <div class="text-[#1A3E74] text-xl mb-2" aria-hidden="true">
              <i class="fa-solid fa-notes-medical"></i>
            </div>
            <h3 class="text-[#1A3E74] font-bold text-xs uppercase tracking-wide mb-1">Escalas Clínicas</h3>
            <p class="text-gray-600 text-[11px] leading-relaxed">Mais de 60 escalas clínicas e assistenciais automatizadas.</p>
          </div>

          <!-- Card 3 -->
          <div class="bg-white rounded-xl p-4 shadow-[0_8px_20px_rgba(26,62,116,0.25)] border border-[#1A3E74]/30 flex flex-col hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(26,62,116,0.4)] transition-all duration-300">
            <div class="text-[#1A3E74] text-xl mb-2" aria-hidden="true">
              <i class="fa-solid fa-calculator"></i>
            </div>
            <h3 class="text-[#1A3E74] font-bold text-xs uppercase tracking-wide mb-1">Calculadoras</h3>
            <p class="text-gray-600 text-[11px] leading-relaxed">Mais de 15 calculadoras assistenciais para resolver cálculos da rotina da profissão.</p>
          </div>

          <!-- Card 4 -->
          <div class="bg-white rounded-xl p-4 shadow-[0_8px_20px_rgba(26,62,116,0.25)] border border-[#1A3E74]/30 flex flex-col hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(26,62,116,0.4)] transition-all duration-300">
            <div class="text-[#1A3E74] text-xl mb-2" aria-hidden="true">
              <i class="fa-solid fa-laptop-medical"></i>
            </div>
            <h3 class="text-[#1A3E74] font-bold text-xs uppercase tracking-wide mb-1">Simulados</h3>
            <p class="text-gray-600 text-[11px] leading-relaxed">Simulados interativos das principais bancas, divididos por temas com avaliação de tempo e acertos.</p>
          </div>

          <!-- Card 5 -->
          <div class="bg-white rounded-xl p-4 shadow-[0_8px_20px_rgba(26,62,116,0.25)] border border-[#1A3E74]/30 flex flex-col hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(26,62,116,0.4)] transition-all duration-300">
            <div class="text-[#1A3E74] text-xl mb-2" aria-hidden="true">
              <i class="fa-solid fa-book-open"></i>
            </div>
            <h3 class="text-[#1A3E74] font-bold text-xs uppercase tracking-wide mb-1">Biblioteca</h3>
            <p class="text-gray-600 text-[11px] leading-relaxed">Acervo em construção para servir de base exclusiva de conteúdos literários em enfermagem.</p>
          </div>

          <!-- Card 6 -->
          <div class="bg-white rounded-xl p-4 shadow-[0_8px_20px_rgba(26,62,116,0.25)] border border-[#1A3E74]/30 flex flex-col hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(26,62,116,0.4)] transition-all duration-300">
            <div class="text-[#1A3E74] text-xl mb-2" aria-hidden="true">
              <i class="fa-solid fa-user-graduate"></i>
            </div>
            <h3 class="text-[#1A3E74] font-bold text-xs uppercase tracking-wide mb-1">Ensino</h3>
            <p class="text-gray-600 text-[11px] leading-relaxed">Compromisso com o ensino através do desenvolvimento de conteúdos literários exclusivos.</p>
          </div>

          <!-- Card 7 -->
          <div class="bg-white rounded-xl p-4 shadow-[0_8px_20px_rgba(26,62,116,0.25)] border border-[#1A3E74]/30 flex flex-col hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(26,62,116,0.4)] transition-all duration-300">
            <div class="text-[#1A3E74] text-xl mb-2" aria-hidden="true">
              <i class="fa-solid fa-scale-balanced"></i>
            </div>
            <h3 class="text-[#1A3E74] font-bold text-xs uppercase tracking-wide mb-1">Responsabilidade</h3>
            <p class="text-gray-600 text-[11px] leading-relaxed">Créditos à literaturas e uso de referências bibliográficas para direcionar escalas e conteúdos.</p>
          </div>

        </div>
      </section>
      <!-- FIM: SEÇÃO DE APRESENTAÇÃO E MINICARDS -->
"""

# Regex para proteger e restaurar <script> e <style>
SCRIPT_STYLE_PATTERN = re.compile(r'(<script.*?>.*?</script>|<style.*?>.*?</style>)', re.IGNORECASE | re.DOTALL)

def sequestrar_scripts_styles(html):
    """Extrai scripts e styles e os substitui por marcadores seguros."""
    placeholders = {}
    
    def replacer(match):
        chave = f"__PROTECTED_BLOCK_{len(placeholders)}__"
        placeholders[chave] = match.group(1)
        return chave
        
    html_protegido = SCRIPT_STYLE_PATTERN.sub(replacer, html)
    return html_protegido, placeholders

def restaurar_scripts_styles(html_protegido, placeholders):
    """Devolve os scripts e styles originais para os marcadores."""
    html_restaurado = html_protegido
    for chave, conteudo in placeholders.items():
        html_restaurado = html_restaurado.replace(chave, conteudo)
    return html_restaurado

def traduzir_bloco(texto, idioma_alvo):
    """Envia o texto para a API do DeepL utilizando a biblioteca oficial deepl-python."""
    print(f"{C_AZUL}[*]{RESET} Inicializando tradutor DeepL...")
    
    # === COMUNICAÇÃO COM DEEPL ===
    translator = deepl.Translator(DEEPL_API_KEY)
    
    idioma_deepl = idioma_alvo.upper()
    if idioma_deepl == "EN":
        idioma_deepl = "EN-US"
    elif idioma_deepl == "PT":
        idioma_deepl = "PT-BR"
        
    print(f"{C_AZUL}[*]{RESET} Traduzindo bloco de código para {C_AMARELO}{idioma_deepl}{RESET}...")
    
    # Sequestra as tags
    texto_protegido, placeholders = sequestrar_scripts_styles(texto)
    
    # TRUQUE DE PROTEÇÃO: Envolvemos o código em uma div "pai" temporária.
    # O DeepL falha com a mensagem 'text without parent' se receber múltiplas <section> 
    # e comentários soltos sem uma única tag pai principal.
    texto_protegido_envolvido = f'<div id="deepl-temp-wrapper">{texto_protegido}</div>'
    
    try:
        resultado = translator.translate_text(
            texto_protegido_envolvido, 
            target_lang=idioma_deepl,
            tag_handling="html"
        )
        
        texto_traduzido_protegido = resultado.text
        
        # Remove a div "pai" temporária que criamos (usando regex para garantir a limpeza)
        texto_traduzido_protegido = re.sub(r'^<div id=[\'"]deepl-temp-wrapper[\'"]>\s*', '', texto_traduzido_protegido)
        texto_traduzido_protegido = re.sub(r'\s*</div>$', '', texto_traduzido_protegido)
        
        # Restaura as tags
        texto_traduzido_final = restaurar_scripts_styles(texto_traduzido_protegido, placeholders)
        return texto_traduzido_final
    
    except Exception as e:
        print(f"\n{C_AMARELO}⚠️ Erro na comunicação com a API do DeepL: {e}{RESET}")
        return None

def processar_arquivos():
    arquivos_atualizados = 0
    arquivos_ignorados = 0

    print(f"\n{C_ROXO}======================================================={RESET}")
    print(f"{C_VERDE}Iniciando a atualização e tradução cirúrgica dos Index...{RESET}")
    print(f"{C_ROXO}======================================================={RESET}\n")
    
    for idioma in idiomas:
        print(f"{C_AMARELO}======================================================={RESET}")
        print(f"{C_AZUL}▶ IDIOMA ALVO:       {C_AMARELO}{idioma}{RESET}")
        print(f"{C_AMARELO}======================================================={RESET}\n")
        
        caminho_arquivo = os.path.join(idioma, "index.html")
        
        if not os.path.exists(caminho_arquivo):
            print(f"{C_AMARELO}IGNORADO: O arquivo {caminho_arquivo} não existe.{RESET}\n")
            arquivos_ignorados += 1
            continue
            
        print(f"{C_AZUL}[1/4]{RESET} Lendo o arquivo {caminho_arquivo}...")
        
        with open(caminho_arquivo, "r", encoding="utf-8") as f:
            conteudo = f.read()

        # 1. Apagar os blocos antigos usando Regex (re.DOTALL para quebrar linhas)
        # CORREÇÃO CRÍTICA: Os blocos originais podem ter o "aria-label" traduzido nos arquivos de destino.
        # Por isso, usamos [^>]* para capturar atributos extras, focando apenas na identidade estrutural (classes CSS).
        regex_bloco1 = re.compile(r'<section[^>]*class="pt-1 pb-1 header-with-logo mt-0 mb-1"[^>]*>.*?</section>', re.DOTALL | re.IGNORECASE)
        regex_bloco2 = re.compile(r'<section[^>]*class="max-w-7xl mx-auto px-4 mt-6 mb-8"[^>]*>.*?</section>', re.DOTALL | re.IGNORECASE)
        
        conteudo_limpo = regex_bloco1.sub("", conteudo)
        conteudo_limpo = regex_bloco2.sub("", conteudo_limpo)
        
        # 2. Configurar a imagem no Bloco Novo
        # (Isso injeta a sigla correta ex: banner_index_h1_calculadoras-de-enfermagem-en.webp)
        bloco_pronto_pt = NOVO_BLOCO_PT.replace("{LANG}", idioma)
        
        # 3. Traduzir o Novo Bloco
        print(f"{C_AZUL}[2/4]{RESET} Traduzindo o novo bloco...")
        bloco_traduzido = traduzir_bloco(bloco_pronto_pt, idioma)
        
        if bloco_traduzido is None:
            print(f"{C_AMARELO}ERRO CRÍTICO na tradução. Pulando este arquivo.{RESET}\n")
            arquivos_ignorados += 1
            continue
            
        # 4. Injetar o Bloco Novo Traduzido no local correto
        ponto_insercao = '<main id="main-content" class="flex-grow px-4 md:px-8 py-2" style="margin-top: 0">'
        
        if ponto_insercao in conteudo_limpo:
            conteudo_final = conteudo_limpo.replace(
                ponto_insercao, 
                ponto_insercao + "\n" + bloco_traduzido
            )
            
            # Salvar as alterações
            print(f"{C_AZUL}[3/4]{RESET} Injetando bloco e salvando arquivo...")
            with open(caminho_arquivo, "w", encoding="utf-8") as f:
                f.write(conteudo_final)
                
            print(f"{C_VERDE}✅ Substituição e injeção concluídas com sucesso!{RESET}")
            
            # 5. Rodar o Build do Tailwind
            print(f"{C_AZUL}[4/4]{RESET} Executando build do Tailwind...")
            try:
                subprocess.run(r".\node_modules\.bin\tailwindcss -i ./src/input.css -o ./public/output.css --minify", shell=True, check=True)
                print(f"{C_VERDE}✅ Tailwind compilado com sucesso!{RESET}")
            except subprocess.CalledProcessError as e:
                print(f"{C_AMARELO}⚠️ Aviso: O comando do Tailwind falhou.{RESET}")
            
            arquivos_atualizados += 1
            
            # 6. Aguardar 60 segundos se não for o último arquivo
            if idioma != idiomas[-1]:
                print(f"\n{C_AMARELO}⏳ Pausa de segurança: Aguardando 60 segundos para evitar Rate Limit da API...{RESET}\n")
                time.sleep(60)
        else:
            print(f"{C_AMARELO}AVISO: Tag <main id=\"main-content\"...> não encontrada. Arquivo não alterado.{RESET}\n")
            arquivos_ignorados += 1

    # Log Final
    print("\n" + "="*50)
    print("RESUMO DA OPERAÇÃO DE ATUALIZAÇÃO")
    print("="*50)
    print(f"Arquivos alterados e compilados: {C_VERDE}{arquivos_atualizados}{RESET}")
    print(f"Arquivos ignorados/sem necessidade: {C_AMARELO}{arquivos_ignorados}{RESET}")
    print("="*50)

if __name__ == "__main__":
    processar_arquivos()