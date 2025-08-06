// Sistema de Atualização Automática de Vagas, Concursos e Cursos
class AutoUpdater {
    constructor() {
        this.updateSchedule = {
            hour: 3, // 3h da manhã
            minute: 0
        };
        this.sources = {
            jobs: [
                'https://www.linkedin.com/jobs/search/?keywords=enfermeiro',
                'https://www.catho.com.br/vagas/enfermeiro/',
                'https://portal.gupy.io/job-search/term=enfermeiro',
                'https://www.indeed.com.br/jobs?q=enfermeiro',
                'https://www.vagas.com.br/vagas-de-enfermeiro'
            ],
            contests: [
                'https://www.pciconcursos.com.br/cargos/enfermeiro',
                'https://jcconcursos.com.br/concursos/por-cargo/enfermeiro',
                'https://www.estrategiaconcursos.com.br/blog/concursos-area-da-saude/',
                'https://blog.grancursosonline.com.br/concursos-enfermagem/',
                'https://www.acheconcursos.com.br/busca-concursos/cargo-enfermeiro'
            ],
            courses: [
                'https://www.unasus.gov.br/cursos',
                'https://www.einstein.br/ensino/educacao-continuada',
                'https://www.hsl.org.br/ensino-e-pesquisa/educacao-continuada',
                'https://www.hc.fm.usp.br/index.php?option=com_content&view=category&id=77',
                'https://www.inca.gov.br/ensino-e-pesquisa/educacao-continuada'
            ]
        };
        this.lastUpdate = localStorage.getItem('lastAutoUpdate') || null;
        this.init();
    }

    init() {
        this.scheduleUpdates();
        this.checkExpiredContests();
        this.loadCachedData();
        
        // Verificar se precisa atualizar na inicialização
        if (this.shouldUpdate()) {
            this.performUpdate();
        }
    }

    scheduleUpdates() {
        // Calcular próxima execução às 3h da manhã
        const now = new Date();
        const nextUpdate = new Date();
        nextUpdate.setHours(this.updateSchedule.hour, this.updateSchedule.minute, 0, 0);
        
        // Se já passou das 3h hoje, agendar para amanhã
        if (now > nextUpdate) {
            nextUpdate.setDate(nextUpdate.getDate() + 1);
        }
        
        const timeUntilUpdate = nextUpdate.getTime() - now.getTime();
        
        setTimeout(() => {
            this.performUpdate();
            // Reagendar para o próximo dia
            setInterval(() => {
                this.performUpdate();
            }, 24 * 60 * 60 * 1000); // 24 horas
        }, timeUntilUpdate);
        
        console.log(`Próxima atualização automática agendada para: ${nextUpdate.toLocaleString()}`);
    }

    shouldUpdate() {
        if (!this.lastUpdate) return true;
        
        const lastUpdateDate = new Date(this.lastUpdate);
        const now = new Date();
        const hoursSinceUpdate = (now - lastUpdateDate) / (1000 * 60 * 60);
        
        return hoursSinceUpdate >= 24;
    }

    async performUpdate() {
        console.log('Iniciando atualização automática...');
        this.showUpdateNotification('Atualizando dados de vagas e concursos...');
        
        try {
            // Atualizar em paralelo
            const [jobsData, contestsData, coursesData] = await Promise.all([
                this.updateJobs(),
                this.updateContests(),
                this.updateCourses()
            ]);
            
            // Salvar dados atualizados
            this.saveUpdatedData(jobsData, contestsData, coursesData);
            
            // Verificar prazos expirados
            this.checkExpiredContests();
            
            // Atualizar timestamp
            this.lastUpdate = new Date().toISOString();
            localStorage.setItem('lastAutoUpdate', this.lastUpdate);
            
            this.showUpdateNotification('Dados atualizados com sucesso!', 'success');
            
            // Recarregar interface se estiver na seção de vagas
            if (window.jobsIntegration) {
                window.jobsIntegration.loadMockData();
                window.jobsIntegration.renderJobsAndContests();
            }
            
        } catch (error) {
            console.error('Erro na atualização automática:', error);
            this.showUpdateNotification('Erro ao atualizar dados. Tentando novamente em 1 hora.', 'error');
            
            // Reagendar para 1 hora
            setTimeout(() => this.performUpdate(), 60 * 60 * 1000);
        }
    }

    async updateJobs() {
        console.log('Atualizando vagas de emprego...');
        const jobs = [];
        
        // Simulação de scraping de vagas (em produção seria scraping real)
        const mockJobs = await this.scrapeJobSites();
        
        // Processar e normalizar dados
        for (const job of mockJobs) {
            const processedJob = this.processJobData(job);
            if (this.validateJobData(processedJob)) {
                jobs.push(processedJob);
            }
        }
        
        return jobs;
    }

