# Manual de Plano de Ação — Reformulação Estrutural dos Simulados

**Projeto:** Calculadoras de Enfermagem  
**Pasta:** PLANO_ACAO_MELHORIA_SIMULADOS  
**Data-base:** 04/10/2026  
**Status:** documento operacional vivo — fonte de planejamento da reforma dos simulados  
**Escopo:** simulados, quiz/flashcards e experiência de resolução de questões do site  
**Regra central:** preservar conteúdo clínico e gabaritos existentes até revisão/validação específica; a primeira reforma é de arquitetura, experiência, método pedagógico, descoberta, persistência, analytics e manutenção.

---

## 1. Objetivo deste manual

Este arquivo transforma a pesquisa aprofundada e a inspeção do repositório em um plano executável, incremental e reversível para reformular a área de simulados do Calculadoras de Enfermagem.

A reforma deve resolver simultaneamente:

1. descoberta dos simulados;
2. organização por público, tema, banca, ano e tipo;
3. experiência de início e realização;
4. progresso e retomada;
5. feedback pedagógico;
6. revisão de erros;
7. resultado útil para estudo;
8. recomendação do próximo passo;
9. SEO e arquitetura de informação;
10. acessibilidade e mobile;
11. mensuração por GA4/Search Console;
12. integração correta com login/Premium;
13. redução da duplicação técnica;
14. manutenção em escala;
15. preservação do conteúdo científico já existente.

Este manual NÃO autoriza reescrever respostas, gabaritos, referências clínicas ou legislação. Mudanças de conteúdo científico devem ser tratadas em revisão separada, com fonte e validação.

---

## 2. Fontes e método da pesquisa

### 2.1 Evidência interna observada

Foram inspecionados no repositório:

- regras AI_RULES.md, HTML_RULES.md, HTML_PAGE_TEMPLATE_RULES.md e AGENTS.md;
- menu-global.html;
- premium-content-manifest.json;
- conta/developer-route-catalog.json;
- js/access/premium-content-loader.js;
- shells HTML dos simulados;
- metadados SEO dos simulados;
- sistema canônico de contas, Premium e entitlement;
- referências de histórico/atividade de simulados na conta;
- padrões existentes de carregamento, acessibilidade e conteúdo Premium.

### 2.2 Comparação externa observada

A pesquisa comparou recursos e arquitetura encontrados em:

- PCI Concursos — acervo de provas, pesquisa e descoberta por cargo;
- Gran Questões — filtros, banco de questões, simulados, disciplinas/assuntos, acompanhamento de desempenho;
- EnfermagemOnline — simulados organizados por público/tema e conteúdo editorial associado;
- Site Rômulo Passos — banco de questões por disciplina/assunto/banca/ano/cargo, revisão de erros e acompanhamento de desempenho;
- Questões RE / Rômulo Enfermagem — referência adicional encontrada na atualização da pesquisa, com gabarito comentado, estatísticas, ranking, organização por banca/ano/cargo e simulado com tempo. Não confundir esta plataforma com o Site Rômulo Passos.

### 2.3 Limites da pesquisa

- Não foram inventados volumes de busca.
- Não se assume que um recurso do concorrente é automaticamente adequado ao nosso site.
- Não se copia layout, texto, banco de questões ou implementação de terceiros.
- Recursos externos servem como evidência de padrões de produto e de expectativas do usuário.
- O conteúdo protegido real dos simulados é entregue pelo mecanismo Premium atual; os shells públicos do GitHub exibem o placeholder de carregamento e não contêm necessariamente o documento final completo.
- A política Free/Premium é dinâmica e deve ser consultada novamente antes de qualquer mudança de gate.

---

## 3. Diagnóstico consolidado do método atual

### 3.1 O que existe hoje — evidência observada

O catálogo administrativo atual reconhece 20 rotas relacionadas a simulados/quiz:

1. flashcards_quiz.html
2. simulado-de-enfermagem-doencas-de-notificacao-compulsoria.html
3. simulado-de-enfermagem-nucleo-de-seguranca-do-paciente.html
4. simulado-de-enfermagem.html
5. simulado-de-enfermagem2.html
6. simulado-de-enfermagem3.html
7. simulado-de-enfermagem4.html
8. simulado_aleitamento_materno.html
9. simulado_bloco-operatorio.html
10. simulado_codigo_de_etica_enfermagem.html
11. simulado_hospital_amigo_da_crianca.html
12. simulado_humaniza_sus.html
13. simulado_ibam_bebedouro_enfermeiro_2024.html
14. simulado_ibam_guarulhos_enfermeiro_2024.html
15. simulado_ibam_guarulhos_enfermeiro_esf_2024.html
16. simulado_ibam_japaratuba_sergipe_enfermeiro_2014.html
17. simulado_lei_organica_do_sus_8080-90.html
18. simulado_participacao_da_comunidade.html
19. simulado_pcr.html
20. simulado_vacinacao.html

O menu principal, porém, expõe 18 entradas na área de Simulados. Há portanto uma divergência entre catálogo técnico e navegação pública: simulado-de-enfermagem4.html e simulado_bloco-operatorio.html existem no catálogo, mas não aparecem na lista desktop atual de Simulados. O flashcards_quiz.html aparece no menu e entra na contagem de 18 itens expostos.

Essa diferença deve ser tratada como achado de arquitetura, não corrigida silenciosamente.

### 3.2 Shell público e conteúdo real

