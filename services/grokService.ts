// services/grokService.ts - NUEVO ARCHIVO

import { MasterCreative, GrokVariation, GeneratedImage } from '../types';
import { MODEL_IMAGE_GROK, VARIATION_CONFIG } from '../constants';

// ═══════════════════════════════════════════════════════════
// GROK API CONFIGURATION
// ═══════════════════════════════════════════════════════════

const GROK_API_BASE = 'https://api.x.ai/v1';

interface GrokImageRequest {
    model: string;
    prompt: string;
    n: number;
    size: string;
    response_format: 'url' | 'b64_json';
    // Image-to-image specific
    image?: string;  // base64 reference image
    strength?: number; // 0.0-1.0, lower = more similar to reference
}

interface GrokImageResponse {
    created: number;
    data: Array<{
        url?: string;
        b64_json?: string;
        revised_prompt?: string;
    }>;
}

// ═══════════════════════════════════════════════════════════
// VARIATION PROMPT TEMPLATES
// ═══════════════════════════════════════════════════════════

const VARIATION_PROMPTS = {
    safe: [
        {
            id: 'V01',
            prompt: 'Recreate this exact ad with a subtle blue-purple gradient background. Keep ALL elements identical: same person, same logo position, same text, same layout. Only change the background color.',
            negative: 'different person, moved logo, changed text, different layout, different composition'
        },
        {
            id: 'V02',
            prompt: 'Recreate this exact ad with slightly warmer lighting. Keep ALL elements identical: same person, same logo, same text, same layout. Only adjust lighting temperature.',
            negative: 'different person, moved elements, changed text, different composition, cold lighting'
        },
        {
            id: 'V03',
            prompt: 'Recreate this exact ad with subtle grain texture added. Keep ALL elements identical: same person, same logo, same text, same layout. Only add film grain effect.',
            negative: 'different person, moved elements, changed text, different composition, smooth'
        }
    ],
    medium: [
        {
            id: 'V04',
            prompt: 'Recreate this exact ad with the person showing a slightly more confident expression. Keep same identity, same logo, same text, same layout. Only subtle expression change.',
            negative: 'different person, different identity, moved logo, changed text, different layout'
        },
        {
            id: 'V05',
            prompt: 'Recreate this exact ad with a dramatic dark gradient background. Keep ALL elements identical: same person, same logo, same text, same layout. Only change background to dark cinematic.',
            negative: 'different person, moved elements, changed text, different composition, bright background'
        },
        {
            id: 'V06',
            prompt: 'Recreate this exact ad with enhanced contrast and deeper shadows. Keep ALL elements identical: same person, same logo, same text, same layout. Only adjust contrast levels.',
            negative: 'different person, moved elements, changed text, different composition, flat lighting'
        }
    ],
    aggressive: [
        {
            id: 'V07',
            prompt: 'Recreate this exact ad with neon accent lighting effects on edges. Keep ALL elements identical: same person, same logo, same text, same layout. Add subtle neon glow effects only.',
            negative: 'different person, moved elements, changed text, different layout, no person'
        },
        {
            id: 'V08',
            prompt: 'Recreate this exact ad with a studio spotlight effect. Keep ALL elements identical: same person, same logo, same text, same layout. Only add dramatic spotlight from above.',
            negative: 'different person, moved elements, changed text, different composition, flat lighting'
        },
        {
            id: 'V09',
            prompt: 'Recreate this exact ad with cinematic color grading (teal and orange). Keep ALL elements identical: same person, same logo, same text, same layout. Only apply color grade.',
            negative: 'different person, moved elements, changed text, different layout, natural colors'
        }
    ]
};

// ═══════════════════════════════════════════════════════════
// CORE GROK API FUNCTIONS
// ═══════════════════════════════════════════════════════════

