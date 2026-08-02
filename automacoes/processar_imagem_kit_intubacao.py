"""Recorta um frasco/ampola e exporta um WebP RGBA de 225 x 370 px.

O processamento foi pensado para fotografias de produto sobre fundo uniforme.
Ele não recria nem altera o rótulo do medicamento.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps


CANVAS_SIZE = (225, 370)
CONTENT_SIZE = (205, 350)


def parse_roi(value: str) -> tuple[int, int, int, int]:
    parts = [int(part.strip()) for part in value.split(",")]
    if len(parts) != 4:
        raise argparse.ArgumentTypeError("Use x,y,largura,altura")
    return tuple(parts)  # type: ignore[return-value]


def parse_polygon(value: str) -> list[tuple[int, int]]:
    try:
        points = [
            tuple(int(coordinate.strip()) for coordinate in point.split(","))
            for point in value.split(";")
        ]
    except ValueError as error:
        raise argparse.ArgumentTypeError("Use x,y;x,y;x,y") from error
    if len(points) < 3 or any(len(point) != 2 for point in points):
        raise argparse.ArgumentTypeError("Use ao menos três pontos: x,y;x,y;x,y")
    return points  # type: ignore[return-value]


def estimate_background(rgb: np.ndarray) -> np.ndarray:
    border = np.concatenate(
        (rgb[0, :, :], rgb[-1, :, :], rgb[:, 0, :], rgb[:, -1, :]), axis=0
    )
    return np.median(border.astype(np.float32), axis=0)


def create_silhouette(
    rgb: np.ndarray, foreground_rect: tuple[int, int, int, int] | None = None
) -> np.ndarray:
    height, width = rgb.shape[:2]
    background = estimate_background(rgb)
    distance = np.linalg.norm(rgb.astype(np.float32) - background, axis=2)

    mask = np.full((height, width), cv2.GC_PR_BGD, dtype=np.uint8)
    border_size = max(2, min(height, width) // 80)
    mask[:border_size, :] = cv2.GC_BGD
    mask[-border_size:, :] = cv2.GC_BGD
    mask[:, :border_size] = cv2.GC_BGD
    mask[:, -border_size:] = cv2.GC_BGD
    mask[distance > 14] = cv2.GC_PR_FGD
    mask[distance > 48] = cv2.GC_FGD

    # Mantém o fundo conhecido nas bordas mesmo quando há compressão JPEG.
    mask[:border_size, :] = cv2.GC_BGD
    mask[-border_size:, :] = cv2.GC_BGD
    mask[:, :border_size] = cv2.GC_BGD
    mask[:, -border_size:] = cv2.GC_BGD

    bg_model = np.zeros((1, 65), dtype=np.float64)
    fg_model = np.zeros((1, 65), dtype=np.float64)
    if foreground_rect:
        rect_mask = np.zeros((height, width), dtype=np.uint8)
        cv2.grabCut(
            rgb,
            rect_mask,
            foreground_rect,
            bg_model,
            fg_model,
            8,
            cv2.GC_INIT_WITH_RECT,
        )
        mask = rect_mask
    else:
        cv2.grabCut(rgb, mask, None, bg_model, fg_model, 5, cv2.GC_INIT_WITH_MASK)
    foreground = np.where(
        (mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0
    ).astype(np.uint8)

    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    foreground = cv2.morphologyEx(foreground, cv2.MORPH_CLOSE, kernel, iterations=2)

    count, labels, stats, centroids = cv2.connectedComponentsWithStats(foreground)
    if count <= 1:
        raise ValueError("Não foi possível separar o produto do fundo")

    image_area = height * width
    center_x = width / 2
    candidates: list[int] = []
    for label in range(1, count):
        x, y, component_width, component_height, area = stats[label]
        component_center_x = centroids[label][0]
        if area < image_area * 0.0004:
            continue
        if abs(component_center_x - center_x) > width * 0.43:
            continue
        if x <= border_size or y <= border_size:
            continue
        if x + component_width >= width - border_size:
            continue
        candidates.append(label)

    if not candidates:
        candidates = [1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))]

    selected = np.isin(labels, candidates).astype(np.uint8) * 255
    contours, _ = cv2.findContours(selected, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contours = [contour for contour in contours if cv2.contourArea(contour) >= image_area * 0.0004]
    if not contours:
        raise ValueError("Máscara do produto ficou vazia")

    # Preenche o interior dos contornos para preservar vidro e rótulos claros,
    # sem criar os triângulos externos que um casco convexo causaria nas ampolas.
    silhouette = np.zeros_like(selected)
    cv2.drawContours(silhouette, contours, -1, 255, thickness=cv2.FILLED)
    silhouette = cv2.GaussianBlur(silhouette, (0, 0), sigmaX=0.65, sigmaY=0.65)
    silhouette[silhouette < 3] = 0
    return silhouette


def process_image(
    source: Path,
    destination: Path,
    roi: tuple[int, int, int, int] | None,
    foreground_rect: tuple[int, int, int, int] | None,
    rotate: int,
    polygon: list[tuple[int, int]] | None,
    polygon_only: bool,
) -> None:
    with Image.open(source) as opened:
        image = ImageOps.exif_transpose(opened).convert("RGBA")

    if roi:
        x, y, width, height = roi
        image = image.crop((x, y, x + width, y + height))

    if rotate:
        image = image.rotate(rotate, expand=True)

    rgba = np.asarray(image)
    source_alpha = rgba[:, :, 3]
    if polygon:
        polygon_mask = Image.new("L", image.size, 0)
        ImageDraw.Draw(polygon_mask).polygon(polygon, fill=255)
        polygon_alpha = np.asarray(polygon_mask.filter(ImageFilter.GaussianBlur(0.8)))
        if polygon_only:
            alpha = polygon_alpha
        else:
            automatic_alpha = create_silhouette(rgba[:, :, :3], foreground_rect)
            alpha = np.minimum(automatic_alpha, polygon_alpha)
    elif source_alpha.min() == 0 and np.count_nonzero(source_alpha < 250) > 20:
        alpha = source_alpha
    else:
        alpha = create_silhouette(rgba[:, :, :3], foreground_rect)

    visible = cv2.findNonZero((alpha > 8).astype(np.uint8))
    if visible is None:
        raise ValueError(f"Nenhum produto visível em {source}")
    x, y, width, height = cv2.boundingRect(visible)
    pad = max(2, round(max(width, height) * 0.01))
    left = max(0, x - pad)
    top = max(0, y - pad)
    right = min(image.width, x + width + pad)
    bottom = min(image.height, y + height + pad)

    cutout_array = rgba.copy()
    cutout_array[:, :, 3] = alpha
    cutout = Image.fromarray(cutout_array, "RGBA").crop((left, top, right, bottom))
    cutout.thumbnail(CONTENT_SIZE, Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    offset = (
        (CANVAS_SIZE[0] - cutout.width) // 2,
        (CANVAS_SIZE[1] - cutout.height) // 2,
    )
    canvas.alpha_composite(cutout, offset)

    destination.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(destination, "WEBP", lossless=True, method=6, exact=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--roi", type=parse_roi, help="Recorte opcional: x,y,largura,altura")
    parser.add_argument(
        "--foreground-rect",
        type=parse_roi,
        help="Retângulo inicial do produto para fundos não uniformes",
    )
    parser.add_argument("--rotate", type=int, default=0)
    parser.add_argument("--polygon", type=parse_polygon)
    parser.add_argument("--polygon-only", action="store_true")
    args = parser.parse_args()
    process_image(
        args.input,
        args.output,
        args.roi,
        args.foreground_rect,
        args.rotate,
        args.polygon,
        args.polygon_only,
    )


if __name__ == "__main__":
    main()
