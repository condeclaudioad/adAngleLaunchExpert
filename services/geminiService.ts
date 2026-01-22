
import { GoogleGenAI, Type } from "@google/genai";
import mammoth from "mammoth";
import { Angle, KnowledgeBase, ImageAnalysis, StructuredContext } from "../types";
import { MODEL_ANALYSIS, MODEL_TEXT, SYSTEM_PROMPT, MODEL_TEXT_BACKUP } from "../constants";
import { withRetry } from "./retryService";
import { saveAnalysisToDb, saveAngleToDb, getExistingAngles } from "./dbService";

// Helper to get the key from storage or env
const getAuthKey = (overrideKey?: string) => {
    const key = overrideKey || localStorage.getItem('le_api_key') || process.env.API_KEY || "";
    if (!key) throw new Error("API Key no encontrada. Por favor configura tu API en los Ajustes.");
    return key;
};

const cleanJSON = (text: string) => {
    // 1. Try to find markdown code block first (json or generic)
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
        return codeBlockMatch[1].trim();
    }

    // 2. Try to find the outer-most JSON Array (Priority for lists)
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
        return arrayMatch[0];
    }

    // 3. Try to find the outer-most JSON Object
    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) {
        return objectMatch[0];
    }

    // 4. Fallback: just return the text (maybe already clean)
    return text.trim();
};

const safeJSONParse = <T>(text: string, fallback: T | null = null): T => {
    try {
        if (!text) throw new Error("Empty text");
        const cleaned = cleanJSON(text);
        return JSON.parse(cleaned) as T;
    } catch (e) {
        console.warn("JSON Parse Warning:", e);
        console.log("Failed Text:", text);
        if (fallback !== null) return fallback;
        throw new Error("La IA no generó un formato válido. Intenta de nuevo.");
    }
};

const FALLBACK_CONTEXT: StructuredContext = {
    productName: "Producto Digital",
    avatar: "Emprendedor buscando transformación",
    mechanismOfProblem: "Métodos tradicionales ineficientes",
    uniqueMechanism: "Sistema Paso a Paso",
    bigPromise: "Resultados Garantizados"
};

// SHARED GENERATION HELPER WITH FALLBACK
const generateSafeContent = async (
    apiKey: string,
    primaryModel: string,
    backupModel: string,
    params: any
) => {
    const ai = new GoogleGenAI({ apiKey });

    try {
        // Try Primary
        const response = await ai.models.generateContent({
            model: primaryModel,
            ...params
        });
        return response;
    } catch (error: any) {
        const isQuota = error.message?.includes('429') || error.message?.includes('quota');
        const isOverloaded = error.message?.includes('503');

        if (isQuota || isOverloaded) {
            console.warn(`⚠️ Model ${primaryModel} failed (${error.message}). Switching to backup ${backupModel}...`);
            try {
                // Try Backup
                const response = await ai.models.generateContent({
                    model: backupModel,
                    ...params
                });
                return response;
            } catch (backupError: any) {
                console.error(`❌ Backup Model ${backupModel} also failed:`, backupError);
                throw error; // Throw original error or backup error? Throw original usually better context, or backup to show we tried.
            }
        }
        throw error;
    }
};

export const extractTextFromFile = async (base64Data: string, mimeType: string, apiKey?: string): Promise<string> => {
    // 1. Local Decoding (Instant)
    if (mimeType === 'text/plain' || mimeType === 'text/markdown' || mimeType === 'application/json' || mimeType === 'text/csv') {
        try {
            return window.atob(base64Data);
        } catch (e) {
            console.error("Local text decode failed", e);
        }
    }

    // 2. Mammoth for DOCX (Local, Instant)
    if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        try {
            const binaryString = window.atob(base64Data);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const result = await mammoth.extractRawText({ arrayBuffer: bytes.buffer });
            return result.value || "";
        } catch (e) {
            console.error("Mammoth failed", e);
        }
    }

    // 3. Gemini Flash for PDF/Images (Fast Transcription)
    return withRetry(async () => {
        const key = getAuthKey(apiKey);

        // TIMEOUT: Reduced to 60s for extraction to fail fast
        const timeoutPromise = new Promise<string>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout: File extraction took too long")), 60000)
        );

        const genPromise = (async () => {
            const response = await generateSafeContent(key, MODEL_TEXT, MODEL_TEXT_BACKUP, {
                contents: {
                    parts: [
                        { inlineData: { data: base64Data, mimeType: mimeType } },
                        { text: "Return ONLY the text extracted from this document. No comments." }
                    ]
                },
                config: { thinkingConfig: { thinkingBudget: 0 } }
            });

            // @ts-ignore
            const text = typeof response.text === 'function' ? response.text() : response.text;
            return text || "";
        })();

        return Promise.race([genPromise, timeoutPromise]);
    }, { maxRetries: 4, baseDelay: 3000, maxDelay: 10000 });
};

