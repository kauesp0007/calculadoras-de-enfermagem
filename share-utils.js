// Utilitários de Compartilhamento para WhatsApp e E-mail

// Templates de mensagem para compartilhamento
const SHARE_TEMPLATES = {
    whatsapp: {
        default: `Prezados,

Meu nome é {nome}, estou enviando anexo meu currículo para a vaga {vaga}.

Agradeço a sua atenção,

{nome}
{telefone}
{email}`,
        
        spontaneous: `Olá!

Sou {nome}, {profissao}, e gostaria de me apresentar para futuras oportunidades em sua instituição.

Tenho experiência em {experiencia} e estou em busca de novos desafios profissionais.

Segue meu currículo em anexo.

Atenciosamente,
{nome}
{telefone}
{email}`,
        
        referral: `Olá!

Fui indicado(a) por {indicacao} para entrar em contato sobre oportunidades na área de enfermagem.

Meu nome é {nome} e tenho {anos_experiencia} de experiência na área.

Segue meu currículo para análise.

Obrigado(a),
{nome}
{telefone}
{email}`
    },
    
    email: {
        default: {
            subject: 'Candidatura para vaga de {vaga} - {nome}',
            body: `Prezados Senhores,

Venho por meio desta apresentar minha candidatura para a vaga de {vaga} divulgada por sua instituição.

Sou {nome}, {profissao}, com {anos_experiencia} de experiência na área de saúde, especializado(a) em {especialidade}.

Durante minha trajetória profissional, desenvolvi competências em:
• {habilidade1}
• {habilidade2}
• {habilidade3}

Acredito que meu perfil profissional está alinhado com os requisitos da vaga e que posso contribuir significativamente para os objetivos da equipe.

Segue em anexo meu currículo para análise mais detalhada.

Agradeço a atenção dispensada e fico à disposição para esclarecimentos adicionais.

Atenciosamente,

{nome}
{profissao}
{telefone}
{email}
{endereco}`
        },
        
        spontaneous: {
            subject: 'Apresentação profissional - {nome}',
            body: `Prezados,

Espero que esta mensagem os encontre bem.

Meu nome é {nome}, sou {profissao} com {anos_experiencia} de experiência na área de saúde.

Tenho acompanhado o trabalho de excelência desenvolvido por sua instituição e gostaria de me apresentar para futuras oportunidades que possam surgir em sua equipe.

Minha experiência inclui:
• {experiencia_principal}
• {certificacoes}
• {especializacoes}

Estou sempre em busca de novos desafios que me permitam aplicar meus conhecimentos e contribuir para a melhoria da assistência à saúde.

Anexo meu currículo para sua apreciação e fico à disposição para uma conversa quando for conveniente.

Cordialmente,

{nome}
{profissao}
{telefone}
{email}
{endereco}`
        },
        
        follow_up: {
            subject: 'Acompanhamento - Candidatura {nome}',
            body: `Prezados,

Espero que estejam bem.

Escrevo para fazer um acompanhamento da candidatura que enviei em {data} para a vaga de {vaga}.

Gostaria de reafirmar meu interesse na oportunidade e minha disponibilidade para participar do processo seletivo.

Caso necessitem de informações adicionais ou documentos complementares, estou à inteira disposição.

Agradeço novamente a atenção e aguardo retorno.

Atenciosamente,

{nome}
{profissao}
{telefone}
{email}`
        }
    }
};

// Mostrar opções de compartilhamento
function showShareOptions() {
    if (!requireAuth()) return;
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl max-w-lg w-full p-8">
            <div class="text-center mb-6">
                <div class="w-16 h-16 bg-primary-blue rounded-full flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="share-2" class="h-8 w-8 text-white"></i>
                </div>
                <h2 class="text-2xl font-heading font-bold text-gray-900 mb-2">Compartilhar Currículo</h2>
                <p class="text-gray-600">Escolha como deseja compartilhar seu currículo</p>
            </div>
            
            <div class="space-y-4 mb-6">
                <button class="w-full btn btn-primary" onclick="shareViaWhatsApp(); this.closest('.fixed').remove();">
                    <i data-lucide="message-circle" class="mr-2 h-5 w-5"></i>
                    Compartilhar via WhatsApp
                </button>
                
                <button class="w-full btn btn-secondary" onclick="shareViaEmail(); this.closest('.fixed').remove();">
                    <i data-lucide="mail" class="mr-2 h-5 w-5"></i>
                    Compartilhar via E-mail
                </button>
                
                <button class="w-full btn btn-outline" onclick="copyShareableLink(); this.closest('.fixed').remove();">
                    <i data-lucide="link" class="mr-2 h-5 w-5"></i>
                    Copiar Link do Currículo
                </button>
            </div>
            
            <button class="w-full btn btn-outline" onclick="this.closest('.fixed').remove()">
                Cancelar
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    lucide.createIcons();
}

