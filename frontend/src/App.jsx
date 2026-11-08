import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import CitizenPortalPage from './pages/CitizenPortalPage';
import ChatbotWidget from './components/ChatbotWidget';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-amber-400 selection:text-slate-950">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Portal Landing */}
              <Route path="/" element={<CitizenPortalPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Main Universal Dashboard Entry */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Dedicated Citizen Portal Views */}
              <Route
                path="/citizen/complaints"
                element={
                  <ProtectedRoute>
                    <DashboardPage defaultTab="MY_COMPLAINTS" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/citizen/file-fir"
                element={
                  <ProtectedRoute>
                    <DashboardPage defaultTab="FILE_COMPLAINT" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/citizen/sos"
                element={
                  <ProtectedRoute>
                    <DashboardPage defaultTab="SOS_CITIZEN" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/citizen/rakshak-ai"
                element={
                  <ProtectedRoute>
                    <DashboardPage defaultTab="AI_ADVISOR" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/citizen/safety-map"
                element={
                  <ProtectedRoute>
                    <DashboardPage defaultTab="SAFETY_MAP" />
                  </ProtectedRoute>
                }
              />

              {/* Dedicated Police Operations Hub Views */}
              <Route
                path="/officer/thana-desk"
                element={
                  <ProtectedRoute>
                    <DashboardPage defaultTab="THANA_DESK" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/officer/case-diary"
                element={
                  <ProtectedRoute>
                    <DashboardPage defaultTab="IO_WORKSPACE" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/officer/dispatch"
                element={
                  <ProtectedRoute>
                    <DashboardPage defaultTab="SOS_DISPATCH" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/officer/evidence"
                element={
                  <ProtectedRoute>
                    <DashboardPage defaultTab="EVIDENCE_LOCKER" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/officer/analytics"
                element={
                  <ProtectedRoute>
                    <DashboardPage defaultTab="CRIME_HOTSPOTS" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/officer/command"
                element={
                  <ProtectedRoute>
                    <DashboardPage defaultTab="EXECUTIVE_COMMAND" />
                  </ProtectedRoute>
                }
              />

              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <ChatbotWidget />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
