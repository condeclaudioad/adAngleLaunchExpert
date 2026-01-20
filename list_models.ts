
import { GoogleGenAI } from "@google/genai";
import * as fs from 'fs';
import * as path from 'path';

// Manual .env parser
function getEnvKey() {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf-8');
            const lines = content.split('\n');
            for (const line of lines) {
                if (line.startsWith('VITE_GOOGLE_api_KEY=')) {
                    return line.split('=')[1].trim().replace(/"/g, '');
                }
                if (line.startsWith('VITE_GOOGLE_API_KEY=')) {
                    return line.split('=')[1].trim().replace(/"/g, '');
                }
            }
        }
    } catch (e) { }
    return process.env.VITE_GOOGLE_api_KEY || process.env.GOOGLE_API_KEY;
}

const apiKey = getEnvKey();

if (!apiKey) {
    console.error("No API Key found in .env");
    process.exit(1);
}

// console.log("Using Key ending in:", apiKey.slice(-4)); // minimal debug

const ai = new GoogleGenAI({ apiKey });

async function listModels() {
    try {
        console.log("Listing models...");
        const response = await ai.models.list();

        console.log("\nFound Models:");
        // The SDK response structure for list might need adaptation. 
        // Based on typical Google AI SDK:
        for await (const model of response) {
            // Check if it supports generation
            const methods = model.supportedGenerationMethods || [];
            console.log(`- ${model.name} | Display: ${model.displayName} | Methods: ${methods.join(', ')}`);
        }
    } catch (e) {
        console.error("Error listing models:", e);
    }
}

listModels();
