
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { Layout } from './components/Layout';
import { Login, Register } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { Landing } from './pages/Landing';
import { ManageDonations, DonorSearch, SystemLogs, UserManagement, DeletedRecords, DirectoryPermissions, LandingPageManagement } from './pages/Admin';
import { MyDonations } from './pages/MyDonations';
import { SupportCenter } from './pages/SupportCenter';
import { DonationFeedbackPage, FeedbackApprovalPage, PublicFeedbackPage } from './pages/Feedback';
import { MyNotice } from './pages/MyNotice';
import { UserRole } from './types';

const ProtectedRoute = ({ children, allowedRoles }: { children?: React.ReactNode, allowedRoles?: UserRole[] }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Layout>{children}</Layout>;
};

const RootRoute = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />;
};

const App = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<RootRoute />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/public-feedbacks" element={<PublicFeedbackPage />} />
          
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/my-donations" element={<ProtectedRoute><MyDonations /></ProtectedRoute>} />
          <Route path="/donors" element={<ProtectedRoute><DonorSearch /></ProtectedRoute>} />
          <Route path="/support" element={<ProtectedRoute><SupportCenter /></ProtectedRoute>} />
          <Route path="/feedback" element={<ProtectedRoute><DonationFeedbackPage /></ProtectedRoute>} />
          <Route path="/notices" element={<ProtectedRoute><MyNotice /></ProtectedRoute>} />

          <Route path="/users" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.EDITOR]}><UserManagement /></ProtectedRoute>} />
          <Route path="/landing-settings" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.EDITOR]}><LandingPageManagement /></ProtectedRoute>} />
          <Route path="/manage-donations" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.EDITOR]}><ManageDonations /></ProtectedRoute>} />
          <Route path="/approve-feedback" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.EDITOR]}><FeedbackApprovalPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><DirectoryPermissions /></ProtectedRoute>} />
          <Route path="/deleted-users" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><DeletedRecords /></ProtectedRoute>} />
          <Route path="/logs" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.EDITOR]}><SystemLogs /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
