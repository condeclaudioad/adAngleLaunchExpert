// services/imageGenService.ts - VERSIÓN CORREGIDA

import { GoogleGenAI } from "@google/genai";
import { Branding, KnowledgeBase, ImageAnalysis } from '../types';
import { MODEL_IMAGE_GEMINI } from '../constants';

// ═══════════════════════════════════════════════════════════
// ROBUST RETRY LOGIC
// ═══════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════
// GEMINI IMAGE GENERATION (MASTER CREATIVES)
// ═══════════════════════════════════════════════════════════

const generateWithGemini = async (
    prompt: string,
    apiKey: string,
    aspectRatio: string,
    referenceImages: { data: string, mimeType: string }[] = []
): Promise<string> => {

    // Validate aspect ratio
    const validRatios = ["1:1", "3:4", "4:3", "9:16", "16:9"];
    const finalRatio = validRatios.includes(aspectRatio) ? aspectRatio : "3:4";

    console.log(`🎨 Generating MASTER Image (${finalRatio}) with ${referenceImages.length} refs`);

    const ai = new GoogleGenAI({ apiKey });

    return robustGeminiCall(async () => {
        const timeoutPromise = new Promise<string>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout: Generation took too long (>90s)")), 90000)
        );

        const genPromise = (async () => {
            const parts: any[] = [];

            // Add reference images first
            referenceImages.forEach(img => {
                parts.push({ inlineData: { data: img.data, mimeType: img.mimeType } });
            });

            // Add text prompt with aspect ratio instruction
            parts.push({
                text: `${prompt}

TECHNICAL REQUIREMENTS:
- Output aspect ratio: ${finalRatio} (vertical format for ads)
- Resolution: High quality, suitable for social media ads
- Style: Photorealistic, commercial photography quality`
            });

            const response = await ai.models.generateContent({
                model: MODEL_IMAGE_GEMINI,
                contents: { parts },
                config: {
                    // Gemini 2.0 Flash Exp configuration
                    generationConfig: {
                        responseModalities: ["TEXT", "IMAGE"],
                    }
                }
            });

            // Extract image from response
            if (response.candidates && response.candidates.length > 0) {
                const content = response.candidates[0].content;
                if (content && content.parts) {
                    for (const part of content.parts) {
                        if (part.inlineData && part.inlineData.data) {
                            const mimeType = part.inlineData.mimeType || 'image/png';
                            return `data:${mimeType};base64,${part.inlineData.data}`;
                        }
                    }
                }
            }

            throw new Error("No image data returned from Gemini API");
        })();

        return Promise.race([genPromise, timeoutPromise]);
    }, 3, 3000);
};

// ═══════════════════════════════════════════════════════════
// EDIT IMAGE FUNCTION
// ═══════════════════════════════════════════════════════════

export const editGeneratedImage = async (
    base64Image: string,
    userInstruction: string,
    apiKey: string,
    aspectRatio: string
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey });

    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const prompt = `
ROLE: Expert Digital Retoucher.
TASK: Edit the provided image based on: "${userInstruction}"

RULES:
1. Maintain photorealism and original quality
2. If changing text, ensure PERFECT spelling
3. Keep the original lighting and composition unless asked to change
4. Preserve aspect ratio: ${aspectRatio}
`;

    return robustGeminiCall(async () => {
        const timeoutPromise = new Promise<string>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout: Edit took too long")), 60000)
        );

        const genPromise = (async () => {
            const response = await ai.models.generateContent({
                model: MODEL_IMAGE_GEMINI,
                contents: {
                    parts: [
                        { inlineData: { data: cleanBase64, mimeType: 'image/png' } },
                        { text: prompt }
                    ]
                },
                config: {
                    generationConfig: {
                        responseModalities: ["TEXT", "IMAGE"],
                    }
                }
            });

            if (response.candidates && response.candidates.length > 0) {
                const content = response.candidates[0].content;
                if (content && content.parts) {
                    for (const part of content.parts) {
                        if (part.inlineData && part.inlineData.data) {
                            return `data:image/png;base64,${part.inlineData.data}`;
                        }
                    }
                }
            }
            throw new Error("Failed to edit image");
        })();

        return Promise.race([genPromise, timeoutPromise]);
    });
};

