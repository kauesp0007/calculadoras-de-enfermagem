// Script: renomeia o título do card "Diagnósticos NANDA Sugeridos" para
// "Exemplificando com a NANDA: ..." e adiciona disclaimer educativo no final
// do card NANDA (visível + template de impressão/PDF), em todas as escalas
// da raiz (pt-BR) e nas 18 pastas de idioma (traduzido).
//
// Uso:
//   node scripts/renomear-nanda-educativo.js --dry     (apenas relata, não escreve)
//   node scripts/renomear-nanda-educativo.js --apply   (faz backup + escreve)

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DRY = process.argv.includes('--dry');
const APPLY = process.argv.includes('--apply');

if (!DRY && !APPLY) {
    console.log('Informe --dry ou --apply');
    process.exit(0);
}

// Idiomas (pasta => chave de tradução). '' = raiz (pt-BR).
const LANG_DIRS = {
    '': 'pt',
    ar: 'ar', de: 'de', en: 'en', es: 'es', fr: 'fr', hi: 'hi', id: 'id',
    it: 'it', ja: 'ja', ko: 'ko', nl: 'nl', pl: 'pl', ru: 'ru', sv: 'sv',
    tr: 'tr', uk: 'uk', vi: 'vi', zh: 'zh'
};

// Dicionário de tradução (título + disclaimer) por idioma.
const T = {
    pt: {
        titulo: `Exemplificando com a NANDA: Diagnósticos da NANDA relacionados aos problemas levantados (Caráter educativo)`,
        disclaimer: `O diagnóstico NANDA necessita de uma avaliação criteriosa de suas taxonomias, da busca das características e relações. A divulgação de diagnósticos nesta escala tem apenas a função educativa de promover o seu uso e conhecer seus diversos diagnósticos. Em nenhuma hipótese, induzir o usuário a usar indiscriminadamente qualquer diagnóstico de enfermagem sem o apoio aos achados clínicos obtidos através da anamnese, do exame físico e de outras ferramentas sistemáticas que levarão o enfermeiro a fazer a prescrição de cuidados.`
    },
    en: {
        titulo: `Exemplifying with NANDA: NANDA diagnoses related to the identified problems (Educational purpose)`,
        disclaimer: `A NANDA diagnosis requires a careful evaluation of its taxonomies and the search for defining characteristics and related factors. The disclosure of diagnoses on this scale serves only an educational purpose, to promote its use and help users become familiar with the various diagnoses. Under no circumstances should it induce the user to indiscriminately apply any nursing diagnosis without the support of clinical findings obtained through history taking, physical examination, and other systematic tools that will guide the nurse in prescribing care.`
    },
    es: {
        titulo: `Ejemplificando con la NANDA: Diagnósticos NANDA relacionados con los problemas identificados (Carácter educativo)`,
        disclaimer: `El diagnóstico NANDA requiere una evaluación cuidadosa de sus taxonomías y la búsqueda de las características definitorias y factores relacionados. La divulgación de diagnósticos en esta escala tiene únicamente una función educativa, para promover su uso y dar a conocer sus diversos diagnósticos. En ningún caso debe inducir al usuario a aplicar indiscriminadamente cualquier diagnóstico de enfermería sin el respaldo de los hallazgos clínicos obtenidos mediante la anamnesis, el examen físico y otras herramientas sistemáticas que guiarán al enfermero en la prescripción de cuidados.`
    },
    de: {
        titulo: `Veranschaulichung mit NANDA: NANDA-Diagnosen im Zusammenhang mit den identifizierten Problemen (Bildungszweck)`,
        disclaimer: `Eine NANDA-Diagnose erfordert eine sorgfältige Bewertung ihrer Taxonomien und die Suche nach definierenden Merkmalen und verwandten Faktoren. Die Darstellung von Diagnosen in dieser Skala dient ausschließlich Bildungszwecken, um ihre Anwendung zu fördern und die verschiedenen Diagnosen bekannt zu machen. Sie darf den Nutzer in keinem Fall dazu verleiten, eine Pflegediagnose wahllos anzuwenden, ohne sich auf klinische Befunde aus Anamnese, körperlicher Untersuchung und anderen systematischen Instrumenten zu stützen, die die Pflegekraft bei der Pflegeplanung leiten.`
    },
    fr: {
        titulo: `Illustration avec la NANDA : diagnostics NANDA liés aux problèmes identifiés (Objectif éducatif)`,
        disclaimer: `Un diagnostic NANDA nécessite une évaluation rigoureuse de ses taxonomies et la recherche des caractéristiques déterminantes et des facteurs favorisants. La diffusion de diagnostics dans cette échelle a uniquement une fonction éducative, visant à promouvoir son utilisation et à faire connaître ses différents diagnostics. Elle ne doit en aucun cas inciter l'utilisateur à appliquer sans discernement un diagnostic infirmier sans s'appuyer sur les données cliniques recueillies par l'anamnèse, l'examen physique et d'autres outils systématiques qui guideront l'infirmier dans la prescription des soins.`
    },
    it: {
        titulo: `Esemplificando con la NANDA: diagnosi NANDA correlate ai problemi rilevati (Finalità educativa)`,
        disclaimer: `La diagnosi NANDA richiede una valutazione attenta delle sue tassonomie e la ricerca delle caratteristiche definenti e dei fattori correlati. La divulgazione delle diagnosi in questa scala ha esclusivamente una funzione educativa, per promuoverne l'uso e far conoscere le diverse diagnosi. In nessun caso deve indurre l'utente ad applicare indiscriminatamente una diagnosi infermieristica senza il supporto dei reperti clinici ottenuti tramite anamnesi, esame obiettivo e altri strumenti sistematici che guideranno l'infermiere nella prescrizione delle cure.`
    },
    hi: {
        titulo: `NANDA के साथ उदाहरण: पहचानी गई समस्याओं से संबंधित NANDA निदान (शैक्षिक उद्देश्य)`,
        disclaimer: `NANDA निदान के लिए उसकी वर्गीकरण प्रणालियों का सावधानीपूर्वक मूल्यांकन तथा परिभाषित विशेषताओं और संबंधित कारकों की खोज आवश्यक है। इस पैमाने में निदानों का प्रदर्शन केवल शैक्षिक उद्देश्य से है, ताकि इसके उपयोग को बढ़ावा दिया जा सके और विभिन्न निदानों से परिचित कराया जा सके। किसी भी परिस्थिति में इसे उपयोगकर्ता को, इतिहास लेने, शारीरिक परीक्षण और अन्य व्यवस्थित उपकरणों से प्राप्त नैदानिक निष्कर्षों के समर्थन के बिना, किसी भी नर्सिंग निदान का अंधाधुंध उपयोग करने के लिए प्रेरित नहीं करना चाहिए; ये उपकरण नर्स को देखभाल निर्धारित करने में मार्गदर्शन करेंगे।`
    },
    zh: {
        titulo: `以NANDA为例：与已识别问题相关的NANDA护理诊断（教育目的）`,
        disclaimer: `NANDA护理诊断需要对其分类体系以及定义性特征和相关因素进行审慎评估。本量表中诊断的展示仅具教育功能，旨在促进其使用并帮助了解各类诊断。在任何情况下，均不得诱导使用者未依据通过病史采集、体格检查及其他系统性工具所获得的临床发现，而任意使用任何护理诊断。这些工具将引导护士制定护理措施。`
    },
    ar: {
        titulo: `التوضيح باستخدام NANDA: تشخيصات NANDA المرتبطة بالمشكلات التي تم تحديدها (غرض تعليمي)`,
        disclaimer: `يتطلب تشخيص NANDA تقييماً دقيقاً لتصنيفاته والبحث عن الخصائص المحددة والعوامل المرتبطة بها. إن عرض التشخيصات في هذا المقياس له وظيفة تعليمية فقط، بهدف تعزيز استخدامه والتعرف على تشخيصاته المختلفة. ولا ينبغي بأي حال من الأحوال أن يدفع المستخدم إلى استخدام أي تشخيص تمريضي بشكل عشوائي دون الاستناد إلى النتائج السريرية التي يتم الحصول عليها من خلال أخذ التاريخ المرضي والفحص البدني وغيرها من الأدوات المنهجية التي ستقود الممرض إلى وصف الرعاية.`
    },
    ja: {
        titulo: `NANDAによる例示：特定された問題に関連するNANDA看護診断（教育目的）`,
        disclaimer: `NANDA看護診断には、その分類体系ならびに診断指標（特徴）および関連因子の慎重な評価が必要です。本スケールにおける診断の提示は、その活用を促進し、さまざまな診断を知っていただくための教育目的のみを有します。いかなる場合も、病歴聴取、身体診察、その他の体系的なツールによって得られた臨床所見の裏付けなしに、看護診断を無差別に使用するよう利用者を誘導してはなりません。これらのツールは、看護師がケアを計画する際の指針となります。`
    },
    ru: {
        titulo: `Пример с NANDA: диагнозы NANDA, связанные с выявленными проблемами (Образовательная цель)`,
        disclaimer: `Диагноз NANDA требует тщательной оценки его таксономий и поиска определяющих признаков и связанных факторов. Демонстрация диагнозов в данной шкале носит исключительно образовательную функцию — способствовать использованию и знакомству с различными диагнозами. Ни при каких обстоятельствах это не должно побуждать пользователя к необдуманному применению любого сестринского диагноза без опоры на клинические данные, полученные в ходе сбора анамнеза, физикального обследования и других систематических инструментов, которые приведут медсестру к назначению ухода.`
    },
    ko: {
        titulo: `NANDA 예시: 확인된 문제와 관련된 NANDA 간호진단 (교육 목적)`,
        disclaimer: `NANDA 간호진단은 분류 체계와 정의적 특성 및 관련 요인에 대한 신중한 평가가 필요합니다. 본 척도에서의 진단 제시는 사용을 장려하고 다양한 진단을 알리기 위한 교육적 목적만을 가집니다. 어떠한 경우에도 병력 청취, 신체검진 및 기타 체계적인 도구를 통해 얻은 임상 소견의 뒷받침 없이 간호진단을 무분별하게 사용하도록 사용자를 유도해서는 안 됩니다. 이러한 도구는 간호사가 간호를 처방하는 데 지침이 됩니다.`
    },
    tr: {
        titulo: `NANDA ile örneklendirme: belirlenen sorunlarla ilişkili NANDA tanıları (Eğitim amaçlı)`,
        disclaimer: `NANDA tanısı, sınıflandırma sistemlerinin ve tanımlayıcı özellikler ile ilişkili faktörlerin dikkatli bir şekilde değerlendirilmesini gerektirir. Bu ölçekte tanıların gösterilmesi, yalnızca kullanımını teşvik etmek ve çeşitli tanıları tanıtmak amacıyla eğitim amaçlıdır. Hiçbir koşulda, öykü alma, fizik muayene ve hemşireyi bakım planlamasına yönlendirecek diğer sistematik araçlarla elde edilen klinik bulguların desteği olmaksızın, kullanıcıyı herhangi bir hemşirelik tanısını gelişigüzel kullanmaya teşvik etmemelidir.`
    },
    nl: {
        titulo: `Voorbeeld met NANDA: NANDA-diagnoses gerelateerd aan de vastgestelde problemen (Educatief doel)`,
        disclaimer: `Een NANDA-diagnose vereist een zorgvuldige evaluatie van de taxonomieën en het zoeken naar bepalende kenmerken en gerelateerde factoren. De weergave van diagnoses in deze schaal heeft uitsluitend een educatieve functie, om het gebruik te bevorderen en de verschillende diagnoses te leren kennen. Het mag de gebruiker in geen geval aanzetten tot het ondoordacht toepassen van een verpleegkundige diagnose zonder ondersteuning van klinische bevindingen verkregen via anamnese, lichamelijk onderzoek en andere systematische instrumenten die de verpleegkundige leiden bij het voorschrijven van zorg.`
    },
    pl: {
        titulo: `Przykład z NANDA: diagnozy NANDA związane ze zidentyfikowanymi problemami (Cel edukacyjny)`,
        disclaimer: `Diagnoza NANDA wymaga starannej oceny jej taksonomii oraz poszukiwania cech definiujących i czynników powiązanych. Prezentacja diagnoz w tej skali ma wyłącznie funkcję edukacyjną, mającą na celu promowanie jej stosowania i zapoznanie z różnymi diagnozami. W żadnym wypadku nie powinna skłaniać użytkownika do bezkrytycznego stosowania jakiejkolwiek diagnozy pielęgniarskiej bez oparcia na danych klinicznych uzyskanych w wywiadzie, badaniu fizykalnym i innych systematycznych narzędziach, które doprowadzą pielęgniarkę do ustalenia planu opieki.`
    },
    sv: {
        titulo: `Exempel med NANDA: NANDA-diagnoser relaterade till identifierade problem (Utbildningssyfte)`,
        disclaimer: `En NANDA-diagnos kräver en noggrann utvärdering av dess taxonomier och sökning efter definierande egenskaper och relaterade faktorer. Visningen av diagnoser i denna skala har enbart en utbildande funktion, för att främja användningen och göra de olika diagnoserna kända. Den får under inga omständigheter förmå användaren att urskillningslöst tillämpa någon omvårdnadsdiagnos utan stöd av kliniska fynd som erhållits genom anamnes, fysisk undersökning och andra systematiska verktyg som vägleder sjuksköterskan vid ordination av omvårdnad.`
    },
    id: {
        titulo: `Contoh dengan NANDA: diagnosis NANDA terkait masalah yang teridentifikasi (Tujuan edukatif)`,
        disclaimer: `Diagnosis NANDA memerlukan evaluasi yang cermat terhadap taksonominya serta pencarian karakteristik penentu dan faktor terkait. Penayangan diagnosis pada skala ini hanya memiliki fungsi edukatif, untuk mendorong penggunaannya dan mengenalkan berbagai diagnosisnya. Dalam keadaan apa pun, hal ini tidak boleh mendorong pengguna untuk sembarangan menerapkan diagnosis keperawatan apa pun tanpa dukungan temuan klinis yang diperoleh melalui anamnesis, pemeriksaan fisik, dan alat sistematis lainnya yang akan memandu perawat dalam merencanakan asuhan.`
    },
    vi: {
        titulo: `Minh họa với NANDA: chẩn đoán NANDA liên quan đến các vấn đề đã xác định (Mục đích giáo dục)`,
        disclaimer: `Chẩn đoán NANDA đòi hỏi đánh giá cẩn thận các phân loại của nó cũng như tìm kiếm các đặc điểm xác định và yếu tố liên quan. Việc hiển thị các chẩn đoán trong thang điểm này chỉ mang chức năng giáo dục, nhằm thúc đẩy việc sử dụng và giúp làm quen với các chẩn đoán khác nhau. Trong mọi trường hợp, không được khiến người dùng sử dụng bừa bãi bất kỳ chẩn đoán điều dưỡng nào mà không có sự hỗ trợ của các phát hiện lâm sàng thu được qua hỏi bệnh, khám thực thể và các công cụ hệ thống khác giúp điều dưỡng viên lập kế hoạch chăm sóc.`
    },
    uk: {
        titulo: `Приклад із NANDA: діагнози NANDA, пов'язані з виявленими проблемами (Освітня мета)`,
        disclaimer: `Діагноз NANDA вимагає ретельної оцінки його таксономій і пошуку визначальних ознак та пов'язаних факторів. Демонстрація діагнозів у цій шкалі має виключно освітню функцію — сприяти використанню та ознайомленню з різними діагнозами. У жодному разі це не повинно спонукати користувача до бездумного застосування будь-якого медсестринського діагнозу без опори на клінічні дані, отримані під час збору анамнезу, фізикального обстеження та інших систематичних інструментів, які приведуть медсестру до призначення догляду.`
    }
};

