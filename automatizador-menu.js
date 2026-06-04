const fs = require('fs');
const cheerio = require('cheerio');
const path = require('path');

// ==========================================
// 1. PREENCHA AS INFORMAÇÕES DA NOVA PÁGINA
// ==========================================
const novaPagina = {
    nome: "Novo Protocolo de Exemplo",      // Ex: "Protocolo de Sepse"
    url: "/novo-protocolo.html",            // Ex: "/protocolo-sepse.html"
    destino: "nsp"                          // Escolha um dos códigos listados abaixo
};

// ==========================================
// 2. LISTA DE CÓDIGOS DE DESTINO DISPONÍVEIS
// Copie um dos códigos abaixo e cole no campo "destino" acima.
// ==========================================
/*
   -- SOBRE NÓS --
   sobre-nos | acessibilidade | sustentabilidade | politicas

   -- CALCULADORAS --
   calculadoras-principais | escalas-enfermagem

   -- CONTEÚDOS DE ENFERMAGEM --
   nsp (Núcleo de Segurança do Paciente) | saude-publica | legislacoes
   literatura | saude-mental | urgencia-emergencia | bloco-operatorio
   clinica-medica | enfermagem-trabalho | seguranca-trabalho

   -- DEMAIS ÁREAS --
   sites-emprego | biblioteca | simulados | fale-conosco
*/

console.log("Iniciando a inserção da página:", novaPagina.nome);

// 3. Caminho do arquivo menu-global.html (Ajuste se estiver em outra pasta)
const menuPath = path.join(__dirname, 'menu-global.html');

// 4. Lê o arquivo HTML
if (!fs.existsSync(menuPath)) {
    console.error("❌ Erro: O arquivo menu-global.html não foi encontrado no caminho:", menuPath);
    process.exit(1);
}

const html = fs.readFileSync(menuPath, 'utf8');
// Carrega o HTML no Cheerio (sem criar html/head/body envolventes)
const $ = cheerio.load(html, null, false);

// 5. Mapeamento de onde inserir cada item (Desktop e Mobile)
// Aqui usamos os textos dos links (aquelas spans ou a que contém o título do submenu) ou IDs para achar a tag <ul> pai certa.
const mapaDestinos = {
    // === SOBRE NÓS ===
    'sobre-nos': {
        desktop: 'button:contains("Sobre Nós") + ul',
        mobile: 'button[data-submenu-toggle="sobre-nos"] + ul'
    },
    'acessibilidade': {
        desktop: 'a:contains("Acessibilidade Digital") + ul',
        mobile: 'a[data-submenu-toggle="acessibilidade-digital-sub"] + ul'
    },
    'sustentabilidade': {
        desktop: 'a:contains("Sustentabilidade Digital") + ul',
        mobile: 'a[data-submenu-toggle="sustentabilidade-digital-sub"] + ul'
    },
    'politicas': {
        desktop: 'a:contains("Políticas do Site") + ul',
        mobile: 'a[data-submenu-toggle="politicas-sub"] + ul'
    },

    // === CALCULADORAS ===
    'calculadoras-principais': {
        desktop: 'a:contains("Calculadoras") + ul', // Dentro do submenu Calculadoras
        mobile: '#submenu-calculadoras-sub'
    },
    'escalas-enfermagem': {
        desktop: 'a:contains("Escalas de Enfermagem") + ul',
        mobile: '#submenu-escalas-sub'
    },

    // === CONTEÚDOS DE ENFERMAGEM ===
    'nsp': {
        desktop: 'a:contains("Núcleo de Segurança do Paciente") + ul',
        mobile: '#submenu-nsp-sub'
    },
    'saude-publica': {
        desktop: 'a:contains("Saúde Pública") + ul',
        mobile: '#submenu-saude-publica-sub'
    },
    'legislacoes': {
        desktop: 'a:contains("Legislações de Enfermagem") + ul',
        mobile: '#submenu-legislacoes-enfermagem-sub'
    },
    'literatura': {
        desktop: 'a:contains("Literatura de Enfermagem") + ul',
        mobile: '#submenu-literatura-enfermagem-sub'
    },
    'saude-mental': {
        desktop: 'a:contains("Saúde Mental") + ul',
        mobile: '#submenu-saude-mental-sub' // Precisa criar o ID no HTML se não existir, senão usa a lógica do a:contains
    },
    'urgencia-emergencia': {
        desktop: 'a:contains("Urgência e Emergência") + ul',
        mobile: '#submenu-urgencia-emergencia-sub'
    },
    'bloco-operatorio': {
        desktop: 'a:contains("Enfermagem em Bloco Operatório") + ul',
        mobile: '#submenu-bloco-operatorio-sub'
    },
    'clinica-medica': {
        desktop: 'a:contains("Enfermagem em Clínica Médica") + ul',
        mobile: '#submenu-clinica-medica-sub'
    },
    'enfermagem-trabalho': {
        desktop: 'a:contains("Enfermagem do Trabalho") + ul',
        mobile: '#submenu-enfermagem-do-trabalho-sub'
    },
    'seguranca-trabalho': {
        desktop: 'a:contains("Segurança do Trabalho") + ul',
        mobile: 'a:contains("Segurança do Trabalho") + ul' // Usando text contains para achar
    },

    // === DEMAIS ÁREAS ===
    'sites-emprego': {
        desktop: 'button:contains("Sites de Emprego") + ul',
        mobile: 'button:contains("Sites de Emprego") + ul'
    },
    'biblioteca': {
         desktop: 'button:contains("Biblioteca de enfermagem") + ul',
         mobile: 'button:contains("Biblioteca de Enfermagem") + ul'
    },
    'simulados': {
        desktop: 'button:contains("Simulados") + ul',
        mobile: 'button:contains("Simulados") + ul'
    },
    'fale-conosco': {
         desktop: 'button:contains("Fale Conosco") + ul',
         mobile: '#submenu-fale-conosco'
    }
};

