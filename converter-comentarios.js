const fs = require("fs");
const path = require("path");

const EXCLUIR = [
    ".git",
    "node_modules",
    "downloads",
    "biblioteca",
    "blog",
    "blog-templates"
];

let arquivos = 0;
let comentarios = 0;

function processarArquivo(caminho) {
    let conteudo = fs.readFileSync(caminho, "utf8");

    const antes = conteudo;

    conteudo = conteudo.replace(
        /\/\*(?!\!)([\s\S]*?)\*\//g,
        (match, grupo) => {
            comentarios++;
            return `/*!${grupo}*/`;
        }
    );

    if (conteudo !== antes) {
        fs.writeFileSync(caminho, conteudo);
        arquivos++;
        console.log(`✓ ${caminho}`);
    }
}

function percorrer(dir) {
    for (const item of fs.readdirSync(dir)) {
        const completo = path.join(dir, item);

        if (EXCLUIR.includes(item)) {
            continue;
        }

        const stat = fs.statSync(completo);

        if (stat.isDirectory()) {
            percorrer(completo);
        } else if (
            completo.endsWith(".html") ||
            completo.endsWith(".css")
        ) {
            processarArquivo(completo);
        }
    }
}

percorrer("./");

console.log("\n=== RELATÓRIO ===");
console.log(`Arquivos alterados: ${arquivos}`);
console.log(`Comentários convertidos: ${comentarios}`);