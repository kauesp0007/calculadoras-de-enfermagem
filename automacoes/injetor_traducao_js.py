import os
import json
import requests
import re
import time
from dotenv import load_dotenv

# Carrega as chaves do arquivo .env silenciosamente[cite: 2]
load_dotenv()

CHAVE_DEEPSEEK = os.getenv("DEEPSEEK_API_KEY")
CHAVE_OPENAI = os.getenv("OPENAI_API_KEY")

if not CHAVE_DEEPSEEK or not CHAVE_OPENAI:
    raise ValueError("⚠️ Chaves da API não encontradas. Verifique se o arquivo .env contém DEEPSEEK_API_KEY e OPENAI_API_KEY.")

def traduzir_lote_em_blocos(textos_para_traduzir, idioma_alvo):
    """
    Divide os textos em blocos e alterna entre DeepSeek e OpenAI. 
    Se um falha, o outro assume como fallback[cite: 2].
    """
    instrucoes_sistema = f"""
    Você é um tradutor especializado em localização de interfaces para a área da saúde/enfermagem.
    Traduza as mensagens/textos do Português para o idioma com o código ISO '{idioma_alvo}'.
    
    REGRAS DE LOCALIZAÇÃO INEGOCIÁVEIS:
    - Traduza este conteúdo para o idioma de destino utilizando linguagem natural e culturalmente apropriada para falantes nativos, evitando traduções literais.
    - Adapte expressões para a forma como são realmente utilizadas no país correspondente, preservando o significado original.
    - Utilize obrigatoriamente a nomenclatura médica e as siglas do idioma a ser traduzido.
    - ATENÇÃO: Unidades de medida, tempo, temperatura e peso DEVEM ser traduzidas e convertidas de acordo com as regras e o sistema métrico/imperial do país de destino da tradução.
    
    REGRAS CRÍTICAS DE PROGRAMAÇÃO:
    1. Retorne APENAS o JSON válido. Sem explicações, sem blocos markdown (```json).
    2. As chaves do JSON (STR_0, STR_1...) DEVEM ser mantidas intactas.
    3. Traduza o valor mantendo pontuações finais, mas NÃO adicione aspas extras.
    4. Placeholders como __INTERP_0__ DEVEM ser mantidos EXATAMENTE como estão.
    5. Preserve tags HTML dentro do texto (ex: <strong>, <em>, <br>). Traduza APENAS o texto ao redor.
    """
    
    url_ds = "https://api.deepseek.com/chat/completions"
    headers_ds = {
        "Authorization": f"Bearer {CHAVE_DEEPSEEK}",
        "Content-Type": "application/json"
    }

    url_oa = "https://api.openai.com/v1/chat/completions"
    headers_oa = {
        "Authorization": f"Bearer {CHAVE_OPENAI}",
        "Content-Type": "application/json"
    }

    # Divide em blocos de ~30 strings cada[cite: 2]
    MAX_POR_BLOCO = 30
    MAX_BLOCOS = 6
    chaves = list(textos_para_traduzir.keys())
    blocos_chaves = [chaves[i:i + MAX_POR_BLOCO] for i in range(0, len(chaves), MAX_POR_BLOCO)]
    
    # Se tiver mais de 6 blocos, junta o excedente no último[cite: 2]
    if len(blocos_chaves) > MAX_BLOCOS:
        excedente = []
        for b in blocos_chaves[MAX_BLOCOS - 1:]:
            excedente.extend(b)
        blocos_chaves = blocos_chaves[:MAX_BLOCOS - 1] + [excedente]
        
    total_blocos = len(blocos_chaves)
    todas_traducoes = {}

    def _tentar_api(url_api, headers_api, payload_api):
        resp = requests.post(url_api, headers=headers_api, json=payload_api, timeout=25) # Timeout de 25s[cite: 2]
        resp.raise_for_status()
        raw = resp.json()["choices"][0]["message"]["content"].strip()
        if raw.startswith("```"):
            raw = re.sub(r'^```(json)?\n', '', raw, flags=re.IGNORECASE)
            raw = re.sub(r'\n```$', '', raw)
        return json.loads(raw)

    for idx_bloco, chaves_bloco in enumerate(blocos_chaves, 1):
        dict_bloco = {k: textos_para_traduzir[k] for k in chaves_bloco}
        
        # Ímpares → DeepSeek, Pares → OpenAI[cite: 2]
        usar_openai = (idx_bloco % 2 == 0)
        provedor = "OpenAI" if usar_openai else "DeepSeek"
        
        if usar_openai:
            api_url = url_oa
            api_headers = headers_oa
            api_payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": instrucoes_sistema},
                    {"role": "user", "content": json.dumps(dict_bloco, ensure_ascii=False)}
                ],
                "temperature": 0.0,
                "response_format": {"type": "json_object"}
            }
        else:
            api_url = url_ds
            api_headers = headers_ds
            api_payload = {
                "model": "deepseek-v4-flash", # Utilizando o modelo flash do DeepSeek[cite: 2]
                "messages": [
                    {"role": "system", "content": instrucoes_sistema},
                    {"role": "user", "content": json.dumps(dict_bloco, ensure_ascii=False)}
                ],
                "temperature": 0.0
            }
        
        try:
            print(f"      ↳ Bloco {idx_bloco}/{total_blocos} [{provedor}]: {len(dict_bloco)} str...", end=" ", flush=True)
            traducoes_bloco = _tentar_api(api_url, api_headers, api_payload)
            todas_traducoes.update(traducoes_bloco)
            print("\033[92m✓\033[0m")
        except Exception as e:
            # Fallback: tenta a OUTRA API[cite: 2]
            outro = "OpenAI" if not usar_openai else "DeepSeek"
            print(f"\033[93m↻ {outro}...\033[0m", end=" ", flush=True)
            try:
                if not usar_openai:
                    payload_fb = {
                        "model": "gpt-4o-mini",
                        "messages": [
                            {"role": "system", "content": instrucoes_sistema},
                            {"role": "user", "content": json.dumps(dict_bloco, ensure_ascii=False)}
                        ],
                        "temperature": 0.0,
                        "response_format": {"type": "json_object"}
                    }
                    traducoes_bloco = _tentar_api(url_oa, headers_oa, payload_fb)
                else:
                    payload_fb = {
                        "model": "deepseek-v4-flash",
                        "messages": [
                            {"role": "system", "content": instrucoes_sistema},
                            {"role": "user", "content": json.dumps(dict_bloco, ensure_ascii=False)}
                        ],
                        "temperature": 0.0
                    }
                    traducoes_bloco = _tentar_api(url_ds, headers_ds, payload_fb)
                todas_traducoes.update(traducoes_bloco)
                print("\033[92m✓\033[0m")
            except Exception as e2:
                print("\033[91m✗\033[0m")
                if not todas_traducoes and idx_bloco == total_blocos:
                    print(f"\n⚠️ Todos os blocos falharam. Mantendo JS original.")
                    return None
                    
    return todas_traducoes

