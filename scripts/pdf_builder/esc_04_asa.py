# -*- coding: utf-8 -*-
# scripts/pdf_builder/esc_04_asa.py
import sys, os
sys.path.append(os.path.dirname(__file__))
from render_engine import compile_scale_pdf

compile_scale_pdf(
    slug="asa",
    name="CLASSIFICAÇÃO DE ESTADO FÍSICO ASA",
    subtitle="American Society of Anesthesiologists — Avaliação e Estratificação do Risco Cirúrgico-Anestésico",
    criteria_title="ESTRATIFICAÇÃO CLÍNICA PRÉ-OPERATÓRIA (SELECIONAR A CATEGORIA DO PACIENTE)",
    extra_css="""
    .table-data td { padding: 5px 8px !important; }
    .header { margin-bottom: 8px !important; padding: 10px 14px !important; }
    .section-bar { margin: 8px 0 5px !important; }
    .sign-grid { margin: 12px 0 8px !important; }
    .interp-grid { margin-bottom: 10px !important; }
    """,
    criteria_html="""
    <table class="table-data">
      <tr><th style="width:12%;">Classe</th><th style="width:50%;">Definição Clínica e Exemplos Típicos</th><th style="width:30%;">Recomendações e Cuidados de Enfermagem</th><th style="width:8%;text-align:center;">Seleção</th></tr>
      <tr>
        <td><strong>ASA I</strong></td>
        <td><strong>Paciente Hígido:</strong> Normal, saudável, sem distúrbios orgânicos, fisiológicos ou psiquiátricos. Não fumante, consumo nulo/social mínimo de álcool.</td>
        <td>Preparo cirúrgico padrão, confirmação de jejum pré-operatório e identificação segura.</td>
        <td style="text-align:center;"><span class="sq"></span></td>
      </tr>
      <tr>
        <td><strong>ASA II</strong></td>
        <td><strong>Doença Sistêmica Leve a Moderada:</strong> Sem limitação funcional substancial. Ex: HAS bem controlada, DM sem complicações, tabagista ativo, gestação, obesidade IMC 30-39.</td>
        <td>Checagem de medicações de uso contínuo, monitorização glicêmica e pressórica.</td>
        <td style="text-align:center;"><span class="sq"></span></td>
      </tr>
      <tr>
        <td><strong>ASA III</strong></td>
        <td><strong>Doença Sistêmica Grave:</strong> Limitação funcional substancial, mas não incapacitante. Ex: DPOC, DM descompensado, HAS estágio 2, IAM prévio (>3m), obesidade mórbida (IMC ≥40).</td>
        <td>Monitorização multiparamétrica contínua, reserva de hemoderivados e vigilância estrita.</td>
        <td style="text-align:center;"><span class="sq"></span></td>
      </tr>
      <tr>
        <td><strong>ASA IV</strong></td>
        <td><strong>Doença Grave com Ameaça Constante à Vida:</strong> Incapacitante. Ex: IAM recente (<3m), angina instável, ICC descompensada, sepse, disfunção renal em diálise irregular.</td>
        <td>Acesso venoso calibroso/invasivo, drogas vasoativas preparadas e reserva de leito de UTI.</td>
        <td style="text-align:center;"><span class="sq"></span></td>
      </tr>
      <tr>
        <td><strong>ASA V</strong></td>
        <td><strong>Paciente Moribundo:</strong> Não se espera sobrevivência sem o procedimento cirúrgico nas próximas 24h. Ex: rotura de aneurisma aórtico, politrauma catastrófico.</td>
        <td>Assistência intensiva contínua, infusão rápida de hemocomponentes e suporte ventilatório total.</td>
        <td style="text-align:center;"><span class="sq"></span></td>
      </tr>
      <tr>
        <td><strong>ASA VI</strong></td>
        <td><strong>Morte Encefálica Declarada:</strong> Paciente com suporte hemodinâmico para retirada de órgãos destinados a transplante.</td>
        <td>Manutenção rigorosa de perfusão e oxigenação conforme protocolo da CIHDOTT/CNCDO.</td>
        <td style="text-align:center;"><span class="sq"></span></td>
      </tr>
    </table>
    <div style="font-size:7.5pt;background:#EFF6FF;border:1px solid #BFDBFE;padding:4px 8px;border-radius:3px;margin-top:4px;">
      <strong>Sufixo de Emergência (E):</strong> Acrescenta-se a letra 'E' quando a intervenção é emergencial, sem tempo de estabilização prévia:
      <span style="margin-left:14px;"><span class="sq"></span> <strong>Procedimento Cirúrgico de Emergência (E)</strong></span>
    </div>
    """,
    score_html="CLASSIFICAÇÃO DE RISCO ANESTÉSICO-CIRÚRGICO ATRIBUÍDA: &nbsp; [ &nbsp; ASA &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ]",
    interp_title="DIRETRIZES DE SEGURANÇA CIRÚRGICA E PLANEJAMENTO ASSISTENCIAL",
    interp_cards_html="""
      <div class="interp-card">
        <div class="interp-head" style="background:#16A34A;">ASA I e II (BAIXO A MODERADO RISCO)</div>
        <div class="interp-body">Recuperação pós-anestésica habitual na SRPA; transferência planejada para leito de enfermaria/quarto após atingir critérios de alta.</div>
      </div>
      <div class="interp-card">
        <div class="interp-head" style="background:#F97316;">ASA III (ALTO RISCO CIRÚRGICO)</div>
        <div class="interp-body">Vigilância hemodinâmica avançada na SRPA; avaliar necessidade de suporte intermediário ou monitorização invasiva contínua.</div>
      </div>
      <div class="interp-card">
        <div class="interp-head" style="background:#DC2626;">ASA IV, V e VI (RISCO CRÍTICO / UTI)</div>
        <div class="interp-body">Transferência direta do centro cirúrgico para Unidade de Terapia Intensiva (UTI) com ventilação mecânica e drogas vasoativas.</div>
      </div>
    """,
    ref="American Society of Anesthesiologists. ASA Physical Status Classification System. Last approved by the ASA House of Delegates, 2020."
)
