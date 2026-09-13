# PADRÃO CANÔNICO DE DESIGN DAS PÁGINAS HTML

**Calculadoras de Enfermagem — Design System Institucional v1.0**

Este documento é a regra canônica para a criação e modernização de páginas HTML do projeto. Ele consolida o acabamento visual observado nos modelos institucionais do projeto e deve ser consultado por agentes, subagentes, hooks, revisores e qualquer automação que crie ou altere HTML.

## 1. Princípio geral

Toda nova página deve parecer parte do mesmo produto digital: profissional, clínico, limpo, compacto, responsivo, acessível e visualmente consistente.

A regra é de **padronização visual**, não de cópia cega de conteúdo. Conteúdo, funcionalidade, SEO, scripts, referências e estrutura semântica existentes devem ser preservados salvo autorização explícita para alteração.

## 2. Dimensões e largura

- A página deve ocupar **100% da largura útil da viewport**.
- O layout principal deve usar apenas paddings laterais responsáveis por criar respiro visual.
- É PROIBIDO usar `container`, `max-w-5xl`, `max-w-6xl`, `max-w-7xl` ou `mx-auto` no container estrutural principal ou no hero.
- O hero deve ter **largura total** do espaço útil.
- A altura do hero deve ser **compacta**, evitando grandes áreas vazias.
- O conteúdo deve priorizar densidade informativa sem parecer comprimido.
- Em desktop, o espaçamento lateral de referência deve permanecer aproximadamente na faixa de **24–28px**.
- Em telas pequenas, reduzir o padding lateral para aproximadamente **12–16px**, preservando legibilidade e toque confortável.

## 3. Tipografia

### Família principal

- Corpo: **Inter**.
- Títulos e hierarquia de destaque: **Nunito Sans**, quando disponível no template.
- Fontes locais devem ser preferidas às fontes remotas quando o projeto já fornecer os arquivos correspondentes.

### Escala de referência

- Corpo principal: **16px**.
- Texto secundário: **14–15px**.
- Microtexto/labels: **12–13px**.
- H1 do hero: aproximadamente **24–34px**, responsivo com `clamp()` quando apropriado.
- H2/subtítulo do hero: aproximadamente **13–15px**.
- H2 de seção: aproximadamente **18–22px**.
- H3: aproximadamente **16–18px**.

### Peso e leitura

- Corpo: 400–500.
- Elementos de apoio: 500–600.
- Títulos: 700–800.
- Destaques institucionais podem usar 800–900 com parcimônia.
- Line-height do corpo: aproximadamente **1.5–1.6**.
- Evitar títulos excessivamente grandes que quebrem a compactação.

## 4. Hero card — padrão obrigatório

O hero é o principal elemento de identidade da página.

### Estrutura visual

A hierarquia deve seguir:

**Eyebrow → H1 → H2**

- Alinhamento predominantemente à esquerda.
- H1 deve permanecer em uma única linha sempre que a largura disponível permitir.
- H2 fica imediatamente abaixo do H1.
- O hero não deve conter grandes espaços verticais vazios.
- Elementos decorativos devem ser discretos e nunca prejudicar contraste ou leitura.

### Dimensões

- Largura: **100%**.
- Border-radius de referência: **18–20px**.
- Padding desktop: aproximadamente **16–28px** vertical/horizontal, ajustado ao conteúdo.
- Padding mobile: aproximadamente **14–18px**.

### Gradiente institucional

O gradiente padrão é:

`linear-gradient(135deg, #1A3E74 0%, #1E4D8C 60%, #163269 100%)`

Paleta institucional:

- Navy principal: `#1A3E74`
- Navy claro: `#1E4D8C`
- Navy escuro: `#163269`
- Azul de apoio: `#2563EB`
- Azul luminoso/acento: `#4A90E2`
- Sky: `#0EA5E9`

### Acabamento do hero

- Sombra de referência: `0 10px 30px rgba(26,62,116,.45)`.
- Pode haver brilho branco translúcido e um segundo brilho azul/temático por pseudo-elementos.
- O efeito deve ser **glassmorphism discreto**, sem aparência exagerada.
- `overflow: hidden` pode ser usado para conter efeitos decorativos.
- A decoração não deve aumentar a altura do hero nem produzir CLS.

## 5. Espaçamento e compactação

A página deve ser visualmente compacta.

- Evitar margens e paddings excessivos.
- Preferir intervalos pequenos e previsíveis entre título, texto, cards e controles.
- Espaçamento entre elementos relacionados: aproximadamente **8–16px**.
- Espaçamento entre blocos/seções: aproximadamente **16–24px**.
- Seções maiores podem chegar a **28–32px** quando necessário para separar grupos semanticamente distintos.
- Evitar blocos consecutivos com `margin`/`padding` de 48px, 64px ou mais sem justificativa visual.
- A compactação nunca deve reduzir área de toque, acessibilidade ou legibilidade.

