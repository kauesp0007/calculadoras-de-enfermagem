// Sistema de Renderização de Templates para 200 Modelos de Currículos

// Categorias de templates
const TEMPLATE_CATEGORIES = {
    'tradicional': 'Tradicional',
    'moderno': 'Moderno',
    'criativo': 'Criativo',
    'minimalista': 'Minimalista',
    'executivo': 'Executivo',
    'academico': 'Acadêmico',
    'tecnico': 'Técnico',
    'internacional': 'Internacional'
};

// Cores para diferentes templates
const TEMPLATE_COLORS = {
    'azul_profissional': { primary: '#1A3E74', secondary: '#004d99', accent: '#20B2AA' },
    'verde_saude': { primary: '#006400', secondary: '#228B22', accent: '#32CD32' },
    'roxo_elegante': { primary: '#4B0082', secondary: '#6A0DAD', accent: '#9370DB' },
    'cinza_moderno': { primary: '#2F4F4F', secondary: '#708090', accent: '#B0C4DE' },
    'marrom_classico': { primary: '#8B4513', secondary: '#A0522D', accent: '#DEB887' },
    'azul_marinho': { primary: '#000080', secondary: '#191970', accent: '#4169E1' },
    'verde_escuro': { primary: '#013220', secondary: '#355E3B', accent: '#50C878' },
    'bordô_sofisticado': { primary: '#800020', secondary: '#A0002A', accent: '#DC143C' }
};

// Layouts base para templates
const TEMPLATE_LAYOUTS = {
    'single_column': {
        name: 'Coluna Única',
        structure: 'header + sections'
    },
    'two_column': {
        name: 'Duas Colunas',
        structure: 'sidebar + main'
    },
    'three_section': {
        name: 'Três Seções',
        structure: 'header + two_columns + footer'
    },
    'timeline': {
        name: 'Timeline',
        structure: 'chronological_layout'
    },
    'grid': {
        name: 'Grid',
        structure: 'grid_sections'
    }
};

// Gerar 200 templates programaticamente
function generateTemplateDatabase() {
    const templates = [];
    let templateId = 1;
    
    // Para cada categoria
    Object.keys(TEMPLATE_CATEGORIES).forEach(categoryKey => {
        const category = TEMPLATE_CATEGORIES[categoryKey];
        
        // Para cada esquema de cores
        Object.keys(TEMPLATE_COLORS).forEach(colorKey => {
            const colors = TEMPLATE_COLORS[colorKey];
            
            // Para cada layout
            Object.keys(TEMPLATE_LAYOUTS).forEach(layoutKey => {
                const layout = TEMPLATE_LAYOUTS[layoutKey];
                
                // Criar variações
                for (let variation = 1; variation <= 3; variation++) {
                    if (templateId <= 200) {
                        templates.push({
                            id: `template_${templateId.toString().padStart(3, '0')}`,
                            name: `${category} ${colors.primary.replace('#', '')} v${variation}`,
                            category: categoryKey,
                            colors: colors,
                            layout: layoutKey,
                            variation: variation,
                            description: generateTemplateDescription(category, colorKey, layout.name),
                            thumbnail: generateThumbnailPath(templateId),
                            isPremium: templateId > 50, // Primeiros 50 são gratuitos
                            tags: generateTemplateTags(categoryKey, colorKey, layoutKey),
                            popularity: Math.floor(Math.random() * 100) + 1
                        });
                        templateId++;
                    }
                });
            });
        });
    });
    
    return templates.slice(0, 200); // Garantir exatamente 200 templates
}

// Gerar descrição do template
function generateTemplateDescription(category, colorKey, layoutName) {
    const descriptions = {
        'tradicional': 'Design clássico e conservador, ideal para ambientes corporativos tradicionais.',
        'moderno': 'Visual contemporâneo com elementos gráficos atuais e tipografia moderna.',
        'criativo': 'Layout inovador com elementos visuais únicos para destacar sua criatividade.',
        'minimalista': 'Design limpo e objetivo, focando no conteúdo essencial.',
        'executivo': 'Elegante e sofisticado, perfeito para posições de liderança.',
        'academico': 'Formato acadêmico ideal para pesquisadores e professores.',
        'tecnico': 'Estrutura técnica clara para profissionais especializados.',
        'internacional': 'Padrão internacional adequado para oportunidades globais.'
    };
    
    return descriptions[category] || 'Template profissional para enfermagem.';
}