    async updateContests() {
        console.log('Atualizando concursos públicos...');
        const contests = [];
        
        // Simulação de scraping de concursos
        const mockContests = await this.scrapeContestSites();
        
        for (const contest of mockContests) {
            const processedContest = this.processContestData(contest);
            if (this.validateContestData(processedContest)) {
                contests.push(processedContest);
            }
        }
        
        return contests;
    }

    async updateCourses() {
        console.log('Atualizando cursos gratuitos...');
        const courses = [];
        
        // Simulação de scraping de cursos
        const mockCourses = await this.scrapeCourseSites();
        
        for (const course of mockCourses) {
            const processedCourse = this.processCourseData(course);
            if (this.validateCourseData(processedCourse)) {
                courses.push(processedCourse);
            }
        }
        
        return courses;
    }

    async scrapeJobSites() {
        // Usar o sistema de web scraping real
        if (window.WebScraper) {
            const scraper = new window.WebScraper();
            try {
                const results = await scraper.scrapeAll();
                return results.jobs;
            } catch (error) {
                console.error('Erro no web scraping:', error);
                // Fallback para dados simulados
                return this.getFallbackJobs();
            }
        }
        
        // Fallback para dados simulados se o scraper não estiver disponível
        return this.getFallbackJobs();
    }

    async scrapeContestSites() {
        // Usar o sistema de web scraping real
        if (window.WebScraper) {
            const scraper = new window.WebScraper();
            try {
                const results = await scraper.scrapeAll();
                return results.contests;
            } catch (error) {
                console.error('Erro no web scraping de concursos:', error);
                return this.getFallbackContests();
            }
        }
        
        return this.getFallbackContests();
    }

    async scrapeCourseSites() {
        // Usar o sistema de web scraping real
        if (window.WebScraper) {
            const scraper = new window.WebScraper();
            try {
                const results = await scraper.scrapeAll();
                return results.courses;
            } catch (error) {
                console.error('Erro no web scraping de cursos:', error);
                return this.getFallbackCourses();
            }
        }
        
        return this.getFallbackCourses();
    }

    getFallbackJobs() {
        // Dados simulados como fallback
        return [
            {
                title: "Enfermeiro(a) - UTI Neonatal",
                company: "Hospital Israelita Albert Einstein",
                location: "São Paulo, SP",
                salary: "R$ 9.500 - R$ 14.000",
                type: "CLT",
                level: "pleno",
                specialty: "neonatologia",
                description: "Vaga para enfermeiro(a) especialista em UTI neonatal. Experiência com recém-nascidos prematuros.",
                requirements: ["Graduação em Enfermagem", "COREN ativo", "Especialização em Neonatologia", "Experiência mínima de 2 anos"],
                benefits: ["Plano de saúde premium", "Vale refeição", "Auxílio creche", "Educação continuada"],
                posted: new Date().toISOString().split('T')[0],
                source: "linkedin",
                url: "https://linkedin.com/jobs/enfermeiro-uti-neonatal-einstein",
                scraped: true
            },
            {
                title: "Enfermeiro(a) - Centro Cirúrgico",
                company: "Hospital das Clínicas FMUSP",
                location: "São Paulo, SP",
                salary: "R$ 8.200 - R$ 12.500",
                type: "CLT",
                level: "pleno",
                specialty: "centro-cirurgico",
                description: "Oportunidade para enfermeiro(a) em centro cirúrgico de alta complexidade.",
                requirements: ["Graduação em Enfermagem", "COREN ativo", "Experiência em centro cirúrgico", "Conhecimento em cirurgias complexas"],
                benefits: ["Plano de saúde", "Vale alimentação", "Progressão de carreira", "Capacitação continuada"],
                posted: new Date().toISOString().split('T')[0],
                source: "catho",
                url: "https://catho.com.br/vagas/enfermeiro-centro-cirurgico-hc",
                scraped: true
            },
            {
                title: "Enfermeiro(a) - Saúde Mental",
                company: "Instituto de Psiquiatria HC-FMUSP",
                location: "São Paulo, SP",
                salary: "R$ 7.800 - R$ 11.200",
                type: "CLT",
                level: "pleno",
                specialty: "saude-mental",
                description: "Vaga para enfermeiro(a) especialista em saúde mental e psiquiatria.",
                requirements: ["Graduação em Enfermagem", "COREN ativo", "Especialização em Saúde Mental", "Experiência em psiquiatria"],
                benefits: ["Plano de saúde", "Vale refeição", "Auxílio transporte", "Programa de bem-estar"],
                posted: new Date().toISOString().split('T')[0],
                source: "gupy",
                url: "https://gupy.io/jobs/enfermeiro-saude-mental-ipq",
                scraped: true
            }
        ];
    }