Os simulados inspecionados utilizam js/access/premium-content-loader.js e um placeholder premium-content-placeholder. O loader:

- solicita o documento ao endpoint premium-content;
- preserva o método canônico Firebase + Supabase;
- pode entregar demonstração/conteúdo público;
- instala o gate de ações;
- exige validação Premium para ações protegidas conforme política da rota;
- reconhece ações de simulado/quiz/iniciar/calcular/resultado/download/impressão;
- não deve ser substituído por autenticação local;
- não deve usar localStorage/cookie/URL como autoridade de plano.

Conclusão: a reforma do simulador deve ser construída em cima desse mecanismo, não ao lado dele.

### 3.3 SEO atual

Há títulos e descriptions específicos em várias páginas. Exemplos de clusters já presentes no próprio site:

- simulado de enfermagem;
- questões de enfermagem;
- concurso de enfermagem;
- técnico de enfermagem;
- enfermeiro;
- vacinação;
- PCR / suporte básico de vida;
- segurança do paciente;
- doenças de notificação compulsória;
- Lei 8.080/90;
- Lei 8.142/90;
- HumanizaSUS / PNH;
- Código de Ética dos Profissionais de Enfermagem;
- Hospital Amigo da Criança;
- aleitamento materno;
- bloco operatório / CME / SRPA;
- banca IBAM;
- provas por município, cargo e ano.

Esses termos são evidência de conteúdo e intenção já existentes. Não significam volume de busca comprovado.

### 3.4 Quantidade declarada de questões nas páginas

Pelos títulos/metadescriptions atuais:

- simulado-de-enfermagem.html — 50;
- simulado-de-enfermagem2.html — 50;
- simulado-de-enfermagem3.html — 50;
- simulado-de-enfermagem4.html — 50;
- segurança do paciente — 50;
- notificação compulsória — 50;
- vacinação — 30;
- PCR — 30;
- IBAM Bebedouro 2024 — 14;
- IBAM Guarulhos Enfermeiro 2024 — 32;
- IBAM Guarulhos Enfermeiro da Família 2024 — 22;
- IBAM Japaratuba 2014 — 20;
- Lei 8.080/90 — 40;
- Lei 8.142/90 — 20;
- HumanizaSUS — 30;
- Hospital Amigo da Criança — 15;
- Aleitamento Materno — 15;
- Bloco Operatório/CME/SRPA — 30;
- Código de Ética — quantidade não declarada na description inspecionada;
- flashcards_quiz — formato diferente, sem quantidade declarada na description.

Esses números devem ser confirmados contra o conteúdo real antes de serem usados como dado estruturado.

---

## 4. Problemas encontrados

### 4.1 Descoberta fragmentada

O menu funciona como uma lista longa. Ele não oferece:

- busca;
- filtros;
- categorias visíveis;
- separação clara entre Técnico, Enfermeiro, Temático e Prova/Banca;
- indicação de quantidade de questões;
- indicação de duração;
- indicação de progresso;
- indicação de concluído/em andamento;
- recomendação contextual.

Impacto: o usuário precisa conhecer previamente o nome do simulado ou percorrer uma lista extensa.

### 4.2 Divergência entre rotas existentes e rotas expostas

O catálogo técnico possui 20 rotas, enquanto o menu expõe 18 itens. Isso cria risco de:

- páginas órfãs;
- descoberta desigual;
- SEO interno inconsistente;
- manutenção incompleta;
- métricas fragmentadas;
- reforma parcial por engano.

### 4.3 Ausência de um hub de simulados orientado à tarefa

Não foi identificado um hub moderno central com catálogo estruturado, busca e filtros. A navegação atual é centrada no menu, não em uma página de estudo.

### 4.4 Experiência inconsistente entre tipos de simulados

Há simulados gerais de 50 questões, temáticos, provas IBAM com quantidades variadas e flashcards/quiz. Eles representam objetivos diferentes, mas hoje não existe uma taxonomia de produto explícita que explique isso ao usuário.

### 4.5 Progresso e retomada não estão padronizados

Os shells possuem localStorage para preferências globais de acessibilidade, mas isso não comprova uma camada única e padronizada de persistência do progresso de todos os simulados.

Precisamos implementar persistência de tentativa de forma deliberada e separada de qualquer autoridade Premium.

### 4.6 Resultado pouco conectado a um ciclo de estudo

O modelo-alvo deve transformar “responder e ver nota” em:

descobrir → iniciar → responder → receber feedback → revisar erros → entender temas fracos → refazer/continuar → escolher próximo simulado.

### 4.7 Manutenção distribuída

Existem muitas páginas independentes. Alterar experiência, analytics ou acessibilidade página por página aumenta:

- risco de divergência;
- retrabalho;
- bugs;
- dificuldade de QA;
- custo de evolução.

### 4.8 Conteúdo clínico misturado ao problema de interface

A reforma estrutural não deve ser usada como oportunidade para “melhorar” respostas clínicas automaticamente. Interface e conteúdo precisam de trilhas de mudança separadas.

### 4.9 Carregamento protegido pode causar percepção de espera

O shell exibe “Carregando conteúdo protegido…”. A reforma deve medir e reduzir a percepção de atraso sem quebrar o loader canônico.

### 4.10 Falta de taxonomia de eventos específica para estudo

Há analytics globais no projeto, mas o novo produto precisa de eventos próprios para:

