# Dimensionamento integrado — Estação de Enfermagem

A área reutiliza o cadastro de pacientes e as avaliações da Estação. Em unidades de internação, o usuário escolhe **Fugulin** ou **Perroca**. Quando a fonte é o banco local, usa-se somente a última classificação de cada paciente em cada dia; a taxa de ocupação não é reaplicada ao censo observado. Dias sem classificação compatível são sinalizados, em vez de tratados como carga zero.

## Métodos incluídos
- Unidade de internação: SCP → THE → QP; banco ou contagem manual com TO.
- Centro cirúrgico: portes I–IV (2,1 / 3,6 / 5,6 / 9,1 h).
- Hemodiálise: 4 h/paciente/sessão; 25% Enfermeiros e 75% técnicos.
- Oncologia/hematologia: reconstrução didática com 3,31 h, Sn=4,4 e proporção 80/20; marcada para conferência no documento oficial.
- CME e CDI: volume × tempo; CDI separado por categoria.
- Urgência/emergência e CAPS sem SCP aplicável: Sítio Funcional + Espelho Semanal Padrão.
- Saúde mental: GDD/GDI/GDP.
- APS: WISN adaptado com TTD, Qdir e Q = Qdir × (1 + Qind%).

Os cenários ficam em `dimensioning_records`, no mesmo banco local protegido, entram no backup e têm auditoria.

## Fontes
Parecer Normativo nº 1/2024/COFEN: https://www.cofen.gov.br/parecer-normativo-no-1-2024-cofen/

Perroca (2011): https://doi.org/10.1590/S0104-11692011000100009

Santos et al. (2007): https://doi.org/10.1590/S0104-11692007000500015

A ferramenta apoia cálculo e documentação. O Enfermeiro/RT continua responsável por conferir dados, método, arredondamentos, parâmetros institucionais e normativa vigente antes da aplicação.
