# Plano de ação — riscos clínicos, reputacionais e de governança

**Status:** em implantação — Onda 0 autorizada

**Data:** 13 de setembro de 2026

**Escopo:** controles remanescentes identificados na auditoria recebida pelo projeto. As páginas de Termos de Uso e Política de Privacidade ficam fora deste plano, pois sua correção foi informada como já concluída.
**Limite:** este documento é um plano operacional de redução de riscos; não constitui parecer jurídico, clínico ou de enquadramento regulatório.

## 1. Objetivo e princípio de priorização

Reduzir a probabilidade e o impacto de resultados clínicos incorretos, alegações excessivas, inconsistências entre idiomas, uso indevido de propriedade intelectual e incidentes de reputação. A prioridade é dada a ferramentas que transformam entradas clínicas em cálculo, classificação ou interpretação.

Nenhuma calculadora deve ser apresentada como substituta de prescrição, protocolo institucional, julgamento clínico, conferência independente ou orientação de profissional habilitado. Uma revisão humana qualificada e evidência verificável são condições de publicação, não apenas avisos exibidos ao usuário.

## 2. Estrutura de decisão

### Papéis mínimos

| Papel | Responsabilidade | Não pode aprovar sozinho |
|---|---|---|
| Responsável pelo produto | Prioriza riscos, mantém o registro e decide sobre indisponibilização preventiva. | A própria revisão clínica da mudança. |
| Revisor clínico habilitado e em atividade — Enfermeiro Cauê S. M. Zipfel, especialista em UTI e com mais de 15 anos de atuação em enfermagem | Confere finalidade, fórmula, unidades, limites, referências e texto assistivo. | A própria implementação sem revisão técnica independente. |
| Revisor técnico independente — Leivis de Lima Melo, contador especialista em auditoria | Confere evidências de mudança, testes, versões, acessibilidade, equivalência entre idiomas e aderência ao plano, usando procedimentos de auditoria aplicáveis. | A evidência clínica sem revisor clínico. |
| Responsável por privacidade/jurídico | Revisa claims, fornecedores, propriedade intelectual e decisões de escalonamento. | A validação matemática e clínica. |
| Gestor de incidente | Coordena triagem, comunicação, correção, registro de impacto e lições aprendidas. | Encerrar incidente crítico sem a aprovação dos responsáveis aplicáveis. |

Para mudanças de risco R2, R3 ou R4, a publicação exige aprovação registrada de pelo menos um revisor clínico e um revisor técnico que não sejam a pessoa autora da alteração.

### Taxonomia de risco

| Classe | Definição | Exemplos | Regra de publicação |
|---|---|---|---|
| R1 | Educacional, sem resultado assistencial individual. | Texto explicativo, glossário. | Revisão editorial e referências quando aplicável. |
| R2 | Cálculo assistencial que depende de unidades/dados fornecidos. | Medicamentos, insulina, gotejamento. | Casos de teste, revisão clínica e técnica, versionamento e limites visíveis. |
| R3 | Classificação ou interpretação clínica. | Gasometria, APACHE II, Braden. | Todos os controles R2, análise de finalidade pretendida e linguagem não determinística. |
| R4 | Pode influenciar decisão crítica, urgência ou terapia. | Qualquer fluxo que recomende conduta individual ou dose. | Não publicar nem ampliar a funcionalidade sem avaliação clínica, jurídica e regulatória formal. |

## 3. Cronograma por ondas

### Onda 0 — contenção e inventário (dias 0–7)

1. Criar um **Registro de Risco Clínico** para todas as calculadoras e escalas, começando por medicamentos, insulina, gotejamento, gasometria, APACHE II e Braden.
2. Para cada item, registrar: ID estável, URL principal e traduções, classe R1–R4, finalidade pretendida, população-alvo, entradas, saídas, fórmula/algoritmo, unidades, limitações, referências, proprietário, revisor, data da última/próxima revisão e estado de publicação.
3. Aplicar revisão de conteúdo de alta prioridade às frases que possam prometer exatidão, segurança, obrigatoriedade, diagnóstico, recomendação terapêutica ou substituição do profissional.
4. Colocar em manutenção preventiva qualquer ferramenta cuja fórmula, referência ou limite não possa ser demonstrado imediatamente. A indisponibilização temporária é preferível à exposição com evidência incompleta.
5. Definir um canal público de relato de correção/segurança e uma fila interna com número de protocolo, sem solicitar dados de pacientes.

**Saídas exigidas:** inventário completo, fila de pendências priorizada e decisão documentada de manter, restringir ou retirar cada R3/R4.

