from transformers import CLIPProcessor, CLIPModel
import os

print("Attempting to load model with local_files_only=True...")
try:
    model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32", local_files_only=True)
    processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32", local_files_only=True)
    print("SUCCESS: Model loaded from local cache.")
except Exception as e:
    print(f"FAILURE: Could not load model: {e}")

print("\nAttempting to load model without local_files_only (normal mode)...")
try:
    model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
    print("SUCCESS: Model loaded normally.")
except Exception as e:
    print(f"FAILURE: Could not load model normally: {e}")
