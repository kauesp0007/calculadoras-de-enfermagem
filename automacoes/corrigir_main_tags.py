"""
Corrige a tag <main> em todos os HTMLs elegiveis do projeto.
Garante: class="flex-grow p-4 sm:p-8" (sem container, sem max-w-*)
Preserva: id, text-center, relative, mt-*, mb-*, flex, flex-col, lg:flex-row, lg:space-x-*, w-full
Remove: container, max-w-*, mx-auto, px-*, py-*, md:px-*, md:p-*, lg:w-*
Adiciona: flex-grow (se faltar), p-4 sm:p-8
"""
import os
import re
import sys

# Pastas de idiomas
IDIOMAS = ['ar','de','en','es','fr','hi','id','it','ja','ko','nl','pl','ru','sv','tr','uk','vi','zh']

# Pastas e arquivos excluidos
EXCLUIR_PASTAS = {
    'downloads','biblioteca','blog','blog-templates','locales','fonts',
    'node_modules','.git','public','img','automacoes','assets','css','font',
    'js','admin','src','dist','.vscode','institucionais'
}
EXCLUIR_ARQUIVOS = {
    'footer.html','menu-global.html','global-body-elements.html',
    'downloads.html','menu-lateral.html','_language_selector.html',
    'googlefc0a17cdd552164b.html'
}

# Classes que DEVEM ser mantidas alem de flex-grow p-4 sm:p-8
CLASSES_PERMITIDAS = {
    'text-center', 'relative', 'mt-12', 'mt-24',
    'flex', 'flex-col', 'lg:flex-row', 'lg:space-x-8',
    'w-full',
}

# Classes que DEVEM ser removidas
CLASSES_PROIBIDAS_PADRAO = re.compile(
    r'\bcontainer\b|'
    r'\bmax-w-(?:5xl|6xl|7xl|screen-xl|\[1600px\])\b|'
    r'\bmx-auto\b|'
    r'\bpx-\d+\b|'
    r'\bpy-\d+\b|'
    r'\bmd:px-\d+\b|'
    r'\bmd:p-\d+\b|'
    r'\blg:w-\S+\b|'
    r'\bmt-12\b|'   # sera readicionado se permitido
    r'\bmt-24\b'    # sera readicionado se permitido
)


def extrair_classes(attrs_str):
    """Extrai a lista de classes do atributo class="..." """
    m = re.search(r'class="([^"]*)"', attrs_str)
    if not m:
        return []
    return m.group(1).split()


def extrair_id(attrs_str):
    """Extrai o id se existir"""
    m = re.search(r'id="([^"]*)"', attrs_str)
    return m.group(1) if m else None


def extrair_style(attrs_str):
    """Extrai style inline se existir"""
    m = re.search(r'style="([^"]*)"', attrs_str)
    return m.group(1) if m else None


def corrigir_main_tag(html):
    """Encontra e corrige a tag <main> no HTML. Pula matches dentro de comentarios CSS."""
    padrao = re.compile(r'<main\b([^>]*)/?>', re.IGNORECASE)

    melhor_match = None
    for m in padrao.finditer(html):
        # Pula se estiver dentro de comentario CSS /* ... */
        antes = html[:m.start()]
        ultimo_abre = antes.rfind('/*')
        ultimo_fecha = antes.rfind('*/')
        if ultimo_abre > ultimo_fecha:
            continue  # esta dentro de comentario CSS
        melhor_match = m
        break  # primeiro match fora de comentario

    if melhor_match is None:
        return html, None  # sem main (ou so dentro de comentarios)

    m = melhor_match
    attrs_str = m.group(1)
    classes = extrair_classes(attrs_str)
    elem_id = extrair_id(attrs_str)
    style = extrair_style(attrs_str)

    # Filtra classes: mantem so as permitidas
    classes_limpas = [c for c in classes if c in CLASSES_PERMITIDAS]

    # Determina classes base obrigatorias
    tem_flex_grow = ('flex-grow' in classes_limpas)
    tem_p4 = ('p-4' in classes_limpas)
    tem_smp8 = ('sm:p-8' in classes_limpas)

    # Remove duplicatas antes de montar
    classes_limpas = [c for c in classes_limpas if c not in ('flex-grow', 'p-4', 'sm:p-8')]

    # Monta nova lista: flex-grow p-4 sm:p-8 primeiro, depois extras
    novas_classes = ['flex-grow', 'p-4', 'sm:p-8'] + classes_limpas

    # Monta a nova tag
    partes = []
    if elem_id:
        partes.append(f'id="{elem_id}"')
    partes.append(f'class="{" ".join(novas_classes)}"')
    if style:
        # Remove padding do style inline para nao conflitar
        style_limpo = re.sub(r'padding\s*:\s*[^;]+;?\s*', '', style).strip()
        style_limpo = re.sub(r'flex\s*:\s*1\s*;?\s*', '', style_limpo).strip()
        if style_limpo:
            partes.append(f'style="{style_limpo}"')

    nova_tag = f'<main {" ".join(partes)}>'

    html_corrigido = html[:m.start()] + nova_tag + html[m.end():]

    # Determina o que foi mudado para o log
    mudancas = []
    if not tem_flex_grow:
        mudancas.append('+flex-grow')
    if not tem_p4:
        mudancas.append('+p-4')
    if not tem_smp8:
        mudancas.append('+sm:p-8')
    classes_removidas = [c for c in classes if c not in CLASSES_PERMITIDAS and c not in ('flex-grow','p-4','sm:p-8')]
    if classes_removidas:
        mudancas.append(f'-{",".join(classes_removidas)}')

    return html_corrigido, mudancas


