
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyBj-QTlOWo1iurG5CArOX9DOFQDDdRsAhc";

async function listModels() {
    console.log("Listing models for API Key...");
    try {
        // Note: The Node SDK might not expose listModels directly easily on the instance, 
        // but let's try a direct fetch using the key if SDK fails, or standard SDK method if available.
        // Actually the SDK doesn't always make listModels easy on the generic client.
        // Let's try `gemini-pro` as a fallback test first.

        const genAI = new GoogleGenerativeAI(API_KEY);
        // Fallback test
        console.log("Testing fallback model 'gemini-pro'...");
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Test");
        console.log("Gemini-Pro Success:", result.response.text());

    } catch (error) {
        console.error("Gemini-Pro Failed:", error.message);
    }
}

// Alternative: Generic fetch to list models
async function fetchModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const data = await response.json();
        if (data.models) {
            console.log("\nAvailable Models:");
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name}`);
                }
            });
        } else {
            console.log("No models found or error:", data);
        }
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

fetchModels();