export const refineContext = async (rawText: string, apiKey?: string): Promise<StructuredContext> => {

    if (!rawText || rawText.length < 50) return FALLBACK_CONTEXT;

    const truncatedText = rawText.slice(0, 400000);
    const key = getAuthKey(apiKey);

    return withRetry(async () => {
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout: Analysis took too long")), 90000)
        );

        const genPromise = (async () => {
            const response = await generateSafeContent(key, MODEL_TEXT, MODEL_TEXT_BACKUP, {
                contents: [{ role: 'user', parts: [{ text: `CONTEXT:\n"${truncatedText}"\n\nTASK: Analyze and extract the marketing structure.` }] }],
                config: {
                    systemInstruction: "You are a marketing analyst. Extract the Avatar, Problem, Mechanism, and Promise. Be concise.",
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            productName: { type: Type.STRING },
                            avatar: { type: Type.STRING },
                            mechanismOfProblem: { type: Type.STRING },
                            uniqueMechanism: { type: Type.STRING },
                            bigPromise: { type: Type.STRING },
                        },
                        required: ["productName", "avatar", "mechanismOfProblem", "uniqueMechanism", "bigPromise"]
                    }
                }
            });
            return response;
        })();

        const response = await Promise.race([genPromise, timeoutPromise]) as any;
        // Fallback to default if it fails, don't block user
        // @ts-ignore
        const text = typeof response.text === 'function' ? response.text() : response.text;
        return safeJSONParse(text, FALLBACK_CONTEXT);
    }, { maxRetries: 4, baseDelay: 3000, maxDelay: 10000 });
};

export const analyzeImage = async (base64Image: string, mimeType: string, apiKey?: string): Promise<ImageAnalysis> => {
    const key = getAuthKey(apiKey);

    return withRetry(async () => {
        const timeoutPromise = new Promise<ImageAnalysis>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout: Image analysis")), 60000)
        );

        const genPromise = (async () => {
            const promptText = `
            ROLE: Elite Visual Ad Analyst especializado en Infografías Publicitarias de Alto Impacto.
            
            TASK: Convertí esta imagen publicitaria a una estructura JSON precisa describiendo todos sus componentes de marketing.
            
            TÉCNICA IMAGE-TO-JSON:
            Analizá la imagen como si fuera un blueprint de diseño y extraé:
            
            1. angleDetected: ¿Cuál es el mecanismo visual principal?
               - "Person Centered" (persona como hero central)
               - "Split Screen Comparison" (comparación lado a lado)
               - "Timeline/Roadmap" (pasos o proceso)
               - "Cards/Grid" (cards flotantes con beneficios)
               - "Before/After" (transformación visual)
               - "Infographic Data" (estadísticas visuales)
            
            2. visualElements: Lista ESPECÍFICA de 5-8 elementos visuales:
               - Elementos de información (timeline, cards, badges, checkmarks)
               - Elementos de diseño (gradientes, glassmorphism, glow effects)
               - Elementos de branding (logo, escudos, certificaciones)
               - Elementos de prueba social (estrellas, números, testimonios)
            
            3. copy: Extraé el texto EXACTO del headline principal (ortografía perfecta).
            
            4. colors: Códigos HEX de los 3-5 colores dominantes.
            
            5. composition: Descripción de la composición:
               - Posición de la persona (centro, izquierda, derecha, fondo)
               - Posición de elementos informativos (abajo, overlay, lados)
               - Tipo de fondo (gradiente oscuro, foto blur, sólido)
               - Estilo de iluminación (studio, cinematográfico, natural)
            
            6. emotions: 2-3 emociones que evoca (urgencia, confianza, FOMO, autoridad, aspiración).
            
            7. infographicStyle: Estilo específico de los elementos infográficos:
               - "3D Rendered Cards" (cards con perspectiva 3D)
               - "Flat Minimal Icons"
               - "Glassmorphism UI"
               - "Neon Glow Effects"
               - "Metallic Badges"
            
            OUTPUT: JSON válido con todos los campos.
            `;

            const response = await generateSafeContent(key, MODEL_ANALYSIS, MODEL_TEXT_BACKUP, {
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: promptText },
                            { inlineData: { data: base64Image, mimeType: mimeType } }
                        ]
                    }
                ],
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            angleDetected: { type: Type.STRING },
                            visualElements: { type: Type.ARRAY, items: { type: Type.STRING } },
                            copy: { type: Type.STRING },
                            colors: { type: Type.ARRAY, items: { type: Type.STRING } },
                            composition: { type: Type.STRING },
                            emotions: { type: Type.ARRAY, items: { type: Type.STRING } },
                        },
                        required: ["angleDetected", "visualElements", "copy", "colors", "composition", "emotions"]
                    }
                }
            });

            // Fallback for image analysis
            const fallback: ImageAnalysis = {
                id: crypto.randomUUID(),
                imageId: 'unknown',
                role: 'inspiration',
                angleDetected: "Desconocido",
                visualElements: [],
                copy: "",
                colors: [],
                composition: "",
                emotions: [],
                timestamp: Date.now()
            };
            // @ts-ignore
            const text = typeof response.text === 'function' ? response.text() : response.text;
            const parsed = safeJSONParse(text || "{}", fallback);

            // Ensure ID and timestamp are always present
            return {
                ...parsed,
                id: parsed.id || crypto.randomUUID(),
                timestamp: parsed.timestamp || Date.now()
            };
        })();

        const result = await Promise.race([genPromise, timeoutPromise]);

        // Save to DB asynchronously (fire and forget)
        saveAnalysisToDb(result).catch(err => console.error("Failed to save analysis background:", err));

        return result;
    }, { maxRetries: 4, baseDelay: 3000 });
};

