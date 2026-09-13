# AI_RULES.md

# REGRA ABSOLUTA

Antes de executar qualquer tarefa, a IA deve obrigatoriamente:

1. Ler completamente este arquivo (AI_RULES.md).

2. Ler todos os arquivos de regras relacionados antes de modificar qualquer código.

Arquivos obrigatórios:

- HTML_RULES.md
- HTML_PAGE_TEMPLATE_RULES.md

Para qualquer escopo clínico, de fórmula, escala, interpretação, unidade, referência clínica
ou tradução equivalente, também é obrigatório ler e cumprir:

- `CKO-COREN-Projeto-Completo-v2/AUDITORIA-E-MELHORIAS-V2/GOVERNANCA_CLINICA_CANONICA.md`;
- `CKO-COREN-Projeto-Completo-v2/AUDITORIA-E-MELHORIAS-V2/PLANO_DE_ACAO_RISCOS_CLINICOS_E_GOVERNANCA.md`.

Caso existam outros arquivos de regras (*.md), eles também devem ser lidos quando relacionados à tarefa.

---

# EXECUÇÃO

- Nunca iniciar alterações sem compreender completamente as regras do projeto.
- Nunca criar código que entre em conflito com qualquer arquivo de regras.
- Em caso de conflito entre regras, interromper imediatamente a execução e solicitar confirmação do usuário.

---

# SEGURANÇA

Antes de alterar qualquer arquivo:

- analisar o impacto da alteração;
- preservar arquitetura;
- preservar SEO;
- preservar acessibilidade;
- preservar responsividade;
- preservar modularização;
- preservar desempenho.

Nunca remover funcionalidades existentes sem autorização explícita.

---

# GOVERNANÇA CLÍNICA E SEGURANÇA ASSISTENCIAL

Para alterações R2, R3 ou R4, conforme a taxonomia canônica, é obrigatório registrar
classificação, especificação, testes determinísticos, versão, impacto nos idiomas, plano de
reversão e aprovação independente do revisor clínico habilitado e do revisor técnico
independente. IA, hooks e testes automatizados não constituem aprovação clínica nem jurídica.

É proibido publicar ou ampliar funcionalidade R4 sem avaliação clínica, jurídica e regulatória
formal. Diante de risco S1, interrompa a exposição, preserve as evidências e registre o
incidente antes de retomar a publicação.

---

# MODIFICAÇÕES

Sempre:

- reutilizar código existente;
- evitar duplicação;
- manter padrão do projeto;
- manter nomenclatura existente;
- manter indentação e organização do código.

---

# ALTERAÇÕES EM LOTE

Antes de alterar múltiplos arquivos:

- identificar todos os arquivos afetados;
- explicar resumidamente o que será alterado;
- somente depois executar as modificações.

---

# DÚVIDAS

Se existir qualquer dúvida sobre uma regra ou comportamento esperado:

PARAR.

Solicitar confirmação antes de continuar.

---

# PRIORIDADE DAS REGRAS

A prioridade deve ser sempre:

1. AI_RULES.md
2. HTML_RULES.md
3. HTML_PAGE_TEMPLATE_RULES.md
4. Demais arquivos de regras

Nenhuma regra inferior pode sobrescrever uma regra superior.

---

# REGRA FINAL

Nunca assumir.

Nunca inventar.

Nunca alterar além do solicitado.

Executar exatamente o que foi solicitado, respeitando integralmente todas as regras do projeto.
