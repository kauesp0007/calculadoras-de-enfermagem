# HTML_RULES.md

# Padrão Oficial de Desenvolvimento HTML
## Projeto Calculadoras de Enfermagem

**Versão:** 1.0  
**Status:** Oficial  
**Página de Referência:** `mapa-do-site.html`

---

# OBJETIVO

Toda nova página HTML criada para este projeto **DEVE seguir rigorosamente** os padrões visuais, estruturais, tipográficos e de organização definidos neste documento.

A página **mapa-do-site.html** é considerada a referência oficial do Design System do projeto.

A consistência visual entre todas as páginas possui prioridade máxima.

---

# REGRAS GERAIS

Ao criar, modificar ou otimizar qualquer página HTML, a IA deve:

- Preservar a identidade visual do projeto.
- Manter a consistência entre todas as páginas.
- Utilizar código limpo e organizado.
- Escrever HTML semântico.
- Priorizar acessibilidade.
- Priorizar desempenho.
- Priorizar SEO.
- Priorizar Core Web Vitals.
- Priorizar responsividade.
- Evitar código desnecessário.
- Evitar duplicação de código.
- Não alterar partes não solicitadas pelo usuário.

---

# ESTRUTURA PRINCIPAL DA PÁGINA

Toda página deve utilizar obrigatoriamente:

```html
<body>

    <main class="flex-grow p-4 sm:p-8">

        <!-- Hero -->

        <!-- Conteúdo -->

    </main>

</body>
```

Classe obrigatória do `<main>`:

```html
class="flex-grow p-4 sm:p-8"
```

Equivalente:

```css
padding:16px;

@media(min-width:640px){
    padding:32px;
}
```

---

# NUNCA UTILIZAR

Na estrutura principal da página nunca utilizar:

- container
- max-w-5xl
- max-w-6xl
- max-w-7xl
- mx-auto

A página deve ocupar praticamente toda a largura disponível da viewport, mantendo apenas os paddings laterais.

---

# FILOSOFIA VISUAL

Toda página deve transmitir:

- Ciência
- Tecnologia
- Segurança
- Organização
- Profissionalismo
- Institucionalidade
- Modernidade
- Confiabilidade

A aparência geral deve ser inspirada em:

- Apple
- Stripe
- Vercel
- Notion
- Material Design
- Interfaces médicas modernas

---

# HERO CARD

Todo Hero deve seguir obrigatoriamente o padrão institucional.

Características:

- largura de 100%
- altura compacta
- alinhamento à esquerda
- gradiente azul institucional
- Glassmorphism discreto
- sombras suaves
- cantos arredondados
- aparência premium
- excelente leitura
- responsivo

Hierarquia obrigatória:

Eyebrow

↓

H1

↓

H2

Nunca inverter essa ordem.

---

# ESTRUTURA DO HERO

```html
<section class="mb-6 meem-card-navy">

    <div class="
        flex
        flex-col
        md:flex-row
        items-center
        justify-between
        px-8
        md:px-12
        py-8
        md:py-10
    ">

        <div class="w-full md:w-2/3">

            <!-- Eyebrow -->

            <!-- H1 -->

            <!-- H2 -->

        </div>

    </div>

</section>
```

---

# LARGURA DO HERO

Sempre utilizar:

```css
width:100%;
```

Nunca utilizar:

- max-w-5xl
- max-w-6xl
- mx-auto

O Hero deve ocupar toda a largura disponível.

---

# ALTURA DO HERO

Utilizar obrigatoriamente:

```html
py-8 md:py-10
```

Equivalente:

```css
padding-top:32px;
padding-bottom:32px;

@media(min-width:768px){

padding-top:40px;
padding-bottom:40px;

}
```

Nunca criar Heroes excessivamente altos.

---

# LAYOUT INTERNO

Sempre utilizar:

```html
w-full md:w-2/3
```

para o bloco de texto.

---

# EYEBROW

Todo Hero deve possuir um Eyebrow.

Exemplos:

- PROTOCOLO INSTITUCIONAL
- VISÃO GERAL
- BIBLIOTECA
- CALCULADORA
- CLT 2026
- NANDA-I
- NIC
- NOC