// Compartilhar via WhatsApp
function shareViaWhatsApp() {
    showMessageCustomizationModal('whatsapp');
}

// Compartilhar via E-mail
function shareViaEmail() {
    showMessageCustomizationModal('email');
}

// Mostrar modal de customização de mensagem
function showMessageCustomizationModal(platform) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div class="text-center mb-6">
                <div class="w-16 h-16 bg-primary-blue rounded-full flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="${platform === 'whatsapp' ? 'message-circle' : 'mail'}" class="h-8 w-8 text-white"></i>
                </div>
                <h2 class="text-2xl font-heading font-bold text-gray-900 mb-2">
                    Personalizar Mensagem - ${platform === 'whatsapp' ? 'WhatsApp' : 'E-mail'}
                </h2>
                <p class="text-gray-600">Customize sua mensagem antes de compartilhar</p>
            </div>
            
            <!-- Tipo de mensagem -->
            <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de mensagem</label>
                <select id="message-type" class="form-input" onchange="updateMessageTemplate('${platform}')">
                    <option value="default">Candidatura para vaga específica</option>
                    <option value="spontaneous">Apresentação espontânea</option>
                    ${platform === 'email' ? '<option value="follow_up">Acompanhamento de candidatura</option>' : ''}
                    ${platform === 'whatsapp' ? '<option value="referral">Indicação de terceiros</option>' : ''}
                </select>
            </div>
            
            <!-- Campos de personalização -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nome da vaga</label>
                    <input type="text" id="job-title" class="form-input" placeholder="Ex: Enfermeiro UTI" value="">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Anos de experiência</label>
                    <input type="text" id="years-experience" class="form-input" placeholder="Ex: 5 anos" value="">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Especialidade principal</label>
                    <input type="text" id="specialty" class="form-input" placeholder="Ex: Cuidados Intensivos" value="">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nome da indicação (se aplicável)</label>
                    <input type="text" id="referral-name" class="form-input" placeholder="Ex: Dr. João Silva" value="">
                </div>
            </div>
            
            <!-- Preview da mensagem -->
            <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-2">Preview da mensagem</label>
                ${platform === 'email' ? `
                    <div class="mb-3">
                        <label class="block text-xs font-medium text-gray-600 mb-1">Assunto</label>
                        <input type="text" id="email-subject" class="form-input text-sm" readonly>
                    </div>
                ` : ''}
                <textarea id="message-preview" class="form-input h-64 text-sm font-mono" readonly></textarea>
            </div>
            
            <div class="flex space-x-3">
                <button class="btn btn-secondary flex-1" onclick="this.closest('.fixed').remove()">
                    Cancelar
                </button>
                <button class="btn btn-primary flex-1" onclick="sendCustomizedMessage('${platform}')">
                    <i data-lucide="${platform === 'whatsapp' ? 'message-circle' : 'mail'}" class="mr-2 h-4 w-4"></i>
                    Enviar
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    lucide.createIcons();
    
    // Inicializar com template padrão
    updateMessageTemplate(platform);
}

// Atualizar template de mensagem
function updateMessageTemplate(platform) {
    const messageType = document.getElementById('message-type').value;
    const template = SHARE_TEMPLATES[platform][messageType];
    
    // Preencher campos com dados do usuário
    const personalizedMessage = personalizeMessage(template, platform);
    
    if (platform === 'email') {
        document.getElementById('email-subject').value = personalizedMessage.subject;
        document.getElementById('message-preview').value = personalizedMessage.body;
    } else {
        document.getElementById('message-preview').value = personalizedMessage;
    }
}

// Personalizar mensagem com dados do usuário
function personalizeMessage(template, platform) {
    const resumeData = state.resumeData;
    const user = state.currentUser;
    
    // Dados para substituição
    const replacements = {
        '{nome}': resumeData.personalInfo.fullName || user.name || 'Seu Nome',
        '{profissao}': resumeData.personalInfo.profession || 'Enfermeiro(a)',
        '{telefone}': resumeData.personalInfo.phone || 'Seu telefone',
        '{email}': resumeData.personalInfo.email || user.email || 'seu@email.com',
        '{endereco}': resumeData.personalInfo.address || 'Sua cidade, Estado',
        '{vaga}': document.getElementById('job-title')?.value || 'vaga de interesse',
        '{anos_experiencia}': document.getElementById('years-experience')?.value || 'X anos',
        '{especialidade}': document.getElementById('specialty')?.value || 'sua especialidade',
        '{indicacao}': document.getElementById('referral-name')?.value || 'contato em comum',
        '{data}': new Date().toLocaleDateString('pt-BR'),
        '{experiencia}': getMainExperience(),
        '{habilidade1}': getTopSkills()[0] || 'Cuidados de enfermagem',
        '{habilidade2}': getTopSkills()[1] || 'Trabalho em equipe',
        '{habilidade3}': getTopSkills()[2] || 'Comunicação eficaz',
        '{experiencia_principal}': getMainExperienceDescription(),
        '{certificacoes}': getCertificationsText(),
        '{especializacoes}': getSpecializationsText()
    };
    
    if (platform === 'email') {
        return {
            subject: replaceTokens(template.subject, replacements),
            body: replaceTokens(template.body, replacements)
        };
    } else {
        return replaceTokens(template, replacements);
    }
}

