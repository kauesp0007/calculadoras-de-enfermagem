# Regras canônicas de governança clínica

**Vigência:** 13 de setembro de 2026

**Escopo:** toda alteração que afete cálculo assistencial, escala, classificação, interpretação clínica, texto de segurança, unidade, referência clínica, tradução equivalente ou fluxo de publicação relacionado.

## 1. Autoridades e segregação de funções

- **Revisor clínico habilitado:** Enfermeiro Cauê S. M. Zipfel, especialista em Unidade de Terapia Intensiva e com mais de 15 anos de atuação em enfermagem.
- **Revisor técnico independente:** Leivis de Lima Melo, contador especialista em auditoria, responsável por revisar evidências, rastreabilidade, controles e aderência ao plano de ação.
- A autoria de uma alteração R2, R3 ou R4 não pode aprová-la sozinha. A publicação exige registro do revisor clínico e do revisor técnico independente.
- A identificação nominal não substitui a conferência de habilitação, disponibilidade e conflito de interesse no fluxo interno antes de cada aprovação.

## 2. Regras obrigatórias

1. Classificar a alteração e a ferramenta como R1, R2, R3 ou R4 antes de publicar; aplicar a taxonomia e os gates do plano de ação.
2. Não alterar fórmula, unidade, arredondamento, referência, critério de classificação, texto de segurança ou tradução equivalente sem registro de mudança, testes e plano de reversão.
3. Para R2–R4, manter especificação verificável, casos de teste determinísticos, versão, resultado da validação e aprovações independentes.
4. Para R3/R4, documentar a finalidade pretendida e não usar linguagem que apresente cálculo ou classificação como diagnóstico, prescrição, garantia de segurança ou substituto do julgamento profissional.
5. Toda alteração de lógica ou texto de segurança deve verificar a paridade das versões publicadas em outros idiomas antes do deploy.
6. Diante de possível erro perigoso, dose/unidade incorreta ou exposição reputacional grave, retirar ou bloquear preventivamente a ferramenta, preservar evidências e abrir incidente S1.
7. Agentes de IA, hooks e subagentes podem identificar inconsistências e executar verificações técnicas, mas não substituem revisão clínica, decisão jurídica/regulatória ou aprovação humana exigida.

## 3. Aplicação pelos agentes e automações

- Antes de atuar em escopo clínico, os agentes devem ler este documento e o plano de ação.
- O orquestrador deve selecionar Auditor de Governança Regulatória e Revisor Final para alterações clínicas ou de fórmula; a tarefa só pode ser marcada como concluída com as evidências de revisão humana requeridas.
- Hooks e validadores devem reportar ausência de registro, evidência ou marcador exigido; uma aprovação humana não pode ser inferida automaticamente.
- Em caso de conflito, esta regra complementa `AI_RULES.md`; a instrução mais restritiva de segurança prevalece.

## 4. Evidência mínima de aprovação

Cada registro deve identificar: ferramenta e versão, arquivos/idiomas afetados, classificação de risco, finalidade, mudança proposta, casos e resultados de teste, referência, data, autor, revisor clínico, revisor técnico independente, decisão e plano de reversão. Não registrar dados de pacientes, credenciais ou números profissionais no repositório público.
