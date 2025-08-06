// Sistema de Integração de Vagas e Concursos para Enfermagem
class JobsIntegration {
    constructor() {
        this.jobs = [];
        this.contests = [];
        this.filters = {
            location: '',
            salary: '',
            type: 'all', // 'jobs', 'contests', 'all'
            specialty: '',
            level: '' // 'junior', 'pleno', 'senior'
        };
        this.init();
    }

    init() {
        this.loadMockData();
        this.setupEventListeners();
        this.renderJobsAndContests();
    }

    // Dados simulados baseados na pesquisa realizada
    loadMockData() {
        // Vagas de emprego simuladas
        this.jobs = [
            {
                id: 1,
                title: "Enfermeiro(a) - UTI Adulto",
                company: "Hospital Albert Einstein",
                location: "São Paulo, SP",
                salary: "R$ 8.500 - R$ 12.000",
                type: "CLT",
                level: "pleno",
                specialty: "terapia-intensiva",
                description: "Vaga para enfermeiro(a) com experiência em UTI adulto. Conhecimento em ventilação mecânica e monitorização hemodinâmica.",
                requirements: ["Graduação em Enfermagem", "COREN ativo", "Experiência mínima de 2 anos em UTI", "Conhecimento em protocolos de segurança"],
                benefits: ["Plano de saúde", "Vale refeição", "Educação continuada", "Plano de carreira"],
                posted: "2025-01-06",
                source: "linkedin",
                url: "https://linkedin.com/jobs/enfermeiro-uti-einstein"
            },
            {
                id: 2,
                title: "Enfermeiro(a) Obstétrico(a)",
                company: "Hospital Sírio-Libanês",
                location: "São Paulo, SP",
                salary: "R$ 7.800 - R$ 11.500",
                type: "CLT",
                level: "pleno",
                specialty: "obstetricia",
                description: "Oportunidade para enfermeiro(a) obstétrico(a) em maternidade de referência. Atuação em centro obstétrico e alojamento conjunto.",
                requirements: ["Graduação em Enfermagem", "Especialização em Obstetrícia", "COREN ativo", "Experiência em centro obstétrico"],
                benefits: ["Plano de saúde premium", "Vale alimentação", "Auxílio creche", "Programa de especialização"],
                posted: "2025-01-05",
                source: "catho",
                url: "https://catho.com.br/vagas/enfermeiro-obstetrico-sirio"
            },
            {
                id: 3,
                title: "Enfermeiro(a) - Atenção Básica",
                company: "Prefeitura de São Paulo",
                location: "São Paulo, SP",
                salary: "R$ 4.500 - R$ 6.200",
                type: "Concurso",
                level: "junior",
                specialty: "atencao-basica",
                description: "Vaga para enfermeiro(a) na atenção básica. Atuação em UBS com foco em saúde da família e prevenção.",
                requirements: ["Graduação em Enfermagem", "COREN ativo", "Conhecimento em saúde pública"],
                benefits: ["Estabilidade", "Plano de saúde", "Vale refeição", "Progressão funcional"],
                posted: "2025-01-04",
                source: "gupy",
                url: "https://gupy.io/jobs/enfermeiro-atencao-basica-sp"
            },
            {
                id: 4,
                title: "Enfermeiro(a) Oncológico(a)",
                company: "Instituto Nacional de Câncer (INCA)",
                location: "Rio de Janeiro, RJ",
                salary: "R$ 9.200 - R$ 13.800",
                type: "CLT",
                level: "senior",
                specialty: "oncologia",
                description: "Vaga para enfermeiro(a) especialista em oncologia. Atuação em unidade de quimioterapia e cuidados paliativos.",
                requirements: ["Graduação em Enfermagem", "Especialização em Oncologia", "COREN ativo", "Experiência mínima de 3 anos"],
                benefits: ["Plano de saúde", "Vale refeição", "Auxílio transporte", "Capacitação continuada"],
                posted: "2025-01-03",
                source: "linkedin",
                url: "https://linkedin.com/jobs/enfermeiro-oncologico-inca"
            },
            {
                id: 5,
                title: "Enfermeiro(a) do Trabalho",
                company: "Vale S.A.",
                location: "Belo Horizonte, MG",
                salary: "R$ 8.000 - R$ 12.500",
                type: "CLT",
                level: "pleno",
                specialty: "trabalho",
                description: "Oportunidade para enfermeiro(a) do trabalho em empresa de mineração. Foco em saúde ocupacional e prevenção de acidentes.",
                requirements: ["Graduação em Enfermagem", "Especialização em Enfermagem do Trabalho", "COREN ativo", "Experiência em saúde ocupacional"],
                benefits: ["Plano de saúde", "Vale alimentação", "Participação nos lucros", "Programa de desenvolvimento"],
                posted: "2025-01-02",
                source: "catho",
                url: "https://catho.com.br/vagas/enfermeiro-trabalho-vale"
            },
            {
                id: 6,
                title: "Enfermeiro(a) - Home Care",
                company: "Grupo Mais Vida",
                location: "Rio de Janeiro, RJ",
                salary: "R$ 6.500 - R$ 9.800",
                type: "CLT",
                level: "pleno",
                specialty: "home-care",
                description: "Vaga para enfermeiro(a) em assistência domiciliar. Cuidados complexos no domicílio do paciente.",
                requirements: ["Graduação em Enfermagem", "COREN ativo", "Experiência em cuidados domiciliares", "CNH categoria B"],
                benefits: ["Plano de saúde", "Vale combustível", "Flexibilidade de horários", "Educação continuada"],
                posted: "2025-01-01",
                source: "gupy",
                url: "https://gupy.io/jobs/enfermeiro-home-care-maisvida"
            }
        ];

        // Concursos públicos simulados baseados na pesquisa
        this.contests = [
            {
                id: 101,
                title: "Concurso Público - Enfermeiro",
                organization: "Ministério da Saúde",
                location: "Nacional",
                salary: "R$ 4.063,46 - R$ 19.586,95",
                vacancies: 319,
                level: "superior",
                specialty: "geral",
                description: "Concurso público para enfermeiros em âmbito nacional. Diversas especialidades e locais de atuação.",
                requirements: ["Graduação em Enfermagem", "COREN ativo", "Experiência comprovada"],
                inscriptionPeriod: "02/01/2025 a 02/02/2025",
                examDate: "15/03/2025",
                status: "Inscrições abertas",
                posted: "2025-01-02",
                url: "https://concursos.gov.br/ministerio-saude-enfermeiro"
            },
            {
                id: 102,
                title: "Concurso USP - Enfermeiro",
                organization: "Universidade de São Paulo",
                location: "São Paulo, SP",
                salary: "R$ 11.334,47",
                vacancies: 7,
                level: "superior",
                specialty: "geral",
                description: "Concurso para enfermeiros em hospital universitário. Diversas especialidades disponíveis.",
                requirements: ["Graduação em Enfermagem", "COREN ativo", "Experiência hospitalar"],
                inscriptionPeriod: "15/08/2025 a 09/09/2025",
                examDate: "20/10/2025",
                status: "Previsto",
                posted: "2025-01-01",
                url: "https://fuvest.br/enfermeiro-2025"
            },
            {
                id: 103,
                title: "Técnico de Enfermagem",
                organization: "SUAS Sergipe",
                location: "Sergipe",
                salary: "R$ 1.996,53",
                vacancies: 114,
                level: "tecnico",
                specialty: "geral",
                description: "Concurso para técnicos de enfermagem no Sistema Único de Assistência Social.",
                requirements: ["Curso Técnico em Enfermagem", "COREN ativo"],
                inscriptionPeriod: "08/08/2025 a 18/08/2025",
                examDate: "25/09/2025",
                status: "Autorizado",
                posted: "2024-12-30",
                url: "https://concursos.gov.br/suas-se-tecnico-enfermagem"
            },
            {
                id: 104,
                title: "Enfermeiro - Prefeitura de Analândia",
                organization: "Prefeitura de Analândia",
                location: "Analândia, SP",
                salary: "R$ 8.500,00",
                vacancies: 2,
                level: "superior",
                specialty: "atencao-basica",
                description: "Concurso para enfermeiros na atenção básica municipal.",
                requirements: ["Graduação em Enfermagem", "COREN ativo", "Conhecimento em saúde pública"],
                inscriptionPeriod: "10/01/2025 a 25/01/2025",
                examDate: "10/03/2025",
                status: "Inscrições abertas",
                posted: "2025-01-05",
                url: "https://preparaenfermagem.com.br/concurso-analandia"
            },
            {
                id: 105,
                title: "COFEN - Diversos Cargos",
                organization: "Conselho Federal de Enfermagem",
                location: "Brasília, DF",
                salary: "R$ 6.500 - R$ 15.000",
                vacancies: 11,
                level: "superior",
                specialty: "geral",
                description: "Concurso do COFEN para diversos cargos administrativos e técnicos.",
                requirements: ["Graduação conforme cargo", "Experiência na área"],
                inscriptionPeriod: "Julho/2025 (Previsto)",
                examDate: "A definir",
                status: "Previsto",
                posted: "2024-12-28",
                url: "https://jcconcursos.com.br/concurso-cofen-2025"
            }
        ];
    }

