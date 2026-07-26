"""
Padroniza TODOS os Hero Cards do projeto conforme o target pattern.
Remove max-w-*, mx-auto, corrige gradientes, shadows, padding, glassmorphism.
"""
import os
import re

IDIOMAS = ['ar','de','en','es','fr','hi','id','it','ja','ko','nl','pl','ru','sv','tr','uk','vi','zh']
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

EXCLUIR_PASTAS = {'downloads','biblioteca','blog','blog-templates','locales','fonts',
    'node_modules','.git','public','img','automacoes','assets','css','font',
    'js','admin','src','dist','.vscode','institucionais'}
EXCLUIR_ARQUIVOS = {'footer.html','menu-global.html','global-body-elements.html',
    'downloads.html','menu-lateral.html','_language_selector.html',
    'googlefc0a17cdd552164b.html'}

total_fix = 0
total_ok = 0
total_sem_hero = 0

# ============================================================
# PADROES DE HERO E SUAS CORRECOES
# ============================================================

def tem_hero(html):
    """Detecta se o arquivo tem uma hero section (gradiente azul no topo)."""
    patterns = [
        r'from-\[#1A3E74\]',
        r'meem-card-navy',
        r'bg-\[#1A3E74\]/85\s+backdrop-blur',
        r'linear-gradient.*#1[aA]3[eE]74',
        r'Hero Card style',   # copsoq style
    ]
    for p in patterns:
        if re.search(p, html):
            return True
    return False


