module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npx http-server ./ -p 8080',
      url: ['http://localhost:8080/index.html'],
      numberOfRuns: 3
    },
    assert: {
      assertions: {
        'categories:performance': ['error', {minScore: 0.9}],
        'categories:accessibility': ['error', {minScore: 0.9}],
        'categories:seo': ['error', {minScore: 0.9}]
      }
    },
    upload: { target: 'temporary-public-storage' }
  }
};
