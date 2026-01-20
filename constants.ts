// constants.ts - VERSIÓN CORREGIDA

// ═══════════════════════════════════════════════════════════
// MODELOS DE IA - USAR SOLO ESTOS (VERIFICADOS ENERO 2025)
// ═══════════════════════════════════════════════════════════

// Gemini para análisis de texto e imágenes
export const MODEL_ANALYSIS = 'gemini-2.5-flash';
export const MODEL_TEXT = 'gemini-2.5-flash';

// Gemini para generación de imágenes (MASTER creatives)
// Usamos Imagen 3 que es dedicado para generación
// export const MODEL_IMAGE_GEMINI = 'imagen-3.0-generate-001';
// export const MODEL_IMAGE_GEMINI = 'imagen-3.0-generate-002'; // Imagen 3 Latest (Jan 2025) - 404 Error
// export const MODEL_IMAGE_GEMINI = 'imagen-3.0-generate-001'; 
export const MODEL_IMAGE_GEMINI = 'gemini-3-pro-image-preview'; // Validated: Nano Banana Pro

// Grok para variaciones (xAI) - CURRENTLY DISABLED (API Unavailable) -> Fallback to Gemini
export const MODEL_IMAGE_GROK = 'grok-2-image';

// FAL Model (Backup/Legacy)
export const FAL_MODEL = 'fal-ai/recraft-v3';

// ═══════════════════════════════════════════════════════════
// CONFIGURACIÓN DE AUTENTICACIÓN
// ═══════════════════════════════════════════════════════════

// Supabase Config (REEMPLAZAR VALORES)
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Google OAuth (para Supabase Auth)
export const GOOGLE_AUTH_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Admin Password (MOVER A ENV)
export const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || '';

// ═══════════════════════════════════════════════════════════
// SYSTEM PROMPT PARA GENERACIÓN DE ÁNGULOS
// ═══════════════════════════════════════════════════════════

export const SYSTEM_PROMPT = `
Eres ANGLE MASTER, un copywriter experto en Direct Response Marketing especializado en Facebook Ads para el mercado hispanohablante.

🎯 MISIÓN PRINCIPAL:
Tu trabajo es analizar información de productos/servicios y generar:
1. Análisis estratégico estructurado (StructuredContext)
2. Ángulos de venta de alta conversión
3. Prompts visuales para generación de imágenes con IA

📋 REGLAS ABSOLUTAS (NUNCA VIOLAR):
1. IDIOMA DE RESPUESTA:
   - Campos de copy (name, hook, description, emotion): SIEMPRE EN ESPAÑOL
   - Campo "visuals": SIEMPRE EN INGLÉS (es prompt para IA de imágenes)
   
2. FORMATO DE RESPUESTA:
   - SIEMPRE JSON válido cuando se solicite JSON
   - NUNCA incluir \`\`\`json o \`\`\` al inicio/final
   - NUNCA dejar campos vacíos, null o undefined
   - NUNCA usar caracteres que rompan JSON (comillas sin escapar, saltos de línea)

3. ROBUSTEZ:
   - Si falta información, INVENTA valores coherentes
   - Si el texto es muy corto, EXTRAPOLA con creatividad
   - NUNCA respondas "no puedo" o "necesito más información"
`;

// ═══════════════════════════════════════════════════════════
// CONFIGURACIÓN DE VARIACIONES (GROK PIPELINE)
// ═══════════════════════════════════════════════════════════

export const VARIATION_CONFIG = {
  variationsPerMaster: 9,
  categories: {
    safe: [1, 2, 3],      // V01-V03: Cambios mínimos
    medium: [4, 5, 6],    // V04-V06: Cambios moderados
    aggressive: [7, 8, 9] // V07-V09: Cambios agresivos (pero on-brand)
  },
  allowedChanges: [
    'background_gradient',
    'background_texture',
    'lighting_adjustment',
    'expression_shift',
    'accent_color_shift',
    'grain_noise_contrast'
  ],
  forbiddenChanges: [
    'text_content',
    'layout_structure',
    'logo_position',
    'face_identity',
    'mockup_change',
    'aspect_ratio'
  ]
};

// Lista VIP inicial (será reemplazada por Supabase)
export const VIP_EMAILS: string[] = [];
