// Utilitários de Exportação para Word e PDF

// Carregar bibliotecas necessárias
function loadExportLibraries() {
    return new Promise((resolve) => {
        // Verificar se as bibliotecas já estão carregadas
        if (window.docx && window.jsPDF) {
            resolve();
            return;
        }
        
        // Carregar docx.js para exportação Word
        const docxScript = document.createElement('script');
        docxScript.src = 'https://unpkg.com/docx@8.2.2/build/index.js';
        docxScript.onload = () => {
            // Carregar jsPDF para exportação PDF
            const pdfScript = document.createElement('script');
            pdfScript.src = 'https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js';
            pdfScript.onload = () => {
                // Carregar html2canvas para captura de tela
                const canvasScript = document.createElement('script');
                canvasScript.src = 'https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js';
                canvasScript.onload = () => resolve();
                document.head.appendChild(canvasScript);
            };
            document.head.appendChild(pdfScript);
        };
        document.head.appendChild(docxScript);
    });
}

// Exportar currículo para Word
async function exportToWord() {
    if (!requireAuth()) return;
    
    try {
        // Mostrar loading
        showAlert('Preparando exportação para Word...', 'info');
        
        // Carregar bibliotecas se necessário
        await loadExportLibraries();
        
        // Gerar documento Word
        const doc = await generateWordDocument();
        
        // Fazer download
        const blob = await window.docx.Packer.toBlob(doc);
        downloadBlob(blob, `curriculo_${state.currentUser.name.replace(/\s+/g, '_')}.docx`);
        
        showAlert('Currículo exportado para Word com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao exportar para Word:', error);
        showAlert('Erro ao exportar para Word. Tente novamente.', 'error');
    }
}

// Exportar currículo para PDF
async function exportToPDF() {
    if (!requireAuth()) return;
    
    try {
        // Mostrar loading
        showAlert('Preparando exportação para PDF...', 'info');
        
        // Carregar bibliotecas se necessário
        await loadExportLibraries();
        
        // Gerar PDF
        await generatePDFDocument();
        
        showAlert('Currículo exportado para PDF com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao exportar para PDF:', error);
        showAlert('Erro ao exportar para PDF. Tente novamente.', 'error');
    }
}

// Gerar documento Word usando docx.js
async function generateWordDocument() {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = window.docx;
    
    const resumeData = state.resumeData;
    const template = state.selectedTemplate;
    
    // Definir cores baseadas no template
    const primaryColor = template ? template.colors.primary.replace('#', '') : '1A3E74';
    const secondaryColor = template ? template.colors.secondary.replace('#', '') : '004d99';
    
    // Criar seções do documento
    const sections = [];
    
    // Header com informações pessoais
    const headerParagraphs = [
        new Paragraph({
            children: [
                new TextRun({
                    text: resumeData.personalInfo.fullName || 'Seu Nome',
                    bold: true,
                    size: 32,
                    color: primaryColor,
                    font: 'Nunito Sans'
                })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
        }),
        
        new Paragraph({
            children: [
                new TextRun({
                    text: resumeData.personalInfo.profession || 'Sua Profissão',
                    size: 24,
                    color: secondaryColor,
                    font: 'Nunito Sans'
                })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 }
        })
    ];
    
    // Informações de contato
    const contactInfo = [];
    if (resumeData.personalInfo.email) {
        contactInfo.push(`📧 ${resumeData.personalInfo.email}`);
    }
    if (resumeData.personalInfo.phone) {
        contactInfo.push(`📞 ${resumeData.personalInfo.phone}`);
    }
    if (resumeData.personalInfo.address) {
        contactInfo.push(`📍 ${resumeData.personalInfo.address}`);
    }
    if (resumeData.medicalInfo.license) {
        contactInfo.push(`🏥 ${resumeData.medicalInfo.license}`);
    }
    
    if (contactInfo.length > 0) {
        headerParagraphs.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: contactInfo.join(' | '),
                        size: 20,
                        font: 'Inter'
                    })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 }
            })
        );
    }
    
    sections.push(...headerParagraphs);
    
    // Resumo Profissional
    if (resumeData.summary) {
        sections.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: 'RESUMO PROFISSIONAL',
                        bold: true,
                        size: 24,
                        color: primaryColor,
                        font: 'Nunito Sans'
                    })
                ],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 400, after: 200 }
            }),
            
            new Paragraph({
                children: [
                    new TextRun({
                        text: resumeData.summary,
                        size: 22,
                        font: 'Inter'
                    })
                ],
                spacing: { after: 400 }
            })
        );
    }
    
    // Experiência Profissional
    if (resumeData.experience && resumeData.experience.length > 0) {
        sections.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: 'EXPERIÊNCIA PROFISSIONAL',
                        bold: true,
                        size: 24,
                        color: primaryColor,
                        font: 'Nunito Sans'
                    })
                ],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 400, after: 200 }
            })
        );
        
        resumeData.experience.forEach(exp => {
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: exp.position || 'Cargo',
                            bold: true,
                            size: 22,
                            font: 'Nunito Sans'
                        })
                    ],
                    spacing: { before: 200, after: 100 }
                }),
                
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `${exp.company || 'Empresa'} | ${exp.startDate || 'Data início'} - ${exp.endDate || 'Data fim'}`,
                            size: 20,
                            color: secondaryColor,
                            font: 'Inter'
                        })
                    ],
                    spacing: { after: 100 }
                })
            );
            
            if (exp.description) {
                sections.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: exp.description,
                                size: 20,
                                font: 'Inter'
                            })
                        ],
                        spacing: { after: 200 }
                    })
                );
            }
        });
    }
    
    // Formação Acadêmica
    if (resumeData.education && resumeData.education.length > 0) {
        sections.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: 'FORMAÇÃO ACADÊMICA',
                        bold: true,
                        size: 24,
                        color: primaryColor,
                        font: 'Nunito Sans'
                    })
                ],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 400, after: 200 }
            })
        );
        
        resumeData.education.forEach(edu => {
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: edu.degree || 'Curso',
                            bold: true,
                            size: 22,
                            font: 'Nunito Sans'
                        })
                    ],
                    spacing: { before: 200, after: 100 }
                }),
                
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `${edu.institution || 'Instituição'} | ${edu.startDate || 'Data início'} - ${edu.endDate || 'Data fim'}`,
                            size: 20,
                            color: secondaryColor,
                            font: 'Inter'
                        })
                    ],
                    spacing: { after: 200 }
                })
            );
        });
    }
    
    // Habilidades
    if (resumeData.skills && resumeData.skills.length > 0) {
        sections.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: 'HABILIDADES',
                        bold: true,
                        size: 24,
                        color: primaryColor,
                        font: 'Nunito Sans'
                    })
                ],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 400, after: 200 }
            })
        );
        
        const skillsText = resumeData.skills
            .map(skill => `• ${skill.name || 'Habilidade'} (${skill.level || 'Nível'})`)
            .join('\n');
            
        sections.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: skillsText,
                        size: 20,
                        font: 'Inter'
                    })
                ],
                spacing: { after: 400 }
            })
        );
    }
    
    // Certificações
    if (resumeData.certifications && resumeData.certifications.length > 0) {
        sections.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: 'CERTIFICAÇÕES',
                        bold: true,
                        size: 24,
                        color: primaryColor,
                        font: 'Nunito Sans'
                    })
                ],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 400, after: 200 }
            })
        );
        
        resumeData.certifications.forEach(cert => {
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `• ${cert.name || 'Certificação'} - ${cert.issuer || 'Emissor'} (${cert.date || 'Data'})`,
                            size: 20,
                            font: 'Inter'
                        })
                    ],
                    spacing: { after: 100 }
                })
            );
        });
    }
    
    // Idiomas
    if (resumeData.languages && resumeData.languages.length > 0) {
        sections.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: 'IDIOMAS',
                        bold: true,
                        size: 24,
                        color: primaryColor,
                        font: 'Nunito Sans'
                    })
                ],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 400, after: 200 }
            })
        );
        
        const languagesText = resumeData.languages
            .map(lang => `• ${lang.language || 'Idioma'} (${lang.proficiency || 'Nível'})`)
            .join('\n');
            
        sections.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: languagesText,
                        size: 20,
                        font: 'Inter'
                    })
                ],
                spacing: { after: 400 }
            })
        );
    }
    
    // Criar documento
    const doc = new Document({
        sections: [{
            properties: {},
            children: sections
        }]
    });
    
    return doc;
}

