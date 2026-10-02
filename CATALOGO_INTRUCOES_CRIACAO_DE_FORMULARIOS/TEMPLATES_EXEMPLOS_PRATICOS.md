# Templates e Exemplos Práticos de Código

Este documento reúne três modelos práticos completos, prontos para cópia e execução por qualquer Inteligência Artificial ou desenvolvedor, cobrindo as 3 variações existentes de escalas clínicas no portal **Calculadoras de Enfermagem**.

---

## Modelo A: Escala Padrão / Simples (Coluna Única)
*Ideal para escalas de 3 a 10 critérios com alta densidade textual ou parâmetros fisiológicos.*

```python
# -*- coding: utf-8 -*-
from MOTOR_DE_RENDERIZACAO_CANONICO import FormPDFEngine

engine = FormPDFEngine(
    title="ÍNDICE DE APGAR",
    subtitle="Avaliação da Vitalidade e Adaptação do Recém-Nascido no 1º e 5º Minutos de Vida",
    max_score="10 pontos",
    reference="Apgar V. A proposal for a new method of evaluation of the newborn infant. Anesth Analg, 1953."
)

engine.add_table_section("AVALIAÇÃO NO 1º E 5º MINUTO DE VIDA", [
    ("Frequência Cardíaca", [
        ("Ausente", 0),
        ("< 100 bpm", 1),
        ("≥ 100 bpm", 2)
    ]),
    ("Esforço Respiratório", [
        ("Ausente", 0),
        ("Lento / Irregular / Choro fraco", 1),
        ("Bom / Choro forte", 2)
    ]),
    ("Tônus Muscular", [
        ("Flácido", 0),
        ("Alguma flexão de extremidades", 1),
        ("Movimentos ativos / Boa flexão", 2)
    ]),
    ("Irritabilidade Reflexa", [
        ("Sem resposta", 0),
        ("Algum movimento / Careta", 1),
        ("Espirros / Tosse / Choro vigoroso", 2)
    ]),
    ("Cor da Pele (Cianose)", [
        ("Cianose central / Pálido", 0),
        ("Corpo rosado / Extremidades cianóticas (Acrocianose)", 1),
        ("Completamente rosado", 2)
    ])
])

engine.set_risk_stratification([
    ("Adaptação Favorável", "8 a 10 pontos", "RN vigoroso. Cuidados de rotina em sala de parto, contato pele a pele e estímulo ao aleitamento.", "green"),
    ("Asfixia Leve a Moderada", "4 a 7 pontos", "Necessidade de assistência ventilatória (VPP), aspiração de vias aéreas e monitorização contínua.", "yellow"),
    ("Asfixia Grave", "0 a 3 pontos", "Urgência neonatal imediata: reanimação cardiopulmonar, VPP, intubação traqueal e acionamento de UTI Neo.", "red")
])

engine.render("c:/calculadoras-de-enfermagem/FORMULARIOS_DE_ESCALAS/formulario_escala_de_apgar.pdf")
```

---

## Modelo B: Escala Densa / Longa (Duas Colunas Paralelas)
*Ideal para escalas com mais de 10 itens (Barthel, Berg, APACHE II, SAPS 3), impedindo que o documento quebre para a 2ª página.*

