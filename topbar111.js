// topbar111.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('topbar111.js: DOMContentLoaded disparado.');

    const topbarHtmlContent = `
        <header class="fixed top-0 left-0 w-full bg-blue-50 shadow z-50">
            <div class="max-w-7xl mx-auto px-4 py-0 flex items-center justify-between h-16">
                <img src="icontopbar.png" alt="Logo Calculadoras de Enfermagem" class="h-16 w-auto object-contain">

                <button id="menuToggle" class="md:hidden p-2 text-gray-800 focus:outline-none rounded-md hover:bg-gray-100 transition-colors" aria-label="Abrir menu principal">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                    </svg>
                </button>

                <nav id="mainNav" class="hidden md:flex flex-col md:flex-row md:space-x-6 absolute md:static top-full left-0 w-full md:w-auto bg-blue-50 md:bg-transparent shadow-lg md:shadow-none p-4 md:p-0">
                    <div class="relative mb-2 md:mb-0">
                        <a href="index.html" class="font-semibold text-gray-800 hover:text-blue-500 block py-2 md:py-0 rounded-md hover:bg-blue-100 md:hover:bg-transparent px-3 md:px-0">Início</a>
                    </div>

                    <div class="relative mb-2 md:mb-0">
                        <button type="button" data-menu-target="menu1" class="font-semibold text-gray-800 hover:text-blue-500 block py-2 md:py-0 rounded-md hover:bg-blue-100 md:hover:bg-transparent px-3 md:px-0 w-full text-left" aria-expanded="false" aria-controls="menu1">Sobre Nós</button>
                        <div id="menu1" class="dropdown-menu bg-white border border-gray-200 rounded shadow-lg p-2 text-gray-700 text-sm">
                            <a href="objetivo.html" class="block px-3 py-2 rounded hover:bg-blue-100">Objetivo do site</a>
                            <a href="missao.html" class="block px-3 py-2 rounded hover:bg-blue-100">Missão, visão e valores</a>
                        </div>
                    </div>

                    <div class="relative mb-2 md:mb-0">
                        <button type="button" data-menu-target="menu2" class="font-semibold text-gray-800 hover:text-blue-500 block py-2 md:py-0 rounded-md hover:bg-blue-100 md:hover:bg-transparent px-3 md:px-0 w-full text-left" aria-expanded="false" aria-controls="menu2">Calculadoras & Escalas</button>
                        <div id="menu2" class="dropdown-menu max-h-96 overflow-y-auto bg-white border border-gray-200 rounded shadow-lg p-2 text-gray-700 text-sm">
                            <span class="block px-3 py-2 font-bold text-gray-900">Calculadoras</span>
                            <a href="balancohidrico.html" class="block px-3 py-2 rounded hover:bg-blue-100">Balanço Hídrico</a>
                            <a href="dimensionamento.html" class="block px-3 py-2 rounded hover:bg-blue-100">Cálculo de Dimensionamento da Equipe de Enfermagem</a>
                            <a href="gotejamento.html" class="block px-3 py-2 rounded hover:bg-blue-100">Cálculo de Gotejamento</a>
                            <a href="gestacional.html" class="block px-3 py-2 rounded hover:bg-blue-100">Cálculo de Idade Gestacional e DPP</a>
                            <a href="imc.html" class="block px-3 py-2 rounded hover:bg-blue-100">Cálculo de IMC</a>
                            <a href="insulina.html" class="block px-3 py-2 rounded hover:bg-blue-100">Cálculo de Aspiração de Insulina</a>
                            <a href="medicamentos.html" class="block px-3 py-2 rounded hover:bg-blue-100">Cálculo de Medicamentos</a>

                            <div class="border-t border-gray-200 my-2"></div>

                            <span class="block px-3 py-2 font-bold text-gray-900">Escalas de Enfermagem</span>
                            <a href="aldrete.html" class="block px-3 py-2 rounded hover:bg-blue-100">Escala de Aldrete e Kroulik</a>
                            <a href="apgar.html" class="block px-3 py-2 rounded hover:bg-blue-100">Escala de Apgar</a>
                            <a href="asa.html" class="block px-3 py-2 rounded hover:bg-blue-100">Classificação ASA (American Society of Anesthesiologists)</a>
                            <a href="braden.html" class="block px-3 py-2 rounded hover:bg-blue-100">Escala de Braden</a>
                            <a href="cincinnati.html" class="block px-3 py-2 rounded hover:bg-blue-100">Escala de Cincinnati</a>
                            <a href="elpo.html" class="block px-3 py-2 rounded hover:bg-blue-100">Escala de ELPO</a>
                            <a href="fugulin.html" class="block px-3 py-2 rounded hover:bg-blue-100">Escala de Fugulin</a>
                            <a href="glasgow.html" class="block px-3 py-2 rounded hover:bg-blue-100">Escala de Coma de Glasgow</a>
                            <a href="gosnell.html" class="block px-3 py-2 rounded hover:bg-blue-100">Escala de Gosnell</a>
                            <a href="johns.html" class="block px-3 py-2 rounded hover:bg-blue-100">Escala Johns - Hopkins</a>
                            <a href="manchester.html" class="block px-3 py-2 rounded hover:bg-blue-100">Protocolo de Manchester</a>
                            <a href="meows.html" class="block px-3 py-2 rounded hover:bg-blue-100">Escala de MEOWS (Modified Early Obstetric Warning Score)</a>
                            <a href="morse.html" class="block px-3 py-2 rounded hover:bg-blue-100">Escala de Morse</a>
                            <a href="news.html" class="block px-3 py-2 rounded hover:bg-blue-100">Escala de NEWS (National Early Warning Score)</a>
                            <a href="nihss.html" class="block px-3 py-2 rounded hover:bg-blue-100">Escala de NIHSS (National Institutes of Health Stroke Scale)</a>
                            <a href="norton.html" class="block px-3 py-2 rounded hover:bg-blue-100">Escala de Norton</a>
                            <a href="richmond.html" class="block px-3 py-2 rounded hover:bg-blue-100">Escala de Richmond (Richmond Agitation Sedation Scale)</a>
                            <a href="waterlow.html" class="block px-3 py-2 rounded hover:bg-blue-100">Escala de Waterlow</a>
                            <a href="four_score.html" class="block px-3 py-2 rounded hover:bg-blue-100">Escala FOUR Score</a>
                        </div>
                    </div>

                    <div class="relative mb-2 md:mb-0">
                        <button type="button" data-menu-target="menu3" class="font-semibold text-gray-800 hover:text-blue-500 block py-2 md:py-0 rounded-md hover:bg-blue-100 md:hover:bg-transparent px-3 md:px-0 w-full text-left" aria-expanded="false" aria-controls="menu3">Conteúdo</button>
                        <div id="menu3" class="dropdown-menu bg-white border border-gray-200 rounded shadow-lg p-2 text-gray-700 text-sm">
                            <a href="regrasmedicacoes.html" class="block px-3 py-2 rounded hover:bg-blue-100">Manual de Uso seguro de medicamentos</a>
                            <a href="vigilancia.html" class="block px-3 py-2 rounded hover:bg-blue-100">Medicação de Alta Vigilância (MAV)</a>
                            <a href="checagem.html" class="block px-3 py-2 rounded hover:bg-blue-100">Dupla e Tripla Checagem</a>
                            <span class="block px-3 py-2 opacity-60">Links Úteis (em construção)</span>
                            <a href="legislacoes.html" class="block px-3 py-2 rounded hover:bg-blue-100">Legislações e Pareceres</a>
                        </div>
                    </div>

                    <div class="relative mb-2 md:mb-0">
                        <button type="button" data-menu-target="menu4" class="font-semibold text-gray-800 hover:text-blue-500 block py-2 md:py-0 rounded-md hover:bg-blue-100 md:hover:bg-transparent px-3 md:px-0 w-full text-left" aria-expanded="false" aria-controls="menu4">Carreira</button>
                        <div id="menu4" class="dropdown-menu bg-white border border-gray-200 rounded shadow-lg p-2 text-gray-700 text-sm">
                            <span class="block px-3 py-2 opacity-60">Gere seu Currículo (em construção)</span>
                            <span class="block px-3 py-2 opacity-60">Testes Psicológicos (em construção)</span>
                            <span class="block px-3 py-2 opacity-60">Trilha de Conhecimento (em construção)</span>
                            <a href="concurso.html" class="block px-3 py-2 rounded hover:bg-blue-100">Concursos Públicos em aberto</a>
                            <span class="block px-3 py-2 opacity-60">Mentoria com IA (em construção)</span>
                        </div>
                    </div>

                    <div class="relative mb-2 md:mb-0">
                        <button type="button" data-menu-target="menu5" class="font-semibold text-gray-800 hover:text-blue-500 block py-2 md:py-0 rounded-md hover:bg-blue-100 md:hover:bg-transparent px-3 md:px-0 w-full text-left" aria-expanded="false" aria-controls="menu5">Loja Virtual</button>
                        <div id="menu5" class="dropdown-menu bg-white border border-gray-200 rounded shadow-lg p-2 text-gray-700 text-sm">
                            <span class="block px-3 py-2 opacity-60">Em construção</span>
                        </div>
                    </div>

                    <div class="relative mb-2 md:mb-0">
                        <button type="button" data-menu-target="menu6" class="font-semibold text-gray-800 hover:text-blue-500 block py-2 md:py-0 rounded-md hover:bg-blue-100 md:hover:bg-transparent px-3 md:px-0 w-full text-left" aria-expanded="false" aria-controls="menu6">Fale Conosco</button>
                        <div id="menu6" class="dropdown-menu bg-white border border-gray-200 rounded shadow-lg p-2 text-gray-700 text-sm">
                            <a href="fale.html" class="block px-3 py-2 rounded hover:bg-blue-100">Fale Conosco</a>
                            <a href="forum.html" class="block px-3 py-2 rounded hover:bg-blue-100">Fórum de perguntas e respostas</a>
                            <a href="doacoes.html" class="block px-3 py-2 rounded hover:bg-blue-100">Contribua</a>
                        </div>
                    </div>
                </nav>
            </div>
        </header>
    `;

    const topbarContainer = document.getElementById('topbar-container');

    if (topbarContainer) {
        topbarContainer.innerHTML = topbarHtmlContent;
        console.log('topbar111.js: HTML da Topbar inserido com sucesso.');

        // Agora que o HTML está no DOM, obtenha as referências e anexe os eventos
        const menuToggle = document.getElementById('menuToggle');
        const mainNav = document.getElementById('mainNav');
        const dropdownButtons = document.querySelectorAll('[data-menu-target]');

        // Lógica para o menu hambúrguer (mobile)
        if (menuToggle) {
            menuToggle.addEventListener('click', function() {
                console.log('topbar111.js: Clique no menuToggle.');
                const isHidden = mainNav.classList.contains('hidden');
                if (isHidden) {
                    mainNav.classList.remove('hidden');
                    mainNav.classList.add('flex');
                    mainNav.classList.add('flex-col');
                    menuToggle.setAttribute('aria-expanded', 'true');
                    console.log('topbar111.js: Menu mobile ABERTO.');
                } else {
                    mainNav.classList.add('hidden');
                    mainNav.classList.remove('flex');
                    mainNav.classList.remove('flex-col');
                    menuToggle.setAttribute('aria-expanded', 'false');
                    console.log('topbar111.js: Menu mobile FECHADO.');
                }

                // Fecha todos os dropdowns quando o menu principal é aberto/fechado
                document.querySelectorAll('.dropdown-menu').forEach(menu => {
                    menu.classList.remove('show');
                    const btn = document.querySelector(`[data-menu-target="${menu.id}"]`);
                    if (btn) btn.setAttribute('aria-expanded', 'false');
                });
            });
        } else {
            console.warn('topbar111.js: Elemento menuToggle não encontrado após a inserção.');
        }

        // Fecha o menu hambúrguer quando um link é clicado (útil para navegação)
        if (mainNav) {
            mainNav.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', function() {
                    if (window.innerWidth < 768) {
                        mainNav.classList.add('hidden');
                        mainNav.classList.remove('flex');
                        mainNav.classList.remove('flex-col');
                        if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
                        console.log('topbar111.js: Link do menu clicado. Fechando menu mobile.');
                    }
                });
            });
        }

        // Garante que o menu esteja no estado correto ao redimensionar a janela
        window.addEventListener('resize', function() {
            if (window.innerWidth >= 768) { // Se for desktop (md breakpoint ou maior)
                if (mainNav) {
                    mainNav.classList.remove('hidden');
                    mainNav.classList.add('flex');
                    mainNav.classList.add('flex-row');
                    mainNav.classList.remove('flex-col');
                }
                // Fecha quaisquer dropdowns abertos ao transicionar para desktop
                document.querySelectorAll('.dropdown-menu').forEach(menu => {
                    menu.classList.remove('show');
                    const btn = document.querySelector(`[data-menu-target="${menu.id}"]`);
                    if (btn) btn.setAttribute('aria-expanded', 'false');
                });
                console.log('topbar111.js: Redimensionado para desktop. Menu ajustado.');
            } else { // Se for mobile
                // No mobile, o menu deve ser escondido por padrão se não estiver aberto
                if (mainNav && mainNav.classList.contains('flex') && menuToggle && menuToggle.getAttribute('aria-expanded') === 'false') {
                    mainNav.classList.add('hidden');
                    mainNav.classList.remove('flex');
                    mainNav.classList.remove('flex-row');
                    mainNav.classList.add('flex-col');
                }
                console.log('topbar111.js: Redimensionado para mobile. Menu ajustado.');
            }
        });


        // Lógica para os dropdowns dos submenus
        dropdownButtons.forEach(button => {
            button.addEventListener('click', function(event) {
                event.stopPropagation(); // Impede que o clique se propague e feche o menu imediatamente
                const menuId = this.dataset.menuTarget;
                const dropdownMenu = document.getElementById(menuId);
                console.log('topbar111.js: Botão de dropdown clicado:', this.textContent, 'Menu alvo:', menuId);

                // Fecha todos os outros dropdowns
                document.querySelectorAll('.dropdown-menu').forEach(menu => {
                    if (menu.id !== menuId) {
                        menu.classList.remove('show');
                        const btn = document.querySelector(`[data-menu-target="${menu.id}"]`);
                        if (btn) btn.setAttribute('aria-expanded', 'false');
                    }
                });

                // Alterna o dropdown clicado
                if (dropdownMenu) {
                    const isShowing = dropdownMenu.classList.toggle('show');
                    this.setAttribute('aria-expanded', isShowing);
                    console.log('topbar111.js: Dropdown alternado:', menuId, 'Estado:', isShowing);
                } else {
                    console.warn('topbar111.js: Dropdown menu não encontrado para o ID:', menuId);
                }
            });
        });

        // Fecha os dropdowns e o menu mobile quando clica fora deles
        document.addEventListener('click', function(event) {
            const isClickInsideNav = event.target.closest('#mainNav');
            const isClickOnMenuToggle = event.target.closest('#menuToggle');
            const isClickOnDropdownButton = event.target.matches('[data-menu-target]');

            if (!isClickInsideNav && !isClickOnMenuToggle && !isClickOnDropdownButton) {
                document.querySelectorAll('.dropdown-menu').forEach(menu => {
                    menu.classList.remove('show');
                    const btn = document.querySelector(`[data-menu-target="${menu.id}"]`);
                    if (btn) btn.setAttribute('aria-expanded', 'false');
                });

                // Se estiver em mobile e o menu principal não for o alvo do clique, feche-o
                if (window.innerWidth < 768 && mainNav && !mainNav.classList.contains('hidden')) {
                    mainNav.classList.add('hidden');
                    mainNav.classList.remove('flex');
                    mainNav.classList.remove('flex-col');
                    if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
                }
                console.log('topbar111.js: Clicou fora. Menus fechados.');
            }
        });

    } else {
        console.error('topbar111.js: Elemento #topbar-container não encontrado no DOM. A Topbar não será carregada.');
    }
});