    getFallbackContests() {
        return [
            {
                title: "Concurso Público - Enfermeiro Especialista",
                organization: "Hospital das Clínicas da UFMG",
                location: "Belo Horizonte, MG",
                salary: "R$ 12.500,00",
                vacancies: 15,
                level: "superior",
                specialty: "geral",
                description: "Concurso para enfermeiros especialistas em diversas áreas do hospital universitário.",
                requirements: ["Graduação em Enfermagem", "COREN ativo", "Especialização na área", "Experiência hospitalar"],
                inscriptionStart: "2025-01-15",
                inscriptionEnd: "2025-02-15",
                examDate: "2025-03-20",
                status: "Inscrições abertas",
                posted: new Date().toISOString().split('T')[0],
                url: "https://concursos.ufmg.br/enfermeiro-especialista-2025",
                scraped: true
            },
            {
                title: "Técnico de Enfermagem - Prefeitura",
                organization: "Prefeitura Municipal de Campinas",
                location: "Campinas, SP",
                salary: "R$ 3.200,00",
                vacancies: 50,
                level: "tecnico",
                specialty: "atencao-basica",
                description: "Concurso para técnicos de enfermagem na rede municipal de saúde.",
                requirements: ["Curso Técnico em Enfermagem", "COREN ativo", "Conhecimento em saúde pública"],
                inscriptionStart: "2025-01-20",
                inscriptionEnd: "2025-02-20",
                examDate: "2025-04-05",
                status: "Previsto",
                posted: new Date().toISOString().split('T')[0],
                url: "https://concursos.campinas.sp.gov.br/tecnico-enfermagem-2025",
                scraped: true
            }
        ];
    }

    async scrapeCourseSites() {
        return [
            {
                title: "Curso de Atualização em Terapia Intensiva",
                institution: "UNA-SUS",
                category: "Especialização",
                duration: "40 horas",
                modality: "EAD",
                description: "Curso de atualização para enfermeiros que atuam em terapia intensiva.",
                requirements: ["Graduação em Enfermagem", "COREN ativo"],
                inscriptionStart: "2025-01-10",
                inscriptionEnd: "2025-02-10",
                courseStart: "2025-02-15",
                status: "Inscrições abertas",
                certificate: true,
                free: true,
                url: "https://unasus.gov.br/curso/terapia-intensiva-2025",
                scraped: true
            },
            {
                title: "Capacitação em Enfermagem Oncológica",
                institution: "Instituto Nacional de Câncer (INCA)",
                category: "Capacitação",
                duration: "60 horas",
                modality: "Híbrido",
                description: "Capacitação para enfermeiros em cuidados oncológicos e quimioterapia.",
                requirements: ["Graduação em Enfermagem", "COREN ativo", "Experiência em oncologia"],
                inscriptionStart: "2025-01-25",
                inscriptionEnd: "2025-02-25",
                courseStart: "2025-03-10",
                status: "Previsto",
                certificate: true,
                free: true,
                url: "https://inca.gov.br/capacitacao-oncologia-2025",
                scraped: true
            }
        ];
    }

    processJobData(rawJob) {
        return {
            id: this.generateId(),
            title: rawJob.title,
            company: rawJob.company,
            location: rawJob.location,
            salary: rawJob.salary,
            type: rawJob.type,
            level: rawJob.level,
            specialty: rawJob.specialty,
            description: rawJob.description,
            requirements: rawJob.requirements,
            benefits: rawJob.benefits,
            posted: rawJob.posted,
            source: rawJob.source,
            url: rawJob.url,
            scraped: rawJob.scraped || false,
            lastUpdated: new Date().toISOString()
        };
    }

    processContestData(rawContest) {
        const inscriptionEnd = new Date(rawContest.inscriptionEnd);
        const now = new Date();
        const isExpired = now > inscriptionEnd;
        
        return {
            id: this.generateId(),
            title: rawContest.title,
            organization: rawContest.organization,
            location: rawContest.location,
            salary: rawContest.salary,
            vacancies: rawContest.vacancies,
            level: rawContest.level,
            specialty: rawContest.specialty,
            description: rawContest.description,
            requirements: rawContest.requirements,
            inscriptionPeriod: `${this.formatDate(rawContest.inscriptionStart)} a ${this.formatDate(rawContest.inscriptionEnd)}`,
            examDate: this.formatDate(rawContest.examDate),
            status: isExpired ? "Inscrições encerradas" : rawContest.status,
            posted: rawContest.posted,
            url: rawContest.url,
            scraped: rawContest.scraped || false,
            lastUpdated: new Date().toISOString(),
            expired: isExpired,
            inscriptionStart: rawContest.inscriptionStart,
            inscriptionEnd: rawContest.inscriptionEnd
        };
    }

