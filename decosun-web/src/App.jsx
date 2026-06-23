import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";

import Home from "./pages/Home";
import Soluciones from "./pages/Soluciones";
import Proyectos from "./pages/Proyectos";
import Nosotros from "./pages/Nosotros";
import Cotizar from "./pages/Cotizar";
import Login from "./pages/Login";
import Agenda from "./pages/Agenda";
import ProjectStatusPublic from "./pages/ProjectStatusPublic";
import MercadoPublico from "./pages/MercadoPublico";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Academy = lazy(() => import("./pages/Academy"));
const AcademyCommercial = lazy(() => import("./pages/AcademyCommercial"));

function AppContent() {
  const location = useLocation();

  const isPanel = location.pathname.startsWith("/panel");
  const isPublicStatus = location.pathname.startsWith("/estado");

  return (
    <div className="min-h-screen bg-white text-slate-800">
      {!isPanel && !isPublicStatus && <Navbar />}

      <Routes>
        {/* Sitio Público */}
        <Route path="/" element={<Home />} />
        <Route path="/soluciones" element={<Soluciones />} />
        <Route path="/proyectos" element={<Proyectos />} />
        <Route path="/nosotros" element={<Nosotros />} />
        <Route path="/cotizar" element={<Cotizar />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/estado/:token" element={<ProjectStatusPublic />} />
        <Route path="/login" element={<Login />} />
        <Route path="/panel/mercado-publico" element={<MercadoPublico />} />

        {/* Panel DecoSun */}
        <Route
          path="/panel"
          element={
            <Suspense fallback={<div>Cargando panel...</div>}>
              <Dashboard />
            </Suspense>
          }
        />

        {/* Academia DecoSun */}
        <Route
          path="/panel/academy"
          element={
            <Suspense fallback={<div>Cargando Academia DecoSun...</div>}>
              <Academy />
            </Suspense>
          }
        />

        <Route
          path="/panel/academy/comercial"
          element={
            <Suspense fallback={<div>Cargando Academia Comercial...</div>}>
              <AcademyCommercial />
            </Suspense>
          }
        />
      </Routes>

      {!isPanel && !isPublicStatus && <Footer />}
      {!isPanel && !isPublicStatus && <WhatsAppButton />}
    </div>
  );
}

export default function App() {


  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}