### Onda 1 — segurança clínica e testes (dias 8–30)

1. Criar uma especificação por ferramenta R2–R4: fórmula, fonte, unidade aceita, faixa válida, arredondamento, comportamento para entradas inválidas e resultado esperado.
2. Implementar uma suíte permanente de testes determinísticos para cada cálculo, com casos típicos, limites, valores inválidos, conversões e regressões de incidentes. Cada caso deve apontar à especificação e à referência usada na revisão.
3. Para insulina, tornar a concentração explícita na entrada e no resultado; não pressupor U-100. Exigir confirmação da concentração aplicável e bloquear o cálculo quando ela não estiver definida.
4. Para medicamentos e gotejamento, exibir unidades de entrada e saída, validar valores impossíveis/ambíguos e manter alertas como apoio à conferência — nunca como validação da prescrição.
5. Para gasometria, APACHE II e Braden, substituir rótulos conclusivos por linguagem de resultado calculado/classificação conforme parâmetros informados; manter o limite de que interpretação e conduta dependem do contexto e do profissional.
6. Associar cada publicação a uma versão semântica, data, resumo da mudança, resultado dos testes, revisor clínico e revisor técnico.

**Gate de aceite:** 100% das ferramentas R2–R4 têm especificação, testes aprovados, revisão independente e registro de versão antes de nova publicação.

### Onda 2 — finalidade, linguagem e paridade internacional (dias 31–60)

1. Realizar uma avaliação formal de **finalidade pretendida** para cada R3/R4, com participação clínica, jurídica e regulatória. O resultado deve declarar se a ferramenta é educacional, de apoio matemático ou possui potencial de enquadramento regulatório que demande avaliação externa especializada.
2. Criar um glossário de linguagem permitida e restrita. Termos como “diagnóstico”, “seguro”, “exato”, “definitivo”, “obrigatório” e “recomendação” exigem fundamento, aprovação e contexto explícito.
3. Centralizar fórmulas, dados de configuração ou testes compartilhados, quando tecnicamente viável, para reduzir divergência entre as versões de idioma. Enquanto houver cópias, executar teste de paridade da lógica e das mensagens de segurança em todas as traduções antes do deploy.
4. Auditar páginas e materiais de terceiros quanto a autoria, licença, autorização, citação e origem de imagens. Criar um inventário de propriedade intelectual com responsável e evidência de uso.
5. Revisar declarações públicas de acessibilidade e remover ou qualificar afirmações absolutas que não tenham evidência de teste e certificação independente correspondente.

**Gate de aceite:** nenhuma ferramenta R3/R4 permanece publicada sem decisão de finalidade documentada; toda alteração de cálculo é verificada nas versões de idioma publicadas.

### Onda 3 — operação, incidentes e monitoramento (dias 61–90)

1. Publicar o procedimento de controle de mudanças: proposta → classificação de risco → especificação → implementação → testes → revisão clínica/técnica → aprovação → publicação → monitoramento.
2. Publicar o procedimento de incidente clínico/reputacional com severidades, prazos, critérios de retirada, preservação de evidências, comunicação e análise de causa raiz.
3. Treinar autores e revisores sobre uso de fontes, claims clínicos, privacidade, direitos autorais e relato de incidentes.
4. Estabelecer indicadores mensais e uma revisão trimestral de riscos, incluindo pendências, incidentes, páginas sem revisão vigente, falhas de teste e divergências entre idiomas.
5. Executar auditoria independente de amostra e registrar contraprova antes de declarar maturidade operacional.

**Gate de aceite:** processo de mudança e incidente testados em exercício simulado; indicadores publicados internamente e primeira contraprova concluída.

## 4. Controles operacionais obrigatórios

### 4.1 Controle de mudanças clínicas

Uma alteração em fórmula, unidade, referência, texto de segurança, critério de classificação ou tradução equivalente deve abrir um registro de mudança. O registro contém motivação, impacto, arquivos/idiomas afetados, testes executados, aprovações, versão anterior/nova e plano de reversão.

Não é permitido corrigir diretamente produção sem registrar a exceção. Em incidente crítico, a correção emergencial pode vir antes da revisão completa apenas para interromper o risco; a revisão, os testes e a análise de causa devem ocorrer em seguida e ficar documentados.

### 4.2 Gestão de incidentes