// Gerar caminho da thumbnail
function generateThumbnailPath(templateId) {
    return `assets/templates/thumbnails/template_${templateId.toString().padStart(3, '0')}.png`;
}

// Gerar tags do template
function generateTemplateTags(category, colorKey, layoutKey) {
    const baseTags = ['enfermagem', 'saude', 'profissional'];
    const categoryTags = {
        'tradicional': ['conservador', 'classico', 'formal'],
        'moderno': ['contemporaneo', 'atual', 'inovador'],
        'criativo': ['artistico', 'unico', 'diferenciado'],
        'minimalista': ['limpo', 'simples', 'objetivo'],
        'executivo': ['elegante', 'lideranca', 'sofisticado'],
        'academico': ['pesquisa', 'educacao', 'cientifico'],
        'tecnico': ['especializado', 'detalhado', 'preciso'],
        'internacional': ['global', 'mundial', 'universal']
    };
    
    return [...baseTags, ...categoryTags[category] || []];
}

// Carregar templates na interface
function loadTemplatesIntoInterface() {
    const templates = generateTemplateDatabase();
    state.templates = templates;
    
    // Atualizar interface se estiver na view de templates
    if (state.currentView === 'templates') {
        updateTemplateGrid();
    }
}

// Gerar grid de templates
function generateTemplateGrid(filter = 'all') {
    if (!state.templates || state.templates.length === 0) {
        return '<p class="text-center text-gray-500 col-span-full py-12">Carregando templates...</p>';
    }
    
    let filteredTemplates = state.templates;
    
    // Aplicar filtro
    if (filter !== 'all') {
        filteredTemplates = state.templates.filter(template => template.category === filter);
    }
    
    // Ordenar por popularidade
    filteredTemplates.sort((a, b) => b.popularity - a.popularity);
    
    return filteredTemplates.map(template => `
        <div class="template-card" onclick="selectTemplate('${template.id}')">
            <div class="template-preview" style="background: linear-gradient(135deg, ${template.colors.primary} 0%, ${template.colors.secondary} 100%);">
                <div class="text-center">
                    <h4 class="text-lg font-heading font-bold mb-2">${template.name}</h4>
                    <p class="text-sm opacity-90">${TEMPLATE_CATEGORIES[template.category]}</p>
                    ${template.isPremium ? '<span class="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">Premium</span>' : ''}
                </div>
            </div>
            <div class="p-4">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-gray-900">${template.name}</span>
                    <div class="flex items-center text-yellow-500">
                        <i data-lucide="star" class="h-4 w-4 mr-1"></i>
                        <span class="text-xs">${(template.popularity / 20).toFixed(1)}</span>
                    </div>
                </div>
                <p class="text-sm text-gray-600 mb-3">${template.description}</p>
                <div class="flex flex-wrap gap-1 mb-3">
                    ${template.tags.slice(0, 3).map(tag => `
                        <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">${tag}</span>
                    `).join('')}
                </div>
                <button class="btn btn-primary w-full text-sm" onclick="selectTemplate('${template.id}')">
                    <i data-lucide="check" class="mr-2 h-4 w-4"></i>
                    ${template.isPremium ? 'Usar Premium' : 'Usar Template'}
                </button>
            </div>
        </div>
    `).join('');
}

// Selecionar template
function selectTemplate(templateId) {
    const template = state.templates.find(t => t.id === templateId);
    
    if (!template) {
        showAlert('Template não encontrado.', 'error');
        return;
    }
    
    if (template.isPremium && !state.currentUser?.isPremium) {
        showPremiumModal(template);
        return;
    }
    
    state.selectedTemplate = template;
    showAlert(`Template "${template.name}" selecionado!`, 'success');
    
    // Atualizar preview se estiver na view de preview
    if (state.currentView === 'preview') {
        updatePreview();
    }
}