- descoberta;
- aplicação de filtro;
- abertura;
- início;
- resposta;
- avanço;
- pausa;
- retomada;
- conclusão;
- revisão;
- refazer;
- próximo simulado.

Ausência de conclusão NÃO deve ser automaticamente registrada como abandono. “Abandono” só pode existir quando houver sinal observável, por exemplo botão explícito “Sair do simulado” ou “Encerrar tentativa”.

---

## 5. O que a comparação externa ensina

### 5.1 PCI Concursos

Evidência observada:

- forte orientação a acervo de provas;
- campo de pesquisa;
- descoberta por cargo;
- foco em localizar e baixar provas.

Lição aplicável:

- o nosso site precisa tornar “encontrar a prova/simulado certo” uma tarefa de primeira classe;
- banca, cargo, ano e instituição devem ser metadados estruturados;
- simulados baseados em prova real devem ser claramente diferenciados dos simulados temáticos.

Não copiar:

- o produto do Calculadoras de Enfermagem deve continuar priorizando resolução interativa e aprendizado, não apenas download.

### 5.2 Gran Questões

Evidência observada:

- filtros por instituição, cargo, banca, ano e estado;
- banco de questões com filtros por disciplina, assunto, banca, instituição, cargo, ano, carreira, formação, escolaridade e dificuldade;
- separação entre questões, provas e simulados;
- simulados mostram quantidade de questões, participantes, avaliações e assuntos;
- possibilidade de realizar online;
- acompanhamento de desempenho por disciplina/assunto;
- comentários/explicações como camada de aprendizagem.

Lição aplicável:

- metadados devem dirigir descoberta e análise;
- o resultado precisa ir além da porcentagem total;
- filtros simples no nosso contexto podem gerar grande ganho sem reproduzir a complexidade do Gran.

### 5.3 EnfermagemOnline

Evidência observada:

- simulados organizados por público: enfermeiros, técnicos e auxiliares;
- simulados temáticos;
- página individual combina questões com conteúdo editorial de apoio;
- recomenda outros simulados/conteúdos relacionados.

Lição aplicável:

- a especialização em enfermagem é vantagem competitiva;
- público profissional e tema devem aparecer na navegação;
- cada simulado pode funcionar também como página de estudo e SEO, não apenas como formulário.

### 5.4 Rômulo Passos

Evidência observada na área de cursos/banco:

- filtros por disciplina, assunto, banca, ano e cargo;
- banco geral para Enfermagem, Enfermeiro, Técnico e Legislação do SUS;
- organização de simulados por temas;
- revisão de erros;
- acompanhamento de desempenho.

Lição aplicável:

- “meus erros” e “meu desempenho” são partes do método de estudo;
- separar Enfermeiro/Técnico e Legislação do SUS facilita intenção;
- o próximo passo deve ser orientado por desempenho.

### 5.5 Referência adicional: Questões RE / Rômulo Enfermagem

Evidência observada:

- questões por banca, ano e cargo;
- gabarito comentado;
- estatísticas/ranking;
- simulado completo com contador;
- interface declaradamente pensada para celular.

Lição aplicável:

- comentário/explicação por questão aumenta valor pedagógico;
- mobile precisa ser o cenário principal de QA;
- cronômetro pode ser um modo opcional, não uma obrigação universal.

---

## 6. Princípios da reforma

1. Uma experiência, muitos conteúdos.
2. Conteúdo das questões separado da interface.
3. Metadados estruturados para cada simulado.
4. Mobile first sem degradar desktop.
5. Retomada segura.
6. Feedback pedagógico progressivo.
7. Resultado acionável.
8. Acessibilidade desde o componente base.
9. Analytics desde o primeiro piloto.
10. Premium reutiliza o sistema canônico.
11. Nenhuma autorização de plano em localStorage.
12. Nenhuma alteração clínica em massa.
13. Migração por lotes pequenos.
14. Cada etapa deve poder ser revertida.
15. A página individual continua indexável e semanticamente útil.
16. O hub melhora descoberta, mas não substitui URLs existentes.
17. URLs atuais devem ser preservadas para SEO e links existentes.

---

## 7. Arquitetura-alvo global

### 7.1 Camadas

A arquitetura deve ser dividida em cinco camadas:

**Camada A — Catálogo**
- metadados dos simulados;
- título;
- slug/rota;
- tipo;
- público;
- tema;
- banca;
- instituição;
- ano;
- quantidade;
- duração estimada;
- tags;
- status;
- fonte/referência quando aplicável.

**Camada B — Motor de simulado**
- renderização de questões;
- seleção de alternativa;
- navegação;
- progresso;
- marcação para revisar;
- persistência;
- finalização;
- resultado;
- revisão.

**Camada C — Conteúdo**
- enunciado;
- alternativas;
- resposta correta;
- comentário/explicação;
- referência;
- assunto;
- subassunto;
- banca/prova quando houver.

**Camada D — Experiência**
- hub;
- filtros;
- cards;
- tela de introdução;
- execução;
- resultado;
- revisão;
- recomendações.

**Camada E — Integrações**
- Premium;
- conta/histórico;
- analytics;
- anúncios conforme plano;
- SEO;
- Search Console.

### 7.2 Hub proposto

Criar futuramente uma rota central de Simulados, preservando as URLs atuais.

Estrutura:

