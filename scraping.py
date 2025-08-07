import requests
from bs4 import BeautifulSoup
import json

def buscar_vagas(url):
    """
    Busca vagas e concursos de enfermagem em uma URL específica
    e retorna uma lista de dicionários.
    """
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.content, 'html.parser')
    
    # Encontra a div que contém todas as oportunidades
    all_opportunities = soup.find_all('div', class_='card-oportunidade')
    
    vagas_encontradas = []
    
    # Itera sobre cada oportunidade encontrada para extrair os dados
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
            # Lida com casos onde um elemento não é encontrado
            continue

    return vagas_encontradas

def salvar_json(data, filename='vagas.json'):
    """
    Salva os dados extraídos em um arquivo JSON.
    """
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

if __name__ == "__main__":
    # URL do site de onde queremos extrair as vagas
    url_do_site = 'https://vagaseconcursos.com.br/enfermagem' 
    
    print(f"Buscando vagas na URL: {url_do_site}")
    vagas = buscar_vagas(url_do_site)
    
    if vagas:
        salvar_json(vagas)
        print(f"Sucesso! {len(vagas)} vagas salvas em vagas.json")
    else:
        print("Nenhuma vaga foi encontrada ou houve um erro na busca.")

