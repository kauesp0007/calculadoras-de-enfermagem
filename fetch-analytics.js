require('dotenv').config();
const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const fs = require('fs');

// Inicializa o cliente do Google Analytics
const analyticsDataClient = new BetaAnalyticsDataClient();
const propertyId = process.env.GA_PROPERTY_ID;

async function runAnalyticsReport() {
  console.log('Iniciando busca de dados do Google Analytics...');

  try {
    // 1. Busca as Páginas mais acessadas (Últimos 7 dias)
    const [pagesReport] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'pageTitle' }, { name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 7, // Pega as 7 páginas mais acessadas para o ranking
    });

    // 2. Busca os Países que mais acessam (Últimos 7 dias)
    const [countriesReport] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'country' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 5, // Pega os top 5 países
    });

    // Formata os dados das páginas para ficar fácil do HTML ler
    const topPages = pagesReport.rows.map(row => ({
      title: row.dimensionValues[0].value,
      path: row.dimensionValues[1].value,
      views: parseInt(row.metricValues[0].value, 10)
    }));

    // Formata os dados dos países
    const topCountries = countriesReport.rows.map(row => ({
      country: row.dimensionValues[0].value,
      users: parseInt(row.metricValues[0].value, 10)
    }));

    // Calcula um total de visualizações das páginas do ranking para exibir no Card
    const totalViews = topPages.reduce((acc, page) => acc + page.views, 0);

    // Monta o objeto final
    const finalData = {
      lastUpdate: new Date().toISOString(),
      totalViewsRanking: totalViews,
      topPages: topPages,
      topCountries: topCountries
    };

    // Salva os dados na raiz do seu projeto
    fs.writeFileSync('analytics-data.json', JSON.stringify(finalData, null, 2));
    
    console.log('✅ Sucesso! Arquivo analytics-data.json gerado com os dados mais recentes.');

  } catch (error) {
    console.error('❌ Erro ao buscar os dados:', error.message);
  }
}

runAnalyticsReport();