/**
 * web-vitals-reporter.js
 * ----------------------
 * Captura métricas reais de Core Web Vitals dos usuários e as envia para o
 * console (desenvolvimento) e para o Google Tag Manager / dataLayer (produção).
 *
 * Como usar:
 *   Inclua este script no <head> de qualquer página, após o GTM (se existir):
 *
 *     <script src="/js/web-vitals-reporter.js" defer></script>
 *
 * As métricas ficam disponíveis como eventos no dataLayer:
 *   { event: 'web_vital', metric_name: 'LCP', metric_value: 1234, metric_rating: 'good' }
 *
 * Métricas coletadas:
 *   LCP  — Largest Contentful Paint  (bom: ≤2.5 s)
 *   INP  — Interaction to Next Paint (bom: ≤200 ms)
 *   CLS  — Cumulative Layout Shift   (bom: ≤0.10)
 *   FCP  — First Contentful Paint    (bom: ≤1.8 s)
 *   TTFB — Time to First Byte        (bom: ≤800 ms)
 */
(function () {
  "use strict";

  /**
   * Envia uma métrica para o dataLayer (GTM) e para o console.
   * @param {import('web-vitals').Metric} metric
   */
  function reportMetric(metric) {
    var isDev =
      location.hostname === "localhost" ||
      location.hostname === "127.0.0.1" ||
      location.hostname.endsWith(".local");

    if (isDev) {
      console.info(
        "[web-vitals] " +
          metric.name +
          " = " +
          Math.round(metric.value) +
          (metric.name === "CLS" ? "" : " ms") +
          " (" +
          metric.rating +
          ")"
      );
    }

    // Envia para o Google Tag Manager se disponível
    if (typeof window.dataLayer !== "undefined") {
      window.dataLayer.push({
        event: "web_vital",
        metric_name: metric.name,
        metric_id: metric.id,
        metric_value: Math.round(
          metric.name === "CLS" ? metric.value * 1000 : metric.value
        ),
        metric_rating: metric.rating,
        metric_delta: Math.round(
          metric.name === "CLS" ? metric.delta * 1000 : metric.delta
        ),
        metric_navigationType: metric.navigationType,
      });
    }
  }

  // Carrega web-vitals v5.3.0 via CDN (IIFE build — sem dependência de bundler)
  // Versão fixada para evitar atualizações inesperadas via CDN.
  // Para máxima segurança, considere calcular e adicionar um atributo `integrity` (SRI)
  // usando: https://www.srihash.org/?url=https://unpkg.com/web-vitals@5.3.0/dist/web-vitals.iife.js
  var script = document.createElement("script");
  script.src =
    "https://unpkg.com/web-vitals@5.3.0/dist/web-vitals.iife.js";
  script.async = true;
  script.onload = function () {
    if (typeof webVitals === "undefined") return;
    var opts = { reportAllChanges: false };
    webVitals.onLCP(reportMetric, opts);
    webVitals.onINP(reportMetric, opts);
    webVitals.onCLS(reportMetric, opts);
    webVitals.onFCP(reportMetric);
    webVitals.onTTFB(reportMetric);
  };
  document.head.appendChild(script);
})();
