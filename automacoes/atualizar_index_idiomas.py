import os
import re
import time
import subprocess
import requests
from dotenv import load_dotenv

# Cores para o terminal
C_AMARELO = '\033[93m'
C_VERDE   = '\033[92m'
C_AZUL    = '\033[96m'
C_ROXO    = '\033[95m'
RESET     = '\033[0m'

# Muda o diretório de execução para a raiz do projeto (um nível acima de 'automacoes/')
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Carrega a chave API do DeepSeek do arquivo .env (que está na raiz)
load_dotenv()
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")

if not DEEPSEEK_API_KEY:
    raise ValueError("Chave da API não encontrada. Verifique se o arquivo .env existe e contém a DEEPSEEK_API_KEY.")

# Lista de pastas de idiomas em ordem alfabética
idiomas = sorted([
    "ar", "de", "en", "es", "fr", "hi", "id", "it", "ja", 
    "ko", "nl", "pl", "ru", "sv", "tr", "uk", "vi", "zh"
])

# O Novo Bloco Base em Português (APENAS o Banner Hero Otimizado para LCP)
NOVO_BLOCO_PT = """
<!-- INÍCIO: BANNER HERO OTIMIZADO -->
<section class="mt-2 mb-8" aria-label="Apresentação da Plataforma">
  <!-- Bloco Oculto para SEO e Acessibilidade -->
  <div class="sr-only">
    <h1>Calculadoras de Enfermagem, Simulados e Escalas Clínicas</h1>
    <p>Plataforma completa com calculadoras de enfermagem, escalas clínicas, cálculo de dosagem de medicamentos e simulados de concursos públicos. Ideal para estudantes, técnicos e enfermeiros que buscam otimizar a prática diária, reforçar a segurança do paciente e se preparar para provas.</p>
  </div>

  <!-- Container com aspect-ratio fixo para blindar contra CLS -->
  <div class="w-full rounded-xl overflow-hidden shadow-xl bg-[#1A3E74] aspect-[1280/397]">
    <img 
      src="/img/banner_index_h1_calculadoras-de-enfermagem-{LANG}.webp" 
      alt="Profissional de enfermagem ao lado do título Calculadoras de Enfermagem" 
      width="1280" 
      height="397" 
      fetchpriority="high" 
      loading="eager" 
      class="hero-banner w-full h-full object-cover block" 
    />
  </div>
</section>
<!-- FIM: BANNER HERO OTIMIZADO -->
"""

def traduzir_bloco_deepseek(texto, idioma_alvo):
    """Envia o texto para a API do DeepSeek mantendo as tags HTML seguras."""
    print(f"{C_AZUL}[*]{RESET} Inicializando tradutor DeepSeek...")
    
    url = "https://api.deepseek.com/chat/completions"
    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json"
    }
    
    # Mapeamento amigável para o prompt da IA
    mapa_idiomas = {
        "ar": "Árabe", "de": "Alemão", "en": "Inglês", "es": "Espanhol", 
        "fr": "Francês", "hi": "Hindi", "id": "Indonésio", "it": "Italiano", 
        "ja": "Japonês", "ko": "Coreano", "nl": "Holandês", "pl": "Polonês", 
        "ru": "Russo", "sv": "Sueco", "tr": "Turco", "uk": "Ucraniano", 
        "vi": "Vietnamita", "zh": "Chinês (Mandarim)"
    }
    nome_idioma = mapa_idiomas.get(idioma_alvo, idioma_alvo)
    print(f"{C_AZUL}[*]{RESET} Traduzindo bloco de código para {C_AMARELO}{nome_idioma}{RESET}...")
    
    system_prompt = (
        "Você é um especialista em desenvolvimento web e tradução de SEO. "
        "Sua tarefa é traduzir o bloco HTML fornecido do português para o idioma solicitado. "
        "REGRAS VITAIS E INEGOCIÁVEIS: "
        "1. Traduza APENAS os textos puros visíveis (como dentro de <h1> e <p>) e atributos de acessibilidade (alt, aria-label). "
        "2. NÃO altere absolutamente nenhuma tag HTML, classes (class do Tailwind), IDs, URLs (src, href) ou comentários. "
        "3. NÃO adicione blocos de markdown (como ```html) na sua resposta. Retorne estritamente o código HTML puro e limpo pronto para uso."
    )
    
    payload = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Traduza este bloco HTML para {nome_idioma}:\n\n{texto}"}
        ],
        "temperature": 0.1 # Temperatura baixa para garantir tradução literal e sem criatividade quebrando o HTML
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=90)
        response.raise_for_status()
        
        resultado = response.json()['choices'][0]['message']['content'].strip()
        
        # Remoção de segurança caso a IA insista em formatar com markdown
        resultado = re.sub(r'^```html\s*', '', resultado, flags=re.IGNORECASE)
        resultado = re.sub(r'^```\s*', '', resultado)
        resultado = re.sub(r'\s*```$', '', resultado)
        
        return resultado
        
    except requests.exceptions.RequestException as e:
        print(f"\n{C_AMARELO}⚠️ Erro de comunicação com a API do DeepSeek: {e}{RESET}")
        if hasattr(e, 'response') and e.response is not None:
             print(f"Detalhes: {e.response.text}")
        return None
    except Exception as e:
        print(f"\n{C_AMARELO}⚠️ Erro inesperado: {e}{RESET}")
        return None

