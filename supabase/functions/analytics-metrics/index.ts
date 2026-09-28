import { SignJWT, importPKCS8 } from "npm:jose@6.0.10";

const PROPERTY_ID = "522498030";
const SERVICE_ACCOUNT_SECRET = "GOOGLE_ANALYTICS_SERVICE_ACCOUNT_JSON";
const ALLOWED_ORIGIN = "https://www.calculadorasdeenfermagem.com.br";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API_URL = `https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY_ID}:runReport`;

const cors = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json; charset=utf-8",
  "Vary": "Origin",
};

let cachedToken: { value: string; expiresAt: number } | null = null;
const responseCache = new Map<string, { value: unknown; expiresAt: number }>();

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Cache-Control": "public, max-age=300, s-maxage=300" },
  });
}

function serviceAccount() {
  const raw = Deno.env.get(SERVICE_ACCOUNT_SECRET);
  if (!raw) throw new Error("GA credential not configured");
  const parsed = JSON.parse(raw);
  if (!parsed.client_email || !parsed.private_key) throw new Error("Invalid GA service account");
  return parsed;
}

async function accessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const sa = serviceAccount();
  const key = await importPKCS8(sa.private_key, "RS256");
  const now = Math.floor(Date.now() / 1000);
  const assertion = await new SignJWT({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: TOKEN_URL,
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);

  const tokenResponse = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!tokenResponse.ok) throw new Error(`Google OAuth failed: ${tokenResponse.status}`);
  const token = await tokenResponse.json();
  cachedToken = { value: token.access_token, expiresAt: Date.now() + (Number(token.expires_in || 3600) * 1000) };
  return cachedToken.value;
}

