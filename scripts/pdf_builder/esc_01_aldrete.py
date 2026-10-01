# -*- coding: utf-8 -*-
# scripts/pdf_builder/esc_01_aldrete.py
import sys, os
sys.path.append(os.path.dirname(__file__))
from render_engine import compile_scale_pdf

compile_scale_pdf(
    slug="aldrete",
    name="ESCALA DE ALDRETE E KROULIK",
    subtitle="Avaliação do Índice de Recuperação Pós-Anestésica (SRPA)",
    id_row2='<tr><td class="lbl">Prontuário:</td><td></td><td class="lbl">Leito:</td><td></td></tr><tr><td class="lbl">Cirurgia:</td><td></td><td class="lbl">Data/Hora:</td><td>___/___/_____ às ___:___</td></tr>',
    criteria_title="CRITÉRIOS DE AVALIAÇÃO DA RECUPERAÇÃO PÓS-ANESTÉSICA",
    criteria_html="""
    <table class="table-data">
      <tr><th style="width:28%;">Critério Clínico</th><th style="width:58%;">Opções e Pontuação</th><th style="width:14%;text-align:center;">Obtido</th></tr>
      <tr>
        <td><strong>1. Atividade Motora</strong><br><small style="color:#64748B;">Movimentação voluntária</small></td>
        <td>
          <div class="opt"><span class="sq"></span> Move 4 extremidades voluntariamente ou sob comando (2)</div>
          <div class="opt"><span class="sq"></span> Move 2 extremidades voluntariamente ou sob comando (1)</div>
          <div class="opt"><span class="sq"></span> Incapaz de mover extremidades voluntariamente (0)</div>
        </td>
        <td style="text-align:center;font-weight:bold;font-size:11pt;">[ &nbsp; ]</td>
      </tr>
      <tr>
        <td><strong>2. Respiração</strong><br><small style="color:#64748B;">Esforço e padrão ventilatório</small></td>
        <td>
          <div class="opt"><span class="sq"></span> Respira profundamente e tosse com facilidade (2)</div>
          <div class="opt"><span class="sq"></span> Dispneia, respiração superficial ou limitada (1)</div>
          <div class="opt"><span class="sq"></span> Apneia ou sob ventilação mecânica assistida (0)</div>
        </td>
        <td style="text-align:center;font-weight:bold;font-size:11pt;">[ &nbsp; ]</td>
      </tr>
      <tr>
        <td><strong>3. Circulação (PA)</strong><br><small style="color:#64748B;">Variação da pressão arterial</small></td>
        <td>
          <div class="opt"><span class="sq"></span> Pressão arterial ± 20% do nível pré-anestésico basal (2)</div>
          <div class="opt"><span class="sq"></span> Pressão arterial ± 20% a 49% do nível pré-anestésico (1)</div>
          <div class="opt"><span class="sq"></span> Pressão arterial ± 50% do nível pré-anestésico basal (0)</div>
        </td>
        <td style="text-align:center;font-weight:bold;font-size:11pt;">[ &nbsp; ]</td>
      </tr>
      <tr>
        <td><strong>4. Consciência</strong><br><small style="color:#64748B;">Sensório e nível de alerta</small></td>
        <td>
          <div class="opt"><span class="sq"></span> Lúcido, orientado no tempo e no espaço (2)</div>
          <div class="opt"><span class="sq"></span> Desperta quando chamado / sonolento (1)</div>
          <div class="opt"><span class="sq"></span> Não responde a estímulos auditivos ou táteis (0)</div>
        </td>
        <td style="text-align:center;font-weight:bold;font-size:11pt;">[ &nbsp; ]</td>
      </tr>
      <tr>
        <td><strong>5. Saturação (SpO₂)</strong><br><small style="color:#64748B;">Oxigenação periférica</small></td>
        <td>
          <div class="opt"><span class="sq"></span> Mantém SpO₂ > 92% respirando ar ambiente (2)</div>
          <div class="opt"><span class="sq"></span> Necessita oxigênio suplementar para manter SpO₂ > 90% (1)</div>
          <div class="opt"><span class="sq"></span> SpO₂ < 90% mesmo com oxigênio suplementar (0)</div>
        </td>
        <td style="text-align:center;font-weight:bold;font-size:11pt;">[ &nbsp; ]</td>
      </tr>
    </table>
    """,
    score_html="ESCORE FINAL ALDRETE E KROULIK (0 a 10): &nbsp; [ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ]",
    interp_title="INTERPRETAÇÃO CLÍNICA E CRITÉRIOS DE ALTA DA SRPA",
    interp_cards_html="""
      <div class="interp-card"><div class="interp-head" style="background:#16A34A;">9 a 10 PONTOS</div><div class="interp-body"><strong>Apto para Alta da SRPA:</strong> Condições estáveis para transferência segura à enfermaria.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#EAB308;">8 PONTOS</div><div class="interp-body"><strong>Reavaliação Contínua:</strong> Monitorar por mais 15-30 minutos antes da liberação.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#DC2626;">&lt; 8 PONTOS</div><div class="interp-body"><strong>Permanência Obrigatória:</strong> Manter vigilância estrita e suporte intensivo.</div></div>
    """,
    ref="ALDRETE, J. A.; KROULIK, D. A postanesthetic recovery score. Anesth Analg, 1970; ALDRETE, J. A. J Clin Anesth, 1995."
)
