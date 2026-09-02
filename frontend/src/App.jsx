import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CryptoProvider } from './context/CryptoContext';
import { SocketProvider } from './context/SocketContext';
import { SidebarProvider } from './context/SidebarContext';
import { ThemeProvider } from './context/ThemeContext';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { LatticeBackground } from './components/ui/LatticeBackground';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ChatPage from './pages/ChatPage';
import FilePage from './pages/FilePage';
import AuditLogsPage from './pages/AuditLogsPage';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('UI Error Boundary caught error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-xl mx-auto my-16 bg-white/[0.08] border border-rose-500/40 rounded-3xl text-center space-y-4 shadow-2xl backdrop-blur-2xl text-slate-100">
          <h2 className="text-lg font-bold text-rose-400">Application Notice</h2>
          <p className="text-xs text-slate-300 font-mono">
            {this.state.error?.message || 'An unexpected rendering notice occurred.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 text-xs font-bold font-mono hover:brightness-110 transition-all shadow-glow-cyan"
          >
            Reload Interface
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const ProtectedLayout = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#09090b] flex flex-col items-center justify-center text-slate-800 dark:text-zinc-200 font-mono text-xs space-y-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 rounded-xl border-2 border-cyan-500/30 border-t-cyan-500 shadow-glow-cyan"
        />
        <p className="tracking-wider text-cyan-600 dark:text-cyan-400 font-semibold">INITIALIZING POST-QUANTUM SHIELD...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 relative selection:bg-cyan-500/30 selection:text-cyan-900 dark:selection:text-cyan-100 transition-colors duration-200">
      <LatticeBackground />
      <Navbar />
      <div className="flex flex-1 relative z-10">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CryptoProvider>
          <SocketProvider>
            <SidebarProvider>
              <Router>
              <Routes>
                {/* Public Authentication Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected Application Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedLayout>
                      <Dashboard />
                    </ProtectedLayout>
                  }
                />
                <Route
                  path="/chat"
                  element={
                    <ProtectedLayout>
                      <ChatPage />
                    </ProtectedLayout>
                  }
                />
                <Route
                  path="/files"
                  element={
                    <ProtectedLayout>
                      <FilePage />
                    </ProtectedLayout>
                  }
                />
                <Route
                  path="/audit-logs"
                  element={
                    <ProtectedLayout>
                      <AuditLogsPage />
                    </ProtectedLayout>
                  }
                />

                {/* Fallback Redirect */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Router>
          </SidebarProvider>
        </SocketProvider>
      </CryptoProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}
