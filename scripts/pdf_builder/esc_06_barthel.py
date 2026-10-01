# -*- coding: utf-8 -*-
# scripts/pdf_builder/esc_06_barthel.py
import sys, os
sys.path.append(os.path.dirname(__file__))
from render_engine import compile_scale_pdf

compile_scale_pdf(
    slug="barthel",
    name="ÍNDICE DE BARTHEL",
    subtitle="Avaliação da Independência Funcional em Atividades da Vida Diária (AVD)",
    criteria_title="10 ITENS DE AVALIAÇÃO FUNCIONAL (MARCAR 1 OPÇÃO POR ATIVIDADE)",
    criteria_html="""
    <div class="grid-2col">
      <div>
        <div class="item-box"><span class="item-box-title">1. Alimentação</span><br>
          <div class="opt"><span class="sq"></span> Independente (10)</div>
          <div class="opt"><span class="sq"></span> Necessita de ajuda (cortar, passar manteiga) (5)</div>
          <div class="opt"><span class="sq"></span> Incapaz / Dependente (0)</div>
        </div>
        <div class="item-box"><span class="item-box-title">2. Banho</span><br>
          <div class="opt"><span class="sq"></span> Independente (lava-se sozinho sem auxílio) (5)</div>
          <div class="opt"><span class="sq"></span> Dependente / Necessita de auxílio (0)</div>
        </div>
        <div class="item-box"><span class="item-box-title">3. Higiene Pessoal (Rosto, Dentes, Barbear)</span><br>
          <div class="opt"><span class="sq"></span> Independente (5)</div>
          <div class="opt"><span class="sq"></span> Dependente (0)</div>
        </div>
        <div class="item-box"><span class="item-box-title">4. Vestir-se (Inclui Sapatos, Zíper, Botões)</span><br>
          <div class="opt"><span class="sq"></span> Independente (10)</div>
          <div class="opt"><span class="sq"></span> Necessita de ajuda (5)</div>
          <div class="opt"><span class="sq"></span> Incapaz (0)</div>
        </div>
        <div class="item-box"><span class="item-box-title">5. Controle Intestinal (Evacuação)</span><br>
          <div class="opt"><span class="sq"></span> Continente / Normal (10)</div>
          <div class="opt"><span class="sq"></span> Acidentes ocasionais (5)</div>
          <div class="opt"><span class="sq"></span> Incontinente (0)</div>
        </div>
      </div>
      <div>
        <div class="item-box"><span class="item-box-title">6. Controle Vesical (Micção)</span><br>
          <div class="opt"><span class="sq"></span> Continente / Normal (10)</div>
          <div class="opt"><span class="sq"></span> Acidentes ocasionais (5)</div>
          <div class="opt"><span class="sq"></span> Incontinente / SVD (0)</div>
        </div>
        <div class="item-box"><span class="item-box-title">7. Uso do Vaso Sanitário</span><br>
          <div class="opt"><span class="sq"></span> Independente (10)</div>
          <div class="opt"><span class="sq"></span> Necessita de ajuda (5)</div>
          <div class="opt"><span class="sq"></span> Incapaz (0)</div>
        </div>
        <div class="item-box"><span class="item-box-title">8. Transferência (Leito &harr; Cadeira)</span><br>
          <div class="opt"><span class="sq"></span> Independente (15)</div>
          <div class="opt"><span class="sq"></span> Ajuda mínima / supervisão (10)</div>
          <div class="opt"><span class="sq"></span> Grande ajuda física (5) &bull; Incapaz (0)</div>
        </div>
        <div class="item-box"><span class="item-box-title">9. Deambulação / Mobilidade</span><br>
          <div class="opt"><span class="sq"></span> Independente >50 metros (15)</div>
          <div class="opt"><span class="sq"></span> Ajuda física / verbal >50m (10)</div>
          <div class="opt"><span class="sq"></span> Cadeira de rodas independente (5) &bull; Imóvel (0)</div>
        </div>
        <div class="item-box"><span class="item-box-title">10. Subir e Descer Escadas</span><br>
          <div class="opt"><span class="sq"></span> Independente (10)</div>
          <div class="opt"><span class="sq"></span> Necessita de ajuda ou corrimão (5)</div>
          <div class="opt"><span class="sq"></span> Incapaz (0)</div>
        </div>
      </div>
    </div>
    """,
    score_html="ESCORE TOTAL DE BARTHEL (0 a 100): &nbsp; [ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ] PONTOS",
    interp_title="CLASSIFICAÇÃO DO GRAU DE DEPENDÊNCIA FUNCIONAL",
    interp_cards_html="""
      <div class="interp-card"><div class="interp-head" style="background:#DC2626;">0 a 20 PONTOS</div><div class="interp-body"><strong>Dependência Total:</strong> Necessidade de suporte integral para todas as atividades básicas.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#EA580C;">21 a 60 PONTOS</div><div class="interp-body"><strong>Dependência Severa:</strong> Requer assistência contínua em higiene, mobilidade e autocuidado.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#EAB308;">61 a 90 PONTOS</div><div class="interp-body"><strong>Dependência Moderada:</strong> Necessita de auxílio parcial em tarefas específicas.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#16A34A;">91 a 100 PONTOS</div><div class="interp-body"><strong>Dependência Leve / Independente:</strong> Autonomia preservada nas AVDs cotidianas.</div></div>
    """,
    ref="MAHONEY, F. I.; BARTHEL, D. W. Functional evaluation: the Barthel Index. Maryland State Medical Journal, 1965; 14:61-65."
)
