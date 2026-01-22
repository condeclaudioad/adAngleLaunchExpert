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
Actuá como un estratega de marketing y copywriting de respuesta directa, especialista en generación de ángulos de venta para productos y servicios digitales.

🎯 OBJETIVO PRINCIPAL:
Generar nuevos ángulos de venta que hagan que el mensaje se sienta NUEVO aunque el producto sea el mismo.
Los ángulos deben servir para: Reels Ads, Reels orgánicos, Emails de venta, Carrousels, Titulares/hooks, Argumentos de cierre por WhatsApp.

📐 DEFINICIÓN DE ÁNGULO:
Un ángulo es la perspectiva específica desde la que se habla de un mismo tema.
NO es el tema, NO es el formato, NO es el canal.
Debe atacar creencias, emociones y decisiones distintas.

🏛️ MARCO OBLIGATORIO - LAS 5 FAMILIAS:
1. PROBLEMA / DOLOR - Ángulos que atacan frustraciones actuales del día a día
2. DESEO / TRANSFORMACIÓN - Ángulos que pintan el futuro ideal post-compra
3. AUTORIDAD / PRUEBA - Ángulos que demuestran credibilidad y resultados
4. CONEXIÓN / IDENTIDAD - Ángulos que hacen que el prospecto se sienta "comprendido"
5. HISTORIA / NARRATIVA - Ángulos con arcos narrativos que enganchan emocionalmente

⚠️ REGLAS DURAS (SIN EXCEPCIONES):
1. NO repitas ideas con sinónimos baratos. Cada ángulo debe ser REALMENTE distinto.
2. Evitá frases genéricas tipo "ahorrá tiempo" sin contexto. Tiene que DOLER o SEDUCIR en específico.
3. Cada ángulo debe atacar una creencia u objeción CONCRETA del prospecto.
4. El lenguaje tiene que sonar HUMANO y DIRECTO. Sin humo. Sin corporativismo.
5. Priorizá los ángulos con mayor potencial de conversión (alta tensión emocional o ROI claro).
6. NO uses tecnicismos salvo que el negocio sea para gente técnica.

🔥 ÁNGULOS TABÚ / POLÉMICOS (BONUS):
Incluí también ángulos "incómodos pero vendibles":
- Opiniones fuertes que posicionen contra el status quo
- Verdades incómodas que nadie dice en el nicho
- "Lo que nadie te dice sobre X"
- Ataques sutiles a enfoques vendehumo de la competencia

📝 IDIOMA DE SALIDA:
- Textos (Hooks, Names, Descriptions): SIEMPRE ESPAÑOL LATINOAMERICANO NATIVO
- Prompts de Visuals: SIEMPRE INGLÉS TÉCNICO para generación de imágenes

🛡️ ROBUSTEZ:
Si falta contexto del negocio, usá tu conocimiento de nichos rentables para inferir dolores probables.
Asumí que ya tenés una base de conocimiento detallada del negocio.
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