def processar_arquivo(caminho):
    """Processa um unico arquivo HTML."""
    try:
        with open(caminho, 'r', encoding='utf-8') as f:
            original = f.read()

        corrigido, mudancas = corrigir_main_tag(original)

        if mudancas is None:
            return None, None  # sem main tag

        if corrigido == original:
            return 'ok', []  # ja estava correto

        with open(caminho, 'w', encoding='utf-8') as f:
            f.write(corrigido)

        return 'fix', mudancas
    except Exception as e:
        return 'erro', str(e)


def main():
    raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # diretorio do projeto

    total_ok = 0
    total_fix = 0
    total_sem_main = 0
    total_erro = 0
    arquivos_sem_main = []

    # 1. Processa raiz
    print("=" * 60)
    print("RAIZ")
    print("=" * 60)
    for nome in sorted(os.listdir(raiz)):
        if not nome.endswith('.html'):
            continue
        if nome in EXCLUIR_ARQUIVOS:
            continue
        caminho = os.path.join(raiz, nome)
        if not os.path.isfile(caminho):
            continue

        status, info = processar_arquivo(caminho)
        if status == 'ok':
            total_ok += 1
        elif status == 'fix':
            total_fix += 1
            print(f'  🔧 {nome}: {" | ".join(info)}')
        elif status is None:
            total_sem_main += 1
            arquivos_sem_main.append(nome)
            print(f'  ⚠️ {nome}: SEM tag <main>')
        else:
            total_erro += 1
            print(f'  ❌ {nome}: ERRO - {info}')

    # 2. Processa pastas de idiomas
    for idioma in IDIOMAS:
        pasta = os.path.join(raiz, idioma)
        if not os.path.isdir(pasta):
            continue

        ok_idioma = 0
        fix_idioma = 0
        sem_main_idioma = 0

        for nome in sorted(os.listdir(pasta)):
            if not nome.endswith('.html'):
                continue
            if nome in EXCLUIR_ARQUIVOS:
                continue
            caminho = os.path.join(pasta, nome)
            if not os.path.isfile(caminho):
                continue

            status, info = processar_arquivo(caminho)
            if status == 'ok':
                ok_idioma += 1
            elif status == 'fix':
                fix_idioma += 1
            elif status is None:
                sem_main_idioma += 1
                arquivos_sem_main.append(f'{idioma}/{nome}')
            else:
                total_erro += 1
                print(f'  ❌ {idioma}/{nome}: ERRO - {info}')

        total_ok += ok_idioma
        total_fix += fix_idioma
        total_sem_main += sem_main_idioma

        if fix_idioma > 0:
            print(f'\n  [{idioma}/] ✅ {ok_idioma} ok | 🔧 {fix_idioma} corrigidos', end='')
            if sem_main_idioma > 0:
                print(f' | ⚠️ {sem_main_idioma} sem main', end='')
            print()

    print(f'\n{"=" * 60}')
    print(f'RESUMO FINAL')
    print(f'{"=" * 60}')
    print(f'  ✅ Ja corretos:    {total_ok}')
    print(f'  🔧 Corrigidos:     {total_fix}')
    print(f'  ⚠️ Sem <main>:     {total_sem_main}')
    print(f'  ❌ Erros:          {total_erro}')
    print(f'  📁 Total processados: {total_ok + total_fix + total_sem_main + total_erro}')

    if arquivos_sem_main:
        print(f'\n  Arquivos sem <main>:')
        for a in arquivos_sem_main:
            print(f'    - {a}')

    print()


if __name__ == '__main__':
    main()
