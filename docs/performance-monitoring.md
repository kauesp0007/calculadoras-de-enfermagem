# Monitoramento de Performance — Core Web Vitals

Este documento explica como funciona a automação de performance do projeto e como interpretar, consultar e ajustar os resultados.

---

## Visão geral

O projeto usa duas camadas complementares de monitoramento:

| Camada | Ferramenta | Quando roda | O que mede |
|---|---|---|---|
| CI / Regressão | Lighthouse CI (`@lhci/cli`) | A cada PR e push na `main` | Simulação de usuário real em ambiente de teste |
| Usuários reais | `web-vitals` (CDN) | Sempre que a página carrega | Métricas reais dos visitantes via GTM/dataLayer |

---

## 1. Lighthouse CI (automação de regressão)

### Quando executa

O workflow `.github/workflows/lighthouse.yml` é disparado:

- Em todo `push` para a branch `main`
- Em todo `pull_request`

### O que ele faz

1. Clona o repositório.
2. Instala as dependências com `npm ci`.
3. Inicia um servidor estático embutido no LHCI (via `staticDistDir`).
4. Executa `lhci autorun` usando as configurações de `.lighthouserc.json`.
5. Faz upload dos relatórios para o **Lighthouse CI temporary public storage** (link exibido no log da action).

### Onde ver os resultados

- **Na action do GitHub Actions**: acesse a aba *Actions* → selecione a execução → veja o log da etapa *🔦 Executar Lighthouse CI*.
- **No link do relatório**: o próprio LHCI imprime no log um URL como `https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/...` — ele fica acessível por 13 dias.
- **Em PRs**: se o segredo `LHCI_GITHUB_APP_TOKEN` estiver configurado (veja abaixo), o LHCI posta automaticamente os resultados como comentário ou check no PR.

### Páginas auditadas

As páginas configuradas em `.lighthouserc.json` são:

```
http://localhost/           (página inicial)
http://localhost/apgar.html
http://localhost/braden.html
```

Para adicionar outras páginas, edite a lista `ci.collect.url` em `.lighthouserc.json`.

### Como interpretar os resultados

O LHCI exibe `✅ passed`, `⚠️ warned` ou `❌ failed` para cada asserção. O workflow usa `warn` para todas as métricas, então uma regressão **não bloqueia** o merge por padrão — ela apenas avisa.

Para tornar uma métrica **bloqueante**, troque `"warn"` por `"error"` na asserção correspondente em `.lighthouserc.json`.

---

## 2. Limites e thresholds (`.lighthouserc.json`)

Os valores padrão seguem as recomendações do Google para Core Web Vitals:

| Métrica | Limite (warn) | Referência Google |
|---|---|---|
| LCP — Largest Contentful Paint | ≤ 2 500 ms | Bom: ≤ 2.5 s |
| INP / TBT — Total Blocking Time | ≤ 200 ms | Bom: ≤ 200 ms |
| CLS — Cumulative Layout Shift | ≤ 0.10 | Bom: ≤ 0.1 |
| FCP — First Contentful Paint | ≤ 1 800 ms | Bom: ≤ 1.8 s |
| TTI — Time to Interactive | ≤ 3 800 ms | Bom: ≤ 3.8 s |
| Speed Index | ≤ 3 400 ms | — |
| Score de Performance | ≥ 0.75 | — |
| Score de Acessibilidade | ≥ 0.90 | — |
| Score de SEO | ≥ 0.90 | — |

### Como ajustar

Edite `.lighthouserc.json`. Exemplo para tornar o LCP bloqueante com limite mais rigoroso:

```json
"largest-contentful-paint": ["error", { "maxNumericValue": 2000 }]
```

---

## 3. Integração com GitHub (opcional)

Para que o LHCI poste resultados diretamente no PR, configure o **Lighthouse CI GitHub App**:

1. Instale o app em: <https://github.com/apps/lighthouse-ci>
2. Após instalar, o app fornecerá um token.
3. Adicione o token como segredo no repositório: **Settings → Secrets → Actions → New repository secret**
   - Nome: `LHCI_GITHUB_APP_TOKEN`
   - Valor: o token gerado pelo app

Sem esse segredo o LHCI ainda funciona normalmente — apenas não posta comentários automáticos.

---

## 4. Métricas de usuários reais (`js/web-vitals-reporter.js`)

O arquivo `js/web-vitals-reporter.js` usa a biblioteca oficial [`web-vitals`](https://github.com/GoogleChrome/web-vitals) (já presente em `package.json`) para capturar **métricas reais** dos visitantes.

### Como ativar

Inclua o script em qualquer página HTML, de preferência logo após o carregamento do GTM:

```html
<script src="/js/web-vitals-reporter.js" defer></script>
```

### O que ele faz

- Carrega `web-vitals` via CDN (`unpkg.com/web-vitals@5`).
- Coleta: **LCP**, **INP**, **CLS**, **FCP**, **TTFB**.
- Em desenvolvimento (`localhost`): imprime no console do navegador.
- Em produção: envia os dados para o `window.dataLayer` (Google Tag Manager).

### Estrutura do evento GTM

```javascript
{
  event: 'web_vital',
  metric_name: 'LCP',        // nome da métrica
  metric_id: 'v4-...',       // ID único da medição
  metric_value: 1234,        // valor em ms (CLS é multiplicado por 1000)
  metric_rating: 'good',     // 'good' | 'needs-improvement' | 'poor'
  metric_delta: 1234,        // variação desde a última medição
  metric_navigationType: 'navigate'
}
```

No GTM, crie uma **tag GA4 Event** acionada pelo acionador `web_vital` e use as variáveis de camada de dados acima para enviar ao Google Analytics.

---

## 5. Referências

- [Google Core Web Vitals](https://web.dev/vitals/)
- [Lighthouse CI — documentação oficial](https://github.com/GoogleChrome/lighthouse-ci)
- [web-vitals npm](https://github.com/GoogleChrome/web-vitals)
- [Lighthouse CI GitHub App](https://github.com/apps/lighthouse-ci)
