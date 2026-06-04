export default function AcademyCommercial() {
  const modules = [
    {
      title: "1. Bienvenido a DecoSun",
      text: "DecoSun no es una tienda online de cortinas. Somos una empresa de soluciones de control solar con asesoría, visita técnica, fabricación, instalación y seguimiento.",
    },
    {
      title: "2. Método DecoSun",
      text: "Cliente → Visita Comercial → Cotización → Aprobación → Preinstalación → Producción → Instalación → Entrega.",
    },
    {
      title: "3. Productos principales",
      text: "Roller simple, Roller DUO, Roller doble, persianas verticales, toldos, motorización y futuras líneas como pérgolas.",
    },
    {
      title: "4. Medición comercial",
      text: "La primera medición sirve para cotizar. Ejemplo: un ventanal de 3.20 x 2.35 permite calcular valor, pero no es medida de fabricación.",
    },
    {
      title: "5. Preinstalación",
      text: "Después de aprobar la cotización, el técnico instala mecanismos, define cadena, toma fotos y mide entre mecanismos. Esa es la medida de fabricación.",
    },
    {
      title: "6. Qué no debe prometer el vendedor",
      text: "No prometer fechas exactas sin confirmar, colores sin stock, descuentos no autorizados ni medidas definitivas antes de preinstalar.",
    },
  ];

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", padding: 28 }}>
      <section
        style={{
          background: "linear-gradient(135deg, #0f172a, #2563eb)",
          color: "white",
          borderRadius: 28,
          padding: 34,
          marginBottom: 28,
        }}
      >
        <p style={{ opacity: 0.8 }}>Ruta inicial para vendedores</p>
        <h1 style={{ fontSize: 38, margin: 0 }}>Academia Comercial DecoSun</h1>
        <p style={{ maxWidth: 780, fontSize: 17 }}>
          Este módulo explica cómo vendemos, cómo funciona el proceso DecoSun y
          qué debe entender cada vendedor antes de ofrecer productos.
        </p>
      </section>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 18,
        }}
      >
        {modules.map((module) => (
          <article
            key={module.title}
            style={{
              background: "white",
              borderRadius: 20,
              padding: 24,
              border: "1px solid #e2e8f0",
              boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
            }}
          >
            <h2 style={{ fontSize: 21 }}>{module.title}</h2>
            <p style={{ color: "#475569", lineHeight: 1.6 }}>{module.text}</p>
          </article>
        ))}
      </div>
    </div>
  );
}