def corrigir_hero(html):
    """Aplica todas as correcoes no hero section do HTML."""
    original = html
    mudancas = []

    # --- CORRECAO 1: Remover max-w-5xl e max-w-6xl de H2 e H1 dentro de hero sections ---
    # H2/p com max-w-5xl (dentro de hero: text-blue-100 text-base font-medium max-w-5xl...)
    # Captura tanto <p> quanto <h2>. max-w-5xl pode ser ultima classe (sem espaco antes de ")
    old_h2_maxw = re.compile(
        r'(<(?:p|h2)\s+class="text-blue-100\s+text-base\s+font-medium\s+)max-w-5xl(\s?[^"]*")',
        re.IGNORECASE
    )
    if old_h2_maxw.search(html):
        html = old_h2_maxw.sub(r'\1\2', html)
        mudancas.append('-max-w-5xl(H2/p)')

    # H2 copsoq style: text-sm md:text-lg text-blue-100 font-medium max-w-5xl mx-auto leading-relaxed
    old_copsoq_h2 = re.compile(
        r'(<(?:p|h2)\s+class="text-sm\s+md:text-lg\s+text-blue-100\s+font-medium\s+)max-w-5xl\s+mx-auto(\s?[^"]*")',
        re.IGNORECASE
    )
    if old_copsoq_h2.search(html):
        html = old_copsoq_h2.sub(r'\1\2', html)
        mudancas.append('-max-w-5xl+mx-auto(copsoqH2)')

    # H2 calculo style: text-sm md:text-base text-blue-100 font-medium opacity-90 max-w-5xl
    old_calc_h2 = re.compile(
        r'(<(?:p|h2)\s+class="text-sm\s+md:text-base\s+text-blue-100\s+font-medium\s+opacity-90\s+)max-w-5xl(\s?[^"]*")',
        re.IGNORECASE
    )
    if old_calc_h2.search(html):
        html = old_calc_h2.sub(r'\1\2', html)
        mudancas.append('-max-w-5xl(calcH2)')

    # H2 calculo variante (ordem diferente): text-sm md:text-base text-blue-100 max-w-5xl font-medium opacity-90
    old_calc_h2b = re.compile(
        r'(<(?:p|h2)\s+class="text-sm\s+md:text-base\s+text-blue-100\s+)max-w-5xl\s+(font-medium\s+opacity-90")',
        re.IGNORECASE
    )
    if old_calc_h2b.search(html):
        html = old_calc_h2b.sub(r'\1\2', html)
        mudancas.append('-max-w-5xl(calcH2b)')

    # H1 com max-w-6xl (calculo-* style) — max-w-6xl pode ser ultima classe
    old_h1_maxw = re.compile(
        r'(<h1\s+class="[^"]*)max-w-6xl\s*([^"]*")',
        re.IGNORECASE
    )
    if old_h1_maxw.search(html):
        # So remove se estiver dentro de um hero (bg-gradient ou similar)
        html = old_h1_maxw.sub(r'\1\2', html)
        mudancas.append('-max-w-6xl(H1)')

    # Remover font-nunito do H1 (substituir por font-inter se presente)
    old_nunito = re.compile(
        r'(<h1\s+class="[^"]*)font-nunito\s+([^"]*")',
        re.IGNORECASE
    )
    if old_nunito.search(html):
        html = old_nunito.sub(r'\1font-inter \2', html)
        mudancas.append('nunito->inter(H1)')

    # --- CORRECAO 2: Shadow customizada -> shadow-2xl ---
    # Ballard/morse: shadow-[0_15px_35px_rgba(26,62,116,0.35)]
    old_shadow1 = r'shadow-\[0_15px_35px_rgba\(26,62,116,0\.35\)\]'
    if old_shadow1 in html:
        html = html.replace(old_shadow1, 'shadow-2xl')
        mudancas.append('shadow->shadow-2xl')

    old_shadow2 = r'shadow-\[0_12px_32px_rgba\(26,62,116,0\.4\)\]'
    if old_shadow2 in html:
        html = html.replace(old_shadow2, 'shadow-2xl')
        mudancas.append('shadow->shadow-2xl')

    old_shadow3 = r'shadow-\[0_16px_34px_rgba\(0,0,0,0\.45\)\]'
    if old_shadow3 in html:
        html = html.replace(old_shadow3, 'shadow-2xl')
        mudancas.append('shadow->shadow-2xl')

    # --- CORRECAO 3: Gradiente endpoint errado ---
    # Ballard/morse: to-[#0F2B4F] -> to-[#163269]
    old_grad1 = 'to-[#0F2B4F]'
    if old_grad1 in html:
        html = html.replace(old_grad1, 'to-[#163269]')
        mudancas.append('grad:#0F2B4F->#163269')

    # album: to-[#2c5282] -> via-[#1E4D8C] to-[#163269]
    old_grad2 = 'from-[#1A3E74] to-[#2c5282]'
    if old_grad2 in html:
        html = html.replace(old_grad2, 'from-[#1A3E74] via-[#1E4D8C] to-[#163269]')
        mudancas.append('grad:album->padrao')

    # gotejamento/insulina: bg-[#1A3E74]/85 backdrop-blur-md -> gradiente
    old_bg_solid = 'class="bg-[#1A3E74]/85 backdrop-blur-md border border-white/15 rounded-2xl shadow-2xl overflow-hidden"'
    if old_bg_solid in html:
        html = html.replace(old_bg_solid,
            'class="bg-gradient-to-br from-[#1A3E74] via-[#1E4D8C] to-[#163269] backdrop-blur-md border border-white/15 rounded-2xl shadow-2xl overflow-hidden"')
        mudancas.append('bg:solid->gradient')

    # --- CORRECAO 4: Padding de hero ---
    # downes pattern: px-8 md:px-12 py-8 md:py-10 -> px-4 sm:px-8 py-8 md:py-10
    old_pad1 = 'px-8 md:px-12 py-8 md:py-10'
    if old_pad1 in html:
        html = html.replace(old_pad1, 'px-4 sm:px-8 py-8 md:py-10')
        mudancas.append('pad:px-8/12->px-4/sm:px-8')

    # ballard: p-8 md:p-10 -> py-8 md:py-10 px-4 sm:px-8 (no container div que vira section)
    # Isso e tratado pelo replace do container abaixo

    # gotejamento: px-6 md:px-10 py-4 md:py-5 -> py-8 md:py-10 px-4 sm:px-8
    old_pad2 = 'px-6 md:px-10 py-4 md:py-5'
    if old_pad2 in html:
        html = html.replace(old_pad2, 'py-8 md:py-10 px-4 sm:px-8')
        mudancas.append('pad:compact->standard')

    # --- CORRECAO 5: my-5 md:my-7 -> mb-6 ---
    old_my = '<section class="my-5 md:my-7">'
    if old_my in html:
        html = html.replace(old_my, '<section class="mb-6">')
        mudancas.append('my->mb-6')

    # --- CORRECAO 6: Ballard/morse: div container -> section ---
    # div class="relative overflow-hidden rounded-2xl p-8 md:p-10 bg-gradient...
    old_div_hero = re.compile(
        r'<div class="relative overflow-hidden rounded-2xl p-\d+ md:p-\d+ bg-gradient-to-br from-\[#1A3E74\] via-\[#1e4d8c\] to-\[#163269\] flex flex-col md:flex-row items-center justify-between mb-6 shadow-2xl">'
    )
    m = old_div_hero.search(html)
    if m:
        nova = '<section class="relative overflow-hidden bg-gradient-to-br from-[#1A3E74] via-[#1E4D8C] to-[#163269] rounded-2xl shadow-2xl mb-6 py-8 md:py-10 px-4 sm:px-8 w-full">'
        html = html[:m.start()] + nova + html[m.end():]
        # Encontra o </div> correspondente e troca por </section>
        # Procura o fechamento depois do icone (md:w-1/3)
        restante = html[m.start() + len(nova):]
        # Conta profundidade para achar </div> correto
        profundidade = 1
        idx = 0
        for match in re.finditer(r'<(/?)(div|section)\b', restante):
            if match.group(1) == '/':
                profundidade -= 1
                if profundidade == 0:
                    idx = match.start()
                    break
            else:
                profundidade += 1
        if idx > 0:
            html = html[:m.start() + len(nova) + idx] + '</section>' + html[m.start() + len(nova) + idx + len('</div>'):]
        mudancas.append('div->section')

    # --- CORRECAO 7: H1 font-nunito -> font-inter, drop-shadow -> sem ---
    # Ballard H1: text-3xl md:text-5xl font-black text-white tracking-tight mb-4 leading-tight drop-shadow-lg
    old_h1_ballard = 'text-3xl md:text-5xl font-black text-white tracking-tight mb-4 leading-tight drop-shadow-lg'
    if old_h1_ballard in html:
        html = html.replace(old_h1_ballard,
            'text-3xl md:text-5xl font-black leading-tight mb-3 text-white')
        mudancas.append('H1:ballard->padrao')

    # Morse H1: text-3xl md:text-5xl font-black text-white tracking-tight mb-3 leading-tight drop-shadow-lg
    old_h1_morse = 'text-3xl md:text-5xl font-black text-white tracking-tight mb-3 leading-tight drop-shadow-lg'
    if old_h1_morse in html:
        html = html.replace(old_h1_morse,
            'text-3xl md:text-5xl font-black leading-tight mb-3 text-white')
        mudancas.append('H1:morse->padrao')

    # --- CORRECAO 8: Eyebrow com inline style -> classes Tailwind ---
    # meem-card-navy eyebrow: inline style para classes
    old_eyebrow_inline = 'style="color: #93c5fd; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 6px"'
    if old_eyebrow_inline in html:
        html = html.replace(old_eyebrow_inline,
            'class="text-blue-300 text-xs font-bold uppercase tracking-[0.15em] mb-2"')
        mudancas.append('eyebrow:inline->classes')

    # Eyebrow com text-[#93c5fd] tracking-widest -> padrao
    old_eyebrow_custom = 'text-[11px] md:text-xs font-black uppercase tracking-widest text-[#93c5fd] mb-3 drop-shadow-sm'
    if old_eyebrow_custom in html:
        html = html.replace(old_eyebrow_custom,
            'text-blue-300 text-xs font-bold uppercase tracking-[0.15em] mb-2')
        mudancas.append('eyebrow:ballard->padrao')

    # --- CORRECAO 9: H1 com clamp menor -> padrao ---
    # meem: clamp(22px, 4vw, 36px) -> clamp(28px, 5vw, 44px)
    old_clamp_small = 'font-size: clamp(22px, 4vw, 36px)'
    if old_clamp_small in html:
        html = html.replace(old_clamp_small, 'font-size: clamp(28px, 5vw, 44px)')
        mudancas.append('H1:clamp-small->padrao')

    # H1 com inline style -> classes
    old_h1_inline = 'style="color: white; font-size: clamp(28px, 5vw, 44px); font-weight: 900; line-height: 1.2; margin-bottom: 8px"'
    if old_h1_inline in html:
        html = html.replace(old_h1_inline,
            'class="text-3xl md:text-5xl font-black leading-tight mb-3 text-white"')
        mudancas.append('H1:inline->classes')

    # H2 com inline style -> classes
    old_h2_inline = 'style="color: #bfdbfe; font-size: 16px; font-weight: 500"'
    if old_h2_inline in html:
        html = html.replace(old_h2_inline,
            'class="text-blue-100 text-base font-medium"')
        mudancas.append('H2:inline->classes')

    # --- CORRECAO 10: Gotejamento/insulina H1 pequeno ---
    old_h1_small = 'text-2xl md:text-4xl font-black text-white mb-2 tracking-tight leading-snug'
    if old_h1_small in html:
        html = html.replace(old_h1_small,
            'text-3xl md:text-5xl font-black leading-tight mb-3 text-white')
        mudancas.append('H1:small->padrao')

    # Gotejamento H2: text-base md:text-lg -> text-base
    old_h2_large = 'text-base md:text-lg text-blue-100 font-medium max-w-2xl leading-snug'
    if old_h2_large in html:
        html = html.replace(old_h2_large,
            'text-blue-100 text-base font-medium')
        mudancas.append('H2:large->padrao')

    if html != original:
        return html, mudancas
    return html, []


