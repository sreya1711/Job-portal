import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';

// Public Pages
import Home from './pages/Home';
import JobSearch from './pages/JobSearch';
import JobDetails from './pages/JobDetails';

// Auth Page
import LoginSignup from './pages/auth/LoginSignup';

// Dashboard Pages
import JobSeekerDashboard from './pages/JobSeekerDashboard';
import EnhancedEmployerDashboard from './pages/EmployerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CandidateProfile from './pages/CandidateProfile';

// Components
import Header from './components/Header';
import Footer from './components/Footer';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login-signup" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// Role-based Dashboard Redirect
const DashboardRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login-signup" replace />;
  }
  
  switch (user?.role) {
    case 'jobseeker':
      return <Navigate to="/jobseeker/dashboard" replace />;
    case 'employer':
      return <Navigate to="/employer/dashboard" replace />;
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    default:
      return <Navigate to="/" replace />;
  }
};

// Initial Redirect Component
const HomeRedirect = () => {
  const { isAuthenticated, user } = useAuth();
  
  if (isAuthenticated) {
    return <DashboardRedirect />;
  }
  
  return <Home />;
};

function AppContent() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-grow">
        <Routes>
          {/* Public Routes with Redirect */}
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/search" element={<JobSearch />} />
          <Route path="/job/:id" element={<JobDetails />} />
          
          {/* Auth Route - Single unified login/signup page */}
          <Route 
            path="/login-signup" 
            element={<LoginSignup />} 
          />
          
          {/* Dashboard Routes - Role-based access */}
          <Route 
            path="/jobseeker/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['jobseeker']}>
                <JobSeekerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/employer/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['employer']}>
                <EnhancedEmployerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Candidate Public Profile - accessible to employer or admin */}
          <Route
            path="/candidates/:id"
            element={
              <ProtectedRoute allowedRoles={['employer', 'admin']}>
                <CandidateProfile />
              </ProtectedRoute>
            }
          />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppContent />
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;