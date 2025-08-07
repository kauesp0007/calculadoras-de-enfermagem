function criarIconesLucide() {
    if (typeof lucide !== 'undefined' && typeof criarIconesLucide === 'function') {
        criarIconesLucide()
    } else {
        console.warn("LUCIDE ICONS: Biblioteca Lucide não carregada. Ícones não serão renderizados.");
    }
}
// Estado global da aplicação
const state = {
    isAuthenticated: false,
    currentUser: null,
    currentSection: 'home',
    currentView: 'editor', // para a seção de currículos
    isSidebarExpanded: true,
    isMobile: window.innerWidth < 768,
    selectedTemplate: null,
    resumeData: {
        personalInfo: {
            fullName: '',
            profession: '',
            email: '',
            phone: '',
            address: ''
        },
        medicalInfo: {
            license: ''
        },
        summary: '',
        experience: [],
        education: [],
        skills: [],
        certifications: [],
        languages: []
    },
    templates: [], // Será carregado dinamicamente
    inspiringMessages: [
        "Transforme sua carreira em enfermagem com um currículo profissional que destaca seu impacto na vida das pessoas",
        "Mostre ao mundo o cuidado excepcional que você oferece - cada paciente é uma vida transformada por suas mãos",
        "Construa o futuro da enfermagem com sua trajetória única de dedicação e competência técnica",
        "Cada procedimento realizado, cada palavra de conforto - destaque a diferença que você faz na saúde",
        "Sua dedicação incansável à enfermagem merece reconhecimento profissional e oportunidades excepcionais",
        "Lidere mudanças positivas na saúde com sua experiência clínica e visão humanizada do cuidar",
        "Conecte sua paixão genuína pela enfermagem com oportunidades que valorizam sua expertise",
        "Seja a enfermeira que você sempre sonhou em ser - inspire outros com sua jornada profissional",
        "Sua experiência em cuidados intensivos é seu maior diferencial no mercado de trabalho",
        "Inspire uma nova geração de profissionais com sua trajetória de excelência na enfermagem",
        "O conhecimento técnico que você possui salva vidas - mostre isso em seu currículo profissional",
        "Cada plantão é uma oportunidade de fazer a diferença - destaque seu comprometimento único",
        "Sua capacidade de trabalhar sob pressão é uma habilidade valiosa que poucos possuem",
        "A empatia que você demonstra diariamente é tão importante quanto sua competência técnica",
        "Transforme desafios em oportunidades - sua resiliência é inspiradora para toda a equipe",
        "O cuidado humanizado que você oferece é o que diferencia a enfermagem de excelência",
        "Sua liderança natural em situações críticas merece destaque em sua trajetória profissional",
        "A educação continuada que você busca demonstra seu compromisso com a excelência no cuidar",
        "Cada família que você acolheu em momentos difíceis lembra do seu profissionalismo",
        "Sua dedicação à segurança do paciente é fundamental para a qualidade assistencial",
        "O trabalho em equipe que você promove fortalece toda a assistência de enfermagem",
        "Sua capacidade de adaptação às novas tecnologias em saúde é um diferencial competitivo",
        "A advocacia pelo paciente que você pratica é essencial para uma assistência ética",
        "Seu olhar clínico apurado pode detectar alterações que salvam vidas diariamente",
        "A gestão de tempo que você domina é crucial em ambientes de alta complexidade",
        "Sua habilidade de comunicação terapêutica traz conforto em momentos de vulnerabilidade",
        "O controle de infecção que você pratica protege pacientes e profissionais",
        "Sua experiência em emergências demonstra preparo para situações de alta pressão",
        "A administração segura de medicamentos que você realiza é fundamental para a recuperação",
        "Seu conhecimento em procedimentos invasivos é valorizado em unidades especializadas",
        "A educação em saúde que você promove empodera pacientes e familiares",
        "Sua participação em protocolos assistenciais melhora a qualidade do cuidado",
        "O suporte emocional que você oferece é terapêutico para pacientes e famílias",
        "Sua experiência em diferentes especialidades amplia suas oportunidades profissionais",
        "A documentação precisa que você mantém é essencial para a continuidade do cuidado",
        "Seu comprometimento com a ética profissional inspira confiança em toda a equipe",
        "A inovação que você traz para a prática assistencial melhora resultados clínicos",
        "Sua capacidade de ensinar estudantes forma a próxima geração de enfermeiros",
        "O cuidado centrado no paciente que você pratica é o padrão ouro da enfermagem",
        "Sua experiência em gestão de leitos otimiza recursos e melhora o fluxo assistencial",
        "A prevenção de quedas que você implementa protege a segurança dos pacientes",
        "Seu conhecimento em farmacologia garante terapias medicamentosas eficazes",
        "A avaliação de risco que você realiza previne complicações e melhora prognósticos",
        "Sua habilidade em procedimentos de emergência pode salvar vidas em momentos críticos",
        "O cuidado paliativo que você oferece traz dignidade e conforto em momentos finais",
        "Sua experiência em reabilitação ajuda pacientes a recuperarem sua independência",
        "A coordenação de cuidados que você promove integra toda a equipe multidisciplinar",
        "Seu conhecimento em tecnologias assistivas melhora a qualidade de vida dos pacientes",
        "A pesquisa em enfermagem que você desenvolve avança a ciência do cuidar",
        "Sua liderança em projetos de melhoria contínua transforma a prática assistencial"
    ],
    currentMessageIndex: 0
};