// Substituir tokens na mensagem
function replaceTokens(text, replacements) {
    let result = text;
    Object.keys(replacements).forEach(token => {
        result = result.replace(new RegExp(token.replace(/[{}]/g, '\\$&'), 'g'), replacements[token]);
    });
    return result;
}

// Obter experiência principal
function getMainExperience() {
    const experiences = state.resumeData.experience;
    if (experiences && experiences.length > 0) {
        return experiences[0].position || 'experiência em enfermagem';
    }
    return 'experiência em enfermagem';
}

// Obter descrição da experiência principal
function getMainExperienceDescription() {
    const experiences = state.resumeData.experience;
    if (experiences && experiences.length > 0) {
        const exp = experiences[0];
        return `${exp.position || 'Cargo'} na ${exp.company || 'instituição'}`;
    }
    return 'Experiência em enfermagem';
}

// Obter principais habilidades
function getTopSkills() {
    const skills = state.resumeData.skills;
    if (skills && skills.length > 0) {
        return skills.slice(0, 3).map(skill => skill.name || 'Habilidade');
    }
    return ['Cuidados de enfermagem', 'Trabalho em equipe', 'Comunicação eficaz'];
}

// Obter texto das certificações
function getCertificationsText() {
    const certs = state.resumeData.certifications;
    if (certs && certs.length > 0) {
        return certs.map(cert => cert.name).join(', ');
    }
    return 'Certificações em enfermagem';
}

// Obter texto das especializações
function getSpecializationsText() {
    const education = state.resumeData.education;
    if (education && education.length > 0) {
        const specializations = education.filter(edu => 
            edu.degree && (edu.degree.toLowerCase().includes('especialização') || 
                          edu.degree.toLowerCase().includes('pós'))
        );
        if (specializations.length > 0) {
            return specializations.map(spec => spec.degree).join(', ');
        }
    }
    return 'Especializações na área de saúde';
}

// Enviar mensagem customizada
async function sendCustomizedMessage(platform) {
    const messageType = document.getElementById('message-type').value;
    
    if (platform === 'whatsapp') {
        const message = document.getElementById('message-preview').value;
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
        
        // Abrir WhatsApp
        window.open(whatsappUrl, '_blank');
        
        showAlert('Mensagem preparada! Complete o envio no WhatsApp.', 'success');
        
    } else if (platform === 'email') {
        const subject = document.getElementById('email-subject').value;
        const body = document.getElementById('message-preview').value;
        
        const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        // Abrir cliente de e-mail
        window.location.href = mailtoUrl;
        
        showAlert('Cliente de e-mail aberto! Complete o envio.', 'success');
    }
    
    // Fechar modal
    document.querySelector('.fixed.inset-0').remove();
}

// Copiar link compartilhável
function copyShareableLink() {
    // Gerar link único para o currículo (simulado)
    const userId = state.currentUser.id;
    const shareableLink = `${window.location.origin}/curriculo/${userId}`;
    
    // Copiar para clipboard
    navigator.clipboard.writeText(shareableLink).then(() => {
        showAlert('Link copiado para a área de transferência!', 'success');
    }).catch(() => {
        // Fallback para navegadores mais antigos
        const textArea = document.createElement('textarea');
        textArea.value = shareableLink;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        showAlert('Link copiado para a área de transferência!', 'success');
    });
}

// Adicionar funcionalidade de compartilhamento rápido na sidebar
function addQuickShareToSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        const quickShareButton = document.createElement('button');
        quickShareButton.className = 'w-full flex items-center p-3 rounded-lg hover:bg-secondary-blue transition-colors';
        quickShareButton.innerHTML = `
            <i data-lucide="share-2" class="h-5 w-5 mr-3"></i>
            <span class="sidebar-text">Compartilhar</span>
        `;
        quickShareButton.onclick = showShareOptions;
        
        // Adicionar antes do último divisor
        const divider = sidebar.querySelector('.border-t');
        if (divider) {
            divider.parentNode.insertBefore(quickShareButton, divider);
        }
    }
}

// Exportar funções globais
window.showShareOptions = showShareOptions;
window.shareViaWhatsApp = shareViaWhatsApp;
window.shareViaEmail = shareViaEmail;
window.copyShareableLink = copyShareableLink;
window.updateMessageTemplate = updateMessageTemplate;
window.sendCustomizedMessage = sendCustomizedMessage;