Classe obrigatória:

```html
text-blue-300
text-xs
font-bold
uppercase
tracking-[0.15em]
mb-2
```

Características:

- letras maiúsculas
- pequeno
- azul claro
- espaçamento entre letras
- destaque institucional

---

# H1

Todo título principal deve utilizar:

```html
text-[clamp(28px,5vw,44px)]
font-black
leading-tight
mb-3
```

ou

```html
text-3xl
md:text-5xl
font-black
leading-tight
mb-3
```

Regras:

- maior elemento visual da página
- preferencialmente uma única linha
- extremamente legível
- forte destaque

---

# H2

Classe oficial:

```html
text-blue-100
text-base
font-medium
```

Regras:

- menor destaque que o H1
- máximo de duas linhas
- resumir claramente o objetivo da página

---

# GRADIENTE OFICIAL

Todos os Heroes devem utilizar:

```css
background:
linear-gradient(
135deg,
#1A3E74 0%,
#1E4D8C 60%,
#163269 100%
);
```

---

# GLASSMORPHISM

Adicionar obrigatoriamente:

Círculo superior

- 180x180
- branco
- opacity .05
- blur 40px

Círculo inferior

- 140x140
- #4A90E2
- opacity .20
- blur 30px

Objetivo:

- criar profundidade
- aparência premium
- identidade visual

---

# BORDER RADIUS

Utilizar:

```css
border-radius:16px;
```

ou

```html
rounded-2xl
```

---

# SOMBRA

Utilizar:

```css
box-shadow:
0 8px 24px rgba(26,62,116,.35);
```

ou

```html
shadow-2xl
```

---

# TIPOGRAFIA

Fonte oficial:

Inter

Pesos:

400

500

700

900

Hierarquia:

Texto comum → 400

H2 → 500

Eyebrow → 700

H1 → 900

---

# ESPAÇAMENTOS

Utilizar:

Hero inferior

```html
mb-6
```

Eyebrow

```html
mb-2
```

H1

```html
mb-3
```

Conteúdo

```html
mb-16
```

---

# RESPONSIVIDADE

Toda página deve funcionar perfeitamente em:

- Desktop
- Notebook
- Tablet
- Smartphone

Nunca criar elementos que provoquem:

- rolagem horizontal
- quebra de layout
- textos cortados
- imagens distorcidas

---

# BOAS PRÁTICAS

Sempre:

- utilizar HTML semântico
- utilizar headings em ordem correta
- utilizar alt em imagens
- utilizar aria quando necessário
- manter indentação consistente
- utilizar nomes claros para classes e IDs
- manter o código organizado
- preservar comentários importantes

---

# O QUE A IA NUNCA DEVE FAZER

Nunca:

- alterar a identidade visual do projeto
- utilizar layouts diferentes do padrão
- criar Heroes centralizados
- utilizar containers com largura limitada
- utilizar max-width na estrutura principal
- remover elementos sem solicitação
- modificar arquivos não relacionados à tarefa
- alterar código que não foi solicitado
- criar estilos inconsistentes com o restante do projeto

---

# REGRA MÁXIMA

Toda nova página criada para este projeto deve parecer ter sido desenvolvida pelo mesmo designer responsável pela página **mapa-do-site.html**.

Toda página deve seguir obrigatoriamente a seguinte identidade visual:

Eyebrow

↓

H1 grande

↓

H2 pequeno

↓

Gradiente azul institucional

↓

Glassmorphism

↓

Hero compacto

↓

Largura total

↓

Layout 2/3 + 1/3

↓

Fonte Inter

↓

Shadow + Rounded

↓

Design moderno

↓

Design institucional

↓

Consistência absoluta

Se existir qualquer dúvida entre duas soluções de design, estrutura ou organização, a IA deve sempre escolher aquela que mais se aproxima do padrão estabelecido pela página **mapa-do-site.html**.

NAO USAR EMOJIS NA ELABORAÇÃO DAS PAGINAS HTML E DENTRO DO HEROCARD H1 NAO USAR ICONES SVG FONTAWESOME