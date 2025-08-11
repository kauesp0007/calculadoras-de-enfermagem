// Sistema de edição de templates
class TemplateEditor {
    constructor() {
        this.init();
    }

    init() {
        this.setupEditableElements();
        this.setupImageUpload();
        this.setupColorPicker();
        this.setupExport();
    }

    // Configurar elementos editáveis
    setupEditableElements() {
        const editableElements = document.querySelectorAll('.editable');
        
        editableElements.forEach(element => {
            element.addEventListener('click', (e) => {
                this.makeEditable(e.target);
            });

            element.addEventListener('blur', (e) => {
                this.saveChanges(e.target);
            });

            element.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    e.target.blur();
                }
            });
        });
    }

    makeEditable(element) {
        if (element.contentEditable === 'true') return;
        
        element.contentEditable = true;
        element.focus();
        
        // Selecionar todo o texto
        const range = document.createRange();
        range.selectNodeContents(element);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }

    saveChanges(element) {
        element.contentEditable = false;
        // Aqui você pode adicionar lógica para salvar as mudanças
        console.log('Texto alterado:', element.textContent);
    }

    // Sistema de upload de imagens
    setupImageUpload() {
        const imageContainers = document.querySelectorAll('.image-container');
        
        imageContainers.forEach(container => {
            container.addEventListener('click', () => {
                this.openImageUpload(container);
            });
        });
    }

    openImageUpload(container) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = container.querySelector('.template-image');
                    if (img) {
                        img.src = e.target.result;
                    }
                };
                reader.readAsDataURL(file);
            }
        };
        
        input.click();
    }

    // Sistema de seleção de cores
    setupColorPicker() {
        const colorElements = document.querySelectorAll('[data-color-target]');
        
        colorElements.forEach(element => {
            element.addEventListener('click', () => {
                this.openColorPicker(element);
            });
        });
    }

    openColorPicker(element) {
        const input = document.createElement('input');
        input.type = 'color';
        input.value = this.getElementColor(element);
        
        input.onchange = (e) => {
            const target = element.dataset.colorTarget;
            const newColor = e.target.value;
            
            if (target === 'background') {
                element.style.backgroundColor = newColor;
            } else if (target === 'text') {
                element.style.color = newColor;
            } else if (target === 'border') {
                element.style.borderColor = newColor;
            }
        };
        
        input.click();
    }

    getElementColor(element) {
        const target = element.dataset.colorTarget;
        const computedStyle = window.getComputedStyle(element);
        
        if (target === 'background') {
            return this.rgbToHex(computedStyle.backgroundColor);
        } else if (target === 'text') {
            return this.rgbToHex(computedStyle.color);
        } else if (target === 'border') {
            return this.rgbToHex(computedStyle.borderColor);
        }
        
        return '#1a3e74';
    }

    rgbToHex(rgb) {
        const result = rgb.match(/\d+/g);
        if (!result) return '#1a3e74';
        
        return '#' + result.map(x => {
            const hex = parseInt(x).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    // Sistema de exportação
    setupExport() {
        this.createExportButton();
    }

    createExportButton() {
        const exportBtn = document.createElement('button');
        exportBtn.textContent = 'Exportar como Imagem';
        exportBtn.className = 'btn btn-primary export-btn';
        exportBtn.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            font-size: 14px;
            padding: 10px 15px;
        `;
        
        exportBtn.addEventListener('click', () => {
            this.exportAsImage();
        });
        
        document.body.appendChild(exportBtn);
    }

    async exportAsImage() {
        const container = document.querySelector('.template-container');
        
        try {
            // Usar html2canvas se disponível
            if (typeof html2canvas !== 'undefined') {
                const canvas = await html2canvas(container, {
                    width: 500,
                    height: 500,
                    scale: 2,
                    backgroundColor: '#ffffff'
                });
                
                this.downloadImage(canvas);
            } else {
                alert('Para exportar como imagem, inclua a biblioteca html2canvas');
            }
        } catch (error) {
            console.error('Erro ao exportar:', error);
            alert('Erro ao exportar a imagem');
        }
    }

    downloadImage(canvas) {
        const link = document.createElement('a');
        link.download = 'template-linkedin.png';
        link.href = canvas.toDataURL();
        link.click();
    }

    // Utilitários para templates específicos
    addQuizOption() {
        const quizContainer = document.querySelector('.quiz-options');
        if (!quizContainer) return;

        const optionDiv = document.createElement('div');
        optionDiv.className = 'quiz-option';
        optionDiv.innerHTML = `
            <div class="option-letter">C</div>
            <div class="option-text editable">Nova opção</div>
        `;
        
        quizContainer.appendChild(optionDiv);
        this.setupEditableElements();
    }

    addImageSlot() {
        const imageGrid = document.querySelector('.image-grid');
        if (!imageGrid) return;

        const imageSlot = document.createElement('div');
        imageSlot.className = 'image-slot';
        imageSlot.innerHTML = `
            <div class="image-container">
                <img src="https://via.placeholder.com/150x150/1a3e74/ffffff?text=+" 
                     alt="Adicionar imagem" class="template-image">
            </div>
            <div class="image-title editable text small">Título da imagem</div>
        `;
        
        imageGrid.appendChild(imageSlot);
        this.setupEditableElements();
        this.setupImageUpload();
    }

    addTableRow() {
        const table = document.querySelector('.editable-table tbody');
        if (!table) return;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="editable text small">Nova linha</td>
            <td class="editable text small">Valor</td>
        `;
        
        table.appendChild(row);
        this.setupEditableElements();
    }
}

// Inicializar o editor quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new TemplateEditor();
});

// Funções auxiliares globais
function changeTemplate(templateName) {
    window.location.href = `templates/${templateName}.html`;
}

function resetTemplate() {
    location.reload();
}

function togglePreview() {
    const container = document.querySelector('.template-container');
    container.classList.toggle('preview-mode');
}

// Adicionar estilos para modo preview
const previewStyles = `
    .preview-mode .editable:hover {
        background-color: transparent !important;
        outline: none !important;
    }
    
    .preview-mode .export-btn {
        display: none;
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = previewStyles;
document.head.appendChild(styleSheet);

