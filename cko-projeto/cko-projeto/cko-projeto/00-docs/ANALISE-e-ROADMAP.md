# Análise & Roadmap (consolidado de objetos-exemplo.txt)

O arquivo de exemplos, além das 6 seringas (já consolidadas em `02-bibliotecas/`), traz uma **análise arquitetural** e um roadmap. Consolidação fiel abaixo. As demais amostras (regras, caso clínico, itens Braden, vacina, microbiologia, anatomia, etc.) estão intercaladas com prosa no arquivo-fonte e **não são extraíveis de forma limpa** — se quiser essas como dados, envie-as em JSON puro que eu ingiro.

## 1. Avaliação — pontos fortes
Identidade do dispositivo, catálogo, especificações, risco regulatório, segurança do paciente, regras clínicas, matriz decisória, metadados de IA, identidade canônica — todos presentes. O objeto já responde "qual dispositivo, em qual cenário, com quais riscos/bloqueios e qual raciocínio" → aproxima de um CDSS.

## 2. Lacunas e adições propostas (backlog)

| # | Lacuna | Bloco proposto |
|---|---|---|
| 2.1 | Ontologia formal | `ontology` (deviceCategory SNOMED CT, connectionSystem, intendedUse) → FHIR/SNOMED/UMLS |
| 3 | Compatibilidade clínica (hoje é texto) | `compatibilityMatrix.needles[]` (gauge, length, routes, recommended) → inferir paciente+via+medicamento→dispositivo |
| 4 | Ligação medicamento↔dispositivo | `medicationCompatibility[]` (drug, preferredDevice, avoidDevices, reason) |
| 5 | Camada de procedimento | `procedureContext` (steps[], failureModes[]) |
| 6 | Patient safety+ | `nearMisses[]`; `safetyBarriers[]` (Swiss Cheese: Human/Technology/Process) |
| 7 | Histórico e versionamento | `knowledgeGovernance` (version, reviewCycle, reviewAuthority, status) |
| 8 | Evidência estruturada | `evidence` (level, type, sources[], recommendationGrade) — não só "Alta" |
| 9 | Inferência reversa | `inferenceRules[]` (when device+route → then risco/ação) |
| 11 | Governança legal (COFEN) | `legalMetadata` (jurisdiction, authority, effectiveDate, relatedNorms) |
| 12 | Indicadores | `qualityCycle` (measure: PDSA, actions[]) |

## 3. Oito motores (já suportados pelo conjunto)
Knowledge Retrieval · Clinical Decision Support · Nursing Process · Medication Safety · Education · Simulation · Audit · Interoperability.

## 4. O próximo salto — objetos de ligação (implementado neste turno)
O arquivo conclui que o CKO deixou de ser catálogo e virou uma **Clinical Knowledge Graph Platform**; o próximo salto são os **objetos de ligação**. Formalizei os 8 como schemas em `01-schema/linking-objects/`:

`ClinicalRule` · `EvidenceReference` · `DecisionTree` · `ClinicalPathway` · `DrugDeviceMatrix` · `ProcedureProtocol` · `AuditIndicatorRule` · `FHIRMapping` — todos válidos (draft 2020-12).

Instância concreta: `02-bibliotecas/_drug-device-matrix.json` (Insulina U-100 → preferencial `seringa-insulina-1ml`, evitar 3/5 mL). Suas arestas medicamento→dispositivo foram somadas ao `04-matrizes/grafo-unificado.csv`.

## 5. Próximo passo sugerido
Aplicar os blocos do backlog (§2) como uma extensão `biblioteca-cko-v2` (todos opcionais, não-quebra) e popular `DrugDeviceMatrix`/`ProcedureProtocol` para os dispositivos de alto risco (insulina, 60 mL, cateteres centrais).
