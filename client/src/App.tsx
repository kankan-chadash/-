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
import { GuideProvider } from './components/Onboarding/GuideContext';
import { WelcomeGuide } from './components/Onboarding/WelcomeGuide';
import { ViewerHome } from './pages/ViewerHome';
import { ViewerPage } from './pages/ViewerPage';
import { VideosPage } from './pages/VideosPage';
import { NotFound } from './pages/NotFound';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminPageEditor } from './pages/admin/AdminPageEditor';
import { AdminVideos } from './pages/admin/AdminVideos';
import { AdminUpcoming } from './pages/admin/AdminUpcoming';
import { routes } from './routes';

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <GithubAdminAuthProvider>
          <GuideProvider>
            <WelcomeGuide />
            <Routes>
              <Route path={routes.library} element={<ViewerHome />} />
              <Route path={routes.dafPattern} element={<ViewerPage />} />
              <Route path={routes.videos} element={<VideosPage />} />
              <Route path={routes.adminLogin} element={<AdminLogin />} />
              <Route
                path={routes.admin}
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path={routes.adminPagePattern}
                element={
                  <ProtectedRoute>
                    <AdminPageEditor />
                  </ProtectedRoute>
                }
              />
              <Route
                path={routes.adminVideos}
                element={
                  <ProtectedRoute>
                    <AdminVideos />
                  </ProtectedRoute>
                }
              />
              <Route
                path={routes.adminUpcoming}
                element={
                  <ProtectedRoute>
                    <AdminUpcoming />
                  </ProtectedRoute>
                }
              />
              {/* Anything else — including the old /admin — gets the ordinary
                  not-found page rather than a blank screen, which also means a
                  guessed admin URL reveals nothing. */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </GuideProvider>
        </GithubAdminAuthProvider>
      </AuthProvider>
    </HashRouter>
  );
}
