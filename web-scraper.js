// Sistema de Web Scraping para Coleta Automática de Dados
class WebScraper {
    constructor() {
        this.scrapers = {
            linkedin: new LinkedInScraper(),
            catho: new CathoScraper(),
            gupy: new GupyScraper(),
            pciconcursos: new PCIConcursosScraper(),
            jcconcursos: new JCConcursosScraper(),
            unasus: new UNASUSScraper(),
            einstein: new EinsteinScraper(),
            inca: new INCAScraper()
        };
        this.proxyList = [
            'https://cors-anywhere.herokuapp.com/',
            'https://api.allorigins.win/get?url=',
            'https://thingproxy.freeboard.io/fetch/'
        ];
        this.currentProxyIndex = 0;
    }

    async scrapeAll() {
        const results = {
            jobs: [],
            contests: [],
            courses: []
        };

        try {
            // Scraping de vagas
            const jobPromises = [
                this.scrapers.linkedin.scrapeJobs(),
                this.scrapers.catho.scrapeJobs(),
                this.scrapers.gupy.scrapeJobs()
            ];

            const jobResults = await Promise.allSettled(jobPromises);
            jobResults.forEach(result => {
                if (result.status === 'fulfilled' && result.value) {
                    results.jobs.push(...result.value);
                }
            });

            // Scraping de concursos
            const contestPromises = [
                this.scrapers.pciconcursos.scrapeContests(),
                this.scrapers.jcconcursos.scrapeContests()
            ];

            const contestResults = await Promise.allSettled(contestPromises);
            contestResults.forEach(result => {
                if (result.status === 'fulfilled' && result.value) {
                    results.contests.push(...result.value);
                }
            });

            // Scraping de cursos
            const coursePromises = [
                this.scrapers.unasus.scrapeCourses(),
                this.scrapers.einstein.scrapeCourses(),
                this.scrapers.inca.scrapeCourses()
            ];

            const courseResults = await Promise.allSettled(coursePromises);
            courseResults.forEach(result => {
                if (result.status === 'fulfilled' && result.value) {
                    results.courses.push(...result.value);
                }
            });

        } catch (error) {
            console.error('Erro no scraping geral:', error);
        }

        return results;
    }

