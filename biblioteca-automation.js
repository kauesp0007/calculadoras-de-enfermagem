#!/usr/bin/env node
/* eslint-env node */

/**
 * =========================================================================
 *  BIBLIOTECA AUTOMATION — Pipeline Completo de Catalogação
 *  Calculadoras de Enfermagem
 * =========================================================================
 *
 *  ETAPAS:
 *    0. Catalogador Inteligente: renomeia PDFs novos na pasta docs/
 *       (usa o sistema Python catalogador com DeepSeek)
 *    1. Scanner: varre docs/, img/, videos/ e atualiza biblioteca.json
 *    2. Limpeza: remove de biblioteca.json entradas de PDFs renomeados/deletados
 *    3. Limpeza: exclui HTMLs individuais órfãos da pasta biblioteca/
 *    4. Capas: gera thumbnails .webp para PDFs e vídeos sem capa
 *    5. Build biblioteca: gera/atualiza HTMLs individuais em biblioteca/
 *       com SEO enriquecido a partir dos nomes catalogados
 *    6. Build downloads: gera downloads.html + paginação
 *    7. Build Tailwind CSS
 *    8. Service Worker
 * =========================================================================
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ── Constantes ───────────────────────────────────────────────────────
const JSON_DB = 'biblioteca.json';
const DOCS_DIR = path.join(process.cwd(), 'docs');
const BIBLIOTECA_DIR = path.join(process.cwd(), 'biblioteca');
const PYTHON_PATH = 'C:/Users/kaues/AppData/Local/Python/pythoncore-3.14-64/python.exe';
const CATALOGADOR_MODULE = 'automacoes.catalogador.main';

// ── Utilitários ──────────────────────────────────────────────────────
function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function tituloFromFilename(filename) {
  return filename
    .replace(/\.[^/.]+$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Extrai metadados ricos do nome catalogado (padrão ANO_INSTITUICAO_CODIGO_TITULO.pdf).
 * Ex: 2024_Ministerio_da_Saude_Protocolo_AVC.pdf
 *     → { ano: 2024, instituicao: 'Ministerio da Saude', titulo: 'Protocolo AVC', ... }
 */
function extrairMetadadosDoNome(nomeArquivo) {
  const semExt = nomeArquivo.replace(/\.pdf$/i, '');
  const partes = semExt.split('_');

  if (partes.length < 2) return null;

  const resultado = { ano: null, instituicao: '', codigo: '', titulo: '', tipo: '' };

  // Detecta ano no início (4 dígitos)
  if (/^\d{4}$/.test(partes[0])) {
    resultado.ano = partes[0];
    partes.shift();
  }

  // Detecta código interno (ex: POP.DEA.006, MA.DENF.001, RESOLUCAO_736)
  const codigoPattern = /^[A-Z]{2,}\.[A-Z]{2,}\.\d{3}$|^[A-Z]+\d*_\d+|^\d+\/\d{4}/;
  const codigoIdx = partes.findIndex(p => codigoPattern.test(p));
  if (codigoIdx > 0) {
    resultado.instituicao = partes.slice(0, codigoIdx).join(' ');
    resultado.codigo = partes[codigoIdx].replace(/_/g, ' ');
    partes.splice(0, codigoIdx + 1);
  } else if (partes.length >= 2) {
    // Assume que as primeiras 1-2 palavras são a instituição
    // Heurística: palavras em maiúsculo ou nomes próprios são instituição
    const instParts = [];
    while (partes.length > 1 && /^[A-Z]/.test(partes[0])) {
      instParts.push(partes.shift());
    }
    if (instParts.length === 0 && partes.length > 0) {
      instParts.push(partes.shift());
    }
    resultado.instituicao = instParts.join(' ');
  }

  // O resto é o título
  resultado.titulo = partes.join(' ').replace(/-/g, ' ');

  // Detecta tipo documental pelo título ou código
  const tituloLower = resultado.titulo.toLowerCase();
  if (tituloLower.includes('resolucao') || tituloLower.includes('resolução')) resultado.tipo = 'Resolução';
  else if (tituloLower.includes('portaria')) resultado.tipo = 'Portaria';
  else if (tituloLower.includes('protocolo') || tituloLower.includes('pop')) resultado.tipo = 'Protocolo';
  else if (tituloLower.includes('manual') || tituloLower.includes('guia')) resultado.tipo = 'Manual';
  else if (tituloLower.includes('diretriz') || tituloLower.includes('guideline')) resultado.tipo = 'Diretriz';
  else if (tituloLower.includes('artigo') || tituloLower.includes('revisão')) resultado.tipo = 'Artigo Científico';
  else if (tituloLower.includes('prova') || tituloLower.includes('concurso')) resultado.tipo = 'Prova';
  else resultado.tipo = 'Documento';

  return resultado;
}