    setupEventListeners() {
        // Filtros
        document.addEventListener('change', (e) => {
            if (e.target.matches('.job-filter')) {
                this.updateFilters();
                this.renderJobsAndContests();
            }
        });

        // Busca
        document.addEventListener('input', (e) => {
            if (e.target.matches('#job-search')) {
                this.searchJobs(e.target.value);
            }
        });

        // Favoritos
        document.addEventListener('click', (e) => {
            if (e.target.matches('.favorite-btn')) {
                this.toggleFavorite(e.target.dataset.id, e.target.dataset.type);
            }
        });

        // Aplicar para vaga
        document.addEventListener('click', (e) => {
            if (e.target.matches('.apply-btn')) {
                this.applyToJob(e.target.dataset.id);
            }
        });
    }

    updateFilters() {
        this.filters.location = document.getElementById('location-filter')?.value || '';
        this.filters.salary = document.getElementById('salary-filter')?.value || '';
        this.filters.type = document.getElementById('type-filter')?.value || 'all';
        this.filters.specialty = document.getElementById('specialty-filter')?.value || '';
        this.filters.level = document.getElementById('level-filter')?.value || '';
    }

    searchJobs(query) {
        const filteredJobs = this.jobs.filter(job => 
            job.title.toLowerCase().includes(query.toLowerCase()) ||
            job.company.toLowerCase().includes(query.toLowerCase()) ||
            job.description.toLowerCase().includes(query.toLowerCase())
        );

        const filteredContests = this.contests.filter(contest => 
            contest.title.toLowerCase().includes(query.toLowerCase()) ||
            contest.organization.toLowerCase().includes(query.toLowerCase()) ||
            contest.description.toLowerCase().includes(query.toLowerCase())
        );

        this.renderFilteredResults(filteredJobs, filteredContests);
    }

