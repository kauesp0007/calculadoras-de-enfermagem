// Funções de autenticação

// Manipular login
function handleLogin(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const email = form.querySelector('input[type="email"]').value;
    const password = form.querySelector('input[type="password"]').value;
    
    // Validação básica
    if (!email || !password) {
        showAlert('Por favor, preencha todos os campos.', 'error');
        return;
    }
    
    // Simular autenticação (em produção, seria uma chamada para API)
    simulateLogin(email, password);
}

// Manipular cadastro
function handleRegister(event) {
    event.preventDefault();
    
    const form = event.target;
    const name = form.querySelector('input[type="text"]').value;
    const email = form.querySelector('input[type="email"]').value;
    const password = form.querySelector('input[type="password"]').value;
    const confirmPassword = form.querySelectorAll('input[type="password"]')[1].value;
    
    // Validação básica
    if (!name || !email || !password || !confirmPassword) {
        showAlert('Por favor, preencha todos os campos.', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showAlert('As senhas não coincidem.', 'error');
        return;
    }
    
    if (password.length < 6) {
        showAlert('A senha deve ter pelo menos 6 caracteres.', 'error');
        return;
    }
    
    // Simular cadastro
    simulateRegister(name, email, password);
}

// Simular login
function simulateLogin(email, password) {
    // Mostrar loading
    const submitBtn = document.querySelector('#login-form button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i data-lucide="loader-2" class="mr-2 h-4 w-4 animate-spin"></i>Entrando...';
    submitBtn.disabled = true;
    
    // Simular delay de rede
    setTimeout(() => {
        // Simular sucesso (em produção, verificaria credenciais)
        const userData = {
            id: 1,
            name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
            email: email,
            profession: 'Enfermeiro(a)',
            createdAt: new Date().toISOString()
        };
        
        // Salvar no localStorage
        localStorage.setItem('userData', JSON.stringify(userData));
        
        // Atualizar estado global
        state.isAuthenticated = true;
        state.currentUser = userData;
        
        // Atualizar interface
        updateUserInterface();
        
        // Fechar modal
        closeModal('login-modal');
        
        // Mostrar mensagem de sucesso
        showAlert('Login realizado com sucesso!', 'success');
        
        // Se estava tentando acessar currículos, redirecionar
        if (state.currentSection === 'curriculos') {
            loadCurriculosContent();
        }
        
        // Restaurar botão
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        // Limpar formulário
        document.getElementById('login-form').reset();
        
    }, 1500);
}

// Simular cadastro
function simulateRegister(name, email, password) {
    // Mostrar loading
    const submitBtn = document.querySelector('#register-form button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i data-lucide="loader-2" class="mr-2 h-4 w-4 animate-spin"></i>Criando conta...';
    submitBtn.disabled = true;
    
    // Simular delay de rede
    setTimeout(() => {
        // Simular sucesso
        const userData = {
            id: Date.now(),
            name: name,
            email: email,
            profession: 'Enfermeiro(a)',
            createdAt: new Date().toISOString()
        };
        
        // Salvar no localStorage
        localStorage.setItem('userData', JSON.stringify(userData));
        
        // Atualizar estado global
        state.isAuthenticated = true;
        state.currentUser = userData;
        
        // Atualizar interface
        updateUserInterface();
        
        // Fechar modal
        closeModal('register-modal');
        
        // Mostrar mensagem de sucesso
        showAlert('Conta criada com sucesso! Bem-vindo(a) à plataforma!', 'success');
        
        // Redirecionar para currículos
        showSection('curriculos');
        
        // Restaurar botão
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        // Limpar formulário
        document.getElementById('register-form').reset();
        
    }, 2000);
}

// Logout
function logout() {
    // Confirmar logout
    if (confirm('Tem certeza que deseja sair?')) {
        // Limpar dados
        localStorage.removeItem('userData');
        
        // Atualizar estado
        state.isAuthenticated = false;
        state.currentUser = null;
        
        // Atualizar interface
        updateUserInterface();
        
        // Redirecionar para home
        showSection('home');
        
        // Mostrar mensagem
        showAlert('Logout realizado com sucesso!', 'success');
    }
}

// Mostrar alertas
function showAlert(message, type = 'info') {
    // Criar elemento de alerta
    const alert = document.createElement('div');
    alert.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full`;
    
    // Definir cores baseado no tipo
    switch (type) {
        case 'success':
            alert.classList.add('bg-success-green', 'text-white');
            break;
        case 'error':
            alert.classList.add('bg-error-red', 'text-white');
            break;
        case 'warning':
            alert.classList.add('bg-yellow-500', 'text-white');
            break;
        default:
            alert.classList.add('bg-primary-blue', 'text-white');
    }
    
    alert.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex items-center">
                <i data-lucide="${getAlertIcon(type)}" class="h-5 w-5 mr-3"></i>
                <span>${message}</span>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 hover:opacity-75">
                <i data-lucide="x" class="h-4 w-4"></i>
            </button>
        </div>
    `;
    
    // Adicionar ao DOM
    document.body.appendChild(alert);
    
    // Inicializar ícones
    lucide.createIcons();
    
    // Animar entrada
    setTimeout(() => {
        alert.classList.remove('translate-x-full');
    }, 100);
    
    // Remover automaticamente após 5 segundos
    setTimeout(() => {
        alert.classList.add('translate-x-full');
        setTimeout(() => {
            if (alert.parentElement) {
                alert.remove();
            }
        }, 300);
    }, 5000);
}

// Obter ícone do alerta baseado no tipo
function getAlertIcon(type) {
    switch (type) {
        case 'success':
            return 'check-circle';
        case 'error':
            return 'x-circle';
        case 'warning':
            return 'alert-triangle';
        default:
            return 'info';
    }
}

// Verificar se o usuário está autenticado
function requireAuth() {
    if (!state.isAuthenticated) {
        showAlert('Você precisa fazer login para acessar esta funcionalidade.', 'warning');
        showLogin();
        return false;
    }
    return true;
}

// Exportar funções globais
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.logout = logout;
window.showAlert = showAlert;
window.requireAuth = requireAuth;

