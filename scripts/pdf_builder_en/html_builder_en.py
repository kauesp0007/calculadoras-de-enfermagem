# -*- coding: utf-8 -*-
import os, glob, json

PDF_DIR = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\EN"
EN_DIR = r"c:\calculadoras-de-enfermagem\en"
TEMPLATE_PATH = r"c:\calculadoras-de-enfermagem\CATALOGO_INTRUCOES_CRIACAO_DE_FORMULARIOS\ETAPA_2_CONSTRUINDO_PDF_PARA_PAGINA_HTML\TEMPLATE_PAGINA_FORMULARIO_CANONICA.html"

MAP_EN = {
    'aldrete': ['Aldrete and Kroulik Score (PACU)', 'Post-Anesthesia Recovery Scoring System'],
    'apache': ['APACHE II Score', 'Acute Physiology and Chronic Health Evaluation II'],
    'apgar': ['APGAR Score', 'Assessment of Newborn Vitality'],
    'asa': ['ASA Physical Status Classification', 'Preoperative Physical Status Risk Assessment'],
    'ballard': ['New Ballard Score', 'Assessment of Neonatal Gestational Maturity'],
    'barthel': ['Barthel Index of ADLs', 'Assessment of Functional Independence in Basic ADLs'],
    'berg': ['Berg Balance Scale (BBS)', 'Clinical Assessment of Balance Function and Fall Risk'],
    'bishop': ['Bishop Score', 'Pre-Induction Cervical Ripening Predictor'],
    'bps': ['Behavioral Pain Scale (BPS)', 'Pain Assessment in Sedated Critically Ill Patients'],
    'braden': ['Braden Scale', 'Predictive Risk Assessment of Pressure Injuries'],
    'cam': ['CAM-ICU Delirium Assessment', 'Confusion Assessment Method for the ICU'],
    'capurro': ['Capurro Method', 'Gestational Maturity Assessment in Newborns'],
    'cincinnati': ['Cincinnati Prehospital Stroke Scale', 'Rapid Stroke Screening Tool'],
    'classificacao_wifi': ['SVS WIfI Classification System', 'Threatened Lower Limb Risk Assessment'],
    'cornell': ['Cornell Scale for Depression in Dementia', 'Screening of Depression in Dementia'],
    'cries': ['CRIES Neonatal Pain Scale', 'Postoperative Pain Assessment Tool for Neonates'],
    'curb-65': ['CURB-65 Pneumonia Severity Score', 'Mortality Risk Assessment in Pneumonia'],
    'downes': ['Wood-Downes Score', 'Assessment of Acute Bronchiolitis Severity'],
    'downton': ['Downton Fall Risk Index', 'Assessment of Fall Risk in Adult Inpatients'],
    'elpo': ['ELPO Scale', 'Perioperative Surgical Positioning Risk Assessment'],
    'escalanumerica': ['Numeric Rating Scale for Pain (NRS)', 'Pain Intensity Assessment Tool'],
    'fast': ['FAST Stroke Assessment Tool', 'Face Arm Speech Time Protocol'],
    'flacc': ['FLACC Behavioral Pain Scale', 'Pain Assessment for Infants and Young Children'],
    'four': ['FOUR Score (Coma Scale)', 'Full Outline of UnResponsiveness Coma Assessment'],
    'fugulin': ['Fugulin Patient Classification System', 'Nursing Care Dependency and Staffing Workload'],
    'gds': ['Geriatric Depression Scale (GDS-15)', 'Screening Tool for Depression in Older Adults'],
    'glasgow': ['Glasgow Coma Scale (GCS-P)', 'Neurological Assessment with Pupil Reactivity'],
    'gosnell': ['Gosnell Scale', 'Assessment of Pressure Sore Risk in Inpatients'],
    'hamilton': ['Hamilton Anxiety Rating Scale (HAM-A)', 'Assessment of Anxiety Symptoms'],
    'hendrich': ['Hendrich II Fall Risk Model', 'Screening for Fall Risk in Acute Settings'],
    'humpty': ['Humpty Dumpty Pediatric Fall Risk Scale', 'Pediatric Inpatient Fall Risk Assessment'],
    'johns': ['Johns Hopkins Fall Risk Assessment', 'Inpatient Fall Risk Assessment'],
    'jouvet': ['Jouvet Coma Scale', 'Assessment of Consciousness Perceptivity'],
    'katz': ['Katz Index of ADLs', 'Assessment of Independence in Daily Living'],
    'lachs': ['Lachs Vulnerable Elders Survey', 'Functional Decline Risk in Older Persons'],
    'lanss': ['LANSS Pain Scale', 'Leeds Assessment of Neuropathic Symptoms']
}

def write_part_1():
    pass
