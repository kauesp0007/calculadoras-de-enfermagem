import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createRemoteJWKSet, jwtVerify } from "npm:jose@5.10.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID") ?? "calculadoras-enfermagem";
const ADMIN_EMAIL = "ciadeenfermagem@gmail.com";
const JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"));
const SITE = "https://www.calculadorasdeenfermagem.com.br";
const ALLOWED_ORIGINS = new Set([SITE, "https://calculadorasdeenfermagem.com.br"]);
const ALLOWED_PAGES = new Set([
  "aldrete.html",
  "apache.html",
  "apgar.html",
  "asa.html",
  "ballard.html",
  "barthel.html",
  "berg.html",
  "bishop.html",
  "braden.html",
  "bps.html",
  "cam.html",
  "capurro.html",
  "cincinnati.html",
  "classificacao_wifi.html",
  "cornell.html",
  "cries.html",
  "curb-65.html",
  "gds.html",
  "downton.html",
  "escalanumerica.html",
  "elpo.html",
  "flacc.html",
  "fast.html",
  "four.html",
  "glasgow.html",
  "fugulin.html",
  "gosnell.html",
  "hamilton.html",
  "hendrich.html",
  "humpty.html",
  "johns.html",
  "jouvet.html",
  "katz.html",
  "lachs.html",
  "lanss.html",
  "lawton.html",
  "meem.html",
  "meows.html",
  "moca.html",
  "morse.html",
  "news.html",
  "nips.html",
  "nihss.html",
  "norton.html",
  "ofras.html",
  "painad.html",
  "pelod.html",
  "perroca.html",
  "pews.html",
  "prism.html",
  "qsofa.html",
  "ramsay.html",
  "rancholosamigos.html",
  "richmond.html",
  "saps.html",
  "silverman.html",
  "sistema_sinbad.html",
  "sofa.html",
  "tinetti.html",
  "zarit.html",
  "waterlow.html",
  "downes.html",
  "manchester.html",
  "calculo-de-ferias.html",
  "adicional-noturno.html",
  "calculo-hora-extra.html",
  "calculo-rescisao.html",
  "insulina.html",
  "balancohidrico.html",
  "dimensionamento.html",
  "exames_laboratoriais.html",
  "gasometria.html",
  "gotejamento.html",
  "gestacional.html",
  "imc.html",
  "medicamentos.html",
  "calculadoravacina.html",
  "notificacao-compulsoria.html",
  "sbar.html",
  "dimensionamento-cofen.html",
  "formularios-em-branco-de-escalas.html",
  "formulario_escala_de_perroca.html",
  "formulario_de_fugulin.html",
  "formulario_meem.html",
  "formulario_impresso_sbar.html",
  "formulario_impresso_saep.html",
  "formulario_bishop.html",
  "formulario_bps.html",
  "formulario_cam.html",
  "formulario_capurro.html",
  "formulario_escala_cincinnati.html",
  "formulario_escala_curb65.html",
  "formulario_morse.html",
  "formulario_escala_de_four.html",
  "formulario_escala_de_flacc.html",
  "formulario_escala_de_fast.html",
  "formulario_escala_de_elpo.html",
  "formulario_escala_de_downton.html",
  "formulario_escala_de_glasgow.html",
  "formulario_escala_de_gosnell.html",
  "formulario_escala_de_hamilton.html",
  "formulario_escala_de_hendrich.html",
  "formulario_escala_de_humpty.html",
  "formulario_escala_de_johns.html",
  "formulario_escala_de_jouvet.html",
  "formulario_escala_de_lachs.html",
  "formulario_escala_de_lanss.html",
  "formulario_escala_de_lawton.html",
  "formulario_escala_de_meows.html",
  "formulario_escala_de_news.html",
  "formulario_escala_de_nips.html",
  "formulario_escala_de_nihss.html",
  "formulario_escala_de_norton.html",
  "formulario_escala_de_ofras.html",
  "formulario_escala_de_painad.html",
  "checagem.html",
  "regrasmedicacoes.html",
  "vigilancia.html",
  "metasinternacionais.html",
  "sinan.html",
  "lista-de-doencas-de-notificacao-compulsoria.html",
  "genogramaeecomapa.html",
  "principios_sus.html",
  "rede_de_frios_pni.html",
  "guia_rapido_pnab.html",
  "participacao_popular_sus.html",
  "guia_fundamental_humanizasus.html",
  "legislacoes.html",
  "codigo_de_etica_enfermagem.html",
  "guia_fundamental_codigo_de_etica_enfermagem.html",
  "guia_fundamental_processo_de_enfermagem.html",
  "guia_rapido_lei5905-73_criacao_cofen_coren.html",
  "lei-organica-saude-8080-1990.html",
  "nanda.html",
  "diagnosticosnanda.html",
  "classificacao_intervencoes-enfermagem.html",
  "teorias-de-enfermagem.html",
  "terminologias-de-enfermagem.html",
  "elisabeth-marques-plataforma-completa.html",
  "nr1.html",
  "adequar-nr1.html",
  "copsoq.html",
  "copsoq-curta.html",
  "entenda_copsoq.html",
  "copsoq3.html",
  "5-hs-da-paradacardiorespiratoria.html",
  "5-ts-da-paradacardiorespiratoria.html",
  "time-de-resposta-rapida.html",
  "suporte-avancado-de-vida.html",
  "guia_rapido_desfibrilador.html",
  "integracoes_calculadora_de_gasometria.html",
  "instrumentais-cirurgicos.html",
  "equipamentoscc.html",
  "checklist-cirurgico-seguro.html",
  "formulario-saep-enfermagem.html",
  "rastreabilidade-cme.html",
  "centro-cirurgico.html",
  "integracoes_escala_de_fugulin.html",
  "integracoes_escala_de_perroca.html",
  "integracoes_classificacao_wifi.html",
  "biblioteca-carinho-de-emergencia.html",
  "escala_de_trabalho_enfermagem_12x36.html",
  "guia_rapido_dimensionamento_de_enfermagem.html",
  "guia_rapido_bundles.html",
  "exemplo_de_processo_de_enfermagem.html",
  "instrumento_de_coleta_de_dados.html",
  "formulario_avaliacao_da_cabeca_aos_pes.html",
  "guia_rapido_kanbam_na_enfermagem.html",
  "normas-regulamentadoras.html",
  "geradordir.html",
  "matriz-de-risco.html",
  "risktools.html",
  "guia_rapido_dispositivos.html",
  "tipos_de_seringas.html",
  "guia_rapido_seringa_insulina.html",
  "biblioteca-seringa.html",
  "biblioteca-cirurgica.html",
  "biblioteca-curativo.html",
  "integracoes_metodo_de_capurro.html",
  "hospital_amigo_da_crianca.html",
  "aleitamento_materno_exclusivo.html",
  "simulado-de-enfermagem.html",
  "simulado-de-enfermagem2.html",
  "simulado-de-enfermagem3.html",
  "simulado-de-enfermagem-nucleo-de-seguranca-do-paciente.html",
  "simulado-de-enfermagem-doencas-de-notificacao-compulsoria.html",
  "simulado_vacinacao.html",
  "simulado_pcr.html",
  "flashcards_quiz.html",
  "simulado_ibam_bebedouro_enfermeiro_2024.html",
  "simulado_ibam_guarulhos_enfermeiro_2024.html",
  "simulado_ibam_guarulhos_enfermeiro_esf_2024.html",
  "simulado_ibam_japaratuba_sergipe_enfermeiro_2014.html",
  "simulado_lei_organica_do_sus_8080-90.html",
  "simulado_participacao_da_comunidade.html",
  "simulado_humaniza_sus.html",
  "simulado_codigo_de_etica_enfermagem.html",
  "simulado_hospital_amigo_da_crianca.html",
  "simulado_aleitamento_materno.html",
  "biblioteca-provas.html",
  "blog-templates/index.template.html",
  "blog-templates/post.template.html",
  "item.template.html",
  "downloads.template.html"
]);
const db = () => createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

