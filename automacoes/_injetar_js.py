"""Injeta funcoes localStorage e atualiza NANDA no fugulin.html."""
with open('fugulin.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. NANDA Sugeridos -> Relacionados
content = content.replace('NANDA Sugeridos', 'NANDA Relacionados')
content = content.replace('sugeridos', 'relacionados')

# 2. Add table save after calcular sets the score
old_nanda = '// Chamar NANDA\nchamarNanda(diagnosticosKeywords);'
new_nanda = '''// Salvar na tabela de pacientes
    const nomePac = document.getElementById('pacNome').value.trim() || 'Paciente';
    adicionarPacienteNaTabela(nomePac, somaTotal, classe, horas);

    // Chamar NANDA
chamarNanda(diagnosticosKeywords);'''
if old_nanda in content:
    content = content.replace(old_nanda, new_nanda)
    print('OK - NANDA call atualizada')
else:
    print('ERRO: marcador Chamar NANDA nao encontrado')

# 3. Add localStorage functions before // Iniciar
localstorage_js = '''
// --- LOCALSTORAGE: TABELA DE PACIENTES ---
const STORAGE_KEY = 'fugulin_pacientes';

function salvarPaciente() {
    const nome = document.getElementById('pacNome').value.trim();
    if (!nome) { alert('Preencha o nome do paciente.'); return; }
    document.getElementById('msgSalvo').style.display = 'inline';
    setTimeout(function(){ document.getElementById('msgSalvo').style.display = 'none'; }, 2000);
}

function atualizarDataPlantao() {
    var plantao = document.getElementById('pacPlantao').value;
    var parImpar = document.getElementById('pacParImpar').value;
    var hoje = new Date();
    document.getElementById('pacDataInfo').textContent = 'Plantao ' + plantao + ' | Dia ' + parImpar + ' | ' + hoje.toLocaleDateString('pt-BR');
}

function carregarTabelaPacientes() {
    try {
        var data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        var tbody = document.getElementById('tabelaPacientesBody');
        var section = document.getElementById('tabelaPacientesSection');
        if (data.length === 0) { section.style.display = 'none'; return; }
        section.style.display = 'block';
        tbody.innerHTML = '';
        var counts = {minimos:0, intermediarios:0, alta:0, semi:0, intensivo:0};
        data.forEach(function(p) {
            var tr = document.createElement('tr');
            tr.innerHTML = '<td>'+p.data+'</td><td>'+p.plantao+'</td><td>'+p.nome+'</td><td style=\"font-weight:900\">'+p.escore+'</td><td>'+p.classe+'</td><td>'+p.horas+'</td>';
            tbody.appendChild(tr);
            if (p.classe.indexOf('MINIMOS') >= 0) counts.minimos++;
            else if (p.classe.indexOf('INTERMEDIARIOS') >= 0) counts.intermediarios++;
            else if (p.classe.indexOf('ALTA') >= 0) counts.alta++;
            else if (p.classe.indexOf('SEMI') >= 0) counts.semi++;
            else if (p.classe.indexOf('INTENSIVO') >= 0) counts.intensivo++;
        });
        var foot = document.getElementById('tabelaPacientesFoot');
        foot.innerHTML = '<tr><td colspan=\"6\" style=\"font-size:10px;padding:6px\">Total: '+data.length+' pacientes | C.Min: '+counts.minimos+' | C.Int: '+counts.intermediarios+' | A.Dep: '+counts.alta+' | Semi: '+counts.semi+' | Int: '+counts.intensivo+'</td></tr>';
    } catch(e) {}
}

function adicionarPacienteNaTabela(nome, escore, classe, horas) {
    try {
        var data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        var plantao = document.getElementById('pacPlantao').value;
        var parImpar = document.getElementById('pacParImpar').value;
        var hoje = new Date().toLocaleDateString('pt-BR');
        data.push({data:hoje, plantao:plantao+'/'+parImpar, nome:nome, escore:escore, classe:classe, horas:horas});
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        carregarTabelaPacientes();
    } catch(e) {}
}

function exportarTabelaCSV() {
    try {
        var data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        if (data.length === 0) { alert('Nenhum paciente na tabela.'); return; }
        var csv = 'Data,Plantao,Paciente,Escore,Classificacao,Horas Enfermagem\\n';
        data.forEach(function(p) { csv += '"'+p.data+'","'+p.plantao+'","'+p.nome+'",'+p.escore+',"'+p.classe+'","'+p.horas+'"\\n'; });
        var blob = new Blob(['\\ufeff'+csv], {type:'text/csv;charset=utf-8'});
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a'); a.href = url; a.download = 'fugulin_pacientes.csv'; a.click();
        URL.revokeObjectURL(url);
    } catch(e) { alert('Erro ao exportar.'); }
}

function limparTabelaPacientes() {
    if (confirm('Apagar TODOS os pacientes da tabela?')) {
        localStorage.removeItem(STORAGE_KEY);
        document.getElementById('tabelaPacientesSection').style.display = 'none';
        document.getElementById('tabelaPacientesBody').innerHTML = '';
        document.getElementById('tabelaPacientesFoot').innerHTML = '';
    }
}
'''

old_init = '// Iniciar\nrenderizarItensFugulin();\natualizarBarraGlobal();'
new_init = localstorage_js + '\n// Iniciar\nrenderizarItensFugulin();\natualizarBarraGlobal();\ncarregarTabelaPacientes();\natualizarDataPlantao();'

if old_init in content:
    content = content.replace(old_init, new_init)
    print('OK - localStorage injetado')
else:
    print('ERRO: marcador Iniciar nao encontrado')

with open('fugulin.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Arquivo salvo. Verificando...')
with open('fugulin.html', 'r', encoding='utf-8') as f:
    verify = f.read()
print('STORAGE_KEY:', 'STORAGE_KEY' in verify)
print('salvarPaciente:', 'function salvarPaciente' in verify)
print('carregarTabela:', 'carregarTabelaPacientes' in verify)
print('NANDA Relacionados:', 'NANDA Relacionados' in verify)
print('Chars:', len(verify))
