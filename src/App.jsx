import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import DyslexiaHome from './pages/dyslexia/DyslexiaHome';
import DyscalculiaHome from './pages/dyscalculia/DyscalculiaHome';
import Diagnostic from './pages/dyscalculia/Diagnostic';
import Practice from './pages/dyscalculia/Practice';
import RealWorld from './pages/dyscalculia/RealWorld';
import Progress from './pages/dyscalculia/Progress';
import AutismHome from './pages/autism/AutismHome';
import Communication from './pages/autism/Communication';
import ExecutiveFunction from './pages/autism/ExecutiveFunction';
import Sensory from './pages/autism/Sensory';
import Social from './pages/autism/Social';
import ADHDHome from './pages/adhd/ADHDHome';
import Focus from './pages/adhd/Focus';
import TimeAnchor from './pages/adhd/TimeAnchor';
import Capture from './pages/adhd/Capture';
import Tasks from './pages/adhd/Tasks';
import Energy from './pages/adhd/Energy';
import Reflect from './pages/adhd/Reflect';
import ParentDashboard from './pages/ParentDashboard';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dyslexia" element={<DyslexiaHome />} />
        <Route path="/dyscalculia" element={<DyscalculiaHome />} />
        <Route path="/dyscalculia/diagnostic" element={<Diagnostic />} />
        <Route path="/dyscalculia/practice" element={<Practice />} />
        <Route path="/dyscalculia/real-world" element={<RealWorld />} />
        <Route path="/dyscalculia/progress" element={<Progress />} />
        <Route path="/autism" element={<AutismHome />} />
        <Route path="/autism/communication" element={<Communication />} />
        <Route path="/autism/executive-function" element={<ExecutiveFunction />} />
        <Route path="/autism/sensory" element={<Sensory />} />
        <Route path="/autism/social" element={<Social />} />
        <Route path="/adhd" element={<ADHDHome />} />
        <Route path="/adhd/focus" element={<Focus />} />
        <Route path="/adhd/time" element={<TimeAnchor />} />
        <Route path="/adhd/capture" element={<Capture />} />
        <Route path="/adhd/tasks" element={<Tasks />} />
        <Route path="/adhd/energy" element={<Energy />} />
        <Route path="/adhd/reflect" element={<Reflect />} />
        <Route path="/parent-dashboard" element={<ParentDashboard />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
};

function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App