// services/imageGenService.ts - GEMINI ONLY (ROBUST)

import { GoogleGenAI } from "@google/genai";
import { Branding, KnowledgeBase, ImageAnalysis } from '../types';
import { MODEL_IMAGE_GEMINI, MODEL_IMAGE_BACKUP } from '../constants';

// ═══════════════════════════════════════════════════════════
// ROBUST RETRY LOGIC (ENHANCED)
// ═══════════════════════════════════════════════════════════

const robustGeminiCall = async <T>(
    operation: () => Promise<T>,
    retries = 1, // Reduced to 1 to FAIL FAST on timeouts/overloads
    baseDelay = 1000
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

// Helper for specific model generation
const generateContentWithModel = async (
    modelName: string,
    prompt: string,
    apiKey: string,
    finalRatio: string,
    referenceImages: { data: string, mimeType: string }[] = []
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey });

    return robustGeminiCall(async () => {
        const timeoutPromise = new Promise<string>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout: Gemini Generation took too long (>60s)")), 60000)
        );

        const genPromise = (async () => {
            const parts: any[] = [];
            referenceImages.slice(0, 3).forEach(img => {
                parts.push({ inlineData: { data: img.data, mimeType: img.mimeType } });
            });

            parts.push({
                text: `${prompt}\n\nTECHNICAL REQUIREMENTS:\n- Output aspect ratio: ${finalRatio} (vertical format for ads)\n- Resolution: High quality, suitable for social media ads\n- Style: Photorealistic, commercial photography quality`
            });

            const response = await ai.models.generateContent({
                model: modelName, // Dynamic model
                contents: { parts }
            });

            if (response.candidates && response.candidates.length > 0) {
                const content = response.candidates[0].content;
                if (content && content.parts) {
                    for (const part of content.parts) {
                        if (part.inlineData && part.inlineData.data) {
                            const mimeType = part.inlineData.mimeType || 'image/png';
                            return `data:${mimeType};base64,${part.inlineData.data}`;
                        }
                    }
                    // Check for text refusal/explanation
                    const textPart = content.parts.find(p => p.text);
                    if (textPart && textPart.text) {
                        const shortReason = textPart.text.substring(0, 200);
                        throw new Error(`Model Refusal: ${shortReason}...`);
                    }
                }
            }
            throw new Error(`No image data returned from ${modelName}`);
        })();

        return Promise.race([genPromise, timeoutPromise]);
    }, 3, 3000);
};

// Helper: Create a placeholder image when AI fails (prevents UI crash)
const createFallbackImage = (text: string): string => {
    // Return a solid color placeholder (Base64 PNG) - Orange 1x1
    // In a real app, this could be a generated SVG or a static asset
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==";
};