// Marcadores de idempotência (evitam inserir disclaimer duas vezes).
const MARK_VIS = 'nanda-disclaimer-screen';
const MARK_PRN = 'nanda-disclaimer-print';

// Substitui o texto do cabeçalho (h3 ou h4) do card NANDA, que precede o
// ul#lista-nanda, preservando eventuais ícones (<svg>/<span>) internos.
function replaceTitleH4(html, newTitle) {
    const marker = 'id="lista-nanda"';
    const idx = html.indexOf(marker);
    if (idx === -1) return { html, changed: false };
    const before = html.slice(0, idx);

    // localiza o último <h3 ou <h4 antes do ul#lista-nanda
    const h4 = before.lastIndexOf('<h4');
    const h3 = before.lastIndexOf('<h3');
    let tagStart = Math.max(h4, h3);
    if (tagStart === -1) return { html, changed: false };

    const gt = html.indexOf('>', tagStart);
    if (gt === -1) return { html, changed: false };

    const tag = html.slice(tagStart + 1, tagStart + 3); // 'h3' ou 'h4'
    const closeTag = `</${tag}>`;
    const closeIdx = html.indexOf(closeTag, gt);
    if (closeIdx === -1) return { html, changed: false };

    // salvaguarda: o cabeçalho deve estar no mesmo card (próximo do ul)
    if (idx - closeIdx > 3000) return { html, changed: false };

    const inner = html.slice(gt + 1, closeIdx);

    // Preserva <svg> e/ou <span class="ic"> internos; substitui só o texto.
    const spanEnd = inner.lastIndexOf('</span>');
    const svgEnd = inner.lastIndexOf('</svg>');
    let cutIdx = -1;
    let cutLen = 0;
    if (spanEnd !== -1 && spanEnd > svgEnd) {
        cutIdx = spanEnd;
        cutLen = 7; // '</span>'
    } else if (svgEnd !== -1) {
        cutIdx = svgEnd;
        cutLen = 6; // '</svg>'
    }

    let newInner;
    if (cutIdx === -1) {
        newInner = newTitle;
    } else {
        newInner = inner.slice(0, cutIdx + cutLen) + newTitle;
    }

    const old = inner.trim();
    if (old === newInner.trim()) return { html, changed: false };
    if (inner.replace(/<[^>]*>/g, '').trim() === newTitle.trim()) {
        // texto já é o desejado (só mudaria espaços) — evita reescrever
        return { html, changed: false };
    }

    return {
        html: html.slice(0, gt + 1) + newInner + html.slice(closeIdx),
        changed: true
    };
}

// Substitui o texto do sec-titulo (template de impressão) que precede nanda-box.
function replaceTitleSecTitulo(html, newTitle) {
    const re = /<div class="sec-titulo">[^<]*<\/div>(?=<div class="nanda-box">)/g;
    let changed = false;
    const out = html.replace(re, () => {
        changed = true;
        return `<div class="sec-titulo">${newTitle}</div>`;
    });
    return { html: out, changed };
}

// Insere disclaimer (visível) após o </ul> do ul#lista-nanda.
function insertDisclaimerVisible(html, disclaimer) {
    if (html.includes(MARK_VIS)) return { html, changed: false };
    const re = /(<ul id="lista-nanda"[^>]*>[\s\S]*?<\/ul>)/;
    const m = html.match(re);
    if (!m) return { html, changed: false };
    const block =
        `<p class="${MARK_VIS}" style="font-size:10px;line-height:1.5;color:#94A3B8;font-style:italic;margin:12px 0 0">${disclaimer}</p>`;
    return { html: html.replace(re, (full) => full + '\n' + block), changed: true };
}

// Insere disclaimer no template de impressão, após o </ul> do nanda-box.
function insertDisclaimerPrint(html, disclaimer) {
    if (html.includes(MARK_PRN)) return { html, changed: false };
    // cobre: template literal (${nandaHtml}), concatenação (' + nandaHtml + '),
    // multilinha e variáveis alternativas (nandaList), desde que dentro de nanda-box.
    const re = /<div class="nanda-box">[\s\S]*?<\/ul>/g;
    const block =
        `<p class="${MARK_PRN}" style="font-size:7pt;line-height:1.4;color:#94A3B8;font-style:italic;margin:8px 0 0">${disclaimer}</p>`;
    let changed = false;
    const out = html.replace(re, (m0) => {
        changed = true;
        return m0 + block;
    });
    return { html: out, changed };
}

