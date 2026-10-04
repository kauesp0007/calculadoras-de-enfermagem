# Manual canônico de eventos e origem geográfica — GA4

Atualizado em: 4 de outubro de 2026  
Site: https://www.calculadorasdeenfermagem.com.br/  
Propriedade GA4 usada pelo painel: `522498030`

> Este arquivo deve ser consultado e atualizado por qualquer IA ou desenvolvedor que alterar eventos, métricas, o painel `metricas.html` ou a Edge Function `analytics-metrics`.

## 1. O que foi implantado

A página `metricas.html` possui uma área em tempo real que consulta a Google Analytics Data API pelo endpoint seguro:

`https://asjkftjfbkuuhilnqonx.supabase.co/functions/v1/analytics-metrics?mode=realtime`

A janela em tempo real cobre os últimos 30 minutos e atualiza automaticamente a cada 60 segundos. A credencial do Google permanece na Edge Function do Supabase e nunca é entregue ao navegador.

O painel mostra:

- usuários ativos;
- eventos;
- visualizações;
- países com atividade;
- grupos geográficos solicitados;
- eventos que estão ocorrendo naquele momento.

## 2. País não é nacionalidade

O GA4 informa o país de origem estimado a partir do endereço IP. Isso não comprova cidadania, nacionalidade, etnia, idioma materno ou local de residência.

Por isso, a interface usa os termos **origem geográfica estimada** e **país do acesso**. Não deve ser usada para classificar pessoas individualmente.

## 3. Grupos geográficos do painel

| Grupo exibido | Países/códigos considerados |
|---|---|
| Estados Unidos | US |
| América Latina e Caribe | AR, BO, BR, BZ, CL, CO, CR, CU, DO, EC, GF, GT, GY, HN, HT, MX, NI, PA, PE, PR, PY, SR, SV, UY, VE |
| Alemanha | DE |
| França | FR |
| Espanha | ES |
| Portugal | PT |
| China, Hong Kong e Macau | CN, HK, MO |
| Japão | JP |
| Rússia | RU |
| Itália | IT |
| Outros países | Todos os demais códigos retornados pelo GA4 |

Os grupos são exclusivamente agregados para visualização. O dado canônico continua sendo `countryId` (ISO 3166-1 alfa-2) e `country`, retornados pelo GA4.

## 4. Como ler uma linha de evento

- **Evento**: nome técnico da ação.
- **Usuários ativos**: pessoas/dispositivos distintos na tabela geográfica da janela.
- **Ocorrências**: quantas vezes cada evento foi registrado na tabela de eventos.
- Uma pessoa pode gerar várias ocorrências do mesmo evento.
- Eventos com zero usuários ou sem linha visível podem simplesmente não ter ocorrido nos últimos 30 minutos.
- Consentimento de Analytics negado impede o envio dos eventos não essenciais.

## 5. Eventos automáticos do GA4

| Evento | Significado |
|---|---|
| `page_view` | Uma página foi aberta ou o histórico de navegação gerou uma nova visualização. |
| `session_start` | Início de uma nova sessão. |
| `first_visit` | Primeira visita reconhecida naquele navegador/dispositivo. |
| `user_engagement` | O GA4 detectou a página ativa e algum tempo de engajamento. |
| `scroll` | O visitante alcançou aproximadamente 90% da página, quando a medição otimizada está ativa. |
| `click` | Clique de saída medido automaticamente, quando aplicável. |
| `file_download` | Clique em arquivo para download reconhecido pela medição otimizada. |

## 6. Eventos próprios do site

### Navegação

| Padrão/evento | Significado |
|---|---|
| `click_menu_*` | Clique em categoria, submenu ou ação do menu global. O sufixo identifica o item e pode terminar com o idioma, como `_en`, `_es` ou `_de`. |
| `click_menu_assine_ja` | Clique na chamada de assinatura do menu/conta. |
| `click_botao_conteudos_educaivos` | Clique no card de conteúdos educativos da página inicial. O nome contém o erro ortográfico histórico “educaivos”; não renomear sem plano de migração, para não dividir a série histórica. |
| `click_index_fugulin` | Clique no card da Escala de Fugulin na página inicial. |

