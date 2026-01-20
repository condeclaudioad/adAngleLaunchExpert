
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
  productMockup: string | null; // NEW FIELD
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

export interface GeneratedImage {
  id: string;
  angleId: string;
  url: string; 
  prompt: string;
  type: 'main' | 'variation';
  parentId?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  approvalStatus?: ApprovalStatus;
  feedback?: string;
  modelUsed?: string;
}

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
  EXPORT = 6,
}

export interface GenModel {
  id: string;
  name: string;
  provider: string;
  description: string;
}

export interface User {
    email: string;
    name: string;
    picture: string;
}