// Mostrar modal premium
function showPremiumModal(template) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
            <div class="text-center mb-6">
                <div class="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="crown" class="h-8 w-8 text-white"></i>
                </div>
                <h2 class="text-2xl font-heading font-bold text-gray-900 mb-2">Template Premium</h2>
                <p class="text-gray-600">Este template requer uma conta Premium para ser usado.</p>
            </div>
            
            <div class="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 class="font-medium text-gray-900 mb-2">${template.name}</h3>
                <p class="text-sm text-gray-600">${template.description}</p>
            </div>
            
            <div class="space-y-3 mb-6">
                <div class="flex items-center text-sm text-gray-600">
                    <i data-lucide="check" class="h-4 w-4 text-green-500 mr-2"></i>
                    Acesso a todos os 200+ templates
                </div>
                <div class="flex items-center text-sm text-gray-600">
                    <i data-lucide="check" class="h-4 w-4 text-green-500 mr-2"></i>
                    Exportação em alta qualidade
                </div>
                <div class="flex items-center text-sm text-gray-600">
                    <i data-lucide="check" class="h-4 w-4 text-green-500 mr-2"></i>
                    Suporte prioritário
                </div>
            </div>
            
            <div class="flex space-x-3">
                <button class="btn btn-secondary flex-1" onclick="this.closest('.fixed').remove()">
                    Cancelar
                </button>
                <button class="btn btn-primary flex-1" onclick="upgradeToPremium()">
                    <i data-lucide="crown" class="mr-2 h-4 w-4"></i>
                    Upgrade
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    lucide.createIcons();
}

// Upgrade para premium (placeholder)
function upgradeToPremium() {
    showAlert('Funcionalidade de upgrade será implementada em breve!', 'info');
    document.querySelector('.fixed.inset-0').remove();
}

// Filtrar templates
function filterTemplates(category) {
    const grid = document.querySelector('.grid');
    if (grid) {
        grid.innerHTML = generateTemplateGrid(category);
        lucide.createIcons();
    }
    
    // Atualizar botões de filtro
    document.querySelectorAll('.btn-outline').forEach(btn => {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-outline');
    });
    
    event.target.classList.remove('btn-outline');
    event.target.classList.add('btn-primary');
}

// Atualizar grid de templates
function updateTemplateGrid() {
    const content = document.getElementById('editor-content');
    if (content && state.currentView === 'templates') {
        content.innerHTML = renderTemplateSelector();
        lucide.createIcons();
    }
}

// Renderizar template específico
function renderTemplate(templateId, resumeData) {
    const template = state.templates.find(t => t.id === templateId);
    
    if (!template) {
        return '<p class="text-center text-gray-500 py-12">Template não encontrado</p>';
    }
    
    // Aplicar layout baseado no tipo
    switch (template.layout) {
        case 'single_column':
            return renderSingleColumnTemplate(template, resumeData);
        case 'two_column':
            return renderTwoColumnTemplate(template, resumeData);
        case 'three_section':
            return renderThreeSectionTemplate(template, resumeData);
        case 'timeline':
            return renderTimelineTemplate(template, resumeData);
        case 'grid':
            return renderGridTemplate(template, resumeData);
        default:
            return renderSingleColumnTemplate(template, resumeData);
    }
}

// Renderizar template de coluna única
function renderSingleColumnTemplate(template, resumeData) {
    return `
        <div class="resume-template single-column" style="--primary-color: ${template.colors.primary}; --secondary-color: ${template.colors.secondary}; --accent-color: ${template.colors.accent};">
            <!-- Header -->
            <div class="header text-center p-8" style="background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); color: white;">
                <h1 class="text-4xl font-heading font-bold mb-2">${resumeData.personalInfo.fullName || 'Seu Nome'}</h1>
                <p class="text-xl mb-4">${resumeData.personalInfo.profession || 'Sua Profissão'}</p>
                <div class="flex flex-wrap justify-center gap-4 text-sm">
                    ${resumeData.personalInfo.email ? `<span><i data-lucide="mail" class="inline h-4 w-4 mr-1"></i>${resumeData.personalInfo.email}</span>` : ''}
                    ${resumeData.personalInfo.phone ? `<span><i data-lucide="phone" class="inline h-4 w-4 mr-1"></i>${resumeData.personalInfo.phone}</span>` : ''}
                    ${resumeData.personalInfo.address ? `<span><i data-lucide="map-pin" class="inline h-4 w-4 mr-1"></i>${resumeData.personalInfo.address}</span>` : ''}
                </div>
            </div>
            
            <!-- Content -->
            <div class="content p-8 space-y-8">
                ${resumeData.summary ? `
                    <section>
                        <h2 class="text-2xl font-heading font-bold mb-4" style="color: ${template.colors.primary};">RESUMO PROFISSIONAL</h2>
                        <p class="text-gray-700 leading-relaxed">${resumeData.summary}</p>
                    </section>
                ` : ''}
                
                ${renderExperienceSection(resumeData.experience, template)}
                ${renderEducationSection(resumeData.education, template)}
                ${renderSkillsSection(resumeData.skills, template)}
                ${renderCertificationsSection(resumeData.certifications, template)}
                ${renderLanguagesSection(resumeData.languages, template)}
            </div>
        </div>
    `;
}

