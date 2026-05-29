import { supabase } from "../lib/supabase";

export default function Topbar() {
  async function handleLogout() {
    await supabase.auth.signOut();

    window.location.reload();
  }

  return (
    <header className="topbar">
      <div>
        <h3>Bienvenido Carlos</h3>

        <p>
          Panel administrativo DecoSun Group
        </p>
      </div>

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