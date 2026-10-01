# Inventário de rotas do sistema de contas — fotografia de 01/10/2026

Fonte: SELECT read-only de public.developer_premium_route_rules no projeto asjkftjfbkuuhilnqonx. Este arquivo registra um instante; o painel do desenvolvedor altera a tabela em tempo real. A função premium-content usa primeiro a regra exata e depois o filename da raiz, quando a rota tem prefixo de idioma. Ausência de regra com conteúdo privado exige Premium por padrão. Não deduzir estado de todas as páginas do site a partir desta lista: só 347 rotas estão explicitamente cadastradas.

## Totais por escopo

| Escopo | Regras | Premium | Free |
|---|---:|---:|---:|
| raiz | 77 | 75 | 2 |
| en | 37 | 35 | 2 |
| es | 41 | 40 | 1 |
| de | 12 | 10 | 2 |
| it | 12 | 10 | 2 |
| fr | 12 | 10 | 2 |
| hi | 12 | 10 | 2 |
| zh | 12 | 10 | 2 |
| ar | 12 | 9 | 3 |
| ja | 12 | 10 | 2 |
| ru | 12 | 10 | 2 |
| ko | 12 | 10 | 2 |
| tr | 12 | 10 | 2 |
| nl | 12 | 10 | 2 |
| pl | 12 | 10 | 2 |
| sv | 12 | 10 | 2 |
| id | 12 | 10 | 2 |
| vi | 12 | 10 | 2 |
| uk | 12 | 10 | 2 |

## Regras explícitas

A coluna enforcement era protected_content em todas as 347 regras no momento da consulta. Fonte premium_content_pages em todas as 347. Premium indica premium_required=true; Free indica false. Uma rota Free com cópia em premium_content_pages pode ser entregue sem login pela função.

