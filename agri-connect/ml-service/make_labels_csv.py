import argparse
import csv
import os
from typing import Dict, List
VALID_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
DEFAULT_MAP = {
    "Good": "Good/Fresh",
    "Rotten": "Rotten/Spoiled",
    "Bad": "Completely Bad/Decomposed",
}


def build_map(pairs: List[str]) -> Dict[str, str]:
    mapping = dict(DEFAULT_MAP)
    for p in pairs:
        if "=" not in p:
            raise ValueError(f"Invalid --map entry: {p}. Format: FOLDER=LABEL")
        folder, label = p.split("=", 1)
        folder = folder.strip()
        label = label.strip()
        if not folder or not label:
            raise ValueError(f"Invalid --map entry: {p}")
        mapping[folder] = label
    return mapping


def main():
    parser = argparse.ArgumentParser(description="Create a labels CSV from a class-structured image directory")
    parser.add_argument("root", help="Root directory containing class subfolders")
    parser.add_argument("--out", default="labels.csv", help="Output CSV path")
    parser.add_argument("--map", nargs="*", default=[], help="Override folder-to-label mapping. Example: --map Good=Good/Fresh Rotten=Rotten/Spoiled Bad=Completely Bad/Decomposed")
    args = parser.parse_args()

    mapping = build_map(args.map)

    rows = []
    for folder, label in mapping.items():
        dir_path = os.path.join(args.root, folder)
        if not os.path.isdir(dir_path):
            print(f"[WARN] Skipping missing folder: {dir_path}")
            continue
        for root, _, files in os.walk(dir_path):
            for f in files:
                ext = os.path.splitext(f)[1].lower()
                if ext in VALID_EXTS:
                    img_path = os.path.join(root, f)
                    rows.append((os.path.relpath(img_path, start=os.path.dirname(os.path.abspath(args.out))), label))

    if not rows:
        raise SystemExit("No images found. Check your directory structure and --map.")

    os.makedirs(os.path.dirname(os.path.abspath(args.out)) or ".", exist_ok=True)
    with open(args.out, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["image_path", "label"])
        w.writerows(rows)

    print(f"Wrote {len(rows)} rows to {args.out}")


if __name__ == "__main__":
    main()
