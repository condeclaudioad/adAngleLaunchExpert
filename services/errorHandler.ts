
export enum ErrorCategory {
  API = 'API',
  AUTH = 'AUTH',
  STORAGE = 'STORAGE',
  FILE = 'FILE',
  UI = 'UI',
  DRIVE = 'DRIVE'
}

export interface AppError {
  code: string;
  category: ErrorCategory;
  message: string;
  userMessage: string;
  recoverable: boolean;
  retryable: boolean;
  context?: Record<string, any>;
  originalError?: any;
}

const ERROR_CATALOG: Record<string, Omit<AppError, 'context' | 'originalError'>> = {
  // API ERRORS
  'API-001': {
    code: 'API-001',
    category: ErrorCategory.API,
    message: 'Invalid API Key',
    userMessage: '🔑 Tu API Key es inválida o ha expirado. Verifica tu configuración.',
    recoverable: true,
    retryable: false
  },
  'API-002': {
    code: 'API-002',
    category: ErrorCategory.API,
    message: 'Quota exceeded',
    userMessage: '⏳ Has alcanzado el límite de uso de Gemini. Espera unos minutos.',
    recoverable: true,
    retryable: true
  },
  'API-003': {
    code: 'API-003',
    category: ErrorCategory.API,
    message: 'Rate limit',
    userMessage: '🚦 Demasiadas solicitudes rápidas. Estamos esperando un momento...',
    recoverable: true,
    retryable: true
  },
  'API-004': {
    code: 'API-004',
    category: ErrorCategory.API,
    message: 'Timeout',
    userMessage: '⏱️ La IA tardó demasiado en responder. Reintentando...',
    recoverable: true,
    retryable: true
  },
  'API-005': {
    code: 'API-005',
    category: ErrorCategory.API,
    message: 'Service Overloaded',
    userMessage: '🔥 Los servidores de Google están saturados. Reintentando automáticamente...',
    recoverable: true,
    retryable: true
  },
  'API-006': {
    code: 'API-006',
    category: ErrorCategory.API,
    message: 'JSON parse error',
    userMessage: '📋 La IA generó un formato inválido. Reintentando corrección...',
    recoverable: true,
    retryable: true
  },
  'API-007': {
    code: 'API-007',
    category: ErrorCategory.API,
    message: 'Permission denied',
    userMessage: '🚫 Permiso denegado. Verifica que la API esté habilitada en Google Cloud.',
    recoverable: true,
    retryable: false
  },
  'API-008': {
    code: 'API-008',
    category: ErrorCategory.API,
    message: 'Model Not Found',
    userMessage: '🤖 El modelo de IA no está disponible para tu API Key. Verifica si tienes acceso a Gemini 3 Pro.',
    recoverable: false,
    retryable: false
  },

  // FILE ERRORS
  'FILE-001': {
    code: 'FILE-001',
    category: ErrorCategory.FILE,
    message: 'File too large',
    userMessage: '📁 El archivo es demasiado grande (máx 10MB).',
    recoverable: true,
    retryable: false
  },
  'FILE-005': {
    code: 'FILE-005',
    category: ErrorCategory.FILE,
    message: 'PDF Read Error',
    userMessage: '📄 No se pudo leer el PDF. Asegúrate de tener una API Key válida.',
    recoverable: true,
    retryable: true
  },

  // STORAGE ERRORS
  'IDB-001': {
    code: 'IDB-001',
    category: ErrorCategory.STORAGE,
    message: 'IndexedDB error',
    userMessage: '💾 Error guardando datos. Verifica si tienes espacio libre.',
    recoverable: true,
    retryable: false
  },

  // AUTH ERRORS
  'AUTH-006': {
    code: 'AUTH-006',
    category: ErrorCategory.AUTH,
    message: 'Email not authorized',
    userMessage: '🔒 Acceso denegado. Tu email no está en la lista autorizada.',
    recoverable: false,
    retryable: false
  },
  
  // DEFAULT
  'UNKNOWN': {
    code: 'UNKNOWN',
    category: ErrorCategory.UI,
    message: 'Unknown error',
    userMessage: '❌ Ocurrió un error inesperado. Intenta de nuevo.',
    recoverable: true,
    retryable: true
  }
};

class ErrorHandler {
  private static instance: ErrorHandler;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  createError(code: string, originalError?: any, context?: Record<string, any>): AppError {
    const template = ERROR_CATALOG[code] || ERROR_CATALOG['UNKNOWN'];
    
    // Log for debugging
    console.error(`[${code}]`, template.message, originalError, context);

    return {
      ...template,
      originalError,
      context
    };
  }

  handle(error: any, fallbackCode: string = 'UNKNOWN'): AppError {
    let code = fallbackCode;
    const msg = error?.message?.toLowerCase() || '';

    // Auto-detect common errors
    if (msg.includes('api key') || msg.includes('401')) code = 'API-001';
    else if (msg.includes('quota') || msg.includes('429')) code = 'API-002';
    else if (msg.includes('overloaded') || msg.includes('503')) code = 'API-005';
    else if (msg.includes('timeout')) code = 'API-004';
    else if (msg.includes('permission') || msg.includes('403')) code = 'API-007';
    else if (msg.includes('not found') || msg.includes('404')) code = 'API-008';
    else if (msg.includes('json')) code = 'API-006';
    else if (msg.includes('fetch') || msg.includes('network')) code = 'API-004';
    
    return this.createError(code, error);
  }
}

export const errorHandler = ErrorHandler.getInstance();
