const fs = require('fs');
const path = require('path');

const paths = {
  posts: path.join(__dirname, '../posts-markdown'),
  templatePost: path.join(__dirname, '../blog-templates/post.template.html'),
  templateIndex: path.join(__dirname, '../blog-templates/index.template.html'),
  output: path.join(__dirname, '../blog'),
  baseUrl: 'https://www.calculadorasdeenfermagem.com.br/blog/'
};

if (!fs.existsSync(paths.output)) fs.mkdirSync(paths.output, { recursive: true });

function simpleMarkdownToHtml(md) {
  return md
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-black text-[#1A3E74] mb-6">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl md:text-3xl font-bold text-[#1A3E74] mt-12 mb-6 border-b pb-3">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 class="text-xl md:text-2xl font-bold text-[#4A90E2] mt-10 mb-4">$1</h3>')
    .replace(/!\[(.*?)\]\((.*?)\)/gim, '<img src="$2" alt="$1" class="w-full h-auto rounded-xl shadow-lg my-10" loading="lazy">')
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
    image: '/img/calculadorasimagem.webp', // Imagem padrão se não houver no MD
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
    else if (cleanLine.startsWith('image:')) meta.image = cleanLine.replace('image:', '').trim();
    else if (cleanLine.startsWith('---')) contentStartLine = index;
  });

  meta.content = lines.slice(contentStartLine + 1).join('\n').trim();
  meta.slug = fileName.replace('.md', '.html');

  return meta;
}

console.log('🚀 Iniciando a geração do Blog...');
const templatePost = fs.readFileSync(paths.templatePost, 'utf8');
const templateIndex = fs.readFileSync(paths.templateIndex, 'utf8');
const files = fs.readdirSync(paths.posts).filter(file => file.endsWith('.md'));

let postsListHtml = '';

files.forEach(file => {
  const rawContent = fs.readFileSync(path.join(paths.posts, file), 'utf8');
  const post = parsePost(rawContent, file);
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

  // GERA O CARD ESTILO "WINDOWS EXPLORER ICON"
  // Imagem quadrada, título embaixo, subtítulo (descrição)
  postsListHtml += `
    <a href="${post.slug}" class="group flex flex-col items-center text-center p-4 hover:bg-slate-50 rounded-xl transition-all duration-200 border border-transparent hover:border-slate-200">

      <!-- Imagem Miniatura (Quadrada / Aspect Ratio) -->
      <div class="w-full aspect-square mb-3 overflow-hidden rounded-xl bg-slate-100 shadow-sm group-hover:shadow-md transition-all">
        <img src="${post.image}" alt="${post.title}" class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" loading="lazy">
      </div>

      <!-- Título -->
      <h3 class="text-sm font-bold text-[#1A3E74] leading-tight mb-1 group-hover:text-[#4A90E2] transition-colors">
        ${post.title}
      </h3>

      <!-- Subtítulo / Comentário -->
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