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
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGithubAdminAuth } from '../context/GithubAdminAuthContext';
import { isGithubAdminMode } from '../api/adminData';
import { routes } from '../routes';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const expressAuth = useAuth();
  const githubAuth = useGithubAdminAuth();
  const location = useLocation();

  const isLoading = isGithubAdminMode ? githubAuth.isLoading : expressAuth.isLoading;
  const isAuthenticated = isGithubAdminMode ? !!githubAuth.token : !!expressAuth.username;

  if (isLoading) {
    return <div className="min-h-screen bg-wood" />;
  }

  if (!isAuthenticated) {
    return <Navigate to={routes.adminLogin} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
