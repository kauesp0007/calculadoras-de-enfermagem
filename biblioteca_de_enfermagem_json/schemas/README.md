# Schemas — Biblioteca de Conhecimento em Saúde

JSON Schemas (draft-07) do sistema autônomo de biblioteca e produção de conhecimento
(spec canônica). Pasta de entrada: `LIVROS_PARA_O_AGENTE_LER/`; saída DOCX:
`biblioteca_de_enfermagem/`; dados estruturados: `biblioteca_de_enfermagem_json/`.

## Arquivos

| Arquivo | Entidade | Spec |
|---|---|---|
| `item-conhecimento.schema.json` | Item de conhecimento (registro canônico) | §9 |
| `documento.schema.json` | Documento fonte (ingestão + hash) | §5, §6, §54 |
| `taxonomia.schema.json` | Tipos documentais, especialidades, profissões, desenho/nível de evidência | §7, §16, §34, §35 |
| `evidencia.schema.json` | Evidência científica (metodologia + dados quantitativos) | §32 |
| `conflito.schema.json` | Registro de conflito entre fontes | §17 |
| `auditoria.schema.json` | Registro de auditoria | §15, §59 |
| `referencia.schema.json` | Referência bibliográfica (Vancouver) | §30 |
| `status.schema.json` | Máquina de estados + alertas | §38, §68 |

## Regras canônicas aplicadas

- **Nada pode ser inventado** (§12): campos ausentes = `null` ou
  `"não identificado na fonte"`. Nunca preencher lacuna com suposição como fato.
- **Rastreabilidade absoluta** (§11): todo item aponta para `fonte_id`.
- **Fonte ≠ Produção** (§63): o documento fonte é evidência; o item de conhecimento é síntese.
- **Referência Vancouver** (decisão do usuário): autores `Sobrenome + Iniciais`, título,
  edição, local, editora, ano, volume, número, páginas, DOI, URL, data de acesso.
- **Datação** (§10): separar publicação, atualização, data histórica, entrada,
  processamento, auditoria e verificação externa.

## Validação

```powershell
node -e "JSON.parse(require('fs').readFileSync('biblioteca_de_enfermagem_json/schemas/item-conhecimento.schema.json','utf8'))"
```

O hook `check-json` valida automaticamente os JSONs ao serem editados.
