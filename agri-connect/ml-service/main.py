from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from io import BytesIO
from PIL import Image
import numpy as np
import base64
import cv2
import uvicorn
import os
import torch
from transformers import CLIPProcessor, CLIPModel
from rembg import remove

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Preload CLIP weights
    ensure_models()
    # Warm up rembg by running a tiny pass; this may trigger model download
    img = Image.new("RGB", (16, 16), (0, 0, 0))
    try:
        _ = remove(img)
    except Exception:
        # Ignore warmup errors; real requests will be handled with proper images
        pass
    yield

app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

clip_model = None
clip_processor = None

labels = [
    "Good/Fresh",
    "Rotten/Spoiled",
    "Completely Bad/Decomposed"
]
label_prompts = [
    "a photo of fresh good quality fruit or vegetable",
    "a photo of partially spoiled or rotten fruit or vegetable",
    "a photo of completely decomposed bad fruit or vegetable"
]


def ensure_models():
    global clip_model, clip_processor
    if clip_model is None:
        clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        clip_model.eval()


def pil_to_bgr(image: Image.Image) -> np.ndarray:
    arr = np.array(image.convert("RGB"))
    return arr[:, :, ::-1].copy()


def bgr_to_png_base64(img_bgr: np.ndarray) -> str:
    success, buf = cv2.imencode(".png", img_bgr)
    if not success:
        return ""
    return base64.b64encode(buf.tobytes()).decode("utf-8")


def mask_to_png_base64(mask: np.ndarray) -> str:
    mask_u8 = (mask * 255).astype(np.uint8)
    success, buf = cv2.imencode(".png", mask_u8)
    if not success:
        return ""
    return base64.b64encode(buf.tobytes()).decode("utf-8")


def segment_foreground(image: Image.Image) -> tuple[Image.Image, np.ndarray]:
    cutout = remove(image)
    cutout_np = np.array(cutout)
    if cutout_np.shape[2] == 4:
        alpha = cutout_np[:, :, 3]
        mask = (alpha > 0).astype(np.uint8)
    else:
        mask = np.ones(cutout_np.shape[:2], dtype=np.uint8)
    return cutout.convert("RGB"), mask


def estimate_decay_ratio(img_rgb: np.ndarray, fg_mask: np.ndarray) -> float:
    """Estimate decayed-area ratio inside the foreground mask.

    Steps:
    - Denoise and morphologically clean the FG mask to remove speckles.
    - Use slightly stricter HSV thresholds to reduce lighting/background false positives.
    """
    # Normalize and clean mask (ensure 0/1 uint8)
    fg_mask = (fg_mask > 0).astype(np.uint8)
    # Convert mask to 0..255 image for morphological ops
    mask_u8 = (fg_mask * 255).astype(np.uint8)

    # Median blur to remove small speckles
    try:
        mask_u8 = cv2.medianBlur(mask_u8, 5)
    except Exception:
        # If blur fails (very small mask), skip
        pass

    # Morphological open/close to remove small holes and isolated pixels
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    mask_u8 = cv2.morphologyEx(mask_u8, cv2.MORPH_OPEN, kernel)
    mask_u8 = cv2.morphologyEx(mask_u8, cv2.MORPH_CLOSE, kernel)

    fg_mask = (mask_u8 > 0).astype(np.uint8)

    # HSV-based decay heuristics (stricter than before)
    hsv = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2HSV)
    v = hsv[:, :, 2].astype(int)
    s = hsv[:, :, 1].astype(int)
    h = hsv[:, :, 0].astype(int)

    dark = (v < 40)
    brown_like = ((h > 8) & (h < 28) & (s > 100) & (v < 100))
    mold_green = ((h > 40) & (h < 80) & (s > 80) & (v < 140))

    # Combine rules conservatively to avoid marking benign dark/background pixels
    spoiled = (brown_like | mold_green) | (dark & (s > 40))

    spoiled_fg = spoiled * fg_mask
    num_fg = int(np.sum(fg_mask > 0))
    num_spoiled = int(np.sum(spoiled_fg > 0))

    # If foreground is tiny, treat as no decay to avoid false positives on tiny crops
    if num_fg < 50:
        return 0.0

    if num_fg == 0:
        return 0.0

    return float(num_spoiled) / float(num_fg)


