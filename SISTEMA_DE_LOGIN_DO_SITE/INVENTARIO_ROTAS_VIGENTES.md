# Inventário de rotas do sistema de contas — fotografia de 01/10/2026

Fonte: SELECT read-only de public.developer_premium_route_rules e premium_content_pages no projeto asjkftjfbkuuhilnqonx, após liberação de consulta do catálogo no PR #123. O painel altera estas regras em tempo real. premium-content usa regra exata e fallback da raiz por idioma; conteúdo privado sem regra exige Premium por padrão.

**Atualização operacional de cobrança — 01/10/2026:** PRs #124 e #125 corrigiram tratamento de datas, confirmação do primeiro pagamento e primeira cobrança imediata no cartão Asaas. Não houve alteração em `developer_premium_route_rules` nem em `premium_content_pages`; por isso os totais e caminhos abaixo permanecem válidos.

## Totais por escopo

| Escopo | Regras | Premium | Free |
|---|---:|---:|---:|
| raiz | 77 | 74 | 3 |
| ar | 12 | 9 | 3 |
| de | 12 | 10 | 2 |
| en | 37 | 35 | 2 |
| es | 41 | 40 | 1 |
| fr | 12 | 10 | 2 |
| hi | 12 | 10 | 2 |
| id | 12 | 10 | 2 |
| it | 12 | 10 | 2 |
| ja | 12 | 10 | 2 |
| ko | 12 | 10 | 2 |
| nl | 12 | 10 | 2 |
| pl | 12 | 10 | 2 |
| ru | 12 | 10 | 2 |
| sv | 12 | 10 | 2 |
| tr | 12 | 10 | 2 |
| uk | 12 | 10 | 2 |
| vi | 12 | 10 | 2 |
| zh | 12 | 10 | 2 |

Total: 347 regras; 308 Premium; 39 Free. 373 documentos privados, 0 vazios; 0 regras Premium sem conteúdo privado.

## Exceção do catálogo assistencial

formularios_de_escalas_assistenciais.html está Free para consulta (catalog_only). Baixar/imprimir é validado separadamente por premium-content?path=formularios_de_escalas_assistenciais.html&download=form-NNN, que exige Premium mesmo com a rota Free. Os 26 HTMLs individuais novos continuam protegidos por padrão. Registro: auditorias/20261001-catalogo-formularios.md.

## Regras vigentes por caminho

