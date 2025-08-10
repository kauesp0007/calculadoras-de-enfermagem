// Dados das calculadoras e escalas de enfermagem
export const calculadoras = [
  {
    id: 'calendario-vacinal-criancas',
    nome: 'Calendário Vacinal de Crianças',
    categoria: 'Calculadoras',
    descricao: 'Ferramenta para acompanhar e calcular o cronograma de vacinação infantil conforme as diretrizes do Ministério da Saúde.',
    icone: '/src/assets/icons/calendario_vacinal_criancas.png',
    aplicacao: 'Pediatria, Atenção Básica',
    importancia: 'Essencial para garantir a imunização adequada das crianças'
  },
  {
    id: 'tabela-calendario-vacinal-crianca',
    nome: 'Tabela do Calendário Vacinal da Criança',
    categoria: 'Calculadoras',
    descricao: 'Tabela completa com todas as vacinas recomendadas por faixa etária para crianças.',
    icone: '/src/assets/icons/tabela_calendario_vacinal_crianca.png',
    aplicacao: 'Pediatria, Saúde Pública',
    importancia: 'Referência rápida para profissionais de saúde'
  },
  {
    id: 'balanco-hidrico',
    nome: 'Balanço Hídrico',
    categoria: 'Calculadoras',
    descricao: 'Cálculo do equilíbrio entre entrada e saída de líquidos no organismo do paciente.',
    icone: '/src/assets/icons/balanco_hidrico.png',
    aplicacao: 'UTI, Nefrologia, Cardiologia',
    importancia: 'Fundamental para monitoramento de pacientes críticos'
  },
  {
    id: 'dimensionamento-equipe',
    nome: 'Dimensionamento de Equipe',
    categoria: 'Calculadoras',
    descricao: 'Cálculo do número adequado de profissionais de enfermagem por setor/unidade.',
    icone: '/src/assets/icons/dimensionamento_equipe.png',
    aplicacao: 'Gestão, Administração Hospitalar',
    importancia: 'Essencial para qualidade e segurança do cuidado'
  },
  {
    id: 'calculo-gotejamento',
    nome: 'Cálculo de Gotejamento',
    categoria: 'Calculadoras',
    descricao: 'Cálculo da velocidade de infusão de soluções endovenosas em gotas por minuto.',
    icone: '/src/assets/icons/calculo_gotejamento.png',
    aplicacao: 'Todas as especialidades',
    importancia: 'Fundamental para administração segura de medicamentos'
  },
  {
    id: 'idade-gestacional-dpp',
    nome: 'Idade Gestacional e DPP',
    categoria: 'Calculadoras',
    descricao: 'Cálculo da idade gestacional e data provável do parto.',
    icone: '/src/assets/icons/idade_gestacional_dpp.png',
    aplicacao: 'Obstetrícia, Pré-natal',
    importancia: 'Essencial para acompanhamento gestacional'
  },
  {
    id: 'calculo-heparina',
    nome: 'Cálculo de Heparina',
    categoria: 'Calculadoras',
    descricao: 'Cálculo de dosagem de heparina para anticoagulação.',
    icone: '/src/assets/icons/calculo_heparina.png',
    aplicacao: 'UTI, Cardiologia, Vascular',
    importancia: 'Crítico para prevenção de tromboembolismo'
  },
  {
    id: 'calculo-imc',
    nome: 'Cálculo de IMC',
    categoria: 'Calculadoras',
    descricao: 'Cálculo do Índice de Massa Corporal para avaliação nutricional.',
    icone: '/src/assets/icons/calculo_imc.png',
    aplicacao: 'Todas as especialidades',
    importancia: 'Importante para avaliação do estado nutricional'
  },
  {
    id: 'calculo-insulina',
    nome: 'Cálculo de Insulina',
    categoria: 'Calculadoras',
    descricao: 'Cálculo de dosagem de insulina para controle glicêmico.',
    icone: '/src/assets/icons/calculo_insulina.png',
    aplicacao: 'Endocrinologia, UTI, Clínica Médica',
    importancia: 'Essencial para controle do diabetes'
  },
  {
    id: 'calculo-medicamentos',
    nome: 'Cálculo de Medicamentos',
    categoria: 'Calculadoras',
    descricao: 'Cálculos gerais para dosagem e diluição de medicamentos.',
    icone: '/src/assets/icons/calculo_medicamentos.png',
    aplicacao: 'Todas as especialidades',
    importancia: 'Fundamental para segurança medicamentosa'
  }
];