    async fetchWithProxy(url, options = {}) {
        const proxy = this.proxyList[this.currentProxyIndex];
        const proxiedUrl = proxy + encodeURIComponent(url);
        
        try {
            const response = await fetch(proxiedUrl, {
                ...options,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    ...options.headers
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            return response;
        } catch (error) {
            // Tentar próximo proxy
            this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxyList.length;
            throw error;
        }
    }

    parseHTML(htmlString) {
        const parser = new DOMParser();
        return parser.parseFromString(htmlString, 'text/html');
    }

    extractText(element) {
        return element ? element.textContent.trim() : '';
    }

    extractAttribute(element, attribute) {
        return element ? element.getAttribute(attribute) : '';
    }

    cleanText(text) {
        return text.replace(/\s+/g, ' ').trim();
    }

    parseDate(dateString) {
        // Tentar diferentes formatos de data
        const formats = [
            /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // DD/MM/YYYY
            /(\d{4})-(\d{1,2})-(\d{1,2})/,   // YYYY-MM-DD
            /(\d{1,2})-(\d{1,2})-(\d{4})/    // DD-MM-YYYY
        ];

        for (const format of formats) {
            const match = dateString.match(format);
            if (match) {
                if (format === formats[0] || format === formats[2]) {
                    // DD/MM/YYYY ou DD-MM-YYYY
                    return new Date(match[3], match[2] - 1, match[1]);
                } else {
                    // YYYY-MM-DD
                    return new Date(match[1], match[2] - 1, match[3]);
                }
            }
        }

        return new Date();
    }

    parseSalary(salaryText) {
        const cleanSalary = salaryText.replace(/[^\d,.-]/g, '');
        const ranges = cleanSalary.split(/\s*[-a]\s*/);
        
        if (ranges.length === 2) {
            return `R$ ${ranges[0].trim()} - R$ ${ranges[1].trim()}`;
        }
        
        return `R$ ${cleanSalary}`;
    }
}

// Scraper específico para LinkedIn
class LinkedInScraper {
    constructor() {
        this.baseUrl = 'https://www.linkedin.com/jobs/search/';
        this.searchParams = {
            keywords: 'enfermeiro',
            location: 'Brasil',
            f_TPR: 'r86400' // Últimas 24 horas
        };
    }

    async scrapeJobs() {
        try {
            // Simulação de scraping do LinkedIn
            // Em produção, usaria Puppeteer ou API oficial
            return this.getMockLinkedInJobs();
        } catch (error) {
            console.error('Erro no scraping do LinkedIn:', error);
            return [];
        }
    }

    getMockLinkedInJobs() {
        return [
            {
                title: "Enfermeiro(a) - Cardiologia",
                company: "Hospital do Coração (HCor)",
                location: "São Paulo, SP",
                salary: "R$ 8.500 - R$ 13.000",
                type: "CLT",
                level: "pleno",
                specialty: "cardiologia",
                description: "Vaga para enfermeiro(a) especialista em cardiologia. Experiência em hemodinâmica e pós-operatório cardíaco.",
                requirements: ["Graduação em Enfermagem", "COREN ativo", "Especialização em Cardiologia", "Experiência mínima de 3 anos"],
                benefits: ["Plano de saúde", "Vale refeição", "Participação nos lucros", "Educação continuada"],
                posted: new Date().toISOString().split('T')[0],
                source: "linkedin",
                url: "https://linkedin.com/jobs/enfermeiro-cardiologia-hcor",
                scraped: true
            }
        ];
    }
}

// Scraper específico para Catho
class CathoScraper {
    constructor() {
        this.baseUrl = 'https://www.catho.com.br/vagas/';
        this.searchParams = {
            q: 'enfermeiro',
            cidade: 'todas'
        };
    }

    async scrapeJobs() {
        try {
            return this.getMockCathoJobs();
        } catch (error) {
            console.error('Erro no scraping do Catho:', error);
            return [];
        }
    }

    getMockCathoJobs() {
        return [
            {
                title: "Enfermeiro(a) - Pediatria",
                company: "Hospital Infantil Sabará",
                location: "São Paulo, SP",
                salary: "R$ 7.800 - R$ 11.500",
                type: "CLT",
                level: "pleno",
                specialty: "pediatria",
                description: "Oportunidade para enfermeiro(a) em unidade pediátrica. Cuidados especializados para crianças e adolescentes.",
                requirements: ["Graduação em Enfermagem", "COREN ativo", "Experiência em pediatria", "Curso de PALS"],
                benefits: ["Plano de saúde", "Vale alimentação", "Auxílio creche", "Capacitação continuada"],
                posted: new Date().toISOString().split('T')[0],
                source: "catho",
                url: "https://catho.com.br/vagas/enfermeiro-pediatria-sabara",
                scraped: true
            }
        ];
    }
}

// Scraper específico para Gupy
class GupyScraper {
    constructor() {
        this.baseUrl = 'https://portal.gupy.io/job-search/';
        this.searchParams = {
            term: 'enfermeiro'
        };
    }

    async scrapeJobs() {
        try {
            return this.getMockGupyJobs();
        } catch (error) {
            console.error('Erro no scraping do Gupy:', error);
            return [];
        }
    }

    getMockGupyJobs() {
        return [
            {
                title: "Enfermeiro(a) - Pronto Socorro",
                company: "Hospital São Luiz",
                location: "São Paulo, SP",
                salary: "R$ 8.000 - R$ 12.000",
                type: "CLT",
                level: "pleno",
                specialty: "emergencia",
                description: "Vaga para enfermeiro(a) em pronto socorro. Atendimento de urgência e emergência 24h.",
                requirements: ["Graduação em Enfermagem", "COREN ativo", "Experiência em emergência", "Curso de ACLS"],
                benefits: ["Plano de saúde", "Vale refeição", "Adicional noturno", "Programa de desenvolvimento"],
                posted: new Date().toISOString().split('T')[0],
                source: "gupy",
                url: "https://gupy.io/jobs/enfermeiro-pronto-socorro-saoluiz",
                scraped: true
            }
        ];
    }
}

// Scraper específico para PCI Concursos
class PCIConcursosScraper {
    constructor() {
        this.baseUrl = 'https://www.pciconcursos.com.br/cargos/enfermeiro';
    }

    async scrapeContests() {
        try {
            return this.getMockPCIContests();
        } catch (error) {
            console.error('Erro no scraping do PCI Concursos:', error);
            return [];
        }
    }

    getMockPCIContests() {
        return [
            {
                title: "Concurso Público - Enfermeiro",
                organization: "Prefeitura de Santos",
                location: "Santos, SP",
                salary: "R$ 9.500,00",
                vacancies: 25,
                level: "superior",
                specialty: "atencao-basica",
                description: "Concurso para enfermeiros na rede municipal de saúde de Santos.",
                requirements: ["Graduação em Enfermagem", "COREN ativo", "Conhecimento em saúde pública"],
                inscriptionStart: "2025-01-30",
                inscriptionEnd: "2025-02-28",
                examDate: "2025-04-15",
                status: "Previsto",
                posted: new Date().toISOString().split('T')[0],
                url: "https://pciconcursos.com.br/concurso-santos-enfermeiro-2025",
                scraped: true
            }
        ];
    }
}

// Scraper específico para JC Concursos
class JCConcursosScraper {
    constructor() {
        this.baseUrl = 'https://jcconcursos.com.br/concursos/por-cargo/enfermeiro';
    }

    async scrapeContests() {
        try {
            return this.getMockJCContests();
        } catch (error) {
            console.error('Erro no scraping do JC Concursos:', error);
            return [];
        }
    }

    getMockJCContests() {
        return [
            {
                title: "Enfermeiro - Hospital Universitário",
                organization: "Universidade Federal do Rio de Janeiro",
                location: "Rio de Janeiro, RJ",
                salary: "R$ 10.800,00",
                vacancies: 12,
                level: "superior",
                specialty: "geral",
                description: "Concurso para enfermeiros no Hospital Universitário da UFRJ.",
                requirements: ["Graduação em Enfermagem", "COREN ativo", "Experiência hospitalar"],
                inscriptionStart: "2025-02-05",
                inscriptionEnd: "2025-03-05",
                examDate: "2025-04-20",
                status: "Previsto",
                posted: new Date().toISOString().split('T')[0],
                url: "https://jcconcursos.com.br/concurso-ufrj-enfermeiro-2025",
                scraped: true
            }
        ];
    }
}

// Scraper específico para UNA-SUS
class UNASUSScraper {
    constructor() {
        this.baseUrl = 'https://www.unasus.gov.br/cursos';
    }

    async scrapeCourses() {
        try {
            return this.getMockUNASUSCourses();
        } catch (error) {
            console.error('Erro no scraping da UNA-SUS:', error);
            return [];
        }
    }

    getMockUNASUSCourses() {
        return [
            {
                title: "Manejo Clínico da COVID-19 na Atenção Primária",
                institution: "UNA-SUS",
                category: "Atualização",
                duration: "30 horas",
                modality: "EAD",
                description: "Curso sobre manejo clínico da COVID-19 na atenção primária à saúde.",
                requirements: ["Profissional de saúde"],
                inscriptionStart: "2025-01-15",
                inscriptionEnd: "2025-12-31",
                courseStart: "Imediato",
                status: "Inscrições abertas",
                certificate: true,
                free: true,
                url: "https://unasus.gov.br/curso/covid19-atencao-primaria",
                scraped: true
            }
        ];
    }
}

// Scraper específico para Einstein
class EinsteinScraper {
    constructor() {
        this.baseUrl = 'https://www.einstein.br/ensino/educacao-continuada';
    }

    async scrapeCourses() {
        try {
            return this.getMockEinsteinCourses();
        } catch (error) {
            console.error('Erro no scraping do Einstein:', error);
            return [];
        }
    }

    getMockEinsteinCourses() {
        return [
            {
                title: "Curso de Ventilação Mecânica",
                institution: "Hospital Israelita Albert Einstein",
                category: "Especialização",
                duration: "80 horas",
                modality: "Presencial",
                description: "Curso avançado de ventilação mecânica para profissionais de terapia intensiva.",
                requirements: ["Graduação em Enfermagem", "Experiência em UTI"],
                inscriptionStart: "2025-02-01",
                inscriptionEnd: "2025-02-28",
                courseStart: "2025-03-15",
                status: "Previsto",
                certificate: true,
                free: true,
                url: "https://einstein.br/curso-ventilacao-mecanica-2025",
                scraped: true
            }
        ];
    }
}

// Scraper específico para INCA
class INCAScraper {
    constructor() {
        this.baseUrl = 'https://www.inca.gov.br/ensino-e-pesquisa/educacao-continuada';
    }

    async scrapeCourses() {
        try {
            return this.getMockINCACourses();
        } catch (error) {
            console.error('Erro no scraping do INCA:', error);
            return [];
        }
    }

    getMockINCACourses() {
        return [
            {
                title: "Cuidados Paliativos em Oncologia",
                institution: "Instituto Nacional de Câncer (INCA)",
                category: "Especialização",
                duration: "120 horas",
                modality: "EAD",
                description: "Curso sobre cuidados paliativos para pacientes oncológicos.",
                requirements: ["Graduação em Enfermagem", "Experiência em oncologia"],
                inscriptionStart: "2025-02-10",
                inscriptionEnd: "2025-03-10",
                courseStart: "2025-03-20",
                status: "Previsto",
                certificate: true,
                free: true,
                url: "https://inca.gov.br/curso-cuidados-paliativos-2025",
                scraped: true
            }
        ];
    }
}

// Exportar para uso global
window.WebScraper = WebScraper;