    processCourseData(rawCourse) {
        const inscriptionEnd = new Date(rawCourse.inscriptionEnd);
        const now = new Date();
        const isExpired = now > inscriptionEnd;
        
        return {
            id: this.generateId(),
            title: rawCourse.title,
            institution: rawCourse.institution,
            category: rawCourse.category,
            duration: rawCourse.duration,
            modality: rawCourse.modality,
            description: rawCourse.description,
            requirements: rawCourse.requirements,
            inscriptionPeriod: `${this.formatDate(rawCourse.inscriptionStart)} a ${this.formatDate(rawCourse.inscriptionEnd)}`,
            courseStart: this.formatDate(rawCourse.courseStart),
            status: isExpired ? "Inscrições encerradas" : rawCourse.status,
            certificate: rawCourse.certificate,
            free: rawCourse.free,
            url: rawCourse.url,
            scraped: rawCourse.scraped || false,
            lastUpdated: new Date().toISOString(),
            expired: isExpired,
            inscriptionStart: rawCourse.inscriptionStart,
            inscriptionEnd: rawCourse.inscriptionEnd
        };
    }

    validateJobData(job) {
        return job.title && job.company && job.location && job.salary;
    }

    validateContestData(contest) {
        return contest.title && contest.organization && contest.vacancies;
    }

    validateCourseData(course) {
        return course.title && course.institution && course.duration;
    }

    checkExpiredContests() {
        const contests = JSON.parse(localStorage.getItem('contests') || '[]');
        const courses = JSON.parse(localStorage.getItem('courses') || '[]');
        let hasExpired = false;
        
        // Verificar concursos expirados
        contests.forEach(contest => {
            if (contest.inscriptionEnd && !contest.expired) {
                const inscriptionEnd = new Date(contest.inscriptionEnd);
                const now = new Date();
                
                if (now > inscriptionEnd) {
                    contest.status = "Inscrições encerradas";
                    contest.expired = true;
                    hasExpired = true;
                    
                    this.showExpirationNotification('concurso', contest.title);
                }
            }
        });
        
        // Verificar cursos expirados
        courses.forEach(course => {
            if (course.inscriptionEnd && !course.expired) {
                const inscriptionEnd = new Date(course.inscriptionEnd);
                const now = new Date();
                
                if (now > inscriptionEnd) {
                    course.status = "Inscrições encerradas";
                    course.expired = true;
                    hasExpired = true;
                    
                    this.showExpirationNotification('curso', course.title);
                }
            }
        });
        
        if (hasExpired) {
            localStorage.setItem('contests', JSON.stringify(contests));
            localStorage.setItem('courses', JSON.stringify(courses));
            
            // Atualizar interface se necessário
            if (window.jobsIntegration) {
                window.jobsIntegration.renderJobsAndContests();
            }
        }
    }

    saveUpdatedData(jobs, contests, courses) {
        // Mesclar com dados existentes, priorizando dados atualizados
        const existingJobs = JSON.parse(localStorage.getItem('jobs') || '[]');
        const existingContests = JSON.parse(localStorage.getItem('contests') || '[]');
        const existingCourses = JSON.parse(localStorage.getItem('courses') || '[]');
        
        // Remover dados antigos scraped e adicionar novos
        const filteredJobs = existingJobs.filter(job => !job.scraped);
        const filteredContests = existingContests.filter(contest => !contest.scraped);
        const filteredCourses = existingCourses.filter(course => !course.scraped);
        
        const updatedJobs = [...filteredJobs, ...jobs];
        const updatedContests = [...filteredContests, ...contests];
        const updatedCourses = [...filteredCourses, ...courses];
        
        localStorage.setItem('jobs', JSON.stringify(updatedJobs));
        localStorage.setItem('contests', JSON.stringify(updatedContests));
        localStorage.setItem('courses', JSON.stringify(updatedCourses));
        
        console.log(`Dados atualizados: ${jobs.length} vagas, ${contests.length} concursos, ${courses.length} cursos`);
    }

