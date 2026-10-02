# Manual Técnico: Construção de Páginas HTML para Hospedagem e Visualização de PDFs a 100%

> **Calculadoras de Enfermagem** — *Memória Técnica e Manual de Engenharia para IAs e Desenvolvedores*  
> **Módulo:** Etapa 2 — Criação de Páginas Web de Formulários em Branco  
> **Páginas de Referência:** `formulario_de_fugulin.html` e `formulario_escala_de_downton.html`  
> **Status:** Canônico e Obrigatório

---

## 1. Visão Geral e Justificativa Arquitetural

No ecossistema do portal **Calculadoras de Enfermagem**, os arquivos PDF não são servidos como meros arquivos estáticos soltos para download direto. Cada documento PDF possui uma **página web HTML dedicada** localizada na raiz do portal (ex: `formulario_escala_de_aldrete.html`).

### Por que essa camada HTML é obrigatória?
1. **SEO e Descoberta Orgânica:** Mecanismos de busca (Google, Bing) indexam páginas HTML com metatags ricas, Schema.org e Open Graph de forma infinitamente superior a arquivos PDF crus.
2. **Experiência de Beira-Leito Imediata:** O profissional de enfermagem pode visualizar o formulário integralmente aberto na tela do celular, tablet ou computador do posto de enfermagem antes de decidir imprimir.
3. **Conversão e Retenção:** A página oferece a barra de navegação global, trilha de migalhas (*breadcrumbs*), botão de impressão nativa (`window.print()`), botão de download estilizado e links para calculadoras interativas correlatas.
4. **Rentabilização Sustentável:** Permite a exibição controlada de blocos de anúncios multiplex e display sem degradar os Core Web Vitals (CLS = 0).

---

## 2. Nomenclatura e Localização dos Arquivos

* **Página HTML:** Deve ser salva na **raiz do repositório** com o mesmo nome do PDF correspondente:  
  `C:\calculadoras-de-enfermagem\formulario_escala_de_[nome].html`
* **Arquivo PDF Vinculado:** Localizado na pasta de ativos públicos de formulários:  
  `C:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\formulario_escala_de_[nome].pdf`
* **Caminho Relativo no HTML:** Sempre referenciado com barra absoluta inicial:  
  `/FORMULARIOS_DE_ESCALAS/formulario_escala_de_[nome].pdf`

---

## 3. Anatomia do Head Canônico (Ordem Rígida Obrigatória)

O `<head>` da página segue o padrão canônico estabelecido em `CATALOGO_SEO_METAS_HEAD/` e `HTML_PAGE_TEMPLATE_RULES.md`. A ordem dos blocos **NUNCA DEVE SER ALTERADA**, pois garante zero deslocamento de layout (CLS), renderização crítica de fontes e alta pontuação no Google Lighthouse.

### Sequência Exata dos Blocos no Head:

1. **Charset e Viewport:**
   ```html
   <meta charset="utf-8"/>
   <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
   ```

2. **DNS Prefetch e Preconnects (Otimização AdSense):**
   ```html
   <link href="//googleads.g.doubleclick.net" rel="dns-prefetch"/>
   <link href="//pagead2.googlesyndication.com" rel="dns-prefetch"/>
   ```

3. **SEO Title e Metatags Primárias:**
   - `title`: Padrão: `Formulário da [Nome da Escala] para Imprimir - Calculadoras de Enfermagem` (55 a 65 caracteres).
   - `theme-color`: `#1A3E74` (Azul Institucional).
   - `description`: 145 a 160 caracteres, descrevendo o objetivo clínico e o formato A4.
   - `keywords`: Termos em enfermagem, avaliação clínica, hospitalar e impressão.
   - `author`: `Calculadoras de Enfermagem`.
   - `robots`: `index, follow, max-snippet:320, max-image-preview:large, max-video-preview:-1`.

