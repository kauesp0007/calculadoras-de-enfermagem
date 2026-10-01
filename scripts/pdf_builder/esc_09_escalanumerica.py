# -*- coding: utf-8 -*-
# scripts/pdf_builder/esc_09_escalanumerica.py
import sys, os
sys.path.append(os.path.dirname(__file__))
from render_engine import compile_scale_pdf

compile_scale_pdf(
    slug="escalanumerica",
    name="ESCALA NUMÉRICA DE DOR (END / EVA)",
    subtitle="Avaliação da Intensidade, Padrão Semiológico e Manejo Terapêutico da Dor (5º Sinal Vital)",
    criteria_title="1. RÉGUA NUMÉRICA E CARACTERIZAÇÃO DA QUEIXA DOLOROSA",
    criteria_html="""
    <div style="border:1.5px solid #1A3E74;background:#fff;border-radius:4px;padding:8px;text-align:center;margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;font-weight:900;font-size:12pt;color:#1A3E74;margin-bottom:3px;">
        <span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span><span>10</span>
      </div>
      <div style="height:12px;background:linear-gradient(to right, #10B981 0%, #84CC16 30%, #EAB308 50%, #F97316 75%, #EF4444 100%);border-radius:4px;margin-bottom:4px;"></div>
      <div style="display:flex;justify-content:space-between;font-size:7.5pt;color:#475569;font-weight:bold;">
        <span style="width:20%;text-align:left;">SEM DOR (0)</span>
        <span style="width:30%;text-align:center;">DOR LEVE (1 a 3)</span>
        <span style="width:30%;text-align:center;">DOR MODERADA (4 a 6)</span>
        <span style="width:20%;text-align:right;">DOR INTENSA (7 a 10)</span>
      </div>
    </div>

    <table class="table-data">
      <tr><td style="width:22%;"><strong>Localização da Dor:</strong></td><td colspan="3"></td></tr>
      <tr><td><strong>Qualidade / Tipo:</strong></td><td colspan="3">[ ] Queimação &bull; [ ] Pontada / Agulhada &bull; [ ] Aperto / Compressão &bull; [ ] Pulsátil &bull; [ ] Cólica &bull; [ ] Em peso</td></tr>
      <tr><td><strong>Início e Duração:</strong></td><td>[ ] Aguda (&lt;3 meses) &bull; [ ] Crônica (&gt;3 meses)</td><td style="width:18%;"><strong>Frequência:</strong></td><td>[ ] Contínua &bull; [ ] Intermitente / Em crises</td></tr>
      <tr><td><strong>Fatores de Melhora:</strong></td><td>[ ] Repouso &bull; [ ] Analgésico &bull; [ ] Gelo/Calor</td><td><strong>Fatores de Piora:</strong></td><td>[ ] Movimentação &bull; [ ] Palpação &bull; [ ] Esforço</td></tr>
      <tr><td><strong>Conduta Analgésica:</strong></td><td colspan="3">Medicação / Dose: _________________________ Horário: ___:___ &bull; Reavaliação em: ____ min</td></tr>
    </table>
    """,
    score_html="INTENSIDADE DA DOR REGISTRADA: &nbsp; [ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ] / 10",
    interp_title="DIRETRIZES TERAPÊUTICAS CONFORME A INTENSIDADE DA DOR",
    interp_cards_html="""
      <div class="interp-card"><div class="interp-head" style="background:#16A34A;">0: SEM DOR</div><div class="interp-body">Paciente calmo e confortável. Vigilância contínua durante a checagem rotineira dos sinais vitais.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#84CC16;">1 a 3: DOR LEVE</div><div class="interp-body">Analgésicos não opioides (dipirona, paracetamol) e medidas não farmacológicas de conforto físico.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#F97316;">4 a 6: DOR MODERADA</div><div class="interp-body">Associação de anti-inflamatórios ou opioides fracos (tramadol/codeína); reavaliação seriada em 60 min.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#DC2626;">7 a 10: DOR INTENSA</div><div class="interp-body">Opioides fortes prescritos (morfina/fentanil); notificação médica imediata e monitorização estrita.</div></div>
    """,
    ref="DOWNIE, W. W. et al. Studies with pain rating scales. Ann Rheum Dis, 1978; 37(4):378-381; Diretrizes da Sociedade Brasileira para o Estudo da Dor (SBED)."
)
