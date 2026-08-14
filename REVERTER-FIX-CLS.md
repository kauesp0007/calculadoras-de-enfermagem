# REVERTER — Fix de CLS (header/placeholder)

**Data da alteração:** 2026-08-14 (v2 — aplicado somente no mobile)
**Arquivo alterado:** `global-styles.css` (append no final)
**Arquivo de backup:** `global-styles.css.bak-20260814-clsfix` (cópia exata do arquivo antes da alteração)

## O que foi alterado

Foi adicionado AO FINAL do `global-styles.css` o seguinte bloco (e nada mais):

```css
/* ===== FIX CLS v2 (2026-08-14): reserva de altura real do header SOMENTE NO MOBILE =====
   v1 reduziu o desktop para 56px e o seletor de idioma passou a sumir atrás do menu em larguras
   intermediárias (menu quebra em 2 linhas e ultrapassa o min-height). DESKTOP VOLTOU A 96px (original,
   sem CLS reportado). Mobile: 48px = altura real do menu (py-2 + logo 32px). Backup:
   global-styles.css.bak-20260814-clsfix. Reversão: ver REVERTER-FIX-CLS.md */
@media(max-width:768px){#global-header-container{min-height:48px!important}}
```

Resumo:
- **Desktop: NÃO muda nada** (mantém os 96px originais — o desktop não tinha problema de CLS)
- **Mobile (≤768px):** placeholder do header 60px → **48px** (altura real do menu)

## Como reverter (2 caminhos)

### Caminho A — restaurar o backup (recomendado)

```powershell
Copy-Item "global-styles.css.bak-20260814-clsfix" "global-styles.css" -Force
node gerar-sw.js
```

### Caminho B — remover apenas o bloco adicionado

1. Abrir `global-styles.css`;
2. Apagar todo o bloco que começa com `/* ===== FIX CLS v2 (2026-08-14)` até a linha `@media(max-width:768px){#global-header-container{min-height:48px!important}}` (fica no final do arquivo);
3. Rodar `node gerar-sw.js` (obrigatório: o CSS é servido do cache do service worker).

## Como verificar se o fix está ativo

```powershell
Select-String -Path "global-styles.css" -Pattern "FIX CLS v2"
```

Se retornar 1 ocorrência → fix ativo. Nenhuma → revertido.

## Impacto esperado do fix (por dispositivo)

| Dispositivo | Antes | Depois |
|---|---|---|
| Desktop | 96px (original, mantido — sem CLS reportado) | 96px (inalterado) |
| Mobile | placeholder 60px vs header real ~48px → shift de ~12px | placeholder 48px → shift ≈ 0 |

## Histórico da v1 (corrigida)

A v1 reduziu o desktop para 56px, o que fez o seletor de idioma sumir atrás do menu global em
larguras intermediárias (o menu quebra em 2 linhas e ultrapassava a reserva). A v2 removeu a
regra de desktop e manteve apenas o ajuste mobile.

## Observações para o agente (solicitar reversão)

Se o usuário pedir para reverter: leia este arquivo, execute o **Caminho A**, rode `node gerar-sw.js` e confirme com `Select-String` que o bloco "FIX CLS" não existe mais em `global-styles.css`.
