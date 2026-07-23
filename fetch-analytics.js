require('dotenv').config();
const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const fs = require('fs');

// Inicializa o cliente do Google Analytics
const analyticsDataClient = new BetaAnalyticsDataClient();
const propertyId = process.env.GA_PROPERTY_ID;

async function runAnalyticsReport() {
  console.log('Iniciando busca de dados do Google Analytics...');

  try {
    // 1. Busca as Páginas mais acessadas (Hoje)
    const [pagesReport] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: 'today', endDate: 'today' }],
      dimensions: [{ name: 'pageTitle' }, { name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 7,
    });

    // 2. Busca os Países que mais acessam (Hoje)
    const [countriesReport] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: 'today', endDate: 'today' }],
      dimensions: [{ name: 'country' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 5,
    });

    // Formata os dados novos (vindos da API agora)
    const newPages = pagesReport.rows.map(row => ({
      title: row.dimensionValues[0].value,
      path: row.dimensionValues[1].value,
      views: parseInt(row.metricValues[0].value, 10)
    }));

    const newCountries = countriesReport.rows.map(row => ({
      country: row.dimensionValues[0].value,
      users: parseInt(row.metricValues[0].value, 10)
    }));

    // ══════════════════════════════════
    // Lógica de ACUMULAR (meio-dia) vs RESET (meia-noite)
    // ══════════════════════════════════
    const hoje = new Date().toISOString().slice(0, 10); // "2026-07-23"
    let topPages = newPages;
    let topCountries = newCountries;

    if (fs.existsSync('analytics-data.json')) {
      const existente = JSON.parse(fs.readFileSync('analytics-data.json', 'utf-8'));
      const dataExistente = existente.lastUpdate ? existente.lastUpdate.slice(0, 10) : '';

      if (dataExistente === hoje) {
        // ⏰ MEIO-DIA: mesmo dia → ACUMULAR com dados existentes
        console.log('🔄 Mesmo dia detectado → acumulando dados...');

        // Acumula páginas
        const pageMap = {};
        existente.topPages.forEach(p => { pageMap[p.path] = { title: p.title, views: p.views }; });
        newPages.forEach(p => {
          if (pageMap[p.path]) {
            pageMap[p.path].views += p.views;
          } else {
            pageMap[p.path] = { title: p.title, views: p.views };
          }
        });
        topPages = Object.values(pageMap).sort((a, b) => b.views - a.views).slice(0, 7);

        // Acumula países
        const countryMap = {};
        existente.topCountries.forEach(c => { countryMap[c.country] = c.users; });
        newCountries.forEach(c => {
          countryMap[c.country] = (countryMap[c.country] || 0) + c.users;
        });
        topCountries = Object.entries(countryMap)
          .map(([country, users]) => ({ country, users }))
          .sort((a, b) => b.users - a.users)
          .slice(0, 5);

        console.log('✅ Dados acumulados com sucesso!');
      } else {
        // 🌙 MEIA-NOITE: novo dia → RESET (usa apenas dados novos)
        console.log('🌙 Novo dia detectado → resetando contadores...');
      }
    }

    // Calcula total
    const totalViews = topPages.reduce((acc, page) => acc + page.views, 0);

    // Monta o objeto final
    const finalData = {
      lastUpdate: new Date().toISOString(),
      totalViewsRanking: totalViews,
      topPages: topPages,
      topCountries: topCountries
    };

    // Salva os dados
    fs.writeFileSync('analytics-data.json', JSON.stringify(finalData, null, 2));
    
    console.log('✅ Sucesso! analytics-data.json atualizado.');
    console.log(`   📊 ${totalViews} views | 📄 ${topPages.length} páginas | 🌍 ${topCountries.length} países`);

  } catch (error) {
    console.error('❌ Erro ao buscar os dados:', error.message);
  }
}

runAnalyticsReport();