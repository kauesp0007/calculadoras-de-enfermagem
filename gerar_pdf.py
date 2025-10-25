import pdfkit

# Caminho opcional para o wkhtmltopdf, use se o Python não encontrar automaticamente
path_wkhtmltopdf = r"C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe"
config = pdfkit.configuration(wkhtmltopdf=path_wkhtmltopdf)

# HTML local que você quer transformar em PDF
html_file = "index.html"  # ou o nome do seu arquivo no repositório
output_pdf = "resultado.pdf"

# Opções para manter o layout fiel e sem quebras
options = {
    'page-size': 'A4',
    'encoding': 'UTF-8',
    'margin-top': '0mm',
    'margin-right': '0mm',
    'margin-bottom': '0mm',
    'margin-left': '0mm',
    'disable-smart-shrinking': '',
    'zoom': '1.0',
    'dpi': 300,
}

pdfkit.from_file(html_file, output_pdf, configuration=config, options=options)

print("✅ PDF gerado com sucesso:", output_pdf)