export const generateGrokImage = async (
    prompt: string,
    grokApiKey: string,
    referenceImage?: string,
    strength: number = 0.3
): Promise<string> => {

    const requestBody: GrokImageRequest = {
        model: MODEL_IMAGE_GROK,
        prompt: prompt,
        n: 1,
        size: '1152x1536', // 3:4 aspect ratio
        response_format: 'url'
    };

    // Add reference image for image-to-image generation
    if (referenceImage) {
        // Clean base64 if needed
        const cleanBase64 = referenceImage.replace(/^data:image\/\w+;base64,/, '');
        requestBody.image = cleanBase64;
        requestBody.strength = strength;
    }

    const response = await fetch(`${GROK_API_BASE}/images/generations`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${grokApiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Grok API Error: ${error.error?.message || response.statusText}`);
    }

    const data: GrokImageResponse = await response.json();

    if (!data.data?.[0]?.url) {
        throw new Error('No image URL in Grok response');
    }

    return data.data[0].url;
};

// ═══════════════════════════════════════════════════════════
// VARIATION GENERATION
// ═══════════════════════════════════════════════════════════

export const generateVariationsForMaster = async (
    master: MasterCreative,
    grokApiKey: string,
    onProgress?: (variationId: string, status: 'generating' | 'completed' | 'failed', url?: string) => void
): Promise<GrokVariation[]> => {

    const results: GrokVariation[] = [];

    // Get all 9 variation prompts
    const allPrompts = [
        ...VARIATION_PROMPTS.safe.map(p => ({ ...p, category: 'safe' as const })),
        ...VARIATION_PROMPTS.medium.map(p => ({ ...p, category: 'medium' as const })),
        ...VARIATION_PROMPTS.aggressive.map(p => ({ ...p, category: 'aggressive' as const }))
    ];

    for (const promptConfig of allPrompts) {
        const variationId = `${master.masterId}-${promptConfig.id}`;

        onProgress?.(variationId, 'generating');

        try {
            // Determine strength based on category
            const strength = promptConfig.category === 'safe' ? 0.2
                : promptConfig.category === 'medium' ? 0.35
                    : 0.5;

            // Add context about brand-locked elements to the prompt
            const fullPrompt = `${promptConfig.prompt}

CRITICAL BRAND LOCK RULES:
- Keep exact same logo in exact same position
- Keep exact same person/face identity  
- Keep exact same product mockups
- Keep exact same headline text (no spelling changes)
- Keep exact same layout and composition
- Maintain 3:4 vertical aspect ratio`;

            const resultUrl = await generateGrokImage(
                fullPrompt,
                grokApiKey,
                master.masterImage,
                strength
            );

            const variation: GrokVariation = {
                variationId,
                prompt: promptConfig.prompt,
                negativePrompt: promptConfig.negative,
                category: promptConfig.category,
                status: 'completed',
                resultUrl
            };

            results.push(variation);
            onProgress?.(variationId, 'completed', resultUrl);

            // Rate limiting: wait 1 second between requests
            await new Promise(r => setTimeout(r, 1000));

        } catch (error) {
            console.error(`Variation ${variationId} failed:`, error);

            results.push({
                variationId,
                prompt: promptConfig.prompt,
                negativePrompt: promptConfig.negative,
                category: promptConfig.category,
                status: 'failed'
            });

            onProgress?.(variationId, 'failed');
        }
    }

    return results;
};

// ═══════════════════════════════════════════════════════════
// BATCH PROCESSING (10 MASTERS → 90 VARIATIONS)
// ═══════════════════════════════════════════════════════════

export const processBatchVariations = async (
    masters: MasterCreative[],
    grokApiKey: string,
    onMasterProgress?: (masterId: string, completed: number, total: number) => void,
    onVariationProgress?: (variationId: string, status: string, url?: string) => void
): Promise<Map<string, GrokVariation[]>> => {

    const allResults = new Map<string, GrokVariation[]>();

    for (let i = 0; i < masters.length; i++) {
        const master = masters[i];

        console.log(`Processing master ${i + 1}/${masters.length}: ${master.masterId}`);

        const variations = await generateVariationsForMaster(
            master,
            grokApiKey,
            onVariationProgress
        );

        allResults.set(master.masterId, variations);
        onMasterProgress?.(master.masterId, i + 1, masters.length);

        // Longer pause between masters
        if (i < masters.length - 1) {
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    return allResults;
};

// ═══════════════════════════════════════════════════════════
// HELPER: CONVERT GENERATED IMAGES TO MASTER FORMAT
// ═══════════════════════════════════════════════════════════

export const convertToMasterCreative = (
    image: GeneratedImage,
    branding: { logo: string | null; personalPhoto: string | null; productMockup: string | null }
): MasterCreative => {

    const brandLockedElements: string[] = ['layout', 'headline_text', 'font_style'];

    if (branding.logo) brandLockedElements.push('logo');
    if (branding.personalPhoto) brandLockedElements.push('face_identity');
    if (branding.productMockup) brandLockedElements.push('mockups');

    return {
        masterId: image.id,
        masterImage: image.url,
        angleId: image.angleId,
        brandLockedElements,
        variationRules: {
            allowedChanges: VARIATION_CONFIG.allowedChanges,
            forbiddenChanges: VARIATION_CONFIG.forbiddenChanges
        },
        variations: []
    };
};

// ═══════════════════════════════════════════════════════════
// CUSTOM VARIATION PROMPT
// ═══════════════════════════════════════════════════════════

export const generateCustomVariation = async (
    masterImage: string,
    customInstruction: string,
    grokApiKey: string,
    strength: number = 0.3
): Promise<string> => {

    const prompt = `${customInstruction}

CRITICAL RULES:
- Keep exact same person/face identity
- Keep exact same logo position and size
- Keep exact same headline text
- Keep exact same layout structure
- Keep 3:4 vertical aspect ratio`;

    return generateGrokImage(prompt, grokApiKey, masterImage, strength);
};
