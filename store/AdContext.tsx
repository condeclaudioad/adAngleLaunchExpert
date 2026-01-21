
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { KnowledgeBase, ImageAnalysis, Angle, GeneratedImage, AppStep, ApprovalStatus, Branding, Business, User } from '../types';
import {
  saveImageToDb, getImagesFromDb, deleteImageFromDb,
  saveBusinessToDb, getBusinessesFromDb, deleteBusinessFromDb,
  getVisualAnalyses, getExistingAngles, saveAngleToDb,
  deleteAnalysisFromDb, deleteAngleFromDb, deleteAllAnglesFromDb, updateBusinessInDb
} from '../services/dbService';
import { onAuthStateChange, checkIsVip, signOut, signInWithEmail, signUpWithEmail } from '../services/supabaseClient';
import { VIP_EMAILS } from '../constants';
import { AppError, errorHandler } from '../services/errorHandler';
import { ToastMessage, ToastType } from '../components/ui/Toast';

type Theme = 'light' | 'dark';

interface AdContextType {
  theme: Theme;
  toggleTheme: () => void;
  step: AppStep;
  setStep: (step: AppStep) => void;

  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;

  // API Key Management (User Provided)
  googleApiKey: string | null;
  setGoogleApiKey: (key: string) => void;


  // Admin
  adminAddEmail: (email: string) => void;
  adminRemoveEmail: (email: string) => void;
  customAllowedEmails: string[];

  // Business Management
  businesses: Business[];
  currentBusiness: Business | null;
  createNewBusiness: () => void;
  startNewBusiness: (name: string) => Promise<void>;
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
  deleteVisualAnalysis: (id: string) => void;

  angles: Angle[];
  setAngles: (angles: Angle[]) => void;
  toggleAngleSelection: (id: string) => void;
  deleteAngle: (id: string) => void;
  clearAngles: () => Promise<void>;

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

