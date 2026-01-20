
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { KnowledgeBase, ImageAnalysis, Angle, GeneratedImage, AppStep, ApprovalStatus, Branding, Business, User } from '../types';
import {
  saveImageToDB, getAllImagesFromDB, deleteImageFromDB, clearDB,
  saveBusinessToDB, getAllBusinessesFromDB, deleteBusinessFromDB
} from '../services/storageService';
import { onAuthStateChange, checkIsVip, signOut } from '../services/supabaseClient';
import { VIP_EMAILS } from '../constants';
import { AppError, errorHandler } from '../services/errorHandler';

type Theme = 'light' | 'dark';

interface AdContextType {
  theme: Theme;
  toggleTheme: () => void;
  step: AppStep;
  setStep: (step: AppStep) => void;

  user: User | null;
  login: (credentialOrEmail: string) => boolean;
  logout: () => void;

  // API Key Management (User Provided)
  googleApiKey: string | null;
  setGoogleApiKey: (key: string) => void;
  grokApiKey: string;
  setGrokApiKey: (key: string) => void;

  // Admin
  adminAddEmail: (email: string) => void;
  adminRemoveEmail: (email: string) => void;
  customAllowedEmails: string[];

  // Business Management
  businesses: Business[];
  currentBusiness: Business | null;
  createNewBusiness: () => void;
  saveCurrentBusiness: (name: string) => Promise<void>;
  updateBusinessPartial: (data: Partial<Business>) => Promise<void>;
  selectBusiness: (id: string) => void;
  deleteBusiness: (id: string) => void;

  knowledgeBase: KnowledgeBase;
  setKnowledgeBase: (kb: React.SetStateAction<KnowledgeBase>) => void;

  branding: Branding;
  setBranding: (b: Branding) => void;

  imageAnalysis: ImageAnalysis[];
  addImageAnalysis: (analysis: ImageAnalysis) => void;

  angles: Angle[];
  setAngles: (angles: Angle[]) => void;

  generatedImages: GeneratedImage[];
  addGeneratedImage: (img: GeneratedImage) => void;
  updateImageStatus: (id: string, status: GeneratedImage['status'], url?: string, errorMessage?: string) => void;
  updateImageType: (id: string, type: 'master' | 'variation') => void;

  setApprovalStatus: (id: string, status: ApprovalStatus) => void;
  updateImageFeedback: (id: string, feedback: string) => void;
  deleteImage: (id: string) => void;

  resetApp: () => void;

  // Error Handling
  lastError: AppError | null;
  dismissError: () => void;
  reportError: (error: any) => void;
}

const defaultKB: KnowledgeBase = {
  generalContext: '',
  validatedAngles: ''
};

const defaultBranding: Branding = {
  logo: null,
  personalPhoto: null,
  productMockup: null,
  includeFace: false,
  colors: { primary: '#000000', secondary: '#FFFFFF' }
};

const AdContext = createContext<AdContextType | undefined>(undefined);

const safeLocalStorageSet = (key: string, value: any) => {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
  } catch (e) {
    console.warn(`LocalStorage quota exceeded for ${key}.`);
  }
};

// Helper to safely parse JWT without external libraries
const parseJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("JWT Parse Error", e);
    return null;
  }
};