```python
# -*- coding: utf-8 -*-
from MOTOR_DE_RENDERIZACAO_CANONICO import FormPDFEngine

engine = FormPDFEngine(
    title="ÍNDICE DE BARTHEL",
    subtitle="Avaliação da Independência Funcional nas Atividades Básicas de Vida Diária (AVDs)",
    max_score="100 pontos",
    reference="Mahoney FI, Barthel DW. Functional evaluation: the Barthel Index. Md State Med J, 1965."
)

# Ativação do modo duas colunas
engine.layout_mode = "double_col"

engine.add_table_section("1. ALIMENTAÇÃO", [
    ("Capacidade de alimentar-se", [("Incapaz", 0), ("Precisa de ajuda", 5), ("Independente", 10)])
])
engine.add_table_section("2. BANHO", [
    ("Higiene corporal no chuveiro/leito", [("Dependente", 0), ("Independente", 5)])
])
engine.add_table_section("3. VESTUÁRIO", [
    ("Capacidade de vestir-se e despir-se", [("Dependente", 0), ("Precisa de ajuda", 5), ("Independente", 10)])
])
engine.add_table_section("4. HIGIENE PESSOAL", [
    ("Lavar rosto, pentear-se e dentes", [("Dependente", 0), ("Independente", 5)])
])
engine.add_table_section("5. ELIMINAÇÃO INTESTINAL", [
    ("Controle esfincteriano fecal", [("Incontinente", 0), ("Acidente ocasional", 5), ("Continente", 10)])
])
engine.add_table_section("6. ELIMINAÇÃO VESICAL", [
    ("Controle esfincteriano urinário", [("Incontinente / SVD", 0), ("Acidente ocasional", 5), ("Continente", 10)])
])
engine.add_table_section("7. USO DO VASO SANITÁRIO", [
    ("Ida ao banheiro, despir-se e limpar-se", [("Dependente", 0), ("Precisa de ajuda", 5), ("Independente", 10)])
])
engine.add_table_section("8. TRANSFERÊNCIA LEITO-CADEIRA", [
    ("Mudança de decúbito e sentar-se", [("Incapaz", 0), ("Grande ajuda", 5), ("Pequena ajuda", 10), ("Independente", 15)])
])
engine.add_table_section("9. MOBILIDADE / MARCHA", [
    ("Deambulação por pelo menos 50 metros", [("Imóvel", 0), ("Cadeira de rodas", 5), ("Com ajuda", 10), ("Independente", 15)])
])
engine.add_table_section("10. SUBIR ESCADAS", [
    ("Subir e descer lances de degraus", [("Incapaz", 0), ("Precisa de ajuda", 5), ("Independente", 10)])
])

engine.set_risk_stratification([
    ("Independência Total", "100 pts", "Capaz de realizar todas as AVDs sem auxílio.", "green"),
    ("Dependência Leve", "91 a 99 pts", "Pequeno suporte em atividades específicas.", "green"),
    ("Dependência Moderada", "61 a 90 pts", "Necessita de assistência parcial para AVDs.", "yellow"),
    ("Dependência Grave", "21 a 60 pts", "Grande dependência assistencial da enfermagem.", "orange"),
    ("Dependência Total", "0 a 20 pts", "Dependência total e contínua em leito.", "red")
])

engine.render("c:/calculadoras-de-enfermagem/FORMULARIOS_DE_ESCALAS/formulario_escala_de_barthel.pdf")
```


---

## Modelo C: Escala com Estímulos Gráficos Vetoriais (SVG)
*Ideal para escalas com tarefas de desenho, reconhecimento geométrico ou réguas visuais (MoCA, EVA, END).*

