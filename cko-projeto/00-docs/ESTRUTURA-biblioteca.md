# Estrutura das Bibliotecas — Envelope Comum × Campos Específicos

Sua hipótese confirmada: **o envelope é comum; só o miolo é específico.** Formalizado em `biblioteca-cko-v1.schema.json`.

## Envelope comum (todos os objetos)

`id` · `name` · `icon` · `description` · `category` · `subcategory` · `tags` · `catalog` · `semantic` · `regulatory` · `risk` · `clinicalKnowledge` (com `contraindications` canônico) · `nursingIntelligence` (NANDA/NIC/NOC) · `decisionIntelligence` · `comparisonEngine` · `patientSafety` · `sustainability` · `education` · `workflowIntegration` · `aiMetadata` · `commercialIntelligence` · `auditTrail` · `localization`.

Obrigatórios no schema: identidade + `semantic` + `risk` + `clinicalKnowledge` + `nursingIntelligence` + `decisionIntelligence` + `patientSafety` + `education` + `aiMetadata` + `auditTrail` + `localization`. `catalog` é opcional (feridas/antissepticos).

## Campo específico por categoria (`exclusiveModules` → `characteristics`)

Cada objeto declara seus módulos próprios; cada módulo é uma chave em `characteristics`.

| Objeto | Módulos específicos |
|---|---|
| `curativos` | `tipos`, `composicao`, `absorcao`, `controleOdor`, `prata`, `phmb`, `espessura`, `tempoTroca`, `nivelExsudato`, `umidade` |
| `cateteres` | `french`, `gauge`, `lumen`, `fluxo`, `comprimento`, `radiopaco`, `uso`, `tempoMaximo`, `compatibilidade` |
| `agulhas` | `gauge`, `corISO`, `fluxo`, `bisel`, `calibreInterno`, `calibreExterno` |
| `feridas` | `etiologia`, `estadiamento`, `exsudato`, `necrose`, `granulacao`, `profundidade`, `dor`, `infeccao`, `odor`, `time` |
| `cirurgicos` | `categoria`, `modelo`, `comprimento`, `articulacao`, `material`, `esterilizacao`, `rastreabilidade`, `ergonomia`, `precisao` |
| `sondas` | `tipo`, `balao`, `vias`, `posicionamento`, `confirmacao`, `complicacoes`, `calibre`, `material` |
| `luvas` | `material`, `esteril`, `resistenciaQuimica`, `alergias`, `selecao`, `tamanhos` |
| `ostomias` | `tipos`, `dispositivos`, `cuidadosPeriestomais`, `trocaBolsa`, `complicacoes`, `medidas` |
| `drenos` | `sistema`, `debito`, `pressao`, `remocao`, `sinaisAlerta`, `tipos` |
| `respiratorios` | `fluxoO2`, `interfaces`, `umidificacao`, `montagem`, `indicacoes`, `pressao`, `alarmes` |
| `antissepticos` | `espectro`, `tempoAcao`, `concentracao`, `incompatibilidades`, `areaAplicacao` |

## Como o gerador usa isso

`gerar-biblioteca.py` renderiza o envelope em abas fixas (Visão geral, Usos, Contraindicações, Segurança, NANDA/NIC/NOC, Evidência) e a aba **Características** itera `exclusiveModules`, renderizando cada `characteristics[modulo]` como tabela (dict), lista (array) ou parágrafo (texto). Assim um objeto novo de qualquer categoria vira página sem tocar no gerador.