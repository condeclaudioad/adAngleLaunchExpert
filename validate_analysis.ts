
import { GoogleGenAI } from "@google/genai";
import fs from 'fs';

const apiKey = process.env.VITE_GOOGLE_API_KEY;
if (!apiKey) {
    console.error("No API KEY provided");
    process.exit(1);
}

// Candidates to test for multimodal analysis
const MODELS_TO_TEST = [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.0-flash-exp'
];

// Create a small 1x1 base64 image for testing
const TEST_IMAGE_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
const MIME_TYPE = "image/png";

async function testAnalysis(modelId: string) {
    console.log(`\n🧪 Testing Analysis with model: ${modelId}...`);
    const ai = new GoogleGenAI({ apiKey });

    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: [
                {
                    parts: [
                        { text: "Analyze this image. Return JSON: { \"description\": \"test\" }" },
                        { inlineData: { data: TEST_IMAGE_BASE64, mimeType: MIME_TYPE } }
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json"
            }
        });

        if (response.text) {
            console.log(`✅ SUCCESS! Model ${modelId} returned text:`, response.text.substring(0, 50));
            return true;
        }
    } catch (e: any) {
        console.error(`❌ FAILURE with ${modelId}:`, e.message);
    }
    return false;
}

async function run() {
    for (const model of MODELS_TO_TEST) {
        const success = await testAnalysis(model);
        if (success) {
            console.log(`\n🏆 WINNER: ${model}`);
            process.exit(0);
        }
    }
    console.log("\n😭 All analysis models failed.");
    process.exit(1);
}

run();
