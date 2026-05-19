import os
import google.generativeai as genai

api_key = os.getenv("GEMINI_API_KEY", "AIzaSyDwvO8HzQEOfb9ZP0pYyPLiWO4M6UnBzc8")
genai.configure(api_key=api_key)

try:
    print("Listing models...")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name}")
except Exception as e:
    print(f"Error: {e}")