| Severidade | Exemplo | Ação inicial | Meta de resposta |
|---|---|---|---|
| S1 — crítica | Possível resultado perigoso, dose/unidade incorreta ou exposição pública grave. | Retirar ou bloquear a ferramenta, preservar evidências e escalar aos responsáveis. | Imediata; triagem no mesmo dia. |
| S2 — alta | Erro que pode induzir interpretação inadequada sem evidência de dano. | Aviso preventivo ou limitação, correção priorizada e revisão clínica. | Até 1 dia útil. |
| S3 — moderada | Inconsistência de tradução, referência ou UX que não altera o cálculo. | Registrar, corrigir na próxima janela e testar paridade. | Até 5 dias úteis. |
| S4 — baixa | Melhoria editorial sem impacto assistencial. | Registrar e planejar. | Conforme backlog. |

O relatório de encerramento deve registrar: evento, versões afetadas, usuários potencialmente impactados sem coletar dados desnecessários, decisão de comunicação, correção, testes de regressão, causa raiz e ação preventiva.

### 4.3 Privacidade e reputação

Como Termos e Política foram revisados separadamente, este plano exige apenas a verificação de aderência entre o que foi declarado e a operação real: cookies, tags, fornecedores, retenção, transferências internacionais, canal de atendimento e mecanismos de preferência. Mudanças em tratamento de dados, texto jurídico ou consentimento devem passar por revisão jurídica/privacidade antes da publicação.

### 4.4 Evidência e propriedade intelectual

Para cada calculadora, escala, imagem ou material de terceiro, manter referência verificável à fonte, autoria, licença/permissão quando necessária, data de consulta e responsável pela conferência. A referência bibliográfica sustenta a origem científica, mas não substitui autorização de uso quando a obra exigir licença.

## 5. Indicadores de acompanhamento

| Indicador | Meta inicial | Frequência | Evidência |
|---|---|---|---|
| R2–R4 inventariadas e classificadas | 100% | Semanal até conclusão; mensal depois | Registro de Risco Clínico. |
| R2–R4 com testes e dupla revisão | 100% antes de publicar mudanças | Por release | Log de CI e registro de revisão. |
| Paridade de cálculo entre idiomas | 100% dos casos de teste | Por release | Relatório de comparação. |
| Páginas com revisão dentro da validade definida | 100% | Mensal | Calendário e registros de revisão. |
| Incidentes S1/S2 sem análise de causa no prazo | 0 | Mensal | Registro de incidentes. |
| Ativos de terceiros com proveniência comprovada | 100% dos inventariados | Mensal | Inventário de propriedade intelectual. |
| Claims absolutos sem evidência | 0 | Mensal | Checklist editorial/auditoria de conteúdo. |

## 6. Mapeamento COSO e COBIT 2019

| Necessidade do plano | COSO | COBIT 2019 | Evidência de funcionamento |
|---|---|---|---|
| Papéis, independência e aprovação | Ambiente de controle | EDM01, APO01 | Matriz RACI, aprovações e conflitos segregados. |
| Registro, classificação e revisão de riscos | Avaliação de riscos | APO12 | Registro de risco atualizado e decisões de tratamento. |
| Testes, dupla revisão e bloqueios de publicação | Atividades de controle | BAI03, BAI06, DSS06 | Resultados de testes, revisão e versão publicável. |
| Avisos claros, changelog e canal de relato | Informação e comunicação | APO08, DSS02 | Páginas, tickets e comunicações rastreáveis. |
| Auditoria de amostras e indicadores | Monitoramento | MEA01, MEA03 | Relatórios, achados e planos corretivos. |
| Incidentes e continuidade | Avaliação de riscos / monitoramento | DSS02, DSS04 | Simulados, tempos de resposta e pós-incidente. |

## 7. Ordem prática de execução

1. Nomear responsáveis e aprovar a taxonomia R1–R4.
2. Inventariar e classificar as ferramentas de maior risco.
3. Suspender preventivamente o que não puder comprovar fórmula, unidade, limite ou revisão.
4. Escrever especificações e casos de teste antes de alterar a lógica existente.
5. Corrigir linguagem, unidades e validações; depois executar revisão clínica e técnica independente.
6. Estender a validação a todas as traduções e registrar a versão.
7. Formalizar incidentes, indicadores, auditoria e revisão periódica.

## 8. Critério de conclusão em 90 dias

O programa poderá ser considerado implantado quando os itens R2–R4 estiverem inventariados; cada mudança tiver rastreabilidade, testes e dupla revisão; a finalidade pretendida de R3/R4 estiver documentada; incidentes tiverem fluxo testado; e houver contraprova independente registrada. Isso demonstra controle operacional, mas não substitui aconselhamento jurídico, avaliação regulatória especializada nem a responsabilidade clínica profissional.