| Caminho | Plano para consulta | Enforcement | Fonte |
|---|---|---|---|
| adicional-noturno.html | Premium | protected_content | premium_content_pages |
| ar/balancohidrico.html | Free | protected_content | premium_content_pages |
| ar/braden.html | Free | protected_content | premium_content_pages |
| ar/elpo.html | Premium | protected_content | premium_content_pages |
| ar/formulario-saep-enfermagem.html | Premium | protected_content | premium_content_pages |
| ar/fugulin.html | Free | protected_content | premium_content_pages |
| ar/glasgow.html | Premium | protected_content | premium_content_pages |
| ar/medicamentos.html | Premium | protected_content | premium_content_pages |
| ar/meem.html | Premium | protected_content | premium_content_pages |
| ar/moca.html | Premium | protected_content | premium_content_pages |
| ar/morse.html | Premium | protected_content | premium_content_pages |
| ar/perroca.html | Premium | protected_content | premium_content_pages |
| ar/zarit.html | Premium | protected_content | premium_content_pages |
| balancohidrico.html | Premium | protected_content | premium_content_pages |
| biblioteca-provas.html | Premium | protected_content | premium_content_pages |
| braden.html | Free | protected_content | premium_content_pages |
| calculo-hora-extra.html | Premium | protected_content | premium_content_pages |
| de/balancohidrico.html | Premium | protected_content | premium_content_pages |
| de/braden.html | Free | protected_content | premium_content_pages |
| de/elpo.html | Premium | protected_content | premium_content_pages |
| de/formulario-saep-enfermagem.html | Premium | protected_content | premium_content_pages |
| de/fugulin.html | Free | protected_content | premium_content_pages |
| de/glasgow.html | Premium | protected_content | premium_content_pages |
| de/medicamentos.html | Premium | protected_content | premium_content_pages |
| de/meem.html | Premium | protected_content | premium_content_pages |
| de/moca.html | Premium | protected_content | premium_content_pages |
| de/morse.html | Premium | protected_content | premium_content_pages |
| de/perroca.html | Premium | protected_content | premium_content_pages |
| de/zarit.html | Premium | protected_content | premium_content_pages |
| dimensionamento-cofen.html | Premium | protected_content | premium_content_pages |
| dimensionamento.html | Premium | protected_content | premium_content_pages |
| elpo.html | Premium | protected_content | premium_content_pages |
| en/balancohidrico.html | Premium | protected_content | premium_content_pages |
| en/braden.html | Free | protected_content | premium_content_pages |
| en/elpo.html | Premium | protected_content | premium_content_pages |
| en/formulario_avaliacao_da_cabeca_aos_pes.html | Premium | protected_content | premium_content_pages |
| en/formulario_bishop.html | Premium | protected_content | premium_content_pages |
| en/formulario_bps.html | Premium | protected_content | premium_content_pages |
| en/formulario_cam.html | Premium | protected_content | premium_content_pages |
| en/formulario_capurro.html | Premium | protected_content | premium_content_pages |
| en/formulario_carrinho.html | Premium | protected_content | premium_content_pages |
| en/formulario_de_fugulin.html | Premium | protected_content | premium_content_pages |
| en/formulario_escala_cincinnati.html | Premium | protected_content | premium_content_pages |
| en/formulario_escala_curb65.html | Premium | protected_content | premium_content_pages |
| en/formulario_escala_de_downton.html | Premium | protected_content | premium_content_pages |
| en/formulario_escala_de_elpo.html | Premium | protected_content | premium_content_pages |
| en/formulario_escala_de_gosnell.html | Premium | protected_content | premium_content_pages |
| en/formulario_escala_de_hamilton.html | Premium | protected_content | premium_content_pages |
| en/formulario_escala_de_hendrich.html | Premium | protected_content | premium_content_pages |
| en/formulario_escala_de_humpty.html | Premium | protected_content | premium_content_pages |
| en/formulario_escala_de_johns.html | Premium | protected_content | premium_content_pages |
| en/formulario_escala_de_jouvet.html | Premium | protected_content | premium_content_pages |
| en/formulario_escala_de_lachs.html | Premium | protected_content | premium_content_pages |
| en/formulario_escala_de_lanss.html | Premium | protected_content | premium_content_pages |
| en/formulario_escala_de_meows.html | Premium | protected_content | premium_content_pages |
| en/formulario_escala_de_news.html | Premium | protected_content | premium_content_pages |
| en/formulario_escala_de_nips.html | Premium | protected_content | premium_content_pages |
| en/formulario_escala_de_perroca.html | Premium | protected_content | premium_content_pages |
| en/formulario_meem.html | Premium | protected_content | premium_content_pages |
| en/formulario_morse.html | Premium | protected_content | premium_content_pages |
| en/formulario-saep-enfermagem.html | Premium | protected_content | premium_content_pages |
| en/fugulin.html | Free | protected_content | premium_content_pages |
| en/glasgow.html | Premium | protected_content | premium_content_pages |
| en/medicamentos.html | Premium | protected_content | premium_content_pages |
| en/meem.html | Premium | protected_content | premium_content_pages |
| en/moca.html | Premium | protected_content | premium_content_pages |
| en/morse.html | Premium | protected_content | premium_content_pages |
| en/perroca.html | Premium | protected_content | premium_content_pages |
| en/zarit.html | Premium | protected_content | premium_content_pages |
| es/balancohidrico.html | Premium | protected_content | premium_content_pages |
| es/ballard.html | Premium | protected_content | premium_content_pages |
| es/braden.html | Premium | protected_content | premium_content_pages |
| es/capurro.html | Premium | protected_content | premium_content_pages |
| es/elpo.html | Premium | protected_content | premium_content_pages |
| es/formulario_avaliacao_da_cabeca_aos_pes.html | Premium | protected_content | premium_content_pages |
| es/formulario_bishop.html | Premium | protected_content | premium_content_pages |
| es/formulario_bps.html | Premium | protected_content | premium_content_pages |
| es/formulario_cam.html | Premium | protected_content | premium_content_pages |
| es/formulario_capurro.html | Premium | protected_content | premium_content_pages |
| es/formulario_carrinho.html | Premium | protected_content | premium_content_pages |
| es/formulario_de_fugulin.html | Premium | protected_content | premium_content_pages |
| es/formulario_escala_cincinnati.html | Premium | protected_content | premium_content_pages |
| es/formulario_escala_curb65.html | Premium | protected_content | premium_content_pages |
| es/formulario_escala_de_downton.html | Premium | protected_content | premium_content_pages |
| es/formulario_escala_de_elpo.html | Premium | protected_content | premium_content_pages |
| es/formulario_escala_de_gosnell.html | Premium | protected_content | premium_content_pages |
| es/formulario_escala_de_hamilton.html | Premium | protected_content | premium_content_pages |
| es/formulario_escala_de_hendrich.html | Premium | protected_content | premium_content_pages |
| es/formulario_escala_de_humpty.html | Premium | protected_content | premium_content_pages |
| es/formulario_escala_de_johns.html | Premium | protected_content | premium_content_pages |
| es/formulario_escala_de_jouvet.html | Premium | protected_content | premium_content_pages |
| es/formulario_escala_de_lachs.html | Premium | protected_content | premium_content_pages |
| es/formulario_escala_de_lanss.html | Premium | protected_content | premium_content_pages |
| es/formulario_escala_de_meows.html | Premium | protected_content | premium_content_pages |
| es/formulario_escala_de_news.html | Premium | protected_content | premium_content_pages |
| es/formulario_escala_de_nips.html | Premium | protected_content | premium_content_pages |
| es/formulario_escala_de_perroca.html | Premium | protected_content | premium_content_pages |
| es/formulario_meem.html | Premium | protected_content | premium_content_pages |
| es/formulario_morse.html | Premium | protected_content | premium_content_pages |
| es/formulario-saep-enfermagem.html | Premium | protected_content | premium_content_pages |
| es/fugulin.html | Free | protected_content | premium_content_pages |
| es/gasometria.html | Premium | protected_content | premium_content_pages |
| es/glasgow.html | Premium | protected_content | premium_content_pages |
| es/gotejamento.html | Premium | protected_content | premium_content_pages |
| es/medicamentos.html | Premium | protected_content | premium_content_pages |
| es/meem.html | Premium | protected_content | premium_content_pages |
| es/moca.html | Premium | protected_content | premium_content_pages |
| es/morse.html | Premium | protected_content | premium_content_pages |
| es/perroca.html | Premium | protected_content | premium_content_pages |
| es/zarit.html | Premium | protected_content | premium_content_pages |
| flashcards_quiz.html | Premium | protected_content | premium_content_pages |
| formulario_avaliacao_da_cabeca_aos_pes.html | Premium | protected_content | premium_content_pages |
| formulario_bishop.html | Premium | protected_content | premium_content_pages |
| formulario_bps.html | Premium | protected_content | premium_content_pages |
| formulario_cam.html | Premium | protected_content | premium_content_pages |
| formulario_capurro.html | Premium | protected_content | premium_content_pages |
| formulario_carrinho.html | Premium | protected_content | premium_content_pages |
| formulario_de_fugulin.html | Premium | protected_content | premium_content_pages |
| formulario_escala_cincinnati.html | Premium | protected_content | premium_content_pages |
| formulario_escala_curb65.html | Premium | protected_content | premium_content_pages |
| formulario_escala_de_downton.html | Premium | protected_content | premium_content_pages |
| formulario_escala_de_elpo.html | Premium | protected_content | premium_content_pages |
| formulario_escala_de_fast.html | Premium | protected_content | premium_content_pages |
| formulario_escala_de_flacc.html | Premium | protected_content | premium_content_pages |
| formulario_escala_de_four.html | Premium | protected_content | premium_content_pages |
| formulario_escala_de_glasgow.html | Premium | protected_content | premium_content_pages |
| formulario_escala_de_gosnell.html | Premium | protected_content | premium_content_pages |
| formulario_escala_de_hamilton.html | Premium | protected_content | premium_content_pages |
| formulario_escala_de_hendrich.html | Premium | protected_content | premium_content_pages |
| formulario_escala_de_humpty.html | Premium | protected_content | premium_content_pages |
| formulario_escala_de_johns.html | Premium | protected_content | premium_content_pages |
| formulario_escala_de_jouvet.html | Premium | protected_content | premium_content_pages |
| formulario_escala_de_lachs.html | Premium | protected_content | premium_content_pages |
| formulario_escala_de_lanss.html | Premium | protected_content | premium_content_pages |
| formulario_escala_de_lawton.html | Premium | protected_content | premium_content_pages |
| formulario_escala_de_meows.html | Premium | protected_content | premium_content_pages |
| formulario_escala_de_news.html | Premium | protected_content | premium_content_pages |
| formulario_escala_de_nihss.html | Premium | protected_content | premium_content_pages |
| formulario_escala_de_nips.html | Premium | protected_content | premium_content_pages |
| formulario_escala_de_norton.html | Premium | protected_content | premium_content_pages |
| formulario_escala_de_ofras.html | Premium | protected_content | premium_content_pages |
| formulario_escala_de_painad.html | Premium | protected_content | premium_content_pages |
| formulario_escala_de_perroca.html | Premium | protected_content | premium_content_pages |
| formulario_impresso_saep.html | Premium | protected_content | premium_content_pages |
| formulario_impresso_sbar.html | Premium | protected_content | premium_content_pages |
| formulario_meem.html | Premium | protected_content | premium_content_pages |
| formulario_morse.html | Premium | protected_content | premium_content_pages |
| formulario-saep-enfermagem.html | Premium | protected_content | premium_content_pages |
| formularios_de_escalas_assistenciais.html | Free | catalog_only | user_requested_catalog_preview |
| formularios-em-branco-de-escalas.html | Premium | protected_content | premium_content_pages |
| fotmulario_escala_de_perroca.html | Premium | protected_content | premium_content_pages |
| fr/balancohidrico.html | Premium | protected_content | premium_content_pages |
| fr/braden.html | Free | protected_content | premium_content_pages |
| fr/elpo.html | Premium | protected_content | premium_content_pages |
| fr/formulario-saep-enfermagem.html | Premium | protected_content | premium_content_pages |
| fr/fugulin.html | Free | protected_content | premium_content_pages |
| fr/glasgow.html | Premium | protected_content | premium_content_pages |
| fr/medicamentos.html | Premium | protected_content | premium_content_pages |
| fr/meem.html | Premium | protected_content | premium_content_pages |
| fr/moca.html | Premium | protected_content | premium_content_pages |
| fr/morse.html | Premium | protected_content | premium_content_pages |
| fr/perroca.html | Premium | protected_content | premium_content_pages |
| fr/zarit.html | Premium | protected_content | premium_content_pages |
| fugulin.html | Premium | protected_content | premium_content_pages |
| glasgow.html | Premium | protected_content | premium_content_pages |
| hi/balancohidrico.html | Premium | protected_content | premium_content_pages |
| hi/braden.html | Free | protected_content | premium_content_pages |
| hi/elpo.html | Premium | protected_content | premium_content_pages |
| hi/formulario-saep-enfermagem.html | Premium | protected_content | premium_content_pages |
| hi/fugulin.html | Free | protected_content | premium_content_pages |
| hi/glasgow.html | Premium | protected_content | premium_content_pages |
| hi/medicamentos.html | Premium | protected_content | premium_content_pages |
| hi/meem.html | Premium | protected_content | premium_content_pages |
| hi/moca.html | Premium | protected_content | premium_content_pages |
| hi/morse.html | Premium | protected_content | premium_content_pages |
| hi/perroca.html | Premium | protected_content | premium_content_pages |
| hi/zarit.html | Premium | protected_content | premium_content_pages |
| id/balancohidrico.html | Premium | protected_content | premium_content_pages |
| id/braden.html | Free | protected_content | premium_content_pages |
| id/elpo.html | Premium | protected_content | premium_content_pages |
| id/formulario-saep-enfermagem.html | Premium | protected_content | premium_content_pages |
| id/fugulin.html | Free | protected_content | premium_content_pages |
| id/glasgow.html | Premium | protected_content | premium_content_pages |
| id/medicamentos.html | Premium | protected_content | premium_content_pages |
| id/meem.html | Premium | protected_content | premium_content_pages |
| id/moca.html | Premium | protected_content | premium_content_pages |
| id/morse.html | Premium | protected_content | premium_content_pages |
| id/perroca.html | Premium | protected_content | premium_content_pages |
| id/zarit.html | Premium | protected_content | premium_content_pages |
| it/balancohidrico.html | Premium | protected_content | premium_content_pages |
| it/braden.html | Free | protected_content | premium_content_pages |
| it/elpo.html | Premium | protected_content | premium_content_pages |
| it/formulario-saep-enfermagem.html | Premium | protected_content | premium_content_pages |
| it/fugulin.html | Free | protected_content | premium_content_pages |
| it/glasgow.html | Premium | protected_content | premium_content_pages |
| it/medicamentos.html | Premium | protected_content | premium_content_pages |
| it/meem.html | Premium | protected_content | premium_content_pages |
| it/moca.html | Premium | protected_content | premium_content_pages |
| it/morse.html | Premium | protected_content | premium_content_pages |
| it/perroca.html | Premium | protected_content | premium_content_pages |
| it/zarit.html | Premium | protected_content | premium_content_pages |
| ja/balancohidrico.html | Premium | protected_content | premium_content_pages |
| ja/braden.html | Free | protected_content | premium_content_pages |
| ja/elpo.html | Premium | protected_content | premium_content_pages |
| ja/formulario-saep-enfermagem.html | Premium | protected_content | premium_content_pages |
| ja/fugulin.html | Free | protected_content | premium_content_pages |
| ja/glasgow.html | Premium | protected_content | premium_content_pages |
| ja/medicamentos.html | Premium | protected_content | premium_content_pages |
| ja/meem.html | Premium | protected_content | premium_content_pages |
| ja/moca.html | Premium | protected_content | premium_content_pages |
| ja/morse.html | Premium | protected_content | premium_content_pages |
| ja/perroca.html | Premium | protected_content | premium_content_pages |
| ja/zarit.html | Premium | protected_content | premium_content_pages |
| ko/balancohidrico.html | Premium | protected_content | premium_content_pages |
| ko/braden.html | Free | protected_content | premium_content_pages |
| ko/elpo.html | Premium | protected_content | premium_content_pages |
| ko/formulario-saep-enfermagem.html | Premium | protected_content | premium_content_pages |
| ko/fugulin.html | Free | protected_content | premium_content_pages |
| ko/glasgow.html | Premium | protected_content | premium_content_pages |
| ko/medicamentos.html | Premium | protected_content | premium_content_pages |
| ko/meem.html | Premium | protected_content | premium_content_pages |
| ko/moca.html | Premium | protected_content | premium_content_pages |
| ko/morse.html | Premium | protected_content | premium_content_pages |
| ko/perroca.html | Premium | protected_content | premium_content_pages |
| ko/zarit.html | Premium | protected_content | premium_content_pages |
| medicacao.html | Premium | protected_content | premium_content_pages |
| medicamentos.html | Free | protected_content | premium_content_pages |
| meem.html | Premium | protected_content | premium_content_pages |
| moca.html | Premium | protected_content | premium_content_pages |
| morse.html | Premium | protected_content | premium_content_pages |
| nl/balancohidrico.html | Premium | protected_content | premium_content_pages |
| nl/braden.html | Free | protected_content | premium_content_pages |
| nl/elpo.html | Premium | protected_content | premium_content_pages |
| nl/formulario-saep-enfermagem.html | Premium | protected_content | premium_content_pages |
| nl/fugulin.html | Free | protected_content | premium_content_pages |
| nl/glasgow.html | Premium | protected_content | premium_content_pages |
| nl/medicamentos.html | Premium | protected_content | premium_content_pages |
| nl/meem.html | Premium | protected_content | premium_content_pages |
| nl/moca.html | Premium | protected_content | premium_content_pages |
| nl/morse.html | Premium | protected_content | premium_content_pages |
| nl/perroca.html | Premium | protected_content | premium_content_pages |
| nl/zarit.html | Premium | protected_content | premium_content_pages |
| perroca.html | Premium | protected_content | premium_content_pages |
| pl/balancohidrico.html | Premium | protected_content | premium_content_pages |
| pl/braden.html | Free | protected_content | premium_content_pages |
| pl/elpo.html | Premium | protected_content | premium_content_pages |
| pl/formulario-saep-enfermagem.html | Premium | protected_content | premium_content_pages |
| pl/fugulin.html | Free | protected_content | premium_content_pages |
| pl/glasgow.html | Premium | protected_content | premium_content_pages |
| pl/medicamentos.html | Premium | protected_content | premium_content_pages |
| pl/meem.html | Premium | protected_content | premium_content_pages |
| pl/moca.html | Premium | protected_content | premium_content_pages |
| pl/morse.html | Premium | protected_content | premium_content_pages |
| pl/perroca.html | Premium | protected_content | premium_content_pages |
| pl/zarit.html | Premium | protected_content | premium_content_pages |
| ru/balancohidrico.html | Premium | protected_content | premium_content_pages |
| ru/braden.html | Free | protected_content | premium_content_pages |
| ru/elpo.html | Premium | protected_content | premium_content_pages |
| ru/formulario-saep-enfermagem.html | Premium | protected_content | premium_content_pages |
| ru/fugulin.html | Free | protected_content | premium_content_pages |
| ru/glasgow.html | Premium | protected_content | premium_content_pages |
| ru/medicamentos.html | Premium | protected_content | premium_content_pages |
| ru/meem.html | Premium | protected_content | premium_content_pages |
| ru/moca.html | Premium | protected_content | premium_content_pages |
| ru/morse.html | Premium | protected_content | premium_content_pages |
| ru/perroca.html | Premium | protected_content | premium_content_pages |
| ru/zarit.html | Premium | protected_content | premium_content_pages |
| simulado_aleitamento_materno.html | Premium | protected_content | premium_content_pages |
| simulado_bloco-operatorio.html | Premium | protected_content | premium_content_pages |
| simulado_codigo_de_etica_enfermagem.html | Premium | protected_content | premium_content_pages |
| simulado_hospital_amigo_da_crianca.html | Premium | protected_content | premium_content_pages |
| simulado_humaniza_sus.html | Premium | protected_content | premium_content_pages |
| simulado_ibam_bebedouro_enfermeiro_2024.html | Premium | protected_content | premium_content_pages |
| simulado_ibam_guarulhos_enfermeiro_2024.html | Premium | protected_content | premium_content_pages |
| simulado_ibam_guarulhos_enfermeiro_esf_2024.html | Premium | protected_content | premium_content_pages |
| simulado_ibam_japaratuba_sergipe_enfermeiro_2014.html | Premium | protected_content | premium_content_pages |
| simulado_lei_organica_do_sus_8080-90.html | Premium | protected_content | premium_content_pages |
| simulado_participacao_da_comunidade.html | Premium | protected_content | premium_content_pages |
| simulado_pcr.html | Premium | protected_content | premium_content_pages |
| simulado_vacinacao.html | Premium | protected_content | premium_content_pages |
| simulado-de-enfermagem-doencas-de-notificacao-compulsoria.html | Premium | protected_content | premium_content_pages |
| simulado-de-enfermagem-nucleo-de-seguranca-do-paciente.html | Premium | protected_content | premium_content_pages |
| simulado-de-enfermagem.html | Premium | protected_content | premium_content_pages |
| simulado-de-enfermagem2.html | Premium | protected_content | premium_content_pages |
| simulado-de-enfermagem3.html | Premium | protected_content | premium_content_pages |
| simulado-de-enfermagem4.html | Premium | protected_content | premium_content_pages |
| sv/balancohidrico.html | Premium | protected_content | premium_content_pages |
| sv/braden.html | Free | protected_content | premium_content_pages |
| sv/elpo.html | Premium | protected_content | premium_content_pages |
| sv/formulario-saep-enfermagem.html | Premium | protected_content | premium_content_pages |
| sv/fugulin.html | Free | protected_content | premium_content_pages |
| sv/glasgow.html | Premium | protected_content | premium_content_pages |
| sv/medicamentos.html | Premium | protected_content | premium_content_pages |
| sv/meem.html | Premium | protected_content | premium_content_pages |
| sv/moca.html | Premium | protected_content | premium_content_pages |
| sv/morse.html | Premium | protected_content | premium_content_pages |
| sv/perroca.html | Premium | protected_content | premium_content_pages |
| sv/zarit.html | Premium | protected_content | premium_content_pages |
| tr/balancohidrico.html | Premium | protected_content | premium_content_pages |
| tr/braden.html | Free | protected_content | premium_content_pages |
| tr/elpo.html | Premium | protected_content | premium_content_pages |
| tr/formulario-saep-enfermagem.html | Premium | protected_content | premium_content_pages |
| tr/fugulin.html | Free | protected_content | premium_content_pages |
| tr/glasgow.html | Premium | protected_content | premium_content_pages |
| tr/medicamentos.html | Premium | protected_content | premium_content_pages |
| tr/meem.html | Premium | protected_content | premium_content_pages |
| tr/moca.html | Premium | protected_content | premium_content_pages |
| tr/morse.html | Premium | protected_content | premium_content_pages |
| tr/perroca.html | Premium | protected_content | premium_content_pages |
| tr/zarit.html | Premium | protected_content | premium_content_pages |
| uk/balancohidrico.html | Premium | protected_content | premium_content_pages |
| uk/braden.html | Free | protected_content | premium_content_pages |
| uk/elpo.html | Premium | protected_content | premium_content_pages |
| uk/formulario-saep-enfermagem.html | Premium | protected_content | premium_content_pages |
| uk/fugulin.html | Free | protected_content | premium_content_pages |
| uk/glasgow.html | Premium | protected_content | premium_content_pages |
| uk/medicamentos.html | Premium | protected_content | premium_content_pages |
| uk/meem.html | Premium | protected_content | premium_content_pages |
| uk/moca.html | Premium | protected_content | premium_content_pages |
| uk/morse.html | Premium | protected_content | premium_content_pages |
| uk/perroca.html | Premium | protected_content | premium_content_pages |
| uk/zarit.html | Premium | protected_content | premium_content_pages |
| vi/balancohidrico.html | Premium | protected_content | premium_content_pages |
| vi/braden.html | Free | protected_content | premium_content_pages |
| vi/elpo.html | Premium | protected_content | premium_content_pages |
| vi/formulario-saep-enfermagem.html | Premium | protected_content | premium_content_pages |
| vi/fugulin.html | Free | protected_content | premium_content_pages |
| vi/glasgow.html | Premium | protected_content | premium_content_pages |
| vi/medicamentos.html | Premium | protected_content | premium_content_pages |
| vi/meem.html | Premium | protected_content | premium_content_pages |
| vi/moca.html | Premium | protected_content | premium_content_pages |
| vi/morse.html | Premium | protected_content | premium_content_pages |
| vi/perroca.html | Premium | protected_content | premium_content_pages |
| vi/zarit.html | Premium | protected_content | premium_content_pages |
| zarit.html | Premium | protected_content | premium_content_pages |
| zh/balancohidrico.html | Premium | protected_content | premium_content_pages |
| zh/braden.html | Free | protected_content | premium_content_pages |
| zh/elpo.html | Premium | protected_content | premium_content_pages |
| zh/formulario-saep-enfermagem.html | Premium | protected_content | premium_content_pages |
| zh/fugulin.html | Free | protected_content | premium_content_pages |
| zh/glasgow.html | Premium | protected_content | premium_content_pages |
| zh/medicamentos.html | Premium | protected_content | premium_content_pages |
| zh/meem.html | Premium | protected_content | premium_content_pages |
| zh/moca.html | Premium | protected_content | premium_content_pages |
| zh/morse.html | Premium | protected_content | premium_content_pages |
| zh/perroca.html | Premium | protected_content | premium_content_pages |
| zh/zarit.html | Premium | protected_content | premium_content_pages |

## Conteúdo privado sem regra exata (26)

Na ausência de regra própria, premium-content exige Premium. Um prefixo de idioma pode herdar regra da raiz. Não interpretar ausência de regra como Free.

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

## Atualização

Após switches/migration/publicação, repetir SELECT das regras e diferença contra premium_content_pages. Atualizar totais, caminhos, data e conferir shell/fila. O inventário registra estado observado, não substitui a política dinâmica.
