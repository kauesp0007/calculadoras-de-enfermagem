/**
 * Compatibilidade: auditoria histórica de bloqueio de escalas.
 * A autoridade agora é a auditoria tripla canônica.
 */
"use strict";
const {spawnSync}=require("node:child_process");
const result=spawnSync(process.execPath,["scripts/auditar-premium-triplo.mjs"],{stdio:"inherit"});
process.exit(result.status===null?1:result.status);
