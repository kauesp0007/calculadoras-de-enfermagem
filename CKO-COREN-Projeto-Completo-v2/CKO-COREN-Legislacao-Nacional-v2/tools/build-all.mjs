#!/usr/bin/env node
/** Orquestrador multiplataforma do runtime regulatório CKO-COREN. */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const node = process.execPath;
const venvPython = process.platform === 'win32'
    ? path.join(ROOT, '.venv', 'Scripts', 'python.exe')
    : path.join(ROOT, '.venv', 'bin', 'python');
const python = existsSync(venvPython)
    ? venvPython
    : (process.platform === 'win32' ? 'python' : 'python3');
const gtkBin = process.platform === 'win32'
    ? path.join(process.env.ProgramFiles || 'C:\\Program Files', 'GTK3-Runtime Win64', 'bin')
    : null;
const environment = gtkBin && existsSync(path.join(gtkBin, 'libpango-1.0-0.dll'))
    ? { ...process.env, Path: `${gtkBin};${process.env.Path || process.env.PATH || ''}` }
    : process.env;

const steps = [
    { name: 'templates', command: node, args: ['tools/build-templates.mjs'] },
    { name: 'site inicial', command: node, args: ['tools/build.mjs'] },
    { name: 'PDF', command: python, args: ['tools/build-pdf.py'] },
    { name: 'mídia social', command: python, args: ['tools/build-social.py'] },
    { name: 'sitemap', command: node, args: ['tools/build-sitemap.mjs'] },
    { name: 'regressão de gates', command: node, args: ['tests/gate-regression.test.mjs'] },
    { name: 'validação de artefatos', command: node, args: ['tools/validate-artifacts.mjs'] },
    { name: 'acessibilidade', command: node, args: ['tools/audit-a11y.mjs'] },
    { name: 'site final', command: node, args: ['tools/build.mjs'] },
    { name: 'manifesto', command: python, args: ['tools/build-manifest.py'] },
];

function execute(step) {
    return new Promise((resolve, reject) => {
        console.log(`--- ${step.name} ---`);
        const child = spawn(step.command, step.args, { cwd: ROOT, stdio: 'inherit', env: environment });
        child.once('error', err => reject(new Error(`${step.name}: ${err.message}`)));
        child.once('exit', code => code === 0 ? resolve() : reject(new Error(`${step.name} terminou com código ${code}`)));
    });
}

try {
    for (const step of steps) await execute(step);
    console.log('--- build regulatório concluído ---');
} catch (err) {
    console.error(`Build regulatório interrompido: ${err.message}`);
    process.exitCode = 1;
}