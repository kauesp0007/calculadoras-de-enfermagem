'use strict';
const crypto=require('node:crypto');
const DB_MAGIC=Buffer.from('ENFDB001'); const BACKUP_MAGIC=Buffer.from('ENFBKP01');
function seal(bytes,key,magic=DB_MAGIC){const iv=crypto.randomBytes(12),c=crypto.createCipheriv('aes-256-gcm',key,iv);c.setAAD(magic);const encrypted=Buffer.concat([c.update(bytes),c.final()]);return Buffer.concat([magic,iv,c.getAuthTag(),encrypted]);}
function open(bytes,key,magic=DB_MAGIC){if(bytes.length<36||!bytes.subarray(0,8).equals(magic))throw new Error('Formato de arquivo inválido.');const d=crypto.createDecipheriv('aes-256-gcm',key,bytes.subarray(8,20));d.setAAD(magic);d.setAuthTag(bytes.subarray(20,36));try{return Buffer.concat([d.update(bytes.subarray(36)),d.final()]);}catch{throw new Error('Senha incorreta ou arquivo danificado.');}}
function passwordKey(password,salt){if(typeof password!=='string'||password.length<8||password.length>256)throw new Error('Use uma senha de 8 a 256 caracteres para o backup.');return crypto.scryptSync(password,salt,32);}
function backup(bytes,password){const salt=crypto.randomBytes(16);return Buffer.concat([salt,seal(bytes,passwordKey(password,salt),BACKUP_MAGIC)]);}
function restore(bytes,password){if(bytes.length<52)throw new Error('Backup inválido.');return open(bytes.subarray(16),passwordKey(password,bytes.subarray(0,16)),BACKUP_MAGIC);}
module.exports={seal,open,backup,restore,DB_MAGIC};
