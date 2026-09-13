# Dossiê de governança clínica — CALC-INSULINA

**Status:** levantamento técnico concluído; pendente de revisão clínica e técnica independente.

**Classificação:** R2 — cálculo assistencial dependente de unidade e concentração.

**Data do levantamento:** 13 de setembro de 2026.
**Escopo desta etapa:** inventário e especificação preliminar; nenhuma alteração foi aplicada à calculadora ou às suas traduções.

## 1. Identificação e alcance

- **ID:** `CALC-INSULINA`.
- **Página principal:** `insulina.html`.
- **Cluster publicado identificado:** 19 arquivos — raiz e `ar`, `de`, `en`, `es`, `fr`, `hi`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `ru`, `sv`, `tr`, `uk`, `vi` e `zh`.
- **Responsáveis indicados:** revisor clínico habilitado e revisor técnico independente definidos na política canônica.

## 2. Comportamento atualmente implementado

| Elemento | Evidência técnica levantada | Estado |
|---|---|---|
| Entrada | A página recebe uma prescrição numérica em UI. | Confirmado no HTML. |
| Seletor de seringa | Há opções de 1 mL (100 UI) e 3 mL, mas o valor selecionado não participa da fórmula. | Confirmado no HTML/JavaScript; requer decisão de UX e revisão clínica. |
| Fórmula atual | `volumeML = prescricaoUI / 100`. | Confirmada no JavaScript de todas as 19 versões. |
| Saída | Apresenta volume em mL e detalhamento com a constante 100 UI/mL. | Confirmado no HTML/JavaScript. |
| Limite de entrada | Rejeita valores não numéricos ou menores/iguais a zero. | Confirmado no JavaScript. |
| Arredondamento | Não há regra explícita de arredondamento; o resultado usa a representação nativa do JavaScript. | Pendência obrigatória da especificação. |
| Referências publicadas | A página cita ISMP Brasil (2019) e Diretrizes da Sociedade Brasileira de Diabetes (2023). | Exigem conferência de versão, aplicabilidade e fonte oficial pelo revisor clínico. |

## 3. Achados e riscos

1. **P0 — concentração presumida:** a constante `100` é aplicada diretamente pela fórmula; o usuário não confirma a concentração antes do cálculo. O seletor existente representa tamanho de seringa, não concentração.
2. **P1 — linguagem conclusiva:** há mensagens como “rápida e segura”, “quantidade exata” e “você deve aspirar rigorosamente”, que devem ser revisadas para não exceder o papel de apoio da ferramenta.
3. **P1 — arredondamento não definido:** não há política explícita para casas decimais, precisão da seringa, apresentação nem entradas decimais extensas.
4. **P1 — rastreabilidade insuficiente:** não há versão da fórmula, changelog, data de revisão ou evidência de aprovação no HTML atual.
5. **P1 — paridade de segurança:** a fórmula `/ 100` foi localizada nas 19 versões, mas o texto de segurança, referências e mensagens precisam de teste semântico por idioma antes de qualquer publicação.
6. **P2 — referência:** as referências existentes são ponto de partida, mas ainda não foram validadas como suporte específico para a finalidade e as limitações da calculadora.

## 4. Especificação proposta para revisão humana

| Campo | Proposta para decisão | Evidência/decisão necessária |
|---|---|---|
| Finalidade pretendida | Recurso educacional e de apoio ao cálculo; não substitui prescrição, protocolo, conferência independente ou julgamento profissional. | Aprovação clínica e jurídica/regulatória quando aplicável. |
| Concentração | Exigir escolha explícita da concentração aplicável antes de calcular; não assumir U-100. | Revisão clínica da interface, dos limites e das fontes. |
| Fórmula | Aplicar somente a relação `volume (mL) = dose (UI) / concentração (UI/mL)` após a concentração ter sido confirmada. | Validação clínica da fórmula e das unidades. |
| Seriga | Separar conceitualmente o tamanho da seringa da concentração; informar que a seleção não altera a concentração do produto. | Definição de UX e revisão clínica. |
| Arredondamento | Definir precisão de exibição e comportamento para valores não representáveis na graduação selecionada. | Regra clínica/protocolo institucional; não inferir automaticamente. |
| Saída | Exibir dose, concentração confirmada, volume calculado, unidade e aviso de conferência independente. | Revisão clínica do texto e do fluxo. |
| Bloqueios | Bloquear concentração ausente, dados inválidos e resultados fora das regras aprovadas. | Casos de teste aprovados. |

## 5. Casos de teste propostos — pendentes de aprovação clínica

Os casos abaixo verificam a matemática da fórmula genérica; não são instrução assistencial nem aprovação clínica.

| ID | Dose (UI) | Concentração (UI/mL) | Volume esperado (mL) | Objetivo |
|---|---:|---:|---:|---|
| INS-001 | 10 | 100 | 0,10 | Caso básico de conversão. |
| INS-002 | 30 | 100 | 0,30 | Caso de exemplo exibido atualmente. |
| INS-003 | 50 | 100 | 0,50 | Caso de exemplo exibido atualmente. |
| INS-004 | 100 | 100 | 1,00 | Caso de identidade da relação. |
| INS-005 | vazio, zero e negativo | qualquer | bloqueado | Validação de entrada. |
| INS-006 | valor positivo | ausente | bloqueado | Confirmação obrigatória de concentração. |
| INS-007 | valor positivo | não numérica/inválida | bloqueado | Validação da concentração. |
| INS-008 | valor com casas decimais | concentração válida | conforme regra aprovada | Regressão de arredondamento. |

## 6. Decisão de publicação nesta etapa

**Não alterar a fórmula nem afirmar validação clínica.** A página permanece classificada como `PENDING_CLINICAL_REVIEW` até que:

1. o Enfermeiro Cauê S. M. Zipfel revise e aprove finalidade, concentrações permitidas, fórmula, arredondamento, limites, avisos e referências;
2. Leivis de Lima Melo registre a revisão técnica independente de rastreabilidade, testes, versões e paridade entre idiomas;
3. os casos de teste aprovados sejam automatizados e executados com êxito;
4. a alteração tenha versão, plano de reversão e contraprova do Revisor Final.

## 7. Próxima alteração proposta — aguardando aprovação

Após as aprovações acima, a mudança deverá ser implementada primeiro em `insulina.html`, acompanhada dos testes determinísticos. Só então o cluster de traduções deve ser atualizado com validação de paridade de fórmula, unidades, avisos e referências. Nenhuma versão internacional deve receber uma mudança parcial.
