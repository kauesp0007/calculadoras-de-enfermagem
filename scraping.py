import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime

def get_vagas_cathojobs():
    url = "https://www.cathojobs.com.br/vagas/enfermagem"
    vagas = []
    try:
        response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
        if response.status_code == 200:
            soup = BeautifulSoup(response.content, 'html.parser')
            job_cards = soup.find_all('div', class_='job-card')
            for card in job_cards:
                title_tag = card.find('h2', class_='text-lg font-bold')
                title = title_tag.text.strip() if title_tag else "Título não encontrado"

                company_tag = card.find('div', class_='text-sm text-gray-600')
                company = company_tag.text.strip() if company_tag else "Empresa não informada"

                location_tag = card.find('p', class_='text-sm text-gray-500')
                location = location_tag.text.strip() if location_tag else None

                link_tag = card.find('a', href=True)
                link = "https://www.cathojobs.com.br" + link_tag['href'] if link_tag else None

                if link:
                    vagas.append({
                        "titulo": title,
                        "empresa": company,
                        "localizacao": location,
                        "link": link
                    })
        else:
            print(f"Erro ao acessar Catho: {response.status_code}")
    except Exception as e:
        print(f"Erro durante o scraping da Catho: {e}")
    return vagas

def get_concursos_sanarsaude():
    url = "https://www.sanarsaude.com.br/carreiras/concursos-publicos/enfermagem"
    concursos = []
    try:
        response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
        if response.status_code == 200:
            soup = BeautifulSoup(response.content, 'html.parser')
            contest_cards = soup.find_all('div', class_='contest-card')
            for card in contest_cards:
                title_tag = card.find('h2', class_='text-lg font-bold')
                title = title_tag.text.strip() if title_tag else "Título não encontrado"

                location_tag = card.find('p', class_='text-sm text-gray-500')
                location = location_tag.text.strip() if location_tag else None

                link_tag = card.find('a', href=True)
                link = "https://www.sanarsaude.com.br" + link_tag['href'] if link_tag else None

                if link:
                    concursos.append({
                        "titulo": title,
                        "localizacao": location,
                        "link": link
                    })
        else:
            print(f"Erro ao acessar SanarSaude: {response.status_code}")
    except Exception as e:
        print(f"Erro durante o scraping da SanarSaude: {e}")
    return concursos

def get_vagas_gupy():
    url = "https://gupy.io/vagas/enfermagem"
    vagas = []
    try:
        response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
        if response.status_code == 200:
            soup = BeautifulSoup(response.content, 'html.parser')
            job_cards = soup.find_all('div', class_='job-card')
            for card in job_cards:
                title_tag = card.find('h2', class_='text-lg font-bold')
                title = title_tag.text.strip() if title_tag else "Título não encontrado"

                company_tag = card.find('div', class_='text-sm text-gray-600')
                company = company_tag.text.strip() if company_tag else "Empresa não informada"

                location_tag = card.find('p', class_='text-sm text-gray-500')
                location = location_tag.text.strip() if location_tag else None

                link_tag = card.find('a', href=True)
                link = "https://gupy.io" + link_tag['href'] if link_tag else None

                if link:
                    vagas.append({
                        "titulo": title,
                        "empresa": company,
                        "localizacao": location,
                        "link": link
                    })
        else:
            print(f"Erro ao acessar Gupy: {response.status_code}")
    except Exception as e:
        print(f"Erro durante o scraping da Gupy: {e}")
    return vagas

if __name__ == "__main__":
    vagas_cathojobs = get_vagas_cathojobs()
    concursos_sanarsaude = get_concursos_sanarsaude()
    vagas_gupy = get_vagas_gupy()

    # Combinar todos os resultados
    all_opportunities = vagas_cathojobs + concursos_sanarsaude + vagas_gupy
    
    # Adicionar a data de coleta a cada item
    now_br_timezone = datetime.now()
    formatted_date = now_br_timezone.strftime("%d/%m/%Y às %H:%M")
    for item in all_opportunities:
