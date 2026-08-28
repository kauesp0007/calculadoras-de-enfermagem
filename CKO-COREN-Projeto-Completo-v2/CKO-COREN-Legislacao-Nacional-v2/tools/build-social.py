#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""tools/build-social.py — executor do media-projection-engine (N-025).

Le generated/media-specs.json e desenha cada peca de forma DETERMINISTICA
(composicao vetorial simples, sem modelo generativo). Registra versoes,
input_hash, output_hash e lineage por artefato.
"""
import json, hashlib, pathlib, textwrap

from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "generated/social"
NOW = "2026-08-26T12:00:00Z"
ENGINE = "media-projection-engine@1.0.0"
MODEL = "cko-coren-flat-card@1.0.0"

FONT_DIRS = ["/usr/share/fonts/truetype/dejavu"]


def font(size, bold=False):
    name = "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"
    for d in FONT_DIRS:
        p = pathlib.Path(d) / name
        if p.exists():
            return ImageFont.truetype(str(p), size)
    return ImageFont.load_default()


def hexrgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def gradient(w, h, c1, c2):
    base = Image.new("RGB", (w, h), c1)
    top, bot = hexrgb(c1), hexrgb(c2)
    d = ImageDraw.Draw(base)
    for y in range(h):
        t = y / max(h - 1, 1)
        d.line([(0, y), (w, y)], fill=tuple(int(top[i] + (bot[i] - top[i]) * t) for i in range(3)))
    return base


def wrap(draw, text, f, max_w, max_lines):
    if not text:
        return []
    words, lines, cur = text.split(), [], ""
    for wd in words:
        trial = (cur + " " + wd).strip()
        if draw.textlength(trial, font=f) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = wd
        if len(lines) == max_lines:
            break
    if cur and len(lines) < max_lines:
        lines.append(cur)
    if len(lines) == max_lines and len(" ".join(lines)) < len(text):
        lines[-1] = lines[-1].rstrip(" ,.;:") + "…"
    return lines


def draw_card(spec):
    w, h = spec["width"], spec["height"]
    pal = spec["palette"]
    img = gradient(w, h, pal["bg_from"], pal["bg_to"])
    d = ImageDraw.Draw(img)
    scale = w / 1200.0
    pad = int(72 * scale)
    inner = w - 2 * pad

    # faixa de identidade
    d.rectangle([0, 0, w, int(10 * scale)], fill=hexrgb("#2563EB"))

    y = pad
    f_kick = font(int(26 * scale), True)
    d.text((pad, y), spec["fields"]["kicker"].upper(), font=f_kick, fill=hexrgb(pal["muted"]))
    y += int(52 * scale)

    f_title = font(int(60 * scale), True)
    for line in wrap(d, spec["fields"]["title"], f_title, inner, 3):
        d.text((pad, y), line, font=f_title, fill=hexrgb(pal["fg"]))
        y += int(70 * scale)

    y += int(12 * scale)
    f_sub = font(int(34 * scale))
    for line in wrap(d, spec["fields"]["subtitle"], f_sub, inner, 3):
        d.text((pad, y), line, font=f_sub, fill=hexrgb(pal["muted"]))
        y += int(44 * scale)

    if spec["fields"].get("summary"):
        y += int(16 * scale)
        f_sum = font(int(26 * scale))
        for line in wrap(d, spec["fields"]["summary"], f_sum, inner, 4):
            d.text((pad, y), line, font=f_sum, fill=hexrgb("#CBD9F2"))
            y += int(34 * scale)

    f_foot = font(int(24 * scale), True)
    fy = h - pad - int(24 * scale)
    d.line([(pad, fy - int(20 * scale)), (w - pad, fy - int(20 * scale))], fill=hexrgb("#3B6CB0"), width=2)
    d.text((pad, fy), spec["fields"]["footer_left"], font=f_foot, fill=hexrgb(pal["muted"]))
    right = spec["fields"]["footer_right"]
    d.text((w - pad - d.textlength(right, font=f_foot), fy), right, font=f_foot, fill=hexrgb(pal["muted"]))
    return img


def canonical_hash(canonical_id: str) -> str:
    """Mesmo hash que tools/build.mjs calcula (paridade com JSON.stringify)."""
    for f in (ROOT / "canonical/acts").glob("*.json"):
        obj = json.loads(f.read_text(encoding="utf-8"))
        if obj.get("canonical_id") == canonical_id:
            return hashlib.sha256(
                json.dumps(obj, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
            ).hexdigest()
    raise KeyError(f"canônico não encontrado para {canonical_id}")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("*.png"):
        old.unlink()

    doc = json.loads((ROOT / "generated/media-specs.json").read_text(encoding="utf-8"))
    specs = doc["specs"]
    index_specs = doc.get("index_specs", [])
    lineage, rows, index_rows = [], [], []
    for spec in specs:
        img = draw_card(spec)
        dst = ROOT / spec["output"]
        dst.parent.mkdir(parents=True, exist_ok=True)
        img.save(dst, "PNG", optimize=True)
        raw = dst.read_bytes()
        out_hash = hashlib.sha256(raw).hexdigest()
        rows.append({"projection_id": spec["projection_id"], "canonical_id": spec["canonical_id"],
                     "output": spec["output"], "width": spec["width"], "height": spec["height"],
                     "sha256": out_hash, "bytes": len(raw)})
        lineage.append({
            "lineage_id": f'LIN-{spec["canonical_id"]}-{spec["projection_id"].replace("/", "-")}',
            "canonical_id": spec["canonical_id"], "projection_id": spec["projection_id"], "surface": "social",
            "versions": {"schema": "2.0.0", "content": "1.0.0", "engine": ENGINE,
                         "validator": "projection-validator@1.0.0",
                         "renderer": "social-renderer@1.0.0", "template": spec["template_version"],
                         "media_model": MODEL},
            "inputs": {"canonical_sha256": canonical_hash(spec["canonical_id"]),
                       "evidence_source_refs": [], "evidence_fragment_refs": [],
                       "intermediate_sha256": spec["input_hash"],
                       "deterministic": True, "generative_model_used": False},
            "output": {"path": spec["output"], "sha256": out_hash, "byte_length": len(raw),
                       "mime_type": "image/png"},
            "assurance_ref": "CKO-COREN-ASSURANCE-v2", "generated_at": NOW,
        })

    # Cartões OG das páginas de índice: não derivam de um canônico, então têm
    # registro próprio em vez de um lineage de projeção com canonical_id falso.
    for spec in index_specs:
        img = draw_card(spec)
        dst = ROOT / spec["output"]
        dst.parent.mkdir(parents=True, exist_ok=True)
        img.save(dst, "PNG", optimize=True)
        raw = dst.read_bytes()
        index_rows.append({
            "spec_id": spec["spec_id"], "output": spec["output"],
            "width": spec["width"], "height": spec["height"],
            "engine": spec["engine"], "media_model": spec["media_model"],
            "template_version": spec["template_version"],
            "input_hash": spec["input_hash"], "sha256": hashlib.sha256(raw).hexdigest(),
            "byte_length": len(raw), "deterministic": True, "generative_model_used": False,
            "derived_from": "registry/regional-councils.registry.json",
        })

    (ROOT / "generated/social-lineage.json").write_text(
        json.dumps({"generated_at": NOW, "engine": ENGINE, "media_model": MODEL,
                    "artifacts": lineage, "index_artifacts": index_rows},
                   ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"images": len(rows), "index_images": len(index_rows)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
