import { useState } from "react"
import { supabase } from "../lib/supabase"

export default function Agenda() {
  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    ciudad: "",
    tipo: "Visita técnica",
    fecha: "",
    horario: "",
    observaciones: "",
  })

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  async function handleSubmit(e) {
  e.preventDefault()

  const { error } = await supabase.from("agenda").insert([
    {
      nombre: form.nombre,
      telefono: form.telefono,
      ciudad: form.ciudad,
      tipo: form.tipo,
      fecha: form.fecha,
      horario: form.horario,
      observaciones: form.observaciones,
      estado: "Pendiente",
    },
  ])

  if (error) {
    console.error("Error al guardar agenda:", error)
    alert("No se pudo guardar la solicitud. Intenta nuevamente.")
    return
  }

  alert("Solicitud recibida. Pronto nuestro equipo confirmará la visita.")

  setForm({
    nombre: "",
    telefono: "",
    ciudad: "",
    tipo: "Visita técnica",
    fecha: "",
    horario: "",
    observaciones: "",
  })
}

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.35em] text-amber-300">
            Agenda DecoSun
          </p>

          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            Agenda tu visita técnica o instalación
          </h1>

          <p className="mt-6 text-lg leading-8 text-slate-300">
            Coordina una visita con nuestro equipo para medición, instalación,
            mantención o seguimiento de tu proyecto.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur md:p-8"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Nombre cliente
                </label>
                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-amber-300"
                  placeholder="Nombre y apellido"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Teléfono / WhatsApp
                </label>
                <input
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-amber-300"
                  placeholder="+56 9..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Ciudad
                </label>
                <select
                  name="ciudad"
                  value={form.ciudad}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-amber-300"
                >
                  <option value="">Seleccionar ciudad</option>
                  <option value="Iquique">Iquique</option>
                  <option value="Viña del Mar">Viña del Mar</option>
                  <option value="Santiago">Santiago</option>
                  <option value="Otra ciudad">Otra ciudad</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Tipo de solicitud
                </label>
                <select
                  name="tipo"
                  value={form.tipo}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-amber-300"
                >
                  <option>Visita técnica</option>
                  <option>Medición</option>
                  <option>Instalación</option>
                  <option>Mantención</option>
                  <option>Postventa</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Fecha tentativa
                </label>
                <input
                  type="date"
                  name="fecha"
                  value={form.fecha}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-amber-300"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Horario preferido
                </label>
                <select
                  name="horario"
                  value={form.horario}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-amber-300"
                >
                  <option value="">Seleccionar horario</option>
                  <option>Mañana</option>
                  <option>Mediodía</option>
                  <option>Tarde</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-slate-300">
                  Observaciones
                </label>
                <textarea
                  name="observaciones"
                  value={form.observaciones}
                  onChange={handleChange}
                  rows="4"
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-amber-300"
                  placeholder="Ej: departamento, oficina, cantidad aproximada de cortinas, comuna, referencias, etc."
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-6 w-full rounded-full bg-amber-300 px-6 py-4 text-sm font-bold uppercase tracking-wide text-slate-950 transition hover:bg-amber-200"
            >
              Solicitar agendamiento
            </button>
          </form>

          <aside className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 md:p-8">
            <h2 className="text-2xl font-bold">
              Estado inicial de tu solicitud
            </h2>

            <div className="mt-8 space-y-5">
              {[
                "Solicitud recibida",
                "Confirmación del equipo",
                "Visita agendada",
                "Medición / revisión técnica",
                "Producción o instalación",
              ].map((item, index) => (
                <div key={item} className="flex gap-4">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      index === 0
                        ? "bg-amber-300 text-slate-950"
                        : "bg-white/10 text-slate-400"
                    }`}
                  >
                    {index + 1}
                  </div>

                  <div>
                    <p className="font-semibold text-white">{item}</p>
                    <p className="text-sm text-slate-400">
                      {index === 0
                        ? "Tu solicitud quedará registrada para coordinación."
                        : "Este estado se actualizará desde el panel DecoSun."}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-3xl bg-white/10 p-5">
  <p className="text-sm text-slate-300">
    Al enviar tu solicitud, nuestro equipo recibirá la información en el panel
    interno de DecoSun y se comunicará contigo para confirmar disponibilidad,
    horario y detalles de la visita.
  </p>
</div>
          </aside>
        </div>
      </section>
    </main>
  )
}