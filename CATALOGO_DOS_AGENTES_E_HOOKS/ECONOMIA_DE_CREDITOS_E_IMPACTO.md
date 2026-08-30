# 💰 Economia de Créditos de IA e Impacto Econômico

**Projeto:** Calculadoras de Enfermagem  
**Natureza:** estimativas qualitativas e framework de cálculo (valores ilustrativos, não cotações reais)

## 🎯 Ideia central

A arquitetura (8 agentes + 5 hooks) foi desenhada para **gastar menos créditos de IA**,
não mais. O princípio é simples:

> **Tudo o que pode ser automatizado de forma determinística vira hook (custo ≈ 0).
> Tudo o que exige julgamento vira agente especializado e enxuto (custo pequeno e contido).**

## 📉 Como a economia acontece (5 mecanismos)

| Mecanismo | Explicação | Efeito |
|---|---|---|
| **1. Hooks não usam IA** | `auto-backup`, `build-after-edit`, `content-governance`, `knowledge-index` e `security-git` rodam como PowerShell local. Zero tokens de modelo. | Elimina o custo de lembrar/executar passos repetitivos |
| **2. Subagentes encapsulam contexto** | Um agente filho lê arquivos grandes e devolve apenas o **relatório final**. As buscas intermediárias não poluem a conversa principal. | Reduz drasticamente o contexto do agente principal |
| **3. Prompts pequenos e especializados** | Cada `.agent.md` tem dezenas de linhas (não centenas). O agente não recarrega `AI_RULES.md`, catálogos etc. desnecessariamente. | Menos tokens de entrada por chamada |
| **4. `tools` restritos** | Agentes de auditoria têm só `read`/`search`; o Build tem só `execute`. Menos ferramentas = menos esquema = menos tokens e menos risco de ação errada. | Menos tokens + menos retrabalho |
| **5. Menos erros, menos retries** | Hooks garantem backup/build/validação sem depender da memória do modelo. Menos esquecimento = menos correções = menos chamadas repetidas. | Economia indireta (evita retrabalho) |

## 🧮 Framework de custo (ilustrativo)

| Operação | Sem a arquitetura | Com a arquitetura |
|---|---|---|
| Backup antes de editar | 1 chamada + leitura do modelo (instrução) | Hook local — **0 tokens** |
| Build pós-edição (SW + Tailwind) | 2+ chamadas manuais + leitura de saída | Hook local — **0 tokens** |
| Validação de governança | Auditoria manual via modelo (lê o HTML) | Hook local + validador Node — **0 tokens** |
| Reindexação do conhecimento | Modelo lendo/atualizando `/knowledge/` | Hook local + Node — **0 tokens** |
| Bloqueio de commit/push | Depende da memória do modelo | Hook local — **0 tokens** |
| Pesquisa de conteúdo relacionado | Modelo principal varre `/knowledge/` (milhares de linhas) | Agente `Descoberta` devolve dossiê compacto |
| Auditoria de SEO | Modelo principal lê página + regras | Agente `Auditor SEO` enxuto devolve relatório |

**Leitura:** cada hook substitui uma rodada de raciocínio do modelo por um script local.
Como o projeto tem ~4.852 páginas HTML e centenas de edições, a economia se multiplica
em escala.

## 💵 Impacto econômico (estimativa qualitativa)

| Dimensão | Impacto |
|---|---|
| **Custo de tokens** | Reduzido pela eliminação de passos repetitivos (hooks) e pelo encapsulamento (subagentes) |
| **Tempo de desenvolvimento** | Reduzido — passos automáticos não esperam o modelo |
| **Consistência** | Aumentada — hooks não esquecem, não variam, não alucinam |
| **Risco operacional** | Reduzido — `security-git` impede commit/push indevido; `auto-backup` protege contra perda de dados |
| **Escalabilidade** | Cada página nova herda o mesmo pipeline sem custo incremental de raciocínio |

> ⚠️ **Ressalva:** os valores monetários dependem do preço por token do modelo em uso
> (que varia). Este documento fornece o **framework** e a **lógica** de economia, não
> uma cotação. Para um número exato, multiplicar tokens economizados pelo preço vigente
> do modelo.

## 📊 Onde ainda se gasta créditos (e é aceitável)

- **Agentes de criação/editáveis** (`Nova Calculadora`, `Gerador de Imagens`, `Tradutor`)
  precisam de IA porque exigem julgamento e escrita.
- **Agentes de auditoria** (`Auditor SEO`, `Auditor de Governança`) valem o custo porque
  evitam publicar página errada (retrabalho caro).
- **Descoberta de Conhecimento** vale o custo porque evita duplicação de conteúdo e
  correções posteriores.

## 🏁 Conclusão

A economia não vem de "não usar IA", mas de **usar IA apenas onde há julgamento** e
**automatizar tudo que é determinístico**. Os hooks são a camada de custo zero; os
agentes são a camada de julgamento contido.
