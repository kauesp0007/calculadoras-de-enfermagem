# -*- coding: utf-8 -*-
# scripts/pdf_builder/esc_17_richmond.py
import sys, os
sys.path.append(os.path.dirname(__file__))
from render_engine import compile_scale_pdf

compile_scale_pdf(
    slug="richmond",
    name="ESCALA DE RICHMOND (RASS)",
    subtitle="Richmond Agitation-Sedation Scale — Titulação da Sedação e Monitorização de Agitação em UTI",
    criteria_title="ESCALA DE AGITAÇÃO E SEDAÇÃO DE RICHMOND (-5 A +4)",
    criteria_html="""
    <table class="table-data" style="font-size:7.5pt;">
      <tr><th style="width:10%;">Escore</th><th style="width:20%;">Termo Clínico</th><th style="width:62%;">Descrição do Comportamento Observado</th><th style="width:8%;text-align:center;">Seleção</th></tr>
      <tr><td><strong>+4</strong></td><td>Combativo</td><td>Violento, agressivo, perigo imediato para si mesmo ou para a equipe multiprofissional.</td><td style="text-align:center;"><span class="sq"></span></td></tr>
      <tr><td><strong>+3</strong></td><td>Muito Agitado</td><td>Puxa tubos, sondas ou cateteres invasivos; agressividade verbal e motora frequente.</td><td style="text-align:center;"><span class="sq"></span></td></tr>
      <tr><td><strong>+2</strong></td><td>Agitado</td><td>Movimentos frequentes não intencionais; assincronia evidente com o ventilador mecânico.</td><td style="text-align:center;"><span class="sq"></span></td></tr>
      <tr><td><strong>+1</strong></td><td>Inquieto</td><td>Ansioso, apreensivo, movimentos não agressivos nem descoordenados.</td><td style="text-align:center;"><span class="sq"></span></td></tr>
      <tr><td><strong>0</strong></td><td><strong>Alerta e Calmo</strong></td><td><strong>Estado basal ideal: espontaneamente atento, cooperativo e tranquilo.</strong></td><td style="text-align:center;"><span class="sq"></span></td></tr>
      <tr><td><strong>-1</strong></td><td>Sonolento</td><td>Não plenamente alerta, mas desperta à voz (>10 segundos) com contato visual mantido.</td><td style="text-align:center;"><span class="sq"></span></td></tr>
      <tr><td><strong>-2</strong></td><td>Sedação Leve</td><td>Desperta brevemente à voz (<10 segundos) e perde o contato visual com o examinador.</td><td style="text-align:center;"><span class="sq"></span></td></tr>
      <tr><td><strong>-3</strong></td><td>Sedação Moderada</td><td>Movimento ou abertura ocular à voz, mas sem qualquer contato visual efetivo.</td><td style="text-align:center;"><span class="sq"></span></td></tr>
      <tr><td><strong>-4</strong></td><td>Sedação Profunda</td><td>Nenhuma resposta à voz; movimenta-se apenas com estímulo físico ou doloroso.</td><td style="text-align:center;"><span class="sq"></span></td></tr>
      <tr><td><strong>-5</strong></td><td>Não Despertável</td><td>Nenhuma resposta a qualquer estímulo verbal ou físico/doloroso vigoroso.</td><td style="text-align:center;"><span class="sq"></span></td></tr>
    </table>
    """,
    score_html="ESCORE RASS ATRIBUÍDO: &nbsp; [ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ] (-5 a +4)",
    interp_title="ALVO TERAPÊUTICO E CONDUTA CLÍNICA NA UTI",
    interp_cards_html="""
      <div class="interp-card"><div class="interp-head" style="background:#16A34A;">RASS 0 a -1 (ALVO IDEAL)</div><div class="interp-body">Alerta e calmo ou levemente sonolento; permite interação, cooperação com cuidados e desmame seguro.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#F97316;">RASS +1 a +4 (AGITAÇÃO)</div><div class="interp-body">Investigar dor, hipoxemia, retenção urinária ou delirium hiperativo (aplicar CAM-ICU).</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#DC2626;">RASS -3 a -5 (SUPER-SEDAÇÃO)</div><div class="interp-body">Sedação excessiva. Reduzir infusão contínua conforme protocolo de interrupção diária.</div></div>
    """,
    ref="SESSLER, C. N. et al. The Richmond Agitation-Sedation Scale: validity and reliability in adult intensive care unit patients. Am J Respir Crit Care Med, 2002; 166(10):1338-1344."
)
