# GA4 — Tempo de permanência nas páginas

## Objetivo

Registrar um evento `tempo_permanencia` no encerramento da visualização de uma página, usando o tempo em que a página permaneceu visível em primeiro plano.

A implementação é global e está em `global-scripts.js`. Não é necessário inserir código individual nas páginas ou nos 18 `menu-global.html`.

## Evento

**Nome:** `tempo_permanencia`

### Parâmetros enviados

| Parâmetro | Tipo | Finalidade |
|---|---|---|
| `nome_pagina` | texto | Nome da página sem `.html` |
| `caminho_pagina` | texto | Caminho da URL |
| `duracao_segundos` | número inteiro | Tempo visível acumulado em segundos |
| `duracao_milisegundos` | número inteiro | Tempo visível acumulado em milissegundos |
| `idioma` | texto | Código do idioma detectado pelo site |
| `tipo_conteudo` | texto | `escala`, `formulario`, `calculadora`, `blog`, `conta` ou `pagina` |
| `titulo_pagina` | texto | Título atual do documento |

## Regras de coleta

- O tempo começa quando a página está visível.
- Quando a aba fica oculta, o tempo é pausado.
- Quando a página volta a ficar visível, o contador continua.
- O evento é enviado uma única vez por carregamento da página, no `pagehide`.
- Permanências inferiores a 1 segundo não são registradas.
- O envio respeita `analytics_storage`; se o consentimento estiver negado, o evento não é enviado.
- A implementação mantém uma fila `gtag/dataLayer` mesmo quando o carregamento do GA4 ainda estiver em modo lazy.

## Dados que não são duplicados

Cidade, país, região, data/hora e origem do tráfego não precisam ser enviados como parâmetros próprios. O GA4 possui dimensões automáticas para geografia, página e aquisição e associa esses dados ao evento quando disponíveis.

## Configuração recomendada no GA4

Depois que o evento aparecer no relatório Tempo real:

1. Acesse **Administrador → Definições personalizadas**.
2. Crie uma **métrica personalizada** para `duracao_segundos`.
3. Unidade: **Tempo → Segundos**.
4. Crie dimensões personalizadas no escopo de evento para:
   - `nome_pagina`
   - `idioma`
   - `tipo_conteudo`
5. `caminho_pagina` e `titulo_pagina` podem ser analisados também pelas dimensões padrão do GA4; as versões personalizadas permanecem disponíveis para o evento.

## Análises possíveis

Exemplos:

- tempo médio por escala;
- tempo médio por calculadora;
- tempo por idioma;
- tempo por país;
- tempo por cidade;
- tempo por origem de tráfego;
- tempo por página Premium;
- comparação entre formulários e escalas;
- páginas com muitas visualizações e baixa permanência.

O evento não substitui a métrica nativa de **Tempo médio de engajamento** do GA4; ele acrescenta uma medição própria, por página, com duração explicitamente enviada pelo site.