// ═══════════════════════════════════════════════════════════
// MASTER PROMPT BUILDER
// ═══════════════════════════════════════════════════════════

const buildMasterPrompt = (
    hook: string,
    angleVisuals: string,
    branding: Branding,
    kb: KnowledgeBase,
    variationInstruction: string = ""
): string => {
    const primaryColor = branding.colors.primary;
    const secondaryColor = branding.colors.secondary;
    const productName = kb.structuredAnalysis?.productName || "Product";

    const cleanHook = hook.replace(/"/g, '').replace(/\.$/, '').toUpperCase().substring(0, 45);

    let brandingInstructions = "";
    let refIndex = 1;

    if (branding.personalPhoto && branding.includeFace) {
        brandingInstructions += `\n- REFERENCE IMAGE ${refIndex}: This is the EXPERT/FACE of the brand. Generate the main character to look exactly like this person (Face ID Preservation).`;
        refIndex++;
    }

    if (branding.logo) {
        brandingInstructions += `\n- REFERENCE IMAGE ${refIndex}: This is the LOGO. Place it subtly in a top corner or on the product packaging.`;
        refIndex++;
    }

    if (branding.productMockup) {
        brandingInstructions += `\n- REFERENCE IMAGE ${refIndex}: This is the OFFICIAL PRODUCT PACKAGING. Render the product looking EXACTLY like this reference.`;
        refIndex++;
    }

    return `
Create a HYPER-REALISTIC, HIGH-END ADVERTISING IMAGE for Facebook/Instagram Ads.
${variationInstruction ? `VARIATION INSTRUCTION: ${variationInstruction}` : ''}

## 1. VISUAL CONCEPT:
${angleVisuals}

## 2. BRANDING ASSETS (CRITICAL):
${brandingInstructions}
- COLOR PALETTE: Dominant ${primaryColor}, Accent ${secondaryColor}
- STYLE: Photorealistic 8k, Commercial Photography, Cinematic Lighting

## 3. TEXT OVERLAY:
Render this headline text clearly on the image:
>>> "${cleanHook}" <<<

RULES:
- Text must be legible, bold, and modern sans-serif
- NO spelling errors
- Product '${productName}' should look premium
- Aspect ratio: 3:4 vertical (for Stories/Reels)
`;
};

// ═══════════════════════════════════════════════════════════
// MAIN EXPORT FUNCTION
// ═══════════════════════════════════════════════════════════

export const generateImageService = async (
    modelId: string,
    basePrompt: string,
    aspectRatio: string,
    keys: { google?: string; grok?: string },
    branding: Branding,
    knowledgeBase: KnowledgeBase,
    imageAnalysis: ImageAnalysis[],
    variationType: string = ""
): Promise<string> => {

    if (!keys.google) throw new Error("Falta la Google API Key.");

    // Prepare reference images
    const references: { data: string, mimeType: string }[] = [];

    if (branding.personalPhoto && branding.includeFace) {
        const base64 = branding.personalPhoto.split(',')[1];
        if (base64) references.push({ data: base64, mimeType: 'image/png' });
    }

    if (branding.logo) {
        const base64 = branding.logo.split(',')[1];
        if (base64) references.push({ data: base64, mimeType: 'image/png' });
    }

    if (branding.productMockup) {
        const base64 = branding.productMockup.split(',')[1];
        if (base64) references.push({ data: base64, mimeType: 'image/png' });
    }

    // Extract hook and visuals from prompt
    const hookMatch = basePrompt.match(/HOOK:\s*(.*?)(\.|$)/);
    const hook = hookMatch ? hookMatch[1] : "OFERTA";

    const visualMatch = basePrompt.match(/VISUAL(?:S|CONCEPT)?:\s*(.*?)(?=\.\s*HOOK:|$)/i);
    let angleVisuals = visualMatch ? visualMatch[1] : basePrompt;

    if (angleVisuals.length < 20) {
        angleVisuals = "Professional split-screen comparison. Left: Problem/Chaos. Right: Solution/Order.";
    }

    const finalPrompt = buildMasterPrompt(
        hook,
        angleVisuals,
        branding,
        knowledgeBase,
        variationType
    );

    return generateWithGemini(finalPrompt, keys.google, aspectRatio, references);
};