// Se alguns destinos falharem no mobile por falta de ID, podemos usar a mesma lógica do desktop
if(!mapaDestinos[novaPagina.destino]) {
    console.error(`❌ Erro: O destino '${novaPagina.destino}' não é válido. Verifique a lista.`);
    process.exit(1);
}

const seletores = mapaDestinos[novaPagina.destino];

// 6. Template HTML do novo link (Mantendo a formatação compacta em uma linha)
const templateItem = `<li><a href="${novaPagina.url}" class="block px-4 py-2 text-gray-700 hover:bg-gray-100 whitespace-nowrap">${novaPagina.nome}</a></li>\n`;

// 7. Inserção no Desktop
const ulDesktop = $(seletores.desktop).first();
if (ulDesktop.length > 0) {
    ulDesktop.append(templateItem);
    console.log(`✅ Inserido no Desktop em: ${novaPagina.destino}`);
} else {
    console.log(`⚠️ Aviso: Não encontrou o seletor Desktop para: ${novaPagina.destino} - Verifique os seletores.`);
}

// 8. Inserção no Mobile
// Se o seletor mobile for o mesmo do desktop, pegamos o último (que geralmente é o mobile off-canvas)
let ulMobile = $(seletores.mobile);
if(seletores.desktop === seletores.mobile) {
    ulMobile = ulMobile.last();
}

if (ulMobile.length > 0) {
    // Só insere se não for a mesma UL que já pegamos no desktop por engano
    if (ulMobile[0] !== ulDesktop[0]) {
        ulMobile.append(templateItem);
        console.log(`✅ Inserido no Mobile em: ${novaPagina.destino}`);
    } else {
         console.log(`✅ Mobile: (Parece usar a mesma estrutura do desktop)`);
    }
} else {
    console.log(`⚠️ Aviso: Não encontrou o seletor Mobile para: ${novaPagina.destino} - Verifique os seletores.`);
}

// 9. Salva o arquivo modificado
fs.writeFileSync(menuPath, $.html(), 'utf8');

console.log("🎉 Processo concluído! Arquivo menu-global.html atualizado.");