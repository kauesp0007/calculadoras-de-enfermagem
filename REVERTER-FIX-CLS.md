# REVERTER — Fix de CLS (header/placeholder)

**Data da alteração:** 2026-08-14
**Arquivo alterado:** `global-styles.css` (append no final)
**Arquivo de backup:** `global-styles.css.bak-20260814-clsfix` (cópia exata do arquivo antes da alteração)

## O que foi alterado

Foi adicionado AO FINAL do `global-styles.css` o seguinte bloco (e nada mais):

```css
/* ===== FIX CLS (2026-08-14): reserva de altura real para header e seletor de idioma =====
   Motivo: menu-global.html real tem ~48px, mas o placeholder reservava 96px (desktop) / 60px (mobile),
   causando deslocamento do conteúdo quando o menu era injetado. Backup: global-styles.css.bak-20260814-clsfix.
   Reversão: ver REVERTER-FIX-CLS.md */
#global-header-container{min-height:56px!important}
@media(max-width:768px){#global-header-container{min-height:48px!important}}
#language-selector-placeholder{min-height:46px!important}
```

Resumo:
- Desktop: placeholder do header 96px → **56px**
- Mobile (≤768px): placeholder do header 60px → **48px**
- Seletor de idioma: permanece **46px** (uniformizado com `!important`)

## Como reverter (2 caminhos)

### Caminho A — restaurar o backup (recomendado)

```powershell
Copy-Item "global-styles.css.bak-20260814-clsfix" "global-styles.css" -Force
node gerar-sw.js
```

### Caminho B — remover apenas o bloco adicionado

1. Abrir `global-styles.css`;
2. Apagar todo o bloco que começa com `/* ===== FIX CLS (2026-08-14)` até a linha `#language-selector-placeholder{min-height:46px!important}` (fica no final do arquivo);
3. Rodar `node gerar-sw.js` (obrigatório: o CSS é servido do cache do service worker).

## Como verificar se o fix está ativo

```powershell
Select-String -Path "global-styles.css" -Pattern "FIX CLS \(2026-08-14\)"
```

Se retornar 1 ocorrência → fix ativo. Nenhuma → revertido.

## Impacto esperado do fix (por dispositivo)

| Dispositivo | Antes | Depois |
|---|---|---|
| Desktop | placeholder 96px vs header real ~48px → shift de ~48px | placeholder 56px → shift ≤ 8px |
| Mobile | placeholder 60px vs header real ~48px → shift de ~12px | placeholder 48px → shift ≈ 0 |

## Observações para o agente (solicitar reversão)

Se o usuário pedir para reverter: leia este arquivo, execute o **Caminho A**, rode `node gerar-sw.js` e confirme com `Select-String` que o bloco "FIX CLS" não existe mais em `global-styles.css`.
