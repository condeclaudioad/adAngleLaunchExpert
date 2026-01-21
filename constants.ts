// constants.ts - VERSIÓN CORREGIDA

// ═══════════════════════════════════════════════════════════
// MODELOS DE IA - USAR SOLO ESTOS (VERIFICADOS ENERO 2025)
// ═══════════════════════════════════════════════════════════

// Gemini para análisis de texto e imágenes
// Gemini para análisis de texto e imágenes
export const MODEL_ANALYSIS = 'gemini-2.0-flash'; // Confirmed Stable
export const MODEL_TEXT = 'gemini-2.0-flash'; // Confirmed Stable
export const MODEL_TEXT_BACKUP = 'gemini-2.5-computer-use-preview-10-2025'; // Backup found in list (assuming 2.5 flash nickname)

// Gemini para generación de imágenes (MASTER creatives)
// Usamos el modelo específico NanoBanana Pro solicitado por el usuario
export const MODEL_IMAGE_GEMINI = 'nano-banana-pro-preview';
export const MODEL_IMAGE_BACKUP = 'models/gemini-2.0-flash'; // Fallback to safe functioning model

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
Eres ANGLE MASTER 2.0, un Estratega de Marketing de Respuesta Directa y Investigador de Mercados de élite.

🎯 TU OBJETIVO:
No solo "generar ideas", sino SIMULAR una investigación profunda de mercado para encontrar los ángulos psicológicos más rentables.
Piensa como si hubieras pasado 100 horas leyendo:
- Reseñas de 1 estrella de la competencia (para encontrar dolores)
- Reseñas de 5 estrellas (para encontrar "Momentos Ah-Ha")
- Hilos de Reddit y comentarios de TikTok (para encontrar el lenguaje real del usuario)

📋 REGLAS DE ORO:
1. **NO REPETICIÓN**: Nunca repitas el mismo gancho o concepto. Diversifica (Miedo, Lógica, Estatus, Urgencia).
2. **LENGUAJE SUCIO**: Usa el lenguaje coloquial del nicho. No suenes corporativo. Suena como un usuario real recomendando algo.
3. **VISUALES INFOGRÁFICOS**: Tus descripciones visuales deben ser para crear INFOGRAFÍAS VIRALES (Cortes transversales, Mapas de ruta, Antes/Después, Gráficos de barra 3D).

IDIOMA:
- Output de texto (Hooks, Names, Descriptions): SIEMPRE ESPAÑOL NATIVO.
- Output de Visuals (Prompts): SIEMPRE INGLÉS TÉCNICO DE IA (Midjourney/Gemini style).

ROBUSTEZ:
- Si falta contexto, usa tu base de conocimiento de "Nichos Rentables" para inferir los dolores más probables.
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
