require('dotenv').config();
const puppeteer = require('puppeteer');
const { OpenAI } = require('openai');
const fs = require('fs').promises;
const path = require('path');

// Inicializa a IA da OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});
const caminhoBancoDados = path.join(__dirname, 'hospitais.json');

async function iniciarExtracao(urlAlvo) {
    console.log(`\n🔍 [1/4] Iniciando navegador para: ${urlAlvo}...`);
    let browser;
    try {
        browser = await puppeteer.launch({ 
            headless: false, 
            defaultViewport: null, 
            args: ['--start-maximized'] 
        });
        const page = await browser.newPage();
        
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        await page.goto(urlAlvo, { waitUntil: 'domcontentloaded', timeout: 60000 });
        const textoDaPagina = await page.evaluate(() => document.body.innerText);
        await browser.close();

        console.log(`✅ [2/4] Leitura feita. Processando com OpenAI...`);

        const promptSistema = `
            Você é um assistente de RH de enfermagem. Analise o texto e retorne APENAS um objeto JSON:
            {
                "id": "hosp-nomedohospital",
                "name": "Nome",
                "type": "Perfil (ex: Hospital Geral)",
                "location": "Cidade, Estado",
                "gestao": "Gestão",
                "link": "${urlAlvo}",
                "telefone": null,
                "email": null
            }
        `;

        const resultado = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: promptSistema },
                { role: "user", content: `Texto do site:\n${textoDaPagina.substring(0, 15000)}` }
            ],
            temperature: 0.1,
        });

        const novoHospital = JSON.parse(resultado.choices[0].message.content);
        console.log(`✅ [3/4] Dados extraídos: ${novoHospital.name}`);
        await salvarNoBancoDeDados(novoHospital);

    } catch (erro) {
        console.error('❌ Erro na extração:', erro);
        if (browser) await browser.close();
    }
}

async function salvarNoBancoDeDados(novoHospital) {
    console.log(`💾 [4/4] Salvando no hospitais.json...`);
    try {
        let hospitais = [];
        try {
            const data = await fs.readFile(caminhoBancoDados, 'utf8');
            hospitais = JSON.parse(data);
        } catch (err) { console.log('⚠️ Criando novo banco...'); }

        const existe = hospitais.find(h => h.id === novoHospital.id);
        if (existe) {
            console.log(`⚠️ ${novoHospital.name} já existe. Atualizando...`);
            hospitais[hospitais.findIndex(h => h.id === novoHospital.id)] = novoHospital;
        } else {
            hospitais.push(novoHospital);
        }
        await fs.writeFile(caminhoBancoDados, JSON.stringify(hospitais, null, 4), 'utf8');
        console.log(`🚀 Banco de dados atualizado!`);
    } catch (erro) { console.error('❌ Erro ao salvar:', erro); }
}

// ==========================================
// MODO DE CAÇA (CRAWLER COM 20 RESULTADOS)
// ==========================================

async function buscarURLsNaWeb() {
    const locais = ["São Paulo", "Campinas", "Santos", "ABC Paulista", "Guarulhos", "Osasco", "Interior SP", "Litoral SP"];
    const termos = ['"trabalhe conosco" hospital enfermagem', '"trabalhe conosco" centro médico', '"processo seletivo" hospital', '"envie seu currículo" hospital'];
    
    const buscaFinal = `${termos[Math.floor(Math.random() * termos.length)]} ${locais[Math.floor(Math.random() * locais.length)]}`;
    
    console.log(`\n🕵️‍♂️ [1/2] Caçando por: "${buscaFinal}"...`);
    let browser;
    try {
        browser = await puppeteer.launch({ headless: false, defaultViewport: null, args: ['--start-maximized'] });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        await page.goto(`https://www.google.com/search?q=${encodeURIComponent(buscaFinal)}`, { waitUntil: 'domcontentloaded' });

        // Espera 20 segundos para o Captcha
        console.log(`⏳ Aguardando 20 segundos para carregar (Resolva o Captcha se necessário!)...`);
        await new Promise(resolve => setTimeout(resolve, 20000));

        let linksEncontrados = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a'))
                .map(a => a.href)
                .filter(href => href.includes('http') && !href.includes('google.com') && href.length > 30);
        });

        await browser.close();
        const linksUnicos = [...new Set(linksEncontrados)].slice(0, 20); // 20 resultados
        console.log(`🎯 A busca encontrou ${linksUnicos.length} links promissores!`);
        return linksUnicos;
    } catch (erro) {
        console.error('❌ Erro na busca:', erro);
        if (browser) await browser.close();
        return [];
    }
}

async function iniciarCacaAutomatica() {
    const urls = await buscarURLsNaWeb();
    if (urls.length === 0) return console.log('⚠️ Nenhum link.');

    console.log(`\n🚀 [2/2] Extraindo 20 sites...`);
    for (let i = 0; i < urls.length; i++) {
        await iniciarExtracao(urls[i]);
        if (i < urls.length - 1) await new Promise(resolve => setTimeout(resolve, 5000));
    }
    console.log(`\n🎉 CAÇA FINALIZADA!`);
}

iniciarCacaAutomatica();