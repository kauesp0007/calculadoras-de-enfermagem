-- Etapa 02: transformação controlada do piloto real.
-- Não contém banco de questões. Opera somente sobre o documento privado existente.
-- Pré-condição: snapshot íntegro em private.premium_content_page_versions.

begin;

do $$
declare
  v_source_sha text;
  v_backup_count bigint;
  v_questions_md5 text;
  v_answer_count integer;
  v_ref_count integer;
begin
  select source_sha into v_source_sha
  from public.premium_content_pages
  where path = 'simulado-de-enfermagem.html'
  for update;

  if v_source_sha is null then
    raise exception 'piloto não encontrado em premium_content_pages';
  end if;

  if v_source_sha <> '3c04cdf4b4025ccf2bbbd7609683481276cf835c' then
    raise exception 'source_sha divergente; esperado 3c04cdf4..., atual %', v_source_sha;
  end if;

  select count(*) into v_backup_count
  from private.premium_content_page_versions
  where path = 'simulado-de-enfermagem.html'
    and source_sha = v_source_sha
    and content_md5 = 'c8a24a0c5612dac7c1284129952bf168';

  if v_backup_count <> 1 then
    raise exception 'snapshot privado esperado não encontrado ou duplicado';
  end if;

  select
    md5(substring(
      content
      from position('const questionsData = [' in content)
      for position(E'];\r\n\r\nlet timerInterval=null,centiseconds=0,timerStartMs=0,quizStarted=false,isImmediateMode=false,userAnswers=new Array(50).fill(null);' in content)
          - position('const questionsData = [' in content) + 2
    )),
    (length(content)-length(replace(content,'answerIndex:','')))/length('answerIndex:'),
    (length(content)-length(replace(content,'ref:','')))/length('ref:')
  into v_questions_md5, v_answer_count, v_ref_count
  from public.premium_content_pages
  where path = 'simulado-de-enfermagem.html';

  if v_questions_md5 <> '24d9d4cdb9cedba65c5584833b500c29'
     or v_answer_count <> 50
     or v_ref_count <> 50 then
    raise exception 'integridade clínica prévia divergente: md5 %, answers %, refs %',
      v_questions_md5, v_answer_count, v_ref_count;
  end if;
end $$;

with src as (
  select content
  from public.premium_content_pages
  where path = 'simulado-de-enfermagem.html'
    and source_sha = '3c04cdf4b4025ccf2bbbd7609683481276cf835c'
),
css_added as (
  select replace(
    content,
    '<body class="bg-gray-50 text-gray-800 font-sans">',
    E'<link href="/css/simulados/simulator-engine.css?v=1.0.1-p0" rel="stylesheet">\r\n<body class="bg-gray-50 text-gray-800 font-sans">'
  ) as content
  from src
),
ui_replaced as (
  select overlay(
    content
    placing E'<div id="ce-simulator-root" data-premium-action="block"></div>\r\n'
    from position('<div id="start-area"' in content)
    for position('</main>' in content) - position('<div id="start-area"' in content)
  ) as content
  from css_added
),
engine_added as (
  select replace(
    content,
    E'<script>\r\ndocument.addEventListener(\'DOMContentLoaded\',function(){',
    E'<script src="/js/simulados/simulator-engine.js?v=1.0.1-p0"></script>\r\n<script>\r\ndocument.addEventListener(\'DOMContentLoaded\',function(){'
  ) as content
  from ui_replaced
),
positions as (
  select
    content,
    position(E'];\r\n\r\nlet timerInterval=null,centiseconds=0,timerStartMs=0,quizStarted=false,isImmediateMode=false,userAnswers=new Array(50).fill(null);' in content) as runtime_start
  from engine_added
),
with_script_end as (
  select
    content,
    runtime_start,
    runtime_start + position('</script>' in substring(content from runtime_start)) - 1 as script_end
  from positions
),
final_doc as (
  select overlay(
    content
    placing E'];\r\n\r\n(function(){\r\n  var root = document.getElementById(\'ce-simulator-root\');\r\n  if (!root || !window.CESimulator) {\r\n    console.error(\'CESimulator indisponível para o piloto.\');\r\n    return;\r\n  }\r\n  window.CESimulator.create({\r\n    id: \'simulado-tecnico-enfermagem-1\',\r\n    title: \'1° Simulado para Técnicos de Enfermagem\',\r\n    contentVersion: \'2026-10-04-pilot-01\',\r\n    mode: \'exam\',\r\n    allowModeChoice: true,\r\n    storage: true,\r\n    timer: true,\r\n    print: true,\r\n    analytics: true,\r\n    type: \'general\',\r\n    audience: \'tecnico-enfermagem\',\r\n    topic: \'concursos\',\r\n    questions: questionsData\r\n  }).mount();\r\n})();\r\n'
    from runtime_start
    for script_end - runtime_start
  ) as content
  from with_script_end
),
updated as (
  update public.premium_content_pages p
  set content = f.content,
      source_sha = md5(f.content) || substr(md5(f.content || ':simulator-pilot-01'),1,8),
      updated_at = now()
  from final_doc f
  where p.path = 'simulado-de-enfermagem.html'
    and p.source_sha = '3c04cdf4b4025ccf2bbbd7609683481276cf835c'
  returning p.path, p.source_sha, p.updated_at, length(p.content) as content_length
)
select * from updated;

do $$
declare
  v_questions_md5 text;
  v_answer_count integer;
  v_ref_count integer;
  v_mount_count integer;
  v_engine_js_count integer;
  v_engine_css_count integer;
  v_premium_block_count integer;
begin
  select
    md5(substring(
      content
      from position('const questionsData = [' in content)
      for position(E'];\r\n\r\n(function(){' in content)
          - position('const questionsData = [' in content) + 2
    )),
    (length(content)-length(replace(content,'answerIndex:','')))/length('answerIndex:'),
    (length(content)-length(replace(content,'ref:','')))/length('ref:'),
    (length(content)-length(replace(content,'CESimulator.create','')))/length('CESimulator.create'),
    (length(content)-length(replace(content,'/js/simulados/simulator-engine.js','')))/length('/js/simulados/simulator-engine.js'),
    (length(content)-length(replace(content,'/css/simulados/simulator-engine.css','')))/length('/css/simulados/simulator-engine.css'),
    (length(content)-length(replace(content,'data-premium-action="block"','')))/length('data-premium-action="block"')
  into v_questions_md5, v_answer_count, v_ref_count, v_mount_count, v_engine_js_count, v_engine_css_count, v_premium_block_count
  from public.premium_content_pages
  where path = 'simulado-de-enfermagem.html';

  if v_questions_md5 <> '24d9d4cdb9cedba65c5584833b500c29'
     or v_answer_count <> 50
     or v_ref_count <> 50
     or v_mount_count <> 1
     or v_engine_js_count <> 1
     or v_engine_css_count <> 1
     or v_premium_block_count <> 1 then
    raise exception 'validação pós-transformação falhou';
  end if;
end $$;

commit;
