# Assinatura e confiança no Windows

Status da versão 0.2.1: **homologação, sem assinatura Authenticode**. O responsável informou que ainda não possui certificado Code Signing. Preparar a compilação não emite um certificado e não remove o alerta mostrado na captura do SmartScreen.

O Windows avalia a assinatura, o certificado e a reputação do arquivo. Mesmo um certificado válido não garante ausência imediata de alertas de reputação. Assinatura Authenticode identifica o editor e permite detectar alterações no executável; não equivale à assinatura dos registros clínicos nem certifica a qualidade clínica do programa.

## Pré-requisito externo

Obter um certificado **Code Signing** com cadeia reconhecida pelo Windows, em nome do editor responsável, após validação de identidade pelo emissor. Um certificado HTTPS do site, e-CPF/e-CNPJ sem o uso específico Code Signing, certificado autoassinado ou arquivo `.cer` sem acesso à chave privada não resolve esta entrega.

A chave privada deve permanecer no dispositivo, token ou serviço protegido do responsável. Não envie a chave ou senha na conversa e não a inclua no repositório. O programa não instala certificados raiz e não modifica as proteções do Windows.

## Caminho preparado: certificado no Windows

O processo preparado usa o certificado do repositório `My` do Windows, acessível ao usuário que compila, inclusive quando a chave é protegida por um token com seu provedor instalado. O thumbprint seleciona exatamente o certificado. HSM/assinatura em nuvem com integração própria deve ser configurado conforme o serviço efetivamente escolhido; essa integração não foi criada nem testada.

1. Disponibilizar certificado Code Signing e acesso à chave privada no computador Windows de compilação.
2. Configurar `NURSING_SIGNING_THUMBPRINT` com os 40 caracteres hexadecimais do thumbprint público do certificado e `NURSING_TIMESTAMP_URL` com o endpoint RFC 3161 fornecido pelo emissor. Essas variáveis não contêm a chave privada.
3. Executar `npm run dist:win:signed`. O processo valida validade, uso Code Signing e cadeia com revogação online; a compilação exige assinatura, SHA256 e carimbo de tempo. Falha se não houver certificado ou se `ELECTRON_BUILDER_OFFLINE=true` impedir o timestamp.
4. O processo verifica `Get-AuthenticodeSignature` do instalador e do executável empacotado: exige `Valid`, certificado esperado e `TimeStamperCertificate`. O relatório fica em `dist/ASSINATURA-WINDOWS.json`. O hash deve ser calculado após assinar.
5. Instalar em ambiente de teste e verificar também o executável instalado e o desinstalador com o script `tools/verify-windows.ps1 -RequireSigned -Files <caminhos>`. Só distribuir após essa validação, os testes funcionais e a conferência visual da janela de instalação.

O comando `npm run dist:win` continua sendo a build de homologação sem assinatura. A CI valida funcionalidade e registra explicitamente `NotSigned`; ela não acessa nenhum certificado. O caminho assinado foi validado quanto à configuração e ao bloqueio sem credenciais, mas a assinatura efetiva depende da emissão do certificado e ainda não foi executada.

## Fontes oficiais consultadas em 01/10/2026

- Microsoft Defender SmartScreen: https://learn.microsoft.com/en-us/windows/security/operating-system-security/virus-and-threat-protection/microsoft-defender-smartscreen/
- SignTool, SHA256, RFC 3161 e verificação Authenticode: https://learn.microsoft.com/en-us/windows/win32/seccrypto/signtool
- Configuração conferida diretamente em `app-builder-lib` 26.15.3, `winOptions.d.ts` e `windowsSignToolManager.js` da dependência instalada.
