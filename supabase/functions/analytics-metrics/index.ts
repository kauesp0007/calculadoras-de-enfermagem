import { SignJWT, importPKCS8 } from "npm:jose@6.0.10";

const PROPERTY_ID = "522498030";
const SERVICE_ACCOUNT_SECRET = "GOOGLE_ANALYTICS_SERVICE_ACCOUNT_JSON";
const ALLOWED_ORIGIN = "https://www.calculadorasdeenfermagem.com.br";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API_URL = `https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY_ID}:runReport`;
const REALTIME_API_URL = `https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY_ID}:runRealtimeReport`;

const GA_TIME_ZONE = "America/Sao_Paulo";
const SUBSCRIPTION_EVENT_NAMES = [
  "click_menu_assine_ja",
  "subscription_page_view",
  "subscription_login_required",
  "subscription_login_completed",
  "subscription_post_login_redirect",
  "subscription_checkout_click",
  "subscription_checkout_request",
  "subscription_checkout_created",
  "subscription_checkout_redirect",
  "subscription_payment_pending",
  "subscription_checkout_cancel",
  "subscription_payment_cancelled",
  "subscription_payment_expired",
  "subscription_payment_return_success",
  "subscription_payment_success",
  "subscription_checkout_error",
  "subscription_page_error",
];

const cors = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json; charset=utf-8",
  "Vary": "Origin",
};

let cachedToken: { value: string; expiresAt: number } | null = null;
const responseCache = new Map<string, { value: unknown; expiresAt: number }>();

// Limita as chamadas simultâneas ao GA4 e reduz respostas 429 por quota.
const MAX_CONCURRENT_GA_REQUESTS = 3;
let activeGARequests = 0;
const gaWaiters: Array<() => void> = [];

async function withGASlot<T>(fn: () => Promise<T>): Promise<T> {
  if (activeGARequests >= MAX_CONCURRENT_GA_REQUESTS) {
    await new Promise<void>((resolve) => gaWaiters.push(resolve));
  }
  activeGARequests++;
  try {
    return await fn();
  } finally {
    activeGARequests--;
    gaWaiters.shift()?.();
  }
}

function json(data: unknown, status = 200, maxAge = 300) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Cache-Control": `public, max-age=${maxAge}, s-maxage=${maxAge}` },
  });
}

