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

## 1. COMPOSICIÓN CENTRAL (HERO SHOT)
- **Persona real** como elemento central de la imagen
- La persona mira directamente a cámara con expresión **confiada/seria/profesional**
- Posición: Centro de la imagen, ocupando 40-60% del frame
- Pose: Brazos cruzados sobre mesa, o pose de "experto pensando"
- **FONDO**: Gradiente oscuro azul-morado (#1a1a2e → #16213e) + setup de oficina/monitors difuminado
- **ILUMINACIÓN**: Luz de estudio profesional, contraste cinematográfico, rim light suave

## 2. HEADLINE HERO (TEXTO EXACTO - CERO ERRORES)

RENDERIZAR ESTE TEXTO EXACTAMENTE: "${cleanHook}"

REGLAS DE TIPOGRAFÍA:
- Fuente: Sans-serif MASIVA (estilo Inter Black, Outfit Extra Bold)
- Color: Blanco puro (#FFFFFF) 
- Tamaño: ENORME, ocupando 30-40% del ancho
- Posición: Centro-superior, envolviendo a la persona
- Drop shadow sutil para máximo contraste
- Tildes correctas (á, é, í, ó, ú)
- NO inventar texto adicional
- NO errores ortográficos

## 3. ELEMENTOS INFOGRÁFICOS (según el concepto)

${angleVisuals.toLowerCase().includes('paso') || angleVisuals.toLowerCase().includes('step') || angleVisuals.toLowerCase().includes('roadmap') ? `
🔹 TIPO: TIMELINE / ROADMAP
- Timeline horizontal en la parte inferior
- 4-7 pasos con conectores de línea gradiente (azul → cyan)
- Cada paso: Círculo con checkmark ✓ + texto corto (Día 1, Día 3, etc.)
- Último paso: Ícono de IA/cerebro brillante como "meta final"
- Checkmarks con glow verde/cyan
- Estilo: Glassmorphism con blur sutil
` : ''}

${angleVisuals.toLowerCase().includes('compar') || angleVisuals.toLowerCase().includes('vs') || angleVisuals.toLowerCase().includes('versus') ? `
🔹 TIPO: COMPARACIÓN / CARDS
- 3 cards flotantes en perspectiva 3D (ligeramente inclinadas)
- Card IZQUIERDA: Roja con ❌ (Lo malo/El problema)
- Card CENTRO: Amarilla con ❓ (La duda/Lo común)
- Card DERECHA: Verde brillante con ✅ (La solución)
- Cada card: Texto corto de 2-3 palabras + ícono
- Efecto: Hover/floating con sombra suave
- Borde con glow del color respectivo
` : ''}

${angleVisuals.toLowerCase().includes('kit') || angleVisuals.toLowerCase().includes('herramienta') || angleVisuals.toLowerCase().includes('tool') ? `
🔹 TIPO: KIT / HERRAMIENTAS
- 4 cards en fila horizontal
- Cada card: Ícono holográfico/neon + Nombre corto
- Ejemplos: "Plantillas", "Workflows", "Checklist", "Ruta"
- Estilo: Cards con borde verde/cyan brillante
- Efecto 3D con perspectiva ligera
` : ''}

## 4. BADGES DE CREDIBILIDAD
- **Posición**: Esquinas inferiores (izq y der)
- **Estilo**: Metálico/plateado con borde sutil
- **Ejemplos**:
  - "ANTI-HUMO CERTIFICADO" (escudo + check)
  - "STACK NO-CODE" (badge hexagonal)
  - "RESULTADOS COMPROBADOS" (estrella)
  - "GARANTIZADO" (sello)

## 5. BRANDING INTELLIGENCE
${brandingInstructions || '- No se proporcionaron assets de branding. Usar diseño genérico premium.'}

## 6. ESPECIFICACIONES TÉCNICAS
- **Aspect Ratio**: ${aspectRatio}
- **Resolución**: 8K render quality
- **Engine Style**: Unreal Engine 5 / Octane quality
- **Efectos**: Glassmorphism, bloom suave, depth of field sutil
- **Safe Zones**: Dejar márgenes arriba/abajo para social media
- **Colores primarios**: ${primaryColor} / ${secondaryColor}

## 7. CONCEPTO VISUAL DEL ÁNGULO
${angleVisuals}

═══════════════════════════════════════════════════════════
OUTPUT: Una infografía publicitaria fotorrealista, de calidad profesional, lista para usar como ad en Meta/TikTok.
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
