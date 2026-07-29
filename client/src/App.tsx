/**
 * B.H. Copyright (c) 2026 Yemot HaMashiach Ltd.
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * Yemot HaMashiach Ltd. ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with Yemot HaMashiach Ltd.
 *
 * Unauthorized copying of this file, via any medium, is strictly prohibited.
 */
import { HashRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { GithubAdminAuthProvider } from './context/GithubAdminAuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ViewerHome } from './pages/ViewerHome';
import { ViewerPage } from './pages/ViewerPage';
import { VideosPage } from './pages/VideosPage';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminPageEditor } from './pages/admin/AdminPageEditor';
import { AdminVideos } from './pages/admin/AdminVideos';
import { AdminUpcoming } from './pages/admin/AdminUpcoming';

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <GithubAdminAuthProvider>
          <Routes>
            <Route path="/" element={<ViewerHome />} />
            <Route path="/view/:pageId" element={<ViewerPage />} />
            <Route path="/videos" element={<VideosPage />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/pages/:pageId"
              element={
                <ProtectedRoute>
                  <AdminPageEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/videos"
              element={
                <ProtectedRoute>
                  <AdminVideos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/upcoming"
              element={
                <ProtectedRoute>
                  <AdminUpcoming />
                </ProtectedRoute>
              }
            />
          </Routes>
        </GithubAdminAuthProvider>
      </AuthProvider>
    </HashRouter>
  );
}
