require('dotenv').config();
const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const fs = require('fs');

// Inicializa o cliente do Google Analytics
const analyticsDataClient = new BetaAnalyticsDataClient();
const propertyId = process.env.GA_PROPERTY_ID;

async function runAnalyticsReport() {
  console.log('Iniciando busca de dados do Google Analytics...');

  try {
    // Calcula o primeiro dia do mês atual dinamicamente (ex: "2026-07-01")
    const agora = new Date();
    const inicioDoMes = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-01`;

    // 1. Busca as Páginas mais acessadas (do dia 1º até hoje)
    const [pagesReport] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: inicioDoMes, endDate: 'today' }],
      dimensions: [{ name: 'pageTitle' }, { name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 7,
    });

    // 2. Busca os Países que mais acessam (do dia 1º até hoje)
    const [countriesReport] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: inicioDoMes, endDate: 'today' }],
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

    // ═══════════════════════════════════════
    // Lógica de ACÚMULO MENSAL (soma a cada 3h) vs RESET (virada do mês)
    // ═══════════════════════════════════════
    const mesAtual = new Date().toISOString().slice(0, 7); // "2026-07"
    let topPages = newPages;
    let topCountries = newCountries;

    if (fs.existsSync('analytics-data.json')) {
      const existente = JSON.parse(fs.readFileSync('analytics-data.json', 'utf-8'));
      const mesExistente = existente.lastUpdate ? existente.lastUpdate.slice(0, 7) : '';

      if (mesExistente === mesAtual) {
        // 📊 MESMO MÊS: acumular (somar) com dados já computados
        console.log('🔄 Mesmo mês detectado → acumulando dados...');

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
        // 🌙 NOVO MÊS: reset → começa do zero com os dados frescos dos últimos 30 dias
        console.log('🌙 Novo mês detectado → resetando contadores mensais...');
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