// Inicialização da aplicação
function initializeApp() {
    console.log('Inicializando aplicação...');
    / Adicione esta função no início do seu app.js
function inicializarGoogleTradutor() {
    // Previne a duplicação do script
    if (document.querySelector('script[src*="translate.google.com"]')) {
        // Se o script já existe, apenas garante que o widget seja renderizado
        if (window.google && window.google.translate) {
            new google.translate.TranslateElement({
                pageLanguage: 'pt',
                includedLanguages: 'pt,en,es',
                layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                autoDisplay: false
            }, 'google_translate_element');
        }
        return;
    }

    // Função de callback que o Google irá chamar
    window.googleTranslateElementInit = function() {
        new google.translate.TranslateElement({
            pageLanguage: 'pt',
            includedLanguages: 'pt,en,es',
            layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false
        }, 'google_translate_element');
    };

    // Carrega a API do Google Tradutor
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    document.body.appendChild(script);
}
    
    // Verificar se há usuário logado no localStorage
    checkAuthStatus();
    
    // Configurar eventos
    setupEventListeners();
    
    // Carregar templates (simulado por enquanto)
    loadTemplates();
    
    // Mostrar seção inicial
    showSection('home');
    
    console.log('Aplicação inicializada com sucesso!');
}

// Verificar status de autenticação
function checkAuthStatus() {
    const userData = localStorage.getItem('userData');
    if (userData) {
        try {
            state.currentUser = JSON.parse(userData);
            state.isAuthenticated = true;
            updateUserInterface();
        } catch (e) {
            console.error('Erro ao carregar dados do usuário:', e);
            localStorage.removeItem('userData');
        }
    }
}

// Atualizar interface do usuário baseado no status de autenticação
function updateUserInterface() {
    const loggedOutArea = document.getElementById('user-area-logged-out');
    const loggedInArea = document.getElementById('user-area-logged-in');
    const userNameSpan = document.getElementById('user-name');
    
    if (state.isAuthenticated && state.currentUser) {
        loggedOutArea.classList.add('hidden');
        loggedInArea.classList.remove('hidden');
        userNameSpan.textContent = state.currentUser.name || 'Usuário';
    } else {
        loggedOutArea.classList.remove('hidden');
        loggedInArea.classList.add('hidden');
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Redimensionamento da janela
    window.addEventListener('resize', () => {
        state.isMobile = window.innerWidth < 768;
        updateSidebarVisibility();
    });
    
    // Navegação por hash
    window.addEventListener('hashchange', handleHashChange);
    
    // Formulários
    setupFormListeners();
}

// Configurar listeners dos formulários
function setupFormListeners() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
}

// Navegação entre seções
function showSection(sectionName) {
    console.log('Mostrando seção:', sectionName);
    
    // Esconder todas as seções
    const sections = document.querySelectorAll('.section-content');
    sections.forEach(section => section.classList.add('hidden'));
    
    // Mostrar seção selecionada
    const targetSection = document.getElementById(`section-${sectionName}`);
    if (targetSection) {
        targetSection.classList.remove('hidden');
        targetSection.classList.add('fade-in');
    }
    
    // Atualizar estado
    state.currentSection = sectionName;
    
    // Atualizar navegação ativa
    updateActiveNavigation(sectionName);
    
    // Configurar sidebar baseado na seção
    updateSidebarVisibility();
    
    // Carregar conteúdo específico da seção
    loadSectionContent(sectionName);
    
    // Atualizar URL
    window.location.hash = sectionName;
}

