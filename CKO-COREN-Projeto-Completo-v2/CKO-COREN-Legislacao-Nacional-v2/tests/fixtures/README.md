# Fixtures de regressão

Objetos sintéticos usados apenas por `tests/gate-regression.test.mjs`.

**Não são atos reais e nunca entram no corpus publicado.** O build lê exclusivamente
`canonical/acts/`; estes arquivos vivem fora desse diretório de propósito.

O emissor fictício `Coren-ZZ` e a jurisdição de teste tornam impossível confundi-los com
um conselho regional real. Nenhuma fixture declara estado jurídico: todas usam
`legal_status: NOT_INFERRED`.

| Fixture | Nível | Serve para provar |
|---|---|---|
| `metadata-level-act.fixture.json` | `METADATA` | Resumo e PDF ficam bloqueados; o campo `summary` não vaza para nenhum payload |
| `summary-level-act.fixture.json` | `SUMMARY` | Resumo e PDF de resumo liberam; checklist, quiz, longform e artigo seguem bloqueados |
