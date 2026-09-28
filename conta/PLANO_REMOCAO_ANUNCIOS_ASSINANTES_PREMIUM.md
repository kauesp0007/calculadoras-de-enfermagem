# Plano Canônico — Remoção de anúncios para assinantes Premium

**Data:** 28/09/2026  
**Repositório:** `kauesp0007/calculadoras-de-enfermagem`  
**Objetivo:** fazer com que um assinante com **entitlement Premium válido** navegue pelo site sem carregar nem exibir anúncios do Google AdSense, sem criar um novo plano comercial, sem criar uma segunda autoridade de conta/billing e sem reativar qualquer mecanismo legado.

> Este documento é a **receita de bolo operacional** desta mudança. Antes de alterar código de conta, assinatura, autorização ou publicidade, ele deve ser lido junto do contrato canônico `.github/instructions/ecossistema-login-assinaturas.instructions.md`.

---

## 1. Resultado funcional esperado

O catálogo comercial continua tendo somente:

- `free`
- `premium`

O Premium **não será transformado em um terceiro plano** chamado `ad-free`. A ausência de anúncios será uma **capacidade derivada do entitlement Premium válido**.

Comportamento:

| Estado real | AdSense |
|---|---|
| visitante não autenticado | permitido, respeitando consentimento |
| usuário autenticado Free | permitido, respeitando consentimento |
| usuário Premium com entitlement válido | **não carregar e não exibir AdSense** |
| Premium expirado | permitido, respeitando consentimento |
| billing não resolvido / indisponível | **não carregar AdSense até resolver** |
| consentimento publicitário negado | bloqueado |
| páginas já excluídas de publicidade (conta/login etc.) | bloqueado |

A decisão Premium **não** poderá vir de:

- `localStorage.plan`;
- cookies de plano;
- query string;
- callback de checkout;
- Firestore;
- `admin_mode`;
- qualquer plano legado;
- qualquer módulo legado de “premium sem anúncios”.

---

## 2. Autoridades que devem permanecer intactas

A cadeia atual não será reconstruída:

**Firebase Authentication**  
→ identidade do usuário  
→ **Supabase billing-access**  
→ `billing_identities`  
→ `billing_subscriptions`  
→ `user_entitlements`  
→ estado comercial atual  
→ frontend decide somente se deve **carregar ou não o AdSense**.

A autoridade continua sendo o backend/Supabase. O navegador somente consome o resultado autenticado.

O `global-scripts.js` continua sendo o **único ponto de carregamento do AdSense**.

Não criar uma segunda cadeia de autenticação somente para anúncios.

---

## 3. Regra de decisão da publicidade

A decisão deve ser feita nesta ordem:

1. identificar o usuário com o Firebase Authentication canônico;
2. consultar o estado comercial pelo mesmo `Auth` atual;
3. confirmar que o billing está resolvido;
4. confirmar `plan = premium`;
5. confirmar que `premium_expires_at` existe, é uma data válida e é futura;
6. somente então considerar o usuário inelegível para AdSense;
7. para Free/visitante, manter o carregamento normal do AdSense, condicionado ao consentimento.

A fonte do estado é a mesma utilizada hoje por `billing-access` e `Auth.billingStatus()`.

Não introduzir uma tabela, RPC, endpoint ou cache de “usuário sem anúncios”.

### 3.1 Implementação atual e invariantes

A implementação canônica reside no bloco de publicidade do `global-scripts.js`.

Invariantes obrigatórios:

- `Auth.billingStatus()` é a única fonte frontend usada para decidir o benefício;
- `plan === "premium"` sozinho não basta: `premium_expires_at` precisa existir, ser uma data válida e estar no futuro;
- enquanto o billing autenticado não estiver resolvido, o AdSense permanece desligado (fail-closed);
- visitante sem sessão e usuário Free resolvido continuam elegíveis para AdSense, sempre respeitando consentimento;
- o script `adsbygoogle.js` não pode ser carregado por páginas individuais;
- quando Premium é confirmado, containers `adsbygoogle` existentes são neutralizados e um observador impede reinjeções tardias;
- alterações de autenticação/perfil reavaliam a decisão sem criar uma segunda autoridade.

O caso fora da arquitetura central que possuía um carregador próprio em `concurso_publico/index.html` foi removido para evitar bypass do bloqueio Premium.