4. **Metas Sociais (Open Graph e Twitter Card):**
   - `og:locale`: `pt_BR`.
   - `og:type`: `article`.
   - `og:title`, `og:description`, `og:url` (URL canônica da página).
   - `og:image`: `https://www.calculadorasdeenfermagem.com.br/iconpages-calculadoras-de-enfermagem.webp` (1280x720).
   - `twitter:card`: `summary_large_image`.
   - `twitter:site` e `twitter:creator`: `@calculadorasdeenf`.

5. **Fontes Críticas Inline (`@font-face`):**
   - A declaração `@font-face` da família **Inter** (pesos 400, 600, 700 e 900) DEVE estar embutida inline na tag `<style id="critical-fonts">` com `font-display: swap; size-adjust: 98%`.
   - Em seguida, linkar `/public/output.css` e `/global-styles.css`.

6. **Preload de Fontes WOFF2 Locais:**
   ```html
   <link as="font" crossorigin="" href="/fonts/inter/inter-regular.woff2" rel="preload" type="font/woff2"/>
   <link as="font" crossorigin="" href="/fonts/inter/inter-600.woff2" rel="preload" type="font/woff2"/>
   <link as="font" crossorigin="" href="/fonts/inter/inter-700.woff2" rel="preload" type="font/woff2"/>
   <link as="font" crossorigin="" href="/fonts/inter/inter-900.woff2" rel="preload" type="font/woff2"/>
   ```

7. **SEO Internacional (Canonical e Hreflang):**
   - `<link rel="canonical" href="https://www.calculadorasdeenfermagem.com.br/[slug].html"/>`
   - `<link rel="alternate" hreflang="pt-br" href="https://www.calculadorasdeenfermagem.com.br/[slug].html"/>`
   - `<link rel="alternate" hreflang="x-default" href="https://www.calculadorasdeenfermagem.com.br/[slug].html"/>`

8. **Favicon:**
   - `<link href="/favicon.ico" rel="icon" type="image/x-icon"/>`

9. **Schema.org JSON-LD (Grafo Estruturado):**
   - Grafo unificado contendo os nós:
     - `Organization`: Calculadoras de Enfermagem (com redes sociais).
     - `WebSite`: Calculadoras de Enfermagem (`inLanguage: pt-BR`).
     - `WebPage`: Página do formulário, contendo `about` com `@type: MedicalWebPage` e `aspect` com os termos de enfermagem da escala.
     - `BreadcrumbList`: Início ➔ Formulários ➔ Formulário da Escala.
     - `ImageObject`: Imagem representativa do portal.

10. **Estilos Específicos da Página (`<style>`):**
    - Definição das variáveis de paleta institucional (`--navy`, `--navy-2`, `--navy-3`, `--navy-deep`, `--ink`, `--slate-*`, `--bg`, `--line`, `--blue`, `--sky`, `--radius`, `--shadow-*`).
    - Estrutura fluida de largura 100% (`.main-content` sem restrições de container centralizado estreito).
    - Hero institucional com gradiente navy:  
      `background: linear-gradient(135deg, #1E407C 0%, #1E5A91 55%, #1A4C7A 100%)`.
    - Barra de ações (`.actionbar`) com botão de impressão rápida e botão de download.
    - O container `.pdf-frame-wrap` calibrado para folha A4.
    - O botão de download estilizado em vidro azul (`.btn-download-glass`).

11. **Placeholders Anti-CLS e Preload de Topbar:**
    - `<link rel="preload" href="/img/icontopbar1-calculadoras-de-enfermagem.webp" as="image" type="image/webp" fetchpriority="high">`
    - `<style id="anti-cls-placeholders">`: Reserva estática de altura para `#global-header-container` (`min-height: 96px`, mobile `60px`), `#language-selector-placeholder` (`min-height: 46px`) e `#footer-placeholder` (`min-height: 520px`, desktop `277px`).

12. **Scripts Globais Diferidos (`defer`):**
    - `/global-scripts.js` (carrega cabeçalho e rodapé modular, progress bar e utilitários).
    - `/lang-selector.js` (seletor dinâmico de 18 idiomas).
    - Script inline `anti-cls-acessibilidade` (aplica tamanho de fonte e dark-mode salvos em localStorage antes da pintura da tela).

