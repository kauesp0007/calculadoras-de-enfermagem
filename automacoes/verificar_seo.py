import os
from bs4 import BeautifulSoup


sem_title = []
sem_description = []
sem_canonical = []
imagens_sem_alt = []


for raiz, pastas, arquivos in os.walk("."):

    for arquivo in arquivos:

        if arquivo.endswith(".html"):

            caminho = os.path.join(raiz, arquivo)


            try:

                with open(caminho, "r", encoding="utf-8") as f:
                    html = f.read()


                soup = BeautifulSoup(html, "html.parser")


                if not soup.find("title"):
                    sem_title.append(caminho)


                if not soup.find(
                    "meta",
                    attrs={"name": "description"}
                ):
                    sem_description.append(caminho)


                if not soup.find(
                    "link",
                    attrs={"rel": "canonical"}
                ):
                    sem_canonical.append(caminho)


                for img in soup.find_all("img"):

                    if not img.get("alt"):
                        imagens_sem_alt.append(caminho)


            except Exception as erro:

                print("Erro:", caminho, erro)



print("==============================")
print("RELATÓRIO SEO")
print("==============================")


print("\nPáginas sem TITLE:")
print(len(sem_title))


print("\nPáginas sem DESCRIPTION:")
print(len(sem_description))


print("\nPáginas sem CANONICAL:")
print(len(sem_canonical))


print("\nPáginas com imagens sem ALT:")
print(len(imagens_sem_alt))


print("==============================")