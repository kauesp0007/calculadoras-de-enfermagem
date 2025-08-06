// Editor de Currículos e Funcionalidades de Importação

// Carregar editor de currículos
function loadResumeEditor() {
    const content = document.getElementById('curriculos-content');
    
    content.innerHTML = `
        <div class="p-6">
            <div class="max-w-6xl mx-auto">
                <div class="mb-8">
                    <h2 class="text-3xl font-heading font-bold text-gray-900 mb-2">Editor de Currículo</h2>
                    <p class="text-gray-600">Crie seu currículo profissional com nossos modelos especializados</p>
                </div>
                
                <!-- Área de importação -->
                <div class="card mb-8">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-xl font-heading font-bold text-gray-900">Importar Currículo Existente</h3>
                        <button class="btn btn-outline" onclick="toggleImportArea()">
                            <i data-lucide="upload" class="mr-2 h-4 w-4"></i>
                            Importar
                        </button>
                    </div>
                    
                    <div id="import-area" class="hidden">
                        <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-blue transition-colors">
                            <input type="file" id="file-input" class="hidden" accept=".pdf,.doc,.docx" onchange="handleFileUpload(event)">
                            <div id="drop-zone" class="cursor-pointer" onclick="document.getElementById('file-input').click()">
                                <i data-lucide="upload-cloud" class="h-12 w-12 text-gray-400 mx-auto mb-4"></i>
                                <p class="text-lg font-medium text-gray-700 mb-2">Arraste seu currículo aqui ou clique para selecionar</p>
                                <p class="text-gray-500">Suporta arquivos PDF, DOC e DOCX</p>
                            </div>
                            
                            <div id="upload-progress" class="hidden mt-4">
                                <div class="w-full bg-gray-200 rounded-full h-2">
                                    <div id="progress-bar" class="bg-primary-blue h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                                </div>
                                <p class="text-sm text-gray-600 mt-2">Processando arquivo...</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Navegação do editor -->
                <div class="flex space-x-4 mb-8">
                    <button class="btn ${state.currentView === 'editor' ? 'btn-primary' : 'btn-secondary'}" onclick="setCurrentView('editor')">
                        <i data-lucide="edit" class="mr-2 h-4 w-4"></i>
                        Editor
                    </button>
                    <button class="btn ${state.currentView === 'templates' ? 'btn-primary' : 'btn-secondary'}" onclick="setCurrentView('templates')">
                        <i data-lucide="layout-template" class="mr-2 h-4 w-4"></i>
                        Modelos
                    </button>
                    <button class="btn ${state.currentView === 'preview' ? 'btn-primary' : 'btn-secondary'}" onclick="setCurrentView('preview')">
                        <i data-lucide="eye" class="mr-2 h-4 w-4"></i>
                        Pré-visualizar
                    </button>
                </div>
                
                <!-- Conteúdo do editor -->
                <div id="editor-content">
                    ${renderEditorView()}
                </div>
            </div>
        </div>
    `;
    
    // Configurar drag and drop
    setupDragAndDrop();
    
    // Inicializar ícones
    lucide.createIcons();
}

// Renderizar view do editor baseado no estado atual
function renderEditorView() {
    switch (state.currentView) {
        case 'editor':
            return renderFormEditor();
        case 'templates':
            return renderTemplateSelector();
        case 'preview':
            return renderPreview();
        default:
            return renderFormEditor();
    }
}