    applyFilters(items, isJob = true) {
        return items.filter(item => {
            // Filtro por localização
            if (this.filters.location && !item.location.toLowerCase().includes(this.filters.location.toLowerCase())) {
                return false;
            }

            // Filtro por especialidade
            if (this.filters.specialty && item.specialty !== this.filters.specialty) {
                return false;
            }

            // Filtro por nível (apenas para vagas)
            if (isJob && this.filters.level && item.level !== this.filters.level) {
                return false;
            }

            // Filtro por tipo
            if (this.filters.type === 'jobs' && !isJob) return false;
            if (this.filters.type === 'contests' && isJob) return false;

            return true;
        });
    }

    renderJobsAndContests() {
        const filteredJobs = this.applyFilters(this.jobs, true);
        const filteredContests = this.applyFilters(this.contests, false);
        
        this.renderFilteredResults(filteredJobs, filteredContests);
    }

    renderFilteredResults(jobs, contests) {
        const container = document.getElementById('jobs-container');
        if (!container) return;

        let html = '';

        // Renderizar vagas de emprego
        if (jobs.length > 0) {
            html += '<div class="jobs-section"><h3 class="section-title">Vagas de Emprego</h3>';
            jobs.forEach(job => {
                html += this.renderJobCard(job);
            });
            html += '</div>';
        }

        // Renderizar concursos
        if (contests.length > 0) {
            html += '<div class="contests-section"><h3 class="section-title">Concursos Públicos</h3>';
            contests.forEach(contest => {
                html += this.renderContestCard(contest);
            });
            html += '</div>';
        }

        if (jobs.length === 0 && contests.length === 0) {
            html = '<div class="no-results">Nenhuma vaga ou concurso encontrado com os filtros aplicados.</div>';
        }

        container.innerHTML = html;
    }

