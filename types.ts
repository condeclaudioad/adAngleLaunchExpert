// types.ts - VERSIÓN COMPLETA CORREGIDA

export interface StructuredContext {
  productName: string;
  avatar: string;
  mechanismOfProblem: string;
  uniqueMechanism: string;
  bigPromise: string;
}

export interface KnowledgeBase {
  generalContext: string;
  structuredAnalysis?: StructuredContext;
  validatedAngles: string;
}

export interface Branding {
  logo: string | null;
  personalPhoto: string | null;
  productMockup: string | null;
  includeFace: boolean;
  colors: {
    primary: string;
    secondary: string;
  };
}

export interface Business {
  id: string;
  name: string;
  createdAt: number;
  knowledgeBase: KnowledgeBase;
  branding: Branding;
  ownerEmail?: string;
}

export interface ImageAnalysis {
  angleDetected: string;
  visualElements: string[];
  copy: string;
  colors: string[];
  composition: string;
  emotions: string[];
}

export interface Angle {
  id: string;
  name: string;
  description: string;
  hook: string;
  emotion: string;
  visuals: string;
  selected?: boolean;
}

export type ApprovalStatus = 'waiting' | 'approved' | 'rejected';

// ═══════════════════════════════════════════════════════════
// TIPOS PARA GENERACIÓN DE IMÁGENES (GEMINI + GROK)
// ═══════════════════════════════════════════════════════════

export type ImageProvider = 'gemini' | 'grok' | 'fal';

export interface GeneratedImage {
  id: string;
  angleId: string;
  url: string;
  prompt: string;
  type: 'master' | 'variation';  // CAMBIADO: 'main' -> 'master'
  parentId?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  approvalStatus?: ApprovalStatus;
  feedback?: string;
  modelUsed?: string;
  provider?: ImageProvider;  // NUEVO
  variationIndex?: number;   // NUEVO: 1-9 para variaciones
  variationCategory?: 'safe' | 'medium' | 'aggressive'; // NUEVO
  errorMessage?: string; // NUEVO: Para guardar el error
}

// ═══════════════════════════════════════════════════════════
// TIPOS PARA GROK PIPELINE
// ═══════════════════════════════════════════════════════════

export interface MasterCreative {
  masterId: string;
  masterImage: string; // URL o base64
  angleId: string;
  brandLockedElements: string[];
  variationRules: {
    allowedChanges: string[];
    forbiddenChanges: string[];
  };
  variations: GrokVariation[];
}

export interface GrokVariation {
  variationId: string;
  prompt: string;
  negativePrompt: string;
  category: 'safe' | 'medium' | 'aggressive';
  status: 'pending' | 'generating' | 'completed' | 'failed';
  resultUrl?: string;
}

export interface GrokBatchRequest {
  masters: MasterCreative[];
  aspectRatio: string;
  totalExpected: number;
}

// ═══════════════════════════════════════════════════════════
// TIPOS PARA SUPABASE AUTH
// ═══════════════════════════════════════════════════════════

export interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
  isVip: boolean;
  createdAt: string;
}

export interface VipUser {
  id: string;
  email: string;
  added_by: string;
  added_at: string;
  is_active: boolean;
}

// ═══════════════════════════════════════════════════════════
// APP STEPS (CORREGIDO - SIN DECIMALES)
// ═══════════════════════════════════════════════════════════

export enum AppStep {
  LOGIN = -3,
  ADMIN = -2,
  API_SETUP = -1,
  BUSINESS = 0,
  ONBOARDING = 1,
  BRANDING = 2,
  ANALYSIS = 3,
  ANGLES = 4,
  GENERATION = 5,
  VARIATIONS = 6,  // NUEVO STEP
  EXPORT = 7,
}

export interface GenModel {
  id: string;
  name: string;
  provider: ImageProvider;
  description: string;
}

// ═══════════════════════════════════════════════════════════
// API KEYS CONFIG
// ═══════════════════════════════════════════════════════════

export interface ApiKeys {
  google: string;
  grok: string;
  fal?: string;
}