/**
 * Gera descrição SEO enriquecida usando metadados do nome catalogado.
 */
function gerarDescricaoSEO(metadados, nomeArquivo) {
  if (!metadados) {
    return `Documento técnico de enfermagem para download. Material educacional de apoio à prática clínica e estudos.`;
  }

  const { ano, instituicao, tipo, titulo } = metadados;
  const partes = [];

  if (tipo && titulo) {
    partes.push(`${tipo} sobre ${titulo}`);
  } else if (titulo) {
    partes.push(`Documento sobre ${titulo}`);
  }

  if (instituicao) {
    partes.push(`publicado por ${instituicao}`);
  }

  if (ano) {
    partes.push(`em ${ano}`);
  }

  partes.push('para download gratuito.');
  partes.push('Material essencial para profissionais e estudantes de enfermagem.');

  return partes.join(' ');
}

/**
 * Gera keywords SEO enriquecidas.
 */
function gerarKeywordsSEO(metadados, nomeArquivo) {
  const base = ['enfermagem', 'download', 'material de estudo', 'saúde'];
  if (!metadados) return base;

  const extras = [];
  if (metadados.titulo) {
    // Adiciona palavras do título como keywords
    metadados.titulo.toLowerCase().split(' ').filter(w => w.length > 3).forEach(w => extras.push(w));
  }
  if (metadados.instituicao) extras.push(metadados.instituicao.toLowerCase());
  if (metadados.tipo) extras.push(metadados.tipo.toLowerCase());
  if (metadados.ano) extras.push(metadados.ano);

  return [...new Set([...extras, ...base])];
}

// ── Etapa 0: Catalogador Inteligente ──────────────────────────────────
function executarCatalogador() {
  console.log('🤖 Etapa 0: Catalogador Inteligente — renomeando PDFs...');
  try {
    execSync(
      `"${PYTHON_PATH}" -m ${CATALOGADOR_MODULE} --once`,
      { stdio: 'inherit', timeout: 600000 } // 10 min timeout
    );
    console.log('✅ Catalogador concluído.\n');
  } catch (err) {
    console.error('⚠️  Aviso: Catalogador retornou erro (pode ser normal se não houver PDFs novos).');
    console.error('   Continuando pipeline...\n');
  }
}

// ── Etapa 1: Scanner ─────────────────────────────────────────────────
function executarScanner() {
  console.log('🔎 Etapa 1: Executando scanner-biblioteca.js...');
  execSync('node scanner-biblioteca.js', { stdio: 'inherit' });
  console.log('');
}