## 6. Cards e seções

- Fundo: branco ou superfície institucional muito clara.
- Border: **1px** em tom slate/azul muito claro.
- Border-radius de referência: **14–16px**.
- Padding de referência: **16–18px** em seções compactas; aumentar somente quando o conteúdo exigir.
- Sombra de referência: `0 12px 30px rgba(15,23,42,.10)`.
- Cards secundários podem usar sombras mais leves.
- Evitar bordas pesadas, sombras pretas ou excesso de efeitos.

## 7. Cores

A identidade visual deve permanecer predominantemente institucional:

- Primária: `#1A3E74`.
- Primária clara: `#1E4D8C`.
- Primária escura: `#163269`.
- Azul de ação: `#2563EB`.
- Azul de apoio: `#4A90E2`.
- Fundo geral: `#F8FAFC` ou equivalente institucional claro.
- Superfície: `#FFFFFF`.
- Texto principal: `#1E293B`.
- Texto secundário: `#475569` / `#64748B`.
- Bordas: `#E2E8F0` / `#CBD5E1`.

Cores temáticas, como verde em páginas de tecnologia verde, podem existir, mas devem funcionar como **acento secundário**, sem descaracterizar a identidade institucional azul.

## 8. Bordas

- Preferir bordas de 1px.
- Bordas devem separar superfícies, não dominar o design.
- Evitar múltiplas bordas concêntricas sem necessidade.
- Border-radius consistente entre componentes relacionados.

## 9. Sombras

As sombras devem criar profundidade profissional e discreta.

- Hero: sombra institucional mais pronunciada.
- Cards: sombra suave e ampla.
- Controles: sombra mínima ou nenhuma sombra quando a borda já fornece separação.
- Evitar `box-shadow` muito escuro, duro ou com aparência de elemento flutuante excessivo.

## 10. Acabamento profissional

O resultado final deve transmitir:

- produto institucional;
- ambiente clínico/educacional confiável;
- organização;
- precisão;
- modernidade sem modismo excessivo;
- alta densidade de informação com boa leitura;
- consistência entre páginas.

Detalhes recomendados:

- ícones pequenos e alinhados ao texto;
- títulos com hierarquia clara;
- microinterações discretas em hover/focus;
- estados de foco visíveis;
- contraste suficiente;
- alinhamento consistente entre títulos, textos e cards;
- nenhum elemento decorativo deve competir com o conteúdo clínico ou educacional.

## 11. Responsividade

O padrão deve funcionar primeiro em telas pequenas e escalar para desktop.

- Reduzir paddings e gaps em mobile.
- Evitar overflow horizontal.
- H1 deve usar escala responsiva.
- Cards e grids devem colapsar de forma previsível.
- Áreas clicáveis devem continuar confortáveis.
- O hero deve continuar compacto em mobile.

## 12. Performance e estabilidade visual

O padrão visual não pode prejudicar Core Web Vitals.

- Reservar dimensões previsíveis para elementos que carregam posteriormente.
- Evitar imagens sem dimensões explícitas.
- Evitar efeitos que provoquem reflow.
- Não introduzir fontes remotas desnecessárias.
- Não transformar o padrão visual em CSS duplicado sem necessidade.

## 13. Regra de preservação

Ao modernizar uma página existente:

1. Preservar conteúdo.
2. Preservar funcionalidade.
3. Preservar SEO.
4. Preservar acessibilidade.
5. Preservar scripts e integrações.
6. Preservar modularização.
7. Alterar somente o necessário para adequação ao padrão visual.
8. Não reescrever a página inteira quando uma correção localizada for suficiente.

## 14. Regra para agentes, subagentes e hooks

Esta especificação é uma **regra canônica de design**.

Antes de criar ou modernizar qualquer HTML, agentes e subagentes DEVEM consultar este arquivo e verificar pelo menos:

- largura;
- tipografia;
- espaçamento;
- compactação;
- hero;
- gradiente;
- cores;
- bordas;
- sombras;
- responsividade;
- estabilidade visual.

Hooks de layout DEVEM tratar violações objetivas deste padrão como achados de conformidade visual. A validação automática não substitui a revisão visual humana.

## 15. Critério de aprovação

Uma nova página somente deve ser considerada visualmente conforme quando:

- pertence claramente à mesma família visual;
- mantém o hero institucional e compacto;
- respeita a largura útil e a regra de ausência de container estrutural proibido;
- mantém tipografia e escala compatíveis;
- evita espaçamento excessivo;
- usa cores, bordas e sombras coerentes;
- funciona em mobile e desktop;
- não introduz regressões de acessibilidade ou desempenho.

**Fonte canônica:** este arquivo.

**Aplicação:** agentes, subagentes, hooks, revisores e automações de criação/modernização de HTML.
