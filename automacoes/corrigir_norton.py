"""Corrige NORTON: } extra + cor vermelha para val===1"""
import os

dirs = ['ar','de','en','es','fr','hi','id','it','ja','ko','nl','pl','ru','sv','tr','uk','vi','zh']

old1 = """badge.style.borderColor = cor === "transparent" ? "" : `${cor}30`;
}
}

atualizarBarraGlobal();
}"""

new1 = """badge.style.borderColor = cor === "transparent" ? "" : `${cor}30`;
  }

  atualizarBarraGlobal();
}"""

old2 = """if (val === 4) cor = "#16a34a";
else if (val === 3) cor = "#eab308";
else if (val === 2) cor = "#f97316";"""

new2 = """if (val === 4) cor = "#16a34a";
else if (val === 3) cor = "#eab308";
else if (val === 2) cor = "#f97316";
else cor = "#e11d48";"""

for d in dirs:
    f = os.path.join(d, 'norton.html')
    if os.path.exists(f):
        with open(f, 'r', encoding='utf-8') as fh:
            content = fh.read()
        changed = False
        if old1 in content:
            content = content.replace(old1, new1)
            changed = True
        if old2 in content:
            content = content.replace(old2, new2)
            changed = True
        if changed:
            with open(f, 'w', encoding='utf-8') as fh:
                fh.write(content)
            print(f'{d} ✓')
        else:
            print(f'{d} ✗')