def processar_arquivo(caminho):
    try:
        with open(caminho, 'r', encoding='utf-8') as f:
            content = f.read()
    except:
        return 'erro', 'read'

    if not tem_hero(content):
        return 'sem_hero', []

    corrigido, mudancas = corrigir_hero(content)

    if not mudancas:
        return 'ok', []

    try:
        with open(caminho, 'w', encoding='utf-8') as f:
            f.write(corrigido)
    except:
        return 'erro', 'write'

    return 'fix', mudancas


def main():
    global total_fix, total_ok, total_sem_hero

    # Raiz
    print("=" * 60)
    print("RAIZ")
    print("=" * 60)
    for nome in sorted(os.listdir(RAIZ)):
        if not nome.endswith('.html'): continue
        if nome in EXCLUIR_ARQUIVOS: continue
        caminho = os.path.join(RAIZ, nome)
        if not os.path.isfile(caminho): continue

        status, info = processar_arquivo(caminho)
        if status == 'fix':
            total_fix += 1
            print(f'  FIX {nome}: {", ".join(info)}')
        elif status == 'ok':
            total_ok += 1
        elif status == 'sem_hero':
            total_sem_hero += 1
        elif status == 'erro':
            print(f'  ERR {nome}: {info}')

    # Idiomas
    for idioma in IDIOMAS:
        pasta = os.path.join(RAIZ, idioma)
        if not os.path.isdir(pasta): continue

        ok_i = fix_i = sem_i = 0
        for nome in sorted(os.listdir(pasta)):
            if not nome.endswith('.html'): continue
            if nome in EXCLUIR_ARQUIVOS: continue
            caminho = os.path.join(pasta, nome)
            if not os.path.isfile(caminho): continue

            status, info = processar_arquivo(caminho)
            if status == 'fix': fix_i += 1
            elif status == 'ok': ok_i += 1
            elif status == 'sem_hero': sem_i += 1

        total_fix += fix_i; total_ok += ok_i; total_sem_hero += sem_i
        if fix_i > 0:
            print(f'  [{idioma}/] FIX={fix_i} OK={ok_i}')

    print(f'\n{"=" * 60}')
    print(f'  TOTAL FIX: {total_fix}')
    print(f'  TOTAL OK (ja padrao): {total_ok}')
    print(f'  TOTAL SEM HERO: {total_sem_hero}')
    print(f'{"=" * 60}')


if __name__ == '__main__':
    main()
