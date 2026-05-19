const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: './src/services/../config' }); // Adjust path if needed, or just hardcode for test

const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyDwvO8HzQEOfb9ZP0pYyPLiWO4M6UnBzc8';
const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        // For now, there isn't a direct listModels method in the high-level SDK easily accessible for simple script 
        // without looking up the exact manager usage. 
        // Actually, the SDK doesn't expose listModels on the main class easily in all versions.
        // Let's try a simple generation with "gemini-pro" again but print more info if possible, 
        // OR just try "gemini-1.0-pro" which sometimes helps.

        // However, the error message suggested calling ListModels. 
        // The SDK exports a ModelManager? No, it's usually internal or on a specific helper.
        // Let's rely on standard names. 

        // Let's try 'gemini-1.0-pro' as a fallback, and 'gemini-1.5-pro-latest' etc.
        // But to be sure, let's try a direct REST call to list models using axios to see what's there.
        // That's more reliable than guessing SDK methods.

        const axios = require('axios');
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

        const response = await axios.get(url);
        const fs = require('fs');
        const models = response.data.models.filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
            .map(m => m.name);
        fs.writeFileSync('models.json', JSON.stringify(models, null, 2));
        console.log("Models written to models.json");

    } catch (error) {
        console.error("Error listing models:", error.response ? error.response.data : error.message);
    }
}

listModels();
