import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from './ProtectedRoute';

// Lazy loading features for optimized performance and code splitting
const Home = lazy(() => import('../features/home/Home'));
const Login = lazy(() => import('../features/auth/Login'));
const Register = lazy(() => import('../features/auth/Register'));

// Candidate Domain
const CandidateDashboard = lazy(() => import('../features/candidate/CandidateDashboard'));
const CodingAssessment   = lazy(() => import('../features/candidate/CodingAssessment'));

// Recruiter Domain
const RecruiterDashboard = lazy(() => import('../features/recruiter/RecruiterDashboard'));
const RecruiterSessions  = lazy(() => import('../features/recruiter/RecruiterSessions'));
const RecruiterCandidates = lazy(() => import('../features/recruiter/RecruiterCandidates'));
const RecruiterAlerts    = lazy(() => import('../features/recruiter/RecruiterAlerts'));
const QuestionManager    = lazy(() => import('../features/recruiter/QuestionManager'));
const SessionDetails     = lazy(() => import('../features/recruiter/SessionDetails'));


const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-[#020817]">
    <div className="relative">
      <div className="w-12 h-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
      <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
    </div>
  </div>
);

/**
 * Enterprise Application Router
 * Implements lazy loading, RBAC, and clean domain-based routing
 */
export default function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Marketing Routes */}
        <Route path="/" element={<Home />} />
        
        {/* Auth Routes (Redirect if already logged in) */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* Candidate Domain Routes */}
        <Route path="/candidate" element={<ProtectedRoute role="candidate"><CandidateDashboard /></ProtectedRoute>} />
        <Route path="/candidate/assessment" element={<ProtectedRoute role="candidate"><CodingAssessment /></ProtectedRoute>} />
        
        {/* Recruiter Domain Routes */}
        <Route path="/recruiter" element={<ProtectedRoute role="recruiter"><RecruiterDashboard /></ProtectedRoute>} />
        <Route path="/recruiter/sessions" element={<ProtectedRoute role="recruiter"><RecruiterSessions /></ProtectedRoute>} />
        <Route path="/recruiter/sessions/:id" element={<ProtectedRoute role="recruiter"><SessionDetails /></ProtectedRoute>} />
        <Route path="/recruiter/candidates" element={<ProtectedRoute role="recruiter"><RecruiterCandidates /></ProtectedRoute>} />
        <Route path="/recruiter/alerts" element={<ProtectedRoute role="recruiter"><RecruiterAlerts /></ProtectedRoute>} />
        <Route path="/recruiter/questions" element={<ProtectedRoute role="recruiter"><QuestionManager /></ProtectedRoute>} />

        {/* Catch-all Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