export const generateAngles = async (
    kb: KnowledgeBase,
    analysisContext: ImageAnalysis[],
    existingAngles: Angle[] = [],
    apiKey?: string
): Promise<Angle[]> => {
    const key = getAuthKey(apiKey);

    const rawContextSnippet = kb.generalContext ? kb.generalContext.slice(0, 50000) : "Contexto genérico de marketing.";

    // 1. Fetch DB History
    const dbAngles = await getExistingAngles();

    // 2. Combine with session angles (deduplicate by Hook)
    const combinedHistory = [...(existingAngles || []), ...dbAngles];
    const uniqueHistory = new Map();
    combinedHistory.forEach(a => {
        if (a && a.hook) uniqueHistory.set(a.hook.toLowerCase().trim(), a);
    });
    const finalHistory = Array.from(uniqueHistory.values());

    let historyInstruction = "";
    if (finalHistory.length > 0) {
        // Safety check: ensure existingAngles elements are valid
        const historyList = finalHistory.slice(-50).map((a: any) => `- ${a.name}: "${a.hook}"`).join('\n');

        historyInstruction = `
      IMPORTANT - HISTORY AWARENESS:
      I have already generated these angles:
      ${historyList}

      INSTRUCTION: 
      - DO NOT repeat the hooks above word-for-word.
      - You MAY create a new variation of a concept if the angle is strong.
      - Generate 5-10 NEW, FRESH angles.
      `;
    }

    let visualInstructions = "";
    if (analysisContext.length > 0) {
        visualInstructions = `
      ADAPT WINNING PATTERNS (JSON):
      ${JSON.stringify(analysisContext.slice(0, 3), null, 2)}
      
      Use these visual elements (colors, composition) in your 'visuals' prompt.
      `;
    }

    const prompt = `
    CONTEXTO DEL PRODUCTO/SERVICIO:
    "${rawContextSnippet}..."
    
    ${visualInstructions}
    
    ${historyInstruction}

    ═══════════════════════════════════════════════════════════
    PROCESO DE GENERACIÓN DE ÁNGULOS DE VENTA
    ═══════════════════════════════════════════════════════════

    FASE 1: INVESTIGACIÓN SIMULADA (Procesamiento Interno)
    Actuá como si hubieras pasado 100 horas analizando:
    - Reseñas de 1★ de la competencia (para encontrar dolores)
    - Reseñas de 5★ (para encontrar "Momentos Ah-Ha")
    - Hilos de Reddit, comentarios de TikTok y foros del nicho
    
    Identificá internamente:
    • 10 dolores actuales del día a día del avatar
    • 10 deseos/transformaciones que buscan
    • 10 objeciones típicas antes de comprar
    • 5 creencias erróneas ("cree que X pero en realidad Y")
    • 5 métricas que el negocio puede mejorar (%, horas, $, conversión)

    FASE 2: GENERACIÓN DE ÁNGULOS
    Con esa base, generá 8-12 ángulos NUEVOS y DISTINTOS distribuidos en las 5 familias:
    
    🔴 PROBLEMA/DOLOR (2-3 ángulos)
    - Frustraciones del día a día
    - "Estoy harto de..."
    
    🟢 DESEO/TRANSFORMACIÓN (2-3 ángulos)
    - El futuro ideal post-compra
    - "Imaginate poder..."
    
    🔵 AUTORIDAD/PRUEBA (1-2 ángulos)
    - Credibilidad, resultados, números
    - "X clientes ya lograron..."
    
    🟡 CONEXIÓN/IDENTIDAD (1-2 ángulos)
    - Hacer que se sientan comprendidos
    - "Si sos de los que..."
    
    🟣 HISTORIA/NARRATIVA (1-2 ángulos)
    - Historias con arco emocional
    - "Hace 2 años yo estaba..."

    ═══════════════════════════════════════════════════════════
    FORMATO DE SALIDA (JSON ARRAY ESTRICTO)
    ═══════════════════════════════════════════════════════════
    
    Cada objeto debe tener:
    - "family": Una de ["Problema", "Deseo", "Autoridad", "Conexión", "Historia"]
    - "name": Nombre corto del ángulo (máx 6 palabras, ej: "El Matador de Agencias")
    - "description": El INSIGHT central + por qué funciona este ángulo (2-3 oraciones)
    - "hook": Hook scroll-stopper para Reel (máx 10 palabras, punzante)
    - "emotion": Emoción primaria (Miedo, Codicia, Urgencia, Curiosidad, Orgullo, Frustración)
    - "visuals": Descripción visual EN INGLÉS para generar infografía (composición, elementos, estilo)
    - "adCopy": Primary Text del ad con estructura: 
       1. LEAD (2 líneas, curiosidad)
       2. BRIDGE (contexto del problema)
       3. BULLETS (3-4 beneficios con emojis)
       4. SOCIAL PROOF (1 línea)
       5. CTA
       CRÍTICO: NO repetir el hook en el copy.
    - "beliefBreak": "El prospecto cree que... pero en realidad..." (1 oración)
    - "whatsappClose": Argumento de cierre por WhatsApp (máx 2 líneas directas)
    - "intensity": Puntuación 1-10 de qué tan fuerte es para vender YA

    EJEMPLO:
    [
      {
        "family": "Problema",
        "name": "El Matador de Agencias",
        "description": "Los usuarios se quejan de que las agencias cobran $2000/mes por trabajo que pueden hacer solos. Este ángulo capitaliza esa frustración.",
        "hook": "Tu agencia te está robando",
        "emotion": "Frustración",
        "visuals": "Split screen. Left side: Red-tinted invoice showing $2000/month with angry emoji. Right side: Green-tinted app interface showing $49/month with happy checkmark. Professional lighting, infographic style.",
        "adCopy": "¿Cuánto te cobra tu agencia por mes? 💸\\n\\nSi la respuesta es más de $500, seguí leyendo...\\n\\n✅ Hacelo vos mismo en 5 minutos\\n✅ Ahorrá +$20,000 al año\\n✅ Sin contratos de por vida\\n✅ Calidad profesional garantizada\\n\\n+2,400 negocios ya hicieron el cambio.\\n\\n👉 Probalo gratis hoy.",
        "beliefBreak": "El prospecto cree que necesita una agencia para verse profesional, pero en realidad las herramientas actuales lo hacen mejor y más barato.",
        "whatsappClose": "Mirá, si seguís pagando $2000/mes a tu agencia, en un año son $24,000. Con esto lo hacés vos en 5 min. ¿Te muestro cómo?",
        "intensity": 9
      }
    ]
  `;


    return withRetry(async () => {
        // 2 minutes max
        const timeoutPromise = new Promise<Angle[]>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout: Angle generation")), 120000)
        );

        const genPromise = (async () => {
            const response = await generateSafeContent(key, MODEL_TEXT, MODEL_TEXT_BACKUP, {
                contents: prompt,
                config: {
                    systemInstruction: SYSTEM_PROMPT,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                family: { type: Type.STRING },
                                name: { type: Type.STRING },
                                description: { type: Type.STRING },
                                hook: { type: Type.STRING },
                                emotion: { type: Type.STRING },
                                visuals: { type: Type.STRING },
                                adCopy: { type: Type.STRING },
                                beliefBreak: { type: Type.STRING },
                                whatsappClose: { type: Type.STRING },
                                intensity: { type: Type.NUMBER },
                            },
                            required: ["family", "name", "description", "hook", "emotion", "visuals", "adCopy", "beliefBreak", "whatsappClose", "intensity"]
                        }
                    }
                }
            });

            // Pass NULL as fallback to force an error if parsing fails, 
            // so the UI knows something went wrong instead of failing silently with [].
            // @ts-ignore
            const text = typeof response.text === 'function' ? response.text() : response.text;
            const parsed = safeJSONParse(text, null);

            if (!parsed) return []; // Handle null fallback

            const newAngles = parsed.map((a: any) => ({
                ...a,
                id: crypto.randomUUID(), // Generate valid UUID for Supabase
                selected: true
            }));

            // Save NEW angles to DB
            newAngles.forEach((angle: Angle) => {
                saveAngleToDb(angle).catch(e => console.error("Background save angle failed", e));
            });

            return newAngles;
        })();

        return Promise.race([genPromise, timeoutPromise]);
    }, { maxRetries: 5, baseDelay: 4000 });
};