// Renderizar template de duas colunas
function renderTwoColumnTemplate(template, resumeData) {
    return `
        <div class="resume-template two-column flex" style="--primary-color: ${template.colors.primary}; --secondary-color: ${template.colors.secondary}; --accent-color: ${template.colors.accent};">
            <!-- Sidebar -->
            <div class="sidebar w-1/3 p-6" style="background-color: ${template.colors.primary}; color: white;">
                <div class="text-center mb-8">
                    <h1 class="text-2xl font-heading font-bold mb-2">${resumeData.personalInfo.fullName || 'Seu Nome'}</h1>
                    <p class="text-lg">${resumeData.personalInfo.profession || 'Sua Profissão'}</p>
                </div>
                
                <!-- Contact -->
                <div class="mb-8">
                    <h3 class="text-lg font-heading font-bold mb-4">CONTATO</h3>
                    <div class="space-y-2 text-sm">
                        ${resumeData.personalInfo.email ? `<p><i data-lucide="mail" class="inline h-4 w-4 mr-2"></i>${resumeData.personalInfo.email}</p>` : ''}
                        ${resumeData.personalInfo.phone ? `<p><i data-lucide="phone" class="inline h-4 w-4 mr-2"></i>${resumeData.personalInfo.phone}</p>` : ''}
                        ${resumeData.personalInfo.address ? `<p><i data-lucide="map-pin" class="inline h-4 w-4 mr-2"></i>${resumeData.personalInfo.address}</p>` : ''}
                    </div>
                </div>
                
                ${renderSkillsSidebar(resumeData.skills)}
                ${renderLanguagesSidebar(resumeData.languages)}
            </div>
            
            <!-- Main Content -->
            <div class="main-content w-2/3 p-8 space-y-8">
                ${resumeData.summary ? `
                    <section>
                        <h2 class="text-2xl font-heading font-bold mb-4" style="color: ${template.colors.primary};">RESUMO PROFISSIONAL</h2>
                        <p class="text-gray-700 leading-relaxed">${resumeData.summary}</p>
                    </section>
                ` : ''}
                
                ${renderExperienceSection(resumeData.experience, template)}
                ${renderEducationSection(resumeData.education, template)}
                ${renderCertificationsSection(resumeData.certifications, template)}
            </div>
        </div>
    `;
}

// Funções auxiliares para renderizar seções
function renderExperienceSection(experience, template) {
    if (!experience || experience.length === 0) return '';
    
    return `
        <section>
            <h2 class="text-2xl font-heading font-bold mb-4" style="color: ${template.colors.primary};">EXPERIÊNCIA PROFISSIONAL</h2>
            <div class="space-y-4">
                ${experience.map(exp => `
                    <div class="border-l-4 pl-4" style="border-color: ${template.colors.accent};">
                        <h3 class="text-lg font-semibold text-gray-900">${exp.position || 'Cargo'}</h3>
                        <p class="text-gray-600 font-medium">${exp.company || 'Empresa'}</p>
                        <p class="text-sm text-gray-500 mb-2">${exp.startDate || 'Data início'} - ${exp.endDate || 'Data fim'}</p>
                        ${exp.description ? `<p class="text-gray-700">${exp.description}</p>` : ''}
                    </div>
                `).join('')}
            </div>
        </section>
    `;
}

function renderEducationSection(education, template) {
    if (!education || education.length === 0) return '';
    
    return `
        <section>
            <h2 class="text-2xl font-heading font-bold mb-4" style="color: ${template.colors.primary};">FORMAÇÃO ACADÊMICA</h2>
            <div class="space-y-3">
                ${education.map(edu => `
                    <div class="border-l-4 pl-4" style="border-color: ${template.colors.accent};">
                        <h3 class="text-lg font-semibold text-gray-900">${edu.degree || 'Curso'}</h3>
                        <p class="text-gray-600">${edu.institution || 'Instituição'}</p>
                        <p class="text-sm text-gray-500">${edu.startDate || 'Data início'} - ${edu.endDate || 'Data fim'}</p>
                    </div>
                `).join('')}
            </div>
        </section>
    `;
}

