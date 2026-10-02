# -*- coding: utf-8 -*-
"""make_es_htmls.py: Generates all 63 Spanish HTML wrapper pages in es/"""
import os, glob, json

PDF_DIR = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\ES"
ES_DIR = r"c:\calculadoras-de-enfermagem\es"
TEMPLATE_PATH = r"c:\calculadoras-de-enfermagem\CATALOGO_INTRUCOES_CRIACAO_DE_FORMULARIOS\ETAPA_2_CONSTRUINDO_PDF_PARA_PAGINA_HTML\TEMPLATE_PAGINA_FORMULARIO_CANONICA.html"

# Load merged mapping
with open(r"c:\calculadoras-de-enfermagem\scripts\pdf_builder_es\map_es1.json", "r", encoding="utf-8") as f:
    MAP_ES = json.load(f)
with open(r"c:\calculadoras-de-enfermagem\scripts\pdf_builder_es\map_es2.json", "r", encoding="utf-8") as f:
    MAP_ES.update(json.load(f))

def translate_template(t):
    t = t.replace('lang="pt-BR"', 'lang="es"')
    t = t.replace('Formulário da {{NOME_CANONICO}} para Imprimir', 'Formulario de la {{NOME_CANONICO}} para Imprimir - Calculadoras de Enfermería')
    t = t.replace('Formulário da {{NOME_CANONICO}}', 'Formulario de la {{NOME_CANONICO}}')
    t = t.replace('FORMULÁRIO HOSPITALAR EM BRANCO • A4', 'FORMULARIO HOSPITALARIO EN BLANCO • A4')
    t = t.replace('1 Página A4', '1 Página A4')
    t = t.replace('Pronto para Impressão', 'Listo para Imprimir')
    t = t.replace('Uso em Prontuário Físico', 'Uso en Historia Clínica Física')
    t = t.replace('Imprimir Ficha', 'Imprimir Ficha')
    t = t.replace('Baixar PDF', 'Descargar PDF')
    t = t.replace('Instruções de Uso Clínico', 'Instrucciones de Uso Clínico')
    t = t.replace('Identificação:</b> Preencha todos os campos do cabeçalho do paciente ou afixe a etiqueta institucional.', 'Identificación:</b> Complete todos los campos del encabezado del paciente o fije la etiqueta institucional.')
    t = t.replace('Pontuação:</b> Assinale com "X" a alternativa correspondente em cada critério avaliado.', 'Puntuación:</b> Marque con una "X" la alternativa correspondiente en cada criterio evaluado.')
    t = t.replace('Conduta:</b> Consulte as faixas de corte na tabela inferior para planejar as intervenções de enfermagem.', 'Conducta:</b> Consulte los rangos de corte en la tabla inferior para planificar las intervenciones de enfermería.')
    t = t.replace('Respaldo Legal:</b> Assine e carimbe com o número do COREN ao término da avaliação.', 'Respaldos Legales:</b> Firme y selle con su número de colegiado/a al finalizar la evaluación.')
    t = t.replace('Visualização do Formulário em Branco', 'Vista Previa del Formulario en Blanco')
    t = t.replace('title="Visualização integral do formulário da {{NOME_CANONICO}}"', 'title="Vista previa integral del formulario de la {{NOME_CANONICO}}"')
    t = t.replace('Documento PDF original em A4 de alta definição. Você pode visualizar acima ou realizar o download para impressão.', 'Documento PDF original en A4 de alta definición. Puede visualizarlo arriba o realizar la descarga para impresión.')
    t = t.replace('Baixar Formulário da {{NOME_CANONICO}}', 'Descargar Formulario de la {{NOME_CANONICO}}')
    t = t.replace('Arquivo PDF Original • 1 Página A4 • Gratuito', 'Archivo PDF Original • 1 Página A4 • Gratuito')
    t = t.replace('Referência Científica:', 'Referencia Científica:')
    t = t.replace('Disponibilizado para uso assistencial e acadêmico por', 'Disponible para uso asistencial y académico en')
    t = t.replace('Calculadoras de Enfermagem', 'Calculadoras de Enfermería')
    t = t.replace('href="/"', 'href="/es/"')
    t = t.replace('href="/formularios-em-branco-de-escalas.html"', 'href="/es/formularios-en-blanco-de-escalas-para-imprimir.html"')
    t = t.replace('>Início<', '>Inicio<')
    t = t.replace('>Formulários<', '>Formularios<')
    t = t.replace('https://www.calculadorasdeenfermagem.com.br/{{SLUG_HTML}}', 'https://www.calculadorasdeenfermagem.com.br/es/{{SLUG_HTML}}')
    t = t.replace('hreflang="pt-br"', 'hreflang="es"')
    return t

def main():
    with open(TEMPLATE_PATH, 'r', encoding='utf-8') as f:
        template = translate_template(f.read())
        
    pdf_files = glob.glob(os.path.join(PDF_DIR, "*.pdf"))
    count = 0
    
    for pdf_path in pdf_files:
        filename = os.path.basename(pdf_path) # e.g. formulario_escala_de_aldrete.pdf
        slug_html = filename.replace('.pdf', '.html') # Standard filename matching PT
        key = filename.replace('formulario_escala_de_', '').replace('formulario_', '').replace('.pdf', '')
        
        if key not in MAP_ES:
            print(f"Skipping {key} - no Spanish map found.")
            continue
            
        title, subtitle = MAP_ES[key]
        html = template
        html = html.replace('{{NOME_CANONICO}}', title)
        html = html.replace('{{SUBTITULO_CLINICO}}', subtitle)
        html = html.replace('{{META_DESCRIPTION}}', f"Formulario imprimible en blanco de la {title} para evaluación clínica. Descargue PDF gratuito en formato A4 para historia clínica física.")
        html = html.replace('{{KEYWORDS}}', f"formulario {title.lower()}, pdf {key}, ficha de evaluacion clinica, calculadora de enfermeria imprimible, hoja en blanco de enfermeria")
        html = html.replace('{{DESCRICAO_USO_CLINICO}}', f"Este es un formulario estandarizado en blanco de la {title}, diseñado para la valoración clínica, evaluación estructurada de enfermería y archivo en la historia clínica física del paciente.")
        html = html.replace('{{REFERENCIA_CIENTIFICA}}', f"Literatura de validación clínica y directrices de referencia principal para la {title}.")
        html = html.replace('{{SLUG_HTML}}', slug_html)
        html = html.replace('{{NOME_ARQUIVO_PDF}}', f"ES/{filename}")
        
        out_path = os.path.join(ES_DIR, slug_html)
        with open(out_path, 'w', encoding='utf-8') as outf:
            outf.write(html)
        count += 1

    print(f"🎉 Successfully generated {count} Spanish HTML wrapper pages in {ES_DIR}!")

if __name__ == "__main__":
    main()
