# Objetos Clínicos (envelope core+domainPayload)

24 objetos CKO extraídos do gerador limpo (`exemplo-objeto.txt`), cobrindo 24 bibliotecas. Envelope: `id · knowledgeType · library · identity · core (governance/evidence/ai/knowledgeGraph/...) · domainPayload`. Schema leve: `01-schema/cko-objeto-v1.schema.json` — **24/24 válidos**.

Diferente dos objetos de dispositivo (`biblioteca-cko-v1`, com `exclusiveModules`) e do runtime (`seringa-cko-v11`). É a terceira classe de objeto do projeto — o conteúdo clínico transversal.

## Conjunto (24)

| Objeto | knowledgeType | library | relatedObjects |
|---|---|---|---|
| `assepsia` | ClinicalConcept | conceitos | 5 |
| `calculadora-imc` | Calculator | calculadoras | 4 |
| `caso-sepse-01` | Education | educacao | 5 |
| `ceftriaxona` | Medication | medicamentos | 10 |
| `escala-braden` | ClinicalScale | escalas | 7 |
| `filtracao-glomerular` | Physiology | fisiologia | 5 |
| `flebite` | AdverseEvent | eventos-adversos | 5 |
| `hemograma` | LaboratoryExam | exames | 5 |
| `musculo-deltoide` | Anatomy | anatomia | 5 |
| `nanda-00046` | NursingDiagnosis | nanda | 7 |
| `necrose` | Pathology | patologia | 5 |
| `nic-2312` | NICIntervention | nic | 10 |
| `noc-0401` | NOCOutcome | noc | 6 |
| `nove-certos` | PatientSafety | seguranca-paciente | 5 |
| `pressao-arterial` | VitalSign | sinais-vitais | 6 |
| `protocolo-sepse` | Protocol | protocolos | 7 |
| `puncao-venosa` | Procedure | procedimentos | 7 |
| `resolucao-cofen-588` | Legislation | legislacao | 4 |
| `sepse` | Disease | doencas | 15 |
| `seringa-20ml-luer-lock` | MedicalDevice | materiais | 13 |
| `snomed-ct` | Terminology | terminologias | 5 |
| `staphylococcus-aureus` | Microorganism | microorganismos | 6 |
| `taxa-infeccao` | CareIndicator | indicadores | 4 |
| `vacina-bcg` | Vaccine | vacinas | 4 |

## Grafo de conhecimento

Cada objeto traz `core.knowledgeGraph.relatedObjects`. Consolidei **155 arestas** (`objeto --relacionado--> alvo`), 48 internas ao conjunto — ex.: `sepse` liga a ceftriaxona, protocolo-sepse, taxa-infecção, qSOFA, nanda/nic/noc. Arquivo: `04-matrizes/grafo-objetos-clinicos.csv`; somadas ao `grafo-unificado.csv` (agora **1.654 arestas**).

Isso concretiza a "Clinical Knowledge Graph Platform" do roadmap: medicamento ↔ doença ↔ protocolo ↔ escala ↔ NANDA/NIC/NOC ↔ dispositivo ↔ indicador, tudo navegável.
