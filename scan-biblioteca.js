/* eslint-env node */
const fs = require("fs");
const path = require("path");

const JSON_FILE = "biblioteca.json";

const PASTAS = {
  documentos: "docs",
  fotos: "img",
  videos: "videos",
};

const EXTENSOES_VALIDAS = {
  documentos: [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx"],
  fotos: [".jpg", ".jpeg", ".png", ".webp"],
  videos: [".mp4", ".webm"],
};

function normalizarTitulo(nome) {
  return nome
    .replace(/\.[^/.]+$/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, l => l.toUpperCase());
}

function carregarBiblioteca() {
  if (!fs.existsSync(JSON_FILE)) return [];
  return JSON.parse(fs.readFileSync(JSON_FILE, "utf8"));
}

function salvarBiblioteca(dados) {
  fs.writeFileSync(JSON_FILE, JSON.stringify(dados, null, 2));
}

function existeItem(biblioteca, ficheiro) {
  return biblioteca.some(item => item.ficheiro === ficheiro);
}

function scan() {
  const biblioteca = carregarBiblioteca();
  let novos = 0;

  for (const categoria in PASTAS) {
    const pasta = PASTAS[categoria];
    if (!fs.existsSync(pasta)) continue;

    const arquivos = fs.readdirSync(pasta);

    arquivos.forEach(arquivo => {
      const ext = path.extname(arquivo).toLowerCase();
      if (!EXTENSOES_VALIDAS[categoria].includes(ext)) return;

      const ficheiro = `/${pasta}/${arquivo}`;
      if (existeItem(biblioteca, ficheiro)) return;

      const titulo = normalizarTitulo(arquivo);

      biblioteca.push({
        titulo,
        categoria,
        ficheiro,
        capa:
          categoria === "fotos"
            ? ficheiro
            : "/img/capa-padrao.webp",
        download: arquivo,
      });

      novos++;
      console.log(`➕ Adicionado: ${titulo}`);
    });
  }

  salvarBiblioteca(biblioteca);
  console.log(`\n✅ Scan finalizado — ${novos} novos itens adicionados`);
}

scan();
