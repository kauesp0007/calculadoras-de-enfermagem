const CACHE_VERSION = "20260801-121118";
const CACHE_NAME = `calculadoras-enfermagem-cache-${CACHE_VERSION}`;

// O SCRIPT DE BUILD VAI INJETAR A LISTA DE ARQUIVOS AQUI
const urlsToCache = [
  '.chrome-perfil-pci/ActorSafetyLists/9.5220.3721/_metadata/verified_contents.json',
  '.chrome-perfil-pci/ActorSafetyLists/9.5220.3721/listdata.json',
  '.chrome-perfil-pci/ActorSafetyLists/9.5220.3721/manifest.json',
  '.chrome-perfil-pci/AmountExtractionHeuristicRegexes/4/_metadata/verified_contents.json',
  '.chrome-perfil-pci/AmountExtractionHeuristicRegexes/4/manifest.json',
  '.chrome-perfil-pci/CertificateRevocation/10686/_metadata/verified_contents.json',
  '.chrome-perfil-pci/CertificateRevocation/10686/manifest.json',
  '.chrome-perfil-pci/Crowd Deny/2026.7.30.63/_metadata/verified_contents.json',
  '.chrome-perfil-pci/Crowd Deny/2026.7.30.63/manifest.json',
  '.chrome-perfil-pci/FileTypePolicies/145.0.7584.0/_metadata/verified_contents.json',
  '.chrome-perfil-pci/FileTypePolicies/145.0.7584.0/manifest.json',
  '.chrome-perfil-pci/MEIPreload/1.1.0.3/_metadata/verified_contents.json',
  '.chrome-perfil-pci/MEIPreload/1.1.0.3/manifest.json',
  '.chrome-perfil-pci/OnDeviceHeadSuggestModel/20251024.824731831.14/_metadata/verified_contents.json',
  '.chrome-perfil-pci/OnDeviceHeadSuggestModel/20251024.824731831.14/manifest.json',
  '.chrome-perfil-pci/OptimizationHints/719/_metadata/verified_contents.json',
  '.chrome-perfil-pci/OptimizationHints/719/manifest.json',
  '.chrome-perfil-pci/PKIMetadata/1733/_metadata/verified_contents.json',
  '.chrome-perfil-pci/PKIMetadata/1733/manifest.json',
  '.chrome-perfil-pci/SODA/1.2.12/_metadata/verified_contents.json',
  '.chrome-perfil-pci/SODA/1.2.12/manifest.json',
  '.chrome-perfil-pci/SODALanguagePacks/en-US/1.5075.0/_metadata/verified_contents.json',
  '.chrome-perfil-pci/SODALanguagePacks/en-US/1.5075.0/manifest.json',
  '.chrome-perfil-pci/SODALanguagePacks/pt-BR/1.3071.0/_metadata/verified_contents.json',
  '.chrome-perfil-pci/SODALanguagePacks/pt-BR/1.3071.0/manifest.json',
  '.chrome-perfil-pci/SSLErrorAssistant/7/_metadata/verified_contents.json',
  '.chrome-perfil-pci/SSLErrorAssistant/7/manifest.json',
  '.chrome-perfil-pci/SafetyTips/3091/_metadata/verified_contents.json',
  '.chrome-perfil-pci/SafetyTips/3091/manifest.json',
  '.chrome-perfil-pci/Subresource Filter/Unindexed Rules/9.70.0/_metadata/verified_contents.json',
  '.chrome-perfil-pci/Subresource Filter/Unindexed Rules/9.70.0/manifest.json',
  '.chrome-perfil-pci/TranslateKit/models/en_es/2024.9.9.1/_metadata/verified_contents.json',
  '.chrome-perfil-pci/TranslateKit/models/en_es/2024.9.9.1/manifest.json',
  '.chrome-perfil-pci/TrustTokenKeyCommitments/2026.3.23.1/_metadata/verified_contents.json',
  '.chrome-perfil-pci/TrustTokenKeyCommitments/2026.3.23.1/keys.json',
  '.chrome-perfil-pci/TrustTokenKeyCommitments/2026.3.23.1/manifest.json',
  '.chrome-perfil-pci/WasmTtsEngine/20260723.1/_metadata/verified_contents.json',
  '.chrome-perfil-pci/WasmTtsEngine/20260723.1/background_compiled.js',
  '.chrome-perfil-pci/WasmTtsEngine/20260723.1/bindings_main.js',
  '.chrome-perfil-pci/WasmTtsEngine/20260723.1/manifest.json',
  '.chrome-perfil-pci/WasmTtsEngine/20260723.1/offscreen_compiled.js',
  '.chrome-perfil-pci/WasmTtsEngine/20260723.1/streaming_worklet_processor.js',
  '.chrome-perfil-pci/WasmTtsEngine/20260723.1/voices.json',
  '.chrome-perfil-pci/WasmTtsEngine/20260723.1/wasm_tts_manifest_v3.json',
  '.chrome-perfil-pci/ZxcvbnData/3/_metadata/verified_contents.json',
  '.chrome-perfil-pci/ZxcvbnData/3/manifest.json',
  '.chrome-perfil-pci/component_crx_cache/metadata.json',
  '.chrome-perfil-pci/extensions_crx_cache/metadata.json',
  '.chrome-perfil-pci/hyphen-data/120.0.6050.0/_metadata/verified_contents.json',
  '.chrome-perfil-pci/hyphen-data/120.0.6050.0/manifest.json',
  '.tradutor_cache/richmond_it.json',
  '.tradutor_cache/silverman_ar.json',
  '.tradutor_cache/silverman_en.json',
  '.tradutor_cache/silverman_es.json',
  '.tradutor_cache/silverman_hi.json',
  '.tradutor_cache/silverman_pl.json',
  '.tradutor_cache/silverman_tr.json',
  '.tradutor_cache/silverman_uk.json',
  '.tradutor_cache/sofa_it.json',
  '.tradutor_cache/sofa_uk.json',
  '.tradutor_cache/tinetti_uk.json',
  '.tradutor_cache/waterlow_ar.json',
  '.tradutor_cache/waterlow_de.json',
  '.tradutor_cache/waterlow_hi.json',
  '.tradutor_cache/waterlow_ja.json',
  '.tradutor_cache/waterlow_ko.json',
  '.tradutor_cache/waterlow_nl.json',
  '.tradutor_cache/waterlow_sv.json',
  '.tradutor_cache/waterlow_uk.json',
  '.vscode/extensions.json',
  '.vscode/settings.json',
  '.vscode/tasks.json',
  '/index.html',
  '/offline.html',
  'analytics-data.json',
  'atualizar-scripts.js',
  'automacoes/banco_nanda_2024_extracted.json',
  'automacoes/banco_nanda_2024_merged_suggestion.json',
  'automacoes/banco_nanda_2024_new_only.json',
  'automacoes/banco_nanda_2024_new_only_clean.json',
  'automacoes/banco_nanda_2024_new_only_clean_updated.json',
  'automacoes/extrator_infograficos/cache/0056d773697805b8342670164c1bc8b5d7431218466fe94b36aea707884b5f61.json',
  'automacoes/extrator_infograficos/cache/04b00e7b0327efd81cec3c7ae2728e6318afb4b75ae224f8fac281a6353e65de.json',
  'automacoes/extrator_infograficos/cache/079b76433a0f0e2fbdace2b815bfad674e3737afaa8c0eac36fbcda06e9b213b.json',
  'automacoes/extrator_infograficos/cache/09038f61b956eef9d3efd00776a790499b2df58b48ecac20d10cb3e11cc5d903.json',
  'automacoes/extrator_infograficos/cache/09575aa2e776691d14bd91bbe58393c6bfb0563b3d5f76a8b1ca61fd59d6fed8.json',
  'automacoes/extrator_infograficos/cache/0eba1e514cdae249297b8baa816e770b66f250b3e9973e32910a1fa967376e75.json',
  'automacoes/extrator_infograficos/cache/118f4d410674373460de80ba8778cc2b970b311355c7ffb32e7c4b063f6ffcf5.json',
  'automacoes/extrator_infograficos/cache/1e62c40357d7b0ab701d0bb036adc6b2d25749e2bbbdea40ad273d4a0bdf7bf4.json',
  'automacoes/extrator_infograficos/cache/208e11470ade2b876bdd1a4b7c0af8c808eb5e9040870484eaf54088cb7a5fdb.json',
  'automacoes/extrator_infograficos/cache/24af573db271ce6be385c8e784362c4991fcb5597a9b3210df2652ad0e4a2416.json',
  'automacoes/extrator_infograficos/cache/27f552a7c55b89c0236159214fa6367682716389adb07983f6bff873cfa9e249.json',
  'automacoes/extrator_infograficos/cache/2a374ade8857ff94e4c9b92b440821b12dfbec8f1b7dfae963cd93d43ef4ec2f.json',
  'automacoes/extrator_infograficos/cache/3011bfc480834b7b85514cf62a58c4d9632588bd19c2d3e40dbeb0776ad3bc4f.json',
  'automacoes/extrator_infograficos/cache/31586f50fa4f9b33dedb4c65a4c1f58ab0f77490c6b87d1c2cf41d0be9da2e9a.json',
  'automacoes/extrator_infograficos/cache/34cf2a380b92a255ca962d54a6f97d7ab96ba57f153fcc6c1591d28fc4b45eda.json',
  'automacoes/extrator_infograficos/cache/3bb3ccc3b67e6bdade965a46cdd63b9061d4c4df4e600a1feab23ca7182ec0f0.json',
  'automacoes/extrator_infograficos/cache/46c2090f43b6a75a8cb690b4edd2a16aec6c756cd5ae8b6f5017f360c7b373cf.json',
  'automacoes/extrator_infograficos/cache/48f04995709493d6a601df291d951ac5e7d2c88f6310e7656a7bb5c10e40317d.json',
  'automacoes/extrator_infograficos/cache/4a51fa24c5a3d14e3e2efb84eea4774d9a969080d56f44ca35d23a39f92d34b5.json',
  'automacoes/extrator_infograficos/cache/509c6683eb200727a0eef8a2dfd681ba01fb3967ff9c04c7b0f538858029268b.json',
  'automacoes/extrator_infograficos/cache/57111d067ba205f3a19a4be09c3c4c422b71683fad55d89e3450fa998ac3801d.json',
  'automacoes/extrator_infograficos/cache/61beae98cca2e030e5c43805f8086e106559434415b8bb79e12deb09b1d03191.json',
  'automacoes/extrator_infograficos/cache/78387310652549625e36cc6ef4402c3035e9c44df12b54e87bffbd7f50cce331.json',
  'automacoes/extrator_infograficos/cache/7b71882bf33e7d036cb9012bec36cbfd7df50f55e117c86f8ce39bb0e2274fd1.json',
  'automacoes/extrator_infograficos/cache/7e411dac3749931b4ce53d4bed57a37d09717d8430b78f5d00e008f79f9eca78.json',
  'automacoes/extrator_infograficos/cache/8f04875fb0346ac70068307c520086282d8d824593d6c74878ade8ada5a16719.json',
  'automacoes/extrator_infograficos/cache/8f5a39c5621846edafcbde4e9e5c62fbb9b182a34fa241901e21e45133227793.json',
  'automacoes/extrator_infograficos/cache/955ede8f5424b694dfa0cc7c9b694466e25c11c44ed97bd4afee2c3008eb356e.json',
  'automacoes/extrator_infograficos/cache/9739a2d8d3196f595049cacd2c73a6bc89cad63e5b68dc5946c92569e5d53442.json',
  'automacoes/extrator_infograficos/cache/99063beff80d2a049f719a5220b7fa774337ab06b6d238d27365209f64b71c17.json',
  'automacoes/extrator_infograficos/cache/a27b1ee17185caa7f8bbc6ef4cfe85fcf9a1a985712b99374f26807b6e30cbbe.json',
  'automacoes/extrator_infograficos/cache/a664eefed226fdd22ce443516e4c082cd381203061efcac60ed2ffc746dfc995.json',
  'automacoes/extrator_infograficos/cache/a6df065e5ea605e47e7af6ce5747dd045130850c28ba2f775c9293cfea129fbd.json',
  'automacoes/extrator_infograficos/cache/a71ae55309c3f3a43ccec02eea395621772e4d39b05ef3b9e84c891bcac66496.json',
  'automacoes/extrator_infograficos/cache/a9499632c043f481b01929aca57b8011c0054ea4e841d6ea90011e2205340e2e.json',
  'automacoes/extrator_infograficos/cache/a9fc73c6fbc6c70e156f4fa361ac28b09b01c30fd96527e93bcbd37be55d87e8.json',
  'automacoes/extrator_infograficos/cache/acf60a10b825dfb00b88644ea732fdafdaf0af29dd4973dd74a5a86137f6f5ea.json',
  'automacoes/extrator_infograficos/cache/ad1562ef5bff29f0e17082a3162c8029c2bc85091e1fdb84d78c930fca380d93.json',
  'automacoes/extrator_infograficos/cache/ae7caeb03161dfa3b336567bc63c56e7717f7e54c056e1889d3ad97018a29b79.json',
  'automacoes/extrator_infograficos/cache/b06c62c41dd923a8614a13f18aa2c06a7eee88a5d1b8738ace5340f20bbd33ee.json',
  'automacoes/extrator_infograficos/cache/b4d1c908af10f508802e13800e188d097007914e39ce59673c58fc2f9137bae2.json',
  'automacoes/extrator_infograficos/cache/bab9560568cab56e3c103ea27f548a9c31e57e6bcbaed7a1002a91202136a0e2.json',
  'automacoes/extrator_infograficos/cache/bbd9934f5004d202414c3b84414c13199f32520d882cbbbae404e7add6e0d219.json',
  'automacoes/extrator_infograficos/cache/c0ecf9afe65afd6c60a6c551ed4ac935e384709a98bbc184135db746c35b9b65.json',
  'automacoes/extrator_infograficos/cache/d0625d7ab371f14834bbfe79196119a8b3f76d5ba298dabce01e221b046199c5.json',
  'automacoes/extrator_infograficos/cache/d508781cabf9134d87309254faa7f8a2369b87fef6e14d677934dabbfe87a904.json',
  'automacoes/extrator_infograficos/cache/d51ed06d19ca108edad01beaf0182c6dbe69d582f2d7a18292fc1d4e874af4a9.json',
  'automacoes/extrator_infograficos/cache/d75618bdda5bb43dfea9ca2cf2e927aeb2d5e18b8e6930717b94a72b3e2576e5.json',
  'automacoes/extrator_infograficos/cache/daa4a2d14b67fa3bce014eb4e57ebc4594c654932ced02a35a8c2d11158cdf94.json',
  'automacoes/extrator_infograficos/cache/dd1c4a0e58e3cb0c6ae3e2df910510fadd217758a57e78c447bc9096f10c0b0b.json',
  'automacoes/extrator_infograficos/cache/ddd3d6fa5f25a7838f43d842af20154409098c1f81102edb5c310fb0c1558765.json',
  'automacoes/extrator_infograficos/cache/df05a1ae02da133e36ab7ab4d8c4971356873eed789a7b5665d79e32d15028b8.json',
  'automacoes/extrator_infograficos/cache/df4915185e8f68ed54c49b80845a302da85f5d5a8351ea10f5a0773edaf04f5d.json',
  'automacoes/extrator_infograficos/cache/e13c164d508cba4ea4d0524c9e829872378b9987310fead49b406568d67e5756.json',
  'automacoes/extrator_infograficos/cache/e222320adc0c7aaf9ccc73c018ed147c079171c622985fa14e1ea878ce6e0ac2.json',
  'automacoes/extrator_infograficos/cache/ece91a24d5a2dadef9d92321d889eb9f519c9cadf3454eba232f30a334a82668.json',
  'automacoes/extrator_infograficos/cache/f021def1a2e1d3d7c5930888fdcd2b90c2579c4762d0c8a8ad24a2afcd9dca6a.json',
  'automacoes/extrator_infograficos/cache/f5fca5a0a742c0c0c650ca8b68b1f45b6d3953ef4068fb82a85eae8ef54c694c.json',
  'automacoes/extrator_infograficos/cache/fb5fb5b2744aeb1073d5f8166510dbb3d296e6424ba66d1b5357dcd03b5faab0.json',
  'automacoes/extrator_infograficos/cache/fba5a961f37c43abc47ee3cbcfedab0637ee25f0ed4876ecaed30b5b315c0cab.json',
  'automacoes/extrator_infograficos/cache/fbcc7354ebb1307d29bfea18377c0550ecb4809ceda17151c2305e4c00001921.json',
  'automacoes/extrator_infograficos/saida/layout.json',
  'automacoes/extrator_infograficos/saida/manifest.json',
  'automacoes/svg_cache.json',
  'automation-guard.js',
  'automatizador-em-massa.js',
  'banco_nanda.json',
  'banco_nanda.json.bak-20260704T061029.json',
  'banco_nanda_en.json',
  'banco_nanda_es.json',
  'banco_nic_completo.json',
  'banco_nic_en.json',
  'banco_strings_js.json',
  'biblioteca-automation.js',
  'biblioteca-provas.json',
  'biblioteca.json',
  'build-biblioteca.js',
  'build-downloads.js',
  'build-fale.js',
  'build-nanda.js',
  'build-pdf_provas_de_concursos.js',
  'build.js',
  'ce-calculadora-padrao.js',
  'cko-projeto/cko-projeto/cko-projeto/01-schema/biblioteca-cko-v1.schema.json',
  'cko-projeto/cko-projeto/cko-projeto/01-schema/cko-objeto-v1.schema.json',
  'cko-projeto/cko-projeto/cko-projeto/01-schema/linking-objects/AuditIndicatorRule.schema.json',
  'cko-projeto/cko-projeto/cko-projeto/01-schema/linking-objects/ClinicalPathway.schema.json',
  'cko-projeto/cko-projeto/cko-projeto/01-schema/linking-objects/ClinicalRule.schema.json',
  'cko-projeto/cko-projeto/cko-projeto/01-schema/linking-objects/DecisionTree.schema.json',
  'cko-projeto/cko-projeto/cko-projeto/01-schema/linking-objects/DrugDeviceMatrix.schema.json',
  'cko-projeto/cko-projeto/cko-projeto/01-schema/linking-objects/EvidenceReference.schema.json',
  'cko-projeto/cko-projeto/cko-projeto/01-schema/linking-objects/FHIRMapping.schema.json',
  'cko-projeto/cko-projeto/cko-projeto/01-schema/linking-objects/ProcedureProtocol.schema.json',
  'cko-projeto/cko-projeto/cko-projeto/01-schema/seringa-cko-v11.schema.json',
  'cko-projeto/cko-projeto/cko-projeto/02-bibliotecas/_drug-device-matrix.json',
  'cko-projeto/cko-projeto/cko-projeto/02-bibliotecas/agulhas.json',
  'cko-projeto/cko-projeto/cko-projeto/02-bibliotecas/antissepticos.json',
  'cko-projeto/cko-projeto/cko-projeto/02-bibliotecas/cateteres.json',
  'cko-projeto/cko-projeto/cko-projeto/02-bibliotecas/cirurgicos.json',
  'cko-projeto/cko-projeto/cko-projeto/02-bibliotecas/curativos.json',
  'cko-projeto/cko-projeto/cko-projeto/02-bibliotecas/drenos.json',
  'cko-projeto/cko-projeto/cko-projeto/02-bibliotecas/feridas.json',
  'cko-projeto/cko-projeto/cko-projeto/02-bibliotecas/luvas.json',
  'cko-projeto/cko-projeto/cko-projeto/02-bibliotecas/ostomias.json',
  'cko-projeto/cko-projeto/cko-projeto/02-bibliotecas/respiratorios.json',
  'cko-projeto/cko-projeto/cko-projeto/02-bibliotecas/seringa-10ml-luerlock.json',
  'cko-projeto/cko-projeto/cko-projeto/02-bibliotecas/seringa-20ml-luerlock.json',
  'cko-projeto/cko-projeto/cko-projeto/02-bibliotecas/seringa-3ml-luerlock.json',
  'cko-projeto/cko-projeto/cko-projeto/02-bibliotecas/seringa-5ml-luerlock.json',
  'cko-projeto/cko-projeto/cko-projeto/02-bibliotecas/seringa-60ml-irrigation.json',
  'cko-projeto/cko-projeto/cko-projeto/02-bibliotecas/seringa-insulina-1ml.json',
  'cko-projeto/cko-projeto/cko-projeto/02-bibliotecas/sondas.json',
  'cko-projeto/cko-projeto/cko-projeto/03-templates/ckos-runtime.js',
  'cko-projeto/cko-projeto/cko-projeto/03-templates/css/pages/biblioteca.css',
  'cko-projeto/cko-projeto/cko-projeto/03-templates/seringa-insulina-030.cko.json',
  'cko-projeto/cko-projeto/cko-projeto/05-objetos-clinicos/_index.json',
  'cko-projeto/cko-projeto/cko-projeto/05-objetos-clinicos/assepsia.json',
  'cko-projeto/cko-projeto/cko-projeto/05-objetos-clinicos/calculadora-imc.json',
  'cko-projeto/cko-projeto/cko-projeto/05-objetos-clinicos/caso-sepse-01.json',
  'cko-projeto/cko-projeto/cko-projeto/05-objetos-clinicos/ceftriaxona.json',
  'cko-projeto/cko-projeto/cko-projeto/05-objetos-clinicos/escala-braden.json',
  'cko-projeto/cko-projeto/cko-projeto/05-objetos-clinicos/filtracao-glomerular.json',
  'cko-projeto/cko-projeto/cko-projeto/05-objetos-clinicos/flebite.json',
  'cko-projeto/cko-projeto/cko-projeto/05-objetos-clinicos/hemograma.json',
  'cko-projeto/cko-projeto/cko-projeto/05-objetos-clinicos/musculo-deltoide.json',
  'cko-projeto/cko-projeto/cko-projeto/05-objetos-clinicos/nanda-00046.json',
  'cko-projeto/cko-projeto/cko-projeto/05-objetos-clinicos/necrose.json',
  'cko-projeto/cko-projeto/cko-projeto/05-objetos-clinicos/nic-2312.json',
  'cko-projeto/cko-projeto/cko-projeto/05-objetos-clinicos/noc-0401.json',
  'cko-projeto/cko-projeto/cko-projeto/05-objetos-clinicos/nove-certos.json',
  'cko-projeto/cko-projeto/cko-projeto/05-objetos-clinicos/pressao-arterial.json',
  'cko-projeto/cko-projeto/cko-projeto/05-objetos-clinicos/protocolo-sepse.json',
  'cko-projeto/cko-projeto/cko-projeto/05-objetos-clinicos/puncao-venosa.json',
  'cko-projeto/cko-projeto/cko-projeto/05-objetos-clinicos/resolucao-cofen-588.json',
  'cko-projeto/cko-projeto/cko-projeto/05-objetos-clinicos/sepse.json',
  'cko-projeto/cko-projeto/cko-projeto/05-objetos-clinicos/seringa-20ml-luer-lock.json',
  'cko-projeto/cko-projeto/cko-projeto/05-objetos-clinicos/snomed-ct.json',
  'cko-projeto/cko-projeto/cko-projeto/05-objetos-clinicos/staphylococcus-aureus.json',
  'cko-projeto/cko-projeto/cko-projeto/05-objetos-clinicos/taxa-infeccao.json',
  'cko-projeto/cko-projeto/cko-projeto/05-objetos-clinicos/vacina-bcg.json',
  'convert-webp.js',
  'corrigir-badges.js',
  'css-duplicates-report.json',
  'de/favicon.ico',
  'docs/manifesto.json',
  'en/favicon.ico',
  'es/favicon.ico',
  'extrator-hospitais.js',
  'favicon.ico',
  'fetch-analytics.js',
  'fonts/arabic/arabic-700.woff2',
  'fonts/arabic/arabic-regular.woff2',
  'fonts/chinese/chinese-700.woff2',
  'fonts/chinese/chinese-regular.woff2',
  'fonts/devanagari/devanagari-700.woff2',
  'fonts/devanagari/devanagari-regular.woff2',
  'fonts/inter/inter-600.woff2',
  'fonts/inter/inter-700.woff2',
  'fonts/inter/inter-900.woff2',
  'fonts/inter/inter-regular.woff2',
  'fonts/japanese/japanese-700.woff2',
  'fonts/japanese/japanese-regular.woff2',
  'fonts/korean/korean-700.woff2',
  'fonts/korean/korean-regular.woff2',
  'fonts/nunito/nunito-700.woff2',
  'fonts/nunito/nunito-900.woff2',
  'fonts/nunito/nunito-regular.woff2',
  'force-clear-capas.js',
  'force-fix-lang-bar.js',
  'fr/favicon.ico',
  'ga-credentials.json',
  'generate-sitemap.js',
  'gerarCapasPDF.js',
  'gerarCapasVideo.js',
  'global-scripts.js',
  'global-styles.css',
  'glossary-search.js',
  'hi/favicon.ico',
  'hospitais.json',
  'id/favicon.ico',
  'img/education-svgrepo-com.svg',
  'it/favicon.ico',
  'ja/favicon.ico',
  'js/accessibility.js',
  'js/backToTop.js',
  'js/cookies.js',
  'js/main.js',
  'js/menu.js',
  'js/web-vitals-reporter.js',
  'ko/favicon.ico',
  'lang-selector.js',
  'lighthouserc.js',
  'locales/ar/cookies.json',
  'locales/ar/footer.json',
  'locales/bn/cookies.json',
  'locales/bn/footer.json',
  'locales/cs/cookies.json',
  'locales/cs/footer.json',
  'locales/da/cookies.json',
  'locales/da/footer.json',
  'locales/de/cookies.json',
  'locales/de/footer.json',
  'locales/el/cookies.json',
  'locales/el/footer.json',
  'locales/en/cookies.json',
  'locales/en/footer.json',
  'locales/es/cookies.json',
  'locales/es/footer.json',
  'locales/fi/cookies.json',
  'locales/fi/footer.json',
  'locales/fr/cookies.json',
  'locales/fr/footer.json',
  'locales/he/cookies.json',
  'locales/he/footer.json',
  'locales/hi/cookies.json',
  'locales/hi/footer.json',
  'locales/id/cookies.json',
  'locales/id/footer.json',
  'locales/it/cookies.json',
  'locales/it/footer.json',
  'locales/ja/cookies.json',
  'locales/ja/footer.json',
  'locales/ko/cookies.json',
  'locales/ko/footer.json',
  'locales/ms/cookies.json',
  'locales/ms/footer.json',
  'locales/nb/cookies.json',
  'locales/nb/footer.json',
  'locales/nl/cookies.json',
  'locales/nl/footer.json',
  'locales/pl/cookies.json',
  'locales/pl/footer.json',
  'locales/pt/cookies.json',
  'locales/pt/footer.json',
  'locales/ro/cookies.json',
  'locales/ro/footer.json',
  'locales/ru/cookies.json',
  'locales/ru/footer.json',
  'locales/sv/cookies.json',
  'locales/sv/footer.json',
  'locales/th/cookies.json',
  'locales/th/footer.json',
  'locales/tr/cookies.json',
  'locales/tr/footer.json',
  'locales/uk/cookies.json',
  'locales/uk/footer.json',
  'locales/ur/cookies.json',
  'locales/ur/footer.json',
  'locales/vi/cookies.json',
  'locales/vi/footer.json',
  'locales/zh/cookies.json',
  'locales/zh/footer.json',
  'log-imagens.js',
  'main.js',
  'manchester_fluxogramas.json',
  'manifest.json',
  'nl/favicon.ico',
  'otimizador-imagens.js',
  'otimizar-imagens.js',
  'padronizar-largura.js',
  'pl/favicon.ico',
  'public/output.css',
  'relatorio_auditoria_seo.json',
  'relatorio_hreflang.json',
  'relatorios/auditoria-cwv-html.json',
  'relatorios/multiplex-reserva.json',
  'remover-circulo-hero-card.js',
  'ru/favicon.ico',
  'scaffold-lang.js',
  'scan-biblioteca.js',
  'scanner-biblioteca.js',
  'scanner-footer-chain.js',
  'scripts/build-blog.js',
  'scripts/extract-docx.js',
  'scripts/find-css-duplicates.js',
  'scripts/parse-dictionary.js',
  'scripts/parse-glossario.js',
  'scripts/remove-static-glossary.js',
  'simpleRename.js',
  'src/input.css',
  'sv/favicon.ico',
  'terminologias.json',
  'termos_medicos_parsed.json',
  'tr/favicon.ico',
  'uk/favicon.ico',
  'vi/favicon.ico',
  'watch-images.js',
  'watch-pdfs.js',
  'zh/favicon.ico'
];

