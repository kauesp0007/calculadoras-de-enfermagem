import fitz  # Biblioteca PyMuPDF para ler o PDF
from openai import OpenAI
import os
import json
import time
from dotenv import load_dotenv

# 1. Carregar variáveis do ficheiro .env
load_dotenv()
api_key = os.getenv("DEEPSEEK_API_KEY")

if not api_key:
    print("❌ ERRO: Chave API não encontrada. Verifique o seu ficheiro .env!")
    exit()

# 2. Configurar o cliente DeepSeek
client = OpenAI(
    api_key=api_key, 
    base_url="https://api.deepseek.com"
)

# 3. Caminhos
diretorio_atual = os.path.dirname(os.path.abspath(__file__))
# Atualizado para o caminho do livro do NIC
nome_do_pdf = os.path.join(diretorio_atual, "..", "docs", "nic_classificacao-das-intervencoes-de-enfermagem_7-edicao.pdf")
caminho_json_final = os.path.join(diretorio_atual, "banco_nic_completo.json")
caminho_progresso = os.path.join(diretorio_atual, "progresso_nic.txt")

def extrair_nic_completo():
    print("🚀 A iniciar a Extração Completa do NIC (Processamento em Lotes)...\n")
    print("⚠️ AVISO: Este processo vai demorar alguns minutos. Podes ir beber um café!\n")
    
    try:
        documento = fitz.open(nome_do_pdf)
    except Exception as e:
        print(f"❌ ERRO ao abrir o PDF: {e}")
        return

    # As intervenções começam por volta da página 148 (índice 147 no Python)
    # e vão até a página 1193 (índice 1192)
    PAGINA_INICIAL = 147 
    # Para segurança, vamos até o final do documento se for menor, ou até o limite conhecido
    PAGINA_FINAL = min(1193, len(documento))
    TAMANHO_LOTE = 4 
    
    intervencoes_totais = []
    
    # --- SISTEMA DE CONTINUAÇÃO INTELIGENTE (CHECKPOINT) ---
    if os.path.exists(caminho_progresso) and os.path.exists(caminho_json_final):
        try:
            with open(caminho_progresso, 'r') as f:
                PAGINA_INICIAL = int(f.read().strip())
            with open(caminho_json_final, 'r', encoding='utf-8') as f:
                intervencoes_totais = json.load(f)
            print(f"🔄 Retomando de onde parou: A iniciar na página {PAGINA_INICIAL}.")
            print(f"📦 Já tens {len(intervencoes_totais)} intervenções salvas em segurança!\n")
        except Exception as e:
            print(f"⚠️ Erro ao carregar o progresso, a iniciar do zero: {e}")
    # -------------------------------------------------------
    
    # Prompt rigoroso para a IA focado nas Intervenções NIC
    prompt_sistema = """
    És um especialista na Classificação das Intervenções de Enfermagem (NIC). 
    Lê o texto fornecido e extrai APENAS as intervenções de enfermagem.
    Devolve APENAS um objeto JSON válido, que seja um array de objetos, sem nenhum texto antes ou depois.
    Se o texto não contiver nenhuma intervenção de enfermagem real, devolve APENAS um array vazio: []
    
    O texto geralmente segue este padrão:
    Nome da Intervenção
    Código (4 dígitos)
    Definição: texto
    Atividades:
    • atividade 1
    • atividade 2
    
    Usa exatamente esta estrutura JSON para cada intervenção encontrada:
    [
      {
        "codigo": "ex: 8190",
        "intervencao": "Nome da Intervenção",
        "definicao": "Texto da definição",
        "atividades": ["atividade 1", "atividade 2"]
      }
    ]
    Atenção: Extrai o maior número possível de atividades listadas. As atividades são ações práticas descritas com verbos no infinitivo.
    """
    
    for inicio_lote in range(PAGINA_INICIAL, PAGINA_FINAL, TAMANHO_LOTE):
        fim_lote = min(inicio_lote + TAMANHO_LOTE, PAGINA_FINAL)
        
        print(f"⏳ A processar páginas {inicio_lote} a {fim_lote-1} de {PAGINA_FINAL}...")
        
        texto_extraido = ""
        for i in range(inicio_lote, fim_lote):
            texto_extraido += documento[i].get_text() + "\n"
            
        # Se as páginas tiverem menos de 100 letras, são páginas em branco ou imagens.
        if len(texto_extraido.strip()) < 100:
            print("   ⚠️ Página(s) sem texto suficiente. A avançar...")
            # Atualizar progresso mesmo saltando
            with open(caminho_progresso, 'w', encoding='utf-8') as f:
                f.write(str(fim_lote))
            continue
            
        try:
            # Chamada à API
            resposta = client.chat.completions.create(
                model="deepseek-chat",
                messages=[
                    {"role": "system", "content": prompt_sistema},
                    {"role": "user", "content": f"Extrai os dados deste texto:\n\n{texto_extraido}"}
                ],
                max_tokens=3500, # Aumentado um pouco para acomodar longas listas de atividades
                temperature=0.1
            )
            
            conteudo_json = resposta.choices[0].message.content.strip()
            
            # Limpeza caso a IA devolva blocos Markdown
            if conteudo_json.startswith("```json"):
                conteudo_json = conteudo_json[7:-3].strip()
            elif conteudo_json.startswith("```"):
                conteudo_json = conteudo_json[3:-3].strip()
                
            dados = json.loads(conteudo_json)
            
            if dados:
                intervencoes_totais.extend(dados)
                print(f"   ✅ Encontradas {len(dados)} intervenção(ões). Total acumulado: {len(intervencoes_totais)}")
                
                # Guarda o ficheiro atualizado a cada lote (segurança contra falhas)
                with open(caminho_json_final, 'w', encoding='utf-8') as f:
                    json.dump(intervencoes_totais, f, ensure_ascii=False, indent=4)
                    
                # Guarda a última página processada no ficheiro de progresso
                with open(caminho_progresso, 'w', encoding='utf-8') as f:
                    f.write(str(fim_lote))
            else:
                print("   ℹ️ Nenhuma intervenção encontrada neste lote.")
                
                # Mesmo sem encontrar nada, guardamos o progresso para ele não repetir estas páginas!
                with open(caminho_progresso, 'w', encoding='utf-8') as f:
                    f.write(str(fim_lote))
                    
        except json.JSONDecodeError:
            print(f"   ❌ ERRO: A IA devolveu um formato confuso neste lote. A ignorar para não estragar a base de dados.")
        except Exception as e:
            print(f"   ❌ ERRO de comunicação: {e}")
            print("   A aguardar 10 segundos antes de tentar novamente...")
            time.sleep(10)
            
        # Pausa obrigatória de 3 segundos para não exceder limites da API
        time.sleep(3)

    print(f"\n🎉 EXTRAÇÃO CONCLUÍDA! O teu banco de dados do NIC está pronto em: {caminho_json_final}")
    print(f"No total, automatizámos a leitura de {len(intervencoes_totais)} intervenções!")

if __name__ == "__main__":
    extrair_nic_completo()