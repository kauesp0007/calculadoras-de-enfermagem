# -*- coding: utf-8 -*-
# scripts/pdf_builder/esc_26_manchester.py
import sys, os
sys.path.append(os.path.dirname(__file__))
from render_engine import compile_scale_pdf

compile_scale_pdf(
    slug="manchester",
    name="PROTOCOLO DE MANCHESTER",
    subtitle="Sistema de Triagem e Classificação de Risco Clínico no Pronto Atendimento",
    criteria_title="5 NÍVEIS DE PRIORIDADE CLÍNICA E DISCRIMINADORES GERAIS",
    criteria_html="""
    <table class="table-data">
      <tr><th style="width:14%;">Prioridade</th><th style="width:16%;">Cor / Categoria</th><th style="width:14%;">Tempo Alvo</th><th style="width:48%;">Discriminadores Gerais de Gravidade</th><th style="width:8%;text-align:center;">Seleção</th></tr>
      <tr>
        <td style="background:#fee2e2;font-weight:bold;color:#991b1b;">NÍVEL 1</td>
        <td style="background:#ef4444;color:#fff;font-weight:bold;text-align:center;">VERMELHO</td>
        <td><strong>0 minutos (Imediato)</strong></td>
        <td>Comprometimento de via aérea &bull; Apneia / PCR &bull; Choque circulatório &bull; Convulsão em curso &bull; Não responsivo.</td>
        <td style="text-align:center;"><span class="sq"></span></td>
      </tr>
      <tr>
        <td style="background:#ffedd5;font-weight:bold;color:#9a3412;">NÍVEL 2</td>
        <td style="background:#f97316;color:#fff;font-weight:bold;text-align:center;">LARANJA</td>
        <td><strong>Até 10 minutos</strong></td>
        <td>Dor severa (8-10) &bull; Grande hemorragia ativa &bull; Rebaixamento agudo do sensório &bull; Hipoxemia &bull; Suspeita de sepse.</td>
        <td style="text-align:center;"><span class="sq"></span></td>
      </tr>
      <tr>
        <td style="background:#fef9c3;font-weight:bold;color:#854d0e;">NÍVEL 3</td>
        <td style="background:#eab308;color:#000;font-weight:bold;text-align:center;">AMARELO</td>
        <td><strong>Até 50 minutos</strong></td>
        <td>Dor moderada (4-7) &bull; Hemorragia menor &bull; Febre com pico alto &bull; Vômitos incoercíveis &bull; Déficit neurológico estável.</td>
        <td style="text-align:center;"><span class="sq"></span></td>
      </tr>
      <tr>
        <td style="background:#dcfce7;font-weight:bold;color:#166534;">NÍVEL 4</td>
        <td style="background:#22c55e;color:#fff;font-weight:bold;text-align:center;">VERDE</td>
        <td><strong>Até 120 minutos</strong></td>
        <td>Dor leve recente (1-3) &bull; Trauma menor sem deformidade &bull; Sintomas subagudos &bull; Sem sinais de instabilidade.</td>
        <td style="text-align:center;"><span class="sq"></span></td>
      </tr>
      <tr>
        <td style="background:#e0f2fe;font-weight:bold;color:#075985;">NÍVEL 5</td>
        <td style="background:#3b82f6;color:#fff;font-weight:bold;text-align:center;">AZUL</td>
        <td><strong>Até 240 minutos</strong></td>
        <td>Queixa crônica sem alteração aguda &bull; Solicitação de receitas &bull; Curativos simples sem complicação.</td>
        <td style="text-align:center;"><span class="sq"></span></td>
      </tr>
    </table>

    <div class="section-bar" style="margin-top:8px;">REGISTRO DE SINAIS VITAIS NA TRIAGEM</div>
    <div style="font-size:8pt;border:1px solid #CBD5E1;background:#F8FAFC;padding:6px 10px;border-radius:3px;display:flex;justify-content:space-between;">
      <span><strong>PA:</strong> ____/____ mmHg</span>
      <span><strong>FC:</strong> ____ bpm</span>
      <span><strong>FR:</strong> ____ rpm</span>
      <span><strong>SpO₂:</strong> ____ %</span>
      <span><strong>Temp:</strong> ____ °C</span>
      <span><strong>Glicemia:</strong> ____ mg/dL</span>
      <span><strong>Dor:</strong> [ &nbsp; ] / 10</span>
    </div>
    """,
    score_html="CLASSIFICAÇÃO DE RISCO ATRIBUÍDA: &nbsp; [ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ] &nbsp; (Cor / Prioridade)",
    interp_title="DIRETRIZES DO FLUXO DE ATENDIMENTO DE URGÊNCIA",
    interp_cards_html="""
      <div class="interp-card"><div class="interp-head" style="background:#DC2626;">VERMELHO E LARANJA</div><div class="interp-body">Atendimento médico imediato / Sala Vermelha (emergência crítica com risco imediato de morte).</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#EAB308;">AMARELO (URGENTE)</div><div class="interp-body">Avaliação prioritária nos consultórios de urgência; risco potencial de agravamento clínico na espera.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#16A34A;">VERDE E AZUL</div><div class="interp-body">Casos de menor gravidade; orientar reavaliação se houver mudança de queixa ou atraso no tempo alvo.</div></div>
    """,
    ref="MACKWAY-JONES, K. et al. Emergency Triage: Manchester Triage Group. BMJ Publishing Group, 1997; Grupo Brasileiro de Classificação de Risco (GBCR)."
)
