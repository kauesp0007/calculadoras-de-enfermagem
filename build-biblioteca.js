/* eslint-env node */
const fs = require("fs");
const path = require("path");

const BIBLIOTECA_JSON = "biblioteca.json";
const TEMPLATE_DOWNLOADS = "downloads.template.html";
const TEMPLATE_ITEM = "item.template.html";
const PASTAS = [
  { dir: "img", categoria: "fotos" },
  { dir: "docs", categoria: "documentos" },
  { dir: "videos", categoria: "videos" }
];
const CAPAS_PADRAO = {
  documentos: "img/capa-word.webp",
  videos: "img/capa-video.webp"
};
const ITENS_POR_PAGINA = 20;

// -----------------------------------
// Helpers
// -----------------------------------
function tituloFromFilename(filename) {
  return filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

function slugFromTitulo(titulo) {
  return titulo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function descricaoAutomatica(titulo) {
  return `Material de enfermagem sobre ${titulo} para apoio educacional e clínico.`;
}

function carregarBiblioteca() {
  if (!fs.existsSync(BIBLIOTECA_JSON)) return [];
  return JSON.parse(fs.readFileSync(BIBLIOTECA_JSON, "utf8"));
}

function salvarBiblioteca(data) {
  fs.writeFileSync(BIBLIOTECA_JSON, JSON.stringify(data, null, 2), "utf8");
}

function carregarTemplate(arquivo) {
  return fs.readFileSync(arquivo, "utf8");
}

function escreverArquivo(caminho, conteudo) {
  fs.writeFileSync(caminho, conteudo, "utf8");
}

// -----------------------------------
// Scanner e atualização biblioteca.json
// -----------------------------------
function scanPastas(biblioteca) {
  const ficheirosExistentes = new Set(biblioteca.map(item => item.ficheiro));
  let adicionados = 0;
  let novosItens = [];

  for (const pasta of PASTAS) {
    const dirPath = path.join(process.cwd(), pasta.dir);
    if (!fs.existsSync(dirPath)) continue;

    const arquivos = fs.readdirSync(dirPath);
    for (const arquivo of arquivos) {
      const caminho = `/${pasta.dir}/${arquivo}`;
      if (ficheirosExistentes.has(caminho)) continue;

      const titulo = tituloFromFilename(arquivo);
      const slug = slugFromTitulo(titulo);
      const tipo = arquivo.split(".").pop().toLowerCase();

      const novoItem = {
        titulo,
        slug,
        descricao: descricaoAutomatica(titulo),
        categoria: pasta.categoria,
        ficheiro: caminho,
        capa: pasta.categoria === "fotos" ? caminho : CAPAS_PADRAO[pasta.categoria] || caminho,
        tipo,
        tags: titulo.split(" ").map(w => w.toLowerCase()).join(", ")
      };

      biblioteca.push(novoItem);
      novosItens.push(novoItem);
      adicionados++;
    }
  }

  return { biblioteca, novosItens, adicionados };
}

// -----------------------------------
// Geração HTML individual de item
// -----------------------------------
function gerarItemHTML(item, templateItem) {
  let conteudo = templateItem;
  conteudo = conteudo.replace(/{{TITULO}}/g, item.titulo);
  conteudo = conteudo.replace(/{{DESCRICAO}}/g, item.descricao);
  conteudo = conteudo.replace(/{{PALAVRAS}}/g, item.tags);
  conteudo = conteudo.replace(/{{SLUG}}/g, item.slug);
  conteudo = conteudo.replace(/{{CAPA}}/g, item.capa);
  conteudo = conteudo.replace(/{{FICHEIRO}}/g, item.ficheiro);
  conteudo = conteudo.replace(/{{CATEGORIA}}/g, item.categoria);
  conteudo = conteudo.replace(/{{TIPO}}/g, item.tipo);
  conteudo = conteudo.replace(/{{TAGS}}/g, item.tags);
  const caminhoItem = path.join("biblioteca", `${item.slug}.html`);
  escreverArquivo(caminhoItem, conteudo);
}

// -----------------------------------
// Paginação e geração downloads.html e pages
// -----------------------------------
function gerarPaginas(biblioteca, templateDownloads) {
  // Separar por categorias
  const categorias = {
    todos: biblioteca,
    documentos: biblioteca.filter(i => i.categoria === "documentos"),
    fotos: biblioteca.filter(i => i.categoria === "fotos"),
    videos: biblioteca.filter(i => i.categoria === "videos")
  };

  // Função para gerar grid HTML
  function gerarGridHTML(items) {
    return items
      .map(item => {
        return `<a href="/biblioteca/${item.slug}.html" class="file-card">
  <img src="/${item.capa}" alt="${item.titulo}" loading="lazy"/>
  <div class="file-card-title">${item.titulo}</div>
</a>`;
      })
      .join("\n");
  }

  // Função para criar páginas
  function criarPaginasPorCategoria(catItems, catNome) {
    const paginas = [];
    for (let i = 0; i < catItems.length; i += ITENS_POR_PAGINA) {
      paginas.push(catItems.slice(i, i + ITENS_POR_PAGINA));
    }
    return paginas.map((paginaItens, idx) => {
      let conteudo = templateDownloads;
      // Substituir grids
      conteudo = conteudo.replace("<!-- [GERAR_TODOS] -->", gerarGridHTML(categorias.todos.slice(idx * ITENS_POR_PAGINA, (idx + 1) * ITENS_POR_PAGINA)));
      conteudo = conteudo.replace("<!-- [GERAR_DOCUMENTOS] -->", gerarGridHTML(categorias.documentos.slice(idx * ITENS_POR_PAGINA, (idx + 1) * ITENS_POR_PAGINA)));
      conteudo = conteudo.replace("<!-- [GERAR_FOTOS] -->", gerarGridHTML(categorias.fotos.slice(idx * ITENS_POR_PAGINA, (idx + 1) * ITENS_POR_PAGINA)));
      conteudo = conteudo.replace("<!-- [GERAR_VIDEOS] -->", gerarGridHTML(categorias.videos.slice(idx * ITENS_POR_PAGINA, (idx + 1) * ITENS_POR_PAGINA)));
      // Paginação
      const totalPaginas = paginas.length;
      let pagLinks = "";
      for (let p = 0; p < totalPaginas; p++) {
        const pageNome = p === 0 ? "downloads.html" : `page${p + 1}.html`;
        pagLinks += `<a href="${pageNome}" class="${p === idx ? "active" : ""}">${p + 1}</a>\n`;
      }
      conteudo = conteudo.replace("<!-- [PAGINACAO] -->", pagLinks);
      return { idx, conteudo };
    });
  }

  // Criar páginas e salvar
  const todasPaginas = criarPaginasPorCategoria(categorias.todos, "todos");
  todasPaginas.forEach((p, idx) => {
    const arquivo = idx === 0 ? "downloads.html" : `page${idx + 1}.html`;
    escreverArquivo(arquivo, p.conteudo);
  });
}

// -----------------------------------
// Execução principal
// -----------------------------------
function executarBuild() {
  let biblioteca = carregarBiblioteca();

  const { biblioteca: bibliotecaAtualizada, novosItens, adicionados } = scanPastas(biblioteca);

  if (adicionados > 0) {
    console.log(`➕ ${adicionados} arquivos novos adicionados à biblioteca.json`);
    salvarBiblioteca(bibliotecaAtualizada);
    // Criar HTML individuais de novos itens
    const templateItem = carregarTemplate(TEMPLATE_ITEM);
    novosItens.forEach(item => gerarItemHTML(item, templateItem));
  }

  // Atualizar downloads.html e páginas paginadas
  const templateDownloads = carregarTemplate(TEMPLATE_DOWNLOADS);
  gerarPaginas(bibliotecaAtualizada, templateDownloads);

  console.log("✅ Build da biblioteca concluído!");
}

executarBuild();
