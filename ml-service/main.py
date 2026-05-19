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
    ensure_models()
    img = Image.new("RGB", (16, 16), (0, 0, 0))
    try:
        _ = remove(img)
    except Exception:
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

# ----------------------------------------------------------------------
# Output labels (simple, user-friendly)
# ----------------------------------------------------------------------
LABEL_FRESH = "Fresh"
LABEL_GOOD  = "Good"
LABEL_ROTTEN = "Rotten"

labels = [LABEL_FRESH, LABEL_GOOD, LABEL_ROTTEN]

# Rich, disambiguating prompts that work well with CLIP
label_prompts = [
    (
        "a close-up photo of vibrant, firm, perfectly fresh fruit or vegetable "
        "with bright uniform colour, smooth unblemished skin, turgid and crisp texture, "
        "clearly healthy produce — fresh tomato, fresh apple, fresh mango, fresh capsicum"
    ),
    (
        "a photo of fruit or vegetable that is starting to go bad — soft spots, "
        "slight shriveling, minor colour loss, small surface blemishes, "
        "partially edible but clearly not fresh — aging banana, bruised apple"
    ),
    (
        "a photo of completely rotten, heavily decayed, decomposed fruit or vegetable — "
        "mushy, moldy, foul-colored, sunken, leaking fluid, "
        "covered in mold or fungus, clearly spoiled and inedible — "
        "rotten tomato, moldy orange, decomposing mango"
    ),
]


def ensure_models():
    global clip_model, clip_processor
    if clip_model is None:
        model_name = "openai/clip-vit-base-patch32"
        try:
            print(f"Loading model {model_name}...")
            clip_model = CLIPModel.from_pretrained(model_name)
            clip_processor = CLIPProcessor.from_pretrained(model_name)
            print("Model loaded successfully.")
        except (OSError, RuntimeError) as e:
            print(f"Failed to load model normally: {e}")
            print("Attempting local cache...")
            try:
                clip_model = CLIPModel.from_pretrained(model_name, local_files_only=True)
                clip_processor = CLIPProcessor.from_pretrained(model_name, local_files_only=True)
                print("Model loaded from local cache.")
            except Exception as e2:
                print(f"CRITICAL: Could not load model: {e2}")
                raise e2

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
    """Estimate the fraction of foreground pixels that show clear signs of decay.

    Key improvements over the previous version:
    - Removed the bare `dark` pixel rule — dark seeds, stems, and natural crop
      skin cause huge false-positive decay ratios on fresh produce.
    - `brown_like` threshold is now stricter (higher saturation requirement).
    - `mold_green` is stricter (higher saturation, requires high value to
      distinguish mold from healthy leaf/skin greens).
    - Both rules require **both** colour channels to agree, so normal shadows
      or naturally pigmented skin do not get flagged.
    - A minimum foreground pixel requirement avoids false positives on tiny images.
    """
    fg_mask = (fg_mask > 0).astype(np.uint8)
    mask_u8 = (fg_mask * 255).astype(np.uint8)

    # Morphological cleanup to remove camera noise / rembg artefacts
    try:
        mask_u8 = cv2.medianBlur(mask_u8, 5)
    except Exception:
        pass

    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    mask_u8 = cv2.morphologyEx(mask_u8, cv2.MORPH_OPEN, kernel)
    mask_u8 = cv2.morphologyEx(mask_u8, cv2.MORPH_CLOSE, kernel)
    fg_mask = (mask_u8 > 0).astype(np.uint8)

    hsv = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2HSV)
    v = hsv[:, :, 2].astype(int)
    s = hsv[:, :, 1].astype(int)
    h = hsv[:, :, 0].astype(int)

    # ----- Decay signals (all require high saturation to avoid false positives) -----

    # Brown / mushy rot: warm hues + very high saturation + mid-dark value
    # (Normal healthy dark-red crops like brinjal / tomato have lower saturation
    # in the problematic range, so raising the bar to s > 140 helps avoid them.)
    brown_rot = (h > 8) & (h < 25) & (s > 140) & (v > 30) & (v < 90)

    # Fuzzy mold: yellow-green hues typical of Botrytis / Penicillium
    # Only flag when saturation AND value are both high (true mold bloom, not leaf skin)
    mold_green = (h > 38) & (h < 78) & (s > 120) & (v > 80) & (v < 160)

    # True black rot (very dark + saturated warm hue — not just shadow)
    black_rot = (v < 25) & (s > 60) & ((h < 20) | (h > 160))

    # Combined decay mask — pixel must satisfy at least one strong decay criterion
    spoiled = brown_rot | mold_green | black_rot

    spoiled_fg = spoiled * fg_mask
    num_fg = int(np.sum(fg_mask > 0))
    num_spoiled = int(np.sum(spoiled_fg > 0))

    # Ignore if foreground region is too small (avoids noise-driven false positives)
    if num_fg < 200:
        return 0.0

    return float(num_spoiled) / float(num_fg)


