const fs = require('fs');

// ============ GUIAS (layout "blocos") — Português, Legislação e SUS restantes ============
const guides = {
  // ---------- PORTUGUÊS ----------
  P01: {
    layout: "blocos",
    hero: {
      kicker: "Língua Portuguesa · interpretação de texto",
      title: "Leitura, compreensão e interpretação",
      text: "A banca cobra a diferença entre o que o texto DIZ (explícito) e o que ele SUGERE (implícito). Domine tema, assunto, tese, argumentos, inferências, pressupostos e subentendidos."
    },
    blocks: [
      {
        type: "section",
        title: "Os três níveis de leitura",
        items: [
          { t: "Tema", d: "Ideia central, resumida em palavra/frase nominal (sobre o que o texto fala)." },
          { t: "Assunto", d: "Recorte específico do tema dentro do texto." },
          { t: "Finalidade/intenção", d: "Para que o texto foi escrito: informar, orientar, instruir, convencer." },
          { t: "Explícito × implícito", d: "Explícito está na superfície textual; implícito é pressuposto (linguístico) ou subentendido (contextual)." }
        ]
      },
      {
        type: "section",
        title: "Tese, argumentos e conclusão",
        items: [
          { t: "Tese", d: "Ponto de vista defendido no texto dissertativo-argumentativo." },
          { t: "Argumentos", d: "Fundamentos que sustentam a tese: dados, exemplos, autoridade, causa e consequência." },
          { t: "Conclusão", d: "Retomada/síntese; pode propor intervenção." },
          { t: "Inferência", d: "Conclusão lógica tirada de pistas do texto — precisa ser autorizada pelo texto (evite extrapolar)." }
        ]
      },
      {
        type: "note",
        title: "Pegadinha clássica",
        text: "Pressuposto é dedutível de uma marca linguística presente na frase (ex.: “parou de fumar” pressupõe que fumava). Subentendido depende do contexto e da intenção do falante, não de uma palavra específica."
      },
      {
        type: "chips",
        title: "Gatilhos de prova",
        items: ["tema ≠ assunto", "explícito ≠ implícito", "inferência autorizada pelo texto", "pressuposto é linguístico", "subentendido é contextual", "finalidade ≠ tese"]
      }
    ],
    keywords: ["tema", "assunto", "finalidade", "tese", "argumentos", "inferência", "pressupostos", "subentendidos"]
  },

  P02: {
    layout: "blocos",
    hero: {
      kicker: "Língua Portuguesa · mecanismos textuais",
      title: "Coesão, coerência e relações lógico-discursivas",
      text: "Coesão é a ligação superficial entre as partes do texto; coerência é a unidade de sentido. Os conectores são a principal ferramenta de coesão — conheça o valor de cada um."
    },
    blocks: [
      {
        type: "section",
        title: "Coesão referencial",
        items: [
          { t: "Anáfora", d: "Retoma termo anterior (ex.: “o paciente… ele”)." },
          { t: "Catáfora", d: "Antecipa termo posterior (ex.: “Só isto importa: a sua saúde”)." },
          { t: "Pronomes", d: "Pessoais, demonstrativos (este/esse/aquele), relativos (que, o qual, cujo)." },
          { t: "Elipse", d: "Omissão de um termo recuperável pelo contexto." }
        ]
      },
      {
        type: "section",
        title: "Conectores e suas relações",
        items: [
          { t: "Adição", d: "e, além disso, bem como, ademais." },
          { t: "Oposição", d: "mas, porém, contudo, entretanto, no entanto." },
          { t: "Causa / consequência", d: "porque, pois, visto que / logo, portanto, por isso." },
          { t: "Conclusão", d: "portanto, assim, desse modo." },
          { t: "Concessão", d: "embora, ainda que, mesmo que." },
          { t: "Condição / finalidade", d: "se, caso, desde que / para que, a fim de que." }
        ]
      },
      {
        type: "note",
        title: "Coerência ≠ coesão",
        text: "Coesão é a ligação superficial (conectivos, pronomes, repetição); coerência é a unidade de sentido global. Um texto pode ser coeso e incoerente — e vice-versa."
      },
      {
        type: "chips",
        title: "Valores dos conectores",
        items: ["adição", "oposição", "causa", "consequência", "conclusão", "concessão", "condição", "finalidade"]
      }
    ],
    keywords: ["coesão referencial", "anáfora", "catáfora", "conectores", "coerência", "pronomes", "progressão temática"]
  },

  P03: {
    layout: "blocos",
    hero: {
      kicker: "Língua Portuguesa · semântica e reescrita",
      title: "Semântica, gêneros e reescrita",
      text: "Sentido denotativo e conotativo, sinonímia, antonímia, ambiguidade e paráfrase são os pilares da semântica. A reescrita exige preservar o sentido original."
    },
    blocks: [
      {
        type: "section",
        title: "Sentido das palavras",
        items: [
          { t: "Denotação", d: "Sentido literal, do dicionário." },
          { t: "Conotação", d: "Sentido figurado, dependente do contexto." },
          { t: "Sinonímia / antonímia", d: "Sentido equivalente / oposto (sempre em contexto)." },
          { t: "Ambiguidade", d: "Duplo sentido (lexical ou estrutural) que prejudica a clareza." },
          { t: "Paráfrase", d: "Reescrever mantendo o sentido." }
        ]
      },
      {
        type: "section",
        title: "Gêneros técnicos e institucionais",
        items: [
          { t: "Ofício, memorando e e-mail institucional", d: "Linguagem formal e impessoal; padrão culto." },
          { t: "Relatório e parecer", d: "Estrutura clara, objetiva e conclusiva." },
          { t: "Edital e portaria", d: "Textos normativos com força de norma." }
        ]
      },
      {
        type: "note",
        title: "Reescrita sem mudar o sentido",
        text: "Na reescrita, preserve: sujeito/agente, tempo verbal, relações de sentido e o foco da informação. Trocar conectivo por outro de valor EQUIVALENTE mantém a correção; trocar por valor DIFERENTE altera o sentido."
      }
    ],
    keywords: ["denotação", "conotação", "sinonímia", "antonímia", "ambiguidade", "paráfrase", "gêneros técnicos", "reescrita"]
  },

  P04: {
    layout: "blocos",
    hero: {
      kicker: "Língua Portuguesa · gramática aplicada",
      title: "Gramática aplicada ao texto",
      text: "As questões de gramática aparecem aplicadas a frases do texto: concordância, regência, crase, pontuação e colocação pronominal. Estude com exemplos, não só regras."
    },
    blocks: [
      {
        type: "section",
        title: "Concordância e regência",
        items: [
          { t: "Concordância verbal", d: "Sujeito composto, porcentagens, verbo “haver” impessoal, verbos impessoais." },
          { t: "Concordância nominal", d: "Adjetivo/particípio concordam com o substantivo." },
          { t: "Regência", d: "Verbos que exigem preposição: aspirar a, assistir a, visar a, obedecer a, implicar em." },
          { t: "Crase", d: "Fusão de “a” + “a”; proibida antes de verbo, palavra masculina e pronome pessoal." }
        ]
      },
      {
        type: "section",
        title: "Ortografia, acentuação, pontuação e colocação",
        items: [
          { t: "Acentuação", d: "Paroxítonas, oxítonas, proparoxítonas, hiatos e acento diferencial." },
          { t: "Pontuação", d: "A vírgula NÃO separa sujeito de verbo nem verbo de objeto; usar dois-pontos e ponto e vírgula corretamente." },
          { t: "Colocação pronominal", d: "Próclise, mesóclise e ênclise; não iniciar frase com pronome átono." }
        ]
      },
      {
        type: "note",
        title: "Pegadinhas recorrentes",
        text: "Crase proibida antes de palavra masculina, verbo e pronomes pessoais; facultativa antes de pronome possessivo feminino singular. “Haver” com sentido de existir é impessoal (não varia)."
      }
    ],
    keywords: ["concordância", "regência", "crase", "pontuação", "acentuação", "colocação pronominal", "classes de palavras"]
  },

  P05: {
    layout: "blocos",
    hero: {
      kicker: "Língua Portuguesa · sintaxe e comunicação",
      title: "Período e comunicação institucional",
      text: "Do período simples ao composto (coordenação e subordinação), e da sintaxe à redação oficial: clareza, objetividade, impessoalidade e precisão."
    },
    blocks: [
      {
        type: "section",
        title: "Período simples e composto",
        items: [
          { t: "Período simples", d: "Uma única oração." },
          { t: "Coordenação", d: "Orações independentes (sindéticas e assindéticas)." },
          { t: "Subordinação", d: "Orações substantivas, adjetivas (restritivas/explicativas) e adverbiais." },
          { t: "Oração reduzida", d: "De infinitivo, gerúndio ou particípio." }
        ]
      },
      {
        type: "section",
        title: "Comunicação institucional",
        items: [
          { t: "Clareza", d: "Frases curtas e ordem direta." },
          { t: "Objetividade", d: "Ir direto ao assunto, sem rodeios." },
          { t: "Impessoalidade", d: "Evitar 1ª pessoa e marcas de subjetividade em documentos oficiais." },
          { t: "Precisão", d: "Vocabulário adequado, sem ambiguidade." }
        ]
      },
      {
        type: "note",
        title: "Adequação vocabular",
        text: "Em documentos oficiais, prefira a norma culta e evite gírias, coloquialismos e marcas regionais. O “você” deve ser evitado em textos formais; use o tratamento adequado ao cargo."
      }
    ],
    keywords: ["período simples", "coordenação", "subordinação", "clareza", "objetividade", "impessoalidade", "adequação vocabular"]
  },

  // ---------- LEGISLAÇÃO MUNICIPAL ----------
  M01: {
    layout: "blocos",
    hero: {
      kicker: "Legislação Municipal · Santos/SP",
      title: "Lei Orgânica do Município de Santos",
      text: "A Lei Orgânica é a norma maior do Município — o equivalente municipal da Constituição. As questões focam competências, administração, servidores e controle."
    },
    blocks: [
      {
        type: "section",
        title: "Organização e competências",
        items: [
          { t: "Lei Orgânica", d: "Norma maior do Município, elaborada respeitando a CF/88 e a Constituição Estadual." },
          { t: "Autonomia municipal", d: "Organizar-se por lei orgânica e legislar sobre assuntos de interesse local." },
          { t: "Competências", d: "Serviços públicos locais, saúde, assistência social, meio ambiente e proteção social." },
          { t: "Saúde", d: "Competência comum/material — cooperação com União e Estado." }
        ]
      },
      {
        type: "section",
        title: "Administração, servidores e controle",
        items: [
          { t: "Princípios", d: "Legalidade, impessoalidade, moralidade, publicidade e eficiência." },
          { t: "Servidores", d: "Concurso público como regra de ingresso." },
          { t: "Controle", d: "Interno (controladoria) e externo (Câmara Municipal + Tribunal de Contas)." }
        ]
      },
      {
        type: "note",
        title: "Como estudar",
        text: "É “letra de lei”: leia o texto consolidado da Lei Orgânica de Santos e marque competências, prazos e órgãos de controle. As questões costumam trocar a esfera de competência (Município × Estado × União)."
      },
      {
        type: "refs",
        title: "Fontes oficiais",
        items: [
          { label: "Câmara de Santos", text: "Lei Orgânica do Município — texto consolidado", url: "https://www.camarasantos.sp.gov.br" },
          { label: "Prefeitura de Santos", text: "Portal oficial do Município", url: "https://www.santos.sp.gov.br" }
        ]
      }
    ],
    keywords: ["Lei Orgânica", "competências municipais", "autonomia", "servidores", "controle", "princípios da Administração"]
  },

  M02: {
    layout: "blocos",
    hero: {
      kicker: "Legislação Municipal · estatuto",
      title: "Lei nº 4.623/1984 — Estatuto dos Funcionários",
      text: "Regula a vida funcional do servidor: provimento, posse, exercício, direitos, deveres, responsabilidades, proibições e regime disciplinar. Estude sempre pelo texto consolidado."
    },
    blocks: [
      {
        type: "section",
        title: "Provimento, posse e exercício",
        items: [
          { t: "Provimento", d: "Preenchimento do cargo — nomeação (efetivo por concurso; comissão)." },
          { t: "Posse", d: "Ato de investidura no cargo, dentro do prazo legal." },
          { t: "Exercício", d: "Início efetivo das funções; prazo para entrar em exercício." },
          { t: "Estágio probatório", d: "Avaliação de aptidão para o cargo." }
        ]
      },
      {
        type: "section",
        title: "Direitos, deveres e responsabilidades",
        items: [
          { t: "Direitos", d: "Vencimento, férias, licenças e gratificações conforme a lei." },
          { t: "Deveres", d: "Assiduidade, pontualidade, urbanidade, lealdade e zelo." },
          { t: "Responsabilidades", d: "Administrativa, civil e penal." },
          { t: "Proibições", d: "Acumulação de cargos, salvo as exceções constitucionais." }
        ]
      },
      {
        type: "section",
        title: "Regime disciplinar",
        items: [
          { t: "Penalidades", d: "Advertência, suspensão, demissão e cassação de aposentadoria." },
          { t: "Processo administrativo", d: "Garantia de ampla defesa e contraditório." }
        ]
      },
      {
        type: "note",
        title: "Atenção",
        text: "Cargos acumuláveis (CF/88): dois de professor; um de professor com um técnico/científico; dois privativos de saúde com profissão regulamentada. Confira prazos exatos no texto consolidado."
      }
    ],
    keywords: ["provimento", "posse", "exercício", "estágio probatório", "direitos e deveres", "penalidades", "acumulação de cargos"]
  },

  M03: {
    layout: "blocos",
    hero: {
      kicker: "Legislação Municipal · organização",
      title: "LC Municipal nº 1.253/2024",
      text: "Organiza a Administração Pública direta e indireta de Santos: órgãos, entidades, competências, estrutura e controle."
    },
    blocks: [
      {
        type: "section",
        title: "Administração direta e indireta",
        items: [
          { t: "Direta", d: "Órgãos do Município (secretarias e unidades)." },
          { t: "Indireta", d: "Autarquias, fundações, empresas públicas e sociedades de economia mista." },
          { t: "Órgão × entidade", d: "Órgão não tem personalidade jurídica própria; entidade tem." }
        ]
      },
      {
        type: "section",
        title: "Competências, estrutura e controle",
        items: [
          { t: "Estrutura", d: "Definição de órgãos, entidades e competências." },
          { t: "Planejamento", d: "PPA, LDO e LOA." },
          { t: "Controle", d: "Interno e externo das atividades administrativas." }
        ]
      },
      {
        type: "note",
        title: "Não confunda",
        text: "Órgão = unidade sem personalidade jurídica; entidade = com personalidade jurídica. A LC 1.253/2024 organiza a Administração direta e indireta de Santos — estude pelo texto consolidado."
      }
    ],
    keywords: ["administração direta", "administração indireta", "órgão", "entidade", "PPA", "LDO", "LOA", "controle"]
  },

  M04: {
    layout: "blocos",
    hero: {
      kicker: "Legislação · constitucional e ética",
      title: "Constituição e princípios do serviço público",
      text: "Os princípios da Administração Pública (LIMPE), a responsabilidade do Estado e o direito à saúde são os pilares desta área. É a base constitucional que sustenta o SUS."
    },
    blocks: [
      {
        type: "section",
        title: "Princípios — LIMPE (art. 37, caput)",
        items: [
          { t: "Legalidade", d: "Só fazer o que a lei autoriza." },
          { t: "Impessoalidade", d: "Sem favorecimentos; tratar todos com isonomia." },
          { t: "Moralidade", d: "Ética e probidade no agir administrativo." },
          { t: "Publicidade", d: "Transparência dos atos (salvo sigilo legal)." },
          { t: "Eficiência", d: "Bons resultados com racionalidade de recursos." }
        ]
      },
      {
        type: "section",
        title: "Servidores e responsabilidade do Estado",
        items: [
          { t: "Ingresso", d: "Concurso público para cargo efetivo; exceções: cargo em comissão e contratação temporária." },
          { t: "Responsabilidade civil", d: "Objetiva (art. 37, §6º): independe de culpa, com direito de regresso." },
          { t: "Direito à saúde", d: "Art. 196: direito de todos e dever do Estado." }
        ]
      },
      {
        type: "section",
        title: "Direitos fundamentais",
        items: [
          { t: "Dignidade da pessoa humana", d: "Fundamento da República (art. 1º, III)." },
          { t: "Igualdade", d: "Todos são iguais perante a lei (art. 5º, caput)." },
          { t: "Vedação à discriminação", d: "Base da equidade no SUS." }
        ]
      },
      {
        type: "links",
        title: "Aprofunde no site",
        items: [
          { t: "Princípios do SUS", d: "Universalidade, integralidade, equidade.", url: "/principios_sus.html" },
          { t: "Lei 8.080/90", d: "Organização do SUS.", url: "/lei8080-sus.html" },
          { t: "Código de Ética de Enfermagem", d: "Ética e sigilo profissional.", url: "/codigo_de_etica_enfermagem.html" }
        ]
      }
    ],
    keywords: ["LIMPE", "legalidade", "impessoalidade", "moralidade", "publicidade", "eficiência", "responsabilidade civil do Estado", "direito à saúde"]
  },

  M05: {
    layout: "blocos",
    hero: {
      kicker: "Legislação · transparência e dados",
      title: "Usuário, transparência, dados e governo digital",
      text: "Lei 13.460/2017 (direitos do usuário), LAI 12.527/2011 (transparência), LGPD 13.709/2018 (dados) e Lei 14.129/2021 (governo digital) formam o eixo de cidadania e transparência."
    },
    blocks: [
      {
        type: "section",
        title: "Direitos do usuário (Lei 13.460/2017)",
        items: [
          { t: "Direitos básicos", d: "Atendimento, informação, urbanidade, igualdade e proteção de dados." },
          { t: "Manifestações", d: "Reclamação, denúncia, elogio, sugestão e solicitação." },
          { t: "Ouvidoria", d: "Canal de recebimento e tratamento das manifestações." }
        ]
      },
      {
        type: "section",
        title: "LAI e LGPD",
        items: [
          { t: "LAI (12.527/2011)", d: "Publicidade como regra, sigilo como exceção; acesso à informação." },
          { t: "LGPD (13.709/2018)", d: "Proteção de dados pessoais; consentimento; ANPD." },
          { t: "Dados sensíveis", d: "Origem racial/étnica, convicção religiosa, opinião política, saúde, vida sexual, genéticos e biométricos." }
        ]
      },
      {
        type: "section",
        title: "Governo digital (Lei 14.129/2021)",
        items: [
          { t: "Digitalização", d: "Serviços públicos em meio digital." },
          { t: "Governo como plataforma", d: "Interoperabilidade entre sistemas." },
          { t: "Ética e sigilo funcional", d: "Integridade no tratamento da informação." }
        ]
      },
      {
        type: "note",
        title: "Pegadinha",
        text: "Dado de saúde é dado pessoal SENSÍVEL — no contexto de enfermagem, cuidado redobrado com o sigilo do prontuário. LGPD soma-se ao sigilo profissional do Código de Ética."
      }
    ],
    keywords: ["Lei 13.460/2017", "ouvidoria", "LAI", "LGPD", "dados sensíveis", "governo digital", "transparência", "sigilo funcional"]
  },

  // ---------- SUS (restantes) ----------
  S03: {
    layout: "blocos",
    hero: {
      kicker: "SUS · controle social",
      title: "Lei nº 8.142/1990 e controle social",
      text: "A Lei 8.142/1990 regulamenta a participação da comunidade (Conferências e Conselhos de Saúde) e as transferências intergovernamentais de recursos do SUS."
    },
    blocks: [
      {
        type: "section",
        title: "Conferências e Conselhos de Saúde",
        items: [
          { t: "Conferência de Saúde", d: "A cada 4 anos; avalia a situação e propõe diretrizes da política de saúde." },
          { t: "Conselho de Saúde", d: "Órgão permanente e DELIBERATIVO; atua na formulação e no controle da execução." },
          { t: "Composição paritária", d: "50% usuários, 25% trabalhadores da saúde, 25% gestores/prestadores." }
        ]
      },
      {
        type: "section",
        title: "Participação e financiamento",
        items: [
          { t: "Participação da comunidade", d: "Diretriz do SUS (CF, art. 198, III)." },
          { t: "Transferências", d: "Regulares e automáticas, fundo a fundo, com requisitos." },
          { t: "Condições", d: "Fundo de Saúde, Conselho de Saúde e plano de saúde para receber recursos." }
        ]
      },
      {
        type: "note",
        title: "Pegadinha",
        text: "O Conselho de Saúde é DELIBERATIVO e permanente — não é apenas consultivo. A Conferência é periódica (4 anos) e propõe diretrizes. As transferências exigem fundo, conselho e plano de saúde."
      },
      {
        type: "links",
        title: "Aprofunde no site",
        items: [
          { t: "Princípios do SUS", d: "Participação da comunidade e diretrizes.", url: "/principios_sus.html" },
          { t: "Lei 8.080/90", d: "Base de organização do SUS.", url: "/lei8080-sus.html" }
        ]
      }
    ],
    keywords: ["Lei 8.142/1990", "Conferência de Saúde", "Conselho de Saúde", "paridade", "participação da comunidade", "transferências fundo a fundo"]
  },

  S04: {
    layout: "blocos",
    hero: {
      kicker: "SUS · organização e financiamento",
      title: "Decreto 7.508/2011, RAS e LC 141/2012",
      text: "O Decreto 7.508/2011 regulamenta a organização do SUS (Regiões de Saúde, portas de entrada, RENASES/RENAME), e a LC 141/2012 define o financiamento e o mínimo de aplicação em saúde."
    },
    blocks: [
      {
        type: "section",
        title: "Decreto 7.508/2011 — organização do SUS",
        items: [
          { t: "Região de Saúde", d: "Espaço geográfico com ações e serviços de saúde; mínimo de APS, urgência, psicossocial, ambulatorial e hospitalar." },
          { t: "Portas de entrada", d: "Atenção primária, urgência/emergência, atenção psicossocial e especiais de acesso aberto." },
          { t: "RENASES", d: "Relação Nacional de Ações e Serviços de Saúde." },
          { t: "RENAME", d: "Relação Nacional de Medicamentos Essenciais." }
        ]
      },
      {
        type: "section",
        title: "Redes e planejamento",
        items: [
          { t: "RAS", d: "Redes de Atenção à Saúde — integração dos serviços." },
          { t: "Referência e contrarreferência", d: "Fluxo entre os níveis de complexidade." },
          { t: "Planejamento", d: "Plano de Saúde, programação anual e COAP." }
        ]
      },
      {
        type: "section",
        title: "LC 141/2012 — financiamento",
        items: [
          { t: "Valores mínimos", d: "Percentuais mínimos de aplicação em saúde por cada ente." },
          { t: "ASPS", d: "Ações e serviços públicos de saúde — o que conta e o que não conta." },
          { t: "Fiscalização", d: "Controle pelos conselhos de saúde." }
        ]
      },
      {
        type: "note",
        title: "Não confunda",
        text: "RENAME = medicamentos; RENASES = ações e serviços. As portas de entrada do 7.508 são: APS, urgência/emergência, atenção psicossocial e especiais de acesso aberto."
      },
      {
        type: "links",
        title: "Aprofunde no site",
        items: [
          { t: "Lei 8.080/90", d: "Organização do SUS.", url: "/lei8080-sus.html" },
          { t: "Guia rápido PNAB", d: "Atenção Primária como porta de entrada.", url: "/guia_rapido_pnab.html" },
          { t: "Princípios do SUS", d: "Regionalização e hierarquização.", url: "/principios_sus.html" }
        ]
      }
    ],
    keywords: ["Decreto 7.508/2011", "Região de Saúde", "portas de entrada", "RENASES", "RENAME", "LC 141/2012", "referência e contrarreferência"]
  },

  S07: {
    layout: "blocos",
    hero: {
      kicker: "SUS · segurança, bioética e redes",
      title: "Segurança, bioética, determinantes e redes de urgência/mental",
      text: "Integra o Programa Nacional de Segurança do Paciente, a bioética, os determinantes sociais da saúde e as redes de urgência/emergência e saúde mental no SUS."
    },
    blocks: [
      {
        type: "section",
        title: "Segurança do paciente (PNSP)",
        items: [
          { t: "PNSP", d: "Portaria 529/2013 — metas internacionais de segurança." },
          { t: "Metas", d: "Identificação correta, comunicação efetiva (SBAR), cirurgia segura, higiene das mãos, quedas e LPP." },
          { t: "Medicamentos", d: "9 certos, medicamentos de alta vigilância (MAV) e dupla/tripla checagem." },
          { t: "IRAS", d: "Prevenção e controle das infecções relacionadas à assistência." }
        ]
      },
      {
        type: "section",
        title: "Bioética e consentimento",
        items: [
          { t: "Princípios", d: "Autonomia, beneficência, não maleficência e justiça." },
          { t: "Consentimento informado", d: "Direito do paciente de decidir após informação adequada." },
          { t: "Sigilo", d: "Confidencialidade do prontuário e dos dados." }
        ]
      },
      {
        type: "section",
        title: "Determinantes sociais e redes",
        items: [
          { t: "Determinantes sociais", d: "Habitação, saneamento, renda, educação e trabalho." },
          { t: "Equidade", d: "Tratar desigualmente os desiguais, priorizando quem mais precisa." },
          { t: "Urgência e emergência", d: "SAMU, UPA e rede hospitalar." },
          { t: "Saúde mental", d: "RAPS e redução de danos." }
        ]
      },
      {
        type: "links",
        title: "Aprofunde no site",
        items: [
          { t: "Metas Internacionais de Segurança", d: "As 6 metas da OMS/JCI.", url: "/metasinternacionais.html" },
          { t: "Dupla e tripla checagem", d: "Segurança na medicação.", url: "/checagem.html" },
          { t: "Os 9 certos", d: "Administração segura.", url: "/regrasmedicacoes.html" },
          { t: "Notificação compulsória", d: "Doenças de notificação.", url: "/notificacao-compulsoria.html" },
          { t: "SINAN", d: "Sistema de notificação.", url: "/sinan.html" },
          { t: "Time de Resposta Rápida", d: "Deterioração clínica.", url: "/time-de-resposta-rapida.html" },
          { t: "Suporte Avançado de Vida", d: "ACLS/AHA.", url: "/suporte-avancado-de-vida.html" },
          { t: "Espaço Elisabeth Marques", d: "Saúde emocional.", url: "/elisabeth-marques-plataforma-completa.html" }
        ]
      }
    ],
    keywords: ["PNSP", "metas de segurança", "SBAR", "bioética", "determinantes sociais", "equidade", "SAMU", "RAPS", "redução de danos"]
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
