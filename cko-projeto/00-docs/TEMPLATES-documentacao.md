# Documentação dos Templates

Duas famílias de página. A integração futura pode usar o shell modular descrito em `ESTRUTURA-SITE-modulares.md`; as bibliotecas atualmente geradas funcionam em modo autônomo dentro de `cko-projeto`.

No modo autônomo, abas e ações são inicializadas por `03-templates/cko-page.js`. Não há `onclick`, CSS inline, dependências externas ou carregamento dos scripts globais do site.

## A. Calculadora / Escala — *CKO Tool Manifest v1.0*

Anatomia do manifesto (bloco `ferramenta`):

| Bloco | Conteúdo |
|---|---|
| `identidade` | id, nome, categoria, criticidade clínica |
| `processamento` | tipo do motor: `formula` \| `soma` \| `engine` (DSL/AST, sem `eval`) |
| `campos` | inputs: `tooltip`, `ajuda`, `opcoes` (com `score`), `origem`, `sensivel` (LGPD) |
| `formula` | expressão + variáveis |
| `memoriaCalculo` | trilha passo a passo (auditável) |
| `resultado` | `faixas` tipadas: `cor` semântica (verde/amarelo/vermelho/navy), `interpretacao`, flag `alerta` |
| `interpretacaoClinica` | leitura clínica do escore |
| `diagnosticos` / `intervencoes` / `resultados` | NANDA-I / NIC / NOC |
| `alertas` | separados em `clinicos` e `educacionais` |
| `tooltips` | glossário |
| `cuidados` · `referencias` | cuidados de enfermagem · bibliografia |
| `documentacao` | modelo SAE |
| `educacao` | quiz/flashcards/caso |
| `saida` | saída estruturada para PDF/API |
| `recursos` | print · pdf · share · save · favorito · laudo · offline · exportJSON |
| `informacoesPagina` | camada editorial/transparência: sobre, dados, público, limitações, dicas, erros comuns, FAQ |

Ordem no DOM (leitura): **aviso clínico → formulário → resultado**. O aviso vem antes do formulário, nunca depois.

## B. Biblioteca (material/dispositivo) — *CKO Biblioteca v1*

Envelope comum + `exclusiveModules`/`characteristics` (ver ESTRUTURA-biblioteca.md). Renderizado por `gerar-biblioteca.py` em abas: Visão geral · Características · Usos & indicações · Contraindicações · Segurança · NANDA/NIC/NOC · Evidência & recursos.

## Componentes compartilhados

`header` · `barra de acessibilidade` · `footer` (injetados) · `breadcrumb` · `hero` · `tabs` · `cko-card` · `.resultado` · `.input-box-wrapper` · botões · badges · tabelas · faixas (ranges) · alertas · wizard · accordions · TOC sidebar · disclaimer · TTS · simulador · **toasts** · seleção SAE (NIC/NOC).

## Barra de ações (share bar)

Ativada declarativamente por `data-features=` (`cde-features.js`); botões:

| Botão | Ícone | Comportamento |
|---|---|---|
| **Favoritar** | `star` (preenchido/vazado = estado) | `localStorage['favorites']` (array de `data-content-id`); `aria-pressed` |
| **Compartilhar** | `share` | Web Share API → Clipboard API → fallback; confirma via toast |
| **Imprimir** | `print` | `window.print()` + `print.css` |
| **PDF** | `pdf` | exportação (mesmo motor de impressão) |
| **Copiar** | `copy` | copia resultado; **confirma em live region** |
| **Reportar** | `flag` | fluxo de incidente/erro de conteúdo |

### Toaster

```js
window.CDE.toast(title, detail, type);   // type: "success" | "info" | "warning"
```
Fallback sem `CDE`: escreve na região viva `#statusMessage` (acessível).

### Favoritos

Estado em `localStorage['favorites']` (array de ids). Ícone `star` preenchido quando ativo; `aria-pressed` reflete o estado; toast confirma a ação.

## Acessibilidade (obrigatória em todo template)

- Skip link para `#conteudo`; região viva `#statusMessage` (`aria-live="polite"`).
- Barra de acessibilidade (injetada): `contraste-alto`, `dark-mode`, `fonte-dislexia`.
- `aria-describedby` ligando erro↔campo; `aria-live` nos resultados; `aria-atomic`.
- `onwheel="return false"` + `inputmode` em campos numéricos; bloqueio de negativo/caractere.
- Tooltips respondem a `:hover` **e** `:focus-within`.
- Lightbox/modal com armadilha de teclado (keyboard trap) e `Esc`.
- `abbr[lang]` em siglas estrangeiras (UI, PSI…).
- `@graph` (MedicalWebPage + BreadcrumbList + `reviewedBy`); hreflang com auto-referência.
- Gate de rascunho: `data-draft` → `noindex` + faixa + `reviewedBy:"a nomear"`; publica com `?publish=1`.

## Botões (paleta)

`.btn-primary` navy `#1a3e74` · `.btn-success` verde `#006400` · `.btn-secondary` · botões da `.action-bar` (contorno navy, hover `#eff6ff`).