---

## 4. A Arquitetura do Visualizador de PDF Aberto em 100%

O núcleo da página é o visualizador incorporado que exibe o formulário em alta fidelidade vetorial sem depender de plugins pesados de terceiros.

### 4.1. O Container A4 Proporcional (`.pdf-frame-wrap`)
A proporção internacional do padrão ISO 216 para papel A4 é de **210 mm de largura por 297 mm de altura** (relação aproximada de `1 : 1.4142`).

Para que o formulário apareça exatamente no formato de uma folha de papel na tela, utilizamos a propriedade CSS nativa `aspect-ratio`:

```css
.pdf-section {
    margin-top: 18px;
}
.pdf-frame-wrap {
    width: 100%;
    aspect-ratio: 210 / 297; /* Proporção exata da folha A4 */
    background: #ffffff;
    border: 1px solid var(--slate-300);
    border-radius: 14px;
    overflow: hidden;
    box-shadow: var(--shadow-md);
}
.pdf-frame {
    display: block;
    width: 100%;
    height: 100%;
    border: 0;
    background: #ffffff;
}
```

### 4.2. A Tag `<iframe>` Incorporada
Dentro do container, injetamos a tag `<iframe>` apontando diretamente para o arquivo PDF:

```html
<section id="pdf-view" class="card pdf-section" aria-labelledby="pdf-title">
  <div class="card-head no-print">
    <h3 id="pdf-title">Visualização do Formulário em Branco</h3>
  </div>
  <div class="card-body">
    <div class="pdf-frame-wrap">
      <iframe class="pdf-frame" 
              src="/FORMULARIOS_DE_ESCALAS/formulario_escala_de_aldrete.pdf" 
              title="Visualização integral do formulário da Escala de Aldrete" 
              loading="lazy"></iframe>
    </div>
    <p class="pdf-caption no-print">
      Documento PDF original em A4 de alta definição. Você pode visualizar acima ou realizar o download para impressão.
    </p>
  </div>
</section>
```

### Benefícios dessa Abordagem:
* **Renderização Vetorial Nativa:** O leitor de PDF embutido do navegador (Chrome PDF Viewer, Edge PDF Engine, Firefox PDF.js) renderiza textos, tabelas e SVGs em resolução infinita, permitindo zoom sem pixelização.
* **Leveza Extrema:** Não sobrecarrega a CPU do cliente com bibliotecas pesadas de JavaScript; a pintura é acelerada por hardware.
* **Comportamento Responsivo:** Em dispositivos móveis, a largura de 100% ajusta-se à tela do celular mantendo a proporção vertical da folha.


---

## 5. O Botão de Download em Vidro Azul (`.btn-download-glass`)

Para incentivar o download do arquivo original e proporcionar um toque moderno e sofisticado (Design System institucional), foi criado o componente **Glassmorphism Button**:

```css
.downloads-zone {
    padding: 22px 0 6px;
    text-align: left;
}
.btn-download-glass {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    font-weight: 800;
    color: #ffffff;
    padding: 14px 26px;
    border-radius: 16px;
    text-decoration: none;
    background: linear-gradient(135deg, rgba(30, 64, 124, 0.92), rgba(30, 90, 145, 0.88));
    border: 1px solid rgba(147, 197, 253, 0.45);
    box-shadow: 0 12px 30px -8px rgba(30, 64, 124, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.28);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    transition: transform 0.18s, box-shadow 0.18s;
}
.btn-download-glass:hover {
    transform: translateY(-2px);
    box-shadow: 0 16px 38px -8px rgba(30, 64, 124, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.32);
    text-decoration: none;
}
.btn-download-glass:focus-visible {
    outline: 3px solid #93c5fd;
    outline-offset: 2px;
}
.btn-download-glass svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
}
.btn-download-glass small {
    display: block;
    font-size: 10.5px;
    font-weight: 600;
    opacity: 0.85;
}
```

