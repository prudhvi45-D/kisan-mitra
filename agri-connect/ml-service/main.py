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

app = FastAPI()
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
    hsv = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2HSV)
    v = hsv[:, :, 2]
    s = hsv[:, :, 1]
    h = hsv[:, :, 0]
    dark = (v < 60)
    brown_like = ((h > 5) & (h < 25) & (s > 80) & (v < 120))
    mold_green = ((h > 35) & (h < 85) & (s > 60) & (v < 160))
    spoiled = (dark | brown_like | mold_green).astype(np.uint8)
    spoiled_fg = spoiled * (fg_mask.astype(np.uint8))
    num_fg = int(np.sum(fg_mask > 0))
    num_spoiled = int(np.sum(spoiled_fg > 0))
    if num_fg == 0:
        return 0.0
    return float(num_spoiled) / float(num_fg)


def clip_classify(image: Image.Image) -> dict:
    ensure_models()
    # Run each prompt separately to avoid any tokenizer padding edge cases
    logits_list = []
    with torch.no_grad():
        for prompt in label_prompts:
            inputs = clip_processor(text=[prompt], images=image, return_tensors="pt", padding=True, truncation=True)
            outputs = clip_model(**inputs)
            # logits_per_image shape: [1, 1]
            logits_list.append(outputs.logits_per_image[0, 0].unsqueeze(0))
        logits = torch.stack(logits_list, dim=1)  # [1, num_labels]
        probs = torch.softmax(logits, dim=1).cpu().numpy()[0]
    best_idx = int(np.argmax(probs))
    result = {
        "label": labels[best_idx],
        "scores": {labels[i]: float(probs[i]) for i in range(len(labels))}
    }
    return result


def combine_quality(decay_ratio: float, cls_label: str) -> str:
    if decay_ratio >= 0.5 or cls_label == "Completely Bad/Decomposed":
        return "Completely Bad/Decomposed"
    if decay_ratio >= 0.15 or cls_label == "Rotten/Spoiled":
        return "Rotten/Spoiled"
    return "Good/Fresh"


@app.post("/infer")
async def infer(file: UploadFile = File(...)):
    data = await file.read()
    image = Image.open(BytesIO(data)).convert("RGB")
    cutout, mask = segment_foreground(image)
    decay_ratio = estimate_decay_ratio(np.array(cutout), mask)
    cls = clip_classify(cutout)
    final_quality = combine_quality(decay_ratio, cls["label"])
    mask_b64 = mask_to_png_base64(mask)
    resp = {
        "decayed_area_ratio": decay_ratio,
        "vit_class": cls,
        "final_quality": final_quality,
        "mask_png_base64": mask_b64
    }
    return JSONResponse(resp)


@app.get("/")
def root():
    return {"status": "ok"}


@app.on_event("startup")
def _warmup():
    # Preload CLIP weights
    ensure_models()
    # Warm up rembg by running a tiny pass; this may trigger model download
    img = Image.new("RGB", (16, 16), (0, 0, 0))
    try:
        _ = remove(img)
    except Exception:
        # Ignore warmup errors; real requests will be handled with proper images
        pass


if __name__ == "__main__":
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run(app, host=host, port=port)