export const AdProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    try { return (localStorage.getItem('le_theme') as Theme) || 'dark'; } catch { return 'dark'; }
  });

  // Global Error State
  const [lastError, setLastError] = useState<AppError | null>(null);

  const reportError = (error: any) => {
    const appError = errorHandler.handle(error);
    setLastError(appError);
  };

  const dismissError = () => setLastError(null);

  // Auth State
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('le_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  // API Key State
  const [googleApiKey, setGoogleApiKeyState] = useState<string | null>(() => {
    return localStorage.getItem('le_api_key') || null;
  });

  const [grokApiKey, setGrokApiKey] = useState<string>(() => {
    try {
      const key = localStorage.getItem('le_grok_key');
      return key ? JSON.parse(key) : '';
    } catch { return ''; }
  });

  useEffect(() => {
    safeLocalStorageSet('le_grok_key', grokApiKey);
  }, [grokApiKey]);

  const setGoogleApiKey = (key: string) => {
    setGoogleApiKeyState(key);
    if (key) {
      localStorage.setItem('le_api_key', key);
    } else {
      localStorage.removeItem('le_api_key');
    }
  };

  // Custom Allowed Emails (Local storage for MVP)
  const [customAllowedEmails, setCustomAllowedEmails] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('le_custom_emails');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  // Step state
  const [step, setStep] = useState<AppStep>(() => {
    // If not logged in, force login
    if (!localStorage.getItem('le_user')) return AppStep.LOGIN;

    // Check API Key existence (Local OR Env)
    const hasKey = localStorage.getItem('le_api_key') || process.env.API_KEY;
    if (!hasKey) return AppStep.API_SETUP;

    const savedStep = localStorage.getItem('adangle_step');
    try {
      return savedStep ? parseInt(savedStep) : AppStep.BUSINESS;
    } catch { return AppStep.BUSINESS; }
  });

  // Business State
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null);

  // Knowledge Base
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase>(defaultKB);
  const [branding, setBranding] = useState<Branding>(defaultBranding);
  const [imageAnalysis, setImageAnalysis] = useState<ImageAnalysis[]>([]);
  const [angles, setAngles] = useState<Angle[]>([]);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

  // --- Auth Logic ---
  // --- Auth Logic (Supabase Integration) ---

  // Ref to access current step inside the closure
  const stepRef = useRef(step);
  useEffect(() => { stepRef.current = step; }, [step]);

  useEffect(() => {
    const { data: authListener } = onAuthStateChange(async (supabaseUser) => {
      if (supabaseUser && supabaseUser.email) {
        console.log("Supabase Auth Change: Logged In", supabaseUser.email);

        // 1. Check VIP Status again (Security Layer)
        const isVip = await checkIsVip(supabaseUser.email);
        if (!isVip) {
          console.warn("User is not VIP. Signing out.");
          await signOut();
          setLastError({ code: 'AUTH-VIP', message: 'No tienes acceso VIP.', timestamp: Date.now() });
          setUser(null);
          setStep(AppStep.LOGIN);
          return;
        }

        // 2. Construct App User
        const newUser: User = {
          id: supabaseUser.id,
          email: supabaseUser.email,
          name: supabaseUser.user_metadata?.name || supabaseUser.email.split('@')[0],
          picture: supabaseUser.user_metadata?.picture || `https://ui-avatars.com/api/?name=${supabaseUser.email}`,
          isVip: true,
          createdAt: supabaseUser.created_at || new Date().toISOString()
        };

        setUser(newUser);

        // 3. Load API Keys from Meta
        const metaKeys = supabaseUser.user_metadata?.api_keys;
        if (metaKeys) {
          if (metaKeys.grok) setGrokApiKey(metaKeys.grok);
          if (metaKeys.google) setGoogleApiKey(metaKeys.google);
        }

        // 4. Navigate using Ref to avoid stale state
        if (stepRef.current === AppStep.LOGIN) {
          // Check if user has API keys configured
          const hasGoogleKey = metaKeys?.google || localStorage.getItem('le_api_key');

          if (!hasGoogleKey) {
            // No API keys - go to onboarding
            setStep(AppStep.API_SETUP);
          } else {
            // Has keys - go to business dashboard
            setStep(AppStep.BUSINESS);
          }
        }
        // If user is in API_SETUP, don't redirect - let them finish configuring
      } else {
        console.log("Supabase Auth Change: Logged Out");
        setUser(null);
        if (stepRef.current !== AppStep.LOGIN && stepRef.current !== AppStep.ADMIN) {
          setStep(AppStep.LOGIN);
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Legacy Login wrapper (kept for compatibility with Auth.tsx calling login() manually)
  const login = (email: string): boolean => {
    // With Supabase, we rely on the session state change. 
    // This simple function just returns true to satisfy interface.
    return true;
  };

  const logout = async () => {
    try {
      await signOut();
    } catch (e) {
      console.error("Logout error", e);
    }
    setUser(null);
    setCurrentBusiness(null);
    localStorage.removeItem('le_user');
    localStorage.removeItem('le_last_biz_id');
    // Do not clear API Key on logout to be friendly
    setStep(AppStep.LOGIN);
  };

  const adminAddEmail = (email: string) => {
    const lowerEmail = email.toLowerCase().trim();
    if (VIP_EMAILS.includes(lowerEmail) || customAllowedEmails.includes(lowerEmail)) {
      alert("El email ya existe.");
      return;
    }
    const newList = [...customAllowedEmails, lowerEmail];
    setCustomAllowedEmails(newList);
    safeLocalStorageSet('le_custom_emails', newList);
    alert(`Email ${lowerEmail} agregado correctamente.`);
  };

  const adminRemoveEmail = (email: string) => {
    const lowerEmail = email.toLowerCase().trim();
    setCustomAllowedEmails(prev => {
      const filtered = prev.filter(e => e.toLowerCase() !== lowerEmail);
      safeLocalStorageSet('le_custom_emails', filtered);
      return filtered;
    });
  };

  // --- Effects ---

  useEffect(() => {
    if (user) {
      const initData = async () => {
        try {
          const allBusinesses = await getAllBusinessesFromDB();

          const userBusinesses = allBusinesses.filter(b =>
            b.ownerEmail === user.email || !b.ownerEmail
          );

          setBusinesses(userBusinesses);
          const dbImages = await getAllImagesFromDB();
          setGeneratedImages(dbImages);

          const lastBizId = localStorage.getItem('le_last_biz_id');
          if (lastBizId) {
            const found = userBusinesses.find(b => b.id === lastBizId);
            if (found) {
              setCurrentBusiness(found);
              setKnowledgeBase(found.knowledgeBase);
              setBranding(found.branding);
            }
          }
        } catch (e) {
          reportError(e);
        }
      };
      initData();
    }
  }, [user]);

  useEffect(() => {
    const root = document.documentElement;
    theme === 'dark' ? root.classList.add('dark') : root.classList.remove('dark');
    safeLocalStorageSet('le_theme', theme);
  }, [theme]);

  useEffect(() => {
    // Don't save transient auth steps
    if (step !== AppStep.LOGIN && step !== AppStep.ADMIN && step !== AppStep.API_SETUP) {
      safeLocalStorageSet('adangle_step', step.toString());
    }
  }, [step]);

  // Persist Current Business Selection
  useEffect(() => {
    if (currentBusiness) {
      localStorage.setItem('le_last_biz_id', currentBusiness.id);
    }
  }, [currentBusiness]);


  // --- Actions ---

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const createNewBusiness = () => {
    setCurrentBusiness(null);
    setKnowledgeBase(defaultKB);
    setBranding(defaultBranding);
    setAngles([]);
    setImageAnalysis([]);
    localStorage.removeItem('le_last_biz_id');
    setStep(AppStep.ONBOARDING);
  };

  const saveCurrentBusiness = async (name: string) => {
    try {
      if (!user?.email) throw new Error("No hay usuario autenticado.");

      const newBus: Business = {
        id: currentBusiness?.id || `biz-${Date.now()}`,
        name: name,
        createdAt: currentBusiness?.createdAt || Date.now(),
        knowledgeBase: knowledgeBase,
        branding: branding,
        ownerEmail: user.email // Claim ownership
      };

      await saveBusinessToDB(newBus);
      setBusinesses(prev => {
        const exists = prev.findIndex(b => b.id === newBus.id);
        if (exists > -1) {
          const copy = [...prev];
          copy[exists] = newBus;
          return copy;
        }
        return [...prev, newBus];
      });
      setCurrentBusiness(newBus);
    } catch (e) {
      reportError(e);
    }
  };

  const updateBusinessPartial = async (data: Partial<Business>) => {
    if (!currentBusiness) return;
    try {
      const updatedBiz = {
        ...currentBusiness,
        ...data,
        ownerEmail: user?.email || currentBusiness.ownerEmail
      };

      await saveBusinessToDB(updatedBiz);

      setCurrentBusiness(updatedBiz);
      setBusinesses(prev => prev.map(b => b.id === updatedBiz.id ? updatedBiz : b));
    } catch (e) {
      reportError(e);
    }
  };

  const selectBusiness = (id: string) => {
    const biz = businesses.find(b => b.id === id);
    if (biz) {
      setCurrentBusiness(biz);
      setKnowledgeBase(biz.knowledgeBase);
      setBranding(biz.branding);
      setStep(AppStep.ANGLES);
    }
  };

  const deleteBusiness = async (id: string) => {
    if (!confirm("¿Borrar este negocio?")) return;
    try {
      await deleteBusinessFromDB(id);
      setBusinesses(prev => prev.filter(b => b.id !== id));
      if (currentBusiness?.id === id) {
        createNewBusiness();
        setStep(AppStep.BUSINESS);
      }
    } catch (e) {
      reportError(e);
    }
  };

  const addImageAnalysis = (analysis: ImageAnalysis) => setImageAnalysis(prev => [...prev, analysis]);

  const addGeneratedImage = async (img: GeneratedImage) => {
    setGeneratedImages(prev => [...prev, img]);
    try {
      await saveImageToDB(img);
    } catch (e) {
      // Silently fail on storage limit, but keep in memory
      console.warn("Could not save to DB", e);
    }
  };

  const updateImageStatus = async (id: string, status: GeneratedImage['status'], url?: string, errorMessage?: string) => {
    setGeneratedImages(prev => {
      const newImages = prev.map(img =>
        img.id === id ? { ...img, status, url: url || img.url, errorMessage: errorMessage || img.errorMessage } : img
      );
      const updatedImg = newImages.find(i => i.id === id);
      if (updatedImg) {
        saveImageToDB(updatedImg).catch(console.warn);
      }
      return newImages;
    });
  };

  const updateImageType = (id: string, type: 'master' | 'variation') => {
    setGeneratedImages(prev => {
      const newImages = prev.map(img =>
        img.id === id ? { ...img, type } : img
      );
      const updatedImg = newImages.find(i => i.id === id);
      if (updatedImg) {
        saveImageToDB(updatedImg).catch(console.warn);
      }
      return newImages;
    });
  };

  const setApprovalStatus = (id: string, status: ApprovalStatus) => {
    setGeneratedImages(prev => {
      const newImages = prev.map(img =>
        img.id === id ? { ...img, approvalStatus: status } : img
      );
      const updatedImg = newImages.find(i => i.id === id);
      if (updatedImg) saveImageToDB(updatedImg).catch(console.warn);
      return newImages;
    });
  };

  const updateImageFeedback = (id: string, feedback: string) => {
    setGeneratedImages(prev => {
      const newImages = prev.map(img => img.id === id ? { ...img, feedback } : img);
      const updatedImg = newImages.find(i => i.id === id);
      if (updatedImg) saveImageToDB(updatedImg).catch(console.warn);
      return newImages;
    });
  };

  const deleteImage = async (id: string) => {
    setGeneratedImages(prev => prev.filter(img => img.id !== id && img.parentId !== id));
    await deleteImageFromDB(id);
    const variations = generatedImages.filter(i => i.parentId === id);
    for (const v of variations) {
      await deleteImageFromDB(v.id);
    }
  };

  const resetApp = async () => {
    if (confirm("¿Borrar todo y reiniciar de fábrica?")) {
      logout();
      localStorage.clear();
      await clearDB();
      safeLocalStorageSet('le_theme', theme);
      window.location.reload();
    }
  };

  return (
    <AdContext.Provider value={{
      theme, toggleTheme,
      step, setStep,
      user, login, logout,
      googleApiKey, setGoogleApiKey,
      grokApiKey, setGrokApiKey,
      adminAddEmail, adminRemoveEmail, customAllowedEmails,
      businesses, currentBusiness, createNewBusiness, saveCurrentBusiness, updateBusinessPartial, selectBusiness, deleteBusiness,
      knowledgeBase, setKnowledgeBase,
      branding, setBranding,
      imageAnalysis, addImageAnalysis,
      angles, setAngles,
      generatedImages, addGeneratedImage, updateImageStatus, updateImageType,
      setApprovalStatus, updateImageFeedback, deleteImage,
      resetApp,
      lastError, dismissError, reportError
    }}>
      {children}
    </AdContext.Provider>
  );
};

export const useAdContext = () => {
  const context = useContext(AdContext);
  if (!context) throw new Error("useAdContext must be used within AdProvider");
  return context;
};