// Atualizar navegação ativa
function updateActiveNavigation(sectionName) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('onclick')?.includes(sectionName)) {
            item.classList.add('active');
        }
    });
}

// Atualizar visibilidade da sidebar
function updateSidebarVisibility() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    
    if (state.currentSection === 'curriculos' && state.isAuthenticated) {
        sidebar.classList.remove('hidden');
        if (!state.isMobile) {
            mainContent.classList.add('main-content');
            if (!state.isSidebarExpanded) {
                mainContent.classList.add('sidebar-collapsed');
            }
        }
    } else {
        sidebar.classList.add('hidden');
        mainContent.classList.remove('main-content', 'sidebar-collapsed');
    }
}

// Carregar conteúdo específico da seção
function loadSectionContent(sectionName) {
    switch (sectionName) {
        case 'curriculos':
            loadCurriculosContent();
            break;
        case 'carreiras':
            loadCarreirasContent();
            break;
        case 'vagas':
            loadVagasContent();
            break;
        case 'concursos':
            loadConcursosContent();
            break;
    }
}

// Carregar conteúdo da seção currículos
function loadCurriculosContent() {
    const authRequired = document.getElementById('curriculos-auth-required');
    const content = document.getElementById('curriculos-content');
    
    if (state.isAuthenticated) {
        authRequired.classList.add('hidden');
        content.classList.remove('hidden');
        // Carregar editor de currículos
        loadResumeEditor();
    } else {
        authRequired.classList.remove('hidden');
        content.classList.add('hidden');
    }
}

// Carregar conteúdo da seção carreiras
function loadCarreirasContent() {
    const container = document.getElementById('career-articles-container');
    
    // Simular carregamento de artigos
    setTimeout(() => {
        container.innerHTML = generateCareerArticles();
    }, 1000);
}

// Carregar conteúdo da seção vagas
function loadVagasContent() {
    const container = document.getElementById('jobs-container');
    
    // Simular carregamento de vagas
    setTimeout(() => {
        container.innerHTML = generateJobListings();
    }, 1000);
}

// Carregar conteúdo da seção concursos
function loadConcursosContent() {
    const container = document.getElementById('concursos-container');
    
    // Simular carregamento de concursos
    setTimeout(() => {
        container.innerHTML = generateConcursoListings();
    }, 1000);
}

// Gerar artigos de carreira (simulado)
function generateCareerArticles() {
    const articles = [
        {
            title: "Como se preparar para entrevistas de enfermagem",
            description: "Dicas essenciais para se destacar em entrevistas e conseguir a vaga dos seus sonhos.",
            category: "Entrevistas",
            readTime: "5 min"
        },
        {
            title: "Erros comuns em currículos de enfermagem",
            description: "Evite os principais erros que podem prejudicar suas chances de conseguir uma vaga.",
            category: "Currículo",
            readTime: "7 min"
        },
        {
            title: "Dinâmicas de grupo: como se destacar",
            description: "Estratégias para brilhar em dinâmicas de grupo e processos seletivos.",
            category: "Seleção",
            readTime: "6 min"
        },
        {
            title: "Especialização em enfermagem: qual escolher?",
            description: "Guia completo sobre as principais especializações e suas oportunidades.",
            category: "Carreira",
            readTime: "10 min"
        },
        {
            title: "Networking para enfermeiros: construindo conexões",
            description: "Como construir uma rede de contatos sólida na área da saúde.",
            category: "Networking",
            readTime: "8 min"
        },
        {
            title: "Transição de carreira: da assistência à gestão",
            description: "Passos para migrar da assistência direta para cargos de gestão em saúde.",
            category: "Carreira",
            readTime: "12 min"
        }
    ];
    
    return articles.map(article => `
        <div class="article-card cursor-pointer" onclick="openArticle('${article.title}')">
            <div class="h-48 bg-gradient-to-br from-primary-blue to-nursing-teal"></div>
            <div class="p-6">
                <div class="flex items-center justify-between mb-3">
                    <span class="px-3 py-1 bg-primary-blue text-white text-sm rounded-full">${article.category}</span>
                    <span class="text-gray-500 text-sm">${article.readTime}</span>
                </div>
                <h3 class="text-xl font-heading font-bold text-gray-900 mb-3">${article.title}</h3>
                <p class="text-gray-600 mb-4">${article.description}</p>
                <button class="btn btn-outline">
                    <i data-lucide="arrow-right" class="mr-2 h-4 w-4"></i>
                    Ler artigo
                </button>
            </div>
        </div>
    `).join('');
}

