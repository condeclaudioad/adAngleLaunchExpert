
import { GoogleGenAI, Type } from "@google/genai";
import mammoth from "mammoth";
import { Angle, KnowledgeBase, ImageAnalysis, StructuredContext } from "../types";
import { MODEL_ANALYSIS, MODEL_TEXT, SYSTEM_PROMPT } from "../constants";
import { withRetry } from "./retryService";

// Helper to get the key from storage or env
const getAuthKey = () => {
    return localStorage.getItem('le_api_key') || process.env.API_KEY || "";
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

export const extractTextFromFile = async (base64Data: string, mimeType: string): Promise<string> => {
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
        const ai = new GoogleGenAI({ apiKey: getAuthKey() });

        // TIMEOUT: Reduced to 60s for extraction to fail fast
        const timeoutPromise = new Promise<string>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout: File extraction took too long")), 60000)
        );

        const genPromise = (async () => {
            const response = await ai.models.generateContent({
                model: MODEL_TEXT,
                contents: {
                    parts: [
                        { inlineData: { data: base64Data, mimeType: mimeType } },
                        { text: "Return ONLY the text extracted from this document. No comments." }
                    ]
                },
                config: { thinkingConfig: { thinkingBudget: 0 } }
            });
            return response.text || "";
        })();

        return Promise.race([genPromise, timeoutPromise]);
    }, { maxRetries: 2, baseDelay: 1000, maxDelay: 5000 });
};

export const refineContext = async (rawText: string): Promise<StructuredContext> => {

    if (!rawText || rawText.length < 50) return FALLBACK_CONTEXT;

    const truncatedText = rawText.slice(0, 400000);
    const ai = new GoogleGenAI({ apiKey: getAuthKey() });

    return withRetry(async () => {
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout: Analysis took too long")), 90000)
        );

        const genPromise = ai.models.generateContent({
            model: MODEL_TEXT,
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

        const response = await Promise.race([genPromise, timeoutPromise]) as any;
        // Fallback to default if it fails, don't block user
        return safeJSONParse(response.text, FALLBACK_CONTEXT);
    }, { maxRetries: 2, baseDelay: 1000, maxDelay: 5000 });
};

export const analyzeImage = async (base64Image: string, mimeType: string): Promise<ImageAnalysis> => {
    const ai = new GoogleGenAI({ apiKey: getAuthKey() });

    return withRetry(async () => {
        const timeoutPromise = new Promise<ImageAnalysis>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout: Image analysis")), 60000)
        );

        const genPromise = (async () => {
            // Prepare parts for the new SDK format which is more stable
            // Instead of complex object structure, pass simpler array of parts
            const promptText = "Analyze this high-performing ad. Break down why it works into JSON with the following structure: angleDetected, visualElements (array), copy, colors (array), composition, emotions (array).";

            const response = await ai.models.generateContent({
                model: MODEL_ANALYSIS,
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
                    // thinkingConfig: { thinkingBudget: 0 }, // Removed to avoid potential conflicts with vision models
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
            return safeJSONParse(response.text || "{}", {
                angleDetected: "Desconocido",
                visualElements: [],
                copy: "",
                colors: [],
                composition: "",
                emotions: []
            });
        })();

        return Promise.race([genPromise, timeoutPromise]);
    }, { maxRetries: 2, baseDelay: 1000 });
};

export const generateAngles = async (
    kb: KnowledgeBase,
    analysisContext: ImageAnalysis[],
    existingAngles: Angle[] = []
): Promise<Angle[]> => {
    const ai = new GoogleGenAI({ apiKey: getAuthKey() });

    const rawContextSnippet = kb.generalContext ? kb.generalContext.slice(0, 50000) : "Contexto genérico de marketing.";

    let historyInstruction = "";
    if (existingAngles && existingAngles.length > 0) {
        // Safety check: ensure existingAngles elements are valid
        const validAngles = existingAngles.filter(a => a && a.name && a.hook);
        const historyList = validAngles.slice(-20).map(a => `- ${a.name}: "${a.hook}"`).join('\n');

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
    TASK: Generate High-Converting Advertising Angles (Direct Response).
    
    PRODUCT CONTEXT:
    "${rawContextSnippet}..."
    
    ${visualInstructions}
    
    ${historyInstruction}

    OUTPUT FORMAT:
    Return a STRICT JSON ARRAY. No markdown code blocks, just the raw JSON.
    Example:
    [
      {
        "name": "The Mechanism Reveal",
        "description": "Explaining the unique way it works",
        "hook": "Por fin revelado: El secreto...",
        "emotion": "Curiosity",
        "visuals": "A split screen showing..."
      }
    ]
  `;

    return withRetry(async () => {
        // 2 minutes max
        const timeoutPromise = new Promise<Angle[]>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout: Angle generation")), 120000)
        );

        const genPromise = (async () => {
            const response = await ai.models.generateContent({
                model: MODEL_TEXT,
                contents: prompt,
                config: {
                    systemInstruction: SYSTEM_PROMPT,
                    responseMimeType: "application/json",
                    // Removed strict responseSchema here to allow more creative freedom and prevent 500s on complex history injection.
                    // We rely on the prompt + safeJSONParse.
                }
            });

            // Pass NULL as fallback to force an error if parsing fails, 
            // so the UI knows something went wrong instead of failing silently with [].
            const parsed = safeJSONParse(response.text, null);

            return parsed.map((a: any, index: number) => ({
                ...a,
                id: `angle-${Date.now()}-${index}`,
                selected: true
            }));
        })();

        return Promise.race([genPromise, timeoutPromise]);
    }, { maxRetries: 2, baseDelay: 2000 });
};
