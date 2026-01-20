
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.VITE_GOOGLE_API_KEY;
if (!apiKey) {
    console.error("No API KEY provided");
    process.exit(1);
}

// Candidate models to test in order of likelihood based on user input "Nano Banana Pro"
const MODELS_TO_TEST = [
    'gemini-3-pro-image-preview', // Display: Nano Banana Pro
    'nano-banana-pro-preview',
    'imagen-4.0-generate-001'
];

async function testModel(modelId: string) {
    console.log(`\n🧪 Testing model: ${modelId}...`);
    const ai = new GoogleGenAI({ apiKey });

    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: {
                parts: [
                    { text: "Generate a photorealistic image of a futuristic banana with neon lights." },
                    {
                        text: `
                        TECHNICAL REQUIREMENTS:
                        - Output aspect ratio: 3:4
                        `
                    }
                ]
            }
        });

        if (response.candidates && response.candidates.length > 0) {
            const content = response.candidates[0].content;
            if (content && content.parts) {
                for (const part of content.parts) {
                    if (part.inlineData && part.inlineData.data) {
                        console.log(`✅ SUCCESS! Model ${modelId} generated an image.`);
                        return true;
                    }
                }
            }
        }
        console.log(`❌ Model ${modelId} returned no image data.`);
    } catch (e: any) {
        console.error(`❌ FAILURE with ${modelId}:`, e.message);
    }
    return false;
}

async function run() {
    for (const model of MODELS_TO_TEST) {
        const success = await testModel(model);
        if (success) {
            console.log(`\n🏆 WINNER: ${model}`);
            // Force exit to ensure we don't hang
            process.exit(0);
        }
    }
    console.log("\n😭 All models failed.");
    process.exit(1);
}

run();
