
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { Layout } from './components/Layout';
import { Login, Register, ResetPassword } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { Landing } from './pages/Landing';
import { AdminUserManagement } from './pages/AdminUserManagement';
import { AdminDonations } from './pages/AdminDonations';
import { AdminSystemLogs } from './pages/AdminSystemLogs';
import { AdminArchives } from './pages/AdminArchives';
import { AdminPermissions } from './pages/AdminPermissions';
import { AdminPageCustomizer } from './pages/AdminPageCustomizer';
import { AdminSummary } from './pages/AdminSummary';
import { DonorDirectory } from './pages/DonorDirectory';
import { MyDonations } from './pages/MyDonations';
import { SupportCenter } from './pages/SupportCenter';
import { DonationFeedbackPage, FeedbackApprovalPage, PublicFeedbackPage } from './pages/Feedback';
import { MyNotice } from './pages/MyNotice';
import { AdminIDCards } from './pages/AdminIDCards';
import { VerifyMember } from './pages/VerifyMember';
import { AdminVerificationHistory } from './pages/AdminVerificationHistory';
import { PublicLayout } from './components/PublicLayout';
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
          <Route path="/reset" element={<ResetPassword />} />
          <Route path="/public-feedbacks" element={<PublicFeedbackPage />} />
          
          {/* Public Verification Route with PublicLayout */}
          <Route path="/verify/:idNumber?" element={<PublicLayout><VerifyMember /></PublicLayout>} />
          
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/my-donations" element={<ProtectedRoute><MyDonations /></ProtectedRoute>} />
          <Route path="/donors" element={<ProtectedRoute><DonorDirectory /></ProtectedRoute>} />
          <Route path="/support" element={<ProtectedRoute><SupportCenter /></ProtectedRoute>} />
          <Route path="/feedback" element={<ProtectedRoute><DonationFeedbackPage /></ProtectedRoute>} />
          <Route path="/notices" element={<ProtectedRoute><MyNotice /></ProtectedRoute>} />

          <Route path="/summary" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.EDITOR]}><AdminSummary /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.EDITOR]}><AdminUserManagement /></ProtectedRoute>} />
          <Route path="/landing-settings" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.EDITOR]}><AdminPageCustomizer /></ProtectedRoute>} />
          <Route path="/manage-donations" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.EDITOR]}><AdminDonations /></ProtectedRoute>} />
          <Route path="/approve-feedback" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.EDITOR]}><FeedbackApprovalPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><AdminPermissions /></ProtectedRoute>} />
          
          {/* Admin Integrated Verification Routes */}
          <Route path="/admin/verify/:idNumber?" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><VerifyMember /></ProtectedRoute>} />
          <Route path="/verification-history" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><AdminVerificationHistory /></ProtectedRoute>} />
          
          <Route path="/deleted-users" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><AdminArchives /></ProtectedRoute>} />
          <Route path="/logs" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.EDITOR]}><AdminSystemLogs /></ProtectedRoute>} />
          <Route path="/team-id-cards" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><AdminIDCards /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
