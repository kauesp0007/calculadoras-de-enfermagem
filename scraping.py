import requests
from bs4 import BeautifulSoup
import json
import time

def buscar_vagas(url, retries=5, delay=5):
    """
    Busca vagas e concursos de enfermagem em uma URL específica
    com retentativas em caso de falha de conexão.
    """
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    for i in range(retries):
        try:
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()  # Lança um erro para status de resposta ruins (4xx ou 5xx)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # --- SELETORES ATUALIZADOS ---
            # O seletor foi ajustado para encontrar a div correta das vagas.
            all_opportunities = soup.find_all('div', class_='px-4 py-3')
            vagas_encontradas = []
            
            for item in all_opportunities:
                try:
                    # Seletores foram ajustados para a nova estrutura
                    vaga_titulo = item.find('h3', class_='text-lg font-bold').text.strip()
                    vaga_empresa = item.find('div', class_='text-sm text-gray-600').text.strip()
                    vaga_local = item.find('p', class_='text-sm text-gray-500').text.strip()
                    vaga_link = item.find('a', href=True)['href']

                    vagas_encontradas.append({
                        "titulo": vaga_titulo,
                        "empresa": vaga_empresa,
                        "local": vaga_local,
                        "link": vaga_link
                    })
                except AttributeError:
                    continue
            
            # Se nenhuma vaga for encontrada, o script continuará e retornará uma lista vazia,
            # mas vamos adicionar um log para informar se algo for encontrado.
            if vagas_encontradas:
                return vagas_encontradas
            else:
                print("Nenhuma vaga encontrada com os seletores atuais.")
                return []

        except (requests.exceptions.RequestException, requests.exceptions.HTTPError) as e:
            print(f"Tentativa {i + 1} de {retries} falhou: {e}")
            if i < retries - 1:
                print(f"Aguardando {delay} segundos antes de tentar novamente...")
                time.sleep(delay)
            else:
                print("Todas as tentativas falharam. Abortando.")
                return []

def salvar_json(data, filename='vagas.json'):
    """
    Salva os dados extraídos em um arquivo JSON.
    """
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

if __name__ == "__main__":
    url_do_site = 'https://vagaseconcursos.com.br/enfermagem' 
    
    print(f"Buscando vagas na URL: {url_do_site}")
    vagas = buscar_vagas(url_do_site)
    
    if vagas:
        salvar_json(vagas)
        print(f"Sucesso! {len(vagas)} vagas salvas em vagas.json")
    else:
        print("Nenhuma vaga foi encontrada ou houve um erro na busca.")
