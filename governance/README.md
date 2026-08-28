# Governança de Conteúdo

Esta camada conecta o site ao runtime regulatório em `CKO-COREN-Projeto-Completo-v2` sem transformar a publicação atual em um bloqueio global.

## Estágios de adoção

1. `OBSERVE`: detecta páginas candidatas a conteúdo de alto risco sem bloquear o acervo.
2. Catalogar: adicionar cada página de alto risco a `registered_content`, com risco, fonte oficial, data de revisão e, quando aplicável, referência canônica.
3. Validar: revisar os alertas com o agente `Auditor de Governança Regulatória`.
4. `ENFORCE_NEW` (estado atual): aplica requisitos somente a HTMLs públicos fora da linha de base; conteúdo de alto risco sem registro ou fonte oficial falha na validação, preservando a migração gradual do acervo. Pastas de automação, backups, biblioteca, downloads e o runtime CKO não são tratadas como páginas públicas da raiz.

## Verificação

```powershell
node scripts/validate-content-governance.js
```

O comando lê o runtime COREN, conta atos canônicos e snapshots adquiridos, identifica páginas candidatas e verifica o catálogo. Ele não baixa fontes, não altera conteúdo e não substitui a revisão humana.

Para HTMLs públicos novos, a validação também exige uma seção de referências marcada com `data-references-section="v1"`, uma nota de transparência marcada com `data-governance-disclosure="v1"` depois dela e a declaração `data-professional-review="required"`. A publicação requer revisão prévia registrada no fluxo editorial por profissional de enfermagem habilitado e em atividade. Os marcadores tornam a ordem e a exigência verificáveis, mas não substituem a documentação da habilitação; o texto canônico e seus limites estão em `.github/instructions/html.instructions.md`.

## Acervo documental

`docs/` é inventariado em `governance/regulatory-document-library.json`. Cada PDF recebe identificador e SHA-256, mas entra inicialmente como `PENDING_EDITORIAL_REVIEW`. Somente um item `APPROVED`, com fonte oficial, hash coincidente e referência a revisor profissional ativo e verificado pode ser aceito como evidência local de conteúdo de alto risco.

```powershell
node scripts/build-regulatory-document-library.js
node scripts/audit-regulatory-document-library.mjs
```

O registro de revisores é pseudonimizado em `governance/editorial-reviewers.json`; não armazene dados pessoais ou números de inscrição profissional no repositório público.

A fila deve ser revisada por prioridade: legislação e regulamentação oficial primeiro; depois pareceres e diretrizes; por fim artigos científicos e materiais de apoio. O importador não aprova nem altera o status de nenhum documento.

## Limites

O hash da entrega comprova integridade do arquivo, não a verdade da fonte. Alegações normativas continuam exigindo fonte oficial adquirida, evidência e revisão editorial. A auditoria é um controle editorial de apoio, não uma certificação de conformidade com LGPD, normas internacionais ou obrigações legais.