// Main Generation Function with Fallback
const generateWithGemini = async (
    prompt: string,
    apiKey: string,
    aspectRatio: string,
    referenceImages: { data: string, mimeType: string }[] = []
): Promise<string> => {
    // Validate aspect ratio
    const validRatios = ["1:1", "3:4", "4:3", "9:16", "16:9"];
    const finalRatio = validRatios.includes(aspectRatio) ? aspectRatio : "3:4";
    // console.log(`🎨 Generating Image (${finalRatio}) - Prompt length: ${prompt.length}`);

    // Try Primary Model (NanoBanana Pro)
    try {
        // console.log(`🚀 Attempting Primary Model: ${MODEL_IMAGE_GEMINI}`);
        return await generateContentWithModel(MODEL_IMAGE_GEMINI, prompt, apiKey, finalRatio, referenceImages);
    } catch (primaryError: any) {
        console.warn(`⚠️ Primary Model Failed (${primaryError.message}). Switching to Backup...`);

        // Try Backup Model (Gemini 2.0 Flash)
        try {
            // console.log(`🛡️ Attempting Backup Model: ${MODEL_IMAGE_BACKUP}`);
            return await generateContentWithModel(MODEL_IMAGE_BACKUP, prompt, apiKey, finalRatio, referenceImages);
        } catch (backupError: any) {
            // If all models fail, return fallback instead of throwing
            console.error(`❌ All models failed. Primary: ${primaryError.message} | Backup: ${backupError.message}`);
            console.error("All models failed. Returning fallback image.", backupError);
            return createFallbackImage("AI Busy");
        }
    }
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
    const productName = kb.structuredAnalysis?.productName || "Producto Digital";

    // Limpiar hook para renderizado perfecto
    const cleanHook = hook.replace(/"/g, '').replace(/\.$/, '').toUpperCase().substring(0, 50);

    let brandingInstructions = "";
    let refIndex = 1;

    if (branding.personalPhoto && branding.includeFace) {
        brandingInstructions += `\n- REFERENCE IMAGE ${refIndex}: Esta es la CARA del experto/fundador. La persona principal de la imagen debe verse EXACTAMENTE como esta referencia. Preservá la identidad facial al 100%.`;
        refIndex++;
    }

    if (branding.logo) {
        brandingInstructions += `\n- REFERENCE IMAGE ${refIndex}: Este es el LOGO de la marca. Ubicalo sutilmente en la esquina superior izquierda. Estilo: Escudo/Shield con diseño premium.`;
        refIndex++;
    }

    if (branding.productMockup) {
        brandingInstructions += `\n- REFERENCE IMAGE ${refIndex}: Este es el MOCKUP del producto. Si aparece un producto en la imagen, debe verse EXACTAMENTE así.`;
        refIndex++;
    }

    return `
ROLE: Eres un Prompt Engineer especializado en generación de INFOGRAFÍAS PUBLICITARIAS de alta conversión.

TASK: Crear una infografía publicitaria viral para "${productName}".

═══════════════════════════════════════════════════════════
STYLE REFERENCE: INFOGRAFÍAS DE ALTO IMPACTO (ESTILO EXACTO)
═══════════════════════════════════════════════════════════


${variationInstruction ? `⚡ VARIACIÓN SOLICITADA: ${variationInstruction}\n` : ''}

## 1. ESTILO Y DIRECCIÓN CREATIVA (VITAL)
"Al final son creativos, tiene que tener una gran creatividad."

🚨 **NO USAR SIEMPRE EL MISMO DISEÑO.** ROMPER PATRONES.
El objetivo es detener el scroll (Scroll-Stopping).

**CARACTERÍSTICAS DINÁMICAS (VARÍA ESTOS ELEMENTOS):**
- **Composición**: NO pongas siempre a la persona en el centro. Probá: Regla de tercios, Ángulo holandés, Primerísimos primeros planos, o Perspectiva desde abajo (Hero).
- **Fondo**: NO usar siempre gradientes oscuros. Probá: Entornos 3D abstractos, Texturas de papel, Oficina moderna luminosa, Paisajes urbanos neon, o Minimalismo sólido.
- **Iluminación**: Variar entre: Luz de estudio suave, Contraste alto (dramático), Neón cyberpunk, o Luz natural cálida (Golden hour).

## 2. COMPOSICIÓN (SI HAY PERSONA)
${branding.personalPhoto ? `
- **Persona real** interactuando con los elementos (señalando, sosteniendo, reaccionando).
- EVITAR la pose estática de "brazos cruzados" si es posible. Buscar dinamismo.
- Integración natural con el fondo (Depth of Field).
` : '- Usar silueta profesional o Avatar 3D estilizado si el ángulo lo requiere, o enfocar en TIPOGRAFÍA 3D masiva.'}

## 3. HEADLINE HERO (TEXTO EXACTO - CERO ERRORES)

RENDERIZAR ESTE TEXTO EXACTAMENTE: "${cleanHook}"

REGLAS DE TIPOGRAFÍA:
- Fuente: Sans-serif MASIVA (Inter Black, Impact, o similar)
- Color: Alto contraste (Blanco, Amarillo Neón, o Cyan según fondo)
- Tamaño: GRANDE, ocupando espacio visual importante (30-50% del frame)
- Posición: Integrada con la imagen (detrás de la persona, flotando en 3D, o envolvente)
- Efectos permitidos: Sombra 3D, Glow, Textura metálica, o Sticker style.
- Tildes correctas (á, é, í, ó, ú)
- NO errores ortográficos

## 4. ELEMENTOS INFOGRÁFICOS (SEGÚN ÁNGULO)

${angleVisuals.toLowerCase().includes('paso') || angleVisuals.toLowerCase().includes('step') || angleVisuals.toLowerCase().includes('roadmap') ? `
🔹 ESTILO TIMELINE / PROCESO:
- No hacer un diagrama aburrido. Hacerlo inmersivo.
- Pasos flotando en el espacio 3D.
- Conectores de luz o energía.
` : ''}

${angleVisuals.toLowerCase().includes('compar') || angleVisuals.toLowerCase().includes('vs') || angleVisuals.toLowerCase().includes('versus') ? `
🔹 ESTILO VS / COMPARACIÓN:
- Contraste visual EXTREMO entre los dos lados.
- Lado "Malo": Desaturado, caótico, rojo/gris.
- Lado "Bueno": Vibrante, ordenado, verde/dorado.
- Separación física o rotura en el medio.
` : ''}

## 5. BRANDING INTELLIGENCE
${brandingInstructions || '- Integrar paleta de colores de forma artística, no forzada.'}

## 6. ESPECIFICACIONES TÉCNICAS
- **Aspect Ratio**: ${aspectRatio}
- **Resolución**: 8K, Ultra Detailed
- **Engine Options (Mix & Match)**: Unreal Engine 5, Octane Render, Blender 3D, Photography, Mixed Media.
- **Colores primarios**: ${primaryColor} / ${secondaryColor}

## 7. CONCEPTO VISUAL ESPECÍFICO (EL GUIÓN)
${angleVisuals}

═══════════════════════════════════════════════════════════
OUTPUT: Una imagen publicitaria CREATIVA, ÚNICA y de ALTO IMPACTO. NO HAGAS SIEMPRE LO MISMO.
═══════════════════════════════════════════════════════════
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
    variationType: string = "",
    referenceImage?: string
): Promise<string> => {

    if (!keys.google) throw new Error("Falta la Google API Key.");

    // Prepare reference images
    const references: { data: string, mimeType: string }[] = [];

    // If we have a reference image (e.g. for variations), add it first as high priority
    if (referenceImage) {
        // Strip prefix if present
        const cleanRef = referenceImage.replace(/^data:image\/\w+;base64,/, "");
        references.push({ data: cleanRef, mimeType: 'image/png' });
    }

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
    // console.log(`🎨 Requesting generation with Gemini (Variation: ${!!variationType})`);
    return await generateWithGemini(finalPrompt, keys.google, aspectRatio, references);
};
