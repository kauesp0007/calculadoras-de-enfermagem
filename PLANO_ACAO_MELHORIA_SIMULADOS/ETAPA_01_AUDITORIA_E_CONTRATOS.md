# Etapa 01 — Auditoria técnica e contratos da reforma dos simulados

Data: 04/10/2026  
Branch: chatgpt/simulados-etapa-01-fundacao-20261004  
Status: em execução

## 1. Objetivo

Criar a fundação compartilhada antes de migrar qualquer uma das 20 rotas. Esta etapa não altera gabaritos, enunciados, referências, política Premium nem o loader canônico.

## 2. Inventário confirmado

O catálogo privado Supabase possui conteúdo para as 20 rotas levantadas no manual. Na leitura de 04/10/2026, todas as 20 estavam com premium_required=true, enforcement=client_guard e source=premium_content_pages.

Isso é um retrato da política atual, não uma regra hardcoded. A política continua dinâmica e deve ser reconsultada antes de cada mudança de acesso.

## 3. Achados do conteúdo privado real

A inspeção do conteúdo canônico de simulado-de-enfermagem.html confirmou:

- 50 objetos de questão;
- 50 answerIndex;
- 50 referências;
- array JavaScript questionsData;
- timer próprio;
- dois modos de correção, incluindo correção imediata;
- renderização das 50 questões de uma vez;
- estado userAnswers mantido apenas em memória durante a sessão;
- resultado com acertos, erros, percentual e tempo;
- “Memória do Cálculo” com resposta do usuário, gabarito e referência;
- impressão em nova janela;
- ausência de instrumentação GA4 específica do simulado;
- ausência de persistência padronizada da tentativa;
- ausência de navegação questão a questão;
- ausência de progresso real padronizado;
- ausência de revisão de erros como fluxo separado;
- ausência de explicação pedagógica na maioria das questões do piloto.

O simulado de Código de Ética já possui campos adicionais como chapter, article, topic, difficulty, explanation, sourceType e source. O novo motor deve preservar e aproveitar esses campos sem exigir que todos os simulados já os possuam.

## 4. Padrão encontrado nas páginas

Dezenove páginas de simulado usam o conceito questionsData e renderização JavaScript local. O flashcards_quiz.html é uma exceção funcional e deverá ser adaptado em lote próprio.

Os simulados possuem quantidades diferentes, portanto o motor não pode usar denominadores fixos como 50. A quantidade deve vir de questions.length.

Os objetos de questão convergem para o seguinte núcleo:

- id;
- question;
- options;
- answerIndex;
- ref.

Campos opcionais já observados:

- explanation;
- chapter;
- article;
- topic;
- difficulty;
- sourceType;
- source.

## 5. Decisões da Etapa 01

1. Criar um motor compartilhado sem lógica Premium.
2. O motor recebe dados já carregados pelo documento protegido.
3. O motor não conhece Firebase, Supabase, checkout ou assinatura.
4. O premium-content-loader continua sendo a autoridade de entrega/gate.
5. Persistência local serve apenas para tentativa/progresso.
6. localStorage nunca será usado como autoridade de plano.
7. O motor usará elementos HTML nativos para radio/progress/button.
8. O motor renderizará uma questão por vez no piloto.
9. O motor suportará modo study e exam.
10. O motor suportará retomada por contentVersion.
11. O motor emitirá analytics sem PII e respeitando consentimento.
12. O motor não inventará explanation quando o conteúdo não fornecer uma.
13. O motor preservará ref/reference/source.
14. O motor calculará unanswered separadamente de errors.
15. O motor não inferirá abandono pela ausência de conclusão.

## 6. Contrato de dados P0

Simulator config:

- id: string estável;
- title: string;
- contentVersion: string;
- mode: study | exam;
- questions: array;
- root: elemento ou seletor;
- storage: boolean;
- timer: boolean;
- analytics: boolean;
- labels: overrides opcionais.

Question normalizada:

- id;
- prompt;
- options;
- correctIndex;
- reference;
- explanation;
- topic;
- metadata.

Attempt:

- schemaVersion;
- simulatorId;
- contentVersion;
- mode;
- answers;
- marked;
- currentIndex;
- startedAt;
- updatedAt;
- completedAt;
- elapsedSeconds.

## 7. Persistência

Chave:

ce_simulator_attempt_v1:{simulatorId}

Regras:

- ignorar tentativa de outro contentVersion;
- validar índices antes de restaurar;
- salvar após resposta, marcação e navegação;
- manter tentativa concluída até reinício explícito;
- não gravar enunciados ou referências no localStorage;
- não gravar dados pessoais.

## 8. Analytics P0

Eventos do motor:

- simulator_start;
- simulator_resume;
- simulator_question_answer;
- simulator_question_mark_review;
- simulator_progress_checkpoint;
- simulator_finish_click;
- simulator_complete;
- simulator_result_view;
- simulator_review_start;
- simulator_review_question;
- simulator_retry_all;
- simulator_exit_click somente quando existir ação explícita.

Parâmetros:

- simulator_id;
- simulator_type quando fornecido;
- audience quando fornecido;
- topic quando fornecido;
- board quando fornecido;
- year quando fornecido;
- question_count;
- mode;
- question_index;
- progress_bucket;
- score_bucket.

Nunca enviar prompt, alternativa, resposta textual, e-mail, UID ou nome.

## 9. Compatibilidade

O motor será criado em js/simulados/simulator-engine.js e estilos em css/simulados/simulator-engine.css.

A integração no conteúdo privado será feita somente após:

- revisão do motor;
- teste de contrato;
- estratégia de rollback;
- confirmação de como atualizar premium_content_pages sem expor o conteúdo privado no repositório público.

## 10. Bloqueio identificado

O conteúdo completo dos simulados está em premium_content_pages, enquanto os HTML públicos do repositório são shells. Portanto, editar apenas o shell não reforma a experiência real.

A integração do piloto exige um mecanismo seguro para atualizar o documento privado. Não será feita atualização direta irreversível no banco sem um rollback claro.

## 11. Próximos passos

1. adicionar motor compartilhado;
2. adicionar CSS compartilhado;
3. adicionar testes de contrato;
4. revisar PR;
5. definir migração segura do piloto privado;
6. migrar simulado-de-enfermagem.html;
7. medir e validar antes de escalar.
