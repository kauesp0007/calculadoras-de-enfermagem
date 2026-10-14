# Arquitetura modular

## Pasta independente no repositório existente

`programas/estacao-enfermagem/` contém uma aplicação desktop autônoma. Seu `package.json`, dependências e build não utilizam o pacote do site. Nenhum arquivo público do site foi modificado. O workflow Windows é próprio e sua publicação não executa deploy do site. A pasta deve permanecer fora dos inventários de páginas e do service worker do site se o projeto vier a ser integrado à branch de produção; essa integração ainda não foi feita.

## Camadas

| Camada | Responsabilidade |
| --- | --- |
| `src/modules/fugulin.js` | Dados clínicos versionados, validação, cálculo e fontes |
| `src/modules/registry.js` | Registro explícito de módulos revisados |
| `src/services/store.js` | Pacientes, avaliações, snapshots, revisão, rascunhos, migrações e importação |
| `src/services/crypto.js` | AES-256-GCM; backups com chave derivada da senha via scrypt |
| `src/services/report.js` | Relatório seguro e CSV |
| `main.js` | Electron, proteção DPAPI, menus, diálogos nativos, PDF/impressão e IPC |
| `preload.js` | API limitada entre interface e processo principal |
| `renderer.*` | Interface, busca, gráfico, formulário e estado de trabalho |

## Contrato dos módulos

Um módulo declara `id`, `version`, `name`, `population`, `criteria`, `sources`, `calculate(scores)` e validação de população específica quando aplicável. O processo principal obtém o módulo do registro e recomputa o resultado; não aceita escores totais ou classificações fornecidos pela interface.

Cada avaliação contém `patient_id`, `module_id`, `module_version`, `scores`, resultado, identificação histórica (`snapshot`), profissional, data/hora, texto de diagnóstico, notas e revisão. Braden ou Morse deverão registrar seus próprios domínios e faixas, preservando esse vínculo com o paciente. Os componentes gráficos atuais são específicos de Fugulin; futuros módulos exigem sua interface e testes próprios, não apenas uma entrada no menu.

## Migrações e continuidade

`PRAGMA user_version=3`. Migrações são aditivas. Banco do protótipo recebe versão clínica `legacy-prototype` e não é reinterpretado. Backups com schema mais novo ou módulos não reconhecidos são rejeitados. Inserção e retificação são transacionais; falha na persistência restaura a memória anterior. A exportação do sql.js reabre o banco, portanto `foreign_keys=ON` é reaplicado após cada exportação.

Persistência usa arquivo temporário e rename; mantém a cópia `.previous`. Não há promessa de recuperação automática dessa cópia: o programa falha com erro diante de corrupção, para não descartar dados silenciosamente. A pasta `recovery` guarda cópias anteriores a restaurações; para transferir para outra máquina use `.enfbackup` com senha.

## Segurança e limites

Renderer sem Node.js, sandbox e context isolation ativos, CSP sem recursos de rede, bloqueio de navegação/popups/permissões e validação do emissor IPC. Dados de texto são escapados em HTML; CSV protege células interpretáveis como fórmula. PDF e impressão são gerados no processo principal após validar dados e população.

Não há backend, coleta de dados, cloud, billing ou atualizador automático. Uma nova versão é instalada pelo instalador preservando dados locais. A versão inicial não inclui autenticação multiusuário, gestão institucional de acesso, assinatura digital, interoperabilidade com PEP ou certificação regulatória.

## Próximas etapas sugeridas

1. Homologar esta versão com enfermeiros e dados fictícios em Windows.
2. Incluir Braden com fontes, cálculo, testes e exibição própria.
3. Acrescentar Morse e formulários, usando os mesmos pacientes e históricos.
4. Validar o desenho de prontuário, perfis de acesso e retenção de dados com a instituição.
5. Assinar os instaladores e definir canal de distribuição/atualização.

## Anamnese na versão 0.2.0

Consulte [ANAMNESE.md](ANAMNESE.md). O cadastro e a criptografia são os mesmos da Fugulin; `clinical_records` e `clinical_drafts` adicionam registros sem pontuação, agrupados no histórico do paciente.
