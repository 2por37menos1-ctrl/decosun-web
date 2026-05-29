import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const categories = [
  "Ingreso cliente",
  "Mercadería",
  "Comisión",
  "Manejo gerencia",
  "Traslado",
  "Bencina",
  "Sueldos",
  "Arriendo",
  "Gastos legales",
  "Préstamos",
  "Gastos fijos",
  "Gastos variables",
  "Otros",
];

const banks = [
  "BCI",
  "Scotiabank",
  "Santander",
  "BancoEstado",
  "Mercado Pago",
  "Efectivo",
  "Otro",
];

function money(value) {
  return `$${Number(value || 0).toLocaleString("es-CL")}`;
}

export default function Treasury() {
  const [movements, setMovements] = useState([]);

  const [form, setForm] = useState({
    date: "",
    bank: "BCI",
    description: "",
    type: "egreso",
    amount: "",
    category: "Otros",
    subcategory: "",
    branch: "Viña del Mar",
    person_name: "",
    notes: "",
  });

  useEffect(() => {
    loadMovements();
  }, []);

  async function loadMovements() {
    const { data, error } = await supabase
      .from("treasury_movements")
      .select("*")
      .order("date", { ascending: false });

    if (!error) setMovements(data || []);
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveMovement(e) {
    e.preventDefault();

    const payload = {
      ...form,
      amount: Number(form.amount || 0),
    };

    const { error } = await supabase
      .from("treasury_movements")
      .insert(payload);

    if (error) {
      alert("No se pudo guardar el movimiento.");
      return;
    }

    setForm({
      date: "",
      bank: "BCI",
      description: "",
      type: "egreso",
      amount: "",
      category: "Otros",
      subcategory: "",
      branch: "Viña del Mar",
      person_name: "",
      notes: "",
    });

    loadMovements();
  }

  const totalIncome = movements
    .filter((m) => m.type === "ingreso")
    .reduce((acc, m) => acc + Number(m.amount || 0), 0);

  const totalExpense = movements
    .filter((m) => m.type === "egreso")
    .reduce((acc, m) => acc + Number(m.amount || 0), 0);

  const balance = totalIncome - totalExpense;

  return (
    <section className="treasury-page">
      <div className="dashboard-header">
        <div>
          <h2>Tesorería</h2>
          <p>Flujo caja y clasificación financiera DecoSun</p>
        </div>
      </div>

      <div className="treasury-summary">
        <div className="stat-card">
          <span>Ingresos</span>
          <h2>{money(totalIncome)}</h2>
        </div>

        <div className="stat-card">
          <span>Egresos</span>
          <h2>{money(totalExpense)}</h2>
        </div>

        <div className="stat-card">
          <span>Saldo</span>
          <h2>{money(balance)}</h2>
        </div>
      </div>

      <form className="treasury-form" onSubmit={saveMovement}>
        <input
          type="date"
          value={form.date}
          onChange={(e) => updateField("date", e.target.value)}
        />

        <select
          value={form.bank}
          onChange={(e) => updateField("bank", e.target.value)}
        >
          {banks.map((bank) => (
            <option key={bank}>{bank}</option>
          ))}
        </select>

        <input
          placeholder="Glosa / descripción"
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
        />

        <select
          value={form.type}
          onChange={(e) => updateField("type", e.target.value)}
        >
          <option value="ingreso">Ingreso</option>
          <option value="egreso">Egreso</option>
        </select>

        <input
          type="number"
          placeholder="Monto"
          value={form.amount}
          onChange={(e) => updateField("amount", e.target.value)}
        />

        <select
          value={form.category}
          onChange={(e) => updateField("category", e.target.value)}
        >
          {categories.map((cat) => (
            <option key={cat}>{cat}</option>
          ))}
        </select>

        <input
          placeholder="Subcategoría"
          value={form.subcategory}
          onChange={(e) => updateField("subcategory", e.target.value)}
        />

        <select
          value={form.branch}
          onChange={(e) => updateField("branch", e.target.value)}
        >
          <option>Viña del Mar</option>
          <option>Iquique</option>
          <option>General</option>
        </select>

        <input
          placeholder="Nombre / proveedor"
          value={form.person_name}
          onChange={(e) => updateField("person_name", e.target.value)}
        />

        <input
          placeholder="Comentario"
          value={form.notes}
          onChange={(e) => updateField("notes", e.target.value)}
        />

        <button className="primary-btn">
          Guardar movimiento
        </button>
      </form>

      <div className="treasury-table">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Banco</th>
              <th>Glosa</th>
              <th>Tipo</th>
              <th>Monto</th>
              <th>Categoría</th>
              <th>Sucursal</th>
              <th>Nombre</th>
            </tr>
          </thead>

          <tbody>
            {movements.map((m) => (
              <tr key={m.id}>
                <td>{m.date}</td>
                <td>{m.bank}</td>
                <td>{m.description}</td>
                <td>{m.type}</td>
                <td>{money(m.amount)}</td>
                <td>{m.category}</td>
                <td>{m.branch}</td>
                <td>{m.person_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}