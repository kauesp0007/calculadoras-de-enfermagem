# -*- coding: utf-8 -*-
import os, re

MENU_PATH = r"c:\calculadoras-de-enfermagem\en\menu-global.html"

# List of all 63 English scale form pages and their display titles
ITEMS = [
    ("formulario_escala_de_aldrete.html", "Aldrete and Kroulik Scale Form"),
    ("formulario_escala_de_apache.html", "APACHE II Score Form"),
    ("formulario_escala_de_apgar.html", "APGAR Score Form"),
    ("formulario_escala_de_asa.html", "ASA Physical Status Form"),
    ("formulario_escala_de_ballard.html", "New Ballard Score Form"),
    ("formulario_escala_de_barthel.html", "Barthel Index Form"),
    ("formulario_escala_de_berg.html", "Berg Balance Scale Form"),
    ("formulario_escala_de_bishop.html", "Bishop Score Form"),
    ("formulario_escala_de_bps.html", "Behavioral Pain Scale (BPS) Form"),
    ("formulario_escala_de_braden.html", "Braden Scale Form"),
    ("formulario_escala_de_cam.html", "CAM-ICU Delirium Assessment Form"),
    ("formulario_escala_de_capurro.html", "Capurro Method Form"),
    ("formulario_escala_de_cincinnati.html", "Cincinnati Stroke Scale Form"),
    ("formulario_escala_de_classificacao_wifi.html", "SVS WIfI Classification Form"),
    ("formulario_escala_de_cornell.html", "Cornell Scale for Depression Form"),
    ("formulario_escala_de_cries.html", "CRIES Neonatal Pain Form"),
    ("formulario_escala_de_curb-65.html", "CURB-65 Pneumonia Form"),
    ("formulario_escala_de_downes.html", "Wood-Downes Score Form"),
    ("formulario_escala_de_downton.html", "Downton Fall Risk Form"),
    ("formulario_escala_de_elpo.html", "ELPO Scale Form"),
    ("formulario_escala_de_escalanumerica.html", "Numeric Pain Rating Scale (NRS) Form"),
    ("formulario_escala_de_fast.html", "FAST Stroke Assessment Form"),
    ("formulario_escala_de_flacc.html", "FLACC Pain Scale Form"),
    ("formulario_escala_de_four.html", "FOUR Coma Scale Form"),
    ("formulario_escala_de_fugulin.html", "Fugulin Patient Classification Form"),
    ("formulario_escala_de_gds.html", "Geriatric Depression Scale (GDS-15) Form"),
    ("formulario_escala_de_glasgow.html", "Glasgow Coma Scale (GCS-P) Form"),
    ("formulario_escala_de_gosnell.html", "Gosnell Scale Form"),
    ("formulario_escala_de_hamilton.html", "Hamilton Anxiety Scale (HAM-A) Form"),
    ("formulario_escala_de_hendrich.html", "Hendrich II Fall Risk Form"),
    ("formulario_escala_de_humpty.html", "Humpty Dumpty Pediatric Fall Form"),
    ("formulario_escala_de_johns.html", "Johns Hopkins Fall Risk Form"),
    ("formulario_escala_de_jouvet.html", "Jouvet Coma Scale Form"),
    ("formulario_escala_de_katz.html", "Katz ADL Index Form"),
    ("formulario_escala_de_lachs.html", "Lachs Vulnerable Elders Form"),
    ("formulario_escala_de_lanss.html", "LANSS Pain Scale Form"),
    ("formulario_escala_de_lawton.html", "Lawton IADL Scale Form"),
    ("formulario_escala_de_manchester.html", "Manchester Triage System Form"),
    ("formulario_escala_de_meem.html", "Mini-Mental State Exam (MMSE) Form"),
    ("formulario_escala_de_meows.html", "Modified Early Obstetric Warning (MEOWS) Form"),
    ("formulario_escala_de_moca.html", "Montreal Cognitive Assessment (MoCA) Form"),
    ("formulario_escala_de_morse.html", "Morse Fall Scale Form"),
    ("formulario_escala_de_news.html", "National Early Warning Score (NEWS 2) Form"),
    ("formulario_escala_de_nihss.html", "NIH Stroke Scale (NIHSS) Form"),
    ("formulario_escala_de_nips.html", "Neonatal Infant Pain Scale (NIPS) Form"),
    ("formulario_escala_de_norton.html", "Norton Scale Form"),
    ("formulario_escala_de_ofras.html", "Ontario Female Risk Assessment (OFRAS) Form"),
    ("formulario_escala_de_painad.html", "PAINAD Scale Form"),
    ("formulario_escala_de_pelod.html", "PELOD-2 Score Form"),
    ("formulario_escala_de_perroca.html", "Perroca Classification Form"),
    ("formulario_escala_de_pews.html", "Pediatric Early Warning Score (PEWS) Form"),
    ("formulario_escala_de_prism.html", "PRISM III Score Form"),
    ("formulario_escala_de_qsofa.html", "Quick SOFA Score (qSOFA) Form"),
    ("formulario_escala_de_ramsay.html", "Ramsay Sedation Scale Form"),
    ("formulario_escala_de_rancholosamigos.html", "Rancho Los Amigos Scale Form"),
    ("formulario_escala_de_richmond.html", "Richmond Agitation-Sedation (RASS) Form"),
    ("formulario_escala_de_saps.html", "SAPS 3 Score Form"),
    ("formulario_escala_de_silverman.html", "Silverman-Andersen Retraction Form"),
    ("formulario_escala_de_sistema_sinbad.html", "SINBAD Diabetic Foot Form"),
    ("formulario_escala_de_sofa.html", "SOFA Score Form"),
    ("formulario_escala_de_tinetti.html", "Tinetti POMA Mobility Form"),
    ("formulario_escala_de_waterlow.html", "Waterlow Pressure Ulcer Form"),
    ("formulario_escala_de_zarit.html", "Zarit Caregiver Burden Form")
]

def update_menu():
    with open(MENU_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    # Build internal <li> tags
    li_html = "\n".join([f'                <li><a href="{href}" class="block px-4 !py-0.5 text-gray-700 hover:bg-gray-100">{title}</a></li>' for href, title in sorted(ITEMS, key=lambda x: x[1])])

    # Replace the submenu ul under "Blank Scale Forms for Printing"
    pattern = r'(Blank Scale Forms for Printing.*?<ul class="[^"]*?scrollable-submenu[^"]*?">)(.*?)(</ul>)'
    
    # If pattern matches, replace inside
    if re.search(pattern, content, re.DOTALL):
        new_content = re.sub(pattern, rf'\1\n{li_html}\n              \3', content, flags=re.DOTALL)
        with open(MENU_PATH, "w", encoding="utf-8") as f:
            f.write(new_content)
        print("Updated en/menu-global.html using regex.")
    else:
        print("Regex pattern did not match directly, checking fallback...")

if __name__ == "__main__":
    update_menu()
