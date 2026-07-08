import { useEffect, useState } from "react"
import {
  BarChart3,
  FolderKanban,
  Landmark,
  LayoutDashboard,
  PackageCheck,
  Receipt,
  Settings,
  Users,
} from "lucide-react"

const navItems = [
  { id: "inicio", label: "Dashboard", icon: LayoutDashboard },
  { id: "comercial", label: "Comercial", icon: BarChart3 },
  { id: "proyectos", label: "Proyectos", icon: FolderKanban },
  { id: "finanzas", label: "Finanzas", icon: Receipt },
  { id: "operaciones", label: "Operaciones", icon: PackageCheck },
  { id: "mercado_publico", label: "Mercado Publico", icon: Landmark },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "configuracion", label: "Configuracion", icon: Settings },
]

export default function Sidebar() {
  const [activeView, setActiveView] = useState("inicio")

  useEffect(() => {
    function handleViewChange(event) {
      setActiveView(event.detail?.view || "inicio")
    }

    window.addEventListener("decosun:panel-view-changed", handleViewChange)

    return () => {
      window.removeEventListener("decosun:panel-view-changed", handleViewChange)
    }
  }, [])

  function navigate(view) {
    window.dispatchEvent(
      new CustomEvent("decosun:panel-navigate", {
        detail: { view },
      })
    )
  }

  return (
    <aside className="sidebar">
      <div>
        <h1 className="logo">DecoSun</h1>

        <p className="sidebar-subtitle">
          Decoracion y control solar
        </p>
      </div>

      <nav className="nav-menu">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id

          return (
            <button
              key={item.id}
              type="button"
              className={isActive ? "nav-item active" : "nav-item"}
              onClick={() => navigate(item.id)}
            >
              <Icon size={18} />
              {item.label}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
