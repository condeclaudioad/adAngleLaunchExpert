
const { GoogleGenAI } = require("@google/genai");

const key = 'AIzaSyAHOPUSSu5y7NquvDAL0-VEos9lxzlCgmk';
const ai = new GoogleGenAI({ apiKey: key });

async function test() {
    console.log("--- TESTING WITH PREFIX 'models/' ---");

    // Test 1: Nano with prefix
    try {
        console.log("Testing: models/nano-banana-pro-preview");
        const res = await ai.models.generateContent({
            model: 'models/nano-banana-pro-preview',
            contents: { parts: [{ text: "A banana" }] }
        });
        console.log("Nano Success:", res?.candidates?.length);
    } catch (e) {
        console.log("Nano Failed:", e.message);
    }

    // Test 2: Imagen 4 with prefix
    try {
        console.log("\nTesting: models/imagen-4.0-generate-preview-06-06");
        const res = await ai.models.generateContent({
            model: 'models/imagen-4.0-generate-preview-06-06',
            contents: { parts: [{ text: "A banana" }] }
        });
        console.log("Imagen 4 Success:", res?.candidates?.length);
    } catch (e) {
        console.log("Imagen 4 Failed:", e.message);
    }

    // Test 3: Gemini 2.0 Flash
    try {
        console.log("\nTesting: models/gemini-2.0-flash");
        const res = await ai.models.generateContent({
            model: 'models/gemini-2.0-flash',
            contents: { parts: [{ text: "A banana" }] }
        });
        console.log("Gemini 2.0 Flash Success:", res?.candidates?.length);
    } catch (e) {
        console.log("Gemini 2.0 Flash Failed:", e.message);
    }

    // Test 4: Imagen 3.0 (Official Model ID)
    try {
        console.log("\nTesting: models/imagen-3.0-generate-001");
        const res = await ai.models.generateContent({
            model: 'models/imagen-3.0-generate-001',
            contents: { parts: [{ text: "A banana" }] }
        });
        console.log("Imagen 3.0 (Prefix) Success:", res?.candidates?.length);
    } catch (e) {
        console.log("Imagen 3.0 (Prefix) Failed:", e.message);
    }
}

test();
