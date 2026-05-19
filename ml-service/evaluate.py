import argparse
import json
import os
from typing import List

import numpy as np
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, classification_report, confusion_matrix
import matplotlib.pyplot as plt
import pandas as pd

# Import the inference helpers from the existing service
from main import ensure_models, segment_foreground, estimate_decay_ratio, clip_classify, combine_quality
from PIL import Image

CLASSES: List[str] = [
    "Good/Fresh",
    "Rotten/Spoiled",
    "Completely Bad/Decomposed",
]


def predict_label_full(image_path: str) -> str:
    img = Image.open(image_path).convert("RGB")
    cutout, mask = segment_foreground(img)
    decay_ratio = estimate_decay_ratio(np.array(cutout), mask)
    cls = clip_classify(cutout)
    final_quality = combine_quality(decay_ratio, cls["label"])
    return final_quality


def predict_label_simple(image_path: str) -> str:
    """Predict using only segmentation + HSV heuristic thresholds (no CLIP)."""
    img = Image.open(image_path).convert("RGB")
    cutout, mask = segment_foreground(img)
    decay_ratio = estimate_decay_ratio(np.array(cutout), mask)
    # Map decay to class without CLIP
    if decay_ratio >= 0.5:
        return "Completely Bad/Decomposed"
    if decay_ratio >= 0.15:
        return "Rotten/Spoiled"
    return "Good/Fresh"


def plot_confusion_matrix(cm: np.ndarray, classes: List[str], out_path: str) -> None:
    fig, ax = plt.subplots(figsize=(6, 5))
    im = ax.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
    ax.figure.colorbar(im, ax=ax)

    ax.set(xticks=np.arange(cm.shape[1]),
           yticks=np.arange(cm.shape[0]),
           xticklabels=classes, yticklabels=classes,
           ylabel='True label',
           xlabel='Predicted label',
           title='Confusion Matrix')

    plt.setp(ax.get_xticklabels(), rotation=30, ha="right",
             rotation_mode="anchor")

    thresh = cm.max() / 2.0 if cm.max() else 0.5
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            ax.text(j, i, format(cm[i, j], 'd'),
                    ha="center", va="center",
                    color="white" if cm[i, j] > thresh else "black")

    fig.tight_layout()
    plt.savefig(out_path, bbox_inches='tight')
    plt.close(fig)


def main():
    parser = argparse.ArgumentParser(description="Evaluate CLIP-based quality classifier on a labeled dataset CSV")
    parser.add_argument("--csv", required=True, help="Path to CSV with columns: image_path,label")
    parser.add_argument("--image-col", default="image_path", help="CSV column for image paths")
    parser.add_argument("--label-col", default="label", help="CSV column for ground-truth labels")
    parser.add_argument("--out-dir", default="evaluation_out", help="Directory to write metrics and confusion matrix")
    parser.add_argument("--mode", choices=["full", "simple"], default="full", help="Evaluation mode: 'full' uses CLIP+heuristic; 'simple' uses heuristic only (no transformers)")
    args = parser.parse_args()

    os.makedirs(args.out_dir, exist_ok=True)

    # In full mode ensure models are loaded once
    if args.mode == "full":
        ensure_models()

    df = pd.read_csv(args.csv)
    if args.image_col not in df.columns or args.label_col not in df.columns:
        raise ValueError(f"CSV must contain '{args.image_col}' and '{args.label_col}' columns")

    y_true: List[str] = []
    y_pred: List[str] = []

    for idx, row in df.iterrows():
        img_path = row[args.image_col]
        label = str(row[args.label_col])

        if not os.path.isabs(img_path):
            img_path = os.path.join(os.path.dirname(args.csv), img_path)
        if not os.path.exists(img_path):
            print(f"[WARN] Image not found, skipping: {img_path}")
            continue

        try:
            if args.mode == "full":
                pred = predict_label_full(img_path)
            else:
                pred = predict_label_simple(img_path)
        except Exception as e:
            print(f"[ERROR] Failed on {img_path}: {e}")
            continue

        y_true.append(label)
        y_pred.append(pred)

    if not y_true:
        raise RuntimeError("No valid samples evaluated. Check CSV paths and labels.")

    # Align labels to known classes if possible; otherwise use sorted unique labels
    classes = CLASSES if set(y_true).issubset(set(CLASSES)) else sorted(list(set(y_true + y_pred)))

    # Compute metrics
    acc = accuracy_score(y_true, y_pred)
    precision, recall, f1, support = precision_recall_fscore_support(
        y_true, y_pred, labels=classes, average=None, zero_division=0
    )
    precision_macro, recall_macro, f1_macro, _ = precision_recall_fscore_support(
        y_true, y_pred, average='macro', zero_division=0
    )
    precision_micro, recall_micro, f1_micro, _ = precision_recall_fscore_support(
        y_true, y_pred, average='micro', zero_division=0
    )

    cm = confusion_matrix(y_true, y_pred, labels=classes)

    # Save confusion matrix plot
    cm_path = os.path.join(args.out_dir, "confusion_matrix.png")
    plot_confusion_matrix(cm, classes, cm_path)

    # Save metrics JSON
    per_class = {}
    for i, cls in enumerate(classes):
        per_class[cls] = {
            "precision": float(precision[i]),
            "recall": float(recall[i]),
            "f1": float(f1[i]),
            "support": int(support[i]),
        }

    report = {
        "overall": {
            "accuracy": float(acc),
            "precision_macro": float(precision_macro),
            "recall_macro": float(recall_macro),
            "f1_macro": float(f1_macro),
            "precision_micro": float(precision_micro),
            "recall_micro": float(recall_micro),
            "f1_micro": float(f1_micro),
            "num_samples": int(len(y_true)),
            "classes": classes,
        },
        "per_class": per_class,
        "confusion_matrix_counts": cm.tolist(),
        "confusion_matrix_png": os.path.basename(cm_path),
    }

    with open(os.path.join(args.out_dir, "metrics.json"), "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    # Also print a brief text report
    print(json.dumps(report["overall"], indent=2))
    print("Saved:", cm_path, os.path.join(args.out_dir, "metrics.json"))


if __name__ == "__main__":
    main()
