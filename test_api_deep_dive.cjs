
const { GoogleGenAI } = require("@google/genai");

const API_KEY = 'AIzaSyAHOPUSSu5y7NquvDAL0-VEos9lxzlCgmk';
const ai = new GoogleGenAI({ apiKey: API_KEY });

async function runDiagnostics() {
    console.log("🔍 STARTING DEEP DIVE DIAGNOSTICS");
    console.log("=================================");

    // 1. TEXT GENERATION (Sanity Check)
    console.log("\n📝 TEST 1: Simple Text Generation (gemini-2.0-flash)");
    try {
        const start = Date.now();
        const res = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: { parts: [{ text: "Hello, are you working?" }] }
        });
        const duration = Date.now() - start;
        console.log(`✅ Text Success in ${duration}ms`);
        console.log(`   Response: "${res.candidates[0].content.parts[0].text.trim()}"`);
    } catch (e) {
        console.error("❌ Text Failed:", e.message);
    }

    // 2. PRIMARY IMAGE MODEL (Nano Banana)
    console.log("\n🍌 TEST 2: Primary Image Model (nano-banana-pro-preview)");
    try {
        const start = Date.now();
        // Note: Using 'models/' prefix just in case, though previous test without it also failed
        const res = await ai.models.generateContent({
            model: 'models/nano-banana-pro-preview',
            contents: { parts: [{ text: "Generate a simple red cube." }] }
        });
        const duration = Date.now() - start;
        console.log(`✅ Nano Success in ${duration}ms`);

        const hasImage = res.candidates?.[0]?.content?.parts?.some(p => p.inlineData);
        if (hasImage) console.log("   🖼️  Image Data Received!");
        else console.log("   ⚠️  No image data found. Response:", JSON.stringify(res.candidates?.[0]?.content?.parts));

    } catch (e) {
        console.error("❌ Nano Failed:", e.message);
        if (e.message.includes("503")) console.log("   -> Diagnosis: Google Service Overloaded (Not your fault)");
        if (e.message.includes("500")) console.log("   -> Diagnosis: Google Internal Error (Not your fault)");
        if (e.message.includes("404")) console.log("   -> Diagnosis: Model Name Incorrect or No Access");
    }

    // 3. BACKUP MODEL (Gemini 2.0 Flash for Images? or Imagen?)
    console.log("\n🛡️ TEST 3: Backup Model (models/gemini-2.0-flash) for IMAGE request");
    try {
        const start = Date.now();
        const res = await ai.models.generateContent({
            model: 'models/gemini-2.0-flash',
            contents: { parts: [{ text: "Generate a realistic image of a cat." }] }
        });
        const duration = Date.now() - start;
        console.log(`✅ Backup Response in ${duration}ms`);

        const hasImage = res.candidates?.[0]?.content?.parts?.some(p => p.inlineData);
        if (hasImage) {
            console.log("   🖼️  Image Data Received from Flash!");
        } else {
            console.log("   ⚠️  No image data. Text Response:", JSON.stringify(res.candidates?.[0]?.content?.parts?.[0]?.text));
            console.log("   -> Diagnosis: Model refused to generate image (Safety/Capability issue).");
        }

    } catch (e) {
        console.error("❌ Backup Failed:", e.message);
    }

}

runDiagnostics();
