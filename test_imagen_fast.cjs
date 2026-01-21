
const { GoogleGenAI } = require("@google/genai");

const key = 'AIzaSyAHOPUSSu5y7NquvDAL0-VEos9lxzlCgmk';
const ai = new GoogleGenAI({ apiKey: key });

async function test() {
    console.log("--- TESTING IMAGEN 4 FAST ---");
    try {
        const modelName = 'models/imagen-4.0-fast-generate-001';
        console.log(`Testing: ${modelName}`);

        const res = await ai.models.generateContent({
            model: modelName,
            contents: { parts: [{ text: "A futuristic banana" }] }
        });

        console.log("Success!");
        if (res.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
            console.log("🖼️ Image Data Received!");
        } else {
            console.log("⚠️ No image data. Response:", JSON.stringify(res.candidates?.[0]?.content?.parts));
        }

    } catch (e) {
        console.log("Failed:", e.message);
    }
}

test();