function jsonNoStore(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Cache-Control": "private, no-store, max-age=0", "Pragma": "no-cache", "Expires": "0" },
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
  return await withGASlot(async () => {
    let lastStatus = 0;
    let lastDetail = "";
    for (let attempt = 0; attempt < 3; attempt++) {
      const token = await accessToken();
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (response.ok) return await response.json();
      lastStatus = response.status;
      lastDetail = (await response.text()).slice(0, 300);
      if (response.status !== 429 && response.status !== 503) break;
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
    throw new Error(`GA runReport failed: ${lastStatus} ${lastDetail}`);
  });
}

async function runRealtimeReport(body: Record<string, unknown>) {
  return await withGASlot(async () => {
    let lastStatus = 0;
    let lastDetail = "";
    for (let attempt = 0; attempt < 3; attempt++) {
      const token = await accessToken();
      const response = await fetch(REALTIME_API_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (response.ok) return await response.json();
      lastStatus = response.status;
      lastDetail = (await response.text()).slice(0, 300);
      if (response.status !== 429 && response.status !== 503) break;
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
    throw new Error(`GA runRealtimeReport failed: ${lastStatus} ${lastDetail}`);
  });
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

function zonedMinuteKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: GA_TIME_ZONE,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value || "00";
  return get("year") + get("month") + get("day") + get("hour") + get("minute");
}

function localMinuteIso(key: string) {
  if (!/^\d{12}$/.test(key)) return null;
  return key.slice(0,4) + "-" + key.slice(4,6) + "-" + key.slice(6,8) + "T" + key.slice(8,10) + ":" + key.slice(10,12);
}

function localMinuteLabel(key: string) {
  if (!/^\d{12}$/.test(key)) return "—";
  return key.slice(6,8) + "/" + key.slice(4,6) + "/" + key.slice(0,4) + " " + key.slice(8,10) + ":" + key.slice(10,12);
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

const AUDIENCE_GROUPS = [
  { key: "us", label: "Estados Unidos", countries: ["US"] },
  { key: "latin", label: "América Latina e Caribe", countries: ["AR","BO","BR","BZ","CL","CO","CR","CU","DO","EC","GF","GT","GY","HN","HT","MX","NI","PA","PE","PR","PY","SR","SV","UY","VE"] },
  { key: "de", label: "Alemanha", countries: ["DE"] },
  { key: "fr", label: "França", countries: ["FR"] },
  { key: "es", label: "Espanha", countries: ["ES"] },
  { key: "pt", label: "Portugal", countries: ["PT"] },
  { key: "cn", label: "China, Hong Kong e Macau", countries: ["CN","HK","MO"] },
  { key: "jp", label: "Japão", countries: ["JP"] },
  { key: "ru", label: "Rússia", countries: ["RU"] },
  { key: "it", label: "Itália", countries: ["IT"] },
];

async function realtime() {
  const [countriesReport, eventsReport] = await Promise.all([
    runRealtimeReport({
      dimensions: [{ name: "countryId" }, { name: "country" }],
      metrics: [{ name: "activeUsers" }, { name: "eventCount" }, { name: "screenPageViews" }],
      orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      limit: "300",
      minuteRanges: [{ name: "ultimos_30_minutos", startMinutesAgo: 29, endMinutesAgo: 0 }],
    }),
    runRealtimeReport({
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
      limit: "25",
      minuteRanges: [{ name: "ultimos_30_minutos", startMinutesAgo: 29, endMinutesAgo: 0 }],
    }),
  ]);

  const countries = rows(countriesReport).map((r: any) => ({
    code: String(r.dims[0] || "").toUpperCase(),
    name: r.dims[1] || "(não definido)",
    activeUsers: num(r.mets[0]),
    eventCount: num(r.mets[1]),
    views: num(r.mets[2]),
  }));
  const assigned = new Set<string>();
  const audienceGroups = AUDIENCE_GROUPS.map((group) => {
    const selected = countries.filter((country) => group.countries.includes(country.code));
    selected.forEach((country) => assigned.add(country.code));
    return {
      key: group.key,
      label: group.label,
      activeUsers: selected.reduce((sum, country) => sum + country.activeUsers, 0),
      eventCount: selected.reduce((sum, country) => sum + country.eventCount, 0),
      views: selected.reduce((sum, country) => sum + country.views, 0),
      countries: selected,
    };
  });
  const otherCountries = countries.filter((country) => !assigned.has(country.code));
  audienceGroups.push({
    key: "other",
    label: "Outros países",
    activeUsers: otherCountries.reduce((sum, country) => sum + country.activeUsers, 0),
    eventCount: otherCountries.reduce((sum, country) => sum + country.eventCount, 0),
    views: otherCountries.reduce((sum, country) => sum + country.views, 0),
    countries: otherCountries,
  });

  const events = rows(eventsReport).map((r: any) => ({
    name: r.dims[0] || "(não definido)",
    eventCount: num(r.mets[0]),
  }));
  return {
    windowMinutes: 30,
    activeUsers: countries.reduce((sum, country) => sum + country.activeUsers, 0),
    eventCount: countries.reduce((sum, country) => sum + country.eventCount, 0),
    views: countries.reduce((sum, country) => sum + country.views, 0),
    countries,
    audienceGroups,
    events,
  };
}

async function subscription24h() {
  const report = await runReport({
    dateRanges: [{ startDate: "1daysAgo", endDate: "today" }],
    dimensions: [{ name: "eventName" }, { name: "dateHourMinute" }],
    metrics: [{ name: "eventCount" }],
    dimensionFilter: {
      filter: {
        fieldName: "eventName",
        stringFilter: {
          matchType: "FULL_REGEXP",
          value: "^(click_menu_assine_ja|subscription_.*)$",
          caseSensitive: true,
        },
      },
    },
    orderBys: [{ dimension: { dimensionName: "dateHourMinute" }, desc: true }],
    limit: "5000",
  });

  const now = new Date();
  const startKey = zonedMinuteKey(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  const endKey = zonedMinuteKey(now);
  const buckets = rows(report).map((r: any) => ({
    name: String(r.dims[0] || ""),
    minuteKey: String(r.dims[1] || ""),
    eventCount: num(r.mets[0]),
  })).filter((row: any) =>
    row.name && /^\d{12}$/.test(row.minuteKey) &&
    row.minuteKey >= startKey && row.minuteKey <= endKey
  );

  const totals = new Map<string, { eventCount: number; lastKey: string | null }>();
  for (const name of SUBSCRIPTION_EVENT_NAMES) totals.set(name, { eventCount: 0, lastKey: null });
  for (const bucket of buckets) {
    const item = totals.get(bucket.name) || { eventCount: 0, lastKey: null };
    item.eventCount += bucket.eventCount;
    if (!item.lastKey || bucket.minuteKey > item.lastKey) item.lastKey = bucket.minuteKey;
    totals.set(bucket.name, item);
  }

  const extraNames = [...totals.keys()].filter((name) => !SUBSCRIPTION_EVENT_NAMES.includes(name)).sort();
  const orderedNames = [...SUBSCRIPTION_EVENT_NAMES, ...extraNames];
  const events = orderedNames.map((name) => {
    const item = totals.get(name) || { eventCount: 0, lastKey: null };
    return {
      name,
      eventCount: item.eventCount,
      lastOccurrence: item.lastKey ? localMinuteIso(item.lastKey) : null,
      lastOccurrenceLabel: item.lastKey ? localMinuteLabel(item.lastKey) : "—",
    };
  });

  return {
    windowHours: 24,
    timezone: GA_TIME_ZONE,
    from: localMinuteIso(startKey),
    fromLabel: localMinuteLabel(startKey),
    to: localMinuteIso(endKey),
    toLabel: localMinuteLabel(endKey),
    events,
    timeline: buckets.slice(0, 40).map((bucket: any) => ({
      name: bucket.name,
      eventCount: bucket.eventCount,
      occurredAt: localMinuteIso(bucket.minuteKey),
      occurredAtLabel: localMinuteLabel(bucket.minuteKey),
    })),
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
    const mode = url.searchParams.get("mode") || "standard";
    if (mode === "realtime") {
      const cacheKey = "realtime";
      const cachedRealtime = responseCache.get(cacheKey);
      if (cachedRealtime && cachedRealtime.expiresAt > Date.now()) return json(cachedRealtime.value, 200, 15);
      const live = await realtime();
      const realtimePayload = {
        version: 2,
        generatedAt: new Date().toISOString(),
        source: "Google Analytics 4 Realtime Data API",
        property: PROPERTY_ID,
        realtime: live,
      };
      responseCache.set(cacheKey, { value: realtimePayload, expiresAt: Date.now() + 30 * 1000 });
      return json(realtimePayload, 200, 15);
    }

    if (mode === "subscription_24h") {
      const forceFresh = url.searchParams.get("fresh") === "1";
      const cacheKey = "subscription_24h";
      const cachedSubscription = responseCache.get(cacheKey);
      if (!forceFresh && cachedSubscription && cachedSubscription.expiresAt > Date.now()) return json(cachedSubscription.value, 200, 30);
      const funnel24h = await subscription24h();
      const subscriptionPayload = {
        version: 2,
        generatedAt: new Date().toISOString(),
        source: "Google Analytics 4 Data API",
        property: PROPERTY_ID,
        subscription24h: funnel24h,
      };
      if (forceFresh) return jsonNoStore(subscriptionPayload);
      responseCache.set(cacheKey, { value: subscriptionPayload, expiresAt: Date.now() + 60 * 1000 });
      return json(subscriptionPayload, 200, 30);
    }

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