---

## 4. Integração com o sistema moderno existente

### 4.1 Frontend

Arquivo central:

`global-scripts.js`

A implementação deve:

- manter a decisão de publicidade vinculada exclusivamente ao entitlement real;
- aguardar a resolução do estado comercial antes de chamar `loadAdSenseOnce()`;
- não carregar `adsbygoogle.js` quando o estado Premium válido estiver confirmado;
- esconder/remover os containers de anúncios já presentes no HTML quando o estado Premium for confirmado;
- impedir que anúncios injetados posteriormente reapareçam;
- reagir a alterações de autenticação/perfil utilizando os listeners do `Auth` canônico;
- continuar carregando GA4 independentemente da decisão de publicidade, respeitando o consentimento de Analytics;
- manter os slots oficiais de AdSense existentes sem renomeá-los ou recriá-los.

### 4.2 Billing

Não alterar:

- `billing_identities`;
- `billing_subscriptions`;
- `user_entitlements`;
- `billing-access`;
- Asaas;
- Stripe;
- webhooks;
- checkout.

O billing atual já é a autoridade. A remoção de anúncios apenas **consome** esse estado.

### 4.3 Conteúdo Premium

Não alterar:

- `premium_content_pages`;
- `premium-content`;
- `premium-content-loader.js`;
- shells Premium.

A proteção do conteúdo e a decisão de publicidade são responsabilidades diferentes, porém ambas devem derivar do mesmo entitlement.

---

## 5. Proibição absoluta de legado

Não utilizar, reativar ou copiar:

- `premium-ads-guard.js` como autoridade;
- `premium-banner-manager.js` como autoridade de publicidade;
- `PREMIUM_AD_FREE_PLANS`;
- `isPremiumLocal()` como autoridade;
- `localStorage.plan`;
- `hasPlan('junior')`;
- Firestore para plano;
- regras antigas de `admin_mode`;
- Mercado Pago;
- antigos callbacks de assinatura;
- qualquer lógica que conceda benefício por parâmetro de URL.

Artefatos históricos podem continuar arquivados, mas não podem participar do fluxo de produção.

---

## 6. Publicidade e Consent Mode

A remoção por Premium é **diferente** do consentimento de publicidade.

Portanto:

- `analytics_storage` continua funcionando conforme o consentimento do usuário;
- `ad_storage` continua sendo governado pelo mecanismo de consentimento;
- Premium não deve receber um valor falso no consentimento apenas para esconder anúncios;
- o AdSense simplesmente não é carregado quando o entitlement Premium está válido.

Assim, a implementação não altera o significado de consentimento LGPD/GTM/GA4.

---

## 7. Controle dos espaços dos anúncios

O site possui anúncios controlados manualmente, incluindo:

- pós-Hero;
- entre formulário/botão Calcular e resultado;
- bloco Multiplex no final da página.

Para Premium:

1. não carregar o script AdSense;
2. ocultar os `ins.adsbygoogle` já presentes;
3. ocultar o container controlado do anúncio;
4. impedir reinjeção por mutação do DOM;
5. não criar espaços vazios permanentes desnecessários.

A correção deve preservar o layout, evitando regressão de CLS.

---

# 8. Ciclo PDCA obrigatório

## P — PLAN

Antes de alterar:

- confirmar este documento;
- confirmar o contrato canônico;
- identificar o ponto único de carregamento do AdSense;
- identificar o método canônico `Auth.billingStatus()`;
- confirmar que nenhuma mudança de checkout/webhook é necessária;
- escrever o teste automatizado antes da mudança final;
- estabelecer os cenários de aceitação.

Critério de saída da fase P:

> existe uma única fonte de verdade para identidade/billing e um único carregador de AdSense.

---

## D — DO

Executar a menor alteração possível:

1. criar a política de elegibilidade Premium para publicidade dentro do `global-scripts.js`;
2. aguardar `Auth`/billing antes do AdSense;
3. bloquear AdSense para Premium válido;
4. ocultar anúncios já renderizados;
5. observar alterações do DOM apenas quando necessário;
6. manter Free/visitante funcionando;
7. não alterar nomes de eventos existentes;
8. não alterar checkout, webhook ou entitlement.

Critério de saída da fase D:

> o código de produção tem um único caminho de decisão e não contém autoridade comercial paralela.

---

## C — CHECK

Executar testes em camadas.

### C1 — Teste estático

Executar:

`node scripts/test-premium-ads.js`

### C1.1 — Simulação com estado persistido real

Executar:

`node scripts/test-premium-ads-real-state.mjs`

Esse teste consulta somente leitura `public.user_entitlements` no Supabase usando a credencial de serviço já existente no pipeline e não imprime IDs de usuários.

Validar:

- `global-scripts.js` sintaticamente;
- não existe `localStorage.plan` na decisão Premium;
- não existe `junior` na nova lógica;
- `billingStatus()`/Auth canônico participa da decisão;
- `loadAdSenseOnce()` não pode carregar AdSense antes da resolução;
- slots AdSense permanecem iguais;
- GA4 continua separado da publicidade.

### C2 — Simulações reais de estado

Simular exatamente:

1. visitante sem sessão → anúncios permitidos;
2. usuário Free válido → anúncios permitidos;
3. Premium válido → anúncios bloqueados;
4. Premium expirado → anúncios permitidos;
5. billing indisponível → anúncios não carregam até resolução;
6. consentimento de publicidade negado → anúncios bloqueados;
7. Premium com `adsbygoogle.js` previamente presente → script/containers ficam neutralizados;
8. mudança Free → Premium → anúncios são removidos;
9. mudança Premium → Free → anúncios podem voltar, conforme consentimento.

### C3 — Regressão da conta

Confirmar que continuam funcionando:

- login;
- Google;
- sessão;
- perfil;
- favoritos;
- histórico;
- assinatura;
- billing-access;
- Premium content.

Nenhuma dessas rotas pode depender da camada de publicidade.

### C4 — Regressão Premium

Executar:

- `scripts/test-premium-auth-delivery-flow.js`;
- `scripts/test-premium-content-access.js`;
- `scripts/test-premium-simulados-access.js`;
- `scripts/auditar-bloqueio-escalas.js`;
- `scripts/auditar-premium-triplo.mjs`;
- `scripts/validate-printable-scale-forms.mjs`;
- `scripts/test-account-pages.js`.

### C5 — Regressão AdSense

Confirmar:

- Free ainda recebe anúncios;
- Premium não recebe AdSense;
- consentimento continua prevalecendo;
- anúncios não cobrem o menu;
- anúncio pós-Hero continua no ponto canônico;
- anúncio de resultado continua no ponto canônico;
- Multiplex continua no fluxo normal;
- não há duplicação de slots.

### C6 — Deploy

O deploy só está aprovado quando:

- testes passam;
- auditoria Premium passa;
- catálogo privado sincroniza;
- shells passam;
- GitHub Pages conclui com `success`.

---

## A — ACT

Após os testes:

1. corrigir qualquer regressão;
2. repetir a bateria inteira;
3. registrar SHA do commit;
4. registrar runs do GitHub Actions;
5. registrar o resultado de cada simulação;
6. auditar o código publicado;
7. somente então considerar a implementação concluída.

---

# 9. Teste de ponta a ponta — roteiro final

O teste E2E deve representar o seguinte cenário:

### Cenário A — visitante

Abrir uma página que possui AdSense.

Resultado:

- página abre;
- GA4 funciona conforme consentimento;
- AdSense pode ser carregado.

### Cenário B — usuário Free autenticado

Abrir a mesma página autenticado como Free.

Resultado:

- sessão permanece;
- billing é resolvido;
- AdSense pode ser carregado.

### Cenário C — usuário Premium autenticado

Abrir a mesma página com entitlement Premium válido.

Resultado obrigatório:

- Firebase identifica o usuário;
- `Auth.billingStatus()` retorna Premium válido;
- `adsbygoogle.js` não é carregado;
- `ins.adsbygoogle` não fica visível;
- containers de anúncio não permanecem ocupando espaço indevido;
- conteúdo Premium continua funcionando normalmente.

### Cenário D — Premium expirado

Resultado:

- entitlement deixa de ser Premium;
- AdSense volta a ser elegível, respeitando consentimento.

### Cenário E — billing indisponível

Resultado:

- nunca presumir Premium;
- nunca conceder Premium;
- para publicidade, permanecer sem carregar AdSense até o estado comercial ser resolvido.

---