function rangeFor(name: string) {
  const now = new Date();
  const y = now.getUTCFullYear(), m = now.getUTCMonth();
  const pad = (n: number) => String(n).padStart(2, "0");
  const day = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}`;
  const firstCurrent = new Date(Date.UTC(y, m, 1));
  const firstPrevious = new Date(Date.UTC(y, m - 1, 1));
  const lastPrevious = new Date(Date.UTC(y, m, 0));
  switch (name) {
    case "last_7_days": return { startDate: "7daysAgo", endDate: "yesterday" };
    case "this_month_inc": return { startDate: day(firstCurrent), endDate: "today" };
    case "last_month": return { startDate: day(firstPrevious), endDate: day(lastPrevious) };
    default: return { startDate: "30daysAgo", endDate: "yesterday" };
  }
}

async function runReport(body: Record<string, unknown>) {
  const token = await accessToken();
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`GA runReport failed: ${response.status} ${detail.slice(0, 300)}`);
  }
  return await response.json();
}

function rows(report: any) {
  return (report.rows || []).map((row: any) => {
    const dims = (row.dimensionValues || []).map((x: any) => x.value);
    const mets = (row.metricValues || []).map((x: any) => x.value);
    return { dims, mets };
  });
}

function num(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

async function reportSet(rangeName: string) {
  const range = rangeFor(rangeName);
  const base = { dateRanges: [range] };

  const [totals, daily, pages, countries, cities] = await Promise.all([
    runReport({
      ...base,
      metrics: [
        { name: "totalUsers" }, { name: "activeUsers" }, { name: "sessions" },
        { name: "screenPageViews" }, { name: "engagementRate" },
      ],
    }),
    runReport({
      ...base,
      dimensions: [{ name: "date" }],
      metrics: [
        { name: "totalUsers" }, { name: "activeUsers" }, { name: "sessions" },
        { name: "screenPageViews" }, { name: "engagementRate" },
      ],
      orderBys: [{ dimension: { dimensionName: "date" } }],
      limit: "1000",
    }),
    runReport({
      ...base,
      dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
      metrics: [{ name: "totalUsers" }, { name: "screenPageViews" }],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: "20",
    }),
    runReport({
      ...base,
      dimensions: [{ name: "country" }],
      metrics: [{ name: "totalUsers" }, { name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: "15",
    }),
    runReport({
      ...base,
      dimensions: [{ name: "city" }],
      metrics: [{ name: "totalUsers" }, { name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: "30",
    }),
  ]);

  const t = rows(totals)[0]?.mets || [];
  return {
    rangeLabel: ({ last_7_days: "Últimos 7 dias", this_month_inc: "Este mês", last_month: "Mês anterior", last_30_days: "Últimos 30 dias" } as any)[rangeName] || "Últimos 30 dias",
    totals: {
      totalUsers: num(t[0]), activeUsers: num(t[1]), sessions: num(t[2]),
      views: num(t[3]), engagementRate: num(t[4]),
    },
    daily: rows(daily).map((r: any) => ({
      date: r.dims[0], dateLabel: r.dims[0], totalUsers: num(r.mets[0]),
      activeUsers: num(r.mets[1]), sessions: num(r.mets[2]), views: num(r.mets[3]),
      engagementRate: num(r.mets[4]),
    })),
    pages: rows(pages).map((r: any) => ({
      label: r.dims[0], path: r.dims[0], title: r.dims[1],
      activeUsers: num(r.mets[0]), views: num(r.mets[1]),
    })),
    countries: rows(countries).map((r: any) => ({ name: r.dims[0], activeUsers: num(r.mets[0]), sessions: num(r.mets[1]) })),
    cities: rows(cities).map((r: any) => ({ name: r.dims[0], activeUsers: num(r.mets[0]), sessions: num(r.mets[1]) })),
  };
}

async function historical() {
  const [monthly, total] = await Promise.all([
    runReport({
      dateRanges: [{ startDate: "2015-08-14", endDate: "yesterday" }],
      dimensions: [{ name: "yearMonth" }],
      metrics: [{ name: "totalUsers" }, { name: "sessions" }, { name: "screenPageViews" }],
      orderBys: [{ dimension: { dimensionName: "yearMonth" } }],
      limit: "100",
    }),
    runReport({
      dateRanges: [{ startDate: "2026-01-01", endDate: "yesterday" }],
      metrics: [{ name: "totalUsers" }, { name: "activeUsers" }, { name: "sessions" }, { name: "screenPageViews" }],
    }),
  ]);
  const t = rows(total)[0]?.mets || [];
  return {
    monthly: rows(monthly).map((r: any) => ({ label: r.dims[0], totalUsers: num(r.mets[0]), sessions: num(r.mets[1]), views: num(r.mets[2]) })),
    historicalTotal: { totalUsers: num(t[0]), activeUsers: num(t[1]), sessions: num(t[2]), views: num(t[3]) },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "GET") return json({ error: "method_not_allowed" }, 405);

  const origin = req.headers.get("origin");
  if (origin && origin !== ALLOWED_ORIGIN) return json({ error: "forbidden_origin" }, 403);

  try {
    const url = new URL(req.url);
    const requestedRange = url.searchParams.get("range") || "last_30_days";
    const allowed = new Set(["last_30_days", "last_7_days", "this_month_inc", "last_month"]);
    const range = allowed.has(requestedRange) ? requestedRange : "last_30_days";

    const cached = responseCache.get(range);
    if (cached && cached.expiresAt > Date.now()) return json(cached.value);

    const [selected, r7, r30, current, previous, hist] = await Promise.all([
      reportSet(range),
      reportSet("last_7_days"),
      reportSet("last_30_days"),
      reportSet("this_month_inc"),
      reportSet("last_month"),
      historical(),
    ]);

    const daily = selected.daily;
    const payload = {
      version: 2,
      generatedAt: new Date().toISOString(),
      source: "Google Analytics 4 Data API",
      property: PROPERTY_ID,
      range,
      rangeLabel: selected.rangeLabel,
      totals: selected.totals,
      periods: {
        today: { activeUsers: daily.at(-1)?.activeUsers || 0 },
        last7Days: { activeUsers: r7.totals.activeUsers },
        last30Days: { activeUsers: r30.totals.activeUsers },
      },
      daily,
      pages: selected.pages,
      countries: selected.countries,
      cities: selected.cities,
      visitors: {
        daily,
        monthly: hist.monthly,
        historicalTotal: hist.historicalTotal,
        lastMonth: previous.totals,
        last7Days: r7.totals,
        today: daily.at(-1) || {},
      },
      ranges: {
        last_30_days: { totals: r30.totals },
        last_7_days: { totals: r7.totals },
        this_month_inc: { totals: current.totals },
        last_month: { totals: previous.totals },
      },
    };

    responseCache.set(range, { value: payload, expiresAt: Date.now() + 5 * 60 * 1000 });
    return json(payload);
  } catch (error) {
    console.error("analytics-metrics:", error);
    return json({ error: "analytics_unavailable" }, 503);
  }
});