def clip_classify(image: Image.Image) -> dict:
    """Classify image using CLIP with simple test-time augmentation (flip + brightness tweak)

    We average logits across augmentations to reduce brittle single-image misclassifications and
    return per-augment probabilities and averaged logits for debugging/analysis.
    """
    ensure_models()

    # Build simple augmentations: original, horizontal flip, slight brightness increase
    aug_images = []
    base = image.resize((224, 224))
    aug_images.append(base)
    aug_images.append(base.transpose(Image.FLIP_LEFT_RIGHT))
    try:
        from PIL import ImageEnhance
        enhancer = ImageEnhance.Brightness(base)
        aug_images.append(enhancer.enhance(1.07))
    except Exception:
        # If ImageEnhance not available for any reason, just skip
        pass

    logits_acc = None
    per_aug_probs = []
    with torch.no_grad():
        for img in aug_images:
            try:
                inputs = clip_processor(text=label_prompts, images=img, return_tensors="pt", padding=True, truncation=True)
                outputs = clip_model(**inputs)
                # logits_per_image shape: [1, num_prompts]
                lg = outputs.logits_per_image.cpu().numpy()[0]
            except Exception as e:
                print(f"Error processing augmented image: {e}")
                lg = np.zeros(len(label_prompts), dtype=float)

            # Convert logits to softmax probs for this augmentation
            exps = np.exp(lg - np.max(lg))
            probs_aug = (exps / np.sum(exps)).astype(float)
            per_aug_probs.append({labels[i]: float(probs_aug[i]) for i in range(len(labels))})

            if logits_acc is None:
                logits_acc = lg
            else:
                logits_acc = logits_acc + lg

    if logits_acc is None:
        probs = np.ones(len(labels)) / len(labels)
        avg_logits = np.zeros(len(labels), dtype=float)
    else:
        avg_logits = (logits_acc / float(len(aug_images))).astype(float)
        exps = np.exp(avg_logits - np.max(avg_logits))
        probs = (exps / np.sum(exps)).astype(float)

    best_idx = int(np.argmax(probs))
    result = {
        "label": labels[best_idx],
        "scores": {labels[i]: float(probs[i]) for i in range(len(labels))},
        "avg_logits": [float(x) for x in avg_logits],
        "augment_probs": per_aug_probs,
        "ensemble_count": len(aug_images)
    }
    return result


def combine_quality(decay_ratio: float, cls_scores: dict) -> tuple[str, dict[str, float]]:
    """Combine the decay ratio and classifier probabilities into a final quality label.

    Approach:
    - Compute a small set of combined scores that blend CLIP softmax probabilities with the
      decay_ratio signal computed from image segmentation.
    - Use conservative blending weights so neither signal alone (unless very strong) will
      dominate and cause obvious misclassifications.
    """
    g = float(cls_scores.get("Good/Fresh", 0.0))
    r = float(cls_scores.get("Rotten/Spoiled", 0.0))
    b = float(cls_scores.get("Completely Bad/Decomposed", 0.0))

    scores = {
        "Good/Fresh": 0.0,
        "Rotten/Spoiled": 0.0,
        "Completely Bad/Decomposed": 0.0,
    }

    # Adaptive weighting
    # Case 1: AI sees clear rot/spoilage. Trust AI to catch texture/color patterns that segmentation missed.
    if r > 0.75 or b > 0.75:
        w_ai = 0.8
        w_decay = 0.2
        scores["Good/Fresh"] = w_ai * g + w_decay * (1.0 - decay_ratio)
        scores["Rotten/Spoiled"] = w_ai * r + w_decay * decay_ratio
        scores["Completely Bad/Decomposed"] = w_ai * b + w_decay * decay_ratio

    # Case 2: Low physical decay and AI is not convinced it's rotten. Trust the "clean" segmentation.
    elif decay_ratio < 0.05:
        w_ai = 0.35
        w_decay = 0.65
        scores["Good/Fresh"] = w_ai * g + w_decay * (1.0 - decay_ratio)
        scores["Rotten/Spoiled"] = w_ai * r + w_decay * decay_ratio
        scores["Completely Bad/Decomposed"] = w_ai * b + w_decay * decay_ratio

    # Case 3: Ambiguous / Normal case. Moderate blend.
    else:
        w_ai = 0.6
        w_decay = 0.4
        scores["Good/Fresh"] = w_ai * g + w_decay * (1.0 - decay_ratio)
        scores["Rotten/Spoiled"] = w_ai * r + w_decay * decay_ratio
        scores["Completely Bad/Decomposed"] = w_ai * b + w_decay * decay_ratio

    # Normalize scores to sum to 1.0 for cleaner probability output
    total_score = sum(scores.values())
    if total_score > 0:
        scores = {k: v / total_score for k, v in scores.items()}

    # Choose best label
    best_label, best_score = max(scores.items(), key=lambda kv: kv[1])

    # Safety rules to avoid over-triggering Rotten due to classifier-only signal:
    # - If decay is very low and the best score is weak, prefer Good/Fresh.
    if best_score < 0.45 and decay_ratio < 0.15:
        return "Good/Fresh", scores

    # If decay is very low but classifier is close between Good and Rotten, prefer Good
    if decay_ratio < 0.12 and (r - g) < 0.18:
        return "Good/Fresh", scores

    return best_label, scores


@app.post("/infer")
async def infer(file: UploadFile = File(...)):
    data = await file.read()
    image = Image.open(BytesIO(data)).convert("RGB")
    cutout, mask = segment_foreground(image)
    decay_ratio = estimate_decay_ratio(np.array(cutout), mask)
    cls = clip_classify(cutout)
    final_quality, final_scores = combine_quality(decay_ratio, cls.get("scores", {}))
    mask_b64 = mask_to_png_base64(mask)
    resp = {
        "decayed_area_ratio": decay_ratio,
        "vit_class": cls,
        "final_quality": final_quality,
        "final_scores": final_scores,
        "mask_png_base64": mask_b64
    }
    return JSONResponse(resp)


@app.get("/")
def root():
    return {"status": "ok"}




if __name__ == "__main__":
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run(app, host=host, port=port)
