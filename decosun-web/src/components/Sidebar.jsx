import {
  LayoutDashboard,
  FolderKanban,
  Receipt,
  Users,
  Settings
} from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div>
        <h1 className="logo">DecoSun</h1>

        <p className="sidebar-subtitle">
          Decoración y control solar
        </p>
      </div>

      <nav className="nav-menu">
        <button className="nav-item active">
          <LayoutDashboard size={18} />
          Dashboard
        </button>

        <button className="nav-item">
          <FolderKanban size={18} />
          Proyectos
        </button>

        <button className="nav-item">
          <Receipt size={18} />
          Finanzas
        </button>

        <button className="nav-item">
          <Users size={18} />
          Clientes
        </button>

        <button className="nav-item">
          <Settings size={18} />
          Configuración
        </button>
      </nav>
    </aside>
  );
}