- Hero institucional;
- busca “Qual tema, banca ou prova você quer praticar?”;
- filtros;
- seção “Continuar estudando” quando houver tentativa local/conta;
- categorias;
- catálogo;
- estados vazio/erro/loading;
- links internos para páginas individuais.

Filtros iniciais recomendados:

- Público: Todos / Técnico / Enfermeiro;
- Tipo: Geral / Temático / Prova real / Flashcards;
- Tema;
- Banca;
- Ano;
- Status local: Não iniciado / Em andamento / Concluído.

Não começar com filtros excessivos. O catálogo deve suportar expansão futura.

---

## 8. Taxonomia inicial dos simulados

### Gerais
- simulado-de-enfermagem.html — Técnico, geral, 50;
- simulado-de-enfermagem4.html — Técnico, geral, 50;
- simulado-de-enfermagem2.html — Enfermeiro, geral, 50;
- simulado-de-enfermagem3.html — Enfermeiro, geral, 50.

### Temáticos
- segurança do paciente;
- notificação compulsória;
- vacinação;
- PCR/SBV;
- Lei 8.080/90;
- Lei 8.142/90;
- HumanizaSUS;
- Código de Ética;
- Hospital Amigo da Criança;
- aleitamento materno;
- bloco operatório/CME/SRPA.

### Provas/banca
- IBAM Bebedouro 2024;
- IBAM Guarulhos Enfermeiro 2024;
- IBAM Guarulhos Enfermeiro da Família 2024;
- IBAM Japaratuba 2014.

### Estudo rápido
- flashcards_quiz.html.

Essa taxonomia é inicial e deve ser validada contra o conteúdo real antes da publicação do catálogo definitivo.

---

## 9. Novo fluxo do usuário

### 9.1 Descoberta

Entrada possível por:

- Google;
- menu;
- hub;
- página inicial;
- perfil/histórico;
- recomendação pós-simulado;
- link interno de conteúdo relacionado.

### 9.2 Página de apresentação

Antes de começar, mostrar de forma compacta:

- título;
- público;
- tipo;
- tema/banca;
- número de questões;
- tempo estimado ou “sem limite”;
- regra de feedback;
- estado de progresso;
- CTA principal;
- CTA “continuar” quando houver progresso;
- CTA “reiniciar” somente com confirmação.

### 9.3 Durante o simulado

Layout:

- cabeçalho compacto com título;
- Questão X de Y;
- barra de progresso;
- cronômetro opcional quando o simulado suportar;
- enunciado;
- alternativas grandes e acessíveis;
- “Anterior” e “Próxima”;
- “Marcar para revisar”;
- navegação por questões em painel recolhível;
- estado respondida/não respondida/marcada;
- salvamento automático.

### 9.4 Feedback

Dois modos possíveis:

**Modo estudo**
- feedback após responder;
- correta/incorreta;
- comentário;
- referência;
- botão próxima.

**Modo prova**
- não revela resposta imediatamente;
- resultado e revisão somente ao finalizar.

Cada simulado deve declarar o modo padrão nos metadados. Não misturar comportamento de forma imprevisível.

### 9.5 Finalização

Antes de finalizar:

- mostrar respondidas;
- não respondidas;
- marcadas para revisão;
- confirmação explícita.

### 9.6 Resultado

Mostrar:

- acertos;
- erros;
- não respondidas;
- percentual;
- tempo quando aplicável;
- desempenho por assunto quando os metadados permitirem;
- lista de questões erradas;
- lista de questões marcadas;
- CTA “Revisar erros”;
- CTA “Refazer”;
- CTA “Próximo simulado recomendado”.

Evitar rótulos clínicos ou pedagógicos inventados como “excelente domínio” sem critério definido.

### 9.7 Retomada

Ao voltar:

- detectar tentativa incompleta;
- oferecer “Continuar de onde parei”;
- informar progresso;
- permitir reiniciar com confirmação;
- não apagar progresso silenciosamente.

---

## 10. Modelo pedagógico

### 10.1 Estrutura mínima de cada questão

Cada questão deve poder conter:

- id estável;
- enunciado;
- alternativas;
- alternativa correta;
- comentário/explicação;
- referência/fonte;
- assunto;
- subassunto;
- nível profissional;
- banca/prova/ano quando aplicável;
- status de revisão editorial;
- data de revisão quando aplicável.

Nem todos esses campos precisam ser exibidos, mas o modelo deve suportá-los.

### 10.2 Comentário de resposta

Prioridade alta. O usuário precisa entender por que errou.

Regra:

- preservar comentários existentes;
- quando não houver comentário, mostrar apenas gabarito até que revisão editorial produza explicação validada;
- não gerar automaticamente explicação clínica e publicar sem revisão.

### 10.3 Revisão de erros

A revisão deve:

- abrir apenas questões erradas;
- manter resposta original visível;
- mostrar correta;
- mostrar comentário/referência;
- permitir “entendi”/“rever depois” apenas se houver uso claro para esse estado;
- recomendar simulado relacionado por assunto.

### 10.4 Repetição

Não criar algoritmo adaptativo complexo no P0. Primeiro medir.

P1/P2 pode incluir:

- refazer somente erros;
- montar sessão com questões marcadas;
- sessão por assunto fraco;
- questões aleatórias, desde que o banco esteja estruturado e validado.

---

## 11. Persistência e prevenção de perda de progresso

### 11.1 Visitante

Pode usar armazenamento local somente para dados de tentativa, nunca para plano/Premium.