| Caminho | Plano exigido |
|---|---|
| adicional-noturno.html | Premium |
| ar/balancohidrico.html | Free |
| ar/braden.html | Free |
| ar/elpo.html | Premium |
| ar/formulario-saep-enfermagem.html | Premium |
| ar/fugulin.html | Free |
| ar/glasgow.html | Premium |
| ar/medicamentos.html | Premium |
| ar/meem.html | Premium |
| ar/moca.html | Premium |
| ar/morse.html | Premium |
| ar/perroca.html | Premium |
| ar/zarit.html | Premium |
| balancohidrico.html | Premium |
| biblioteca-provas.html | Premium |
| braden.html | Free |
| calculo-hora-extra.html | Premium |
| de/balancohidrico.html | Premium |
| de/braden.html | Free |
| de/elpo.html | Premium |
| de/formulario-saep-enfermagem.html | Premium |
| de/fugulin.html | Free |
| de/glasgow.html | Premium |
| de/medicamentos.html | Premium |
| de/meem.html | Premium |
| de/moca.html | Premium |
| de/morse.html | Premium |
| de/perroca.html | Premium |
| de/zarit.html | Premium |
| dimensionamento-cofen.html | Premium |
| dimensionamento.html | Premium |
| elpo.html | Premium |
| en/balancohidrico.html | Premium |
| en/braden.html | Free |
| en/elpo.html | Premium |
| en/formulario_avaliacao_da_cabeca_aos_pes.html | Premium |
| en/formulario_bishop.html | Premium |
| en/formulario_bps.html | Premium |
| en/formulario_cam.html | Premium |
| en/formulario_capurro.html | Premium |
| en/formulario_carrinho.html | Premium |
| en/formulario_de_fugulin.html | Premium |
| en/formulario_escala_cincinnati.html | Premium |
| en/formulario_escala_curb65.html | Premium |
| en/formulario_escala_de_downton.html | Premium |
| en/formulario_escala_de_elpo.html | Premium |
| en/formulario_escala_de_gosnell.html | Premium |
| en/formulario_escala_de_hamilton.html | Premium |
| en/formulario_escala_de_hendrich.html | Premium |
| en/formulario_escala_de_humpty.html | Premium |
| en/formulario_escala_de_johns.html | Premium |
| en/formulario_escala_de_jouvet.html | Premium |
| en/formulario_escala_de_lachs.html | Premium |
| en/formulario_escala_de_lanss.html | Premium |
| en/formulario_escala_de_meows.html | Premium |
| en/formulario_escala_de_news.html | Premium |
| en/formulario_escala_de_nips.html | Premium |
| en/formulario_escala_de_perroca.html | Premium |
| en/formulario_meem.html | Premium |
| en/formulario_morse.html | Premium |
| en/formulario-saep-enfermagem.html | Premium |
| en/fugulin.html | Free |
| en/glasgow.html | Premium |
| en/medicamentos.html | Premium |
| en/meem.html | Premium |
| en/moca.html | Premium |
| en/morse.html | Premium |
| en/perroca.html | Premium |
| en/zarit.html | Premium |
| es/balancohidrico.html | Premium |
| es/ballard.html | Premium |
| es/braden.html | Premium |
| es/capurro.html | Premium |
| es/elpo.html | Premium |
| es/formulario_avaliacao_da_cabeca_aos_pes.html | Premium |
| es/formulario_bishop.html | Premium |
| es/formulario_bps.html | Premium |
| es/formulario_cam.html | Premium |
| es/formulario_capurro.html | Premium |
| es/formulario_carrinho.html | Premium |
| es/formulario_de_fugulin.html | Premium |
| es/formulario_escala_cincinnati.html | Premium |
| es/formulario_escala_curb65.html | Premium |
| es/formulario_escala_de_downton.html | Premium |
| es/formulario_escala_de_elpo.html | Premium |
| es/formulario_escala_de_gosnell.html | Premium |
| es/formulario_escala_de_hamilton.html | Premium |
| es/formulario_escala_de_hendrich.html | Premium |
| es/formulario_escala_de_humpty.html | Premium |
| es/formulario_escala_de_johns.html | Premium |
| es/formulario_escala_de_jouvet.html | Premium |
| es/formulario_escala_de_lachs.html | Premium |
| es/formulario_escala_de_lanss.html | Premium |
| es/formulario_escala_de_meows.html | Premium |
| es/formulario_escala_de_news.html | Premium |
| es/formulario_escala_de_nips.html | Premium |
| es/formulario_escala_de_perroca.html | Premium |
| es/formulario_meem.html | Premium |
| es/formulario_morse.html | Premium |
| es/formulario-saep-enfermagem.html | Premium |
| es/fugulin.html | Free |
| es/gasometria.html | Premium |
| es/glasgow.html | Premium |
| es/gotejamento.html | Premium |
| es/medicamentos.html | Premium |
| es/meem.html | Premium |
| es/moca.html | Premium |
| es/morse.html | Premium |
| es/perroca.html | Premium |
| es/zarit.html | Premium |
| flashcards_quiz.html | Premium |
| formulario_avaliacao_da_cabeca_aos_pes.html | Premium |
| formulario_bishop.html | Premium |
| formulario_bps.html | Premium |
| formulario_cam.html | Premium |
| formulario_capurro.html | Premium |
| formulario_carrinho.html | Premium |
| formulario_de_fugulin.html | Premium |
| formulario_escala_cincinnati.html | Premium |
| formulario_escala_curb65.html | Premium |
| formulario_escala_de_downton.html | Premium |
| formulario_escala_de_elpo.html | Premium |
| formulario_escala_de_fast.html | Premium |
| formulario_escala_de_flacc.html | Premium |
| formulario_escala_de_four.html | Premium |
| formulario_escala_de_glasgow.html | Premium |
| formulario_escala_de_gosnell.html | Premium |
| formulario_escala_de_hamilton.html | Premium |
| formulario_escala_de_hendrich.html | Premium |
| formulario_escala_de_humpty.html | Premium |
| formulario_escala_de_johns.html | Premium |
| formulario_escala_de_jouvet.html | Premium |
| formulario_escala_de_lachs.html | Premium |
| formulario_escala_de_lanss.html | Premium |
| formulario_escala_de_lawton.html | Premium |
| formulario_escala_de_meows.html | Premium |
| formulario_escala_de_news.html | Premium |
| formulario_escala_de_nihss.html | Premium |
| formulario_escala_de_nips.html | Premium |
| formulario_escala_de_norton.html | Premium |
| formulario_escala_de_ofras.html | Premium |
| formulario_escala_de_painad.html | Premium |
| formulario_escala_de_perroca.html | Premium |
| formulario_impresso_saep.html | Premium |
| formulario_impresso_sbar.html | Premium |
| formulario_meem.html | Premium |
| formulario_morse.html | Premium |
| formulario-saep-enfermagem.html | Premium |
| formularios_de_escalas_assistenciais.html | Premium |
| formularios-em-branco-de-escalas.html | Premium |
| fotmulario_escala_de_perroca.html | Premium |
| fr/balancohidrico.html | Premium |
| fr/braden.html | Free |
| fr/elpo.html | Premium |
| fr/formulario-saep-enfermagem.html | Premium |
| fr/fugulin.html | Free |
| fr/glasgow.html | Premium |
| fr/medicamentos.html | Premium |
| fr/meem.html | Premium |
| fr/moca.html | Premium |
| fr/morse.html | Premium |
| fr/perroca.html | Premium |
| fr/zarit.html | Premium |
| fugulin.html | Premium |
| glasgow.html | Premium |
| hi/balancohidrico.html | Premium |
| hi/braden.html | Free |
| hi/elpo.html | Premium |
| hi/formulario-saep-enfermagem.html | Premium |
| hi/fugulin.html | Free |
| hi/glasgow.html | Premium |
| hi/medicamentos.html | Premium |
| hi/meem.html | Premium |
| hi/moca.html | Premium |
| hi/morse.html | Premium |
| hi/perroca.html | Premium |
| hi/zarit.html | Premium |
| id/balancohidrico.html | Premium |
| id/braden.html | Free |
| id/elpo.html | Premium |
| id/formulario-saep-enfermagem.html | Premium |
| id/fugulin.html | Free |
| id/glasgow.html | Premium |
| id/medicamentos.html | Premium |
| id/meem.html | Premium |
| id/moca.html | Premium |
| id/morse.html | Premium |
| id/perroca.html | Premium |
| id/zarit.html | Premium |
| it/balancohidrico.html | Premium |
| it/braden.html | Free |
| it/elpo.html | Premium |
| it/formulario-saep-enfermagem.html | Premium |
| it/fugulin.html | Free |
| it/glasgow.html | Premium |
| it/medicamentos.html | Premium |
| it/meem.html | Premium |
| it/moca.html | Premium |
| it/morse.html | Premium |
| it/perroca.html | Premium |
| it/zarit.html | Premium |
| ja/balancohidrico.html | Premium |
| ja/braden.html | Free |
| ja/elpo.html | Premium |
| ja/formulario-saep-enfermagem.html | Premium |
| ja/fugulin.html | Free |
| ja/glasgow.html | Premium |
| ja/medicamentos.html | Premium |
| ja/meem.html | Premium |
| ja/moca.html | Premium |
| ja/morse.html | Premium |
| ja/perroca.html | Premium |
| ja/zarit.html | Premium |
| ko/balancohidrico.html | Premium |
| ko/braden.html | Free |
| ko/elpo.html | Premium |
| ko/formulario-saep-enfermagem.html | Premium |
| ko/fugulin.html | Free |
| ko/glasgow.html | Premium |
| ko/medicamentos.html | Premium |
| ko/meem.html | Premium |
| ko/moca.html | Premium |
| ko/morse.html | Premium |
| ko/perroca.html | Premium |
| ko/zarit.html | Premium |
| medicacao.html | Premium |
| medicamentos.html | Free |
| meem.html | Premium |
| moca.html | Premium |
| morse.html | Premium |
| nl/balancohidrico.html | Premium |
| nl/braden.html | Free |
| nl/elpo.html | Premium |
| nl/formulario-saep-enfermagem.html | Premium |
| nl/fugulin.html | Free |
| nl/glasgow.html | Premium |
| nl/medicamentos.html | Premium |
| nl/meem.html | Premium |
| nl/moca.html | Premium |
| nl/morse.html | Premium |
| nl/perroca.html | Premium |
| nl/zarit.html | Premium |
| perroca.html | Premium |
| pl/balancohidrico.html | Premium |
| pl/braden.html | Free |
| pl/elpo.html | Premium |
| pl/formulario-saep-enfermagem.html | Premium |
| pl/fugulin.html | Free |
| pl/glasgow.html | Premium |
| pl/medicamentos.html | Premium |
| pl/meem.html | Premium |
| pl/moca.html | Premium |
| pl/morse.html | Premium |
| pl/perroca.html | Premium |
| pl/zarit.html | Premium |
| ru/balancohidrico.html | Premium |
| ru/braden.html | Free |
| ru/elpo.html | Premium |
| ru/formulario-saep-enfermagem.html | Premium |
| ru/fugulin.html | Free |
| ru/glasgow.html | Premium |
| ru/medicamentos.html | Premium |
| ru/meem.html | Premium |
| ru/moca.html | Premium |
| ru/morse.html | Premium |
| ru/perroca.html | Premium |
| ru/zarit.html | Premium |
| simulado_aleitamento_materno.html | Premium |
| simulado_bloco-operatorio.html | Premium |
| simulado_codigo_de_etica_enfermagem.html | Premium |
| simulado_hospital_amigo_da_crianca.html | Premium |
| simulado_humaniza_sus.html | Premium |
| simulado_ibam_bebedouro_enfermeiro_2024.html | Premium |
| simulado_ibam_guarulhos_enfermeiro_2024.html | Premium |
| simulado_ibam_guarulhos_enfermeiro_esf_2024.html | Premium |
| simulado_ibam_japaratuba_sergipe_enfermeiro_2014.html | Premium |
| simulado_lei_organica_do_sus_8080-90.html | Premium |
| simulado_participacao_da_comunidade.html | Premium |
| simulado_pcr.html | Premium |
| simulado_vacinacao.html | Premium |
| simulado-de-enfermagem-doencas-de-notificacao-compulsoria.html | Premium |
| simulado-de-enfermagem-nucleo-de-seguranca-do-paciente.html | Premium |
| simulado-de-enfermagem.html | Premium |
| simulado-de-enfermagem2.html | Premium |
| simulado-de-enfermagem3.html | Premium |
| simulado-de-enfermagem4.html | Premium |
| sv/balancohidrico.html | Premium |
| sv/braden.html | Free |
| sv/elpo.html | Premium |
| sv/formulario-saep-enfermagem.html | Premium |
| sv/fugulin.html | Free |
| sv/glasgow.html | Premium |
| sv/medicamentos.html | Premium |
| sv/meem.html | Premium |
| sv/moca.html | Premium |
| sv/morse.html | Premium |
| sv/perroca.html | Premium |
| sv/zarit.html | Premium |
| tr/balancohidrico.html | Premium |
| tr/braden.html | Free |
| tr/elpo.html | Premium |
| tr/formulario-saep-enfermagem.html | Premium |
| tr/fugulin.html | Free |
| tr/glasgow.html | Premium |
| tr/medicamentos.html | Premium |
| tr/meem.html | Premium |
| tr/moca.html | Premium |
| tr/morse.html | Premium |
| tr/perroca.html | Premium |
| tr/zarit.html | Premium |
| uk/balancohidrico.html | Premium |
| uk/braden.html | Free |
| uk/elpo.html | Premium |
| uk/formulario-saep-enfermagem.html | Premium |
| uk/fugulin.html | Free |
| uk/glasgow.html | Premium |
| uk/medicamentos.html | Premium |
| uk/meem.html | Premium |
| uk/moca.html | Premium |
| uk/morse.html | Premium |
| uk/perroca.html | Premium |
| uk/zarit.html | Premium |
| vi/balancohidrico.html | Premium |
| vi/braden.html | Free |
| vi/elpo.html | Premium |
| vi/formulario-saep-enfermagem.html | Premium |
| vi/fugulin.html | Free |
| vi/glasgow.html | Premium |
| vi/medicamentos.html | Premium |
| vi/meem.html | Premium |
| vi/moca.html | Premium |
| vi/morse.html | Premium |
| vi/perroca.html | Premium |
| vi/zarit.html | Premium |
| zarit.html | Premium |
| zh/balancohidrico.html | Premium |
| zh/braden.html | Free |
| zh/elpo.html | Premium |
| zh/formulario-saep-enfermagem.html | Premium |
| zh/fugulin.html | Free |
| zh/glasgow.html | Premium |
| zh/medicamentos.html | Premium |
| zh/meem.html | Premium |
| zh/moca.html | Premium |
| zh/morse.html | Premium |
| zh/perroca.html | Premium |
| zh/zarit.html | Premium |