function processFile(filePath, langKey) {
    const t = T[langKey];
    if (!t) return null;
    const raw = fs.readFileSync(filePath, 'utf8');
    if (!raw.includes('id="lista-nanda"') && !raw.includes('class="nanda-box"')) {
        return null; // não é uma escala com card NANDA
    }

    let html = raw;
    const results = {};

    const r1 = replaceTitleH4(html, t.titulo);
    html = r1.html;
    results.h4 = r1.changed;

    const r2 = replaceTitleSecTitulo(html, t.titulo);
    html = r2.html;
    results.secTitulo = r2.changed;

    const r3 = insertDisclaimerVisible(html, t.disclaimer);
    html = r3.html;
    results.discVisible = r3.changed;

    const r4 = insertDisclaimerPrint(html, t.disclaimer);
    html = r4.html;
    results.discPrint = r4.changed;

    // Fallback: substitui diretamente títulos em pt-BR que sobraram
    // (ex.: templates de impressão com classes CSS traduzidas, como
    //  "sec-title" ou "nanda框", onde o texto do título ficou em português).
    let fallbackChanged = false;
    for (const v of [
        'Diagnósticos NANDA Sugeridos (Top 6)',
        'Diagnósticos NANDA Sugeridos (6 Top)',
        'Diagnósticos NANDA Sugeridos (Perioperatórios)',
        'Diagnósticos NANDA-I Sugeridos',
        'Diagnósticos NANDA Relacionados'
    ]) {
        if (html.includes(v)) {
            html = html.split(v).join(t.titulo);
            fallbackChanged = true;
        }
    }
    results.fallback = fallbackChanged;

    return { filePath, html, results };
}

