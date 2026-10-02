# -*- coding: utf-8 -*-
"""update_es_menu.py: Populates es/menu-global.html with all 63 Spanish scale forms"""
import os, re, json

MENU_PATH = r"c:\calculadoras-de-enfermagem\es\menu-global.html"

# Load Spanish titles
with open(r"c:\calculadoras-de-enfermagem\scripts\pdf_builder_es\map_es1.json", "r", encoding="utf-8") as f:
    MAP_ES = json.load(f)
with open(r"c:\calculadoras-de-enfermagem\scripts\pdf_builder_es\map_es2.json", "r", encoding="utf-8") as f:
    MAP_ES.update(json.load(f))

ITEMS = []
for key, (title, subtitle) in MAP_ES.items():
    href = f"formulario_escala_de_{key}.html"
    display_title = f"Formulario - {title}"
    ITEMS.append((href, display_title))

def update_menu():
    with open(MENU_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    li_html = "\n".join([f'                <li><a href="{href}" class="block px-4 !py-0.5 text-gray-700 hover:bg-gray-100">{title}</a></li>' for href, title in sorted(ITEMS, key=lambda x: x[1])])

    # Replace the submenu ul under "Formularios en Blanco de Escalas para Imprimir"
    pattern = r'(Formularios en Blanco de Escalas para Imprimir.*?<ul class="[^"]*?scrollable-submenu[^"]*?">)(.*?)(</ul>)'
    
    if re.search(pattern, content, re.DOTALL):
        new_content = re.sub(pattern, rf'\1\n{li_html}\n              \3', content, flags=re.DOTALL)
        with open(MENU_PATH, "w", encoding="utf-8") as f:
            f.write(new_content)
        print("🎉 Successfully updated es/menu-global.html with all 63 Spanish forms.")
    else:
        print("❌ Pattern match failed for es/menu-global.html.")

if __name__ == "__main__":
    update_menu()
