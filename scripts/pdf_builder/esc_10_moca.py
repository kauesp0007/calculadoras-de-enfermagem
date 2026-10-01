# -*- coding: utf-8 -*-
# scripts/pdf_builder/esc_10_moca.py
import sys, os
sys.path.append(os.path.dirname(__file__))
from render_engine import compile_scale_pdf

compile_scale_pdf(
    slug="moca",
    name="ESCALA MOCA (MONTREAL COGNITIVE ASSESSMENT)",
    subtitle="Rastreio Breve para Detecção de Comprometimento Cognitivo Leve e Demência",
    criteria_title="AVALIAÇÃO COGNITIVA MULTIDOMÍNIO (PONTUAÇÃO MÁXIMA DE 30 PONTOS)",
    criteria_html="""
    <table class="table-data" style="font-size:7.5pt;">
      <tr><th style="width:24%;">Domínio Cognitivo</th><th style="width:64%;">Instruções Clínicas e Tarefas Aplicadas</th><th style="width:12%;text-align:center;">Pontos</th></tr>
      <tr>
        <td><strong>1. Visuoespacial / Executiva</strong></td>
        <td>&bull; Trilha alternada 1-A-2-B-3-C-4-D-5-E: [ ] Correto (1 pt)<br>&bull; Cópia tridimensional do cubo: [ ] Desenho preciso (1 pt)<br>&bull; Desenho do relógio (11h10): [ ] Contorno (1) &bull; [ ] Números (1) &bull; [ ] Ponteiros (1)</td>
        <td style="text-align:center;font-weight:bold;">[&nbsp;&nbsp;&nbsp;&nbsp;] / 5</td>
      </tr>
      <tr>
        <td><strong>2. Nomeação</strong></td>
        <td>Identificar e nomear figuras: [ ] Leão (1 pt) &bull; [ ] Rinoceronte (1 pt) &bull; [ ] Camelo/Dromedário (1 pt)</td>
        <td style="text-align:center;font-weight:bold;">[&nbsp;&nbsp;&nbsp;&nbsp;] / 3</td>
      </tr>
      <tr>
        <td><strong>3. Memória (Registro)</strong></td>
        <td>Leitura de 5 palavras (Rosto, Seda, Igreja, Cravo, Vermelho): 2 tentativas. (Sem pontuação nesta etapa).</td>
        <td style="text-align:center;color:#64748B;">Registro</td>
      </tr>
      <tr>
        <td><strong>4. Atenção</strong></td>
        <td>&bull; Dígitos ordem direta (2-1-8-5-4): [ ] (1 pt) &bull; Ordem inversa (7-4-2): [ ] (1 pt)<br>&bull; Bater palma na letra 'A' em sequência (<2 erros): [ ] (1 pt)<br>&bull; Subtração de 7 a partir de 100: [ ] 4-5 corretos (3 pts) &bull; [ ] 2-3 (2 pts) &bull; [ ] 1 correto (1 pt)</td>
        <td style="text-align:center;font-weight:bold;">[&nbsp;&nbsp;&nbsp;&nbsp;] / 6</td>
      </tr>
      <tr>
        <td><strong>5. Linguagem</strong></td>
        <td>&bull; Repetição de 2 frases complexas: [ ] Frase 1 (1 pt) &bull; [ ] Frase 2 (1 pt)<br>&bull; Fluência verbal (≥11 palavras iniciadas pela letra 'F' em 60 segundos): [ ] (1 pt)</td>
        <td style="text-align:center;font-weight:bold;">[&nbsp;&nbsp;&nbsp;&nbsp;] / 3</td>
      </tr>
      <tr>
        <td><strong>6. Abstração</strong></td>
        <td>Identificar semelhança: [ ] Trem &mdash; Bicicleta (transporte) (1 pt) &bull; [ ] Relógio &mdash; Régua (medição) (1 pt)</td>
        <td style="text-align:center;font-weight:bold;">[&nbsp;&nbsp;&nbsp;&nbsp;] / 2</td>
      </tr>
      <tr>
        <td><strong>7. Evocação Tardia</strong></td>
        <td>Lembrança espontânea das 5 palavras: [ ] Rosto (1) &bull; [ ] Seda (1) &bull; [ ] Igreja (1) &bull; [ ] Cravo (1) &bull; [ ] Vermelho (1)</td>
        <td style="text-align:center;font-weight:bold;">[&nbsp;&nbsp;&nbsp;&nbsp;] / 5</td>
      </tr>
      <tr>
        <td><strong>8. Orientação</strong></td>
        <td>[ ] Dia do mês (1) &bull; [ ] Mês (1) &bull; [ ] Ano (1) &bull; [ ] Dia da semana (1) &bull; [ ] Lugar (1) &bull; [ ] Cidade (1)</td>
        <td style="text-align:center;font-weight:bold;">[&nbsp;&nbsp;&nbsp;&nbsp;] / 6</td>
      </tr>
    </table>
    <div style="font-size:7.2pt;color:#1E3A8A;background:#EFF6FF;border:1px solid #BFDBFE;padding:3px 6px;border-radius:3px;margin-top:2px;">
      <strong>Ajuste de Escolaridade:</strong> Adicionar <strong>+1 ponto</strong> ao escore se o paciente possuir &le; 12 anos de escolaridade formal: <span class="sq"></span> +1 ponto aplicado
    </div>
    """,
    score_html="ESCORE TOTAL MOCA (0 a 30): &nbsp; [ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ] PONTOS",
    interp_title="INTERPRETAÇÃO COGNITIVA E CRITÉRIOS DE CORTE",
    interp_cards_html="""
      <div class="interp-card"><div class="interp-head" style="background:#16A34A;">&ge; 26 PONTOS</div><div class="interp-body"><strong>Função Cognitiva Normal:</strong> Desempenho dentro dos parâmetros esperados para a faixa etária.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#F97316;">18 a 25 PONTOS</div><div class="interp-body"><strong>Sugestivo de Comprometimento Cognitivo Leve (CCL):</strong> Encaminhar para avaliação neuropsicológica especializada.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#DC2626;">&lt; 18 PONTOS</div><div class="interp-body"><strong>Sugestivo de Síndrome Demencial:</strong> Déficit cognitivo multidomínio significativo; investigar etiologia médica.</div></div>
    """,
    ref="NASREDDINE, Z. S. et al. The Montreal Cognitive Assessment, MoCA: a brief screening tool for mild cognitive impairment. J Am Geriatr Soc, 2005; 53(4):695-699."
)
