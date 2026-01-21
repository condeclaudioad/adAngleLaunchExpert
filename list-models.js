
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyAHOPUSSu5y7NquvDAL0-VEos9lxzlCgmk";

async function listModels() {
    const genAI = new GoogleGenerativeAI(API_KEY);
    console.log("Fetching available models...");
    try {
        // Note: getGenerativeModel doesn't list, checking direct fetch or heuristics if list not available in node SDK easily without full client.
        // Actually the SDK doesn't expose listModels easily in the simplified client?
        // We can try to just test a few candidates.

        const candidates = [
            "gemini-2.0-flash",
            "gemini-1.5-flash",
            "gemini-1.5-flash-8b",
            "gemini-1.5-pro",
            "gemini-2.0-flash-exp"
        ];

        for (const m of candidates) {
            process.stdout.write(`Testing ${m}... `);
            try {
                const model = genAI.getGenerativeModel({ model: m });
                const result = await model.generateContent("Hi");
                console.log("✅ OK");
            } catch (e) {
                if (e.message.includes('404')) console.log("❌ 404 Not Found");
                else if (e.message.includes('429')) console.log("⚠️ 429 Quota");
                else console.log(`❌ Error: ${e.message.split('\n')[0]}`);
            }
        }

    } catch (error) {
        console.error("Fatal:", error);
    }
}

listModels();