function renderSkillsSection(skills, template) {
    if (!skills || skills.length === 0) return '';
    
    return `
        <section>
            <h2 class="text-2xl font-heading font-bold mb-4" style="color: ${template.colors.primary};">HABILIDADES</h2>
            <div class="grid grid-cols-2 gap-4">
                ${skills.map(skill => `
                    <div class="flex justify-between items-center">
                        <span class="text-gray-700">${skill.name || 'Habilidade'}</span>
                        <span class="text-sm font-medium" style="color: ${template.colors.primary};">${skill.level || 'Nível'}</span>
                    </div>
                `).join('')}
            </div>
        </section>
    `;
}

function renderCertificationsSection(certifications, template) {
    if (!certifications || certifications.length === 0) return '';
    
    return `
        <section>
            <h2 class="text-2xl font-heading font-bold mb-4" style="color: ${template.colors.primary};">CERTIFICAÇÕES</h2>
            <div class="space-y-3">
                ${certifications.map(cert => `
                    <div class="border-l-4 pl-4" style="border-color: ${template.colors.accent};">
                        <h3 class="text-lg font-semibold text-gray-900">${cert.name || 'Certificação'}</h3>
                        <p class="text-gray-600">${cert.issuer || 'Emissor'}</p>
                        <p class="text-sm text-gray-500">${cert.date || 'Data'}</p>
                    </div>
                `).join('')}
            </div>
        </section>
    `;
}

function renderLanguagesSection(languages, template) {
    if (!languages || languages.length === 0) return '';
    
    return `
        <section>
            <h2 class="text-2xl font-heading font-bold mb-4" style="color: ${template.colors.primary};">IDIOMAS</h2>
            <div class="grid grid-cols-2 gap-4">
                ${languages.map(lang => `
                    <div class="flex justify-between items-center">
                        <span class="text-gray-700">${lang.language || 'Idioma'}</span>
                        <span class="text-sm font-medium" style="color: ${template.colors.primary};">${lang.proficiency || 'Nível'}</span>
                    </div>
                `).join('')}
            </div>
        </section>
    `;
}

function renderSkillsSidebar(skills) {
    if (!skills || skills.length === 0) return '';
    
    return `
        <div class="mb-8">
            <h3 class="text-lg font-heading font-bold mb-4">HABILIDADES</h3>
            <div class="space-y-2">
                ${skills.map(skill => `
                    <div>
                        <div class="flex justify-between text-sm mb-1">
                            <span>${skill.name || 'Habilidade'}</span>
                            <span>${skill.level || 'Nível'}</span>
                        </div>
                        <div class="w-full bg-white bg-opacity-30 rounded-full h-2">
                            <div class="bg-white h-2 rounded-full" style="width: ${getSkillPercentage(skill.level)}%"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderLanguagesSidebar(languages) {
    if (!languages || languages.length === 0) return '';
    
    return `
        <div class="mb-8">
            <h3 class="text-lg font-heading font-bold mb-4">IDIOMAS</h3>
            <div class="space-y-2 text-sm">
                ${languages.map(lang => `
                    <div class="flex justify-between">
                        <span>${lang.language || 'Idioma'}</span>
                        <span>${lang.proficiency || 'Nível'}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function getSkillPercentage(level) {
    const levels = {
        'Básico': 30,
        'Intermediário': 60,
        'Avançado': 90
    };
    return levels[level] || 50;
}

// Gerar preview do currículo
function generateResumePreview() {
    if (state.selectedTemplate) {
        return renderTemplate(state.selectedTemplate.id, state.resumeData);
    }
    
    // Template padrão se nenhum selecionado
    const defaultTemplate = {
        id: 'default',
        colors: { primary: '#1A3E74', secondary: '#004d99', accent: '#20B2AA' },
        layout: 'single_column'
    };
    
    return renderSingleColumnTemplate(defaultTemplate, state.resumeData);
}

// Atualizar preview
function updatePreview() {
    const content = document.getElementById('editor-content');
    if (content && state.currentView === 'preview') {
        content.innerHTML = renderPreview();
        lucide.createIcons();
    }
}

// Inicializar templates ao carregar
document.addEventListener('DOMContentLoaded', function() {
    loadTemplatesIntoInterface();
});

// Exportar funções globais
window.generateTemplateGrid = generateTemplateGrid;
window.selectTemplate = selectTemplate;
window.filterTemplates = filterTemplates;
window.generateResumePreview = generateResumePreview;
window.upgradeToPremium = upgradeToPremium;

