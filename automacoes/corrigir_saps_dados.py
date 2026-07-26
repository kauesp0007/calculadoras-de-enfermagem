"""Corrige SAPS traduzidos: reinjeta Dados do Paciente + corrige sapsForm/conteudo."""
import os

BLOCO_DADOS = """<!-- DADOS DO PACIENTE -->
<div class="saps-card mb-2 no-print" style="overflow: hidden">
<button id="btnToggleDados" style="width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; background: white; border: none; cursor: pointer; transition: background 0.15s" onmouseover="this.style.background='#EFF6FF'" onmouseout="this.style.background=document.getElementById('dadosBody').classList.contains('open')?'#EFF6FF':'white'">
<div style="display: flex; align-items: center; gap: 12px">
<div style="width: 38px; height: 38px; border-radius: 8px; background: var(--navy); display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 8px rgba(26, 62, 116, 0.3)">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" style="color: white; font-size: 16px" width="1em" height="1em" aria-hidden="true"><path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512H418.3c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304H178.3z"/></svg>
</div>
<div style="text-align: left">
<p style="font-size: 15px; font-weight: 800; color: var(--navy); margin: 0">Dados do Paciente</p>
<p id="dadosSubtitle" style="font-size: 12px; font-weight: 500; color: #64748b; margin: 0">Preencher para o Prontuario/Laudo PDF</p>
</div>
</div>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" id="dadosChevron" style="color: var(--navy); transition: transform 0.2s" fill="currentColor" width="1em" height="1em" aria-hidden="true"><path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"/></svg>
</button>
<div id="dadosBody" class="dados-body">
<div class="grid-2col" style="margin-top: 8px">
<div>
<label style="display: block; font-size: 12px; font-weight: 700; color: var(--slate-600); margin-bottom: 6px">Nome do Paciente</label>
<input type="text" id="pacNome" placeholder="Nome completo" class="input-strong" />
</div>
<div>
<label style="display: block; font-size: 12px; font-weight: 700; color: var(--slate-600); margin-bottom: 6px">Idade</label>
<input type="text" id="pacIdade" placeholder="Anos" class="input-strong" />
</div>
<div>
<label style="display: block; font-size: 12px; font-weight: 700; color: var(--slate-600); margin-bottom: 6px">Setor / Leito</label>
<input type="text" id="pacSetor" placeholder="Ex: UTI Adulto" class="input-strong" />
</div>
<div>
<label style="display: block; font-size: 12px; font-weight: 700; color: var(--slate-600); margin-bottom: 6px">Data da Admissao/Avaliacao</label>
<input type="date" id="pacData" class="input-strong" />
</div>
</div>
</div>
</div>
"""

BLOCO_FORM = '<form id="sapsForm" class="grid-2col" onsubmit="return false;">\n</form>'

dirs = ['ar','de','en','es','fr','hi','id','it','ja','ko','nl','pl','ru','sv','tr','uk','vi','zh']

for d in dirs:
    f = os.path.join(d, 'saps.html')
    if not os.path.exists(f):
        print(f'{d}: nao encontrado')
        continue
    
    with open(f, 'r', encoding='utf-8') as fh:
        content = fh.read()
    
    changed = False
    
    # Fix 1: Adicionar bloco Dados do Paciente
    if 'id="btnToggleDados"' not in content:
        marcador = '<div id="conteudo" class="saps-criteria-container">'
        if marcador in content:
            content = content.replace(marcador, BLOCO_DADOS + '\n' + marcador)
            changed = True
    
    # Fix 2: Substituir <div id="conteudo"> por <form id="sapsForm">
    for old in ['<div id="conteudo" class="saps-criteria-container">\n</div>',
                 '<div id="conteudo" class="saps-criteria-container"></div>']:
        if old in content:
            content = content.replace(old, BLOCO_FORM)
            changed = True
            break
    
    if changed:
        with open(f, 'w', encoding='utf-8') as fh:
            fh.write(content)
        print(f'{d}: OK')
    else:
        print(f'{d}: ja corrigido')