## Conteúdo privado sem regra exata (26)

Na ausência de regra própria, premium-content exige Premium; registrar regra explícita se a intenção for Free. Não interpretar a ausência de regra como liberação automática.

- formulario_escala_de_aldrete.html
- formulario_escala_de_apache.html
- formulario_escala_de_apgar.html
- formulario_escala_de_asa.html
- formulario_escala_de_ballard.html
- formulario_escala_de_barthel.html
- formulario_escala_de_berg.html
- formulario_escala_de_braden.html
- formulario_escala_de_downes.html
- formulario_escala_de_escalanumerica.html
- formulario_escala_de_manchester.html
- formulario_escala_de_moca.html
- formulario_escala_de_pelod.html
- formulario_escala_de_pews.html
- formulario_escala_de_prism.html
- formulario_escala_de_qsofa.html
- formulario_escala_de_ramsay.html
- formulario_escala_de_rancholosamigos.html
- formulario_escala_de_richmond.html
- formulario_escala_de_saps.html
- formulario_escala_de_silverman.html
- formulario_escala_de_sistema_sinbad.html
- formulario_escala_de_sofa.html
- formulario_escala_de_tinetti.html
- formulario_escala_de_waterlow.html
- formulario_escala_de_zarit.html

## Mudança do inventário

Após usar os switches, uma migration ou um deploy, repetir SELECT path,premium_required,enforcement,source FROM public.developer_premium_route_rules ORDER BY path e a consulta de diferença contra premium_content_pages; atualizar data, totais e linhas desta fotografia. Conferir shell publicado e fila antes de considerar ativação concluída.