def main():
    C_AMARELO = '\033[93m'
    C_VERDE   = '\033[92m'
    C_AZUL    = '\033[96m'
    C_ROXO    = '\033[95m'
    RESET     = '\033[0m'

    # =========================================================================
    # 🟢 ÁREA DE CONFIGURAÇÃO DIÁRIA (ALTERE APENAS AQUI) 🟢[cite: 2]
    # =========================================================================
    
    # Escreva aqui APENAS o nome do arquivo, sem a extensão .html
    arquivos_originais = ["ramsay"] 
    
    # Escolha os idiomas que deseja processar nesta rodada
    idiomas_alvo = ["es"] 
    
    # =========================================================================

    if not os.path.exists("banco_strings_js.json"):
        print(f"{C_AMARELO}⚠️ Arquivo banco_strings_js.json não encontrado! Rode o mapeador primeiro.{RESET}")
        return

    with open("banco_strings_js.json", "r", encoding="utf-8") as f:
        banco = json.load(f)

    for arquivo_chave in arquivos_originais:
        nome_arquivo = f"{arquivo_chave}.html"
        
        if arquivo_chave not in banco:
            print(f"\n{C_AMARELO}⚠️ O arquivo '{arquivo_chave}' não foi encontrado no banco_strings_js.json.{RESET}")
            continue

        lista_strings = banco[arquivo_chave]
        
        for idioma in idiomas_alvo:
            print(f"\n{C_AMARELO}======================================================={RESET}")
            print(f"{C_AZUL}▶ ARQUIVO JS INLINE: {C_AMARELO}{nome_arquivo}{RESET}")
            print(f"{C_AZUL}▶ IDIOMA ALVO:       {C_AMARELO}{idioma} {C_VERDE}(Destino: ./{idioma}/){RESET}")
            print(f"{C_AMARELO}======================================================={RESET}\n")

            caminho_html_destino = os.path.join(os.getcwd(), idioma, nome_arquivo)
            
            if not os.path.exists(caminho_html_destino):
                print(f"      {C_ROXO}↳ Arquivo {nome_arquivo} não existe na pasta /{idioma}/. Pulando.{RESET}")
                continue
                
            print(f"{C_AZUL}[1/3]{RESET} Preparando {len(lista_strings)} strings para tradução...")
            textos_para_traduzir = {f"STR_{i}": item["texto_original"] for i, item in enumerate(lista_strings)}
            
            print(f"{C_AZUL}[2/3]{RESET} Processando APIs e traduzindo textos...")
            traducoes = traduzir_lote_em_blocos(textos_para_traduzir, idioma)
            
            if not traducoes:
                print(f"{C_AMARELO}❌ Falha na API. Pulando idioma.{RESET}")
                continue
                
            print(f"{C_AZUL}[3/3]{RESET} Injetando traduções e salvando o arquivo HTML...")
            with open(caminho_html_destino, 'r', encoding='utf-8') as f:
                html_conteudo = f.read()

            html_modificado = html_conteudo

            # Substituição Cirúrgica Reversa (para não corromper índices)
            for i, item in reversed(list(enumerate(lista_strings))):
                id_str = f"STR_{i}"
                texto_traduzido = traducoes.get(id_str)
                
                if texto_traduzido:
                    if item.get("tipo") == "template":
                        texto_final = texto_traduzido
                        for idx_interp, interp_original in enumerate(item.get("interpolacoes", [])):
                            texto_final = texto_final.replace(f'__INTERP_{idx_interp}__', interp_original)
                        bloco_novo = f"`{texto_final}`"
                    else:
                        texto_escapado = texto_traduzido.replace(item["delimitador"], f"\\{item['delimitador']}")
                        bloco_novo = f"{item['delimitador']}{texto_escapado}{item['delimitador']}"
                    
                    html_modificado = html_modificado.replace(item["bloco_exato"], bloco_novo)

            with open(caminho_html_destino, 'w', encoding='utf-8') as f:
                f.write(html_modificado)
                
            print(f"{C_VERDE}✅ SUCESSO! JS Inline traduzido e salvo em: {caminho_html_destino}{RESET}\n")
            
            # === INÍCIO DA PAUSA DE SEGURANÇA (RATE LIMIT) ===[cite: 2]
            is_last_file = (arquivo_chave == arquivos_originais[-1])
            is_last_lang = (idioma == idiomas_alvo[-1])
            
            if not (is_last_file and is_last_lang):
                print(f"{C_AMARELO}⏳ Pausa de segurança: Aguardando 25 segundos para evitar bloqueios da API...{RESET}")
                time.sleep(25) # Pausa de segurança de 25 segundos[cite: 2]
            # === FIM DA PAUSA DE SEGURANÇA ===[cite: 2]

    print(f"\n{C_AMARELO}======================================================={RESET}")
    print(f"{C_VERDE}🎉 TODA A FILA DE INJEÇÃO JS FOI CONCLUÍDA!{RESET}")
    print(f"{C_AMARELO}======================================================={RESET}\n")

if __name__ == "__main__":
    main()