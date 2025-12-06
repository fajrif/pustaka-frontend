import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import UserProfile from './pages/UserProfile';
import Dashboard from './pages/Dashboard';
import Users from './pages/operationals/Users';
import Publishers from './pages/operationals/Publishers';

import MasterJenisBuku from './pages/masters/MasterJenisBuku';
import MasterJenjangStudi from './pages/masters/MasterJenjangStudi';
import MasterBidangStudi from './pages/masters/MasterBidangStudi';
import MasterKelas from './pages/masters/MasterKelas';
import MasterCities from './pages/masters/MasterCities';

// Layout
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/users" element={
              <ProtectedRoute>
                <Layout>
                  <Users />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/publishers" element={
              <ProtectedRoute>
                <Layout>
                  <Publishers />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout>
                  <UserProfile />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/master-jenis-buku" element={
              <ProtectedRoute adminOnly>
                <Layout>
                  <MasterJenisBuku />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/master-jenjang-studi" element={
              <ProtectedRoute adminOnly>
                <Layout>
                  <MasterJenjangStudi />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/master-bidang-studi" element={
              <ProtectedRoute adminOnly>
                <Layout>
                  <MasterBidangStudi />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/master-kelas" element={
              <ProtectedRoute adminOnly>
                <Layout>
                  <MasterKelas />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/master-cities" element={
              <ProtectedRoute adminOnly>
                <Layout>
                  <MasterCities />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