// Gerar listagem de vagas (simulado)
function generateJobListings() {
    const jobs = [
        {
            title: "Enfermeiro(a) UTI",
            company: "Hospital São Lucas",
            location: "São Paulo, SP",
            salary: "R$ 4.500 - R$ 6.000",
            type: "CLT",
            source: "LinkedIn"
        },
        {
            title: "Enfermeiro(a) Emergência",
            company: "Hospital Albert Einstein",
            location: "São Paulo, SP",
            salary: "R$ 5.000 - R$ 7.500",
            type: "CLT",
            source: "Catho"
        },
        {
            title: "Enfermeiro(a) Pediatria",
            company: "Hospital Infantil Sabará",
            location: "São Paulo, SP",
            salary: "R$ 4.000 - R$ 5.500",
            type: "CLT",
            source: "Gupy"
        },
        {
            title: "Enfermeiro(a) Home Care",
            company: "Grupo Mais Cuidar",
            location: "Rio de Janeiro, RJ",
            salary: "R$ 3.800 - R$ 5.200",
            type: "CLT",
            source: "LinkedIn"
        },
        {
            title: "Enfermeiro(a) Coordenador",
            company: "Rede D'Or",
            location: "Belo Horizonte, MG",
            salary: "R$ 6.000 - R$ 8.500",
            type: "CLT",
            source: "Catho"
        }
    ];
    
    return jobs.map(job => `
        <div class="job-card">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-xl font-heading font-bold text-gray-900 mb-2">${job.title}</h3>
                    <p class="text-lg text-gray-700 mb-1">${job.company}</p>
                    <p class="text-gray-600 flex items-center">
                        <i data-lucide="map-pin" class="h-4 w-4 mr-1"></i>
                        ${job.location}
                    </p>
                </div>
                <span class="px-3 py-1 bg-primary-blue text-white text-sm rounded-full">${job.source}</span>
            </div>
            
            <div class="flex flex-wrap gap-4 mb-4">
                <span class="flex items-center text-gray-600">
                    <i data-lucide="dollar-sign" class="h-4 w-4 mr-1"></i>
                    ${job.salary}
                </span>
                <span class="flex items-center text-gray-600">
                    <i data-lucide="briefcase" class="h-4 w-4 mr-1"></i>
                    ${job.type}
                </span>
            </div>
            
            <div class="flex space-x-3">
                <button class="btn btn-primary flex-1">
                    <i data-lucide="external-link" class="mr-2 h-4 w-4"></i>
                    Ver vaga
                </button>
                <button class="btn btn-outline">
                    <i data-lucide="heart" class="h-4 w-4"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Gerar listagem de concursos (simulado)
function generateConcursoListings() {
    const concursos = [
        {
            title: "Concurso Público - Enfermeiro",
            organization: "Prefeitura de São Paulo",
            vacancies: "50 vagas",
            salary: "R$ 5.847,00",
            deadline: "15/09/2024",
            status: "Inscrições abertas"
        },
        {
            title: "Processo Seletivo - Enfermeiro UTI",
            organization: "Hospital das Clínicas - FMUSP",
            vacancies: "20 vagas",
            salary: "R$ 6.200,00",
            deadline: "22/09/2024",
            status: "Inscrições abertas"
        },
        {
            title: "Concurso Público - Enfermeiro Especialista",
            organization: "Governo do Estado do RJ",
            vacancies: "100 vagas",
            salary: "R$ 4.500,00",
            deadline: "30/08/2024",
            status: "Últimos dias"
        }
    ];
    
    return concursos.map(concurso => `
        <div class="job-card">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-xl font-heading font-bold text-gray-900 mb-2">${concurso.title}</h3>
                    <p class="text-lg text-gray-700 mb-1">${concurso.organization}</p>
                </div>
                <span class="px-3 py-1 ${concurso.status === 'Últimos dias' ? 'bg-error-red' : 'bg-success-green'} text-white text-sm rounded-full">
                    ${concurso.status}
                </span>
            </div>
            
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="flex items-center text-gray-600">
                    <i data-lucide="users" class="h-4 w-4 mr-2"></i>
                    ${concurso.vacancies}
                </div>
                <div class="flex items-center text-gray-600">
                    <i data-lucide="dollar-sign" class="h-4 w-4 mr-2"></i>
                    ${concurso.salary}
                </div>
                <div class="flex items-center text-gray-600">
                    <i data-lucide="calendar" class="h-4 w-4 mr-2"></i>
                    Até ${concurso.deadline}
                </div>
            </div>
            
            <div class="flex space-x-3">
                <button class="btn btn-primary flex-1">
                    <i data-lucide="external-link" class="mr-2 h-4 w-4"></i>
                    Ver edital
                </button>
                <button class="btn btn-outline">
                    <i data-lucide="bookmark" class="h-4 w-4"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Carregar templates (simulado por enquanto)
function loadTemplates() {
    // Por enquanto, vamos simular alguns templates
    state.templates = [
        { id: 'classico_1', name: 'Clássico Profissional', category: 'Tradicional' },
        { id: 'moderno_1', name: 'Moderno Criativo', category: 'Moderno' },
        { id: 'minimalista_1', name: 'Minimalista Clean', category: 'Minimalista' }
    ];
}

// Manipular mudanças de hash na URL
function handleHashChange() {
    const hash = window.location.hash.substring(1);
    if (hash && hash !== state.currentSection) {
        showSection(hash);
    }
}

// Configurar eventos mobile
function setupMobileEvents() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileOverlay = document.getElementById('mobile-overlay');
    const sidebar = document.getElementById('sidebar');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMobileSidebar);
    }
    
    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', closeMobileSidebar);
    }
}

