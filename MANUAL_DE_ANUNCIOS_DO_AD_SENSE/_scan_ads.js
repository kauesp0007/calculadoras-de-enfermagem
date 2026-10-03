// Scaneia blocos de anúncio AdSense em todas as páginas HTML.
// Exclui pastas proibidas por regras. Saída: JSON + resumo em console.
const fs = require("fs");
const path = require("path");

const ROOT = "c:\\calculadoras-de-enfermagem";
const SKIP_DIRS = new Set([
    "node_modules", ".git", "backups-temporarios",
    "downloads", "biblioteca", "blog", "blog-templates",
    "MANUAL_DE_ANUNCIOS_DO_AD_SENSE", ".github", ".codex", ".claude", ".agents"
]);
const LANG_DIRS = new Set([
    "en", "es", "de", "it", "fr", "hi", "zh", "ar", "ja", "ru", "ko", "tr", "nl", "pl", "sv", "id", "vi", "uk"
]);

const AD_CLIENT = "ca-pub-6472730056006847";
const CONTROLLED_SLOTS = {
    "2979726942": "post-hero",
    "5690484911": "pre-result",
    "3341197364": "multiplex"
};

function walk(dir, out) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
    catch (e) { return; }
    for (const e of entries) {
        if (e.name.startsWith(".")) continue;
        const full = path.join(dir, e.name);
        if (e.isDirectory()) {
            if (SKIP_DIRS.has(e.name)) continue;
            walk(full, out);
        } else if (e.name.endsWith(".html")) {
            out.push(full);
        }
    }
}

function extractAds(html) {
    const ads = [];
    // <ins ... class="...adsbygoogle..." ...> ... </ins>
    const re = /<ins\b[^>]*class="[^"]*adsbygoogle[^"]*"[^>]*>/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
        const tag = m[0];
        const get = (attr) => {
            const r = new RegExp(attr + '="([^"]*)"', "i");
            const mm = tag.match(r);
            return mm ? mm[1] : null;
        };
        ads.push({
            client: get("data-ad-client"),
            slot: get("data-ad-slot"),
            format: get("data-ad-format"),
            matched: get("data-matched-content-ui-type") !== null,
            fullwidth: get("data-full-width-responsive") !== null
        });
    }
    // conta os <ins class="adsbygoogle"> sem fechamento inline (self-contained acima já cobre)
    return ads;
}

