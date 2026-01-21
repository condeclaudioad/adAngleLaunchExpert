
const { GoogleGenAI } = require("@google/genai");

const key = 'AIzaSyAHOPUSSu5y7NquvDAL0-VEos9lxzlCgmk';
const modelName = 'nano-banana-pro-preview';

async function testNano() {
    console.log(`Testing model: ${modelName} with new key...`);
    const ai = new GoogleGenAI({ apiKey: key });

    try {
        // Try Image Generation Interface first (if it's an image model)
        console.log("Attempting Image Generation...");
        const response = await ai.models.generateImage({
            model: modelName,
            prompt: "A futuristic banana with cybernetic implants, neon lights, clear background, 8k resolution, cinematic lighting.",
            config: {
                numberOfImages: 1,
            }
        });

        console.log("Response received!");
        if (response.image) {
            console.log("SUCCESS: Image generated directly.");
            console.log("Image Data Length:", response.image.image.byteLength);
        } else {
            console.log("Structure check:", Object.keys(response));
        }

    } catch (e) {
        console.error("Image Gen Failed:", e.message);

        // If 404, maybe it's not a standard image model but a multimodal one?
        // Or maybe just the name is wrong in the SDK.


        console.log("\nAttempting List Models to find the real name...");
        try {
            const response = await ai.models.list();
            // console.log("Keys in response:", Object.keys(response));
            const models = response.models || response;

            if (Array.isArray(models)) {
                models.forEach(m => {
                    // Log anything that looks like an image model or contains banana/nano
                    if (m.name.includes('nano') || m.name.includes('banana') || m.name.includes('image') || m.name.includes('imagen')) {
                        console.log("FOUND MODEL:", m.name, m.supportedGenerationMethods);
                    }
                })
            } else {
                console.log("Could not find models array in response");
            }

        } catch (listErr) {
            console.error("List failed:", listErr);
        }
    }
}

testNano();
