import os
import re

# Cores para o terminal
C_AMARELO = '\033[93m'
C_VERDE   = '\033[92m'
C_AZUL    = '\033[96m'
C_ROXO    = '\033[95m'
RESET     = '\033[0m'

# Muda o diretório de execução para a raiz do projeto
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Lista de idiomas incluindo a raiz (pt-br)
idiomas = [""] + sorted([
    "ar", "de", "en", "es", "fr", "hi", "id", "it", "ja", 
    "ko", "nl", "pl", "ru", "sv", "tr", "uk", "vi", "zh"
])

# Arquivos a ignorar
ignored_files = [
    'footer.html', 'menu-global.html', 'global-body-elements.html', 
    'menu-lateral.html', '_language_selector.html', 'googlefc0a17cdd552164b.html',
    'downloads.template.html', 'item.template.html'
]

def processar_arquivos():
    arquivos_alterados = 0
    arquivos_ignorados = 0

    print(f"\n{C_ROXO}======================================================={RESET}")
    print(f"{C_VERDE}Iniciando a Correção Massiva de Acessibilidade (Lighthouse)...{RESET}")
    print(f"{C_ROXO}======================================================={RESET}\n")

    for idioma in idiomas:
        pasta_alvo = idioma if idioma else "."
        nome_idioma = idioma if idioma else "PT-BR (Raiz)"
        print(f"{C_AZUL}[*]{RESET} Escaneando pasta: {C_AMARELO}{nome_idioma}{RESET}")

        if not os.path.exists(pasta_alvo):
            continue

        for filename in os.listdir(pasta_alvo):
            if not filename.endswith('.html') or filename in ignored_files:
                continue

            caminho_arquivo = os.path.join(pasta_alvo, filename)
            
            with open(caminho_arquivo, 'r', encoding='utf-8') as f:
                conteudo_original = f.read()

            conteudo_modificado = conteudo_original
            alterou_algo = False

            # --- CORREÇÃO 1: heading-order (Card Explicativo e Widget Dúvidas) ---
            # Identifica o H3 do Card Explicativo e muda para H2
            padrao_card_explicativo = r'(<div class="bg-white rounded-2xl px-6 py-4 shadow-\[0_16px_34px_rgba\(0,0,0,0\.15\)\] border border-gray-100 mb-6">\s*)<h3([^>]+)>(.*?)</h3>'
            if re.search(padrao_card_explicativo, conteudo_modificado, re.DOTALL):
                conteudo_modificado = re.sub(padrao_card_explicativo, r'\1<h2\2>\3</h2>', conteudo_modificado, flags=re.DOTALL)
                alterou_algo = True

            # Identifica o H4 do Widget de Dúvidas Frequentes e muda para H3
            padrao_widget_duvidas = r'(<div class="bg-\[#F8FBFF\] rounded-xl p-6 border border-\[#E2E8F0\]">\s*)<h4([^>]+)>(.*?)</h4>'
            if re.search(padrao_widget_duvidas, conteudo_modificado, re.DOTALL):
                conteudo_modificado = re.sub(padrao_widget_duvidas, r'\1<h3\2>\3</h3>', conteudo_modificado, flags=re.DOTALL)
                alterou_algo = True
                
            # Identifica o H3 da Referência Bibliográfica e muda para H2
            padrao_ref_bib = r'(<section class="mt-16 pt-8 border-t border-gray-200">\s*)<h3([^>]+)>(.*?)</h3>'
            if re.search(padrao_ref_bib, conteudo_modificado, re.DOTALL):
                conteudo_modificado = re.sub(padrao_ref_bib, r'\1<h2\2>\3</h2>', conteudo_modificado, flags=re.DOTALL)
                alterou_algo = True

            # --- CORREÇÃO 2: link-in-text-block (Referências e Dúvidas Frequentes) ---
            # Injeta a classe underline e hover:text-[#153260] nos links das referências bibliográficas (Padrão Braden/Fugulin)
            padrao_link_ref = r'(<li class="pl-4 border-l-4 border-\[#1A3E74\]">.*?<a\s+href="[^"]+"\s+target="_blank"\s+rel="noopener noreferrer"\s+class="[^"]*)(")'
            if re.search(padrao_link_ref, conteudo_modificado, re.DOTALL):
                def injetar_classes_ref(match):
                    classes_atuais = match.group(1)
                    if 'underline' not in classes_atuais:
                         classes_novas = classes_atuais + ' underline hover:text-[#153260] transition-colors duration-200'
                         return classes_novas + match.group(2)
                    return match.group(0)
                
                novo_conteudo, num_subs = re.subn(padrao_link_ref, injetar_classes_ref, conteudo_modificado, flags=re.DOTALL)
                if num_subs > 0 and novo_conteudo != conteudo_modificado:
                     conteudo_modificado = novo_conteudo
                     alterou_algo = True

            # Injeta a classe underline no link de referência específico do dimensionamento.html
            padrao_link_cofen = r'(<a\s+href="http://www\.cofen\.gov\.br/parecer-normativo-cofen-no-01-2024/"[^>]*class=")([^"]+)(")'
            if re.search(padrao_link_cofen, conteudo_modificado):
                 def injetar_classes_cofen(match):
                     classes_atuais = match.group(2)
                     if 'underline' not in classes_atuais.replace('hover:underline', ''): 
                          classes_novas = classes_atuais.replace('hover:underline', 'underline hover:text-blue-700')
                          return match.group(1) + classes_novas + match.group(3)
                     return match.group(0)
                 
                 novo_conteudo, num_subs = re.subn(padrao_link_cofen, injetar_classes_cofen, conteudo_modificado)
                 if num_subs > 0 and novo_conteudo != conteudo_modificado:
                     conteudo_modificado = novo_conteudo
                     alterou_algo = True

            # Injeta a classe underline no link do widget "Dúvidas Frequentes"
            padrao_link_duvidas = r'(<a\s+href="https://www\.calculadorasdeenfermagem\.com\.br/forum-enfermagem\.html"\s+class=")([^"]+)(")'
            if re.search(padrao_link_duvidas, conteudo_modificado):
                 def injetar_classes_duvidas(match):
                     classes_atuais = match.group(2)
                     if 'underline' not in classes_atuais:
                          classes_novas = classes_atuais.replace('hover:text-[#1A3E74]', 'underline hover:text-[#153260]') if 'hover:text-[#1A3E74]' in classes_atuais else classes_atuais + ' underline'
                          if 'w-fit' not in classes_novas:
                              classes_novas += ' w-fit'
                          return match.group(1) + classes_novas + match.group(3)
                     return match.group(0)
                 
                 novo_conteudo, num_subs = re.subn(padrao_link_duvidas, injetar_classes_duvidas, conteudo_modificado)
                 if num_subs > 0 and novo_conteudo != conteudo_modificado:
                     conteudo_modificado = novo_conteudo
                     alterou_algo = True

            # --- CORREÇÃO 3: button-name (Botões sem texto legível ou oculto no mobile) ---
            # Botão de Calcular Pacientes no dimensionamento.html (Apenas ícone FontAwesome visível)
            padrao_btn_calc = r'(<button id="btnCalcularPacientes"[^>]*?)>'
            if re.search(padrao_btn_calc, conteudo_modificado):
                def injetar_aria_calc(match):
                    atributos = match.group(1)
                    if 'aria-label' not in atributos:
                        # Injeta o aria-label logo antes de fechar a tag de abertura
                        return atributos + ' aria-label="Calcular quantidade de leitos ocupados">'
                    return match.group(0)
                
                novo_conteudo, num_subs = re.subn(padrao_btn_calc, injetar_aria_calc, conteudo_modificado)
                if num_subs > 0 and novo_conteudo != conteudo_modificado:
                     conteudo_modificado = novo_conteudo
                     alterou_algo = True

            # Botão Flutuante Imprimir Laudo (Texto oculto no mobile via 'hidden md:inline')
            padrao_btn_imprimir = r'(<button onclick="imprimirLaudo\(\)"[^>]*?)>'
            if re.search(padrao_btn_imprimir, conteudo_modificado):
                def injetar_aria_imprimir(match):
                    atributos = match.group(1)
                    if 'aria-label' not in atributos:
                        return atributos + ' aria-label="Imprimir Laudo de Dimensionamento">'
                    return match.group(0)
                
                novo_conteudo, num_subs = re.subn(padrao_btn_imprimir, injetar_aria_imprimir, conteudo_modificado)
                if num_subs > 0 and novo_conteudo != conteudo_modificado:
                     conteudo_modificado = novo_conteudo
                     alterou_algo = True


            # --- SALVAR CASO HOUVER ALTERAÇÕES ---
            if alterou_algo:
                with open(caminho_arquivo, 'w', encoding='utf-8') as f:
                    f.write(conteudo_modificado)
                arquivos_alterados += 1
            else:
                arquivos_ignorados += 1

    print("\n" + "="*50)
    print("RESUMO DA OPERAÇÃO (CORREÇÕES LIGHTHOUSE)")
    print("="*50)
    print(f"Arquivos inspecionados e alterados: {C_VERDE}{arquivos_alterados}{RESET}")
    print(f"Arquivos que já estavam corretos ou não aplicáveis: {C_AMARELO}{arquivos_ignorados}{RESET}")
    print("="*50)

if __name__ == "__main__":
    processar_arquivos()