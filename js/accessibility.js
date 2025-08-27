// --- MÓDULO DE ACESSIBILIDADE (GLOBAL) ---
class AccessibilityManager {
    constructor() {
        this.body = document.body;
        this.html = document.documentElement;
        this.menu = document.getElementById('accessibility-menu');
        this.openBtn = document.getElementById('accessibility-btn');
        this.closeBtn = document.getElementById('close-accessibility-menu');
        this.closeBtnFooter = document.getElementById('close-accessibility-menu-footer');
        this.resetBtn = document.getElementById('reset-accessibility');
        
        this.state = {};
        this.readingMask = null;
        this.readingGuide = null;
        this.init();
    }

    init() {
        if(!this.openBtn || !this.menu) return;

        const closeMenu = () => this.menu.classList.remove('open');

        this.openBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.menu.classList.toggle('open');
        });
        this.closeBtn.addEventListener('click', closeMenu);
        this.closeBtnFooter.addEventListener('click', closeMenu);
        
        document.addEventListener('click', (e) => {
            if (this.menu.classList.contains('open') && !e.target.closest('#accessibility-menu') && !e.target.closest('#accessibility-btn')) {
                this.menu.classList.remove('open');
            }
        });

        this.resetBtn.addEventListener('click', () => this.resetAll());
        
        this.menu.addEventListener('click', (e) => {
            const target = e.target.closest('.acc-option');
            if (!target) return;
            const { action, value } = target.dataset;
            this.handleAction(action, value);
        });
    }

    handleAction(action, value) {
        const group = action.replace(/-(\w)/g, (m, p1) => p1.toUpperCase());
        const isToggle = !value;

        if (isToggle) { this.state[group] = !this.state[group]; } 
        else { this.state[group] = this.state[group] === value ? null : value; }

        const funcName = 'apply' + group.charAt(0).toUpperCase() + group.slice(1);
        if (typeof this[funcName] === 'function') { this[funcName](this.state[group]); }

        this.updateActiveState();
    }

    applyFontSize(value) { this.body.style.fontSize = value ? `${value}em` : ''; }
    applyFontType(value) { this.body.classList.toggle('font-serif', value === 'serif'); this.body.classList.toggle('font-bold-force', value === 'bold'); }
    applyLineSpacing(value) { this.body.style.lineHeight = value || ''; }
    applyLetterSpacing(value) { this.body.style.letterSpacing = value ? `${value}em` : ''; }
    applyContrast(value) { 
        this.html.className = this.html.className.replace(/contrast-\w+/g, ''); 
        if(value) {
             this.html.classList.add(`contrast-${value}`);
        }
        const carbonBadge = document.getElementById('wcb');
        if(carbonBadge) {
            // Adicionado a lógica para o modo dark do badge de carbono
            if(value === 'dark') {
                carbonBadge.classList.add('wcb-d');
            } else {
                carbonBadge.classList.remove('wcb-d');
            }
        }
    }
    applySaturation(value) { this.html.className = this.html.className.replace(/saturation-\w+/g, ''); if(value) this.html.classList.add(`saturation-${value}`); }
    applyHighlightLinks(active) { this.body.classList.toggle('links-highlighted', active); }
    
    applySiteReader(active) {
        if (active) { 
            this.body.addEventListener('click', this.readText, false); 
        } else { 
            this.body.removeEventListener('click', this.readText, false); 
            speechSynthesis.cancel(); 
        }
    }
    
    readText(event) {
        if(event.target.closest('a, button, input, select, textarea')) return;
        event.preventDefault();
        event.stopPropagation();
        const text = event.target.textContent || event.target.alt || event.target.ariaLabel;
        if (text) {
            speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text.trim());
            utterance.lang = 'pt-BR';
            speechSynthesis.speak(utterance);
        }
    }

    applyReadingMask(active) {
        if (active && !this.readingMask) {
            this.readingMask = document.createElement('div'); this.readingMask.id = 'reading-mask'; this.body.appendChild(this.readingMask);
            document.addEventListener('mousemove', this.updateMaskPosition);
        } else if (!active && this.readingMask) {
            this.readingMask.remove(); this.readingMask = null;
            document.removeEventListener('mousemove', this.updateMaskPosition);
        }
    }
    
    updateMaskPosition(e) { const maskHeight = 100; document.getElementById('reading-mask').style.clipPath = `polygon(0 ${e.clientY - maskHeight/2}px, 100% ${e.clientY - maskHeight/2}px, 100% ${e.clientY + maskHeight/2}px, 0 ${e.clientY + maskHeight/2}px)`; }

    applyReadingGuide(active) {
        if (active && !this.readingGuide) {
            this.readingGuide = document.createElement('div'); this.readingGuide.id = 'reading-guide'; this.body.appendChild(this.readingGuide);
            document.addEventListener('mousemove', this.updateGuidePosition);
        } else if (!active && this.readingGuide) {
            this.readingGuide.remove(); this.readingGuide = null;
            document.removeEventListener('mousemove', this.updateGuidePosition);
        }
    }

    updateGuidePosition(e) { document.getElementById('reading-guide').style.top = `${e.clientY}px`; }

    resetAll() {
        const allActions = new Set(Array.from(this.menu.querySelectorAll('[data-action]')).map(el => el.dataset.action));
        allActions.forEach(action => {
            const group = action.replace(/-(\w)/g, (m, p1) => p1.toUpperCase());
            this.state[group] = null;
            const funcName = 'apply' + group.charAt(0).toUpperCase() + group.slice(1);
            if (typeof this[funcName] === 'function') { this[funcName](null); }
        });
        this.updateActiveState();
    }
    
    updateActiveState() {
        this.menu.querySelectorAll('.acc-feature').forEach(feature => {
            const group = feature.dataset.group;
            let hasActive = false;
            feature.querySelectorAll('.acc-option').forEach(option => {
                const { action, value } = option.dataset;
                const isActive = value ? this.state[group] === value : !!this.state[group];
                option.classList.toggle('active', isActive);
                if (isActive) hasActive = true;
            });
            feature.classList.toggle('active', hasActive);
        });
    }
}

new AccessibilityManager();

// --- BOTÃO LIBRAS ---
const librasBtn = document.getElementById('libras-btn');
if(librasBtn) {
    librasBtn.addEventListener('click', () => {
        const vw_widget = document.querySelector('[vw-access-button]');
        if (vw_widget) {
            vw_widget.click();
        }
    });
}