import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const estados = [
  "Pendiente",
  "Contactado",
  "Presupuesto enviado",
  "Visita agendada",
  "Medición realizada",
  "Aceptado / proyecto",
  "Producción",
  "Instalación agendada",
  "Instalado",
  "Finalizado",
  "Cancelado",
];

const responsables = [
  "Carlos",
  "Edgar",
  "Javiera",
  "Vale",
  "Instalación",
  "Pendiente",
];

const sucursales = ["Iquique", "Viña del Mar", "General"];

const tiposVisita = [
  "Visita técnica",
  "Medición",
  "Instalación",
  "Seguimiento",
  "Postventa",
];

export default function AgendaPanel() {
  const [agenda, setAgenda] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    ciudad: "",
    tipo: "Visita técnica",
    fecha: "",
    horario: "",
    observaciones: "",
    estado: "Pendiente",
    branch: "Viña del Mar",
    assigned_to: "Pendiente",
  });

  useEffect(() => {
    fetchAgenda();
  }, []);

  async function fetchAgenda() {
    const { data, error } = await supabase
      .from("agenda")
      .select("*")
      .order("fecha", { ascending: true });

    if (error) {
      console.error("Error cargando agenda:", error);
      setLoading(false);
      return;
    }

    setAgenda(data || []);
    setLoading(false);
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function createAgendaItem(e) {
    e.preventDefault();

    const { error } = await supabase.from("agenda").insert(form);

    if (error) {
      console.error("Error creando agenda:", error);
      alert("No se pudo crear la agenda.");
      return;
    }

    setForm({
      nombre: "",
      telefono: "",
      ciudad: "",
      tipo: "Visita técnica",
      fecha: "",
      horario: "",
      observaciones: "",
      estado: "Pendiente",
      branch: "Viña del Mar",
      assigned_to: "Pendiente",
    });

    fetchAgenda();
  }

  async function updateAgendaField(id, field, value) {
    const { error } = await supabase
      .from("agenda")
      .update({ [field]: value })
      .eq("id", id);

    if (error) {
      console.error("Error actualizando agenda:", error);
      alert("No se pudo actualizar la agenda.");
      return;
    }

    fetchAgenda();
  }

  async function deleteAgendaItem(id) {
    const confirmDelete = window.confirm(
      "¿Seguro que deseas borrar este evento de agenda?"
    );

    if (!confirmDelete) return;

    const { error } = await supabase.from("agenda").delete().eq("id", id);

    if (error) {
      console.error("Error borrando agenda:", error);
      alert("No se pudo borrar el evento.");
      return;
    }

    setAgenda((current) => current.filter((item) => item.id !== id));
  }

  if (loading) {
    return <div className="loading-screen">Cargando agenda...</div>;
  }

  return (
    <section className="agenda-panel">
      <div className="dashboard-header">
        <div>
          <h2>Agenda operativa</h2>
          <p>Visitas, mediciones, instalaciones y seguimientos DecoSun.</p>
        </div>
      </div>

      <form className="agenda-form compact" onSubmit={createAgendaItem}>
        <input
          placeholder="Cliente"
          value={form.nombre}
          onChange={(e) => updateField("nombre", e.target.value)}
        />

        <input
          placeholder="Teléfono"
          value={form.telefono}
          onChange={(e) => updateField("telefono", e.target.value)}
        />

        <input
          placeholder="Ciudad"
          value={form.ciudad}
          onChange={(e) => updateField("ciudad", e.target.value)}
        />

        <select
          value={form.tipo}
          onChange={(e) => updateField("tipo", e.target.value)}
        >
          {tiposVisita.map((tipo) => (
            <option key={tipo}>{tipo}</option>
          ))}
        </select>

        <input
          type="date"
          value={form.fecha}
          onChange={(e) => updateField("fecha", e.target.value)}
        />

        <input
          placeholder="Horario"
          value={form.horario}
          onChange={(e) => updateField("horario", e.target.value)}
        />

        <select
          value={form.branch}
          onChange={(e) => updateField("branch", e.target.value)}
        >
          {sucursales.map((sucursal) => (
            <option key={sucursal}>{sucursal}</option>
          ))}
        </select>

        <select
          value={form.assigned_to}
          onChange={(e) => updateField("assigned_to", e.target.value)}
        >
          {responsables.map((responsable) => (
            <option key={responsable}>{responsable}</option>
          ))}
        </select>

        <input
          className="agenda-notes-input"
          placeholder="Observaciones"
          value={form.observaciones}
          onChange={(e) => updateField("observaciones", e.target.value)}
        />

        <button className="primary-btn">Crear</button>
      </form>

      <div className="agenda-list compact-list">
        {agenda.length === 0 ? (
          <div className="agenda-empty">No hay eventos de agenda.</div>
        ) : (
          agenda.map((item) => (
            <article key={item.id} className="agenda-row-card">
              <div className="agenda-main-info">
                <div className="agenda-date-box">
                  <strong>{item.fecha || "Sin fecha"}</strong>
                  <span>{item.horario || "Sin hora"}</span>
                </div>

                <div>
                  <h3>{item.nombre || "Sin cliente"}</h3>
                  <p>
                    {item.telefono || "Sin teléfono"} ·{" "}
                    {item.ciudad || "Sin ciudad"}
                  </p>
                  <p>
                    {item.tipo || "Visita"} · {item.branch || "Sin sucursal"} ·{" "}
                    {item.assigned_to || "Pendiente"}
                  </p>

                  {item.observaciones && (
                    <p className="agenda-note">{item.observaciones}</p>
                  )}
                </div>
              </div>

              <div className="agenda-actions compact-actions">
                <select
                  value={item.estado || "Pendiente"}
                  onChange={(e) =>
                    updateAgendaField(item.id, "estado", e.target.value)
                  }
                >
                  {estados.map((estado) => (
                    <option key={estado} value={estado}>
                      {estado}
                    </option>
                  ))}
                </select>

                <select
                  value={item.branch || "Viña del Mar"}
                  onChange={(e) =>
                    updateAgendaField(item.id, "branch", e.target.value)
                  }
                >
                  {sucursales.map((sucursal) => (
                    <option key={sucursal}>{sucursal}</option>
                  ))}
                </select>

                <select
                  value={item.assigned_to || "Pendiente"}
                  onChange={(e) =>
                    updateAgendaField(item.id, "assigned_to", e.target.value)
                  }
                >
                  {responsables.map((responsable) => (
                    <option key={responsable}>{responsable}</option>
                  ))}
                </select>

                <button
                  type="button"
                  className="delete-btn"
                  onClick={() => deleteAgendaItem(item.id)}
                >
                  Borrar
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}