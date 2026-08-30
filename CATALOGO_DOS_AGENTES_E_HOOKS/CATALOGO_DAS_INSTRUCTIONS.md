# 📐 Catálogo das Instructions (regras por extensão)

**Local:** `.github/instructions/*.instructions.md` · **Total:** 4 · **Mecanismo:** `applyTo` (carregadas automaticamente quando um arquivo da extensão é tocado).

| Instruction | applyTo | Cobre |
|---|---|---|
| `html.instructions.md` | `**/*.html` | Largura/hero, ordem do head, SEO/hreflang, CLS, footer (raiz vs idiomas), impressão/PDF, governança |
| `css.instructions.md` | `**/*.css` | Tailwind, tokens do design system, cores, largura, hero, responsividade |
| `js.instructions.md` | `**/*.js` | Padrões de código, reutilização, restrições |
| `json.instructions.md` | `**/*.json` | Validade JSON, preservação de schema, arquivos sensíveis |

**Complementaridade:** as instructions **orientam**; os hooks correspondentes (`check-layout`, `check-head`, `check-json`, `content-governance`) **garantem** deterministicamente.
