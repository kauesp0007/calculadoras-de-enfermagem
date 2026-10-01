# Estação de Enfermagem — versão inicial 0.1.0

Aplicação Windows para avaliação de pacientes adultos pelo instrumento de Fugulin complementado (12 áreas). Desenvolvida a partir do protótipo enviado, com a identidade visual de Calculadoras de Enfermagem. Não é uma extensão do Chrome.

## Instalar e usar

1. Execute `Estacao-Enfermagem-Setup-0.1.0-x64.exe` no Windows 10 ou 11 de 64 bits.
2. Escolha a pasta e conclua a instalação para sua conta do Windows. Não requer Node.js nem acesso de administrador.
3. Abra **Estação de Enfermagem** no menu Iniciar ou pelo atalho.
4. Em **Fugulin**, identifique o paciente, preencha as 12 áreas e informe o profissional.
5. Revise o resultado e salve. Use **Pacientes e histórico** para consultar, iniciar nova avaliação ou retificar.

O instalador desta versão não tem assinatura Authenticode. O Windows pode mostrar o aviso de editor desconhecido. A assinatura comercial será uma etapa posterior de distribuição. Esta versão é uma base funcional para homologação, não uma declaração de validação clínica institucional.

## Recursos implementados

- Cálculo dinâmico, validação das 12 áreas e faixas de classificação revisadas.
- Cadastro de pacientes, busca, arquivamento/reativação e exclusão com confirmação.
- Avaliações datadas, snapshot da identificação no momento do registro, histórico e gráfico de escores.
- Comparação dos critérios das duas avaliações mais recentes; pré-preenchimento explícito da última para revisão.
- Retificação com revisão e registro local da versão anterior; uma retificação não altera o cadastro atual do paciente.
- Registro livre de diagnósticos e plano de cuidados, preenchidos pelo enfermeiro. Nenhum diagnóstico NANDA é inferido automaticamente pela pontuação.
- Painel diário do setor com cobertura das avaliações e soma de horas de enfermagem.
- PDF real em A4, impressão nativa e tabela CSV UTF-8 para Excel/LibreOffice, com proteção contra fórmulas em campos de texto.
- Rascunho automático recuperável, preferências, tamanho de texto e contraste ampliado.
- Menus nativos, atalhos, funcionamento offline e instância única.
- Banco SQLite criptografado com AES-256-GCM; chave protegida pela conta do Windows (DPAPI).
- Backup `.enfbackup` protegido por senha, restaurável em outro computador; validação antes da substituição e cópia local antes de restaurar.

## Dados e limitações

Uso local por conta do Windows; sem sincronização, servidor, anúncios, integração hospitalar ou controle de equipe multiusuário. PDF/CSV exportados não são criptografados. Não há assinatura digital de laudos. O registro local de alterações não é um mecanismo inviolável nem um prontuário certificado.

Arquivar preserva o histórico. Excluir remove da operação, mas o conteúdo anterior permanece no registro local de alterações. A desinstalação e atualização preservam os dados. A pasta local padrão é `%APPDATA%\enfermagem-desktop`; use backup com senha para transferir dados, pois copiar apenas o banco não transfere a chave DPAPI.

O módulo é destinado a adultos. A identificação e a avaliação precisam ser conferidas pelo enfermeiro. As horas/paciente/dia são parâmetros de planejamento e não substituem o dimensionamento completo. A validação assistencial do conteúdo e do fluxo compete à instituição antes de usar dados reais.

## Importar o protótipo

Em Configurações → Restaurar backup, escolha o `.db` do protótipo (sem senha) ou um `.enfbackup` (com senha). O programa valida integridade, estrutura e dados antes de substituir o banco. Registros do protótipo ficam marcados como **legados**, pois as opções clínicas antigas divergiam da fonte. Eles não entram automaticamente no painel atual, nem seus escores são reinterpretados na nova escala. Faça uma nova avaliação dos pacientes quando necessário.

## Desenvolver e gerar o instalador

Em Windows, com Node.js 24 e npm:

```powershell
npm ci
npm test
npm run test:ui
npm start
npm run dist:win
```

O instalador será gravado em `dist/`. O código inclui testes com dados fictícios; nunca use uma pasta com pacientes reais para executar testes. O teste nativo usa um diretório temporário e o Electron de desenvolvimento.

## Arquitetura para crescer

Veja [docs/ARQUITETURA.md](docs/ARQUITETURA.md). Cada escala é um módulo registrado em `src/modules/registry.js`, com cálculo, critérios, versão e fontes. Pacientes, avaliações, snapshots, rascunhos e exportações são serviços compartilhados. Apenas módulos revisados e empacotados com a aplicação podem executar; não há instalação de código remoto.

## Fontes

- Santos et al. (2007). Sistema de classificação de pacientes: proposta de complementação do instrumento de Fugulin et al. https://doi.org/10.1590/S0104-11692007000500015
- Parecer Normativo COFEN nº 1/2024. https://www.cofen.gov.br/parecer-normativo-no-1-2024-cofen/
- Resolução COFEN nº 743/2024 (revoga a Resolução 543/2017). https://www.cofen.gov.br/resolucao-cofen-no-743-de-12-de-marco-de-2024/

Descrições sintetizadas com base nas fontes. Intervalos de tempo apresentados como no instrumento; situações de fronteira devem seguir a orientação institucional. Novas versões clínicas não reinterpretam automaticamente registros legados.
