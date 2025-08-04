/**
 * =================================================================================
 * ARQUIVO DE SCRIPTS GLOBAIS - VERSÃO CORRIGIDA E UNIFICADA
 * Este ficheiro contém toda a lógica JavaScript partilhada pelo site.
 * A inicialização das funções é feita DEPOIS do carregamento dinâmico do HTML
 * para garantir que todos os elementos existam.
 * =================================================================================
 */

/**
 * GERA UM PDF A PARTIR DE UM SELETOR DE CONTEÚDO.
 * Esta função é genérica e fica no escopo global para ser chamada por qualquer página.
 * @param {object} options - Opções para o PDF (titulo, subtitulo, nomeArquivo, seletorConteudo).
 */
function gerarPDFGlobal(options) {
    const {
        titulo = 'Relatório da Calculadora',
        subtitulo = 'Relatório de Cálculo Assistencial',
        nomeArquivo = 'relatorio.pdf',
        seletorConteudo = '.main-content-wrapper'
    } = options;

    console.log(`Iniciando geração de PDF para: ${titulo}`);
    const elementoParaImprimir = document.querySelector(seletorConteudo);

    if (!elementoParaImprimir) {
        alert('Erro: Não foi possível encontrar o conteúdo principal para gerar o PDF.');
        console.error(`Elemento com seletor "${seletorConteudo}" não encontrado.`);
        return;
    }
    
    const contentToPrint = document.createElement('div');
    contentToPrint.style.padding = '20px';
    contentToPrint.style.fontFamily = 'Inter, sans-serif';

    const pdfHeader = document.createElement('div');
    pdfHeader.style.textAlign = 'center';
    pdfHeader.style.marginBottom = '25px';
    pdfHeader.innerHTML = `
        <h1 style="font-family: 'Nunito Sans', sans-serif; font-size: 22px; font-weight: bold; color: #1A3E74; margin: 0;">${titulo}</h1>
        <h2 style="font-size: 14px; color: #666; margin-top: 5px;">${subtitulo}</h2>
        <p style="font-size: 10px; color: #999; margin-top: 10px;">Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
    `;
    contentToPrint.appendChild(pdfHeader);

    const conteudoCalculadora = elementoParaImprimir.querySelector('#conteudo');
    if (conteudoCalculadora) {
        const cloneConteudo = conteudoCalculadora.cloneNode(true);
        
        cloneConteudo.querySelectorAll('input[type="radio"]:not(:checked)').forEach(radio => {
            radio.closest('.option-row, .option-label')?.remove();
        });

        cloneConteudo.querySelectorAll('tbody, .options-group').forEach(container => {
            if (container.children.length === 0) {
                container.closest('.criterion-section, .criterion-table')?.remove();
            }
        });
        
        contentToPrint.appendChild(cloneConteudo);
    }

    const resultadoDiv = elementoParaImprimir.querySelector('#resultado');
    if (resultadoDiv && !resultadoDiv.classList.contains('hidden')) {
        const cloneResultado = resultadoDiv.cloneNode(true);
        cloneResultado.style.marginTop = '20px';
        contentToPrint.appendChild(cloneResultado);
    }

    contentToPrint.style.lineHeight = '1cm';
    contentToPrint.style.fontSize = '12px';
    contentToPrint.style.margin = '0';

    const pdfOptions = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: nomeArquivo,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            scrollY: 0,
            useCORS: true
        },
        jsPDF: {
            unit: 'cm',
            format: [21.0, 29.7],
            orientation: 'portrait',
            putOnlyUsedFonts: true
        },
        pagebreak: { avoid: ['p', 'h1', 'h2', 'h3', 'div', 'section'] }
    };

    html2pdf().set(pdfOptions).from(contentToPrint).save().catch(err => {
        console.error("Erro ao gerar PDF: ", err);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    fetch('menu-global.html')
        .then(response => response.ok ? response.text() : Promise.reject('Ficheiro menu-global.html não encontrado'))
        .then(html => {
            const headerContainer = document.getElementById('global-header-container');
            if (headerContainer) {
                headerContainer.innerHTML = html;
                initializeNavigationMenu();
            }
        })
        .catch(error => console.warn('Não foi possível carregar o menu global:', error));

    fetch('global-body-elements.html')
        .then(response => response.ok ? response.text() : Promise.reject('Ficheiro global-body-elements.html não encontrado'))
        .then(html => {
            document.body.insertAdjacentHTML('beforeend', html);
            initializeGlobalFunctions();
        })
        .catch(error => console.warn('Não foi possível carregar os elementos globais do corpo:', error));
});

function initializeNavigationMenu() {
    const hamburgerButton = document.getElementById('hamburgerButton');
    const offCanvasMenu = document.getElementById('offCanvasMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    const accessibilityPanel = document.getElementById('pwaAcessibilidadeBar');

    hamburgerButton?.addEventListener('click', () => {
        if (accessibilityPanel?.classList.contains('is-open')) {
            accessibilityPanel.classList.remove('is-open');
        }
        offCanvasMenu?.classList.toggle('is-open');
        menuOverlay?.classList.toggle('is-open');
    });

    menuOverlay?.addEventListener('click', () => {
        offCanvasMenu?.classList.remove('is-open');
        accessibilityPanel?.classList.remove('is-open');
        menuOverlay?.classList.remove('is-open');
    });

    // *** CORREÇÃO APLICADA AQUI ***
    const submenuToggles = offCanvasMenu?.querySelectorAll('button[data-submenu-toggle]');
    submenuToggles?.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            const submenuId = toggle.getAttribute('data-submenu-toggle');
            const submenu = document.getElementById(`submenu-${submenuId}`);
            const icon = toggle.querySelector('i');

            if (submenu) {
                submenu.classList.toggle('open');
                icon?.classList.toggle('fa-chevron-down');
                icon?.classList.toggle('fa-chevron-up');
            }
        });
    });
}

function inicializarTooltips() {
    const elementosComTooltip = document.querySelectorAll('[data-tooltip]');
    
    elementosComTooltip.forEach(el => {
        const texto = el.getAttribute('data-tooltip');
        
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip-dinamico';
        tooltip.innerText = texto;
        el.appendChild(tooltip);

        el.addEventListener('mouseenter', () => tooltip.style.opacity = '1');
        el.addEventListener('mouseleave', () => tooltip.style.opacity = '0');
        el.addEventListener('touchstart', () => tooltip.style.opacity = '1');
        el.addEventListener('touchend', () => setTimeout(() => tooltip.style.opacity = '0', 2000));
    });
}

function initializeGlobalFunctions() {
    // O restante das suas funções globais (acessibilidade, cookies, etc.) permanece aqui...
    // ... (código omitido para brevidade, pois não foi alterado)
}