// Toggle sidebar mobile
function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobile-overlay');
    
    if (state.isMobile) {
        sidebar.classList.toggle('mobile-open');
        overlay.classList.toggle('hidden');
    }
}

// Fechar sidebar mobile
function closeMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobile-overlay');
    
    sidebar.classList.remove('mobile-open');
    overlay.classList.add('hidden');
}

// Iniciar mensagens inspiradoras com animação aprimorada
function startInspiringMessages() {
    const messageElement = document.getElementById('message-text');
    
    function updateMessage() {
        if (messageElement) {
            // Animação de fade out mais suave
            messageElement.style.transition = 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out';
            messageElement.style.opacity = '0';
            messageElement.style.transform = 'translateY(-10px)';
            
            setTimeout(() => {
                // Atualizar texto
                messageElement.textContent = state.inspiringMessages[state.currentMessageIndex];
                
                // Animação de fade in
                messageElement.style.opacity = '1';
                messageElement.style.transform = 'translateY(0)';
                
                // Próxima mensagem
                state.currentMessageIndex = (state.currentMessageIndex + 1) % state.inspiringMessages.length;
            }, 500);
        }
    }
    
    // Primeira mensagem com animação inicial
    if (messageElement) {
        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            messageElement.textContent = state.inspiringMessages[0];
            messageElement.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
            messageElement.style.opacity = '1';
            messageElement.style.transform = 'translateY(0)';
            state.currentMessageIndex = 1;
        }, 300);
    }
    
    // Atualizar a cada 6 segundos (aumentado para dar tempo de ler)
    setInterval(updateMessage, 6000);
}

// Abrir artigo (placeholder)
function openArticle(title) {
    alert(`Abrindo artigo: ${title}\n\nEsta funcionalidade será implementada em breve!`);
}

// Funções de modal
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
}

function showLogin() {
    closeModal('register-modal');
    showModal('login-modal');
}

function showRegister() {
    closeModal('login-modal');
    showModal('register-modal');
}

function showForgotPassword() {
    alert('Funcionalidade de recuperação de senha será implementada em breve!');
}

// Exportar funções globais necessárias
window.showSection = showSection;
window.showLogin = showLogin;
window.showRegister = showRegister;
window.showForgotPassword = showForgotPassword;
window.closeModal = closeModal;
window.openArticle = openArticle;

