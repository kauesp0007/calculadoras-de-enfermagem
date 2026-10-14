'use strict';
const path=require('node:path'),{spawnSync}=require('node:child_process');
async function main(){
 if(process.platform!=='win32')throw new Error('Gere a versão assinada no Windows com o certificado e a chave privada protegida disponíveis.');
 const config=require('../build/signed.cjs');
 const root=path.join(__dirname,'..');
 const check=spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-File',path.join(__dirname,'signing-preflight.ps1')],{stdio:'inherit',cwd:root});
 if(check.status!==0)throw new Error('Certificado Code Signing não passou na validação prévia.');
 const {build,Platform,Arch}=require('electron-builder');
 await build({projectDir:root,targets:Platform.WINDOWS.createTarget('nsis',Arch.x64),config,publish:'never'});
 const verify=spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-File',path.join(__dirname,'verify-windows.ps1'),'-RequireSigned'],{stdio:'inherit',cwd:root});
 if(verify.status!==0)throw new Error('Assinatura final não passou na verificação Authenticode. Não distribua este arquivo.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
