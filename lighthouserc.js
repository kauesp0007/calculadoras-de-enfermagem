module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:8080/index.html',
        'http://localhost:8080/braden.html',
        'http://localhost:8080/fugulin.html',
        'http://localhost:8080/dimensionamento.html',
        'http://localhost:8080/gotejamento.html'
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