    renderJobCard(job) {
        const isFavorite = this.isFavorite(job.id, 'job');
        const specialtyLabel = this.getSpecialtyLabel(job.specialty);
        const levelLabel = this.getLevelLabel(job.level);

        return `
            <div class="job-card" data-id="${job.id}">
                <div class="job-header">
                    <div class="job-title-section">
                        <h4 class="job-title">${job.title}</h4>
                        <div class="job-meta">
                            <span class="company">${job.company}</span>
                            <span class="location">${job.location}</span>
                            <span class="job-type">${job.type}</span>
                        </div>
                    </div>
                    <button class="favorite-btn ${isFavorite ? 'favorited' : ''}" 
                            data-id="${job.id}" data-type="job">
                        ❤️
                    </button>
                </div>
                
                <div class="job-details">
                    <div class="salary">💰 ${job.salary}</div>
                    <div class="tags">
                        <span class="tag specialty">${specialtyLabel}</span>
                        <span class="tag level">${levelLabel}</span>
                    </div>
                </div>
                
                <div class="job-description">
                    <p>${job.description}</p>
                </div>
                
                <div class="job-requirements">
                    <h5>Requisitos:</h5>
                    <ul>
                        ${job.requirements.map(req => `<li>${req}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="job-benefits">
                    <h5>Benefícios:</h5>
                    <div class="benefits-tags">
                        ${job.benefits.map(benefit => `<span class="benefit-tag">${benefit}</span>`).join('')}
                    </div>
                </div>
                
                <div class="job-footer">
                    <div class="job-info">
                        <span class="posted-date">Publicado em: ${this.formatDate(job.posted)}</span>
                        <span class="source">Fonte: ${job.source}</span>
                    </div>
                    <div class="job-actions">
                        <button class="apply-btn" data-id="${job.id}">Candidatar-se</button>
                        <a href="${job.url}" target="_blank" class="view-btn">Ver no site</a>
                    </div>
                </div>
            </div>
        `;
    }

    renderContestCard(contest) {
        const isFavorite = this.isFavorite(contest.id, 'contest');
        const statusClass = contest.status.toLowerCase().replace(/\s+/g, '-');

        return `
            <div class="contest-card" data-id="${contest.id}">
                <div class="contest-header">
                    <div class="contest-title-section">
                        <h4 class="contest-title">${contest.title}</h4>
                        <div class="contest-meta">
                            <span class="organization">${contest.organization}</span>
                            <span class="location">${contest.location}</span>
                        </div>
                    </div>
                    <button class="favorite-btn ${isFavorite ? 'favorited' : ''}" 
                            data-id="${contest.id}" data-type="contest">
                        ❤️
                    </button>
                </div>
                
                <div class="contest-details">
                    <div class="salary">💰 ${contest.salary}</div>
                    <div class="vacancies">👥 ${contest.vacancies} vagas</div>
                    <div class="status status-${statusClass}">${contest.status}</div>
                </div>
                
                <div class="contest-description">
                    <p>${contest.description}</p>
                </div>
                
                <div class="contest-requirements">
                    <h5>Requisitos:</h5>
                    <ul>
                        ${contest.requirements.map(req => `<li>${req}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="contest-timeline">
                    <div class="timeline-item">
                        <strong>Inscrições:</strong> ${contest.inscriptionPeriod}
                    </div>
                    <div class="timeline-item">
                        <strong>Prova:</strong> ${contest.examDate}
                    </div>
                </div>
                
                <div class="contest-footer">
                    <div class="contest-info">
                        <span class="posted-date">Publicado em: ${this.formatDate(contest.posted)}</span>
                    </div>
                    <div class="contest-actions">
                        <a href="${contest.url}" target="_blank" class="view-btn">Ver edital</a>
                    </div>
                </div>
            </div>
        `;
    }

    getSpecialtyLabel(specialty) {
        const specialties = {
            'terapia-intensiva': 'Terapia Intensiva',
            'obstetricia': 'Obstetrícia',
            'atencao-basica': 'Atenção Básica',
            'oncologia': 'Oncologia',
            'trabalho': 'Enfermagem do Trabalho',
            'home-care': 'Home Care',
            'geral': 'Geral'
        };
        return specialties[specialty] || specialty;
    }

    getLevelLabel(level) {
        const levels = {
            'junior': 'Júnior',
            'pleno': 'Pleno',
            'senior': 'Sênior',
            'superior': 'Superior',
            'tecnico': 'Técnico'
        };
        return levels[level] || level;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    isFavorite(id, type) {
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        return favorites.some(fav => fav.id == id && fav.type === type);
    }

    toggleFavorite(id, type) {
        let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        const existingIndex = favorites.findIndex(fav => fav.id == id && fav.type === type);
        
        if (existingIndex > -1) {
            favorites.splice(existingIndex, 1);
        } else {
            favorites.push({ id: parseInt(id), type });
        }
        
        localStorage.setItem('favorites', JSON.stringify(favorites));
        this.renderJobsAndContests(); // Re-render para atualizar ícones de favorito
    }

    applyToJob(jobId) {
        const job = this.jobs.find(j => j.id == jobId);
        if (!job) return;

        // Simular processo de candidatura
        const modal = this.createApplicationModal(job);
        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    createApplicationModal(job) {
        const modal = document.createElement('div');
        modal.className = 'application-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Candidatar-se para: ${job.title}</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <p><strong>Empresa:</strong> ${job.company}</p>
                    <p><strong>Localização:</strong> ${job.location}</p>
                    <p><strong>Salário:</strong> ${job.salary}</p>
                    
                    <div class="application-options">
                        <h4>Como deseja se candidatar?</h4>
                        <button class="option-btn" onclick="window.open('${job.url}', '_blank')">
                            Candidatar-se no site original
                        </button>
                        <button class="option-btn" onclick="jobsIntegration.sendCurriculumByEmail('${job.company}')">
                            Enviar currículo por e-mail
                        </button>
                        <button class="option-btn" onclick="jobsIntegration.shareOnWhatsApp('${job.title}', '${job.company}')">
                            Compartilhar no WhatsApp
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Event listener para fechar modal
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        return modal;
    }

    sendCurriculumByEmail(company) {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const subject = `Candidatura - ${userData.nome || 'Profissional de Enfermagem'}`;
        const body = `Prezados,

Meu nome é ${userData.nome || '[Seu Nome]'}, sou profissional de enfermagem e tenho interesse em fazer parte da equipe da ${company}.

Estou enviando meu currículo em anexo para análise e consideração para oportunidades disponíveis.

Agradeço a atenção e fico à disposição para esclarecimentos.

Atenciosamente,
${userData.nome || '[Seu Nome]'}
${userData.telefone || '[Seu Telefone]'}
${userData.email || '[Seu E-mail]'}`;

        const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink);
    }

    shareOnWhatsApp(jobTitle, company) {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const message = `Olá! Encontrei uma vaga interessante para ${jobTitle} na ${company}. Gostaria de saber mais informações sobre esta oportunidade.

Sou ${userData.nome || '[Seu Nome]'}, profissional de enfermagem.

Obrigado(a)!`;

        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    }

    // Método para atualizar dados em tempo real (simulado)
    refreshData() {
        // Em uma implementação real, isso faria chamadas para APIs
        console.log('Atualizando dados de vagas e concursos...');
        
        // Simular adição de nova vaga
        const newJob = {
            id: this.jobs.length + 1,
            title: "Enfermeiro(a) - Emergência",
            company: "Hospital das Clínicas",
            location: "São Paulo, SP",
            salary: "R$ 7.200 - R$ 10.800",
            type: "CLT",
            level: "pleno",
            specialty: "emergencia",
            description: "Nova vaga para enfermeiro(a) em pronto socorro. Experiência em urgência e emergência.",
            requirements: ["Graduação em Enfermagem", "COREN ativo", "Experiência em emergência"],
            benefits: ["Plano de saúde", "Vale refeição", "Adicional noturno"],
            posted: new Date().toISOString().split('T')[0],
            source: "linkedin",
            url: "https://linkedin.com/jobs/enfermeiro-emergencia-hc"
        };

        this.jobs.unshift(newJob);
        this.renderJobsAndContests();
        
        // Mostrar notificação
        this.showNotification('Nova vaga adicionada: ' + newJob.title);
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Método para exportar vagas favoritas
    exportFavorites() {
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        const favoriteJobs = this.jobs.filter(job => 
            favorites.some(fav => fav.id === job.id && fav.type === 'job')
        );
        const favoriteContests = this.contests.filter(contest => 
            favorites.some(fav => fav.id === contest.id && fav.type === 'contest')
        );

        const exportData = {
            vagas: favoriteJobs,
            concursos: favoriteContests,
            exportedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'vagas-favoritas.json';
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.jobsIntegration = new JobsIntegration();
    
    // Atualizar dados a cada 30 minutos (em produção seria menos frequente)
    setInterval(() => {
        window.jobsIntegration.refreshData();
    }, 30 * 60 * 1000);
});

// Estilos CSS para o sistema de vagas
const jobsStyles = `
.jobs-section, .contests-section {
    margin-bottom: 2rem;
}

.section-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--primary-blue);
    margin-bottom: 1rem;
    border-bottom: 2px solid var(--primary-blue);
    padding-bottom: 0.5rem;
}

.job-card, .contest-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    border: 1px solid #e5e7eb;
    transition: all 0.3s ease;
}

.job-card:hover, .contest-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.job-header, .contest-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
}

.job-title, .contest-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--neutral-gray);
    margin: 0 0 0.5rem 0;
}

.job-meta, .contest-meta {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    font-size: 0.9rem;
    color: #6b7280;
}

.favorite-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    opacity: 0.5;
    transition: opacity 0.3s ease;
}

.favorite-btn:hover, .favorite-btn.favorited {
    opacity: 1;
}

.job-details, .contest-details {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    align-items: center;
}

.salary {
    font-weight: 600;
    color: var(--success-green);
}

.vacancies {
    font-weight: 600;
    color: var(--primary-blue);
}

.status {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
}

.status-inscrições-abertas {
    background: #dcfce7;
    color: #166534;
}

.status-previsto {
    background: #fef3c7;
    color: #92400e;
}

.status-autorizado {
    background: #dbeafe;
    color: #1e40af;
}

.tags {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.tag {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 500;
}

.tag.specialty {
    background: #f3e8ff;
    color: #7c3aed;
}

.tag.level {
    background: #ecfdf5;
    color: #059669;
}

.job-description, .contest-description {
    margin-bottom: 1rem;
    color: #4b5563;
    line-height: 1.6;
}

.job-requirements, .contest-requirements {
    margin-bottom: 1rem;
}

.job-requirements h5, .contest-requirements h5 {
    margin: 0 0 0.5rem 0;
    font-weight: 600;
    color: var(--neutral-gray);
}

.job-requirements ul, .contest-requirements ul {
    margin: 0;
    padding-left: 1.5rem;
    color: #4b5563;
}

.job-benefits {
    margin-bottom: 1rem;
}

.job-benefits h5 {
    margin: 0 0 0.5rem 0;
    font-weight: 600;
    color: var(--neutral-gray);
}

.benefits-tags {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.benefit-tag {
    padding: 0.25rem 0.75rem;
    background: #f0f9ff;
    color: #0369a1;
    border-radius: 20px;
    font-size: 0.8rem;
}

.contest-timeline {
    margin-bottom: 1rem;
    padding: 1rem;
    background: #f9fafb;
    border-radius: 8px;
}

.timeline-item {
    margin-bottom: 0.5rem;
    color: #4b5563;
}

.job-footer, .contest-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
}

.job-info, .contest-info {
    display: flex;
    gap: 1rem;
    font-size: 0.8rem;
    color: #6b7280;
}

.job-actions, .contest-actions {
    display: flex;
    gap: 0.5rem;
}

.apply-btn, .view-btn {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 500;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.3s ease;
}

.apply-btn {
    background: var(--primary-blue);
    color: white;
    border: none;
}

.apply-btn:hover {
    background: var(--secondary-blue);
}

.view-btn {
    background: #f3f4f6;
    color: var(--neutral-gray);
    border: 1px solid #d1d5db;
}

.view-btn:hover {
    background: #e5e7eb;
}

.application-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
    margin: 0;
    color: var(--primary-blue);
}

.close-modal {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #6b7280;
}

.application-options {
    margin-top: 1.5rem;
}

.application-options h4 {
    margin-bottom: 1rem;
    color: var(--neutral-gray);
}

.option-btn {
    display: block;
    width: 100%;
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    background: #f9fafb;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.option-btn:hover {
    background: var(--primary-blue);
    color: white;
}

.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--success-green);
    color: white;
    padding: 1rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1001;
    animation: slideIn 0.3s ease;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.no-results {
    text-align: center;
    padding: 3rem;
    color: #6b7280;
    font-size: 1.1rem;
}

@media (max-width: 768px) {
    .job-footer, .contest-footer {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
    }
    
    .job-actions, .contest-actions {
        justify-content: center;
    }
    
    .job-details, .contest-details {
        flex-direction: column;
        align-items: flex-start;
    }
}
`;

// Adicionar estilos ao documento
const styleSheet = document.createElement('style');
styleSheet.textContent = jobsStyles;
document.head.appendChild(styleSheet);

