# PADRÃO OFICIAL DE HTML

Versão: 1.0

Este documento define como TODO HTML do projeto deve ser escrito.

Todas as páginas futuras deverão seguir exatamente este padrão.

---

# OBJETIVO

Gerar HTML:

• limpo

• semântico

• reutilizável

• acessível

• otimizado para SEO

• otimizado para Core Web Vitals

---

# ESTRUTURA

Toda página deve possuir:

<!DOCTYPE html>

↓

<html>

↓

<head>

↓

<body>

↓

scripts finais

Nunca alterar esta ordem.

---

# HTML

Sempre utilizar HTML5.

Nunca utilizar tags obsoletas.

---

# SEMÂNTICA

Sempre utilizar:

header

main

section

article

aside

footer

nav

figure

figcaption

Nunca utilizar excesso de divs.

---

# HIERARQUIA

A página deve possuir apenas um:

<h1>

Nunca utilizar dois H1.

---

Subtítulos

H2

↓

H3

↓

H4

Nunca pular níveis.

---

# SEO

Toda página deve possuir:

title

meta description

canonical

robots

hreflang

Open Graph

Twitter Cards

JSON-LD quando aplicável.

---

# IMAGENS

Toda imagem deve possuir:

alt

width

height

loading

decoding

Exemplo

loading="lazy"

decoding="async"

Nunca deixar ALT vazio sem motivo.

---

# WEBP

Sempre priorizar imagens WEBP.

PNG apenas quando necessário.

SVG para ícones vetoriais.

---

# CSS

Nunca utilizar CSS inline.

Exemplo proibido

style="..."

Todo CSS deve ficar em:

global-styles.css

ou

output.css

---

# JAVASCRIPT

Nunca escrever JavaScript inline.

Todo script deve estar em arquivo separado.

---

# MODULARIZAÇÃO

Sempre reutilizar componentes.

Nunca duplicar:

header

footer

menu

language selector

componentes globais

---

# RESPONSIVIDADE

Mobile First.

Sempre utilizar:

Flexbox

Grid

Tailwind

---

# ACESSIBILIDADE

Toda página deve possuir:

lang

labels

alt

aria-label quando necessário

contraste adequado

navegação por teclado

---

# LINKS

Todo link externo deve possuir:

rel="noopener"

quando abrir nova aba.

---

# FORMULÁRIOS

Todo input deve possuir:

label

id

name

placeholder quando necessário.

---

# TABELAS

Sempre utilizar:

thead

tbody

th

caption quando necessário.

Nunca utilizar tabelas para layout.

---

# BOTÕES

Sempre utilizar:

<button>

Nunca utilizar div simulando botão.

---

# ÍCONES

Priorizar SVG.

Evitar PNG para pequenos ícones.

---

# COMPONENTES

Todo componente reutilizável deve possuir:

estrutura consistente

classes padronizadas

comentários apenas quando necessários

---

# PERFORMANCE

Evitar:

DOM muito grande

CSS duplicado

JavaScript desnecessário

imagens maiores que o necessário

---

# CLS

Sempre reservar espaço para:

imagens

banners

anúncios

iframes

Nunca permitir Layout Shift.

---

# LAZY LOAD

Utilizar lazy loading para:

imagens

iframes

componentes pesados

Exceto elementos acima da dobra.

---

# HEAD

Priorizar:

charset

viewport

title

description

canonical

hreflang

CSS

preload

preconnect

scripts críticos

---

# NOMES DAS CLASSES

Utilizar nomes claros.

Evitar:

box1

item2

div3

---

# PADRÃO VISUAL

Seguir exatamente o padrão visual já existente no site.

Nunca criar um novo padrão sem autorização.

---

# GERAÇÃO AUTOMÁTICA

Quando gerar HTML automaticamente:

seguir rigorosamente este documento.

Nunca gerar HTML diferente do padrão oficial do projeto.

---

# REGRA FINAL

Antes de gerar qualquer HTML:

1. Ler PROMPT_MASTER.md

2. Ler ARQUITETURA.md

3. Ler RULES.md

4. Ler PADROES_HTML.md

Depois gerar o HTML.