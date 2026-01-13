import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Ocorrencias from "./pages/Ocorrencias";
import OccurrenceDetail from "./pages/OccurrenceDetail";
import Kanbans from "./pages/Kanbans";
import Analise from "./pages/Analise";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import NovaOcorrencia from "./pages/NovaOcorrencia";
import NovaOcorrenciaWizard from "./pages/NovaOcorrenciaWizard";
import NovaOcorrenciaForm from "./pages/NovaOcorrenciaForm";
import Perfil from "./pages/Perfil";

import PublicRevisaoLaudo from "./pages/PublicRevisaoLaudo";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Protected routes - all users */}
            <Route path="/" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/ocorrencias" element={
              <ProtectedRoute>
                <Ocorrencias />
              </ProtectedRoute>
            } />
            <Route path="/ocorrencias/:id" element={
              <ProtectedRoute>
                <OccurrenceDetail />
              </ProtectedRoute>
            } />
            <Route path="/ocorrencias/nova" element={
              <ProtectedRoute>
                <NovaOcorrenciaWizard />
              </ProtectedRoute>
            } />
            <Route path="/ocorrencias/nova/:tipo" element={
              <ProtectedRoute>
                <NovaOcorrencia />
              </ProtectedRoute>
            } />
            <Route path="/ocorrencias/nova/:tipo/:subtipo" element={
              <ProtectedRoute>
                <NovaOcorrenciaForm />
              </ProtectedRoute>
            } />
            <Route path="/kanbans" element={
              <ProtectedRoute>
                <Kanbans />
              </ProtectedRoute>
            } />
            <Route path="/perfil" element={
              <ProtectedRoute>
                <Perfil />
              </ProtectedRoute>
            } />
            
            {/* Protected routes - admin only */}
            <Route path="/analise" element={
              <ProtectedRoute requireAdmin>
                <Analise />
              </ProtectedRoute>
            } />
            <Route path="/relatorios" element={
              <ProtectedRoute requireAdmin>
                <Relatorios />
              </ProtectedRoute>
            } />
            <Route path="/configuracoes" element={
              <ProtectedRoute requireAdmin>
                <Configuracoes />
              </ProtectedRoute>
            } />
            
            {/* Public routes for doctors (no auth required) */}
            <Route path="/public/revisao-laudo/:token" element={<PublicRevisaoLaudo />} />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