Chave deve ser versionada e namespaced, por exemplo conceitualmente:

ce_simulator_attempt_v1:{simulatorId}

Persistir:

- id do simulado;
- versão do conteúdo;
- respostas;
- questão atual;
- marcadas;
- início;
- atualização;
- modo;
- tempo decorrido quando necessário.

### 11.2 Usuário autenticado

Fase posterior pode sincronizar progresso/histórico com a infraestrutura de conta existente, sem criar uma segunda autenticação.

Antes de criar nova tabela/end-point, auditar account_history/account-data e verificar se o modelo atual suporta o caso.

### 11.3 Mudança de versão do simulado

Se o conteúdo mudar:

- não aplicar tentativa antiga cegamente;
- comparar contentVersion;
- oferecer reinício quando incompatível;
- preservar resultado histórico quando possível.

---

## 12. Premium, login e anúncios

Regra absoluta:

- Firebase autentica;
- Supabase decide entitlement;
- premium-content e guards existentes protegem ações;
- URL/cookie/localStorage nunca concedem Premium;
- não duplicar payment router;
- não duplicar billing-access;
- não criar “isPremium” local como autoridade.

A nova experiência deve usar os mesmos gates.

Antes de qualquer alteração real de acesso:

1. consultar CATALOGO_CANONICO_SISTEMA_DE_CONTAS.md;
2. consultar INVENTARIO_ROTAS_VIGENTES.md;
3. consultar PROTOCOLO_DECISOES_DO_DESENVOLVEDOR.md;
4. consultar política dinâmica vigente da rota;
5. preservar decisão posterior do painel do desenvolvedor.

A reforma visual não deve mudar automaticamente uma página de Free para Premium nem o inverso.

---

## 13. UX/UI responsiva

### Desktop

- largura útil da página conforme padrão canônico;
- hero compacto;
- área principal de questão confortável;
- painel de navegação lateral ou recolhível sem virar sidebar editorial antiga;
- ações persistentes sem cobrir conteúdo.

### Mobile

Prioridade máxima:

- alternativa com alvo de toque amplo;
- sem rolagem horizontal;
- barra de progresso visível;
- ações Anterior/Próxima próximas ao polegar;
- painel de questões em drawer/modal acessível;
- texto sem redução excessiva;
- nenhuma informação essencial dependente de hover;
- confirmação de saída/reinício.

### Estados obrigatórios

- loading;
- conteúdo carregado;
- erro de carregamento;
- sem dados;
- tentativa nova;
- tentativa em andamento;
- tentativa concluída;
- acesso à ação requer Premium;
- falha temporária de verificação;
- resultado;
- revisão.

---

## 14. Acessibilidade

Objetivo: WCAG 2.2 AA como referência de implementação.

Checklist:

- fieldset/legend ou estrutura semântica equivalente para alternativas;
- labels associadas;
- foco visível;
- ordem de tabulação lógica;
- aria-live apenas para mudanças que realmente precisam ser anunciadas;
- não depender somente de cor;
- contraste adequado;
- suporte a teclado;
- skip links quando necessário;
- modal/drawer com foco preso e retorno ao elemento acionador;
- prefers-reduced-motion;
- mensagens de erro programaticamente associadas;
- progresso com texto “Questão X de Y”, não apenas barra visual;
- resultados legíveis por leitor de tela.

---

## 15. SEO e conteúdo

### 15.1 Hub

Intenção principal:

- simulados de enfermagem;
- questões de enfermagem para concurso;
- simulado para técnico de enfermagem;
- simulado para enfermeiro.

O hub deve ter texto editorial útil e não ser apenas uma grade de links.

### 15.2 Categorias

Clusters sustentados pelo conteúdo atual:

- Técnico de Enfermagem;
- Enfermeiro;
- SUS e legislação;
- Urgência e emergência;
- Segurança do paciente;
- Vacinação;
- Ética profissional;
- Saúde materno-infantil;
- Centro cirúrgico/CME;
- Provas por banca;
- IBAM.

### 15.3 Página individual

Manter:

- URL atual;
- title específico;
- description específica;
- canonical;
- breadcrumbs;
- conteúdo introdutório original quando correto;
- referências;
- links relacionados.

Adicionar quando aplicável:

- dados estruturados coerentes;
- resumo do simulado;
- metadados de banca/ano/cargo;
- conteúdo editorial relacionado;
- FAQ somente se houver perguntas úteis reais.

Não criar páginas de categoria vazias apenas para SEO.

---

## 16. Analytics — taxonomia proposta

### Descoberta
- simulator_hub_view
- simulator_search
- simulator_filter_apply
- simulator_card_click
- simulator_page_view

### Início
- simulator_start_click
- simulator_start
- simulator_resume
- simulator_restart_confirm

### Progresso
- simulator_question_answer
- simulator_question_next
- simulator_question_previous
- simulator_question_mark_review
- simulator_progress_checkpoint

Evitar enviar texto integral da questão, resposta livre ou PII.

### Saída observável
- simulator_exit_click
- simulator_exit_confirm
- simulator_attempt_pause

Não criar “abandon” por timeout ou ausência de conclusão.

### Conclusão
- simulator_finish_click
- simulator_complete
- simulator_result_view

### Revisão
- simulator_review_start
- simulator_review_question
- simulator_review_complete
- simulator_retry_errors
- simulator_retry_all

### Próximo passo
- simulator_recommendation_view
- simulator_recommendation_click

