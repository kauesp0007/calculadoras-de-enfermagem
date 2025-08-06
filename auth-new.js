// Sistema de Autenticação - Apenas para Currículos
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.init();
    }

    init() {
        // Verificar se há usuário logado no localStorage
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.isLoggedIn = true;
            this.updateUI();
        }

        // Configurar event listeners
        this.setupEventListeners();
        
        // Verificar acesso a seções protegidas
        this.checkProtectedSections();
    }

    setupEventListeners() {
        // Event listeners para modais de autenticação
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="login"]')) {
                this.showLoginModal();
            }
            if (e.target.matches('[data-action="register"]')) {
                this.showRegisterModal();
            }
            if (e.target.matches('[data-action="logout"]')) {
                this.logout();
            }
            if (e.target.matches('[data-action="forgot-password"]')) {
                this.showForgotPasswordModal();
            }
        });

        // Interceptar navegação para currículos
        document.addEventListener('click', (e) => {
            if (e.target.matches('a[href="#curriculos"], button[data-section="curriculos"]')) {
                if (!this.isLoggedIn) {
                    e.preventDefault();
                    this.showLoginModal();
                    return false;
                }
            }
        });

        // Interceptar cliques em "Criar Currículo"
        document.addEventListener('click', (e) => {
            if (e.target.textContent.includes('Criar Currículo') || e.target.matches('[data-action="create-resume"]')) {
                if (!this.isLoggedIn) {
                    e.preventDefault();
                    this.showLoginModal();
                    return false;
                }
            }
        });

        // Interceptar mudanças de hash para currículos
        window.addEventListener('hashchange', () => {
            this.checkProtectedSections();
        });
    }

    checkProtectedSections() {
        // Verificar se está tentando acessar seção de currículos sem login
        const currentHash = window.location.hash;
        if (currentHash === '#curriculos' && !this.isLoggedIn) {
            // Redirecionar para home e mostrar modal de login
            window.location.hash = '#home';
            setTimeout(() => this.showLoginModal(), 100);
        }
    }

    showLoginModal() {
        // Remover modal existente se houver
        const existingModal = document.querySelector('.modal-overlay');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Entrar na sua conta</h2>
                    <p>Acesse sua conta para criar currículos profissionais</p>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <form id="loginForm" class="auth-form">
                    <div class="form-group">
                        <label for="loginEmail">E-mail</label>
                        <input type="email" id="loginEmail" placeholder="seu@email.com" required>
                    </div>
                    <div class="form-group">
                        <label for="loginPassword">Senha</label>
                        <input type="password" id="loginPassword" placeholder="••••••••" required>
                    </div>
                    <button type="submit" class="btn btn-primary btn-full">Entrar</button>
                    <div class="auth-links">
                        <button type="button" data-action="forgot-password" class="link-button">Esqueceu sua senha?</button>
                        <span>Não tem uma conta? <button type="button" data-action="register" class="link-button">Criar conta</button></span>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Event listener para o formulário de login
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Focar no campo de email
        setTimeout(() => document.getElementById('loginEmail').focus(), 100);
    }

    showRegisterModal() {
        // Remover modal existente se houver
        const existingModal = document.querySelector('.modal-overlay');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Criar sua conta</h2>
                    <p>Crie uma conta gratuita para acessar todos os recursos</p>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <form id="registerForm" class="auth-form">
                    <div class="form-group">
                        <label for="registerName">Nome completo</label>
                        <input type="text" id="registerName" placeholder="Seu nome completo" required>
                    </div>
                    <div class="form-group">
                        <label for="registerEmail">E-mail</label>
                        <input type="email" id="registerEmail" placeholder="seu@email.com" required>
                    </div>
                    <div class="form-group">
                        <label for="registerPassword">Senha</label>
                        <input type="password" id="registerPassword" placeholder="••••••••" required>
                    </div>
                    <div class="form-group">
                        <label for="registerConfirmPassword">Confirmar senha</label>
                        <input type="password" id="registerConfirmPassword" placeholder="••••••••" required>
                    </div>
                    <button type="submit" class="btn btn-primary btn-full">Criar conta</button>
                    <div class="auth-links">
                        <span>Já tem uma conta? <button type="button" data-action="login" class="link-button">Entrar</button></span>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Event listener para o formulário de registro
        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // Focar no campo de nome
        setTimeout(() => document.getElementById('registerName').focus(), 100);
    }

    showForgotPasswordModal() {
        // Remover modal existente se houver
        const existingModal = document.querySelector('.modal-overlay');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Recuperar senha</h2>
                    <p>Digite seu e-mail para receber instruções de recuperação</p>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <form id="forgotPasswordForm" class="auth-form">
                    <div class="form-group">
                        <label for="forgotEmail">E-mail</label>
                        <input type="email" id="forgotEmail" placeholder="seu@email.com" required>
                    </div>
                    <button type="submit" class="btn btn-primary btn-full">Enviar instruções</button>
                    <div class="auth-links">
                        <button type="button" data-action="login" class="link-button">Voltar ao login</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Event listener para o formulário de recuperação
        document.getElementById('forgotPasswordForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleForgotPassword();
        });

        // Focar no campo de email
        setTimeout(() => document.getElementById('forgotEmail').focus(), 100);
    }

    handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        // Validação básica
        if (!email || !password) {
            this.showMessage('Por favor, preencha todos os campos.', 'error');
            return;
        }

        // Simulação de login (em produção seria uma chamada à API)
        if (this.validateCredentials(email, password)) {
            const user = {
                id: Date.now(),
                name: this.extractNameFromEmail(email),
                email: email,
                loginTime: new Date().toISOString()
            };

            this.currentUser = user;
            this.isLoggedIn = true;
            localStorage.setItem('currentUser', JSON.stringify(user));

            // Fechar modal
            document.querySelector('.modal-overlay').remove();
            
            // Atualizar UI
            this.updateUI();
            
            // Redirecionar para currículos
            window.location.hash = '#curriculos';
            
            // Mostrar mensagem de sucesso
            this.showMessage('Login realizado com sucesso!', 'success');
        } else {
            this.showMessage('E-mail ou senha incorretos.', 'error');
        }
    }

    handleRegister() {
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;

        // Validações
        if (!name || !email || !password || !confirmPassword) {
            this.showMessage('Por favor, preencha todos os campos.', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showMessage('As senhas não coincidem.', 'error');
            return;
        }

        if (password.length < 6) {
            this.showMessage('A senha deve ter pelo menos 6 caracteres.', 'error');
            return;
        }

        // Verificar se email já existe (simulação)
        if (this.emailExists(email)) {
            this.showMessage('Este e-mail já está cadastrado.', 'error');
            return;
        }

        // Criar usuário
        const user = {
            id: Date.now(),
            name: name,
            email: email,
            registrationTime: new Date().toISOString()
        };

        // Salvar usuário (em produção seria uma chamada à API)
        this.saveUser(user, password);

        this.currentUser = user;
        this.isLoggedIn = true;
        localStorage.setItem('currentUser', JSON.stringify(user));

        // Fechar modal
        document.querySelector('.modal-overlay').remove();
        
        // Atualizar UI
        this.updateUI();
        
        // Redirecionar para currículos
        window.location.hash = '#curriculos';
        
        // Mostrar mensagem de sucesso
        this.showMessage('Conta criada com sucesso!', 'success');
    }

    handleForgotPassword() {
        const email = document.getElementById('forgotEmail').value;

        if (!email) {
            this.showMessage('Por favor, digite seu e-mail.', 'error');
            return;
        }

        // Simulação de envio de email
        setTimeout(() => {
            this.showMessage('Instruções de recuperação enviadas para seu e-mail!', 'success');
            document.querySelector('.modal-overlay').remove();
        }, 1000);
    }

    validateCredentials(email, password) {
        // Simulação de validação (em produção seria uma chamada à API)
        // Para demonstração, aceitar qualquer email válido com senha "123456"
        return email.includes('@') && password === '123456';
    }

    emailExists(email) {
        // Simulação de verificação de email existente
        const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        return existingUsers.some(user => user.email === email);
    }

    saveUser(user, password) {
        // Salvar usuário no localStorage (em produção seria uma chamada à API)
        const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        existingUsers.push({ ...user, password: password }); // Em produção, a senha seria hasheada
        localStorage.setItem('registeredUsers', JSON.stringify(existingUsers));
    }

    extractNameFromEmail(email) {
        // Extrair nome do email para casos onde não temos o nome completo
        return email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    logout() {
        this.currentUser = null;
        this.isLoggedIn = false;
        localStorage.removeItem('currentUser');
        
        // Atualizar UI
        this.updateUI();
        
        // Redirecionar para home
        window.location.hash = '#home';
        
        // Mostrar mensagem
        this.showMessage('Logout realizado com sucesso!', 'success');
    }

    updateUI() {
        const authButtons = document.querySelector('.auth-buttons');

        if (this.isLoggedIn && this.currentUser) {
            // Mostrar informações do usuário
            if (authButtons) {
                authButtons.innerHTML = `
                    <div class="user-info">
                        <span>Olá, ${this.currentUser.name.split(' ')[0]}!</span>
                        <button class="btn btn-outline btn-sm" data-action="logout">Sair</button>
                    </div>
                `;
            }
        } else {
            // Mostrar botões de login/cadastro
            if (authButtons) {
                authButtons.innerHTML = `
                    <button class="btn btn-outline" data-action="login">Entrar</button>
                    <button class="btn btn-primary" data-action="register">Cadastrar</button>
                `;
            }
        }
    }

    showMessage(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="flex items-center">
                <div class="mr-3">
                    ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
                </div>
                <div>
                    <div class="font-medium">${message}</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Método para verificar se usuário pode acessar currículos
    canAccessResumes() {
        return this.isLoggedIn;
    }

    // Método para obter dados do usuário atual
    getCurrentUser() {
        return this.currentUser;
    }

    // Método para verificar se está logado
    isAuthenticated() {
        return this.isLoggedIn;
    }
}

// Inicializar sistema de autenticação
window.authSystem = new AuthSystem();

