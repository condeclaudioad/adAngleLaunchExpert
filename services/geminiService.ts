
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
    return text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```$/i, '')
        .trim();
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
            const promptText = "Analyze this high-performing ad. Break down why it works into JSON with the following structure: angleDetected, visualElements (array), copy, colors (array), composition, emotions (array).";

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
                        }
                    }
                }
            });

            // Fallback for image analysis
            const fallback: ImageAnalysis = {
                id: `analysis-${Date.now()}`,
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
            return safeJSONParse(text || "{}", fallback);
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
    ROLE: Elite Market Researcher & Direct Response Strategist (Specialized in Digital Products).
    
    PRODUCT CONTEXT:
    "${rawContextSnippet}..."
    
    ${visualInstructions}
    
    ${historyInstruction}

    TASK: Perform a deep "Simulated Market Research" to find the most profitable, untapped marketing angles for this product.
    
    PHASE 1: RESEARCH SIMULATION (Internal Processing)
    Act as if you are browsing G2, Capterra, Reddit (specific subreddits), TikTok comments, and niche communities.
    1. Identify "Ah-ha" moments: specific realizations users have when the product clicks.
    2. Find bottlenecks/frustrations with current alternatives (e.g., "manual work", "expensive tools", "overwhelming courses").
    3. Detect "Unexpected Use Cases": Is the product being used for something nimble?
    4. look for "Comparison gaps": What is this product replacing? (e.g. "Better than hiring an agency").

    PHASE 2: ANGLE GENERATION
    Based on the research, generate 4-6 HIGH-CONVERTING AD ANGLES.
    Each angle must be distinct (e.g., one about ROI, one about Ease of Use, one about "The Mechanism", one "Us vs Them").

    OUTPUT FORMAT (STRICT JSON ARRAY):
    Return a JSON ARRAY where:
    - "name": The Angle Name (e.g., "The 'Lazy' Way", "The Agency Killer").
    - "description": The EVIDENCE/LOGIC. Why this angle works. Summarize the "simulated research" findings here.
    - "hook": A punchy, scroll-stopping headline (Direct Response style). Max 10 words.
    - "emotion": The primary emotion.
    - "visuals": Detailed visual description for the image generator (Infographic style: "Split screen...", "Roadmap...").
    - "adCopy": The "Primary Text" (Caption) for the ad. MUST follow this structure:
       1. THE LEAD (2 lines, curiosity hook).
       2. THE BRIDGE (Contextualize problem).
       3. BULLETS (3-4 Benefits with emojis).
       4. SOCIAL PROOF (1 line).
       5. CTA.
       CRITICAL: DO NOT repeat the "hook" text in the copy. If image is "HOW", copy sells "WHY".

    Example:
    [
      {
        "name": "The 'Agency Killer' Angle",
        "description": "Users complain agencies are expensive. This positions tool as cheaper alternative.",
        "hook": "Despide a tu agencia hoy",
        "emotion": "Empowerment",
        "visuals": "Split screen. Left: Invoice ($2000). Right: Tool ($49).",
        "adCopy": "Tu agencia te está cobrando por aire 💨\\n\\n¿Por qué pagar $2k/mes cuando puedes hacerlo tú mismo en 5 min?\\n\\n✅ Ahorra $24,000 al año\\n✅ Sin contratos forzosos\\n✅ Calidad Pro\\n\\n👉 Úsalo gratis aquí."
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
                }
            });

            // Pass NULL as fallback to force an error if parsing fails, 
            // so the UI knows something went wrong instead of failing silently with [].
            // @ts-ignore
            const text = typeof response.text === 'function' ? response.text() : response.text;
            const parsed = safeJSONParse(text, null);

            if (!parsed) return []; // Handle null fallback

            const newAngles = parsed.map((a: any, index: number) => ({
                ...a,
                id: `angle-${Date.now()}-${index}`, // temporary ID until saved? Or just keep this.
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
