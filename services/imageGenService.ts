// services/imageGenService.ts - GEMINI ONLY (ROBUST)

import { GoogleGenAI } from "@google/genai";
import { Branding, KnowledgeBase, ImageAnalysis } from '../types';
import { MODEL_IMAGE_GEMINI } from '../constants';

// ═══════════════════════════════════════════════════════════
// ROBUST RETRY LOGIC (ENHANCED)
// ═══════════════════════════════════════════════════════════

const robustGeminiCall = async <T>(
    operation: () => Promise<T>,
    retries = 3,
    baseDelay = 2000
): Promise<T> => {
    let lastError: any;

    for (let i = 0; i < retries; i++) {
        try {
            return await operation();
        } catch (error: any) {
            lastError = error;
            const msg = error?.message || JSON.stringify(error);

            // Check for specific error types to decide retry strategy
            const isQuota = msg.includes('429') || msg.includes('Resource has been exhausted');
            const isInternal = msg.includes('500') || msg.includes('Internal error');
            const isOverloaded = msg.includes('503') || msg.includes('overloaded');
            const isTimeout = msg.includes('Timeout') || msg.includes('timed out');

            // If it's a fatal client error (400, 401, 403, 404), do not retry
            const isFatal = msg.includes('400') || msg.includes('401') || msg.includes('403') || msg.includes('404');

            if (isFatal) {
                console.error(`❌ Fatal API Error (No Retry): ${msg}`);
                throw error;
            }

            if (i < retries - 1) {
                // Exponential backoff with jitter
                // 429 errors need longer wait times
                const backoff = isQuota ? 5000 : baseDelay;
                const delay = backoff * Math.pow(2, i) + (Math.random() * 1000);

                console.warn(`⚠️ API Error (${msg.substring(0, 50)}...). Retrying in ${Math.round(delay)}ms... (Attempt ${i + 1}/${retries})`);
                await new Promise(res => setTimeout(res, delay));
            }
        }
    }

    // If we get here, all retries failed
    console.error("❌ Fatal API Error after retries:", lastError?.message);
    throw lastError || new Error("Failed after max retries");
};

// ═══════════════════════════════════════════════════════════
// GEMINI IMAGE GENERATION
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

    console.log(`🎨 Generating Image (${finalRatio}) - Prompt length: ${prompt.length}`);

    const ai = new GoogleGenAI({ apiKey });

    return robustGeminiCall(async () => {
        // Reduced timeout to fail faster if stuck, but long enough for generation
        const timeoutPromise = new Promise<string>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout: Gemini Generation took too long (>60s)")), 60000)
        );

        const genPromise = (async () => {
            const parts: any[] = [];

            // Add reference images first (limit to 3 to prevent payload issues)
            referenceImages.slice(0, 3).forEach(img => {
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
                contents: { parts }
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
    }, 3, 3000); // 3 retries, start with 3s delay
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
            setTimeout(() => reject(new Error("Timeout: Edit took too long")), 45000)
        );

        const genPromise = (async () => {
            const response = await ai.models.generateContent({
                model: MODEL_IMAGE_GEMINI,
                contents: {
                    parts: [
                        { inlineData: { data: cleanBase64, mimeType: 'image/png' } },
                        { text: prompt }
                    ]
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
    }, 2, 2000); // 2 retries is enough for edit
};

// ═══════════════════════════════════════════════════════════
// MASTER PROMPT BUILDER
// ═══════════════════════════════════════════════════════════

const buildMasterPrompt = (
    hook: string,
    angleVisuals: string,
    branding: Branding,
    kb: KnowledgeBase,
    aspectRatio: string = "3:4",
    variationInstruction: string = ""
): string => {
    const primaryColor = branding.colors.primary;
    const secondaryColor = branding.colors.secondary;
    const productName = kb.structuredAnalysis?.productName || "Product";

    const cleanHook = hook.replace(/"/g, '').replace(/\.$/, '').toUpperCase().substring(0, 30); // Shorter hook

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
ROLE: World-Class Ad Designer specialized in "NanoBanana Pro" style (High-Converting Infographics).
TASK: Create a scroll-stopping ad image for "${productName}".

${variationInstruction ? `VARIATION INSTRUCTION: ${variationInstruction}` : ''}

## 1. STYLE: "NANOBANANA PRO" AESTHETIC
- **Type**: Modern Infographic / High-End Product Photography Hybrid.
- **Vibe**: Clean, Professional, Trustworthy, High-Tech.
- **Lighting**: Bright, Even, Studio Lighting. No dark, moody shadows unless requested.
- **Color**: Dominant ${primaryColor}, Accent ${secondaryColor}. Use high contrast for readability.
- **Composition**: Central focus on the benefit/result. Clean negative space.
- **Visuals**: Use 3D icons, floating elements, or split-screens to demonstrate value visually.

## 2. TEXT RULES (CRITICAL):
- **HEADLINE**: "${cleanHook}"
- **Render text EXACTLY as written above.** Spelling mistakes are unacceptable.
- **MAXIMUM TEXT**: Use NO OTHER TEXT. Only the headline.
- **Font**: Bold, Sans-Serif, Modern (like Helvetica, Inter, or Roboto).
- **Placement**: Clear area, away from the product, fully legible.
- **NO**: Paragraphs, clusters of text, or small labels. KEEP IT MINIMAL.

## 3. PROMPT CONCEPT:
${angleVisuals}

## 4. BRANDING:
${brandingInstructions}

## 5. TECHNICAL:
- Aspect Ratio: ${aspectRatio}
- Quality: 8k, Sharp Focus, No distortion.
`;
};

// ═══════════════════════════════════════════════════════════
// MAIN EXPORT FUNCTION
// ═══════════════════════════════════════════════════════════

export const generateImageService = async (
    basePrompt: string,
    aspectRatio: string,
    keys: { google?: string; },
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
        aspectRatio,
        variationType
    );

    // PROCEED TO GENERATION
    console.log(`🎨 Requesting generation with Gemini (Variation: ${!!variationType})`);
    return await generateWithGemini(finalPrompt, keys.google, aspectRatio, references);
};
