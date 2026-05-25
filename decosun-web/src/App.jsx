import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./auth/AuthContext"
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"
import WhatsAppButton from "./components/WhatsAppButton"
import Home from "./pages/Home"
import Soluciones from "./pages/Soluciones"
import Proyectos from "./pages/Proyectos"
import Nosotros from "./pages/Nosotros"
import Cotizar from "./pages/Cotizar"
import Login from "./pages/Login"
import Panel from "./pages/Panel"

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-white text-slate-800">
          <Navbar />

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/soluciones" element={<Soluciones />} />
            <Route path="/proyectos" element={<Proyectos />} />
            <Route path="/nosotros" element={<Nosotros />} />
            <Route path="/cotizar" element={<Cotizar />} />
            <Route path="/login" element={<Login />} />
            <Route path="/panel" element={<Panel />} />
          </Routes>

          <Footer />
          <WhatsAppButton />
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}