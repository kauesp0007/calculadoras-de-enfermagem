module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:8080/diagnosticosnanda.html',
        'http://localhost:8080/zarit.html',
        'http://localhost:8080/medicacoes.html',
        'http://localhost:8080/instrumentais-cirurgicos.html',
        'http://localhost:8080/gasometria.html'
      ],
      staticDistDir: './', // Onde o servidor local do Lighthouse deve rodar
      numberOfRuns: 3,     // Mantém 3 testes por página para uma média precisa
    },
    assert: {
      preset: 'lighthouse:recommended',
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};