# -*- coding: utf-8 -*-
# scripts/pdf_builder/esc_24_waterlow.py
import sys, os
sys.path.append(os.path.dirname(__file__))
from render_engine import compile_scale_pdf

compile_scale_pdf(
    slug="waterlow",
    name="ESCALA DE WATERLOW",
    subtitle="Avaliação Multifatorial do Risco de Desenvolvimento de Lesões por Pressão",
    criteria_title="CATEGORIAS CUMULATIVAS DE RISCO (MARCAR TODOS OS FATORES PRESENTES)",
    criteria_html="""
    <div class="grid-2col">
      <div>
        <div class="item-box"><span class="item-box-title">1. Constituição / IMC</span><br>[ ] Médio (0) &bull; [ ] Acima média (1) &bull; [ ] Obeso (2) &bull; [ ] Abaixo média (3)</div>
        <div class="item-box"><span class="item-box-title">2. Tipo de Pele / Áreas de Risco</span><br>[ ] Saudável (0) &bull; [ ] Fina/Papel (1) &bull; [ ] Ressecada (1) &bull; [ ] Edemaciada (1) &bull; [ ] Fria/úmida (1) &bull; [ ] Descolorida (2) &bull; [ ] Lesão presente (3)</div>
        <div class="item-box"><span class="item-box-title">3. Sexo e Idade</span><br>[ ] Masc (1) &bull; [ ] Fem (2) &bull; [ ] 14-49a (1) &bull; [ ] 50-64a (2) &bull; [ ] 65-74a (3) &bull; [ ] 75-80a (4) &bull; [ ] >80a (5)</div>
        <div class="item-box"><span class="item-box-title">4. Continência de Esfíncteres</span><br>[ ] Continente (0) &bull; [ ] Incontinência ocasional (1) &bull; [ ] Cateterizado (2) &bull; [ ] Incontinência dupla (3)</div>
        <div class="item-box"><span class="item-box-title">5. Mobilidade Geral</span><br>[ ] Plena (0) &bull; [ ] Inquieta (1) &bull; [ ] Apático (2) &bull; [ ] Restrito (3) &bull; [ ] Confinado à cama (4) &bull; [ ] Imóvel (5)</div>
      </div>
      <div>
        <div class="item-box"><span class="item-box-title">6. Apetite e Nutrição</span><br>[ ] Médio (0) &bull; [ ] Pobre (1) &bull; [ ] SNG / NPT (2) &bull; [ ] Anorexia / Jejum (3)</div>
        <div class="item-box"><span class="item-box-title">7. Cirurgia ou Trauma Recente</span><br>[ ] Cirurgia ortopédica/lombar (>2h) (5) &bull; [ ] Cirurgia na mesa >2h (5)</div>
        <div class="item-box"><span class="item-box-title">8. Medicações de Alto Risco</span><br>[ ] Citotóxicos (4) &bull; [ ] Corticoides alta dose (4) &bull; [ ] Anti-inflamatórios (4)</div>
        <div class="item-box"><span class="item-box-title">9. Déficit Neurológico</span><br>[ ] Diabetes / Neuropatia (4) &bull; [ ] AVC / Paraplegia (4 a 6)</div>
        <div class="item-box"><span class="item-box-title">10. Doença Vascular / Falência</span><br>[ ] DAOP / Isquemia (5) &bull; [ ] Anemia grave Hb<8 (2) &bull; [ ] Fumo (1)</div>
      </div>
    </div>
    """,
    score_html="ESCORE TOTAL DE WATERLOW: &nbsp; [ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ] PONTOS",
    interp_title="ESTRATIFICAÇÃO DE RISCO PARA LESÃO POR PRESSÃO",
    interp_cards_html="""
      <div class="interp-card"><div class="interp-head" style="background:#EAB308;">10 a 14 PONTOS (EM RISCO)</div><div class="interp-body">Colchão redutor de pressão, hidratação cutânea diária, controle de umidade e inspeção regular no banho.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#F97316;">15 a 19 PONTOS (ALTO RISCO)</div><div class="interp-body">Mudança de decúbito a cada 2h rigorosa, proteção de proeminências ósseas e suplementação nutricional.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#DC2626;">&ge; 20 PONTOS (MUITO ALTO RISCO)</div><div class="interp-body">Colchão de ar alternado dinâmico, coberturas profiláticas em sacro/calcâneos e vigilância estrita por turno.</div></div>
    """,
    ref="WATERLOW, J. Pressure sores: a risk assessment card. Nursing Times, 1985; 81(48):49-55."
)