O HTML correspondente:
```html
<div class="downloads-zone no-print">
  <a href="/FORMULARIOS_DE_ESCALAS/formulario_escala_de_aldrete.pdf" download class="btn-download-glass">
    <svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
    <div>
      <span>Baixar Formulário da Escala de Aldrete</span>
      <small>Arquivo PDF Original • 1 Página A4 • Gratuito</small>
    </div>
  </a>
</div>
```

---

## 6. Arquitetura do Sistema de Contas: Shell Público vs. Conteúdo Protegido

No portal, algumas páginas de formulários funcionam em regime de **Conteúdo Premium Protegido** gerenciado por `js/access/premium-content-loader.js`.

### Como Funciona a Divisão:
1. **O Shell Público no Repositório:**  
   O arquivo físico na raiz do site (`formulario_de_fugulin.html`) contém o `<head>` completo (para que os robôs do Google indexem os metadados e o Schema.org) e um `<body>` com:
   ```html
   <script src="/js/access/premium-content-loader.js" defer></script>
   </head>
   <body>


---

## 8. Protocolo de Tradução e Internacionalização de Formulários Web (Etapa 2 em Idiomas Específicos)

Quando a Etapa 2 for executada para um idioma internacional do repositório (ex.: Inglês em `en/`, Espanhol em `es/`, etc.), as seguintes regras devem ser rigorosamente seguidas por desenvolvedores e Inteligências Artificiais:

### 8.1. Regra de Manutenção do Nome do Arquivo (Nomenclatura Idêntica)
* 🛑 **NÃO TRADUZA O NOME DO ARQUIVO HTML!**
* Se o formulário em português é `formulario_escala_de_aldrete.html`, a versão em inglês na pasta `en/` **DEVE** chamar-se rigorosamente `en/formulario_escala_de_aldrete.html`.
* **Justificativa Arquitetural:** Isso garante o funcionamento transparente do seletor dinâmico de 18 idiomas (`lang-selector.js`) e o mapeamento biunívoco de tags `hreflang`.

### 8.2. Mapeamento do PDF Vinculado
* O arquivo PDF exibido no `<iframe>` e baixado pelos botões deve apontar para o PDF traduzido dentro da pasta do idioma:
  - Exemplo para Inglês: `/FORMULARIOS_DE_ESCALAS/EN/formulario_escala_de_aldrete.pdf`

### 8.3. Terminologia Clínica Nativa (Sem Tradução Literal)
* É **terminantemente proibido** utilizar traduções literais mecânicas.
* Consulte a literatura médica internacional e terminologias padrão (NANDA, NIC/NOC, MeSH, PubMed, ASA, AHA, NIH) para utilizar os nomes oficiais consagrados em inglês americano:
  - *Escala de Aldrete* ➔ **Aldrete and Kroulik Score (PACU)**
  - *Escala de Braden* ➔ **Braden Scale for Pressure Injury Risk**
  - *Atividades de Vida Diária* ➔ **Activities of Daily Living (ADLs)**
  - *Risco de Queda* ➔ **Fall Risk Assessment**

### 8.4. Tradução Completa da Interface do Usuário (UI) e Metatags SEO
* **Atributos de Idioma e SEO:**
  - `lang="en-US"`
  - `<meta property="og:locale" content="en_US" />`
  - `<link rel="alternate" hreflang="en" href="https://www.calculadorasdeenfermagem.com.br/en/[slug].html"/>`
  - `<link rel="canonical" href="https://www.calculadorasdeenfermagem.com.br/en/[slug].html"/>`
* **Botões e Componentes Interativos:**
  - `Imprimir Ficha` ➔ **Print Form**
  - `Baixar PDF` ➔ **Download PDF**
  - `Instruções de Uso Clínico` ➔ **Clinical Use Instructions**
  - `Visualização do Formulário em Branco` ➔ **Blank Form Preview**
  - `Arquivo PDF Original • 1 Página A4 • Gratuito` ➔ **Original PDF File • 1 A4 Page • Free Download**
  - `Referência Científica:` ➔ **Scientific Reference:**

### 8.5. Passo a Passo Completo de Registro no Ecossistema
1. **Gerar a página HTML traduzida:** Salve o arquivo em `[idioma]/formulario_escala_de_[nome].html`.
2. **Atualizar o Menu do Idioma:** Adicione o link no menu global do idioma (ex.: `en/menu-global.html`) sob o submenu *Calculators > Blank Scale Forms for Printing*.
3. **Registrar em relatorio_paginas.txt:** Adicione o caminho do arquivo (ex.: `en/formulario_escala_de_aldrete.html`) na lista oficial de páginas do repositório.
4. **Build e Service Worker:** Invoque a compilação do Tailwind CSS e a atualização do Service Worker (`node gerar-sw.js`).
5. **Validação Determinística:** Execute os validadores do ecossistema para confirmar zero links quebrados e total conformidade.

   <div id="premium-content-placeholder" aria-live="polite">Carregando conteúdo protegido…</div>
   </body>
   </html>
   ```