// ── Etapa 2: Limpeza do biblioteca.json ──────────────────────────────
function limparBibliotecaJson() {
  console.log('🧹 Etapa 2: Limpando biblioteca.json de entradas órfãs...');

  if (!fs.existsSync(JSON_DB)) return;

  const biblioteca = JSON.parse(fs.readFileSync(JSON_DB, 'utf8'));
  const removidos = [];
  const mantidos = [];

  for (const item of biblioteca) {
    // Verifica se o arquivo físico existe
    const ficheiroPath = item.ficheiro;
    if (!ficheiroPath) {
      removidos.push(item);
      continue;
    }

    const caminhoAbsoluto = path.join(process.cwd(), ficheiroPath.replace(/^\//, ''));
    if (fs.existsSync(caminhoAbsoluto)) {
      mantidos.push(item);
    } else {
      removidos.push(item);
      console.log(`  🗑️  Removido (arquivo não encontrado): ${item.ficheiro}`);
    }
  }

  if (removidos.length > 0) {
    fs.writeFileSync(JSON_DB, JSON.stringify(mantidos, null, 2), 'utf8');
    console.log(`  ✅ ${removidos.length} entradas removidas do biblioteca.json`);
  } else {
    console.log('  ✅ Nenhuma entrada órfã encontrada.');
  }
  console.log('');
}

// ── Etapa 3: Limpeza de HTMLs órfãos ─────────────────────────────────
function limparHtmlsOrfaos() {
  console.log('🧹 Etapa 3: Limpando HTMLs órfãos da pasta biblioteca/...');

  if (!fs.existsSync(BIBLIOTECA_DIR)) {
    console.log('  Pasta biblioteca/ não existe. Pulando.');
    console.log('');
    return;
  }

  if (!fs.existsSync(JSON_DB)) {
    console.log('  biblioteca.json não existe. Pulando.');
    console.log('');
    return;
  }

  const biblioteca = JSON.parse(fs.readFileSync(JSON_DB, 'utf8'));
  const slugsValidos = new Set(biblioteca.map(item => item.slug || slugify(item.titulo || '')));

  const arquivosHtml = fs.readdirSync(BIBLIOTECA_DIR).filter(f => f.endsWith('.html'));
  let excluidos = 0;

  for (const htmlFile of arquivosHtml) {
    const slugDoArquivo = htmlFile.replace('.html', '');
    if (!slugsValidos.has(slugDoArquivo) && slugDoArquivo) {
      const caminhoCompleto = path.join(BIBLIOTECA_DIR, htmlFile);
      try {
        fs.unlinkSync(caminhoCompleto);
        excluidos++;
        console.log(`  🗑️  Excluído: biblioteca/${htmlFile}`);
      } catch (err) {
        console.error(`  ❌ Erro ao excluir ${htmlFile}: ${err.message}`);
      }
    }
  }

  if (excluidos > 0) {
    console.log(`  ✅ ${excluidos} HTMLs órfãos excluídos.`);
  } else {
    console.log('  ✅ Nenhum HTML órfão encontrado.');
  }
  console.log('');
}

// ── Etapa 3.5: Enriquecer biblioteca.json com metadados ──────────────
function enriquecerMetadados() {
  console.log('📝 Etapa 3.5: Enriqueciendo metadados SEO dos PDFs catalogados...');

  if (!fs.existsSync(JSON_DB)) return;

  const biblioteca = JSON.parse(fs.readFileSync(JSON_DB, 'utf8'));
  let enriquecidos = 0;

  for (const item of biblioteca) {
    if (item.categoria !== 'documentos') continue;

    const nomeArquivo = item.download || path.basename(item.ficheiro || '');
    const metadados = extrairMetadadosDoNome(nomeArquivo);

    if (metadados && metadados.titulo) {
      // Só enriquece se o título atual é genérico (derivado simplesmente do nome)
      const tituloAtual = item.titulo || '';
      const tituloCatalogado = metadados.titulo
        .replace(/\b\w/g, l => l.toUpperCase());

      // Atualiza o título se o catalogado for mais descritivo
      if (tituloCatalogado.length > tituloAtual.length || !item.meta_descricao) {
        if (tituloCatalogado.length > 10) {
          item.titulo = tituloCatalogado;
        }
        item.slug = slugify(tituloCatalogado);

        // Descrição SEO enriquecida
        if (!item.meta_descricao || item.meta_descricao.length < 50) {
          item.meta_descricao = gerarDescricaoSEO(metadados, nomeArquivo);
        }

        // Keywords enriquecidas
        if (!item.keywords || item.keywords.length < 3) {
          item.keywords = gerarKeywordsSEO(metadados, nomeArquivo);
        }

        // Descrição normal (para a UI)
        if (!item.descricao || item.descricao.length < 30) {
          item.descricao = gerarDescricaoSEO(metadados, nomeArquivo);
        }

        enriquecidos++;
      }
    }
  }

  if (enriquecidos > 0) {
    fs.writeFileSync(JSON_DB, JSON.stringify(biblioteca, null, 2), 'utf8');
    console.log(`  ✅ ${enriquecidos} itens enriquecidos com metadados SEO.`);
  } else {
    console.log('  ✅ Nenhum item precisou de enriquecimento.');
  }
  console.log('');
}

// ── Pipeline Principal ───────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   📚 BIBLIOTECA AUTOMATION — Pipeline de Catalogação    ║');
  console.log('║   Calculadoras de Enfermagem                            ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');

  const inicio = Date.now();

  // ═══════════════════════════════════════════════════════════════
  // ETAPA 0: Catalogador Inteligente (renomeia PDFs novos)
  // ═══════════════════════════════════════════════════════════════
  executarCatalogador();

  // ═══════════════════════════════════════════════════════════════
  // ETAPA 1: Scanner (varre docs/, img/, videos/)
  // ═══════════════════════════════════════════════════════════════
  executarScanner();

  // ═══════════════════════════════════════════════════════════════
  // ETAPA 2: Limpeza — remove entradas órfãs do biblioteca.json
  // ═══════════════════════════════════════════════════════════════
  limparBibliotecaJson();

  // ═══════════════════════════════════════════════════════════════
  // ETAPA 3: Limpeza — exclui HTMLs individuais órfãos
  // ═══════════════════════════════════════════════════════════════
  limparHtmlsOrfaos();

  // ═══════════════════════════════════════════════════════════════
  // ETAPA 3.5: Enriquecer metadados SEO
  // ═══════════════════════════════════════════════════════════════
  enriquecerMetadados();

  // ═══════════════════════════════════════════════════════════════
  // ETAPA 4: Geração de capas PDF
  // ═══════════════════════════════════════════════════════════════
  if (!fs.existsSync(JSON_DB)) {
    console.error('❌ biblioteca.json não encontrado. Abortando.');
    process.exit(1);
  }
  const biblioteca = JSON.parse(fs.readFileSync(JSON_DB, 'utf8'));

  const pdfsSemCapa = biblioteca.filter(
    i => i.categoria === 'documentos' && i.ficheiro && (!i.capa || i.capa === '')
  );

  if (pdfsSemCapa.length > 0) {
    console.log(`🎨 Etapa 4: ${pdfsSemCapa.length} PDFs sem capa. Gerando...`);
    try {
      execSync('node gerarCapasPDF.js', { stdio: 'inherit' });
      console.log('✅ Geração de capas concluída.\n');
    } catch (err) {
      console.error('❌ Falha ao executar gerarCapasPDF.js:', err.message || err);
    }
  } else {
    console.log('🎨 Etapa 4: Nenhum PDF sem capa. Pulando.\n');
  }

  // ═══════════════════════════════════════════════════════════════
  // ETAPA 5: Build — páginas individuais da biblioteca
  // ═══════════════════════════════════════════════════════════════
  console.log('📚 Etapa 5: Gerando páginas individuais da biblioteca...');
  execSync('node build-biblioteca.js', { stdio: 'inherit' });
  console.log('');

  // ═══════════════════════════════════════════════════════════════
  // ETAPA 6: Build — páginas de downloads (index + paginação)
  // ═══════════════════════════════════════════════════════════════
  console.log('🔧 Etapa 6: Gerando downloads.html + paginação...');
  execSync('node build-downloads.js', { stdio: 'inherit' });
  console.log('');

  // ═══════════════════════════════════════════════════════════════
  // ETAPA 7: Build Tailwind CSS
  // ═══════════════════════════════════════════════════════════════
  console.log('🎨 Etapa 7: Compilando Tailwind CSS...');
  execSync(
    '.\\node_modules\\.bin\\tailwindcss -i ./src/input.css -o ./public/output.css --minify',
    { stdio: 'inherit' }
  );
  console.log('');

  // ═══════════════════════════════════════════════════════════════
  // ETAPA 8: Service Worker
  // ═══════════════════════════════════════════════════════════════
  console.log('🧩 Etapa 8: Gerando Service Worker...');
  execSync('node gerar-sw.js', { stdio: 'inherit' });

  const tempo = ((Date.now() - inicio) / 1000).toFixed(1);
  console.log('');
  console.log('══════════════════════════════════════════════════════════');
  console.log(`  🎯 Pipeline concluído em ${tempo}s`);
  console.log('  📦 Biblioteca, downloads, CSS e Service Worker atualizados.');
  console.log('══════════════════════════════════════════════════════════');
}

main().catch(err => {
  console.error('❌ Erro no pipeline:', err && err.stack ? err.stack : err);
  process.exit(1);
});
}

main().catch(err => {
  console.error('Erro no processo unificado:', err && err.stack ? err.stack : err);
  process.exit(1);
});