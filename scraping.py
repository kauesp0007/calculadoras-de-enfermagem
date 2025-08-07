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
            response = requests.get(url, headers=headers, timeout=10) # Aumentando o timeout para 10 segundos
            response.raise_for_status()  # Lança um erro para status de resposta ruins (4xx ou 5xx)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            all_opportunities = soup.find_all('div', class_='card-oportunidade')
            vagas_encontradas = []
            
            for item in all_opportunities:
                try:
                    vaga_titulo = item.find('h3', class_='card-title').text.strip()
                    vaga_empresa = item.find('p', class_='card-company').text.strip()
                    vaga_local = item.find('p', class_='card-location').text.strip()
                    vaga_link = item.find('a', class_='card-link')['href']

                    vagas_encontradas.append({
                        "titulo": vaga_titulo,
                        "empresa": vaga_empresa,
                        "local": vaga_local,
                        "link": vaga_link
                    })
                except AttributeError:
                    continue
            
            return vagas_encontradas

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
