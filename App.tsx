import React from 'react';
import { AdProvider, useAdContext } from './store/AdContext';
import { Layout } from './components/Layout';
import { KnowledgeForm } from './components/features/KnowledgeForm';
import { BrandingForm } from './components/features/BrandingForm';
import { ImageAnalyzer } from './components/features/ImageAnalyzer';
import { AngleGenerator } from './components/features/AngleGenerator';
import { ImageFactory } from './components/features/ImageFactory';
import { ExportPage } from './components/features/ExportPage';

import { BusinessManager } from './components/features/BusinessManager';
import { ApiSetup } from './components/features/ApiSetup';
import { Login, AdminPanel } from './components/features/Auth';
import { AppStep } from './types';

const CurrentStep: React.FC = () => {
  const { step } = useAdContext();

  switch (step) {
    case AppStep.LOGIN: return <Login />;
    case AppStep.ADMIN: return <AdminPanel />;
    case AppStep.API_SETUP: return <ApiSetup />;
    case AppStep.BUSINESS: return <BusinessManager />;
    case AppStep.ONBOARDING: return <KnowledgeForm />;
    case AppStep.BRANDING: return <BrandingForm />;
    case AppStep.ANALYSIS: return <ImageAnalyzer />;
    case AppStep.ANGLES: return <AngleGenerator />;
    case AppStep.GENERATION: return <ImageFactory />;
    case AppStep.EXPORT: return <ExportPage />;
    default: return <BusinessManager />;
  }
};

const AppContent: React.FC = () => {
  const { step } = useAdContext();
  const isAuthPage = step === AppStep.LOGIN || step === AppStep.ADMIN || step === AppStep.API_SETUP;

  if (isAuthPage) {
    return <CurrentStep />;
  }

  return (
    <Layout>
      <CurrentStep />
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AdProvider>
      <AppContent />
    </AdProvider>
  );
};

export default App;
