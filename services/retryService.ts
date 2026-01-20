
import { errorHandler } from './errorHandler';

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 15000,
  backoffMultiplier: 2
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const { maxRetries, baseDelay, maxDelay, backoffMultiplier } = {
    ...DEFAULT_CONFIG,
    ...config
  };

  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Analyze error to see if it's retryable
      const appError = errorHandler.handle(error);
      
      // Don't retry auth errors or permission errors
      if (!appError.retryable || attempt === maxRetries) {
        throw error;
      }

      // Calculate delay
      const delay = Math.min(
        baseDelay * Math.pow(backoffMultiplier, attempt),
        maxDelay
      );
      
      console.warn(`⚠️ Retry ${attempt + 1}/${maxRetries} after ${delay}ms due to: ${appError.code}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
