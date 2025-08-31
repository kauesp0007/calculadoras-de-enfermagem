// Arquivo principal de inicialização
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado, inicializando componentes...');
    
    // Inicializar todos os módulos
    new HeaderManager();
    new AccessibilityManager();
    new LibrasManager();
    new BackToTopManager();
    // Outros managers podem ser inicializados aqui
    
    console.log('Todos os componentes inicializados com sucesso!');
});