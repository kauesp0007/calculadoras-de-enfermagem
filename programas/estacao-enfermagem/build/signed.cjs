'use strict';
const thumb=(process.env.NURSING_SIGNING_THUMBPRINT||'').trim();
const timestamp=process.env.NURSING_TIMESTAMP_URL||'';
if(!/^[a-f0-9]{40}$/i.test(thumb))throw new Error('Informe NURSING_SIGNING_THUMBPRINT de um certificado Code Signing válido no Windows.');
if(!/^https?:\/\/[^\s]+$/i.test(timestamp))throw new Error('Informe NURSING_TIMESTAMP_URL do serviço RFC 3161 recomendado pelo emissor.');
if(process.env.ELECTRON_BUILDER_OFFLINE==='true')throw new Error('A versão assinada exige conexão para carimbo de tempo e validação.');
module.exports={forceCodeSigning:true,win:{signAndEditExecutable:true,signExecutable:true,signtoolOptions:{certificateSha1:thumb,signingHashAlgorithms:['sha256'],rfc3161TimeStampServer:timestamp}}};
