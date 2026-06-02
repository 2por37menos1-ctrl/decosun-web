import { supabase } from "../lib/supabase";

export default function Topbar() {
  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  return (
    <header className="topbar">
      <div />

      <div className="topbar-actions">
        <button className="secondary-btn">
          Actualizar
        </button>

        <button
          className="primary-btn"
          onClick={handleLogout}
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}