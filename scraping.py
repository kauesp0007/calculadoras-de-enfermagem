# -*- coding: utf-8 -*-
import requests
from bs4 import BeautifulSoup
import json
import time

def buscar_vagas(url, retries=5, delay=5):
    """
    Busca vagas de enfermagem na Catho com retentativas em caso de falha.
    Os seletores foram ajustados com base na imagem fornecida pelo usuário.
    """
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    for i in range(retries):
        try:
            print(f"Buscando vagas na URL: {url}")
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()  # Lança um erro para status de resposta ruins (4xx ou 5xx)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # --- SELETORES ATUALIZADOS COM BASE NA IMAGEM ENVIADA ---
            # O contêiner de cada vaga é um <li> com a classe '_1a6_x'.
            all_opportunities = soup.find_all('li', class_='_1a6_x') 
            vagas_encontradas = []
            
            if not all_opportunities:
                print("Aviso: Nenhum contêiner de vaga encontrado. Os seletores podem ter mudado.")
                print(f"Tentativa {i + 1} de {retries} falhou.")
                continue

            for item in all_opportunities:
                try:
                    # O link e o título da vaga estão dentro de um <a> com classes específicas.
                    # A imagem mostrou 'a', class='_1y515 _1qB6_ _2y_a9'
                    vaga_link_element = item.find('a', class_="_1y515 _1qB6_ _2y_a9")
                    
                    if vaga_link_element:
                        vaga_titulo = vaga_link_element.text.strip()
                        vaga_link = f"https://www.catho.com.br{vaga_link_element['href']}"
                        
                        vagas_encontradas.append({
                            "titulo": vaga_titulo,
                            "link": vaga_link
                        })
                    else:
                        print("Erro: Link da vaga não encontrado dentro do contêiner.")
                        continue

                except (AttributeError, TypeError) as e:
                    print(f"Erro ao extrair dados de uma vaga. Seletor não encontrado: {e}")
                    continue
            
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
    url_do_site = 'https://www.catho.com.br/vagas/area-enfermagem/?perfil_id=1&origem=gera-busca'
    
    vagas = buscar_vagas(url_do_site)
    
    salvar_json(vagas)

    if vagas:
        print(f"Sucesso! {len(vagas)} vagas salvas em vagas.json")
    else:
        print("Nenhuma vaga foi encontrada ou houve um erro na busca. O arquivo vagas.json foi criado vazio.")