export const escalas = [
  {
    id: 'escala-aldrete-kroulik',
    nome: 'Escala de Aldrete e Kroulik',
    categoria: 'Escalas',
    descricao: 'Avaliação da recuperação pós-anestésica em sala de recuperação.',
    icone: '/src/assets/icons/escala_aldrete_kroulik.png',
    aplicacao: 'Centro Cirúrgico, Recuperação Pós-Anestésica',
    importancia: 'Essencial para alta segura da sala de recuperação'
  },
  {
    id: 'escala-apache-ii',
    nome: 'Escala de APACHE II',
    categoria: 'Escalas',
    descricao: 'Avaliação da gravidade de pacientes em terapia intensiva.',
    icone: '/src/assets/icons/escala_apache_ii.png',
    aplicacao: 'UTI, Cuidados Intensivos',
    importancia: 'Preditor de mortalidade em pacientes críticos'
  },
  {
    id: 'risco-perioperatorio-asa',
    nome: 'Risco Perioperatório - ASA',
    categoria: 'Escalas',
    descricao: 'Classificação do estado físico do paciente para procedimentos anestésicos.',
    icone: '/src/assets/icons/risco_perioperatorio_asa.png',
    aplicacao: 'Centro Cirúrgico, Anestesiologia',
    importancia: 'Fundamental para planejamento anestésico'
  },
  {
    id: 'escala-apgar',
    nome: 'Escala de Apgar',
    categoria: 'Escalas',
    descricao: 'Avaliação das condições de vitalidade do recém-nascido.',
    icone: '/src/assets/icons/escala_apgar.png',
    aplicacao: 'Obstetrícia, Neonatologia',
    importancia: 'Essencial para avaliação neonatal imediata'
  },
  {
    id: 'escala-barthel',
    nome: 'Escala de Barthel',
    categoria: 'Escalas',
    descricao: 'Avaliação da independência funcional em atividades de vida diária.',
    icone: '/src/assets/icons/escala_barthel.png',
    aplicacao: 'Reabilitação, Geriatria',
    importancia: 'Importante para planejamento de cuidados'
  },
  {
    id: 'escala-braden',
    nome: 'Escala de Braden',
    categoria: 'Escalas',
    descricao: 'Avaliação do risco de desenvolvimento de lesões por pressão.',
    icone: '/src/assets/icons/escala_braden.png',
    aplicacao: 'Todas as especialidades',
    importancia: 'Fundamental para prevenção de lesões por pressão'
  },
  {
    id: 'escala-cam-icu',
    nome: 'Escala CAM-ICU',
    categoria: 'Escalas',
    descricao: 'Avaliação de delirium em pacientes de terapia intensiva.',
    icone: '/src/assets/icons/escala_cam_icu.png',
    aplicacao: 'UTI, Cuidados Intensivos',
    importancia: 'Essencial para detecção precoce de delirium'
  },
  {
    id: 'escala-fast',
    nome: 'Escala de FAST',
    categoria: 'Escalas',
    descricao: 'Avaliação rápida de sinais de AVC (Face, Arms, Speech, Time).',
    icone: '/src/assets/icons/escala_fast.png',
    aplicacao: 'Emergência, Neurologia',
    importancia: 'Crítica para reconhecimento precoce de AVC'
  },
  {
    id: 'escala-cincinnati',
    nome: 'Escala de Cincinnati',
    categoria: 'Escalas',
    descricao: 'Avaliação pré-hospitalar de sinais de AVC.',
    icone: '/src/assets/icons/escala_cincinnati.png',
    aplicacao: 'Emergência, Atendimento Pré-hospitalar',
    importancia: 'Fundamental para triagem de AVC'
  },
  {
    id: 'escala-cornell',
    nome: 'Escala de Cornell',
    categoria: 'Escalas',
    descricao: 'Avaliação de depressão em pacientes com demência.',
    icone: '/src/assets/icons/escala_cornell.png',
    aplicacao: 'Geriatria, Psiquiatria',
    importancia: 'Importante para cuidados geriátricos'
  },
  {
    id: 'escala-cries',
    nome: 'Escala de CRIES',
    categoria: 'Escalas',
    descricao: 'Avaliação de dor em neonatos e lactentes.',
    icone: '/src/assets/icons/escala_cries.png',
    aplicacao: 'Neonatologia, Pediatria',
    importancia: 'Essencial para manejo da dor neonatal'
  },
  {
    id: 'escala-gds',
    nome: 'Escala de GDS',
    categoria: 'Escalas',
    descricao: 'Escala de Depressão Geriátrica para rastreamento de depressão em idosos.',
    icone: '/src/assets/icons/escala_gds.png',
    aplicacao: 'Geriatria, Saúde Mental',
    importancia: 'Importante para saúde mental do idoso'
  },
  {
    id: 'escala-elpo',
    nome: 'Escala de ELPO',
    categoria: 'Escalas',
    descricao: 'Escala de Dor e Desconforto do Recém-Nascido.',
    icone: '/src/assets/icons/escala_elpo.png',
    aplicacao: 'Neonatologia',
    importancia: 'Fundamental para avaliação de dor neonatal'
  },
  {
    id: 'escala-flacc',
    nome: 'Escala de FLACC',
    categoria: 'Escalas',
    descricao: 'Avaliação de dor em crianças não-verbais (Face, Legs, Activity, Cry, Consolability).',
    icone: '/src/assets/icons/escala_flacc.png',
    aplicacao: 'Pediatria, UTI Pediátrica',
    importancia: 'Essencial para avaliação de dor pediátrica'
  },
  {
    id: 'escala-four',
    nome: 'Escala de FOUR',
    categoria: 'Escalas',
    descricao: 'Full Outline of UnResponsiveness - avaliação neurológica.',
    icone: '/src/assets/icons/escala_four.png',
    aplicacao: 'UTI, Neurologia',
    importancia: 'Complementar à Escala de Glasgow'
  },
  {
    id: 'escala-fugulin',
    nome: 'Escala de Fugulin',
    categoria: 'Escalas',
    descricao: 'Classificação de pacientes para dimensionamento de pessoal de enfermagem.',
    icone: '/src/assets/icons/escala_fugulin.png',
    aplicacao: 'Gestão, Administração',
    importancia: 'Importante para gestão de recursos humanos'
  },
  {
    id: 'escala-glasgow',
    nome: 'Escala de Coma de Glasgow',
    categoria: 'Escalas',
    descricao: 'Avaliação do nível de consciência através de resposta ocular, verbal e motora.',
    icone: '/src/assets/icons/escala_glasgow.png',
    aplicacao: 'Neurologia, UTI, Emergência',
    importancia: 'Fundamental para avaliação neurológica'
  },
  {
    id: 'escala-gosnell',
    nome: 'Escala de Gosnell',
    categoria: 'Escalas',
    descricao: 'Avaliação do risco de quedas em pacientes hospitalizados.',
    icone: '/src/assets/icons/escala_gosnell.png',
    aplicacao: 'Todas as especialidades',
    importancia: 'Importante para prevenção de quedas'
  },
  {
    id: 'escala-hamilton',
    nome: 'Escala de Hamilton',
    categoria: 'Escalas',
    descricao: 'Avaliação da gravidade de ansiedade e depressão.',
    icone: '/src/assets/icons/escala_hamilton.png',
    aplicacao: 'Psiquiatria, Saúde Mental',
    importancia: 'Importante para avaliação psiquiátrica'
  },
  {
    id: 'escala-johns',
    nome: 'Escala de Johns',
    categoria: 'Escalas',
    descricao: 'Avaliação específica para determinadas condições clínicas.',
    icone: '/src/assets/icons/escala_johns.png',
    aplicacao: 'Especialidades específicas',
    importancia: 'Útil para avaliações especializadas'
  },
  {
    id: 'escala-jouvet',
    nome: 'Escala de Jouvet',
    categoria: 'Escalas',
    descricao: 'Avaliação de distúrbios do sono e consciência.',
    icone: '/src/assets/icons/escala_jouvet.png',
    aplicacao: 'Neurologia, Medicina do Sono',
    importancia: 'Importante para avaliação do sono'
  },
  {
    id: 'escala-katz',
    nome: 'Escala de Katz',
    categoria: 'Escalas',
    descricao: 'Avaliação da independência em atividades básicas de vida diária.',
    icone: '/src/assets/icons/escala_katz.png',
    aplicacao: 'Geriatria, Reabilitação',
    importancia: 'Fundamental para avaliação funcional'
  },
  {
    id: 'escala-lanss',
    nome: 'Escala de LANSS',
    categoria: 'Escalas',
    descricao: 'Leeds Assessment of Neuropathic Symptoms and Signs - avaliação de dor neuropática.',
    icone: '/src/assets/icons/escala_lanss.png',
    aplicacao: 'Neurologia, Clínica da Dor',
    importancia: 'Importante para diagnóstico de dor neuropática'
  },
  {
    id: 'escala-manchester',
    nome: 'Escala de Manchester',
    categoria: 'Escalas',
    descricao: 'Sistema de triagem para classificação de risco em emergências.',
    icone: '/src/assets/icons/escala_manchester.png',
    aplicacao: 'Emergência, Pronto Socorro',
    importancia: 'Essencial para triagem de emergência'
  },
  {
    id: 'escala-meem',
    nome: 'Escala de MEEM',
    categoria: 'Escalas',
    descricao: 'Mini Exame do Estado Mental para avaliação cognitiva.',
    icone: '/src/assets/icons/escala_meem.png',
    aplicacao: 'Geriatria, Neurologia',
    importancia: 'Fundamental para avaliação cognitiva'
  },
  {
    id: 'escala-meows',
    nome: 'Escala de MEOWS',
    categoria: 'Escalas',
    descricao: 'Modified Early Obstetric Warning System - sinais de alerta obstétricos.',
    icone: '/src/assets/icons/escala_meows.png',
    aplicacao: 'Obstetrícia, Maternidade',
    importancia: 'Crítica para segurança materna'
  },
  {
    id: 'escala-morse',
    nome: 'Escala de Morse',
    categoria: 'Escalas',
    descricao: 'Avaliação do risco de quedas em pacientes.',
    icone: '/src/assets/icons/escala_morse.png',
    aplicacao: 'Todas as especialidades',
    importancia: 'Fundamental para prevenção de quedas'
  },
  {
    id: 'escala-news',
    nome: 'Escala de NEWS',
    categoria: 'Escalas',
    descricao: 'National Early Warning Score - sistema de alerta precoce.',
    icone: '/src/assets/icons/escala_news.png',
    aplicacao: 'Todas as especialidades',
    importancia: 'Essencial para detecção de deterioração clínica'
  },
  {
    id: 'escala-nihss',
    nome: 'Escala NIHSS',
    categoria: 'Escalas',
    descricao: 'National Institutes of Health Stroke Scale - avaliação de AVC.',
    icone: '/src/assets/icons/escala_nihss.png',
    aplicacao: 'Neurologia, Emergência',
    importancia: 'Fundamental para avaliação de AVC'
  },
  {
    id: 'escala-norton',
    nome: 'Escala de Norton',
    categoria: 'Escalas',
    descricao: 'Avaliação do risco de desenvolvimento de úlceras por pressão.',
    icone: '/src/assets/icons/escala_norton.png',
    aplicacao: 'Todas as especialidades',
    importancia: 'Importante para prevenção de lesões por pressão'
  },
  {
    id: 'escala-dor',
    nome: 'Escala de Dor',
    categoria: 'Escalas',
    descricao: 'Avaliação da intensidade da dor em pacientes.',
    icone: '/src/assets/icons/escala_dor.png',
    aplicacao: 'Todas as especialidades',
    importancia: 'Fundamental para manejo da dor'
  },
  {
    id: 'escala-qsofa',
    nome: 'Escala qSOFA',
    categoria: 'Escalas',
    descricao: 'Quick Sequential Organ Failure Assessment - triagem de sepse.',
    icone: '/src/assets/icons/escala_qsofa.png',
    aplicacao: 'UTI, Emergência',
    importancia: 'Crítica para identificação de sepse'
  },
  {
    id: 'escala-pews',
    nome: 'Escala de PEWS',
    categoria: 'Escalas',
    descricao: 'Pediatric Early Warning Score - sistema de alerta pediátrico.',
    icone: '/src/assets/icons/escala_pews.png',
    aplicacao: 'Pediatria, UTI Pediátrica',
    importancia: 'Essencial para cuidados pediátricos'
  },
  {
    id: 'escala-prism',
    nome: 'Escala PRISM',
    categoria: 'Escalas',
    descricao: 'Pediatric Risk of Mortality - avaliação de risco em pediatria.',
    icone: '/src/assets/icons/escala_prism.png',
    aplicacao: 'UTI Pediátrica',
    importancia: 'Importante para prognóstico pediátrico'
  },
  {
    id: 'escala-pelod',
    nome: 'Escala de PELOD',
    categoria: 'Escalas',
    descricao: 'Pediatric Logistic Organ Dysfunction - disfunção orgânica pediátrica.',
    icone: '/src/assets/icons/escala_pelod.png',
    aplicacao: 'UTI Pediátrica',
    importancia: 'Fundamental para avaliação pediátrica crítica'
  },
  {
    id: 'escala-richmond',
    nome: 'Escala de Richmond',
    categoria: 'Escalas',
    descricao: 'Richmond Agitation-Sedation Scale - avaliação de sedação e agitação.',
    icone: '/src/assets/icons/escala_richmond.png',
    aplicacao: 'UTI, Cuidados Intensivos',
    importancia: 'Essencial para manejo de sedação'
  },
  {
    id: 'escala-saps-iii',
    nome: 'Escala de SAPS III',
    categoria: 'Escalas',
    descricao: 'Simplified Acute Physiology Score - avaliação de gravidade em UTI.',
    icone: '/src/assets/icons/escala_saps_iii.png',
    aplicacao: 'UTI, Cuidados Intensivos',
    importancia: 'Importante para prognóstico em UTI'
  },
  {
    id: 'boletim-silverman-anderson',
    nome: 'Boletim de Silverman e Anderson',
    categoria: 'Escalas',
    descricao: 'Avaliação de desconforto respiratório em recém-nascidos.',
    icone: '/src/assets/icons/boletim_silverman_anderson.png',
    aplicacao: 'Neonatologia',
    importancia: 'Fundamental para avaliação respiratória neonatal'
  },
  {
    id: 'escala-sofa',
    nome: 'Escala SOFA',
    categoria: 'Escalas',
    descricao: 'Sequential Organ Failure Assessment - avaliação de falência orgânica.',
    icone: '/src/assets/icons/escala_sofa.png',
    aplicacao: 'UTI, Cuidados Intensivos',
    importancia: 'Essencial para avaliação de disfunção orgânica'
  },
  {
    id: 'escala-waterlow',
    nome: 'Escala de Waterlow',
    categoria: 'Escalas',
    descricao: 'Avaliação do risco de desenvolvimento de úlceras por pressão.',
    icone: '/src/assets/icons/escala_waterlow.png',
    aplicacao: 'Todas as especialidades',
    importancia: 'Importante para prevenção de lesões por pressão'
  },
  {
    id: 'escala-wood-downes',
    nome: 'Escala Wood e Downes',
    categoria: 'Escalas',
    descricao: 'Avaliação de desconforto respiratório em crianças.',
    icone: '/src/assets/icons/escala_wood_downes.png',
    aplicacao: 'Pediatria, Pneumologia',
    importancia: 'Importante para avaliação respiratória pediátrica'
  }
];

export const todasFerramentas = [...calculadoras, ...escalas];