```python
# -*- coding: utf-8 -*-
from MOTOR_DE_RENDERIZACAO_CANONICO import FormPDFEngine

engine = FormPDFEngine(
    title="ESCALA VISUAL ANALÓGICA E NUMÉRICA DE DOR (EVA / END)",
    subtitle="Avaliação da Intensidade da Dor e Protocolo Assistencial de Analgesia",
    max_score="10 pontos",
    reference="Huskisson EC. Measurement of pain. Lancet, 1974."
)

regua_svg = '''
<div class="visual-box" style="margin: 4px 0;">
    <div class="visual-title">RÉGUA DE INTENSIDADE DA DOR (0 A 10)</div>
    <svg width="100%" height="52" viewBox="0 0 700 52" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="gradDor" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#16A34A" />
                <stop offset="30%" stop-color="#EAB308" />
                <stop offset="60%" stop-color="#F97316" />
                <stop offset="100%" stop-color="#DC2626" />
            </linearGradient>
        </defs>
        <rect x="20" y="8" width="660" height="12" rx="6" fill="url(#gradDor)" stroke="#64748B" stroke-width="1" />
        <g font-family="Arial" font-size="11" font-weight="bold" text-anchor="middle" fill="#1e293b">
            <text x="20" y="34">0</text><line x1="20" y1="20" x2="20" y2="26" stroke="#1e293b" stroke-width="2"/>
            <text x="86" y="34">1</text><line x1="86" y1="20" x2="86" y2="24" stroke="#1e293b" stroke-width="1"/>
            <text x="152" y="34">2</text><line x1="152" y1="20" x2="152" y2="24" stroke="#1e293b" stroke-width="1"/>
            <text x="218" y="34">3</text><line x1="218" y1="20" x2="218" y2="24" stroke="#1e293b" stroke-width="1"/>
            <text x="284" y="34">4</text><line x1="284" y1="20" x2="284" y2="24" stroke="#1e293b" stroke-width="1"/>
            <text x="350" y="34">5</text><line x1="350" y1="20" x2="350" y2="26" stroke="#1e293b" stroke-width="2"/>
            <text x="416" y="34">6</text><line x1="416" y1="20" x2="416" y2="24" stroke="#1e293b" stroke-width="1"/>
            <text x="482" y="34">7</text><line x1="482" y1="20" x2="482" y2="24" stroke="#1e293b" stroke-width="1"/>
            <text x="548" y="34">8</text><line x1="548" y1="20" x2="548" y2="24" stroke="#1e293b" stroke-width="1"/>
            <text x="614" y="34">9</text><line x1="614" y1="20" x2="614" y2="24" stroke="#1e293b" stroke-width="1"/>
            <text x="680" y="34">10</text><line x1="680" y1="20" x2="680" y2="26" stroke="#1e293b" stroke-width="2"/>
        </g>
        <g font-family="Arial" font-size="9" font-weight="bold" fill="#475569">
            <text x="20" y="48" text-anchor="start">SEM DOR</text>
            <text x="218" y="48" text-anchor="middle">LEVE</text>
            <text x="416" y="48" text-anchor="middle">MODERADA</text>
            <text x="614" y="48" text-anchor="middle">INTENSA</text>
            <text x="680" y="48" text-anchor="end">PIOR DOR POSSÍVEL</text>
        </g>
    </svg>
</div>
'''

engine.add_raw_html_section(regua_svg)

engine.add_table_section("PARÂMETROS DE AVALIAÇÃO DA QUEIXA ÁLGICA", [
    ("Localização Anatômica", [("Cabeça/Pescoço", 1), ("Tórax", 2), ("Abdome", 3), ("Membros", 4), ("Coluna/Dorso", 5)]),
    ("Tipo / Sensação da Dor", [("Queimação", 1), ("Pulsátil", 2), ("Pontada/Fisgada", 3), ("Pressão/Aperto", 4), ("Cólica", 5)]),
    ("Frequência / Comportamento", [("Contínua", 1), ("Intermitente", 2), ("Ao esforço/tosse", 3), ("Em repouso", 4)]),
    ("Fatores de Melhora / Piora", [("Alívio c/ repouso", 1), ("Piora à palpação", 2), ("Sem alívio espontâneo", 3)])
])

engine.set_risk_stratification([
    ("Sem Dor", "0 pts", "Paciente confortável. Manter vigilância assistencial.", "green"),
    ("Dor Leve", "1 a 3 pts", "Medidas de conforto, posicionamento e analgesia simples conforme prescrição.", "yellow"),
    ("Dor Moderada", "4 a 6 pts", "Analgesia de horário, reavaliação em 60 min e registro de evolução.", "orange"),
    ("Dor Intensa / Pior Dor", "7 a 10 pts", "Conduta imediata: analgesia potente, verificação de sinais vitais e reavaliação em 30 min.", "red")
])

engine.render("c:/calculadoras-de-enfermagem/FORMULARIOS_DE_ESCALAS/formulario_escala_de_escalanumerica.pdf")
```

