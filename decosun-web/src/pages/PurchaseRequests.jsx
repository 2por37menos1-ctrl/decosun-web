import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const statuses = [
  "solicitado",
  "aprobado",
  "pagado",
  "pedido_realizado",
  "recibido",
  "rechazado",
];

function money(value) {
  return `$${Number(value || 0).toLocaleString("es-CL")}`;
}

export default function PurchaseRequests() {
  const [requests, setRequests] = useState([]);

  const [form, setForm] = useState({
    branch: "Iquique",
    requested_by: "",
    request_type: "stock",
    supplier: "",
    item_detail: "",
    quantity: "",
    estimated_amount: "",
    urgency: "normal",
    notes: "",
  });

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    const { data, error } = await supabase
      .from("purchase_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setRequests(data || []);
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveRequest(e) {
    e.preventDefault();

    const payload = {
      ...form,
      estimated_amount: Number(form.estimated_amount || 0),
      status: "solicitado",
    };

    const { error } = await supabase
      .from("purchase_requests")
      .insert(payload);

    if (error) {
      alert("No se pudo guardar el requerimiento.");
      return;
    }

    setForm({
      branch: "Iquique",
      requested_by: "",
      request_type: "stock",
      supplier: "",
      item_detail: "",
      quantity: "",
      estimated_amount: "",
      urgency: "normal",
      notes: "",
    });

    loadRequests();
  }

  async function updateStatus(request, status) {
  const updates = { status };

  if (status === "pagado") {
    updates.payment_date = new Date()
      .toISOString()
      .slice(0, 10);
  }

  if (status === "recibido") {
    updates.received_date = new Date()
      .toISOString()
      .slice(0, 10);
  }

  const { error } = await supabase
    .from("purchase_requests")
    .update(updates)
    .eq("id", request.id);

  if (error) {
    alert("No se pudo actualizar el estado.");
    return;
  }

  // 🔥 crear movimiento automático en tesorería
  if (status === "pagado") {
    await supabase.from("treasury_movements").insert({
      date: new Date().toISOString().slice(0, 10),

      bank: "BCI",

      description: `Pago mercadería: ${
        request.item_detail || "Sin detalle"
      }`,

      type: "egreso",

      amount: Number(request.estimated_amount || 0),

      category: "Mercadería",

      subcategory: request.supplier || "Proveedor",

      branch: request.branch || "General",

      person_name: request.requested_by || "",

      notes: request.notes || "",
    });
  }

  loadRequests();
}

  const totalPaid = requests
    .filter((r) => r.status === "pagado" || r.status === "pedido_realizado" || r.status === "recibido")
    .reduce((acc, r) => acc + Number(r.estimated_amount || 0), 0);

  return (
    <section className="purchase-page">
      <div className="dashboard-header">
        <div>
          <h2>Requerimientos de mercadería</h2>
          <p>Solicitudes internas de stock o compras asociadas a clientes.</p>
        </div>
      </div>

      <div className="treasury-summary">
        <div className="stat-card">
          <span>Solicitudes</span>
          <h2>{requests.length}</h2>
        </div>

        <div className="stat-card">
          <span>Pendiente estimado</span>
          <h2>{money(totalPending)}</h2>
        </div>

        <div className="stat-card">
          <span>Pagado / gestionado</span>
          <h2>{money(totalPaid)}</h2>
        </div>
      </div>

      <form className="purchase-form" onSubmit={saveRequest}>
        <select
          value={form.branch}
          onChange={(e) => updateField("branch", e.target.value)}
        >
          <option>Iquique</option>
          <option>Viña del Mar</option>
          <option>General</option>
        </select>

        <input
          placeholder="Solicitado por"
          value={form.requested_by}
          onChange={(e) => updateField("requested_by", e.target.value)}
        />

        <select
          value={form.request_type}
          onChange={(e) => updateField("request_type", e.target.value)}
        >
          <option value="stock">Stock</option>
          <option value="cliente">Cliente / proyecto</option>
        </select>

        <input
          placeholder="Proveedor"
          value={form.supplier}
          onChange={(e) => updateField("supplier", e.target.value)}
        />

        <input
          placeholder="Detalle mercadería"
          value={form.item_detail}
          onChange={(e) => updateField("item_detail", e.target.value)}
        />

        <input
          placeholder="Cantidad"
          value={form.quantity}
          onChange={(e) => updateField("quantity", e.target.value)}
        />

        <input
          type="number"
          placeholder="Monto estimado"
          value={form.estimated_amount}
          onChange={(e) => updateField("estimated_amount", e.target.value)}
        />

        <select
          value={form.urgency}
          onChange={(e) => updateField("urgency", e.target.value)}
        >
          <option value="baja">Baja</option>
          <option value="normal">Normal</option>
          <option value="alta">Alta</option>
          <option value="urgente">Urgente</option>
        </select>

        <input
          placeholder="Notas"
          value={form.notes}
          onChange={(e) => updateField("notes", e.target.value)}
        />

        <button className="primary-btn">Crear requerimiento</button>
      </form>

      <div className="purchase-list">
        {requests.map((request) => (
          <article key={request.id} className="purchase-card">
            <div>
              <h3>{request.item_detail || "Sin detalle"}</h3>

              <p>
                {request.branch} · {request.requested_by || "Sin solicitante"}
              </p>

              <p>
                {request.request_type} · {request.supplier || "Sin proveedor"}
              </p>

              <p>
                Cantidad: {request.quantity || "-"} · Urgencia:{" "}
                {request.urgency}
              </p>

              {request.notes && <p>{request.notes}</p>}
            </div>

            <div className="purchase-side">
              <strong>{money(request.estimated_amount)}</strong>

              <select
                value={request.status || "solicitado"}
                onChange={(e) =>
  updateStatus(request, e.target.value)
}
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <small>
                Pago: {request.payment_date || "-"} · Recepción:{" "}
                {request.received_date || "-"}
              </small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}