function main() {
    const ts = String(Date.now()).slice(0, 10);
    const backupRoot = path.join(ROOT, 'backups-temporarios', 'nanda-educativo-' + ts);

    let totalFiles = 0;
    let totalChanged = 0;
    const report = [];

    for (const [dir, langKey] of Object.entries(LANG_DIRS)) {
        const base = dir ? path.join(ROOT, dir) : ROOT;
        if (!fs.existsSync(base)) continue;
        let files;
        try {
            files = fs.readdirSync(base).filter((f) => f.endsWith('.html'));
        } catch (e) {
            continue;
        }
        for (const f of files) {
            const fp = path.join(base, f);
            const res = processFile(fp, langKey);
            if (!res) continue;
            totalFiles++;
            const anyChanged = Object.values(res.results).some(Boolean);
            if (anyChanged) {
                totalChanged++;
                report.push({
                    file: (dir ? dir + '/' : '') + f,
                    lang: langKey,
                    ...res.results
                });
            }
            if (anyChanged && !DRY) {
                // backup
                const rel = dir ? path.join(dir, f) : f;
                const dest = path.join(backupRoot, rel);
                fs.mkdirSync(path.dirname(dest), { recursive: true });
                fs.writeFileSync(dest, fs.readFileSync(fp, 'utf8'), 'utf8');
                // escreve
                fs.writeFileSync(fp, res.html, 'utf8');
            }
        }
    }

    console.log('=== RELATÓRIO ===');
    console.log('Arquivos de escala (com card NANDA):', totalFiles);
    console.log('Arquivos modificados:', totalChanged);
    if (!DRY) console.log('Backup em:', path.relative(ROOT, backupRoot));
    console.log('');
    console.log('Detalhes dos arquivos modificados:');
    for (const r of report) {
        const flags = [];
        if (r.h4) flags.push('h4');
        if (r.secTitulo) flags.push('sec-titulo');
        if (r.discVisible) flags.push('disc-visivel');
        if (r.discPrint) flags.push('disc-impressao');
        if (r.fallback) flags.push('titulo-fallback');
        console.log(`  [${r.lang}] ${r.file} -> ${flags.join(', ')}`);
    }
}

main();
