# -*- coding: utf-8 -*-
# scripts/pdf_builder/esc_16_rancholosamigos.py
import sys, os
sys.path.append(os.path.dirname(__file__))
from render_engine import compile_scale_pdf

compile_scale_pdf(
    slug="rancholosamigos",
    name="ESCALA RANCHO LOS AMIGOS (LCFS)",
    subtitle="Níveis de Recuperação Cognitiva e Comportamental pós-Traumatismo Cranioencefálico",
    criteria_title="8 NÍVEIS DE FUNCIONAMENTO COGNITIVO (MARCAR O NÍVEL CORRESPONDENTE)",
    criteria_html="""
    <table class="table-data" style="font-size:7.5pt;">
      <tr><th style="width:14%;">Nível</th><th style="width:58%;">Padrão Comportamental e Cognitivo Observado</th><th style="width:20%;">Assistência Necessária</th><th style="width:8%;text-align:center;">Seleção</th></tr>
      <tr><td><strong>Nível I</strong></td><td><strong>Sem Resposta:</strong> Paciente em sono profundo ou coma; não responde a estímulos auditivos, visuais ou táteis.</td><td>Assistência Total</td><td style="text-align:center;"><span class="sq"></span></td></tr>
      <tr><td><strong>Nível II</strong></td><td><strong>Resposta Generalizada:</strong> Reage de forma inconsistente e inespecífica a estímulos; respostas motoras reflexas.</td><td>Assistência Total</td><td style="text-align:center;"><span class="sq"></span></td></tr>
      <tr><td><strong>Nível III</strong></td><td><strong>Resposta Localizada:</strong> Reage especificamente ao estímulo (vira os olhos para a voz, retira o membro à dor); segue ordens simples.</td><td>Assistência Total</td><td style="text-align:center;"><span class="sq"></span></td></tr>
      <tr><td><strong>Nível IV</strong></td><td><strong>Confuso e Agitado:</strong> Alerta em estado exacerbado; comportamento agressivo ou motor desordenado; memória recente ausente.</td><td>Assistência Máxima</td><td style="text-align:center;"><span class="sq"></span></td></tr>
      <tr><td><strong>Nível V</strong></td><td><strong>Confuso e Inapropriado, Não Agitado:</strong> Responde a comandos simples com consistência, mas perde foco; confabulação frequente.</td><td>Assistência Máxima</td><td style="text-align:center;"><span class="sq"></span></td></tr>
      <tr><td><strong>Nível VI</strong></td><td><strong>Confuso e Apropriado:</strong> Comportamento orientado por objetivos com supervisão; memória recente ainda frágil; dependente de pistas.</td><td>Assistência Moderada</td><td style="text-align:center;"><span class="sq"></span></td></tr>
      <tr><td><strong>Nível VII</strong></td><td><strong>Automático e Apropriado:</strong> Realiza rotinas automaticamente; julgamento social e autocrítica diminuídos; aprende novas tarefas lentamente.</td><td>Assistência Mínima</td><td style="text-align:center;"><span class="sq"></span></td></tr>
      <tr><td><strong>Nível VIII</strong></td><td><strong>Com Propósito e Apropriado:</strong> Integra memória recente e passada; autônomo na maioria das atividades da vida diária.</td><td>Supervisão / Standby</td><td style="text-align:center;"><span class="sq"></span></td></tr>
    </table>
    """,
    score_html="NÍVEL DE FUNCIONAMENTO COGNITIVO ATRIBUÍDO: &nbsp; [ &nbsp; Nível &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ] (I a VIII)",
    interp_title="DIRETRIZES DE REABILITAÇÃO E CUIDADOS DE ENFERMAGEM",
    interp_cards_html="""
      <div class="interp-card"><div class="interp-head" style="background:#DC2626;">NÍVEIS I a III (ESTÁGIO INICIAL)</div><div class="interp-body">Estimulação multissensorial controlada, prevenção de contraturas, mobilização passiva e prevenção de LPP.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#F97316;">NÍVEIS IV e V (ESTÁGIO CONFUSIONAL)</div><div class="interp-body">Ambiente com baixo estímulo sensorial, medidas de proteção física (risco de queda e auto-extubação) e calma.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#16A34A;">NÍVEIS VI a VIII (ESTÁGIO DE REINTEGRAÇÃO)</div><div class="interp-body">Treino de rotinas e autonomia em AVDs, orientação à família e estímulo à cognição executiva.</div></div>
    """,
    ref="HAGEN, C. et al. Levels of Cognitive Functioning. Rehabilitation of the head injured adult: comprehensive physical management, 1979."
)
