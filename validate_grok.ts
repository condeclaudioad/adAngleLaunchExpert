
import fs from 'fs';
import https from 'https';

const apiKey = process.env.VITE_GROK_API_KEY;
if (!apiKey) {
    console.error("No API KEY provided");
    process.exit(1);
}

const GROK_API_BASE = 'https://api.x.ai/v1';
const MODEL = 'grok-2-vision-1212'; // Trying checking if this or grok-2-image works. xAI docs say 'grok-beta' or 'grok-2'. Let's test a few.

// Candidates to test
const MODELS_TO_TEST = [
    'grok-3', // Suggested by error message
    'grok-2-vision-latest',
    'grok-2-1212',
    'grok-vision-beta'
];

async function testGrokModel(modelId: string) {
    console.log(`\n🧪 Testing Grok model: ${modelId}...`);

    const requestBody = {
        model: modelId,
        prompt: "A futuristic banana with neon lights, photorealistic, 8k",
        n: 1,
        response_format: "url"
    };

    return new Promise<boolean>((resolve) => {
        const req = https.request(`${GROK_API_BASE}/images/generations`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const json = JSON.parse(data);
                        if (json.data && json.data.length > 0 && json.data[0].url) {
                            console.log(`✅ SUCCESS! Model ${modelId} generated an image URL: ${json.data[0].url.substring(0, 50)}...`);
                            resolve(true);
                        } else {
                            console.log(`❌ Model ${modelId} returned 200 but no image data:`, data);
                            resolve(false);
                        }
                    } catch (e) {
                        console.log(`❌ Model ${modelId} JSON parse error:`, e);
                        resolve(false);
                    }
                } else {
                    console.log(`❌ Model ${modelId} failed with status ${res.statusCode}:`, data);
                    resolve(false);
                }
            });
        });

        req.on('error', (e) => {
            console.error(`❌ Request error for ${modelId}:`, e.message);
            resolve(false);
        });

        req.write(JSON.stringify(requestBody));
        req.end();
    });
}

async function run() {
    for (const model of MODELS_TO_TEST) {
        const success = await testGrokModel(model);
        if (success) {
            console.log(`\n🏆 WINNER: ${model}`);
            process.exit(0);
        }
    }
    console.log("\n😭 All Grok models failed.");
    process.exit(1);
}

run();