def processar_arquivos():
    arquivos_atualizados = 0
    arquivos_ignorados = 0

    print(f"\n{C_ROXO}======================================================={RESET}")
    print(f"{C_VERDE}Iniciando a Injeção do Banner LCP (DeepSeek)...{RESET}")
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

        ponto_insercao = '<main id="main-content" class="flex-grow px-4 md:px-8 py-2" style="margin-top: 0">'
        
        if ponto_insercao in conteudo:
            # 1. Limpeza Segura (Idempotência)
            # Remove blocos antigos legados (se existirem)
            conteudo_limpo = re.sub(r'<section[^>]*class="pt-1 pb-1 header-with-logo mt-0 mb-1"[^>]*>.*?</section>', '', conteudo, flags=re.DOTALL|re.IGNORECASE)
            conteudo_limpo = re.sub(r'<section[^>]*class="max-w-7xl mx-auto px-4 mt-6 mb-8"[^>]*>.*?</section>', '', conteudo_limpo, flags=re.DOTALL|re.IGNORECASE)
            # Remove o bloco novo caso o script seja rodado duas vezes (evita duplicidade)
            conteudo_limpo = re.sub(r'<!-- INÍCIO: BANNER HERO OTIMIZADO -->.*?<!-- FIM: BANNER HERO OTIMIZADO -->\n*', '', conteudo_limpo, flags=re.DOTALL|re.IGNORECASE)
            
            # 2. Configurar a imagem no Bloco Novo (Injeta a sigla ex: ...-en.webp) ANTES da tradução
            bloco_pronto_pt = NOVO_BLOCO_PT.replace("{LANG}", idioma)
            
            # 3. Traduzir o Novo Bloco
            print(f"{C_AZUL}[2/4]{RESET} Traduzindo o novo bloco...")
            bloco_traduzido = traduzir_bloco_deepseek(bloco_pronto_pt, idioma)
            
            if bloco_traduzido is None:
                print(f"{C_AMARELO}ERRO CRÍTICO na tradução. Pulando este arquivo.{RESET}\n")
                arquivos_ignorados += 1
                continue
                
            # 4. Injetar o Bloco Novo Traduzido logo após a tag main
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
            
            # 6. Aguardar para evitar Rate Limit (DeepSeek é rápido, mas é boa prática manter uma pequena pausa)
            if idioma != idiomas[-1]:
                print(f"\n{C_AMARELO}⏳ Pausa de segurança: Aguardando 10 segundos...{RESET}\n")
                time.sleep(10)
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