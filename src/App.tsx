/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { StrictMode, useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Outlet, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import CalendarPage from './pages/CalendarPage';
import Tasks from './pages/Tasks';
import UnscheduledTasks from './pages/UnscheduledTasks';
import Analytics from './pages/Analytics';
import SpecialFeatures from './pages/SpecialFeatures';
import { Settings } from './pages/Settings';
import { useStore } from './store/useStore';

import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';


const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  {
    path: "/",
    element: (
      <ProtectedRoute />
    ),
    children: [
      {
        path: "/",
        element: (
          <Layout>
            <Outlet />
          </Layout>
        ),
        children: [
          { path: "/", element: <Dashboard /> },
          { path: "/calendar", element: <CalendarPage /> },
          { path: "/tasks", element: <Tasks /> },
          { path: "/unscheduled", element: <UnscheduledTasks /> },
          { path: "/analytics", element: <Analytics /> },
          { path: "/special", element: <SpecialFeatures /> },
          { path: "/settings", element: <Settings /> },
          { path: "*", element: <Navigate to="/" replace /> }
        ]
      }
    ]
  }
]);

export default function App() {
  const theme = useStore(state => state.settings?.theme || 'system');

  useEffect(() => {
    const root = document.documentElement;
    
    
    const applyTheme = (currentTheme: string) => {
      root.classList.remove('dark', 'cute', 'pink');
      if (currentTheme === 'dark') {
        root.classList.add('dark');
      } else if (currentTheme === 'cute') {
        root.classList.add('cute');
      } else if (currentTheme === 'pink') {
        root.classList.add('pink');
      } else if (currentTheme === 'light') {
        // none
      } else {
        // System
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          root.classList.add('dark');
        }
      }
    };

    applyTheme(theme);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <AuthProvider><RouterProvider router={router} /></AuthProvider>
  );
}
