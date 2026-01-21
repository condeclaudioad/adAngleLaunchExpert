
const { GoogleGenAI } = require("@google/genai");

const key = 'AIzaSyAHOPUSSu5y7NquvDAL0-VEos9lxzlCgmk';

async function testGen() {
    const ai = new GoogleGenAI({ apiKey: key });

    console.log("--- DIAGNOSTIC START ---");

    try {
        const response = await ai.models.list();
        // console.log("Models listed (count):", response.models.length);

        const nano = response.models.find(m => m.name.includes('nano-banana'));
        console.log("\n[NANO BANANA DETAILS]");
        if (nano) {
            console.log("Name:", nano.name);
            console.log("DisplayName:", nano.displayName);
            console.log("Supported Methods:", nano.supportedGenerationMethods);
        } else {
            console.log("Nano Banana NOT FOUND in list!");
        }

        const imagen = response.models.find(m => m.name.includes('imagen-4'));
        console.log("\n[IMAGEN 4 DETAILS]");
        if (imagen) {
            console.log("Name:", imagen.name);
            console.log("Supported Methods:", imagen.supportedGenerationMethods);
        }

    } catch (e) {
        console.log("List models failed:", e.message);
    }

    // TEST 1: Generate Content (Nano)
    console.log("\n--- Testing generateContent (Nano) ---");
    try {
        const res = await ai.models.generateContent({
            model: 'nano-banana-pro-preview',
            contents: { parts: [{ text: "A futuristic banana" }] }
        });
        console.log("Nano generateContent Success!");
        console.log("Candidates:", res.candidates?.length);
    } catch (e) {
        console.log("Nano generateContent Failed:", e.message);
    }

    // TEST 2: Generate Image (Imagen Standard Path)
    // Note: In @google/genai, image gen might be via specific helper or not at all if only Vertex?
    // Let's try the dynamic model call if generateImage is missing
    console.log("\n--- Testing generateContent (Imagen 4 - Backup) ---");
    try {
        const res = await ai.models.generateContent({
            model: 'imagen-4.0-generate-preview-06-06',
            contents: { parts: [{ text: "A futuristic banana" }] }
        });
        console.log("Imagen-4 generateContent Success!");
    } catch (e) {
        console.log("Imagen-4 generateContent Failed:", e.message);
    }

    // INSPECT SDK
    console.log("AI Instance Keys:", Object.keys(ai));
    if (ai.mn) console.log("Has 'mn' namespace?"); // minified?
    if (ai.imagen) console.log("Has 'imagen' namespace!");

    // TEST 4: Imagen 3.0 Standard
    console.log("\n--- Testing generateContent (Imagen 3.0 Standard) ---");
    try {
        const res = await ai.models.generateContent({
            model: 'imagen-3.0-generate-001',
            contents: { parts: [{ text: "A futuristic banana" }] }
        });
        console.log("Imagen 3.0 Success!");
        if (res.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
            console.log("Image Data Found!");
        }
    } catch (e) {
        console.log("Imagen 3.0 Failed:", e.message);
    }

    // TEST 3: Gemini 2.0 Flash (Reliable Backup?)
    console.log("\n--- Testing generateContent (Gemini 2.0 Flash) ---");
    try {
        const res = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: { parts: [{ text: "Generate an image of a cute capybara wearing a tuxedo" }] }
        });
        console.log("Gemini 2.0 Flash Success!");
        if (res.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
            console.log("Image Data Found!");
        } else {
            console.log("No inlineData found. Response text:", JSON.stringify(res.candidates?.[0]?.content?.parts?.[0]?.text));
        }
    } catch (e) {
        console.log("Gemini 2.0 Flash Failed:", e.message);
    }
}

testGen();