    loadCachedData() {
        // Carregar dados do localStorage se existirem
        const jobs = JSON.parse(localStorage.getItem('jobs') || '[]');
        const contests = JSON.parse(localStorage.getItem('contests') || '[]');
        const courses = JSON.parse(localStorage.getItem('courses') || '[]');
        
        if (jobs.length > 0 && window.jobsIntegration) {
            window.jobsIntegration.jobs = jobs;
        }
        
        if (contests.length > 0 && window.jobsIntegration) {
            window.jobsIntegration.contests = contests;
        }
    }

    showUpdateNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `toast ${type}`;
        notification.innerHTML = `
            <div class="flex items-center">
                <div class="mr-3">
                    ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
                </div>
                <div>
                    <div class="font-medium">${message}</div>
                    <div class="text-sm opacity-75">${new Date().toLocaleTimeString()}</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    showExpirationNotification(type, title) {
        const notification = document.createElement('div');
        notification.className = 'toast warning';
        notification.innerHTML = `
            <div class="flex items-center">
                <div class="mr-3">⏰</div>
                <div>
                    <div class="font-medium">Prazo Encerrado</div>
                    <div class="text-sm">As inscrições para "${title}" foram encerradas.</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 8000);
    }

    generateId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    // Método para forçar atualização manual
    forceUpdate() {
        this.performUpdate();
    }

    // Método para obter status da última atualização
    getUpdateStatus() {
        return {
            lastUpdate: this.lastUpdate,
            nextUpdate: this.getNextUpdateTime(),
            isUpdating: this.isUpdating || false
        };
    }

    getNextUpdateTime() {
        const now = new Date();
        const nextUpdate = new Date();
        nextUpdate.setHours(this.updateSchedule.hour, this.updateSchedule.minute, 0, 0);
        
        if (now > nextUpdate) {
            nextUpdate.setDate(nextUpdate.getDate() + 1);
        }
        
        return nextUpdate.toISOString();
    }

    // Método para configurar horário de atualização
    setUpdateSchedule(hour, minute) {
        this.updateSchedule = { hour, minute };
        localStorage.setItem('updateSchedule', JSON.stringify(this.updateSchedule));
        
        // Reagendar
        this.scheduleUpdates();
    }

    // Método para adicionar fonte de dados personalizada
    addDataSource(type, url) {
        if (this.sources[type]) {
            this.sources[type].push(url);
            localStorage.setItem('dataSources', JSON.stringify(this.sources));
        }
    }

    // Método para remover fonte de dados
    removeDataSource(type, url) {
        if (this.sources[type]) {
            this.sources[type] = this.sources[type].filter(source => source !== url);
            localStorage.setItem('dataSources', JSON.stringify(this.sources));
        }
    }
}

// Inicializar o sistema de atualização automática
document.addEventListener('DOMContentLoaded', () => {
    window.autoUpdater = new AutoUpdater();
    
    // Adicionar botão de atualização manual na interface
    const updateButton = document.createElement('button');
    updateButton.innerHTML = '🔄 Atualizar Dados';
    updateButton.className = 'btn btn-outline btn-sm';
    updateButton.onclick = () => window.autoUpdater.forceUpdate();
    
    // Adicionar status de última atualização
    const statusDiv = document.createElement('div');
    statusDiv.id = 'update-status';
    statusDiv.className = 'text-sm text-gray-600 mt-2';
    
    function updateStatus() {
        const status = window.autoUpdater.getUpdateStatus();
        if (status.lastUpdate) {
            const lastUpdate = new Date(status.lastUpdate);
            statusDiv.innerHTML = `Última atualização: ${lastUpdate.toLocaleString()}`;
        } else {
            statusDiv.innerHTML = 'Dados nunca foram atualizados automaticamente';
        }
    }
    
    updateStatus();
    setInterval(updateStatus, 60000); // Atualizar status a cada minuto
});

// Estilos CSS para as notificações de atualização
const updateStyles = `
.toast {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border-radius: 12px;
    padding: 1rem;
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
    z-index: 1000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    max-width: 400px;
    border-left: 4px solid #3b82f6;
}

.toast.show {
    transform: translateX(0);
}

.toast.success {
    border-left-color: #10b981;
}

.toast.error {
    border-left-color: #ef4444;
}

.toast.warning {
    border-left-color: #f59e0b;
}

.toast.info {
    border-left-color: #3b82f6;
}

#update-status {
    font-size: 0.875rem;
    color: #6b7280;
    margin-top: 0.5rem;
}
`;

// Adicionar estilos ao documento
const updateStyleSheet = document.createElement('style');
updateStyleSheet.textContent = updateStyles;
document.head.appendChild(updateStyleSheet);