// Renderizar editor de formulário
function renderFormEditor() {
    return `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Coluna esquerda - Formulários -->
            <div class="space-y-6">
                <!-- Informações Pessoais -->
                <div class="card">
                    <h3 class="flex items-center mb-4 text-lg font-heading font-bold">
                        <i data-lucide="user" class="mr-2 h-5 w-5 text-primary-blue"></i>
                        Informações Pessoais
                    </h3>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
                            <input type="text" class="form-input" placeholder="Seu nome completo" 
                                   value="${state.resumeData.personalInfo.fullName}" 
                                   onchange="updatePersonalInfo('fullName', this.value)">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Profissão</label>
                            <input type="text" class="form-input" placeholder="Sua profissão" 
                                   value="${state.resumeData.personalInfo.profession}" 
                                   onchange="updatePersonalInfo('profession', this.value)">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                            <input type="email" class="form-input" placeholder="seu@email.com" 
                                   value="${state.resumeData.personalInfo.email}" 
                                   onchange="updatePersonalInfo('email', this.value)">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                            <input type="tel" class="form-input" placeholder="(00) 00000-0000" 
                                   value="${state.resumeData.personalInfo.phone}" 
                                   onchange="updatePersonalInfo('phone', this.value)">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                            <input type="text" class="form-input" placeholder="Cidade, Estado" 
                                   value="${state.resumeData.personalInfo.address}" 
                                   onchange="updatePersonalInfo('address', this.value)">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Registro Profissional</label>
                            <input type="text" class="form-input" placeholder="COREN, CRM, etc." 
                                   value="${state.resumeData.medicalInfo.license}" 
                                   onchange="updateMedicalInfo('license', this.value)">
                        </div>
                    </div>
                </div>
                
                <!-- Resumo Profissional -->
                <div class="card">
                    <h3 class="flex items-center mb-4 text-lg font-heading font-bold">
                        <i data-lucide="file-text" class="mr-2 h-5 w-5 text-primary-blue"></i>
                        Resumo Profissional
                    </h3>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Descreva sua experiência e objetivos</label>
                        <textarea class="form-input h-32" placeholder="Descreva sua experiência, especialidades e objetivos profissionais..." 
                                  onchange="updateSummary(this.value)">${state.resumeData.summary}</textarea>
                    </div>
                </div>

                <!-- Experiência Profissional -->
                <div class="card">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="flex items-center text-lg font-heading font-bold">
                            <i data-lucide="briefcase" class="mr-2 h-5 w-5 text-primary-blue"></i>
                            Experiência Profissional
                        </h3>
                        <button class="btn btn-primary text-sm" onclick="addExperience()">
                            <i data-lucide="plus" class="mr-1 h-4 w-4"></i>
                            Adicionar
                        </button>
                    </div>
                    <div id="experience-list" class="space-y-4">
                        ${renderExperienceList()}
                    </div>
                </div>
            </div>
            
            <!-- Coluna direita -->
            <div class="space-y-6">
                <!-- Formação Acadêmica -->
                <div class="card">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="flex items-center text-lg font-heading font-bold">
                            <i data-lucide="graduation-cap" class="mr-2 h-5 w-5 text-primary-blue"></i>
                            Formação Acadêmica
                        </h3>
                        <button class="btn btn-primary text-sm" onclick="addEducation()">
                            <i data-lucide="plus" class="mr-1 h-4 w-4"></i>
                            Adicionar
                        </button>
                    </div>
                    <div id="education-list" class="space-y-4">
                        ${renderEducationList()}
                    </div>
                </div>

                <!-- Habilidades -->
                <div class="card">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="flex items-center text-lg font-heading font-bold">
                            <i data-lucide="star" class="mr-2 h-5 w-5 text-primary-blue"></i>
                            Habilidades
                        </h3>
                        <button class="btn btn-primary text-sm" onclick="addSkill()">
                            <i data-lucide="plus" class="mr-1 h-4 w-4"></i>
                            Adicionar
                        </button>
                    </div>
                    <div id="skills-list" class="space-y-3">
                        ${renderSkillsList()}
                    </div>
                </div>

                <!-- Certificações -->
                <div class="card">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="flex items-center text-lg font-heading font-bold">
                            <i data-lucide="award" class="mr-2 h-5 w-5 text-primary-blue"></i>
                            Certificações
                        </h3>
                        <button class="btn btn-primary text-sm" onclick="addCertification()">
                            <i data-lucide="plus" class="mr-1 h-4 w-4"></i>
                            Adicionar
                        </button>
                    </div>
                    <div id="certifications-list" class="space-y-4">
                        ${renderCertificationsList()}
                    </div>
                </div>

                <!-- Idiomas -->
                <div class="card">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="flex items-center text-lg font-heading font-bold">
                            <i data-lucide="globe" class="mr-2 h-5 w-5 text-primary-blue"></i>
                            Idiomas
                        </h3>
                        <button class="btn btn-primary text-sm" onclick="addLanguage()">
                            <i data-lucide="plus" class="mr-1 h-4 w-4"></i>
                            Adicionar
                        </button>
                    </div>
                    <div id="languages-list" class="space-y-3">
                        ${renderLanguagesList()}
                    </div>
                </div>

                <!-- Ações rápidas -->
                <div class="card">
                    <h3 class="flex items-center mb-4 text-lg font-heading font-bold">
                        <i data-lucide="zap" class="mr-2 h-5 w-5 text-primary-blue"></i>
                        Ações Rápidas
                    </h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button class="btn btn-primary" onclick="setCurrentView('preview')">
                            <i data-lucide="eye" class="mr-2 h-4 w-4"></i>
                            Pré-visualizar
                        </button>
                        <button class="btn btn-secondary" onclick="downloadResume()">
                            <i data-lucide="download" class="mr-2 h-4 w-4"></i>
                            Baixar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Renderizar seletor de templates
function renderTemplateSelector() {
    return `
        <div class="text-center mb-8">
            <h3 class="text-2xl font-heading font-bold text-gray-900 mb-4">Escolha um Modelo</h3>
            <p class="text-gray-600">Selecione entre mais de 200 modelos profissionais</p>
        </div>
        
        <!-- Filtros -->
        <div class="flex flex-wrap gap-4 mb-8 justify-center">
            <button class="btn btn-outline" onclick="filterTemplates('all')">Todos</button>
            <button class="btn btn-outline" onclick="filterTemplates('tradicional')">Tradicional</button>
            <button class="btn btn-outline" onclick="filterTemplates('moderno')">Moderno</button>
            <button class="btn btn-outline" onclick="filterTemplates('criativo')">Criativo</button>
            <button class="btn btn-outline" onclick="filterTemplates('minimalista')">Minimalista</button>
        </div>
        
        <!-- Grid de templates -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            ${generateTemplateGrid()}
        </div>
    `;
}

// Renderizar pré-visualização
function renderPreview() {
    return `
        <div class="max-w-4xl mx-auto">
            <div class="mb-8 flex justify-between items-center">
                <div>
                    <h3 class="text-2xl font-heading font-bold text-gray-900 mb-2">Pré-visualização do Currículo</h3>
                    <p class="text-gray-600">Veja como seu currículo ficará antes de exportar</p>
                </div>
                <div class="flex space-x-3">
                    <button class="btn btn-secondary" onclick="setCurrentView('editor')">
                        <i data-lucide="edit" class="mr-2 h-4 w-4"></i>
                        Editar
                    </button>
                    <button class="btn btn-primary" onclick="downloadResume()">
                        <i data-lucide="download" class="mr-2 h-4 w-4"></i>
                        Baixar
                    </button>
                </div>
            </div>
            
            <!-- Preview do currículo -->
            <div class="bg-white shadow-lg rounded-lg p-8 border">
                ${generateResumePreview()}
            </div>
        </div>
    `;
}

// Configurar drag and drop
function setupDragAndDrop() {
    const dropZone = document.getElementById('drop-zone');
    
    if (dropZone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, unhighlight, false);
        });
        
        dropZone.addEventListener('drop', handleDrop, false);
    }
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight(e) {
    e.target.closest('#drop-zone').classList.add('border-primary-blue', 'bg-blue-50');
}

function unhighlight(e) {
    e.target.closest('#drop-zone').classList.remove('border-primary-blue', 'bg-blue-50');
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
        handleFileUpload({ target: { files: files } });
    }
}

// Manipular upload de arquivo
function handleFileUpload(event) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    // Validar tipo de arquivo
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!allowedTypes.includes(file.type)) {
        showAlert('Tipo de arquivo não suportado. Use PDF, DOC ou DOCX.', 'error');
        return;
    }
    
    // Validar tamanho (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
        showAlert('Arquivo muito grande. Máximo 10MB.', 'error');
        return;
    }
    
    // Mostrar progresso
    showUploadProgress();
    
    // Simular processamento
    simulateFileProcessing(file);
}

// Mostrar progresso de upload
function showUploadProgress() {
    const dropZone = document.getElementById('drop-zone');
    const progressArea = document.getElementById('upload-progress');
    const progressBar = document.getElementById('progress-bar');
    
    dropZone.classList.add('hidden');
    progressArea.classList.remove('hidden');
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 100) progress = 100;
        
        progressBar.style.width = progress + '%';
        
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(hideUploadProgress, 500);
        }
    }, 200);
}

// Esconder progresso de upload
function hideUploadProgress() {
    const dropZone = document.getElementById('drop-zone');
    const progressArea = document.getElementById('upload-progress');
    const progressBar = document.getElementById('progress-bar');
    
    progressArea.classList.add('hidden');
    dropZone.classList.remove('hidden');
    progressBar.style.width = '0%';
}

// Simular processamento de arquivo
function simulateFileProcessing(file) {
    setTimeout(() => {
        // Simular extração de dados
        const extractedData = {
            personalInfo: {
                fullName: 'Maria Silva Santos',
                profession: 'Enfermeira',
                email: 'maria.santos@email.com',
                phone: '(11) 99999-9999',
                address: 'São Paulo, SP'
            },
            medicalInfo: {
                license: 'COREN-SP 123456'
            },
            summary: 'Enfermeira com 5 anos de experiência em UTI e emergência, especializada em cuidados intensivos e procedimentos de alta complexidade.',
            experience: [
                {
                    id: Date.now(),
                    position: 'Enfermeira UTI',
                    company: 'Hospital São Lucas',
                    startDate: '2020-01',
                    endDate: 'Atual',
                    description: 'Responsável por cuidados intensivos, monitoramento de pacientes críticos e administração de medicamentos.'
                }
            ],
            education: [
                {
                    id: Date.now() + 1,
                    degree: 'Graduação em Enfermagem',
                    institution: 'Universidade de São Paulo',
                    startDate: '2016-01',
                    endDate: '2019-12'
                }
            ],
            skills: [
                { id: Date.now() + 2, name: 'Cuidados Intensivos', level: 'Avançado' },
                { id: Date.now() + 3, name: 'Administração de Medicamentos', level: 'Avançado' }
            ],
            certifications: [
                {
                    id: Date.now() + 4,
                    name: 'BLS - Suporte Básico de Vida',
                    issuer: 'American Heart Association',
                    date: '2023'
                }
            ],
            languages: [
                { id: Date.now() + 5, language: 'Português', proficiency: 'Nativo' },
                { id: Date.now() + 6, language: 'Inglês', proficiency: 'Intermediário' }
            ]
        };
        
        // Atualizar estado com dados extraídos
        state.resumeData = { ...state.resumeData, ...extractedData };
        
        // Recarregar editor
        loadResumeEditor();
        
        // Mostrar sucesso
        showAlert('Currículo importado com sucesso! Os dados foram pré-preenchidos.', 'success');
        
        // Esconder área de importação
        toggleImportArea();
        
    }, 2000);
}

// Toggle área de importação
function toggleImportArea() {
    const importArea = document.getElementById('import-area');
    if (importArea) {
        importArea.classList.toggle('hidden');
    }
}

// Funções de atualização de dados
function updatePersonalInfo(field, value) {
    state.resumeData.personalInfo[field] = value;
}

function updateMedicalInfo(field, value) {
    state.resumeData.medicalInfo[field] = value;
}

function updateSummary(value) {
    state.resumeData.summary = value;
}

// Funções para adicionar itens
function addExperience() {
    const newExperience = {
        id: Date.now(),
        position: '',
        company: '',
        startDate: '',
        endDate: '',
        description: ''
    };
    
    state.resumeData.experience.push(newExperience);
    refreshExperienceList();
}

function addEducation() {
    const newEducation = {
        id: Date.now(),
        degree: '',
        institution: '',
        startDate: '',
        endDate: ''
    };
    
    state.resumeData.education.push(newEducation);
    refreshEducationList();
}

function addSkill() {
    const newSkill = {
        id: Date.now(),
        name: '',
        level: 'Básico'
    };
    
    state.resumeData.skills.push(newSkill);
    refreshSkillsList();
}

function addCertification() {
    const newCertification = {
        id: Date.now(),
        name: '',
        issuer: '',
        date: ''
    };
    
    state.resumeData.certifications.push(newCertification);
    refreshCertificationsList();
}

function addLanguage() {
    const newLanguage = {
        id: Date.now(),
        language: '',
        proficiency: 'Básico'
    };
    
    state.resumeData.languages.push(newLanguage);
    refreshLanguagesList();
}

// Funções de renderização de listas
function renderExperienceList() {
    if (state.resumeData.experience.length === 0) {
        return '<p class="text-gray-500 text-center py-4">Nenhuma experiência adicionada. Clique em "Adicionar" para começar.</p>';
    }
    
    return state.resumeData.experience.map(exp => `
        <div class="border border-gray-200 rounded-lg p-4">
            <div class="flex justify-between items-start mb-3">
                <h4 class="font-medium text-gray-900">Experiência ${state.resumeData.experience.indexOf(exp) + 1}</h4>
                <button class="text-red-600 hover:text-red-800" onclick="removeExperience(${exp.id})">
                    <i data-lucide="trash-2" class="h-4 w-4"></i>
                </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input type="text" class="form-input" placeholder="Cargo" value="${exp.position}" 
                       onchange="updateExperience(${exp.id}, 'position', this.value)">
                <input type="text" class="form-input" placeholder="Empresa" value="${exp.company}" 
                       onchange="updateExperience(${exp.id}, 'company', this.value)">
                <input type="month" class="form-input" placeholder="Data início" value="${exp.startDate}" 
                       onchange="updateExperience(${exp.id}, 'startDate', this.value)">
                <input type="text" class="form-input" placeholder="Data fim (ou 'Atual')" value="${exp.endDate}" 
                       onchange="updateExperience(${exp.id}, 'endDate', this.value)">
            </div>
            <textarea class="form-input mt-3 h-20" placeholder="Descrição das atividades e responsabilidades" 
                      onchange="updateExperience(${exp.id}, 'description', this.value)">${exp.description}</textarea>
        </div>
    `).join('');
}

function renderEducationList() {
    if (state.resumeData.education.length === 0) {
        return '<p class="text-gray-500 text-center py-4">Nenhuma formação adicionada. Clique em "Adicionar" para começar.</p>';
    }
    
    return state.resumeData.education.map(edu => `
        <div class="border border-gray-200 rounded-lg p-4">
            <div class="flex justify-between items-start mb-3">
                <h4 class="font-medium text-gray-900">Formação ${state.resumeData.education.indexOf(edu) + 1}</h4>
                <button class="text-red-600 hover:text-red-800" onclick="removeEducation(${edu.id})">
                    <i data-lucide="trash-2" class="h-4 w-4"></i>
                </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input type="text" class="form-input" placeholder="Curso/Graduação" value="${edu.degree}" 
                       onchange="updateEducation(${edu.id}, 'degree', this.value)">
                <input type="text" class="form-input" placeholder="Instituição" value="${edu.institution}" 
                       onchange="updateEducation(${edu.id}, 'institution', this.value)">
                <input type="month" class="form-input" placeholder="Data início" value="${edu.startDate}" 
                       onchange="updateEducation(${edu.id}, 'startDate', this.value)">
                <input type="month" class="form-input" placeholder="Data fim" value="${edu.endDate}" 
                       onchange="updateEducation(${edu.id}, 'endDate', this.value)">
            </div>
        </div>
    `).join('');
}

function renderSkillsList() {
    if (state.resumeData.skills.length === 0) {
        return '<p class="text-gray-500 text-center py-4">Nenhuma habilidade adicionada. Clique em "Adicionar" para começar.</p>';
    }
    
    return state.resumeData.skills.map(skill => `
        <div class="flex items-center space-x-3">
            <input type="text" class="form-input flex-1" placeholder="Habilidade" value="${skill.name}" 
                   onchange="updateSkill(${skill.id}, 'name', this.value)">
            <select class="form-input w-32" onchange="updateSkill(${skill.id}, 'level', this.value)">
                <option value="Básico" ${skill.level === 'Básico' ? 'selected' : ''}>Básico</option>
                <option value="Intermediário" ${skill.level === 'Intermediário' ? 'selected' : ''}>Intermediário</option>
                <option value="Avançado" ${skill.level === 'Avançado' ? 'selected' : ''}>Avançado</option>
            </select>
            <button class="text-red-600 hover:text-red-800" onclick="removeSkill(${skill.id})">
                <i data-lucide="trash-2" class="h-4 w-4"></i>
            </button>
        </div>
    `).join('');
}

function renderCertificationsList() {
    if (state.resumeData.certifications.length === 0) {
        return '<p class="text-gray-500 text-center py-4">Nenhuma certificação adicionada. Clique em "Adicionar" para começar.</p>';
    }
    
    return state.resumeData.certifications.map(cert => `
        <div class="border border-gray-200 rounded-lg p-4">
            <div class="flex justify-between items-start mb-3">
                <h4 class="font-medium text-gray-900">Certificação ${state.resumeData.certifications.indexOf(cert) + 1}</h4>
                <button class="text-red-600 hover:text-red-800" onclick="removeCertification(${cert.id})">
                    <i data-lucide="trash-2" class="h-4 w-4"></i>
                </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input type="text" class="form-input" placeholder="Nome da certificação" value="${cert.name}" 
                       onchange="updateCertification(${cert.id}, 'name', this.value)">
                <input type="text" class="form-input" placeholder="Emissor" value="${cert.issuer}" 
                       onchange="updateCertification(${cert.id}, 'issuer', this.value)">
                <input type="text" class="form-input" placeholder="Ano" value="${cert.date}" 
                       onchange="updateCertification(${cert.id}, 'date', this.value)">
            </div>
        </div>
    `).join('');
}

function renderLanguagesList() {
    if (state.resumeData.languages.length === 0) {
        return '<p class="text-gray-500 text-center py-4">Nenhum idioma adicionado. Clique em "Adicionar" para começar.</p>';
    }
    
    return state.resumeData.languages.map(lang => `
        <div class="flex items-center space-x-3">
            <input type="text" class="form-input flex-1" placeholder="Idioma" value="${lang.language}" 
                   onchange="updateLanguage(${lang.id}, 'language', this.value)">
            <select class="form-input w-32" onchange="updateLanguage(${lang.id}, 'proficiency', this.value)">
                <option value="Básico" ${lang.proficiency === 'Básico' ? 'selected' : ''}>Básico</option>
                <option value="Intermediário" ${lang.proficiency === 'Intermediário' ? 'selected' : ''}>Intermediário</option>
                <option value="Avançado" ${lang.proficiency === 'Avançado' ? 'selected' : ''}>Avançado</option>
                <option value="Fluente" ${lang.proficiency === 'Fluente' ? 'selected' : ''}>Fluente</option>
                <option value="Nativo" ${lang.proficiency === 'Nativo' ? 'selected' : ''}>Nativo</option>
            </select>
            <button class="text-red-600 hover:text-red-800" onclick="removeLanguage(${lang.id})">
                <i data-lucide="trash-2" class="h-4 w-4"></i>
            </button>
        </div>
    `).join('');
}

// Funções de atualização de itens
function updateExperience(id, field, value) {
    const experience = state.resumeData.experience.find(exp => exp.id === id);
    if (experience) {
        experience[field] = value;
    }
}

function updateEducation(id, field, value) {
    const education = state.resumeData.education.find(edu => edu.id === id);
    if (education) {
        education[field] = value;
    }
}

function updateSkill(id, field, value) {
    const skill = state.resumeData.skills.find(skill => skill.id === id);
    if (skill) {
        skill[field] = value;
    }
}

function updateCertification(id, field, value) {
    const certification = state.resumeData.certifications.find(cert => cert.id === id);
    if (certification) {
        certification[field] = value;
    }
}

function updateLanguage(id, field, value) {
    const language = state.resumeData.languages.find(lang => lang.id === id);
    if (language) {
        language[field] = value;
    }
}

// Funções de remoção de itens
function removeExperience(id) {
    state.resumeData.experience = state.resumeData.experience.filter(exp => exp.id !== id);
    refreshExperienceList();
}

function removeEducation(id) {
    state.resumeData.education = state.resumeData.education.filter(edu => edu.id !== id);
    refreshEducationList();
}

function removeSkill(id) {
    state.resumeData.skills = state.resumeData.skills.filter(skill => skill.id !== id);
    refreshSkillsList();
}

function removeCertification(id) {
    state.resumeData.certifications = state.resumeData.certifications.filter(cert => cert.id !== id);
    refreshCertificationsList();
}

function removeLanguage(id) {
    state.resumeData.languages = state.resumeData.languages.filter(lang => lang.id !== id);
    refreshLanguagesList();
}

// Funções de refresh das listas
function refreshExperienceList() {
    const container = document.getElementById('experience-list');
    if (container) {
        container.innerHTML = renderExperienceList();
        lucide.createIcons();
    }
}

function refreshEducationList() {
    const container = document.getElementById('education-list');
    if (container) {
        container.innerHTML = renderEducationList();
        lucide.createIcons();
    }
}

function refreshSkillsList() {
    const container = document.getElementById('skills-list');
    if (container) {
        container.innerHTML = renderSkillsList();
        lucide.createIcons();
    }
}

function refreshCertificationsList() {
    const container = document.getElementById('certifications-list');
    if (container) {
        container.innerHTML = renderCertificationsList();
        lucide.createIcons();
    }
}

function refreshLanguagesList() {
    const container = document.getElementById('languages-list');
    if (container) {
        container.innerHTML = renderLanguagesList();
        lucide.createIcons();
    }
}

// Função para mudar view atual
function setCurrentView(view) {
    state.currentView = view;
    const content = document.getElementById('editor-content');
    if (content) {
        content.innerHTML = renderEditorView();
        lucide.createIcons();
    }
}

// Placeholder para outras funções
function generateTemplateGrid() {
    return '<p class="text-center text-gray-500 col-span-full py-12">200 modelos serão implementados na próxima fase</p>';
}

function generateResumePreview() {
    return '<p class="text-center text-gray-500 py-12">Pré-visualização será implementada na próxima fase</p>';
}

function downloadResume() {
    showAlert('Funcionalidade de download será implementada na próxima fase', 'info');
}

function filterTemplates(category) {
    showAlert(`Filtro "${category}" será implementado na próxima fase`, 'info');
}

// Exportar funções globais
window.loadResumeEditor = loadResumeEditor;
window.setCurrentView = setCurrentView;
window.toggleImportArea = toggleImportArea;
window.handleFileUpload = handleFileUpload;
window.updatePersonalInfo = updatePersonalInfo;
window.updateMedicalInfo = updateMedicalInfo;
window.updateSummary = updateSummary;
window.addExperience = addExperience;
window.addEducation = addEducation;
window.addSkill = addSkill;
window.addCertification = addCertification;
window.addLanguage = addLanguage;
window.updateExperience = updateExperience;
window.updateEducation = updateEducation;
window.updateSkill = updateSkill;
window.updateCertification = updateCertification;
window.updateLanguage = updateLanguage;
window.removeExperience = removeExperience;
window.removeEducation = removeEducation;
window.removeSkill = removeSkill;
window.removeCertification = removeCertification;
window.removeLanguage = removeLanguage;
window.downloadResume = downloadResume;
window.filterTemplates = filterTemplates;

