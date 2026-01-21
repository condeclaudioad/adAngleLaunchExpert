
import { GoogleGenAI } from "@google/genai";

const API_KEY = "AIzaSyBj-QTlOWo1iurG5CArOX9DOFQDDdRsAhc";

async function testNewSDK() {
    console.log("Testing @google/genai SDK...");
    try {
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: { role: 'user', parts: [{ text: "Hello, reply with OK" }] }
        });

        console.log("Response Keys:", Object.keys(response));
        console.log("typeof response.text:", typeof response.text);

        if (typeof response.text === 'function') {
            console.log("Executing response.text():", response.text());
        } else {
            console.log("Value of response.text:", response.text);
        }

    } catch (e) {
        console.error("SDK Error:", e);
    }
}

testNewSDK();
