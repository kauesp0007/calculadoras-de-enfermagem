# Checklist — Nova Calculadora/Escala

## Estrutura da página
- [ ] `<main>` com `class="flex-grow p-4 sm:p-8"`.
- [ ] Largura total da viewport (sem `container`, `max-w-*`, `mx-auto` no container principal).
- [ ] Ordem do `<head>` conforme `HTML_PAGE_TEMPLATE_RULES.md`: charset/viewport →
      DNS/preconnect → title/metas → critical fonts → CSS → preload de fontes →
      canonical/hreflang → favicon → Schema.org → styles → IconTopBar preload →
      anti-CLS placeholders → scripts globais → anti-CLS acessibilidade.
- [ ] Canonical + hreflang (cluster completo com x-default).
- [ ] Schema.org adequado (SoftwareApplication / MedicalWebPage).
- [ ] Anti-CLS placeholders (`global-header-container`, `language-selector-placeholder`,
      `footer-placeholder`).

## Hero card
- [ ] Width 100%, alinhado à esquerda, altura compacta.
- [ ] Gradiente azul institucional (`#1A3E74 → #1E4D8C → #163269`).
- [ ] Hierarquia Eyebrow → H1 → H2 (nunca inverter).
- [ ] SEM `max-w-*`/`mx-auto` no hero.

## Ferramenta (calculadora/escala)
- [ ] Card de dados do paciente.
- [ ] Formulário dividido em cards individuais.
- [ ] Barra de progresso por card + cores progressivas (verde → vermelho).
- [ ] Badges dos cards geradas por JavaScript.
- [ ] Botões Calcular e Limpar.
- [ ] Hero de resultado + grid de memória + avaliação clínica + diagnósticos NANDA sugeridos.

## Impressão e PDF
- [ ] Modelo `meem.html`: `btnGerarPDF` (jsPDF) + `btnImprimir` (`imprimirLaudo()`).
      (Páginas de texto/artigo: modelo `integracoes_classificacao_wifi.html` — só `btnImprimir`.)

## Final
- [ ] Seção de Referências Bibliográficas ao final, com `data-references-section="v1"`.
- [ ] Nota de transparência de governança imediatamente após as referências, com `data-governance-disclosure="v1"` e `data-professional-review="required"`, texto legível e limites explícitos sobre IA, fontes, LGPD e conformidade formal.
- [ ] Revisão prévia registrada no fluxo editorial por profissional de enfermagem habilitado e em atividade.
- [ ] Footer: raiz usa `fetch("/footer.html")` + `carregarTraducoes`; idiomas usam `fetch("footer.html")`.
- [ ] Build executado (tailwind + `node gerar-sw.js`).
- [ ] Testado no navegador e acessibilidade auditada.
