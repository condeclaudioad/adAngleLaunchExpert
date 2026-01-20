
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { Branding, KnowledgeBase, ImageAnalysis } from '../types';
import { MODEL_IMAGE } from '../constants';

// Helper to get the key from storage or env
const getAuthKey = () => {
    return localStorage.getItem('le_api_key') || process.env.API_KEY || "";
};

// --- ROBUST RETRY LOGIC FOR GEMINI ---
// Specific handling for 429 (Quota) and 500 (Internal)
const robustGeminiCall = async <T>(
    operation: () => Promise<T>, 
    retries = 3, 
    baseDelay = 2000
): Promise<T> => {
    for (let i = 0; i < retries; i++) {
        try {
            return await operation();
        } catch (error: any) {
            const msg = error?.message || JSON.stringify(error);
            const isQuota = msg.includes('429') || msg.includes('Resource has been exhausted');
            const isInternal = msg.includes('500') || msg.includes('Internal error');
            const isOverloaded = msg.includes('503') || msg.includes('overloaded');

            if ((isQuota || isInternal || isOverloaded) && i < retries - 1) {
                // Exponential backoff with jitter
                const delay = baseDelay * Math.pow(2, i) + (Math.random() * 1000);
                console.warn(`⚠️ API Error (${isQuota ? '429' : '500/503'}). Retrying in ${Math.round(delay)}ms... (Attempt ${i + 1}/${retries})`);
                await new Promise(res => setTimeout(res, delay));
            } else {
                console.error("❌ Fatal API Error after retries:", msg);
                throw error;
            }
        }
    }
    throw new Error("Failed after max retries");
};

// --- GEMINI 2.5 FLASH IMAGE GENERATION ---
const generateWithGeminiImages = async (
    prompt: string, 
    aspectRatio: string,
    referenceImages: { data: string, mimeType: string }[] = []
): Promise<string> => {
    console.log(`Generating Image (${aspectRatio}) with ${referenceImages.length} refs`);

    const ai = new GoogleGenAI({ apiKey: getAuthKey() });

    return robustGeminiCall(async () => {
        // Timeout 90s (Generations can be slow)
        const timeoutPromise = new Promise<string>((_, reject) => 
            setTimeout(() => reject(new Error("Timeout: Generation took too long (>90s)")), 90000)
        );

        const genPromise = (async () => {
            // Build parts: Text Prompt + Reference Images
            const parts: any[] = [];
            
            // Add reference images first (Gemini prefers images before text usually, or interleaved)
            referenceImages.forEach(img => {
                parts.push({ inlineData: { data: img.data, mimeType: img.mimeType } });
            });

            // Add text prompt
            parts.push({ text: prompt });

            const response = await ai.models.generateContent({
                model: MODEL_IMAGE,
                contents: { parts: parts },
                config: {
                    imageConfig: {
                        aspectRatio: aspectRatio as any
                    },
                    // PERMISSIVE SAFETY SETTINGS TO AVOID FALSE 500 ERRORS
                    safetySettings: [
                        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                    ]
                }
            });

            if (response.candidates && response.candidates.length > 0 && response.candidates[0].content && response.candidates[0].content.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData && part.inlineData.data) {
                        return `data:image/png;base64,${part.inlineData.data}`;
                    }
                }
            }
            throw new Error("No image data returned from API (Check Safety Filters or Prompt)");
        })();

        return Promise.race([genPromise, timeoutPromise]);
    }, 3, 3000); // 3 Retries, start waiting 3s
};

// --- EDIT IMAGE FUNCTION ---
export const editGeneratedImage = async (
    base64Image: string,
    userInstruction: string,
    aspectRatio: string
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: getAuthKey() });
    
    // Clean base64 header
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

    const prompt = `
    ROLE: Expert Digital Retoucher.
    TASK: Edit the provided image based on: "${userInstruction}"
    
    RULES:
    1. Maintain photorealism.
    2. If changing text, ensure PERFECT spelling.
    3. Keep the original lighting and composition unless asked to change.
    `;

    return robustGeminiCall(async () => {
        const timeoutPromise = new Promise<string>((_, reject) => 
            setTimeout(() => reject(new Error("Timeout: Edit took too long")), 60000)
        );

        const genPromise = (async () => {
            const response = await ai.models.generateContent({
                model: MODEL_IMAGE, 
                contents: {
                    parts: [
                        { inlineData: { data: cleanBase64, mimeType: 'image/png' } },
                        { text: prompt }
                    ]
                },
                config: {
                    imageConfig: {
                        aspectRatio: aspectRatio as any
                    },
                }
            });

            if (response.candidates && response.candidates.length > 0) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData && part.inlineData.data) {
                        return `data:image/png;base64,${part.inlineData.data}`;
                    }
                }
            }
            throw new Error("Failed to edit image");
        })();

        return Promise.race([genPromise, timeoutPromise]);
    });
};

