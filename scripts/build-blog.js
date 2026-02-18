const fs = require('fs');
const path = require('path');

// Configurações
const paths = {
  posts: path.join(__dirname, '../posts-markdown'),
  templatePost: path.join(__dirname, '../blog-templates/post.template.html'),
  templateIndex: path.join(__dirname, '../blog-templates/index.template.html'),
  output: path.join(__dirname, '../blog'),
  // Domínio base sem a barra final
  domain: 'https://www.calculadorasdeenfermagem.com.br',
  // URL base para links canônicos
  baseUrl: 'https://www.calculadorasdeenfermagem.com.br/blog/'
};

if (!fs.existsSync(paths.output)) fs.mkdirSync(paths.output, { recursive: true });

/**
 * Converte datas em português (pt-BR) do formato:
 * "20 de Fevereiro de 2026" (com/sem acentos)
 * para um objeto Date.
 *
 * Se não conseguir interpretar, tenta new Date(dateStr) como fallback.
 */
function parseDatePtBr(dateStr) {
  if (!dateStr) return null;

  const months = {
    janeiro: 0,
    fevereiro: 1,
    marco: 2,
    março: 2,
    abril: 3,
    maio: 4,
    junho: 5,
    julho: 6,
    agosto: 7,
    setembro: 8,
    outubro: 9,
    novembro: 10,
    dezembro: 11
  };

  const clean = String(dateStr)
    .toLowerCase()
    .replace(/\./g, '')
    // normaliza acentos (sem depender de libs)
    .replace(/ç/g, 'c')
    .replace(/ã/g, 'a')
    .replace(/á/g, 'a')
    .replace(/â/g, 'a')
    .replace(/à/g, 'a')
    .replace(/é/g, 'e')
    .replace(/ê/g, 'e')
    .replace(/è/g, 'e')
    .replace(/í/g, 'i')
    .replace(/ì/g, 'i')
    .replace(/ó/g, 'o')
    .replace(/ô/g, 'o')
    .replace(/õ/g, 'o')
    .replace(/ò/g, 'o')
    .replace(/ú/g, 'u')
    .replace(/ù/g, 'u')
    .trim();

  // Ex: "20 de fevereiro de 2026"
  const m = clean.match(/^(\d{1,2})\s+de\s+([a-z]+)\s+de\s+(\d{4})$/);
  if (m) {
    const day = parseInt(m[1], 10);
    const monthName = m[2];
    const year = parseInt(m[3], 10);
    const month = months[monthName];

    if (month === undefined) return null;

    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }

  // fallback: se um dia você usar "2026-02-20"
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function simpleMarkdownToHtml(md) {
  return md
    // Headers
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-black text-[#1A3E74] mb-6">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl md:text-3xl font-bold text-[#1A3E74] mt-12 mb-6 border-b pb-3">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 class="text-xl md:text-2xl font-bold text-[#4A90E2] mt-10 mb-4">$1</h3>')

    // 1. IMAGENS (Processar ANTES dos links para não conflitar)
    .replace(/!\[(.*?)\]\((.*?)\)/gim, '<img src="$2" alt="$1" class="w-full h-auto rounded-xl shadow-lg my-10" loading="lazy">')

    // 2. LINKS (Adicionado Agora!)
    // Converte [Texto](URL) em <a href="URL">Texto</a> com estilo azul
    .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" class="text-[#4A90E2] font-bold hover:underline hover:text-[#1A3E74] transition-colors">$1</a>')

    // Listas e Texto
    .replace(/^\* (.*$)/gim, '<li class="mb-3 text-lg">$1</li>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p class="mb-6 text-base md:text-lg text-justify leading-8">')
    .replace(/<\/li>\n<li>/g, '</li><li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul class="list-disc ml-6 mb-8 text-slate-700">$1</ul>');
}

function parsePost(fileContent, fileName) {
  const meta = {
    title: 'Sem Título',
    description: 'Descrição indisponível.',
    date: 'Data não informada',
    keywords: 'enfermagem',
    image: 'https://www.calculadorasdeenfermagem.com.br/iconpages.webp', // Padrão absoluto
    canonical: paths.baseUrl + fileName.replace('.md', '.html')
  };

  const lines = fileContent.split('\n');
  let contentStartLine = 0;

  lines.forEach((line, index) => {
    const cleanLine = line.trim();
    if (cleanLine.startsWith('title:')) meta.title = cleanLine.replace('title:', '').trim();
    else if (cleanLine.startsWith('description:')) meta.description = cleanLine.replace('description:', '').trim();
    else if (cleanLine.startsWith('date:')) meta.date = cleanLine.replace('date:', '').trim();
    else if (cleanLine.startsWith('keywords:')) meta.keywords = cleanLine.replace('keywords:', '').trim();

    // Lógica Inteligente para Imagem
    else if (cleanLine.startsWith('image:')) {
      let imgVal = cleanLine.replace('image:', '').trim();
      if (imgVal.startsWith('/')) {
        meta.image = paths.domain + imgVal;
      } else if (!imgVal.startsWith('http')) {
        meta.image = paths.domain + '/' + imgVal;
      } else {
        meta.image = imgVal;
      }
    }

    else if (cleanLine.startsWith('---')) contentStartLine = index;
  });

  meta.content = lines.slice(contentStartLine + 1).join('\n').trim();
  meta.slug = fileName.replace('.md', '.html');

  // ✅ (Passo 1B) guarda um Date real para ordenar o índice por data
  meta.dateObj = parseDatePtBr(meta.date);

  return meta;
}

console.log('🚀 Iniciando a geração do Blog...');
const templatePost = fs.readFileSync(paths.templatePost, 'utf8');
const templateIndex = fs.readFileSync(paths.templateIndex, 'utf8');
const files = fs.readdirSync(paths.posts).filter(file => file.endsWith('.md'));

let postsListHtml = '';

// ✅ (Passo 1C) cria array de posts e ordena por data desc (mais novos primeiro)
const posts = files.map(file => {
  const rawContent = fs.readFileSync(path.join(paths.posts, file), 'utf8');
  const post = parsePost(rawContent, file);
  return post;
});

posts.sort((a, b) => {
  // posts sem data válida vão para o final
  const ad = a.dateObj ? a.dateObj.getTime() : -Infinity;
  const bd = b.dateObj ? b.dateObj.getTime() : -Infinity;
  return bd - ad;
});

posts.forEach(post => {
  const htmlBody = simpleMarkdownToHtml(post.content);

  // Gera Página Individual
  let finalHtml = templatePost
    .replace(/{{title}}/g, post.title)
    .replace(/{{description}}/g, post.description)
    .replace(/{{date}}/g, post.date)
    .replace(/{{keywords}}/g, post.keywords)
    .replace(/{{canonical}}/g, post.canonical)
    .replace(/{{image}}/g, post.image)
    .replace(/{{content}}/g, htmlBody);

  fs.writeFileSync(path.join(paths.output, post.slug), finalHtml);
  console.log(`✅ Gerado: ${post.slug}`);

  // Card para o Índice
  postsListHtml += `
    <a href="${post.slug}" class="group flex flex-col items-center text-center p-4 hover:bg-slate-50 rounded-xl transition-all duration-200 border border-transparent hover:border-slate-200">
      <div class="w-full aspect-square mb-3 overflow-hidden rounded-xl bg-slate-100 shadow-sm group-hover:shadow-md transition-all">
        <img src="${post.image}" alt="${post.title}" class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" loading="lazy">
      </div>
      <h3 class="text-sm font-bold text-[#1A3E74] leading-tight mb-1 group-hover:text-[#4A90E2] transition-colors">
        ${post.title}
      </h3>
      <p class="text-xs text-slate-500 line-clamp-2">
        ${post.description}
      </p>
    </a>
  `;
});

const finalIndexHtml = templateIndex.replace('{{posts_list}}', postsListHtml);
fs.writeFileSync(path.join(paths.output, 'index.html'), finalIndexHtml);
console.log(`✅ Índice atualizado: blog/index.html`);
console.log(`\n🎉 Pronto! ${files.length} artigos processados.`);
