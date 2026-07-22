module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:8080/diagnosticosnanda.html',
        'http://localhost:8080/zarit.html',
        'http://localhost:8080/medicamentos.html',
        'http://localhost:8080/instrumentais-cirurgicos.html',
        'http://localhost:8080/gasometria.html'
      ],
      staticDistDir: './', // Onde o servidor local do Lighthouse deve rodar
      numberOfRuns: 3,     // Mantém 3 testes por página para uma média precisa
    },
    assert: {
      assertions: {
        // Core Web Vitals — todos com severidade "warn" para não bloquear o merge
        'first-contentful-paint':    ['warn', { maxNumericValue: 1800 }],
        'largest-contentful-paint':  ['warn', { maxNumericValue: 2500 }],
        'total-blocking-time':       ['warn', { maxNumericValue: 200  }],
        'cumulative-layout-shift':   ['warn', { maxNumericValue: 0.1  }],
        'speed-index':               ['warn', { maxNumericValue: 3400 }],
        'interactive':               ['warn', { maxNumericValue: 3800 }],
        'categories:performance':    ['warn', { minScore: 0.75 }],
        'categories:accessibility':  ['warn', { minScore: 0.90 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};