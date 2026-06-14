import os
from datetime import datetime


html = 0
imagens = 0
css = 0
js = 0


for raiz, pastas, arquivos in os.walk("."):

    for arquivo in arquivos:

        if arquivo.endswith(".html"):
            html += 1

        elif arquivo.endswith((".png", ".jpg", ".jpeg", ".webp")):
            imagens += 1

        elif arquivo.endswith(".css"):
            css += 1

        elif arquivo.endswith(".js"):
            js += 1



data = datetime.now().strftime("%d/%m/%Y %H:%M:%S")


relatorio = f"""
==============================
RELATÓRIO DO SITE
==============================

Data da análise:
{data}

Páginas HTML:
{html}

Imagens:
{imagens}

Arquivos CSS:
{css}

Arquivos JS:
{js}

==============================
"""


print(relatorio)


with open("relatorio_site.txt", "w", encoding="utf-8") as arquivo:

    arquivo.write(relatorio)


print("Arquivo relatorio_site.txt criado com sucesso!")