### Parâmetros úteis

- simulator_id;
- simulator_type;
- audience;
- topic;
- board;
- year;
- question_count;
- mode;
- progress_bucket;
- score_bucket, se necessário e sem granularidade indevida.

Não enviar e-mail, nome, UID, enunciado completo ou informação pessoal ao GA4.

---

## 17. KPIs

### Descoberta
- visualizações do hub;
- uso de busca/filtros;
- CTR de card para página;
- páginas de entrada orgânica.

### Ativação
- page_view → start;
- start por tipo/público;
- tempo até primeira resposta.

### Engajamento
- checkpoints 25/50/75%;
- retomadas;
- questões respondidas por tentativa;
- uso de marcar para revisão.

### Conclusão
- start → complete;
- conclusão por quantidade de questões;
- conclusão por dispositivo;
- conclusão por tipo.

### Aprendizado/retorno
- review_start / complete;
- retry_errors;
- clique em próximo simulado;
- retorno em 7/30 dias, quando a instrumentação permitir sem PII indevida.

### SEO
- impressões;
- cliques;
- CTR;
- posição;
- páginas de entrada;
- consultas por cluster.

---

## 18. Arquitetura técnica recomendada

### 18.1 Não editar 20 experiências independentes

Criar uma camada compartilhada.

Direção proposta, sujeita à auditoria de componentes existentes antes da criação:

- js/simulados/ — motor compartilhado;
- dados/metadados estruturados em arquivo único ou fonte existente apropriada;
- CSS compartilhado específico ou classes do design system;
- páginas atuais passam a fornecer configuração/conteúdo, não lógica duplicada.

Antes de criar qualquer novo componente, cumprir a regra do projeto:

1. pesquisar componentes existentes;
2. pesquisar scripts reutilizáveis;
3. verificar duplicação;
4. registrar necessidade;
5. testar;
6. catalogar se a governança exigir.

### 18.2 Modelo conceitual

Simulator:
- id
- slug
- title
- audience
- type
- topics[]
- board
- institution
- year
- questionCount
- estimatedMinutes
- mode
- contentVersion
- questions[]

Question:
- id
- prompt
- options[]
- correctOption
- explanation
- references[]
- topics[]
- source

Attempt:
- simulatorId
- contentVersion
- answers
- marked
- currentIndex
- startedAt
- updatedAt
- completedAt
- elapsedSeconds

### 18.3 Compatibilidade com premium-content

O motor deve funcionar no documento final entregue pelo loader, sem criar um segundo carregador de Premium.

A ação “Iniciar simulado” deve continuar sendo reconhecida/protegida pelo mecanismo canônico quando a rota exigir Premium.

---

## 19. Matriz de migração

| Rota | Grupo inicial | Quantidade declarada | Tratamento |
|---|---|---:|---|
| simulado-de-enfermagem.html | Geral / Técnico | 50 | piloto após motor base |
| simulado-de-enfermagem4.html | Geral / Técnico | 50 | migrar após piloto; revisar descoberta |
| simulado-de-enfermagem2.html | Geral / Enfermeiro | 50 | lote geral |
| simulado-de-enfermagem3.html | Geral / Enfermeiro | 50 | lote geral |
| simulado-de-enfermagem-nucleo-de-seguranca-do-paciente.html | Temático | 50 | lote temático |
| simulado-de-enfermagem-doencas-de-notificacao-compulsoria.html | Temático | 50 | lote temático |
| simulado_vacinacao.html | Temático | 30 | lote temático |
| simulado_pcr.html | Temático | 30 | lote temático |
| simulado_lei_organica_do_sus_8080-90.html | SUS/legislação | 40 | lote SUS |
| simulado_participacao_da_comunidade.html | SUS/legislação | 20 | lote SUS |
| simulado_humaniza_sus.html | SUS/legislação | 30 | lote SUS |
| simulado_codigo_de_etica_enfermagem.html | Ética | confirmar | lote temático |
| simulado_hospital_amigo_da_crianca.html | Materno-infantil | 15 | lote temático |
| simulado_aleitamento_materno.html | Materno-infantil | 15 | lote temático |
| simulado_bloco-operatorio.html | Centro cirúrgico | 30 | lote temático; revisar descoberta |
| simulado_ibam_bebedouro_enfermeiro_2024.html | Prova/IBAM | 14 | lote provas |
| simulado_ibam_guarulhos_enfermeiro_2024.html | Prova/IBAM | 32 | lote provas |
| simulado_ibam_guarulhos_enfermeiro_esf_2024.html | Prova/IBAM | 22 | lote provas |
| simulado_ibam_japaratuba_sergipe_enfermeiro_2014.html | Prova/IBAM | 20 | lote provas |
| flashcards_quiz.html | Estudo rápido | n/a | adaptar padrão sem destruir mecânica própria |

---

## 20. Roadmap P0 / P1 / P2

### P0 — Fundação e piloto

Objetivo: provar a arquitetura sem migrar tudo.

Entregas:

1. inventário final das 20 rotas;
2. auditoria do conteúdo real de um simulador piloto;
3. auditoria de scripts/componentes existentes;
4. definição do schema de metadados;
5. definição do schema de tentativa;
6. motor compartilhado mínimo;
7. UI base;
8. persistência local de tentativa;
9. eventos GA4;
10. migração de uma página piloto;
11. QA mobile/desktop/teclado;
12. comparação antes/depois;
13. rollback pronto.