  // Notifications
  notification: ToastMessage | null;
  showNotification: (type: ToastType, message: string, title?: string) => void;
  dismissNotification: () => void;
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
    if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
      console.warn(`LocalStorage quota exceeded for ${key}. Performing aggressive cleanup...`);
      try {
        // 1. Clear known large buffers
        localStorage.removeItem('le_temp_angles');
        localStorage.removeItem('le_history');
        localStorage.removeItem('le_generated_images'); // Potentially huge

        // 2. Clear old business data if needed (keep only IDs)
        // localStorage.removeItem('le_businesses'); 

        // 3. Retry set
        const serialized = JSON.stringify(value);
        localStorage.setItem(key, serialized);
        console.log("Cleanup successful. Data saved.");
      } catch (retryError) {
        console.error("Critical: LocalStorage still full after cleanup. Data not saved.", retryError);
      }
    } else {
      console.error("LocalStorage Error", e);
    }
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

  // Global Notification State
  const [notification, setNotification] = useState<ToastMessage | null>(null);

  const reportError = (error: any) => {
    const appError = errorHandler.handle(error);
    setLastError(appError);
  };

  const showNotification = (type: ToastType, message: string, title?: string) => {
    setNotification({
      id: Date.now().toString(),
      type,
      message,
      title,
      duration: 5000
    });
  };

  const dismissNotification = () => setNotification(null);
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

  // Supabase implementation
  const login = async (email: string, password: string): Promise<void> => {
    await signInWithEmail(email, password);
  };

  const register = async (email: string, password: string, name: string): Promise<void> => {
    await signUpWithEmail(email, password, name);
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
          const allBusinesses = await getBusinessesFromDb();

          const userBusinesses = allBusinesses.filter(b =>
            b.ownerEmail === user.email || !b.ownerEmail
          );

          setBusinesses(userBusinesses);

          // Load Images
          const dbImages = await getImagesFromDb();
          setGeneratedImages(dbImages);

          // Load Analysis History
          const dbAnalyses = await getVisualAnalyses();
          setImageAnalysis(dbAnalyses);

          // Load Angles History
          const dbAngles = await getExistingAngles();
          setAngles(dbAngles);

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

  const startNewBusiness = async (name: string) => {
    try {
      if (!user?.email) throw new Error("No hay usuario autenticado.");
      createNewBusiness(); // Reset state

      const newBus: Business = {
        id: `biz-${Date.now()}`,
        name: name,
        createdAt: Date.now(),
        knowledgeBase: defaultKB,
        branding: defaultBranding,
        ownerEmail: user.email
      };

      await saveBusinessToDb(newBus);
      setBusinesses(prev => [...prev, newBus]);
      setCurrentBusiness(newBus);
      setStep(AppStep.ONBOARDING);
    } catch (e) {
      reportError(e);
    }
  };

  const saveCurrentBusiness = async (name: string) => {
    try {
      if (!user?.email) throw new Error("No hay usuario autenticado.");

      let finalName = name?.trim();
      if (!finalName) {
        console.warn("saveCurrentBusiness called with empty name, defaulting.");
        finalName = "Tu Negocio";
      }

      console.log("Saving business:", finalName);

      // If we already have a current business, we are updating it.
      // Use the optimized update function to avoid sending massive payloads if only specific fields changed?
      // Actually saveCurrentBusiness usually saves THE WHOLE state at that moment.
      // But we can optimize by checking if ID exists.

      const isUpdate = !!currentBusiness?.id;
      const bizId = currentBusiness?.id || `biz-${Date.now()}`;

      const newBus: Business = {
        id: bizId,
        name: finalName,
        createdAt: currentBusiness?.createdAt || Date.now(),
        knowledgeBase: knowledgeBase,
        branding: branding,
        ownerEmail: user.email // Claim ownership
      };

      if (isUpdate) {
        // Optimized Update
        await updateBusinessInDb(bizId, {
          name: finalName,
          knowledgeBase: knowledgeBase,
          branding: branding
        });
      } else {
        // New Insert
        await saveBusinessToDb(newBus);
      }

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
      console.log("Business saved successfully");
    } catch (e) {
      reportError(e);
      throw e; // Re-throw to let components handle loading states
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

      // Use optimized update
      await updateBusinessInDb(currentBusiness.id, data);

      setCurrentBusiness(updatedBiz);

      // Sync separate states to ensure consistency
      if (data.knowledgeBase) setKnowledgeBase(data.knowledgeBase);
      if (data.branding) setBranding(data.branding);

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
    // Confirmation handled by UI Modal now
    try {
      await deleteBusinessFromDb(id);
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
  const deleteVisualAnalysis = async (id: string) => {
    setImageAnalysis(prev => prev.filter(p => p.id !== id));
    await deleteAnalysisFromDb(id);
  };

  const addGeneratedImage = async (img: GeneratedImage) => {
    setGeneratedImages(prev => [...prev, img]);
    try {
      await saveImageToDb(img);
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
        saveImageToDb(updatedImg).catch(console.warn);
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
        saveImageToDb(updatedImg).catch(console.warn);
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
      if (updatedImg) saveImageToDb(updatedImg).catch(console.warn);
      return newImages;
    });
  };

  const updateImageFeedback = (id: string, feedback: string) => {
    setGeneratedImages(prev => {
      const newImages = prev.map(img => img.id === id ? { ...img, feedback } : img);
      const updatedImg = newImages.find(i => i.id === id);
      if (updatedImg) saveImageToDb(updatedImg).catch(console.warn);
      return newImages;
    });
  };

  const deleteImage = async (id: string) => {
    setGeneratedImages(prev => prev.filter(img => img.id !== id && img.parentId !== id));
    await deleteImageFromDb(id);
    const variations = generatedImages.filter(i => i.parentId === id);
    for (const v of variations) {
      await deleteImageFromDb(v.id);
    }
  };

  const toggleAngleSelection = async (id: string) => {
    setAngles(prev => {
      const updated = prev.map(a => a.id === id ? { ...a, selected: !a.selected } : a);
      const changedAngle = updated.find(a => a.id === id);
      if (changedAngle) {
        saveAngleToDb(changedAngle).catch(console.error);
      }
      return updated;
    });
  };

  const deleteAngle = async (id: string) => {
    setAngles(prev => prev.filter(a => a.id !== id));
    await deleteAngleFromDb(id);
  };

  const clearAngles = async () => {
    try {
      setAngles([]);
      await deleteAllAnglesFromDb();

      // Clear legacy business JSON data (zombie prevention)
      // Using updateBusinessPartial ensures local state AND DB are synced
      if (currentBusiness) {
        await updateBusinessPartial({ generatedAngles: [] } as any);
      }
      showNotification('success', 'Todos los ángulos han sido eliminados.', 'Limpieza Completa');
    } catch (e) {
      reportError(e);
      showNotification('error', 'Error al eliminar ángulos.', 'Error');
    }
  };

  const resetApp = async () => {
    if (confirm("¿Borrar todo y reiniciar de fábrica?")) {
      logout();
      localStorage.clear();
      // await clearDB(); // Supabase no se borra así.
      safeLocalStorageSet('le_theme', theme);
      window.location.reload();
    }
  };

  return (
    <AdContext.Provider value={{
      theme, toggleTheme,
      step, setStep,
      user, login, register, logout,
      googleApiKey, setGoogleApiKey,
      adminAddEmail, adminRemoveEmail, customAllowedEmails,
      businesses, currentBusiness, createNewBusiness, startNewBusiness, saveCurrentBusiness, updateBusinessPartial, selectBusiness, deleteBusiness,
      knowledgeBase, setKnowledgeBase,
      branding, setBranding,
      imageAnalysis, addImageAnalysis, deleteVisualAnalysis,
      angles, setAngles, deleteAngle, toggleAngleSelection, clearAngles,
      generatedImages, addGeneratedImage, updateImageStatus, updateImageType,
      setApprovalStatus, updateImageFeedback, deleteImage,
      resetApp,

      lastError, dismissError, reportError,
      notification, showNotification, dismissNotification
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