function headers(req: Request) {
  const origin = req.headers.get("Origin") || SITE;
  const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : SITE;
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Authorization,Content-Type",
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "Vary": "Origin"
  };
}
function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: headers(req) });
}
function normalizePage(value: unknown) {
  let path = String(value || "").trim();
  try { path = decodeURIComponent(path); } catch (_) {}
  try { if (/^https?:\/\//i.test(path)) path = new URL(path).pathname; } catch (_) {}
  path = path.split(/[?#]/)[0].replace(/\\/g, "/").replace(/\/+/g, "/").replace(/^\/+/, "");
  if (!ALLOWED_PAGES.has(path)) throw new Error("invalid_page");
  return "/" + path;
}
function normalizeLang(value: unknown) {
  const lang = String(value || "pt-br").trim().toLowerCase();
  return /^[a-z]{2}(?:-[a-z]{2})?$/.test(lang) ? lang.slice(0, 8) : "pt-br";
}
function normalizeOptional(value: unknown, max: number) {
  const text = String(value || "").trim();
  return text ? text.slice(0, max) : null;
}
type Identity = { uid: string; email: string };
async function firebaseUser(req: Request): Promise<Identity | null> {
  const header = req.headers.get("Authorization") || "";
  if (!header) return null;
  if (!header.startsWith("Bearer ")) throw new Error("unauthorized");
  try {
    const { payload } = await jwtVerify(header.slice(7).trim(), JWKS, {
      algorithms: ["RS256"],
      issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
      audience: FIREBASE_PROJECT_ID
    });
    const uid = String(payload.sub || "").trim();
    const email = String(payload.email || "").trim().toLowerCase();
    if (!uid || !email) throw new Error("unauthorized");
    return { uid, email };
  } catch (_) {
    throw new Error("unauthorized");
  }
}
function editToken(value: unknown) {
  const token = String(value || "");
  return /^[a-f0-9]{64}$/.test(token) ? token : null;
}
async function tokenHash(token: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
function publicRow(row: any) {
  return {
    id: row.id,
    page_path: row.page_path,
    lang: row.lang,
    name: row.is_anonymous ? null : row.name,
    comment: row.comment,
    is_anonymous: Boolean(row.is_anonymous),
    rating: Number.isInteger(row.rating) ? row.rating : null,
    created_at: row.created_at,
    edited_at: row.edited_at || null
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: headers(req) });
  const origin = req.headers.get("Origin");
  if (origin && !ALLOWED_ORIGINS.has(origin)) return json(req, { error: "origin_not_allowed" }, 403);

  try {
    const sb = db();
    const url = new URL(req.url);

    if (req.method === "GET") {
      const pagePath = normalizePage(url.searchParams.get("page_path"));
      const lang = normalizeLang(url.searchParams.get("lang"));
      const identity = await firebaseUser(req);
      const admin = identity?.email === ADMIN_EMAIL;
      let query = sb.from("page_comments")
        .select("id,page_path,lang,name,comment,is_anonymous,rating,is_approved,created_at,edited_at")
        .eq("page_path", pagePath)
        .eq("lang", lang);
      if (!admin) query = query.eq("is_approved", true);
      const { data, error } = await query
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      const owned = new Set<string>();
      if (identity && !admin && data?.length) {
        const { data: owners, error: ownersError } = await sb.from("page_comment_ownership")
          .select("comment_id").eq("firebase_uid", identity.uid)
          .in("comment_id", data.map((row) => row.id));
        if (ownersError) throw ownersError;
        (owners || []).forEach((owner) => owned.add(owner.comment_id));
      }
      return json(req, { comments: (data || []).map((row) => ({
        ...publicRow(row), can_edit: admin || owned.has(row.id),
        ...(admin ? { is_approved: row.is_approved } : {})
      })) });
    }

    if (req.method === "POST") {
      if (!String(req.headers.get("content-type") || "").toLowerCase().includes("application/json")) {
        return json(req, { error: "content_type_required" }, 415);
      }
      const body = await req.json().catch(() => ({}));
      const pagePath = normalizePage(body.page_path);
      const lang = normalizeLang(body.lang);
      const identity = await firebaseUser(req);
      const token = identity ? null : editToken(body.edit_token);
      // Cached pre-update clients may still publish. Such legacy comments
      // remain unclaimed until the new script is loaded; moderation still works.
      const comment = String(body.comment || "").trim();
      const anonymous = body.is_anonymous === true;
      const name = anonymous ? null : normalizeOptional(body.name, 80);
      const ratingValue = body.rating == null || body.rating === "" ? null : Number(body.rating);
      const rating = Number.isInteger(ratingValue) && ratingValue >= 1 && ratingValue <= 5 ? ratingValue : null;

      if (!comment || comment.length > 200) return json(req, { error: "invalid_comment" }, 400);
      if (body.rating != null && body.rating !== "" && rating === null) return json(req, { error: "invalid_rating" }, 400);

      const { data: inserted, error: insertError } = await sb.from("page_comments").insert({
        page_path: pagePath,
        lang,
        name,
        comment,
        is_anonymous: anonymous,
        rating,
        is_approved: false
      }).select("id,page_path,lang,name,comment,is_anonymous,rating,created_at,edited_at").single();
      if (insertError) throw insertError;

      try {
        if (identity || token) {
          const { error: ownerError } = await sb.from("page_comment_ownership").insert({
            comment_id: inserted.id,
            firebase_uid: identity?.uid || null,
            token_hash: token ? await tokenHash(token) : null
          });
          if (ownerError) throw ownerError;
        }
        const { data: published, error: publishError } = await sb.from("page_comments")
          .update({ is_approved: true }).eq("id", inserted.id)
          .select("id,page_path,lang,name,comment,is_anonymous,rating,created_at,edited_at").single();
        if (publishError) throw publishError;
        return json(req, { comment: { ...publicRow(published), can_edit: Boolean(identity || token) } }, 201);
      } catch (error) {
        await sb.from("page_comments").delete().eq("id", inserted.id);
        throw error;
      }
    }

    if (req.method === "PATCH" || req.method === "DELETE") {
      if (!String(req.headers.get("content-type") || "").toLowerCase().includes("application/json")) {
        return json(req, { error: "content_type_required" }, 415);
      }
      const body = await req.json().catch(() => ({}));
      const pagePath = normalizePage(body.page_path);
      const lang = normalizeLang(body.lang);
      const id = String(body.id || "");
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        return json(req, { error: "invalid_id" }, 400);
      }
      const identity = await firebaseUser(req);
      const admin = identity?.email === ADMIN_EMAIL;
      const token = editToken(body.edit_token);
      if (!identity && !token) return json(req, { error: "unauthorized" }, 401);
      const { data: existing, error: readError } = await sb.from("page_comments")
        .select("id").eq("id", id).eq("page_path", pagePath).eq("lang", lang).maybeSingle();
      if (readError) throw readError;
      if (!existing) return json(req, { error: "comment_not_found" }, 404);
      if (!admin) {
        const { data: owner, error: ownerError } = await sb.from("page_comment_ownership")
          .select("firebase_uid,token_hash").eq("comment_id", id).maybeSingle();
        if (ownerError) throw ownerError;
        const byAccount = Boolean(identity && owner?.firebase_uid === identity.uid);
        const byToken = Boolean(token && owner?.token_hash === await tokenHash(token));
        if (!byAccount && !byToken) return json(req, { error: "forbidden" }, 403);
      }
      if (req.method === "DELETE") {
        const { error } = await sb.from("page_comments").delete()
          .eq("id", id).eq("page_path", pagePath).eq("lang", lang);
        if (error) throw error;
        return json(req, { deleted: true, id });
      }
      const comment = String(body.comment || "").trim();
      if (!comment || comment.length > 200) return json(req, { error: "invalid_comment" }, 400);
      const { data: updated, error } = await sb.from("page_comments")
        .update({ comment, edited_at: new Date().toISOString() })
        .eq("id", id).eq("page_path", pagePath).eq("lang", lang)
        .select("id,page_path,lang,name,comment,is_anonymous,rating,is_approved,created_at,edited_at").single();
      if (error) throw error;
      return json(req, { comment: {
        ...publicRow(updated), can_edit: true,
        ...(admin ? { is_approved: updated.is_approved } : {})
      } });
    }

    return json(req, { error: "method_not_allowed" }, 405);
  } catch (e) {
    const message = String((e as Error)?.message || e);
    if (message === "invalid_page") return json(req, { error: message }, 400);
    if (message === "unauthorized") return json(req, { error: message }, 401);
    console.error("[page-comments]", message);
    return json(req, { error: "comments_unavailable" }, 500);
  }
});