def clip_classify(image: Image.Image) -> dict:
    """Classify image with CLIP + test-time augmentation (TTA).

    Uses 4 augmentations: original, H-flip, brightness boost, slight crop
    to reduce single-image CLIP sensitivity.
    """
    ensure_models()

    base = image.resize((224, 224))
    aug_images = [base, base.transpose(Image.FLIP_LEFT_RIGHT)]

    try:
        from PIL import ImageEnhance
        aug_images.append(ImageEnhance.Brightness(base).enhance(1.10))
        aug_images.append(ImageEnhance.Contrast(base).enhance(1.08))
    except Exception:
        pass

    logits_acc = None
    per_aug_probs = []

    with torch.no_grad():
        for img in aug_images:
            try:
                inputs = clip_processor(
                    text=label_prompts,
                    images=img,
                    return_tensors="pt",
                    padding=True,
                    truncation=True,
                )
                outputs = clip_model(**inputs)
                lg = outputs.logits_per_image.cpu().numpy()[0]
            except Exception as e:
                print(f"CLIP augment error: {e}")
                lg = np.zeros(len(label_prompts), dtype=float)

            exps = np.exp(lg - np.max(lg))
            probs_aug = (exps / np.sum(exps)).astype(float)
            per_aug_probs.append({labels[i]: float(probs_aug[i]) for i in range(len(labels))})

            logits_acc = lg if logits_acc is None else logits_acc + lg

    if logits_acc is None:
        probs = np.ones(len(labels)) / len(labels)
        avg_logits = np.zeros(len(labels), dtype=float)
    else:
        avg_logits = (logits_acc / float(len(aug_images))).astype(float)
        exps = np.exp(avg_logits - np.max(avg_logits))
        probs = (exps / np.sum(exps)).astype(float)

    best_idx = int(np.argmax(probs))
    return {
        "label": labels[best_idx],
        "scores": {labels[i]: float(probs[i]) for i in range(len(labels))},
        "avg_logits": [float(x) for x in avg_logits],
        "augment_probs": per_aug_probs,
        "ensemble_count": len(aug_images),
    }


def combine_quality(decay_ratio: float, cls_scores: dict) -> tuple[str, dict[str, float]]:
    """Combine CLIP classification scores with the HSV decay ratio.

    Key design principles (v3 — fixes rotten-shown-as-fresh bug):
    1. CLIP is the PRIMARY signal for both Fresh AND Rotten.
    2. The decay ratio is a *supporting* booster for rotten — it can push a
       borderline rotten case over the threshold, but it can NOT reverse a
       strong CLIP rotten prediction to Fresh.
    3. The previous safety rule "decay < 0.20 → never Rotten" was too aggressive
       and was masked rotten produce that had low HSV decay scores. Removed.
    4. Fresh wins ONLY when CLIP is clearly saying Fresh AND decay is very low.
    """
    f = float(cls_scores.get(LABEL_FRESH,  0.0))
    g = float(cls_scores.get(LABEL_GOOD,   0.0))
    r = float(cls_scores.get(LABEL_ROTTEN, 0.0))

    # ------------------------------------------------------------------
    # Fast path A: CLIP strongly says Rotten → always trust it
    # (decay ratio does not override a strong CLIP rotten prediction)
    # ------------------------------------------------------------------
    if r > 0.50:
        return LABEL_ROTTEN, {LABEL_FRESH: f, LABEL_GOOD: g, LABEL_ROTTEN: r}

    # ------------------------------------------------------------------
    # Fast path B: CLIP strongly says Fresh AND almost zero physical decay
    # → trust the fresh prediction
    # ------------------------------------------------------------------
    if f > 0.60 and decay_ratio < 0.25:
        return LABEL_FRESH, {LABEL_FRESH: f, LABEL_GOOD: g, LABEL_ROTTEN: r}

    # ------------------------------------------------------------------
    # Fast path C: CLIP strongly says Fresh BUT high physical decay detected
    # → the visual model may be fooled; hedge toward Good/Rotten
    # ------------------------------------------------------------------
    if f > 0.60 and decay_ratio >= 0.25:
        scores = {
            LABEL_FRESH:  f * 0.5,
            LABEL_GOOD:   g + f * 0.3,
            LABEL_ROTTEN: r + f * 0.2 + decay_ratio * 0.3,
        }

    # ------------------------------------------------------------------
    # Normal blended case: no strong single signal
    # Blend CLIP (65%) with physical decay ratio signal (35%)
    # ------------------------------------------------------------------
    else:
        w_clip  = 0.65
        w_decay = 0.35

        # decay_ratio → rotten probability (linear up to 0.5 decay = full rotten)
        decay_rotten_p = min(decay_ratio * 2.0, 1.0)
        decay_fresh_p  = max(1.0 - decay_ratio * 2.5, 0.0)
        decay_good_p   = max(1.0 - abs(decay_ratio - 0.2) * 4.0, 0.0)

        scores = {
            LABEL_FRESH:  w_clip * f + w_decay * decay_fresh_p,
            LABEL_GOOD:   w_clip * g + w_decay * decay_good_p,
            LABEL_ROTTEN: w_clip * r + w_decay * decay_rotten_p,
        }

    # Normalise
    total = sum(scores.values())
    if total > 0:
        scores = {k: v / total for k, v in scores.items()}

    best_label = max(scores, key=lambda k: scores[k])
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
        "mask_png_base64": mask_b64,
    }
    return JSONResponse(resp)


@app.get("/")
def root():
    return {"status": "ok"}


if __name__ == "__main__":
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run(app, host=host, port=port)