### P1 — Escala

1. migrar simulados gerais;
2. migrar temáticos;
3. migrar SUS/legislação;
4. migrar provas IBAM;
5. adaptar flashcards;
6. criar hub;
7. busca/filtros;
8. resultado por assunto;
9. revisão de erros;
10. recomendações;
11. integração com histórico existente se tecnicamente adequada.

### P2 — Otimização

1. sessões de “refazer erros”;
2. sessões por tema fraco;
3. modo prova/estudo configurável;
4. cronômetro opcional;
5. personalização;
6. novos bancos de questões estruturados;
7. testes A/B somente quando houver volume e hipótese clara;
8. expansão internacional somente após estabilizar o modelo PT-BR.

---

## 21. Plano de 90 dias

### Dias 1–15 — Fundação
- congelar inventário;
- escolher piloto;
- mapear conteúdo real;
- mapear dependências Premium;
- definir contratos de dados;
- implementar motor mínimo;
- instrumentar analytics;
- testes.

### Dias 16–30 — Piloto em produção
- publicar um simulador;
- medir loading/start/progresso/conclusão;
- corrigir acessibilidade;
- corrigir mobile;
- validar persistência;
- validar Premium;
- validar SEO.

### Dias 31–50 — Gerais + temáticos
- migrar grupos pequenos;
- QA por lote;
- revisar metadados;
- preservar URLs;
- medir regressões.

### Dias 51–65 — Hub e descoberta
- criar hub;
- busca;
- filtros;
- cards;
- continuar estudando;
- links internos;
- Search Console.

### Dias 66–80 — Resultado e revisão
- desempenho por assunto;
- revisão de erros;
- refazer erros;
- recomendações.

### Dias 81–90 — Consolidação
- migrar remanescentes;
- eliminar lógica duplicada somente depois de comprovar equivalência;
- documentação;
- auditoria final;
- baseline de métricas;
- backlog P2.

---

## 22. Sequência recomendada de PRs

### PR 0 — documentação
- criar esta pasta/manual;
- nenhuma mudança funcional.

### PR 1 — inventário e contratos
- arquivo de metadados dos simulados;
- sem alterar conteúdo clínico;
- testes de schema;
- conferir 20 rotas.

### PR 2 — motor compartilhado mínimo
- renderização;
- navegação;
- progresso;
- persistência;
- sem migrar todos.

### PR 3 — piloto
- migrar somente simulado-de-enfermagem.html;
- preservar URL/SEO/conteúdo;
- GA4;
- Premium;
- rollback simples.

### PR 4 — correções do piloto
- somente problemas comprovados.

### PR 5 — simulados gerais
- páginas 2, 3 e 4;
- verificar a página 4 que não está no menu atual.

### PR 6 — SUS/legislação
- Lei 8.080;
- Lei 8.142;
- HumanizaSUS;
- Código de Ética quando taxonomia for confirmada.

### PR 7 — temáticos clínicos
- segurança do paciente;
- notificação compulsória;
- vacinação;
- PCR;
- IHAC;
- aleitamento;
- bloco operatório.

### PR 8 — provas IBAM
- quatro provas;
- metadados banca/instituição/ano/cargo.

### PR 9 — flashcards
- adaptar sem transformar flashcards em prova tradicional.

### PR 10 — hub
- nova página;
- catálogo;
- filtros;
- busca;
- continuar estudando.

Observação de governança: nova página exige registro em relatorio_paginas.txt e decisão do desenvolvedor sobre inclusão no menu. menu-global.html é arquivo protegido por regra do projeto e só deve ser alterado com autorização explícita.

### PR 11 — resultado/revisão avançados
- análise por assunto;
- revisar erros;
- refazer erros;
- recomendações.

### PR 12 — consolidação
- remover duplicação comprovadamente obsoleta;
- documentação;
- testes de regressão;
- auditoria.

---

## 23. Critérios de aceite por PR funcional

Todo PR de simulador deve comprovar:

- URL preservada;
- title/description/canonical preservados ou melhorados conscientemente;
- conteúdo das questões preservado;
- gabarito preservado;
- referências preservadas;
- Premium preservado;
- login preservado;
- anúncios preservados conforme plano;
- sem rolagem horizontal;
- teclado funcional;
- leitor de tela com estrutura coerente;
- progresso correto;
- persistência correta;
- reinício com confirmação;
- resultado matematicamente correto;
- nenhum evento GA4 com PII;
- loading/erro/vazio testados;
- mobile testado;
- desktop testado;
- build obrigatório executado quando houver HTML/CSS/JS;
- scripts de auditoria aplicáveis executados;
- rollback documentado.

---

## 24. Estratégia de QA

### Funcional
- iniciar;
- responder;
- mudar resposta;
- anterior/próxima;
- marcar;
- finalizar;
- revisar;
- refazer;
- retomar após reload;
- retomar após fechar/abrir.

### Premium
- visitante;
- Free confirmado;
- Premium confirmado;
- token expirado;
- falha temporária;
- retorno da assinatura.

### Acessibilidade
- somente teclado;
- zoom 200%;
- fonte ampliada do site;
- modo escuro se suportado;
- reduced motion;
- leitor de tela;
- contraste.

### Responsividade
- 320px;
- 360/390px;
- tablet;
- notebook;
- desktop amplo.

### Dados
- nenhuma resposta perdida;
- contentVersion;
- resultado idempotente;
- tentativa concluída não volta a “em andamento” por erro.