// Gerar documento PDF
async function generatePDFDocument() {
    // Criar elemento temporário com o currículo renderizado
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    tempDiv.style.width = '210mm'; // A4 width
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.padding = '20mm';
    tempDiv.style.fontFamily = 'Inter, sans-serif';
    
    // Renderizar currículo no elemento temporário
    tempDiv.innerHTML = generateResumePreview();
    
    // Adicionar ao DOM temporariamente
    document.body.appendChild(tempDiv);
    
    try {
        // Capturar como imagem
        const canvas = await html2canvas(tempDiv, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff'
        });
        
        // Criar PDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 295; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        
        let position = 0;
        
        // Adicionar primeira página
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        // Adicionar páginas adicionais se necessário
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }
        
        // Fazer download
        const fileName = `curriculo_${state.currentUser.name.replace(/\s+/g, '_')}.pdf`;
        pdf.save(fileName);
        
    } finally {
        // Remover elemento temporário
        document.body.removeChild(tempDiv);
    }
}

// Função auxiliar para download de blob
function downloadBlob(blob, fileName) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Atualizar função downloadResume no resume-editor.js
function downloadResume() {
    if (!requireAuth()) return;
    
    // Mostrar modal de opções de download
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
            <div class="text-center mb-6">
                <div class="w-16 h-16 bg-primary-blue rounded-full flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="download" class="h-8 w-8 text-white"></i>
                </div>
                <h2 class="text-2xl font-heading font-bold text-gray-900 mb-2">Exportar Currículo</h2>
                <p class="text-gray-600">Escolha o formato para download</p>
            </div>
            
            <div class="space-y-3 mb-6">
                <button class="w-full btn btn-primary" onclick="exportToWord(); this.closest('.fixed').remove();">
                    <i data-lucide="file-text" class="mr-2 h-5 w-5"></i>
                    Exportar para Word (.docx)
                </button>
                
                <button class="w-full btn btn-secondary" onclick="exportToPDF(); this.closest('.fixed').remove();">
                    <i data-lucide="file" class="mr-2 h-5 w-5"></i>
                    Exportar para PDF
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

// Exportar funções globais
window.exportToWord = exportToWord;
window.exportToPDF = exportToPDF;
window.downloadResume = downloadResume;