function analyze(html, rel) {
    const ads = extractAds(html);
    const hasMultiplexAside = /id=["']multiplex-ad-reserved["']/i.test(html);
    const hasControlledDiv = /controlled-(display|multiplex)-ad/.test(html);
    return { ads, hasMultiplexAside, hasControlledDiv };
}

// Whitelist: só páginas reais do site (ignora backups, build, catálogos, etc.)
const SCAN_ROOTS = [
    "",                                  // raiz (pt-BR)
    "escalas-de-enfermagem",
    "conta",
    "concurso_publico",
    ...LANG_DIRS                          // 18 idiomas
];

function collectFiles() {
    const files = [];
    // raiz: só arquivos .html diretos (sem recursão)
    for (const e of fs.readdirSync(ROOT, { withFileTypes: true })) {
        if (e.isFile() && e.name.endsWith(".html")) {
            files.push(path.join(ROOT, e.name));
        }
    }
    // subpastas de páginas reais
    for (const sub of SCAN_ROOTS) {
        if (!sub) continue;
        const dir = path.join(ROOT, sub);
        if (!fs.existsSync(dir)) continue;
        walk(dir, files);
    }
    return files;
}

function main() {
    const files = collectFiles();

    const perFile = [];
    const slotMap = {};      // slot -> { count, pages:Set, format:Set }
    const formatMap = {};    // format -> count
    const clientMap = {};    // client -> count
    let totalAds = 0;
    let pagesWithAds = 0;

    for (const f of files) {
        const rel = path.relative(ROOT, f).replace(/\\/g, "/");
        const html = fs.readFileSync(f, "utf8");
        const res = analyze(html, rel);
        if (res.ads.length === 0 && !res.hasMultiplexAside) continue;

        pagesWithAds++;
        totalAds += res.ads.length;

        const parts = rel.split("/");
        const lang = LANG_DIRS.has(parts[0]) ? parts[0] : "root(pt-BR)";
        const filename = parts[parts.length - 1];

        const slots = res.ads.map((a) => a.slot).filter(Boolean);
        const formats = res.ads.map((a) => a.format).filter(Boolean);

        // status heurístico
        let status = "ok";
        const reasons = [];
        for (const a of res.ads) {
            if (!a.client) { reasons.push("sem data-ad-client"); }
            else if (a.client !== AD_CLIENT) { reasons.push("client divergente: " + a.client); }
            if (!a.slot) reasons.push("sem data-ad-slot");
            if (!a.format) reasons.push("sem data-ad-format");
        }
        if (reasons.length) status = "incompleto";

        perFile.push({
            lang, filename, rel,
            adCount: res.ads.length,
            slots: [...new Set(slots)],
            formats: [...new Set(formats)],
            hasMultiplexAside: res.hasMultiplexAside,
            hasControlledDiv: res.hasControlledDiv,
            status,
            reasons: [...new Set(reasons)]
        });

        for (const a of res.ads) {
            if (a.slot) {
                if (!slotMap[a.slot]) slotMap[a.slot] = { count: 0, pages: new Set(), format: new Set() };
                slotMap[a.slot].count++;
                slotMap[a.slot].pages.add(rel);
                if (a.format) slotMap[a.slot].format.add(a.format);
            }
            if (a.format) formatMap[a.format] = (formatMap[a.format] || 0) + 1;
            const c = a.client || "(ausente)";
            clientMap[c] = (clientMap[c] || 0) + 1;
        }
    }

    // agrupa por idioma
    const byLang = {};
    for (const p of perFile) {
        byLang[p.lang] = (byLang[p.lang] || 0) + 1;
    }

    const slotsSummary = Object.keys(slotMap).map((s) => ({
        slot: s,
        name: CONTROLLED_SLOTS[s] || "(legado/não-controlado)",
        count: slotMap[s].count,
        pages: slotMap[s].pages.size,
        formats: [...slotMap[s].format]
    }));

    const report = {
        generatedAt: new Date().toISOString(),
        adClient: AD_CLIENT,
        totalHtmlFilesScanned: files.length,
        pagesWithAds,
        totalAdBlocks: totalAds,
        byLanguage: byLang,
        slots: slotsSummary,
        formats: formatMap,
        clients: clientMap,
        perFile
    };

    fs.writeFileSync(
        path.join(ROOT, "MANUAL_DE_ANUNCIOS_DO_AD_SENSE", "_scan_result.json"),
        JSON.stringify(report, null, 2),
        "utf8"
    );

    console.log("=== RESUMO ===");
    console.log("Arquivos HTML escaneados:", files.length);
    console.log("Páginas com anúncios:", pagesWithAds);
    console.log("Total de blocos <ins adsbygoogle>:", totalAds);
    console.log("\n=== SLOTS (unidades de anúncio) ===");
    slotsSummary.forEach((s) =>
        console.log(`slot ${s.slot} [${s.name}] x${s.count} em ${s.pages} páginas | format: ${s.formats.join(",")}`)
    );
    console.log("\n=== FORMATOS ===");
    console.log(JSON.stringify(formatMap, null, 2));
    console.log("\n=== CLIENTES ===");
    console.log(JSON.stringify(clientMap, null, 2));
    console.log("\n=== POR IDIOMA ===");
    console.log(JSON.stringify(byLang, null, 2));
    console.log("\n=== PÁGINAS COM STATUS 'incompleto' ===");
    perFile.filter((p) => p.status !== "ok").forEach((p) =>
        console.log(`${p.rel} -> ${p.reasons.join("; ")}`)
    );
}

main();