// 1. EVENTO DE INSTALAÇÃO (Precaching tolerante a falhas)
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        console.log(
          `[Service Worker] Instalando nova versão: ${CACHE_VERSION}`,
        );

        // Adiciona os ficheiros ao cache 1 a 1.
        // Se um ficheiro faltar, não impede a instalação do resto (fundamental para grandes repositórios)
        await Promise.all(
          urlsToCache
            .filter((url) => !url.startsWith("/*"))
            .map((url) => {
              return cache
                .add(new Request(url, { cache: "reload" }))
                .catch((err) => {
                  console.warn(
                    `[Service Worker] Ficheiro não encontrado para cache: ${url}`,
                  );
                });
            }),
        );
      })
      .then(() => self.skipWaiting()), // Força o SW a assumir o controlo
  );
});

// 2. EVENTO DE ATIVAÇÃO (Limpeza de caches antigos)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log(
                `[Service Worker] Apagando cache antigo: ${cacheName}`,
              );
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// 3. EVENTO DE FETCH (A Mágica da Interceção)
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Intercepta apenas requisições HTTP/HTTPS normais de GET
  if (!url.protocol.startsWith("http") || req.method !== "GET") return;

  // ESTRATÉGIA EXCEÇÃO: Bloqueadores de Anúncios (Ad Blockers)
  // Evita o erro "Failed to convert value to 'Response'" interceptando as falhas do AdSense
  if (req.url.includes("googlesyndication.com")) {
    event.respondWith(
      fetch(req).catch((error) => {
        // Se a requisição falhar (ex: bloqueada pelo navegador), retorna uma resposta vazia inofensiva
        return new Response(null, { status: 204 });
      }),
    );
    return;
  }

  // ESTRATÉGIA 1: PÁGINAS HTML (Network First -> Cache Fallback -> Offline Fallback)
  if (
    req.mode === "navigate" ||
    req.headers.get("accept").includes("text/html")
  ) {
    // 1. Cria uma URL temporária com o Cache Buster para forçar a rede a entregar o arquivo fresco
    const bypassUrl = new URL(req.url);
    bypassUrl.searchParams.set("v", CACHE_VERSION);

    event.respondWith(
      fetch(bypassUrl)
        .then((networkResponse) => {
          // 2. Salva dinamicamente a página HTML usando a requisição ORIGINAL 'req' como chave
          const responseToCache = networkResponse.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(req, responseToCache));
          return networkResponse;
        })
        .catch(async () => {
          // Se estiver offline, tenta carregar o HTML da versão em cache
          const cachedResponse = await caches.match(req);
          if (cachedResponse) return cachedResponse;

          // Se não tiver no cache, tenta entregar a página offline padrão
          const offlinePage = await caches.match("/offline.html");
          if (offlinePage) return offlinePage;

          // Se até o offline.html falhar (Fallback absoluto para evitar TypeError)
          return new Response(
            "<h1>Sem conexão</h1><p>Você está offline e esta página não foi salva no cache.</p>",
            {
              status: 503,
              headers: { "Content-Type": "text/html; charset=utf-8" },
            },
          );
        }),
    );
    return;
  }

  // ESTRATÉGIA 2: CSS e JS (O "Cache Buster Invisível")
  if (url.pathname.endsWith(".css") || url.pathname.endsWith(".js")) {
    event.respondWith(
      caches.match(req).then((cachedResponse) => {
        // Se estiver no cache ATUAL, entrega imediatamente!
        if (cachedResponse) return cachedResponse;

        // Se NÃO estiver no cache, vai buscar à rede e INJETA O CACHE BUSTER
        const fetchUrl = new URL(req.url);
        fetchUrl.searchParams.set("v", CACHE_VERSION);

        return fetch(fetchUrl)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches
                .open(CACHE_NAME)
                .then((cache) => cache.put(req, responseToCache));
            }
            return networkResponse;
          })
          .catch(() => {
            // Em caso de falha de rede e não ter cache (Fallback absoluto)
            return caches
              .match(req)
              .then(
                (res) =>
                  res ||
                  new Response("", { status: 404, statusText: "Not Found" }),
              );
          });
      }),
    );
    return;
  }

  // ESTRATÉGIA 3: IMAGENS E RESTANTES RECURSOS (Stale-While-Revalidate)
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      const fetchPromise = fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(req, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => {
          // Falha de rede pura (ex: bloqueio de AdBlock ou offline sem cache)
          // Precisamos retornar uma resposta válida vazia para evitar "Failed to convert value to Response"
          return new Response("", {
            status: 408,
            statusText: "Request Timeout",
          });
        });

      return cachedResponse || fetchPromise;
    }),
  );
});