// --- THE MASTER PROMPT ---
const getInfographicPrompt = (
    hook: string,
    angleVisuals: string,
    branding: Branding,
    kb: KnowledgeBase,
    variationInstruction: string = ""
) => {
    const primaryColor = branding.colors.primary;
    const secondaryColor = branding.colors.secondary;
    const productName = kb.structuredAnalysis?.productName || "Product";
    
    const cleanHook = hook.replace(/"/g, '').replace(/\.$/, '').toUpperCase().substring(0, 45);

    // Dynamic instructions based on uploaded assets
    let brandingInstructions = "";
    let refIndex = 1;

    // 1. Personal Photo
    if (branding.personalPhoto && branding.includeFace) {
        brandingInstructions += `\n- REFERENCE IMAGE ${refIndex}: This is the EXPERT/FACE of the brand. You MUST generate the main character in the ad to look exactly like this person (Face ID Preservation). Maintain their facial features, ethnicity, and age.`;
        refIndex++;
    }
    
    // 2. Logo
    if (branding.logo) {
        brandingInstructions += `\n- REFERENCE IMAGE ${refIndex}: This is the LOGO. Place it subtly in a top corner or on the product packaging. Do not distort it.`;
        refIndex++;
    }

    // 3. Product Mockup
    if (branding.productMockup) {
        brandingInstructions += `\n- REFERENCE IMAGE ${refIndex}: This is the OFFICIAL PRODUCT PACKAGING/MOCKUP. You MUST render the product in the scene looking EXACTLY like this reference. Do not hallucinate a new package.`;
        refIndex++;
    }

    return `
    Create a HYPER-REALISTIC, HIGH-END ADVERTISING IMAGE.
    ${variationInstruction ? `VARIATION INSTRUCTION: ${variationInstruction}` : ''}
    
    ## 1. VISUAL CORE:
    ${angleVisuals}
    
    ## 2. BRANDING ASSETS (CRITICAL):
    ${brandingInstructions}
    - COLOR PALETTE: Dominant ${primaryColor}, Accent ${secondaryColor}.
    - STYLE: Photorealistic 8k, Commercial Photography, Cinematic Lighting.
    
    ## 3. TEXT OVERLAY:
    Render this headline text clearly on the image:
    >>> "${cleanHook}" <<<
    
    RULES:
    - Text must be legible, bold, and modern sans-serif.
    - No spelling errors.
    - If showing the product '${productName}', make it look premium.
    `;
};

export const generateImageService = async (
    modelId: string, 
    basePrompt: string, 
    aspectRatio: string,
    branding: Branding,
    knowledgeBase: KnowledgeBase,
    imageAnalysis: ImageAnalysis[],
    variationType: string = "" 
): Promise<string> => {
    
    // Prepare References (Strict Order)
    const references: { data: string, mimeType: string }[] = [];

    // 1. Personal Photo (Face)
    if (branding.personalPhoto && branding.includeFace) {
        const base64 = branding.personalPhoto.split(',')[1];
        if (base64) references.push({ data: base64, mimeType: 'image/png' });
    }

    // 2. Logo
    if (branding.logo) {
        const base64 = branding.logo.split(',')[1];
        if (base64) references.push({ data: base64, mimeType: 'image/png' });
    }

    // 3. Product Mockup (NEW)
    if (branding.productMockup) {
        const base64 = branding.productMockup.split(',')[1];
        if (base64) references.push({ data: base64, mimeType: 'image/png' });
    }

    // Extract Hook and Visuals
    const hookMatch = basePrompt.match(/HOOK:\s*(.*?)(\.|$)/);
    const hook = hookMatch ? hookMatch[1] : "OFERTA";

    const visualMatch = basePrompt.match(/VISUAL CONCEPT:\s*(.*?)(?=\.\s*HOOK:|$)/);
    let angleVisuals = visualMatch ? visualMatch[1] : basePrompt;

    if (angleVisuals.length < 20) {
        angleVisuals = "A professional split-screen comparison. Left side: Chaos/Problem. Right side: Solution/Order.";
    }

    const finalPrompt = getInfographicPrompt(
        hook, 
        angleVisuals, 
        branding, 
        knowledgeBase, 
        variationType
    );

    return generateWithGeminiImages(finalPrompt, aspectRatio, references);
};
