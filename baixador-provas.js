const axios = require('axios');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { buildBiblioteca } = require('./build-pdf_provas_de_concursos');

const PASTA_PDFS = path.join(__dirname, 'provas-pdf');
if (!fs.existsSync(PASTA_PDFS)) fs.mkdirSync(PASTA_PDFS);

async function baixarProvas() {
    console.log("🕵️‍♂️ Caçando provas no PCI Concursos...");
    
    const browser = await puppeteer.launch({ 
        headless: false, 
        args: ['--start-maximized'] 
    });
    const page = await browser.newPage();
    
    // PCI Concursos tem uma área de provas que é aberta
    const urlBusca = 'https://www.pciconcursos.com.br/provas/enfermagem';
    await page.goto(urlBusca, { waitUntil: 'networkidle2' });

    console.log("⏳ Aguardando carregamento dos links...");
    await new Promise(r => setTimeout(r, 5000));

    // Captura os links de provas que levam a PDFs
    const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a'))
            .map(a => a.href)
            .filter(href => href.includes('pciconcursos.com.br/provas/download'));
    });

    console.log(`🎯 Encontrei ${links.length} possíveis downloads. Iniciando...`);
    
    for (let i = 0; i < Math.min(links.length, 5); i++) {
        try {
            console.log(`🔗 Acessando: ${links[i]}`);
            await page.goto(links[i], { waitUntil: 'networkidle2' });
            
            // Tenta achar o link do PDF dentro da página de download do PCI
            const pdfUrl = await page.evaluate(() => {
                const a = document.querySelector('a[href$=".pdf"]');
                return a ? a.href : null;
            });

            if (pdfUrl) {
                const nomeArquivo = `prova_pci_${Date.now()}_${i}.pdf`;
                const writer = fs.createWriteStream(path.join(PASTA_PDFS, nomeArquivo));
                const response = await axios({ url: pdfUrl, method: 'GET', responseType: 'stream' });
                response.data.pipe(writer);
                await new Promise(r => writer.on('finish', r));
                console.log(`✅ Sucesso: ${nomeArquivo}`);
            }
        } catch (e) {
            console.log(`❌ Erro no download ${i}: ${e.message}`);
        }
    }
    
    await browser.close();
    buildBiblioteca();
    console.log("🎉 Processo finalizado!");
}

baixarProvas();