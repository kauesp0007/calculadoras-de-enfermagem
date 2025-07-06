// site-index.js

const sitePages = [
    { url: 'aldrete.html', title: 'Escala de Aldrete', keywords: 'aldrete, escala, pós-anestésica, recuperação, anestesia' },
    { url: 'apgar.html', title: 'Calcular Apgar', keywords: 'apgar, bebê, recém-nascido, neonato, pontuação' },
    { url: 'asa.html', title: 'Risco Perioperatório - ASA', keywords: 'asa, risco, perioperatório, cirurgia, anestesia, classificação' },
    { url: 'braden.html', title: 'Escala de Braden', keywords: 'braden, úlcera, pressão, lesão, prevenção, risco' },
    { url: 'cincinnati.html', title: 'Escala de Cincinnati', keywords: 'cincinnati, avc, derrame, acidente vascular cerebral, emergência' },
    { url: 'dimensionamento.html', title: 'Calcular Dimensionamento', keywords: 'dimensionamento, enfermagem, equipe, pessoal, cálculo, leitos' },
    { url: 'elpo.html', title: 'Escala de ELPO', keywords: 'elpo, dor, neonatal, bebê, escala de dor' },
    { url: 'fugulin.html', title: 'Calcular Fugulin', keywords: 'fugulin, dimensionamento, enfermagem, equipe, carga de trabalho' },
    { url: 'gestacional.html', title: 'Calcular IG e DPP', keywords: 'idade gestacional, dpp, data provável parto, gestação, gravidez' },
    { url: 'glasgow.html', title: 'Escala de Glasgow', keywords: 'glasgow, coma, ecg, nível de consciência, trauma' },
    { url: 'gotejamento.html', title: 'Cálculo de Gotejamento', keywords: 'gotejamento, soro, medicamento, bomba infusão, ml/h, gotas/min' },
    { url: 'insulina.html', title: 'Cálculo de Insulina', keywords: 'insulina, cálculo, dose, diabetes, glicemia' },
    { url: 'johns.html', title: 'Escala de Johns', keywords: 'johns, parto, indução, colo, bishop' },
    { url: 'manchester.html', title: 'Calcular Escala de Manchester', keywords: 'manchester, triagem, risco, classificação, protocolo' },
    { url: 'medicamentos.html', title: 'Cálculo de Medicamentos', keywords: 'medicamentos, dose, cálculo, diluição, mg, ml' },
    { url: 'meows.html', title: 'Escala de MEOWS', keywords: 'meows, obstetrícia, alerta, gestante, gravidez, sinais vitais' },
    { url: 'morse.html', title: 'Escala de Morse', keywords: 'morse, queda, risco de queda, prevenção, paciente' },
    { url: 'news.html', title: 'Escala de NEWS', keywords: 'news, escore, alerta precoce, sepse, deterioração' },
    { url: 'nihss.html', title: 'Escala NIHSS', keywords: 'nihss, avc, acidente vascular cerebral, neurologia, escore' },
    { url: 'richmond.html', title: 'Escala de Richmond', keywords: 'richmond, ras, sedação, agitação, uti' },
    { url: 'mini.html', title: 'Calculadoras Rápidas', keywords: 'mini, rápidas, calculadoras, diversos' },
    // Adicione a si mesmo para o index.html, caso alguém pesquise a página inicial
    { url: 'index.html', title: 'Página Inicial - Calculadoras de Enfermagem', keywords: 'home, início, principal, enfermegem, calculadoras' }
];

// Esta array 'sitePages' será globalmente acessível assim que o script for carregado.
