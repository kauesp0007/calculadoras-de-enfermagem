# -*- coding: utf-8 -*-
import os, glob

PDF_DIR = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\EN"
EN_DIR = r"c:\calculadoras-de-enfermagem\en"
TEMPLATE_PATH = r"c:\calculadoras-de-enfermagem\CATALOGO_INTRUCOES_CRIACAO_DE_FORMULARIOS\ETAPA_2_CONSTRUINDO_PDF_PARA_PAGINA_HTML\TEMPLATE_PAGINA_FORMULARIO_CANONICA.html"

with open(TEMPLATE_PATH, 'r', encoding='utf-8') as f:
    t = f.read()

t = t.replace('lang="pt-BR"', 'lang="en-US"')
t = t.replace('Formulário da {{NOME_CANONICO}} para Imprimir', 'Blank Printable Form for {{NOME_CANONICO}}')
t = t.replace('Formulário da {{NOME_CANONICO}}', 'Blank {{NOME_CANONICO}} Form')
t = t.replace('FORMULÁRIO HOSPITALAR EM BRANCO • A4', 'BLANK HOSPITAL FORM • A4')
t = t.replace('1 Página A4', '1 A4 Page')
t = t.replace('Pronto para Impressão', 'Ready to Print')
t = t.replace('Uso em Prontuário Físico', 'For Physical Patient Records')
t = t.replace('Imprimir Ficha', 'Print Form')
t = t.replace('Baixar PDF', 'Download PDF')
t = t.replace('Instruções de Uso Clínico', 'Clinical Use Instructions')
t = t.replace('Identificação:</b> Preencha todos os campos do cabeçalho do paciente ou afixe a etiqueta institucional.', 'Identification:</b> Fill in all patient header fields or affix the institutional label.')
t = t.replace('Pontuação:</b> Assinale com "X" a alternativa correspondente em cada critério avaliado.', 'Scoring:</b> Mark the corresponding option in each evaluated criterion with an "X".')
t = t.replace('Conduta:</b> Consulte as faixas de corte na tabela inferior para planejar as intervenções de enfermagem.', 'Action Plan:</b> Consult the clinical stratification table at the bottom to plan nursing interventions.')
t = t.replace('Respaldo Legal:</b> Assine e carimbe com o número do COREN ao término da avaliação.', 'Legal Record:</b> Sign and stamp with your professional license number upon completion.')
t = t.replace('Visualização do Formulário em Branco', 'Blank Form Preview')
t = t.replace('title="Visualização integral do formulário da {{NOME_CANONICO}}"', 'title="Full preview of the {{NOME_CANONICO}}"')
t = t.replace('Documento PDF original em A4 de alta definição. Você pode visualizar acima ou realizar o download para impressão.', 'Original high-definition A4 PDF document. You can preview it above or download it for printing.')
t = t.replace('Baixar Formulário da {{NOME_CANONICO}}', 'Download {{NOME_CANONICO}} Form')
t = t.replace('Arquivo PDF Original • 1 Página A4 • Gratuito', 'Original PDF File • 1 A4 Page • Free Download')
t = t.replace('Referência Científica:', 'Scientific Reference:')
t = t.replace('Disponibilizado para uso assistencial e acadêmico por', 'Provided for clinical and academic use by')
t = t.replace('href="/"', 'href="/en/"')
t = t.replace('href="/formularios-em-branco-de-escalas.html"', 'href="/en/blank-scale-forms-for-printing.html"')
t = t.replace('>Início<', '>Home<')
t = t.replace('>Formulários<', '>Forms<')
t = t.replace('https://www.calculadorasdeenfermagem.com.br/{{SLUG_HTML}}', 'https://www.calculadorasdeenfermagem.com.br/en/{{SLUG_HTML}}')
t = t.replace('hreflang="pt-br"', 'hreflang="en"')

pdf_files = glob.glob(os.path.join(PDF_DIR, "*.pdf"))
count = 0

for pdf_path in pdf_files:
    filename = os.path.basename(pdf_path)
    slug_html = filename.replace('.pdf', '.html')
    raw_name = filename.replace('formulario_escala_de_', '').replace('formulario_', '').replace('.pdf', '').replace('_', ' ').replace('-', ' ').title()
    
    title = f"{raw_name} Form"
    subtitle = f"Standardized Printable Clinical Assessment Form for {raw_name}"
    
    html = t
    html = html.replace('{{NOME_CANONICO}}', title)
    html = html.replace('{{SUBTITULO_CLINICO}}', subtitle)
    html = html.replace('{{META_DESCRIPTION}}', f"Printable blank form of the {title} for clinical assessment. Download free PDF in A4 format for physical patient records.")
    html = html.replace('{{KEYWORDS}}', f"{title.lower()}, {raw_name.lower()} pdf, clinical assessment sheet, printable nursing calculator, blank nursing form")
    html = html.replace('{{DESCRICAO_USO_CLINICO}}', f"This is a standardized blank form for the {title}, designed for clinical evaluation, structured nursing assessment, and physical patient records.")
    html = html.replace('{{REFERENCIA_CIENTIFICA}}', f"Clinical validation literature and primary reference guidelines for {title}.")
    html = html.replace('{{SLUG_HTML}}', slug_html)
    html = html.replace('{{NOME_ARQUIVO_PDF}}', f"EN/{filename}")
    
    out_path = os.path.join(EN_DIR, slug_html)
    with open(out_path, 'w', encoding='utf-8') as outf:
        outf.write(html)
    count += 1

print(f"Successfully generated {count} English HTML forms in {EN_DIR}")