### Calculadoras e escalas

| Padrão/evento | Significado |
|---|---|
| `click_calcular_*` | Clique no botão de calcular, gerar escore ou interpretar. O sufixo identifica a página, por exemplo `click_calcular_imc`, `click_calcular_cam`, `click_calcular_news`, `click_calcular_asa`. |
| `tempo_permanencia` | Tempo efetivamente visível acumulado antes de a página ser ocultada ou fechada. |

Parâmetros de `tempo_permanencia`:

| Parâmetro | Significado |
|---|---|
| `nome_pagina` | Nome do arquivo sem `.html`. |
| `caminho_pagina` | Caminho completo dentro do site. |
| `duracao_segundos` | Tempo visível em segundos. |
| `duracao_milisegundos` | Mesmo tempo em milissegundos. |
| `idioma` | Idioma da pasta/página. |
| `tipo_conteudo` | `formulario`, `escala`, `calculadora`, `blog`, `conta` ou `pagina`. |
| `titulo_pagina` | Título HTML da página. |

### Login e conta

| Evento | Significado |
|---|---|
| `click_botao_conta_google` | Clique para entrar com Google. |
| `click_botao_conta_microsoft` | Clique para entrar com Microsoft. |

### Assinatura e pagamentos

| Evento | Significado |
|---|---|
| `click_menu_assine_ja` | Clique na chamada “Assine já” que leva o usuário ao fluxo de assinatura. |
| `subscription_page_view` | A página central de assinatura foi aberta. |
| `subscription_login_required` | O usuário tentou prosseguir e precisou autenticar-se. |
| `subscription_login_completed` | Login concluído durante o fluxo de assinatura. |
| `subscription_post_login_redirect` | Redirecionamento após login para a assinatura ou para a home, sem PII. |
| `subscription_checkout_click` | Clique em um método de pagamento para iniciar a assinatura. |
| `subscription_checkout_request` | Requisição enviada à Edge Function para criar/reusar checkout. |
| `subscription_checkout_created` | Checkout criado ou reaproveitado com URL válida. |
| `subscription_checkout_redirect` | Navegador redirecionado ao checkout hospedado do Asaas/Stripe. |
| `subscription_payment_pending` | Fluxo de pagamento ainda pendente/reutilizado. |
| `subscription_checkout_cancel` | Retorno de checkout Stripe cancelado. |
| `subscription_payment_cancelled` | Pagamento/checkout cancelado no Asaas ou Stripe. |
| `subscription_payment_expired` | Cobrança Asaas expirada. |
| `subscription_payment_return_success` | Retorno do Stripe sinalizando sucesso. |
| `subscription_payment_success` | Página de boas-vindas aberta após pagamento confirmado. |
| `subscription_checkout_error` | Erro antes da criação/redirecionamento do checkout. |
| `subscription_page_error` | Falha de inicialização da página de assinatura. |

Parâmetros comuns do faturamento:

- `billing_flow`: atualmente `subscription`;
- `provider`: `asaas` ou `stripe`;
- `payment_status`: `success`, `cancel` ou `expired`;
- `lang`: idioma do fluxo;
- `page` ou `page_path`: página em que o retorno foi processado.

### Painel administrativo de 24 horas

A área autenticada `/conta/desenvolvedor.html` possui um card **Funil de assinatura — últimas 24 horas**. Ele consulta:

`https://asjkftjfbkuuhilnqonx.supabase.co/functions/v1/analytics-metrics?mode=subscription_24h`

Esse modo:

- consulta somente eventos de assinatura já existentes no GA4;
- usa a dimensão `dateHourMinute` para mostrar data e horário da última ocorrência e a atividade mais recente;
- retorna uma janela móvel de 24 horas no fuso de referência `America/Sao_Paulo`;
- não cria tabela, cookie, storage ou histórico paralelo;
- não exibe e-mail, nome, CPF ou qualquer identificador pessoal;
- mostra **ocorrências de evento**, portanto a quantidade não deve ser interpretada como pessoas únicas;
- deixa de exibir automaticamente ocorrências que ultrapassam 24 horas; não há rotina de exclusão porque o painel não persiste esses dados localmente;
- ao abrir `/conta/desenvolvedor.html`, ao restaurar a página pelo histórico do navegador e ao voltar para a aba, o painel solicita uma leitura nova com `mode=subscription_24h&fresh=1`, `cache: "no-store"` e um parâmetro anti-cache; essa variante ignora o cache interno de 60 segundos da Edge Function e responde com `Cache-Control: private, no-store`;
- a atualização periódica de 60 segundos continua ativa enquanto a página estiver visível.

Cancelamento/desistência só é mostrado quando existe evento explícito de cancelamento (`subscription_checkout_cancel` ou `subscription_payment_cancelled`). Não inferir abandono apenas porque não houve conversão.


## 7. Como interpretar prefixos e sufixos

Use esta leitura:

`click_calcular_news`

- `click`: tipo da ação;
- `calcular`: família funcional;
- `news`: página/recurso.

Exemplo internacional:

`click_menu_about_us_en`

- `click_menu`: clique no menu;
- `about_us`: item;
- `en`: idioma inglês.

## 8. Onde consultar no GA4

### Tempo real

1. Abra **Relatórios**.
2. Entre em **Tempo real**.
3. Observe “Contagem de eventos por nome do evento”.
4. Para depuração, use **Administrador → DebugView** com um navegador configurado para depuração.

### Relatórios históricos

1. Abra **Relatórios → Engajamento → Eventos**.
2. Selecione o evento.
3. Ajuste o período.
4. Compare usuários, contagem e parâmetros/dimensões disponíveis.

### Origem geográfica

1. Abra **Relatórios → Usuário → Atributos do usuário → Detalhes demográficos**.
2. Use a dimensão **País**.
3. Lembre-se: país é derivado do IP e não representa nacionalidade comprovada.

## 9. Regras para criar eventos novos

1. Use letras minúsculas, números e sublinhado.
2. Prefira nomes estáveis e autoexplicativos.
3. Não inclua e-mail, nome, telefone, CPF, dados clínicos ou qualquer dado pessoal no evento.
4. Reutilize as famílias existentes: `click_menu_*`, `click_calcular_*`, `subscription_*`.
5. Documente o evento neste arquivo no mesmo commit.
6. Teste consentimento negado e concedido.
7. Valide no DebugView/Tempo real antes de tratar o evento como produção.
8. Não renomeie eventos históricos sem registrar a migração; o GA4 exibirá as séries separadamente.

## 10. Arquivos canônicos

- `global-scripts.js`: captura eventos globais, tempo de permanência e retornos de pagamento.
- `metricas.html`: apresenta dados agregados e o painel em tempo real.
- `conta/desenvolvedor.html`: apresenta o funil agregado de assinatura das últimas 24 horas ao administrador autenticado.
- `supabase/functions/analytics-metrics/index.ts`: consulta segura às APIs Core e Realtime do GA4, inclusive o modo `subscription_24h`.
- `.github/workflows/deploy-analytics-metrics.yml`: publica e testa a Edge Function.

## 11. Limitações e privacidade

- O relatório em tempo real padrão cobre até 30 minutos.
- Pode existir atraso de alguns segundos entre a ação e sua aparição.
- Bloqueadores, consentimento negado, falhas de rede e restrições do navegador reduzem a contagem.
- Os números do painel são agregados; não devem ser usados para tentar identificar uma pessoa.
- O painel não cria uma dimensão personalizada de “nacionalidade”, pois o site não coleta declaração voluntária e essa inferência seria tecnicamente incorreta.
