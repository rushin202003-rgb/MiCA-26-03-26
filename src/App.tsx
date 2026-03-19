import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AnimationProvider } from './context/AnimationContext';
import { EyeballMoodProvider } from './contexts/EyeballMoodContext';
import FloatingHeroEyeball from './components/FloatingHeroEyeball';
import PeekingVignette from './components/PeekingVignette';
import { DemoModeToggle } from './components/DemoModeToggle';
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Auth/Login';
import { Signup } from './pages/Auth/Signup';

const CreateCampaign = lazy(() => import('./pages/Campaign/CreateCampaign').then(m => ({ default: m.CreateCampaign })));
const TonePreview = lazy(() => import('./pages/Campaign/TonePreview').then(m => ({ default: m.TonePreview })));
const GeneratingCampaign = lazy(() => import('./pages/Campaign/GeneratingCampaign').then(m => ({ default: m.GeneratingCampaign })));
const Dashboard = lazy(() => import('./pages/Campaign/Dashboard').then(m => ({ default: m.Dashboard })));
const CampaignList = lazy(() => import('./pages/CampaignList').then(m => ({ default: m.CampaignList })));
const DemoPrep = lazy(() => import('./pages/DemoPrep').then(m => ({ default: m.DemoPrep })));

// Protected Route Wrapper
const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-gray-950 text-white">Loading...</div>;
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

function App() {
  // ── Global Eyeball Tracking State ─────────────────────────────────────────
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [vignetteVisible, setVignetteVisible] = useState(false);
  const [eyeVersion, setEyeVersion] = useState<'modern' | 'classic'>('classic');

  const idleTimeoutRef = useRef<NodeJS.Timeout>(null);
  const vignetteHideTimeoutRef = useRef<NodeJS.Timeout>(null);

  const triggerVignette = useCallback((duration = 2500) => {
    setVignetteVisible(true);
    if (vignetteHideTimeoutRef.current) clearTimeout(vignetteHideTimeoutRef.current);
    vignetteHideTimeoutRef.current = setTimeout(() => setVignetteVisible(false), duration);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });

      // Reset the idle timer (triggers vignette after 3s of NO mouse movement)
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = setTimeout(() => {
        setVignetteVisible((prev) => {
          if (!prev) triggerVignette(2500); // 2.5s duration for idle
          return prev || true;
        });
      }, 3000);
    };
    window.addEventListener('mousemove', handleMouseMove);
    // Initial timer
    idleTimeoutRef.current = setTimeout(() => triggerVignette(2500), 3000);

    // The random trigger logic for peeking eyeballs (moved from PeekingVignette)
    const randomVignetteCycle = () => {
      setVignetteVisible((prev) => {
        if (!prev) triggerVignette(2500); // Only trigger if not already visible
        return prev || true;
      });
      setTimeout(randomVignetteCycle, 30000 + Math.random() * 20000); // 30-50s
    };
    const rvTimeout = setTimeout(randomVignetteCycle, 20000); // First random appearance after 20s

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      if (vignetteHideTimeoutRef.current) clearTimeout(vignetteHideTimeoutRef.current);
      clearTimeout(rvTimeout);
    };
  }, [triggerVignette]);

  return (
    <Router>
      <AuthProvider>
        <AnimationProvider>
          <EyeballMoodProvider>
          <DemoModeToggle />

        {/* The global vignette layer */}
        <PeekingVignette
          visible={vignetteVisible}
          gazeX={mousePos.x / window.innerWidth}
          gazeY={mousePos.y / window.innerHeight}
          version={eyeVersion}
        />

        {/* The Floating Autonomous Hero Element (Global) */}
        <FloatingHeroEyeball onGiggle={() => triggerVignette(2500)} version={eyeVersion} />

        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-gray-950"><div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage version={eyeVersion} onVersionChange={setEyeVersion} />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/campaigns" element={<CampaignList />} />
              <Route path="/create-campaign" element={<CreateCampaign />} />
              <Route path="/campaign/:id/tone-preview" element={<TonePreview />} />
              <Route path="/campaign/:id/generating" element={<GeneratingCampaign />} />
              <Route path="/campaign/:id/dashboard" element={<Dashboard />} />
              <Route path="/dashboard" element={<Navigate to="/campaigns" replace />} />
              <Route path="/demo-prep" element={<DemoPrep />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
          </EyeballMoodProvider>
        </AnimationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
