const fs = require('fs');

// ============ GUIAS (layout "blocos") ============
const guides = {
  E01: {
    layout: "blocos",
    hero: {
      kicker: "Lei 7.498/1986 · Decreto 94.406/1987 · Lei 5.905/1973",
      title: "Exercício profissional e atribuições do Enfermeiro",
      text: "A enfermagem é exercida por Enfermeiro, Técnico e Auxiliar de Enfermagem, cada um com atribuições definidas em lei. A fiscalização do exercício é feita pelo COFEN e pelos CORENs (Lei 5.905/1973). Conhecer o que é privativo do enfermeiro é essencial para a prova."
    },
    blocks: [
      {
        type: "section",
        title: "Atividades privativas do Enfermeiro (Lei 7.498/1986, art. 11)",
        items: [
          { t: "Direção e chefia", d: "Direção do órgão de enfermagem e chefia de serviço e de unidade de enfermagem." },
          { t: "Organização e planejamento", d: "Planejamento, organização, coordenação, execução e avaliação dos serviços de assistência de enfermagem." },
          { t: "Consultoria e auditoria", d: "Consultoria, auditoria e emissão de parecer sobre matéria de enfermagem." },
          { t: "Consulta de enfermagem", d: "Atividade privativa que fundamenta o Processo de Enfermagem." },
          { t: "Prescrição da assistência", d: "Prescrição da assistência de enfermagem." },
          { t: "Cuidados complexos", d: "Cuidados diretos a pacientes graves com risco de vida e de maior complexidade técnica." }
        ]
      },
      {
        type: "section",
        title: "Enfermeiro como integrante da equipe de saúde",
        items: [
          { t: "Programas de saúde", d: "Participação no planejamento, execução e avaliação da programação de saúde." },
          { t: "Prescrição em programas", d: "Prescrição de medicamentos estabelecidos em programas de saúde pública e rotina aprovada." },
          { t: "Controle de infecção", d: "Prevenção e controle sistemático da infecção hospitalar e de danos à saúde." },
          { t: "Educação em saúde", d: "Participação em atividades de educação visando à melhoria da saúde da população." }
        ]
      },
      {
        type: "section",
        title: "Técnico e Auxiliar de Enfermagem",
        items: [
          { t: "Técnico de Enfermagem", d: "Participa da execução da assistência e orienta/supervisiona o trabalho em grau auxiliar, sob supervisão do enfermeiro." },
          { t: "Auxiliar de Enfermagem", d: "Executa atividades de nível médio, de natureza repetitiva, sempre sob supervisão do enfermeiro." },
          { t: "Supervisão", d: "O Decreto 94.406/1987 reforça a supervisão e a responsabilidade do enfermeiro sobre a equipe." }
        ]
      },
      {
        type: "note",
        title: "COFEN/COREN e ética",
        text: "A Lei 5.905/1973 criou o COFEN e os CORENs, responsáveis pela fiscalização do exercício profissional e pela inscrição obrigatória. O Código de Ética (Resolução COFEN 564/2017) trata de direitos, deveres, proibições e do sigilo profissional."
      },
      {
        type: "refs",
        title: "Fontes oficiais",
        items: [
          { label: "Lei 7.498/86", text: "Regulamentação do exercício da enfermagem — Planalto", url: "https://www.planalto.gov.br/ccivil_03/leis/l7498.htm" },
          { label: "Dec. 94.406/87", text: "Regulamenta a Lei 7.498/1986 — Planalto", url: "https://www.planalto.gov.br/ccivil_03/decreto/1980-1989/d94406.htm" },
          { label: "Lei 5.905/73", text: "Criação do COFEN e dos CORENs — Planalto", url: "https://www.planalto.gov.br/ccivil_03/leis/l5905.htm" },
          { label: "COFEN 564/17", text: "Código de Ética dos Profissionais de Enfermagem", url: "https://www.cofen.gov.br/resolucao-cofen-no-5642017/" }
        ]
      },
    {
      type: "section",
      title: "Ética profissional — macete A.D.I.R.",
      items: [
        { t: "Autonomia", d: "Respeitar a liberdade e a autodeterminação do paciente nas decisões sobre o próprio cuidado." },
        { t: "Discriminação zero", d: "Assistir a todos sem qualquer forma de discriminação." },
        { t: "Integralidade", d: "Garantir cuidado completo, considerando todas as dimensões da pessoa." },
        { t: "Respeito aos Direitos Humanos", d: "Agir com dignidade, sigilo e responsabilidade no exercício profissional." }
      ]
    },
    {
      type: "section",
      title: "Tríade da culpa e penalidades (CEPE — COFEN 564/2017)",
      items: [
        { t: "Negligência", d: "Omissão: deixar de fazer o que o dever exigia." },
        { t: "Imprudência", d: "Ação precipitada, sem a cautela necessária." },
        { t: "Imperícia", d: "Falta de habilidade técnica ou competência para o ato praticado." },
        { t: "Penalidades", d: "Advertência verbal → multa (1 a 10 anuidades) → censura → suspensão (até 90 dias) → cassação (até 30 anos, só pelo COFEN)." }
      ]
    },
    {
      type: "links",
      title: "Aprofunde no site",
      items: [
        { t: "Código de Ética — COFEN 564/2017", d: "Direitos, deveres, proibições e penalidades explicados.", url: "/codigo_de_etica_enfermagem.html" },
        { t: "Legislações e pareceres de enfermagem", d: "Leis, decretos, resoluções e pareceres por entidade.", url: "/legislacoes.html" }
      ]
    },
    ],
    keywords: ["Lei 7.498/1986", "Decreto 94.406/1987", "Lei 5.905/1973", "atribuições privativas", "consulta de enfermagem", "COFEN e COREN", "código de ética"]
  },

  E02: {
    layout: "blocos",
    hero: {
      kicker: "Resolução COFEN nº 736/2024",
      title: "Processo de Enfermagem — as 5 etapas",
      text: "O Processo de Enfermagem (PE) deve ser realizado em todo ambiente onde ocorre o cuidado de enfermagem e registrado formalmente no prontuário. Ele é conduzido pelo enfermeiro, que lidera a execução e a avaliação."
    },
    blocks: [
      {
        type: "flow",
        title: "As 5 etapas do Processo de Enfermagem",
        steps: [
          { t: "Avaliação de Enfermagem", d: "Coleta de dados (entrevista + exame físico) para conhecer as necessidades do paciente." },
          { t: "Diagnóstico de Enfermagem", d: "Julgamento clínico sobre as respostas do indivíduo aos problemas de saúde (reais ou potenciais)." },
          { t: "Planejamento de Enfermagem", d: "Definição de resultados esperados e das intervenções a serem realizadas." },
          { t: "Implementação", d: "Execução das intervenções planejadas (prescrição de enfermagem)." },
          { t: "Evolução de Enfermagem", d: "Avaliação contínua dos resultados e ajuste do plano de cuidados." }
        ]
      },
      {
        type: "section",
        title: "O que a Resolução 736/2024 estabelece",
        items: [
          { t: "Obrigatoriedade", d: "PE obrigatório em todos os ambientes públicos e privados onde ocorre o cuidado de enfermagem." },
          { t: "Registro no prontuário", d: "O PE deve ser documentado formalmente, de forma clara e objetiva." },
          { t: "Liderança do enfermeiro", d: "Cabe ao enfermeiro a liderança na execução e avaliação do PE." },
          { t: "Modelos teóricos", d: "Deve ser sustentado por um referencial teórico (ex.: Necessidades Humanas Básicas de Wanda Horta)." },
          { t: "Taxonomias", d: "Podem ser usadas NANDA-I, NIC, NOC e CIPE para padronizar a linguagem." }
        ]
      },
      {
        type: "note",
        title: "PE ≠ SAE",
        text: "A Sistematização da Assistência de Enfermagem (SAE) é a forma de organizar o trabalho; o Processo de Enfermagem é o instrumento metodológico que a operacionaliza — a SAE organiza, o PE executa."
      },
      {
        type: "refs",
        title: "Fonte oficial",
        items: [
          { label: "COFEN 736/24", text: "Dispõe sobre a implementação do Processo de Enfermagem", url: "https://www.cofen.gov.br/resolucao-cofen-no-736-de-17-de-janeiro-de-2024/" }
        ]
      },
    {
      type: "section",
      title: "Taxonomias: NANDA-I, NIC e NOC",
      items: [
        { t: "NANDA-I", d: "Diagnósticos: 13 domínios e 47 classes (ed. 2024–2026: 267 diagnósticos)." },
        { t: "NIC", d: "Intervenções: 7 domínios, 30 classes e 565 intervenções (7ª ed., 2018)." },
        { t: "NOC", d: "Resultados: 7 domínios, 32 classes e 540 resultados, com indicadores em escala 1–5." },
        { t: "No PE", d: "Diagnóstico → NANDA; planejamento → NOC + NIC; implementação → NIC; avaliação → NOC." }
      ]
    },
    {
      type: "section",
      title: "Referenciais teóricos mais cobrados",
      items: [
        { t: "Wanda Horta", d: "Necessidades Humanas Básicas: psicobiológicas, psicossociais e psicoespirituais (Brasil)." },
        { t: "Dorothea Orem", d: "Teoria do Autocuidado: déficit de autocuidado e sistemas de enfermagem." },
        { t: "Callista Roy", d: "Teoria da Adaptação: 4 modos (fisiológico, autoconceito, papel e interdependência)." },
        { t: "Nightingale", d: "Teoria Ambiental: ar puro, água, drenagem, limpeza e luz." }
      ]
    },
    {
      type: "links",
      title: "Aprofunde no site",
      items: [
        { t: "NANDA, NIC e NOC", d: "O que são e como se relacionam com a SAE.", url: "/nanda.html" },
        { t: "Buscar diagnósticos NANDA + NIC", d: "Ferramenta interativa de diagnósticos e intervenções.", url: "/diagnosticosnanda.html" },
        { t: "Intervenções NIC", d: "Banco de intervenções com código, definição e atividades.", url: "/classificacao_intervencoes-enfermagem.html" },
        { t: "Teorias de Enfermagem", d: "11 teorias com ano, país e aplicação prática.", url: "/teorias-de-enfermagem.html" },
        { t: "SAEP perioperatório", d: "SAE no pré, trans e pós-operatório.", url: "/formulario-saep-enfermagem.html" }
      ]
    },
    ],
    keywords: ["Processo de Enfermagem", "COFEN 736/2024", "SAE", "avaliação e diagnóstico", "planejamento e implementação", "evolução de enfermagem", "NANDA-I, NIC e NOC"]
  },

  E03: {
    layout: "blocos",
    hero: {
      kicker: "Fundamentos de Enfermagem",
      title: "Sinais vitais, exame físico e procedimentos básicos",
      text: "Base de toda a assistência: a avaliação precisa dos sinais vitais e a execução correta dos procedimentos garantem segurança e qualidade do cuidado."
    },
    blocks: [
      {
        type: "section",
        title: "Sinais vitais — valores de referência no adulto",
        items: [
          { t: "Temperatura", d: "36,1 a 37,2 °C (axilar); febre ≥ 37,8 °C." },
          { t: "Pulso / FC", d: "60 a 100 bpm." },
          { t: "Frequência respiratória", d: "12 a 20 irpm (eupneia)." },
          { t: "Pressão arterial", d: "Ótima < 120 × 80 mmHg; hipertensão ≥ 140 × 90 mmHg." },
          { t: "Dor", d: "5º sinal vital — avaliar com escala (numérica, faces)." }
        ]
      },
      {
        type: "section",
        title: "Exame físico, higiene e conforto",
        items: [
          { t: "Técnicas propedêuticas", d: "Inspeção, palpação, percussão e ausculta, em sequência cefalocaudal." },
          { t: "Higiene", d: "Banho no leito, higiene oral e cuidados com pele e mucosas previnem infecções." },
          { t: "Conforto", d: "Posicionamento adequado, alívio da dor e ambiente tranquilo." }
        ]
      },
      {
        type: "section",
        title: "Mobilização, quedas e lesão por pressão",
        items: [
          { t: "Mobilização", d: "Mudança de decúbito a cada 2 horas; exercícios ativos/passivos." },
          { t: "Prevenção de quedas", d: "Avaliar com a Escala de Morse; grades elevadas e campainha ao alcance." },
          { t: "Lesão por pressão", d: "Avaliar com a Escala de Braden; alívio de pressão e hidratação da pele." }
        ]
      },
      {
        type: "section",
        title: "Oxigenoterapia, sondagens e curativos",
        items: [
          { t: "Oxigenoterapia", d: "Cateter nasal (1–6 L/min), máscara simples, máscara de Venturi e nebulização." },
          { t: "Sondagens", d: "Nasogástrica/nasoenteral — confirmar posicionamento antes de administrar dieta." },
          { t: "Cateterismo vesical", d: "Técnica estéril; sistema fechado para prevenir ITU." },
          { t: "Curativos", d: "Limpo ou estéril conforme a ferida; avaliar leito, exsudato e sinais de infecção." },
          { t: "Coleta de materiais", d: "Observar técnica, frasco e transporte adequados para cada exame." }
        ]
      },
    {
      type: "section",
      title: "Escalas mais cobradas na prática",
      items: [
        { t: "Glasgow (ECG-P)", d: "Nível de consciência: ocular, verbal, motora + pupilar — 0 a 15 pontos." },
        { t: "Dor (numérica)", d: "0 = sem dor; 1–3 leve; 4–6 moderada; 7–10 forte/pior dor." },
        { t: "Morse (quedas)", d: "0–24 risco baixo; 25–44 moderado; ≥ 45 alto." },
        { t: "Braden (LPP)", d: "6 subescalas, máximo 23; quanto menor o escore, maior o risco." }
      ]
    },
    {
      type: "links",
      title: "Aprofunde no site — escalas assistenciais",
      items: [
        { t: "Escala de Coma de Glasgow", d: "Avaliação neurológica e ECG-P.", url: "/glasgow.html" },
        { t: "Escala Numérica de Dor", d: "Classificação 0–10 e Escala de Faces.", url: "/escalanumerica.html" },
        { t: "Escala de Morse", d: "Risco de quedas em 6 variáveis.", url: "/morse.html" },
        { t: "Escala de Braden", d: "Risco de lesão por pressão.", url: "/braden.html" },
        { t: "SBAR — passagem de plantão", d: "Comunicação estruturada entre turnos.", url: "/sbar.html" }
      ]
    },
    ],
    keywords: ["sinais vitais", "exame físico", "prevenção de quedas", "escala de Braden", "oxigenoterapia", "cateterismo vesical", "curativos"]
  },

  E04: {
    layout: "blocos",
    hero: {
      kicker: "Administração de medicamentos",
      title: "Cálculo, diluição e segurança na medicação",
      text: "Erros de medicação estão entre os eventos adversos mais comuns. Dominar cálculo de dose, diluição e gotejamento é indispensável para a segurança do paciente."
    },
    blocks: [
      {
        type: "chips",
        title: "Os 9 certos da administração segura",
        items: ["Paciente certo", "Medicamento certo", "Dose certa", "Via certa", "Hora certa", "Registro certo", "Validade certa", "Ação/reação certa", "Orientação certa"]
      },
      {
        type: "section",
        title: "Vias de administração",
        items: [
          { t: "Oral / sublingual", d: "Absorção pelo trato digestivo ou mucosa sublingual (efeito mais rápido)." },
          { t: "Intradérmica (ID)", d: "Ângulo de 5–15°; usada em testes e vacinas (BCG)." },
          { t: "Subcutânea (SC)", d: "Ângulo de 45–90°; insulina e heparina." },
          { t: "Intramuscular (IM)", d: "Ângulo de 90°; ventroglútea, dorsoglútea, vasto lateral e deltoide." },
          { t: "Endovenosa (EV)", d: "Ação imediata; atenção a compatibilidade e velocidade de infusão." }
        ]
      },
      {
        type: "flow",
        title: "Cálculo de gotejamento (fórmulas essenciais)",
        steps: [
          { t: "Macrogotas", d: "gotas/min = Volume (ml) ÷ (Tempo em horas × 3)." },
          { t: "Microgotas", d: "microgotas/min = Volume (ml) ÷ Tempo em horas." },
          { t: "ml/h (bomba)", d: "ml/h = Volume (ml) ÷ Tempo em horas." },
          { t: "Dose por regra de três", d: "Ex.: se 500 mg = 5 ml, então X mg = ? ml (prescrição × volume ÷ concentração)." }
        ]
      },
      {
        type: "note",
        title: "Diluição e compatibilidade",
        text: "Confira sempre a compatibilidade entre fármacos e diluentes (soro fisiológico, glicose, água destilada) e a estabilidade após a diluição. Medicamentos incompatíveis não devem ser misturados na mesma via ou bolsa."
      },
    {
      type: "section",
      title: "Medicamentos de alta vigilância (MAV) e checagem",
      items: [
        { t: "Exemplos de MAV", d: "Drogas vasoativas, opioides, insulinas, eletrólitos concentrados (KCl 19,1%), anticoagulantes e antineoplásicos." },
        { t: "Dupla checagem", d: "Verificação independente por 2 profissionais (técnico + enfermeiro), sobretudo em MAV." },
        { t: "Tripla checagem", d: "3 profissionais: farmácia (técnico), preparo (enfermeiro + técnico) e médico prescritor/farmacêutico." },
        { t: "Paciente certo", d: "Usar no mínimo 2 identificadores (pulseira, prontuário, pergunta aberta)." }
      ]
    },
    {
      type: "section",
      title: "Insulina e evento sentinela",
      items: [
        { t: "Seringa de insulina", d: "1 mL = 100 UI: 50 UI = 0,5 mL; 30 UI = 0,3 mL; 10 UI = 0,1 mL. Preferir seringa graduada em UI." },
        { t: "Evento sentinela", d: "Ocorrência grave e inesperada (morte/dano permanente) → notificação obrigatória e análise de causa raiz." }
      ]
    },
    {
      type: "links",
      title: "Aprofunde no site",
      items: [
        { t: "Calculadora de medicamentos", d: "Regra de três, diluição e frasco-ampola.", url: "/medicamentos.html" },
        { t: "Calculadora de gotejamento", d: "Macrogotas e microgotas por minuto.", url: "/gotejamento.html" },
        { t: "Aspiração de insulina", d: "Conversão de UI para mL na seringa.", url: "/insulina.html" },
        { t: "Dupla e tripla checagem", d: "Como aplicar na prática.", url: "/checagem.html" },
        { t: "Os 9 certos (ANVISA)", d: "Regras da administração segura.", url: "/regrasmedicacoes.html" },
        { t: "Medicamentos de alta vigilância", d: "MAV e vigilância da farmácia ao leito.", url: "/vigilancia.html" }
      ]
    },
    ],
    keywords: ["9 certos", "vias de administração", "gotejamento", "diluição", "compatibilidade", "segurança na medicação"]
  },

  E05: {
    layout: "blocos",
    hero: {
      kicker: "Biossegurança e controle de infecção",
      title: "Precauções, processamento e prevenção de IRAS",
      text: "A biossegurança protege o profissional e o paciente. A higiene das mãos é a medida isolada mais importante na prevenção das Infecções Relacionadas à Assistência à Saúde (IRAS)."
    },
    blocks: [
      {
        type: "section",
        title: "Precauções — padrão e específicas",
        items: [
          { t: "Precauções padrão", d: "Para todos os pacientes: higiene das mãos, luvas quando houver risco, máscara, óculos e avental conforme a exposição." },
          { t: "Contato", d: "Luvas + avental; quarto privativo (ex.: bactérias multirresistentes)." },
          { t: "Gotículas", d: "Máscara cirúrgica a < 1 metro (ex.: coqueluche, meningite)." },
          { t: "Aerossóis", d: "Máscara N95/PFF2 e quarto com pressão negativa (ex.: tuberculose, sarampo)." }
        ]
      },
      {
        type: "flow",
        title: "Os 5 momentos da higiene das mãos (OMS)",
        steps: [
          { t: "Antes de tocar o paciente", d: "" },
          { t: "Antes de procedimento limpo/asséptico", d: "" },
          { t: "Após risco de exposição a fluidos", d: "" },
          { t: "Após tocar o paciente", d: "" },
          { t: "Após tocar superfícies próximas", d: "" }
        ]
      },
      {
        type: "section",
        title: "Processamento de artigos (Classificação de Spaulding)",
        items: [
          { t: "Artigos críticos", d: "Penetram tecidos estéreis → exigem ESTERILIZAÇÃO (autoclave)." },
          { t: "Artigos semicríticos", d: "Tocam mucosas → desinfecção de alto nível." },
          { t: "Artigos não críticos", d: "Tocam pele íntegra → limpeza ou desinfecção de baixo/médio nível." }
        ]
      },
      {
        type: "section",
        title: "EPI e resíduos",
        items: [
          { t: "EPI (NR-32)", d: "Fornecimento e uso obrigatórios: luvas, máscara, óculos, avental, gorro e calçados." },
          { t: "Resíduos (RDC 222/2018)", d: "Segregação na origem: infectante, químico, perfurocortante e comum." },
          { t: "Perfurocortantes", d: "Descarte imediato em recipiente rígido, sem reencapar agulhas." }
        ]
      },
      {
        type: "refs",
        title: "Fontes oficiais",
        items: [
          { label: "RDC 15/2012", text: "Boas práticas para processamento de produtos para saúde — ANVISA", url: "https://bvsms.saude.gov.br/bvs/saudelegis/anvisa/2012/rdc0015_15_03_2012.html" },
          { label: "RDC 222/2018", text: "Gerenciamento de resíduos de serviços de saúde — ANVISA", url: "https://bvsms.saude.gov.br/bvs/saudelegis/anvisa/2018/rdc0222_28_03_2018.pdf" },
          { label: "NR-32", text: "Segurança e saúde no trabalho em serviços de saúde", url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/norma-regulamentadora-no-32-nr-32" }
        ]
      },
    {
      type: "section",
      title: "Segurança do paciente e NRs (contexto)",
      items: [
        { t: "PNSP", d: "Portaria 529/2013 + RDC 36/2013 — programa nacional de segurança do paciente." },
        { t: "Meta 5", d: "Reduzir o risco de infecções associadas à assistência (higiene das mãos)." },
        { t: "NR-6", d: "EPI fornecido gratuitamente ao trabalhador." },
        { t: "NR-32", d: "Norma específica de segurança e saúde em serviços de saúde." }
      ]
    },
    {
      type: "links",
      title: "Aprofunde no site",
      items: [
        { t: "Metas Internacionais de Segurança", d: "As 6 metas da OMS/JCI explicadas.", url: "/metasinternacionais.html" },
        { t: "Normas Regulamentadoras (NRs)", d: "NR-1, NR-6, NR-32 e demais.", url: "/normas-regulamentadoras.html" },
        { t: "Uso seguro de medicamentos", d: "Os 9 certos na prevenção de IRAS e erros.", url: "/regrasmedicacoes.html" },
        { t: "Dupla e tripla checagem", d: "Segurança na administração.", url: "/checagem.html" }
      ]
    },
    ],
    keywords: ["precauções padrão", "higiene das mãos", "EPI", "Spaulding", "esterilização", "RDC 15/2012", "RDC 222/2018", "IRAS"]
  },

  E06: {
    layout: "blocos",
    hero: {
      kicker: "Saúde coletiva e imunização",
      title: "APS, ESF, sala de vacina e epidemiologia",
      text: "Na Atenção Primária, a Estratégia Saúde da Família atua no território com visita domiciliar e grupos educativos. A sala de vacina exige domínio do calendário, da cadeia de frio e da vigilância de eventos adversos pós-vacinação (EAPV)."
    },
    blocks: [
      {
        type: "section",
        title: "ESF e território",
        items: [
          { t: "Equipe mínima", d: "Médico, enfermeiro, técnico/auxiliar e Agentes Comunitários de Saúde (ACS)." },
          { t: "Territorialização", d: "Adscrição da clientela e cadastro das famílias de uma área delimitada." },
          { t: "Visita domiciliar", d: "Instrumento de busca ativa, acompanhamento e educação em saúde." },
          { t: "Grupos educativos", d: "Promoção da saúde e prevenção de agravos (gestantes, hipertensos, diabéticos...)." }
        ]
      },
      {
        type: "section",
        title: "Calendário vacinal e cadeia de frio",
        items: [
          { t: "Imunobiológicos", d: "Vacinas (imunização ativa) e soros/imunoglobulinas (passiva)." },
          { t: "Cadeia de frio", d: "Conservação em temperatura adequada (geralmente +2 a +8 °C) do laboratório ao usuário." },
          { t: "Sala de vacina", d: "Equipe treinada, registro correto e monitoramento diário da temperatura." },
          { t: "EAPV", d: "Notificar eventos adversos pós-vacinação e orientar a conduta." }
        ]
      },
      {
        type: "section",
        title: "Vigilância e investigação epidemiológica",
        items: [
          { t: "Notificação compulsória", d: "Doenças e agravos de notificação obrigatória via SINAN." },
          { t: "Investigação de surtos", d: "Identificar fonte, modo de transmissão e casos; adotar medidas de controle." },
          { t: "Indicadores", d: "Cobertura vacinal, incidência, mortalidade e dados de morbidade orientam as ações." }
        ]
      },
      {
        type: "refs",
        title: "Fonte oficial",
        items: [
          { label: "PNI", text: "Programa Nacional de Imunizações — Ministério da Saúde", url: "https://www.gov.br/saude/pt-br/composicao/svsa/pni" }
        ]
      },
    {
      type: "section",
      title: "Números-chave da APS e da PNAB (Portaria 2.436/2017)",
      items: [
        { t: "Porta de entrada", d: "A APS resolve cerca de 80–85% dos problemas de saúde." },
        { t: "ESF", d: "Modelo prioritário; equipe cobre 2.000 a 3.500 pessoas." },
        { t: "ACS", d: "Até 750 pessoas por agente comunitário." },
        { t: "Carga horária", d: "eSF com 40h semanais (eAB mínima de 10h)." }
      ]
    },
    {
      type: "section",
      title: "Notificação compulsória e SINAN",
      items: [
        { t: "Prazos", d: "Imediata: até 24 horas; semanal (mediata): até 7 dias." },
        { t: "Base legal", d: "Portaria GM/MS nº 6.734/2025 — 65 doenças/agravos/eventos (quase 100 com subdivisões)." },
        { t: "SINAN", d: "Sistema de Informação de Agravos de Notificação; criado em 1975 e incorporado ao SUS a partir de 1990." },
        { t: "Poliomielite", d: "Erradicada no Brasil em 1989 — qualquer caso é notificação imediata." }
      ]
    },
    {
      type: "links",
      title: "Aprofunde no site",
      items: [
        { t: "Manual de notificação compulsória", d: "Doenças imediatas e semanais.", url: "/notificacao-compulsoria.html" },
        { t: "O que é SINAN?", d: "Sistema e fluxo da notificação.", url: "/sinan.html" },
        { t: "Lista das 65 doenças", d: "Lista Nacional de Notificação (2025).", url: "/lista-de-doencas-de-notificacao-compulsoria.html" },
        { t: "Calendário de vacinação", d: "Calendário infantil 2026 (SUS e privado).", url: "/calculadoravacina.html" },
        { t: "Princípios do SUS", d: "Universalidade, integralidade, equidade.", url: "/principios_sus.html" },
        { t: "Lei 8.080/90", d: "Estrutura e organização do SUS.", url: "/lei8080-sus.html" },
        { t: "Guia rápido PNAB", d: "Atenção Básica e ESF.", url: "/guia_rapido_pnab.html" }
      ]
    },
    ],
    keywords: ["Estratégia Saúde da Família", "territorialização", "visita domiciliar", "calendário vacinal", "cadeia de frio", "EAPV", "notificação compulsória"]
  },

  E12: {
    layout: "blocos",
    hero: {
      kicker: "Gestão em enfermagem",
      title: "Dimensionamento, indicadores e segurança do paciente",
      text: "O enfermeiro gerencia a equipe, os materiais e os indicadores assistenciais, garantindo assistência segura. O dimensionamento segue a Resolução COFEN 543/2017, e a segurança do paciente segue as metas internacionais."
    },
    blocks: [
      {
        type: "section",
        title: "Dimensionamento de pessoal (COFEN 543/2017)",
        items: [
          { t: "Base do cálculo", d: "Horas de assistência por paciente conforme o tipo de cuidado (mínimo, intermediário, alta dependência, semi-intensivo e intensivo)." },
          { t: "Carga horária", d: "36 h/semana para o cálculo de pessoal; considerar índice de segurança técnica (IST)." },
          { t: "Distribuição", d: "Percentual de enfermeiros na equipe conforme a complexidade da assistência." }
        ]
      },
      {
        type: "section",
        title: "Liderança, materiais e indicadores",
        items: [
          { t: "Liderança", d: "Coordenação da equipe, educação permanente e tomada de decisão." },
          { t: "Gerenciamento de materiais", d: "Previsão, provisão, organização e controle de insumos." },
          { t: "Indicadores assistenciais", d: "Taxa de infecção, incidência de lesão por pressão, queda e flebite." },
          { t: "Auditoria", d: "Avaliação da qualidade dos registros e da assistência prestada." }
        ]
      },
      {
        type: "flow",
        title: "As 6 metas internacionais de segurança do paciente",
        steps: [
          { t: "Identificar o paciente corretamente", d: "" },
          { t: "Melhorar a comunicação efetiva", d: "" },
          { t: "Segurança de medicamentos de alta vigilância", d: "" },
          { t: "Cirurgia segura", d: "Local, procedimento e paciente corretos." },
          { t: "Reduzir risco de infecções", d: "Higiene das mãos." },
          { t: "Reduzir risco de quedas e lesão por pressão", d: "" }
        ]
      },
      {
        type: "section",
        title: "Comunicação e passagem de plantão",
        items: [
          { t: "SBAR", d: "Situação, Background (antecedentes), Avaliação e Recomendação — método para comunicação segura." },
          { t: "Passagem de plantão", d: "Registro claro, à beira do leito e sem interrupções." },
          { t: "Equipe multiprofissional", d: "Trabalho colaborativo centrado no paciente e na família." }
        ]
      },
      {
        type: "refs",
        title: "Fontes oficiais",
        items: [
          { label: "COFEN 543/17", text: "Dimensionamento do quadro de profissionais de enfermagem", url: "https://www.cofen.gov.br/resolucao-cofen-5432017/" },
          { label: "PNSP", text: "Programa Nacional de Segurança do Paciente — Ministério da Saúde", url: "https://www.gov.br/saude/pt-br/composicao/saes/dicas-em-saude/seguranca-do-paciente" }
        ]
      },
    {
      type: "section",
      title: "Números-chave do dimensionamento (Parecer COFEN 01/2024)",
      items: [
        { t: "HPPD mínimos", d: "Mínimo 4h; intermediário 6h; alta dependência 10h; semi-intensivo 10h; intensivo 18h." },
        { t: "IST", d: "Mínimo 15%; +10% quando >30% da equipe tem restrição; +5% (opcional) de educação permanente." },
        { t: "CHS", d: "30/36/40/44h ou 12x36 (referência 42h)." },
        { t: "Centro cirúrgico", d: "1 enfermeiro por 3 salas eletivas; 1 enfermeiro por sala em urgência." },
        { t: "Hemodiálise", d: "4h por paciente/sessão; 25% enfermeiros e 75% técnicos." }
      ]
    },
    {
      type: "links",
      title: "Aprofunde no site",
      items: [
        { t: "Dimensionamento — internação", d: "Cálculo por carga de trabalho (HPPD).", url: "/dimensionamento.html" },
        { t: "Dimensionamento — todos os setores", d: "UTI, centro cirúrgico, hemodiálise e oncologia.", url: "/dimensionamento-cofen.html" },
        { t: "SBAR — passagem de plantão", d: "Situação, Background, Avaliação e Recomendação.", url: "/sbar.html" },
        { t: "Metas Internacionais de Segurança", d: "As 6 metas da OMS/JCI.", url: "/metasinternacionais.html" },
        { t: "Escala de plantão 12x36", d: "Gerador de escala diurna/noturna.", url: "/escala_de_trabalho_enfermagem_12x36.html" },
        { t: "Dupla e tripla checagem", d: "Segurança na medicação (Meta 3).", url: "/checagem.html" }
      ]
    },
    ],
    keywords: ["dimensionamento", "COFEN 543/2017", "indicadores", "auditoria", "segurança do paciente", "metas internacionais", "SBAR", "passagem de plantão"]
  }
};

// ============ APLICAR NOS DOIS ARQUIVOS ============
function applyToFile(path, isDataJs) {
  let raw = fs.readFileSync(path, 'utf8');
  let obj;
  if (isDataJs) {
    const t = raw.trim().replace(/^window\.SANTOS_DATA\s*=\s*/, '').replace(/;\s*$/, '');
    obj = JSON.parse(t);
  } else {
    obj = JSON.parse(raw);
  }
  let count = 0;
  for (const id of Object.keys(guides)) {
    const topic = obj.topics.find(x => x.id === id);
    if (topic) {
      topic.guide = guides[id];
      count++;
    } else {
      console.error(`Tópico não encontrado: ${id}`);
    }
  }
  const out = isDataJs
    ? `window.SANTOS_DATA = ${JSON.stringify(obj, null, 2)};`
    : JSON.stringify(obj, null, 2);
  fs.writeFileSync(path, out, 'utf8');
  console.log(`${path}: ${count} guias aplicados`);
}

applyToFile('concurso_publico/data/concurso-santos-enfermeiro-74-2026.json', false);
applyToFile('concurso_publico/js/data.js', true);

console.log('Concluído.');