# 10. Simulações com dados reais do sistema

A implementação deve ser validada contra estados persistidos reais do ambiente, sem alterar a conta financeira:

- um estado Premium ativo existente;
- estados históricos/Free;
- estados expirados/inativos quando disponíveis.

A simulação não deve criar cobrança real nova nem alterar assinatura de produção.

Para uma transação financeira realmente nova, a aprovação deve ser feita em ambiente controlado do provedor ou mediante uma compra real deliberadamente autorizada.

---

# 11. Métricas e Analytics

Não alterar nomes de eventos existentes de cliques/botões.

O evento `tempo_permanencia` permanece independente.

A remoção de anúncios não deve criar uma segunda implementação de Analytics.

A página de métricas e o dashboard GA4 existente continuam sendo usados somente para observabilidade.

---

# 12. Critérios de aprovação

A mudança só poderá ser considerada **CONCLUÍDA** quando todos forem verdadeiros:

- [ ] Premium válido não carrega AdSense;
- [ ] Premium válido não exibe containers de anúncios;
- [ ] Free continua com AdSense;
- [ ] visitante continua com AdSense;
- [ ] consentimento continua funcionando;
- [ ] billing permanece intocado;
- [ ] checkout permanece intocado;
- [ ] webhooks permanecem intocados;
- [ ] conteúdo Premium permanece protegido;
- [ ] nenhum legado foi reutilizado;
- [ ] nenhuma autoridade paralela foi criada;
- [ ] testes unitários/simulações passam;
- [ ] testes de regressão passam;
- [ ] E2E passa;
- [ ] GitHub Actions passa;
- [ ] deploy termina em `success`.

---

# 13. Evidência obrigatória ao término

Registrar:

**CONFIRMADO**
- arquivo(s) alterado(s);
- SHA;
- cenário Premium;
- cenário Free;
- cenário visitante;
- resultado do consentimento;
- resultado E2E;
- GitHub Actions;
- publicação.

**NÃO CONFIRMADO**
- qualquer comportamento que dependa de compra nova real e não tenha sido exercitado.

**HIPÓTESE**
- somente quando existir comportamento ainda não observado.

**PENDENTE**
- somente itens concretamente necessários para conclusão.

---

# 14. Regra de ouro

> **O navegador identifica o usuário.  
> O backend confirma o entitlement.  
> O entitlement Premium válido determina a ausência de anúncios.  
> O `global-scripts.js` é o único carregador do AdSense.  
> Não existe um segundo sistema de contas, billing ou anúncios.**

Qualquer implementação que fugir desta cadeia deve ser rejeitada antes do deploy.


---

# 15. Registro de homologação — 28/09/2026

## Evidências verificadas

- A política canônica de Premium sem anúncios está presente na `main`.
- O commit de correção mais recente é `f127696392ac9e1f6f962ffea0274cf3327ba42f`, que corrige a decisão booleana do estado Premium e elimina execução duplicada do teste no workflow.
- O workflow de deploy mantém a validação `scripts/test-premium-ads.js` e a simulação `scripts/test-premium-ads-real-state.mjs`.
- O Supabase de produção possui atualmente 1 entitlement `premium` com expiração futura em 20/10/2026.
- A função `billing-access` continua sendo somente leitura para a consulta do entitlement e calcula o estado ativo a partir de `user_entitlements`.
- Não foi encontrada, na busca estática da `main`, uma segunda implementação baseada em `localStorage.plan`, `isPremiumLocal()` ou um carregador direto adicional do AdSense.

## Resultado do PDCA nesta rodada

**PLAN:** aprovado.

**DO:** aprovado no código publicado na `main`; a decisão continua derivada do entitlement canônico.

**CHECK:** parcialmente aprovado. O estado Premium real do Supabase foi confirmado e a política estática foi auditada. O E2E autenticado no navegador não foi executado por esta rodada e, portanto, não deve ser marcado como concluído.

**ACT:** pendente somente da homologação E2E autenticada e da confirmação operacional do run de GitHub Actions correspondente ao deploy.

## Regra de encerramento

Enquanto o E2E autenticado não tiver evidência observável de que um assinante Premium válido não carrega/exibe AdSense, esta receita permanece em estado **HOMOLOGAÇÃO PENDENTE**, e não em estado de conclusão definitiva.