### SEO
- conteúdo indexável apropriado;
- canonical;
- structured data válido;
- headings;
- links internos;
- sem duplicação de title.

---

## 25. Riscos e mitigação

### Risco: quebrar Premium
Mitigação: não tocar no método de autorização; reutilizar loader/guards; testar estados.

### Risco: alterar gabarito
Mitigação: migrar dados por transformação determinística; comparar questão por questão; hash/contagem quando possível.

### Risco: perda de SEO
Mitigação: manter URLs; preservar metadados; não trocar todas as páginas por SPA única.

### Risco: progresso incompatível após atualização
Mitigação: contentVersion.

### Risco: duplicação de motor antigo/novo
Mitigação: piloto e migração por lotes; remover legado só no final.

### Risco: analytics excessivo
Mitigação: eventos de alto valor, sem texto de questão/PII.

### Risco: “gamificação” prejudicar estudo
Mitigação: priorizar clareza e revisão; ranking não é P0.

### Risco: conteúdo desatualizado
Mitigação: separar revisão editorial da reforma técnica e criar status/data de revisão.

---

## 26. Definição objetiva de “pronto”

A reforma global só será considerada pronta quando:

1. todas as 20 rotas do catálogo tiverem destino definido;
2. todas as páginas de simulado ativas utilizarem o padrão compartilhado ou tiverem exceção documentada;
3. o hub permitir descobrir por público/tipo/tema e, quando aplicável, banca/ano;
4. o usuário puder iniciar, pausar, retomar e concluir sem perda de progresso;
5. resultado e revisão de erros funcionarem;
6. mobile e teclado passarem QA;
7. Premium continuar canônico;
8. nenhum gabarito/conteúdo clínico tiver sido alterado sem validação;
9. analytics medir o funil sem inferir abandono por ausência;
10. Search Console/SEO não apresentar regressão estrutural relevante;
11. documentação e testes estiverem atualizados;
12. não houver páginas órfãs por acidente;
13. a lógica compartilhada reduzir efetivamente duplicação;
14. cada lote tiver rollback identificável.

---

## 27. Primeira etapa prática aprovada por este plano

A primeira implementação NÃO deve começar alterando 20 páginas.

Ordem:

1. confirmar inventário;
2. auditar componentes existentes;
3. auditar o conteúdo real de simulado-de-enfermagem.html;
4. definir metadados e contrato de tentativa;
5. criar motor compartilhado mínimo somente se não houver componente equivalente;
6. migrar um piloto;
7. validar;
8. só então escalar.

O piloto recomendado é simulado-de-enfermagem.html porque:

- é rota principal de Técnico;
- tem 50 questões declaradas;
- aparece no menu;
- possui SEO consolidado;
- representa o caso de simulado longo;
- é suficiente para testar progresso, retomada e resultado.

---

## 28. Itens que exigem confirmação antes de alteração

Pelas regras do repositório, parar e pedir autorização explícita antes de:

- alterar menu-global.html;
- alterar catálogos protegidos;
- alterar scripts de autenticação;
- alterar premium-content-loader.js;
- alterar deploy/service worker quando não for consequência obrigatória do build;
- mudar política Free/Premium;
- criar novo fluxo de pagamento;
- modificar regras canônicas.

A autorização geral para “reformular simulados” não deve ser interpretada como autorização para mudar plano comercial ou autenticação.

---

## 29. Fontes externas consultadas na pesquisa

Consulta em 04/10/2026:

- PCI Concursos — Provas para Download: https://www.pciconcursos.com.br/provas/
- Gran Questões — Concursos de Enfermagem: https://questoes.grancursosonline.com.br/concursos/enfermagem
- Gran Questões — Banco de Questões: https://questoes.grancursosonline.com.br/questoes
- Gran Questões — páginas de simulados e tutoriais de desempenho.
- EnfermagemOnline — Simulados de Enfermagem: https://enfermagemonline.com/simulados-de-enfermagem/
- EnfermagemOnline — exemplo Fundamentos de Enfermagem: https://enfermagemonline.com/simulado-de-fundamentos-de-enfermagem/
- Site Rômulo Passos — Curso Completo/Banco de Questões e “Como funciona”: https://www.romulopassos.com.br/
- Questões RE / Rômulo Enfermagem — referência adicional: https://questoes.romuloenfermagem.com.br/

Estas fontes documentam padrões observados. Nenhum conteúdo de terceiros deve ser copiado para o banco de questões do projeto sem verificação de direitos, origem e autorização.

---

## 30. Registro de decisões durante a execução

A partir do próximo PR, toda etapa deve acrescentar ao final deste manual ou a um log específico da pasta:

- data;
- etapa;
- arquivos alterados;
- decisão;
- motivo;
- evidência;
- testes;
- riscos;
- rollback;
- pendências.

### Registro 04/10/2026 — criação do plano

- Criada a pasta PLANO_ACAO_MELHORIA_SIMULADOS.
- Consolidada a pesquisa comparativa.
- Confirmadas 20 rotas no catálogo administrativo.
- Confirmadas 18 entradas no menu atual.
- Definido que a reforma será incremental.
- Definido que o conteúdo clínico não será reescrito em massa.
- Definido que o sistema canônico de Premium será preservado.
- Próxima ação: PR de inventário/contratos e auditoria do piloto antes de modificar todos os simulados.