2. **O Conteúdo Completo (Catálogo Supabase / Renderização Aberta):**  
   Quando o usuário autenticado acessa a rota, o script `premium-content-loader.js` faz uma requisição autenticada ao Supabase Edge Function (`premium-content`), que devolve o HTML completo com o visualizador de PDF aberto em 100%.
3. **Páginas Abertas Diretas:**  
   Para páginas onde o acesso é 100% público e imediato, o código do visualizador, breadcrumbs, hero e botão de download é inserido diretamente no `<body>`, mantendo o mesmo padrão visual.

---

## 7. Integração Obrigatória ao Menu Global (`menu-global.html`)

Toda nova página de formulário criada DEVE ser incorporada no menu de navegação global para permitir a descoberta direta pelos usuários.

### Localização Canônica no Menu Desktop:
No arquivo `menu-global.html`, sob o submenu `Calculadoras` ➔ `Formulários em Branco de Escalas para Imprimir`:
```html
<!-- Submenu: Formulários em Branco -->
<li class="relative group/sub">
  <a href="/formularios-em-branco-de-escalas.html" class="block px-4 !py-0.5 text-gray-700 hover:bg-gray-100 flex items-center justify-between whitespace-nowrap">
    Formulários em Branco de Escalas para Imprimir ...
  </a>
  <ul class="absolute hidden group-hover/sub:block bg-white shadow-lg rounded-md py-1 w-72 z-40 top-0 left-full scrollable-submenu max-h-[70vh] overflow-y-auto">
    <!-- Adicionar o novo formulário em ordem alfabética ou cronológica -->
    <li><a href="/formulario_escala_de_[nome].html" class="block px-4 !py-0.5 text-gray-700 hover:bg-gray-100">Formulário da Escala de [Nome]</a></li>
  </ul>
</li>
```

---

## 8. Registro Canônico de Governança

Para manter a integridade do catálogo do site:
1. **`relatorio_paginas.txt`:** É a fonte única canônica do inventário de rotas do site. Toda página HTML nova DEVE ter seu nome de arquivo adicionado a esta lista.
2. **NUNCA editar `mapa-do-site.html` manualmente:** Esse arquivo é gerado de forma autônoma por script a partir do `relatorio_paginas.txt`.

---

## 9. Build e Auditorias Obrigatórias (Contra-Prova Técnica)

Após criar ou atualizar páginas HTML de formulários, é impositivo rodar os validadores determinísticos:

```bash
# 1. Compilação do CSS do Tailwind
node node_modules/tailwindcss/lib/cli.js -i ./src/input.css -o ./public/output.css --minify

# 2. Regeneração do Service Worker com os novos hashes
node gerar-sw.js

# 3. Auditoria do Ecossistema e Links
node scripts/auditar-ecossistema.js
node scripts/auditar-cwv.js
node scripts/fix-broken-links.js
```

