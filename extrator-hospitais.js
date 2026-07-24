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
    console.log(`\n🔍 [1/4] Iniciando o navegador fantasma e acessando: ${urlAlvo}...`);
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
            if (req.resourceType() === 'image' || req.resourceType() === 'stylesheet' || req.resourceType() === 'font') {
                req.abort();
            } else {
                req.continue();
            }
        });

        await page.goto(urlAlvo, { waitUntil: 'domcontentloaded', timeout: 60000 });
        
        const textoDaPagina = await page.evaluate(() => document.body.innerText);
        await browser.close();

        console.log(`✅ [2/4] Leitura concluída. Enviando dados para a Inteligência Artificial (OpenAI)...`);

        const promptSistema = `
            Você é um assistente de RH de enfermagem especializado em extração de dados.
            Analise o texto fornecido e retorne APENAS um objeto JSON estrito.
            
            O JSON deve ter EXATAMENTE este formato (não invente chaves):
            {
                "id": "hosp-nomedohospital",
                "name": "Nome Oficial do Hospital ou Empresa",
                "type": "Descreva em poucas palavras o perfil (ex: Hospital Geral, Maternidade, OSS)",
                "location": "Cidade, Estado",
                "gestao": "Nome da instituição mantenedora ou Privada",
                "link": "${urlAlvo}",
                "telefone": "telefone se encontrar, senão null",
                "email": "email de RH se encontrar, senão null"
            }
        `;

        const resultado = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" }, 
            messages: [
                { role: "system", content: promptSistema },
                { role: "user", content: `Texto extraído do site:\n${textoDaPagina.substring(0, 15000)}` }
            ],
            temperature: 0.1, 
        });

        const respostaIA = resultado.choices[0].message.content;
        const novoHospital = JSON.parse(respostaIA);

        console.log(`✅ [3/4] OpenAI processou os dados com sucesso! Hospital: ${novoHospital.name}`);

        await salvarNoBancoDeDados(novoHospital);

    } catch (erro) {
        console.error('❌ Ocorreu um erro durante a extração:', erro);
        if (browser) await browser.close();
    }
}

async function salvarNoBancoDeDados(novoHospital) {
    console.log(`💾 [4/4] Salvando no arquivo hospitais.json...`);
    try {
        let hospitais = [];
        
        try {
            const data = await fs.readFile(caminhoBancoDados, 'utf8');
            hospitais = JSON.parse(data);
        } catch (err) {
            console.log('⚠️ Arquivo hospitais.json não encontrado. Criando um novo...');
        }

        const existe = hospitais.find(h => h.id === novoHospital.id);
        if (existe) {
            console.log(`⚠️ O hospital ${novoHospital.name} já existe no banco de dados. Atualizando...`);
            const index = hospitais.findIndex(h => h.id === novoHospital.id);
            hospitais[index] = novoHospital;
        } else {
            hospitais.push(novoHospital);
        }

        await fs.writeFile(caminhoBancoDados, JSON.stringify(hospitais, null, 4), 'utf8');
        console.log(`🚀 SUCESSO! Banco de dados atualizado. A página HTML já pode ler os novos dados!`);

    } catch (erro) {
        console.error('❌ Erro ao salvar o banco de dados:', erro);
    }
}

// ==========================================
// MODO DE CAÇA AUTOMÁTICA (WEB CRAWLER + SCRAPER)
// ==========================================

async function buscarURLsNaWeb(termoDeBusca) {
    console.log(`\n🕵️‍♂️ [1/2 - O CAÇADOR] Buscando no Google por: "${termoDeBusca}"...`);
    let browser;
    try {
        browser = await puppeteer.launch({ 
            headless: false, 
            defaultViewport: null,
            args: ['--start-maximized']
        });
        const page = await browser.newPage();
        
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setExtraHTTPHeaders({ 'Accept-Language': 'pt-BR,pt;q=0.9' });
        
        const urlBusca = `https://www.google.com/search?q=${encodeURIComponent(termoDeBusca)}`;
        await page.goto(urlBusca, { waitUntil: 'domcontentloaded' });

        console.log(`⏳ Aguardando 20 segundos para carregar tudo (Resolva o Captcha na tela se aparecer!)...`);
        await new Promise(resolve => setTimeout(resolve, 20000));

        // EXTRAÇÃO INTELIGENTE (À prova de tracking do Google)
        let linksEncontrados = await page.evaluate(() => {
            const todosOsLinks = Array.from(document.querySelectorAll('a'));
            const urlsLimpas = [];

            todosOsLinks.forEach(a => {
                let href = a.href;
                
                // Remove the redirect tracking link from google search
                if (href.includes('google.com/url?')) {
                    try {
                        const urlParams = new URL(href).searchParams;
                        href = urlParams.get('url') || urlParams.get('q') || href;
                    } catch (e) { }
                }

                // Filtro rigoroso: Só aceita links externos reais e relevantes
                if (
                    href && 
                    href.startsWith('http') && 
                    !href.includes('google.com') && 
                    !href.includes('youtube.com') &&
                    !href.includes('facebook.com') &&
                    !href.includes('instagram.com') &&
                    !href.includes('linkedin.com') &&
                    !href.includes('microsoft.com') &&
                    href.length > 25
                ) {
                    urlsLimpas.push(href);
                }
            });
            
            return urlsLimpas;
        });

        await browser.close();

        const linksUnicos = [...new Set(linksEncontrados)].slice(0, 20);
        console.log(`🎯 A busca encontrou ${linksUnicos.length} links promissores!`);
        
        return linksUnicos;

    } catch (erro) {
        console.error('❌ Erro na busca:', erro);
        if (browser) await browser.close();
        return [];
    }
}

async function iniciarCacaAutomatica(termoPesquisa) {
    const urlsParaRastrear = await buscarURLsNaWeb(termoPesquisa);
    
    if (urlsParaRastrear.length === 0) {
        console.log('⚠️ Nenhum link encontrado. O buscador bloqueou a requisição ou a internet caiu.');
        return;
    }

    console.log(`\n🚀 [2/2 - O EXTRATOR] Iniciando leitura em massa dos ${urlsParaRastrear.length} sites encontrados...`);
    
    for (let i = 0; i < urlsParaRastrear.length; i++) {
        const url = urlsParaRastrear[i];
        console.log(`\n--------------------------------------------------`);
        console.log(`▶️  Processando site ${i + 1} de ${urlsParaRastrear.length}`);
        console.log(`🔗 Link: ${url}`);
        console.log(`--------------------------------------------------`);
        
        await iniciarExtracao(url);
        
        if (i < urlsParaRastrear.length - 1) {
            console.log(`\n⏳ Aguardando 5 segundos para esfriar os motores...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
    
    console.log(`\n🎉 CAÇA E EXTRAÇÃO CONCLUÍDAS! Todos os dados novos foram salvos no hospitais.json.`);
}

iniciarCacaAutomatica('"trabalhe conosco" hospital enfermagem são paulo');
