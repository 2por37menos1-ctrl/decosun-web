import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const fallbackCourses = [
  {
    id: "metodo",
    title: "Método DecoSun",
    description:
      "Flujo completo: captación, visita comercial, cotización, preinstalación, producción, instalación y postventa.",
    level: "Base obligatoria",
  },
  {
    id: "roller",
    title: "Técnico Instalador Roller",
    description:
      "Medición, componentes, preinstalación, instalación y cierre técnico de proyectos roller.",
    level: "Técnico Nivel 1",
  },
  {
    id: "comercial",
    title: "Asesor Comercial DecoSun",
    description:
      "Productos, telas, cotización, atención al cliente y seguimiento profesional.",
    level: "Comercial",
  },
];

const fallbackComponents = [
  {
    id: "minigap",
    name: "Mecanismo MiniGap",
    category: "Roller",
    description:
      "Mecanismo principal usado por DecoSun por su baja separación entre rollers consecutivos.",
    function:
      "Accionar la cortina y reducir la separación visual entre mecanismos.",
    common_errors:
      "Usar cadena corta en cortinas altas o no alinear correctamente los soportes.",
    decosun_standard:
      "Estándar recomendado para instalaciones nuevas de buena terminación.",
  },
  {
    id: "tubo38",
    name: "Tubo 38 mm",
    category: "Roller",
    description:
      "Tubo superior donde se insertan los mecanismos de roller simple, doble y DUO.",
    function: "Servir como eje de enrollamiento de la tela.",
    common_errors: "Corte incorrecto, rebabas, tubo golpeado o deformado.",
    decosun_standard:
      "Tubo estándar DecoSun para la mayoría de los sistemas roller.",
  },
  {
    id: "cadena",
    name: "Cadena sin fin",
    category: "Accesorios",
    description: "Cadena continua usada para accionar mecanismos manuales.",
    function: "Permitir subir y bajar la cortina.",
    common_errors:
      "No considerar que MiniGap requiere más recorrido de cadena.",
    decosun_standard:
      "Seleccionar largo según altura, mecanismo y comodidad del usuario.",
  },
  {
    id: "base",
    name: "Barra inferior",
    category: "Roller",
    description:
      "Perfil inferior que mantiene la tela tensada y mejora la terminación.",
    function: "Dar peso, caída y terminación estética.",
    common_errors: "Entregar sin tapas laterales o con rayaduras.",
    decosun_standard:
      "Toda barra debe salir con tapas; el técnico debe llevar repuestos.",
  },
];

const methodSteps = [
  "Captación",
  "Agenda",
  "Visita comercial",
  "Cotización",
  "Aprobación",
  "Preinstalación",
  "Producción",
  "Instalación final",
  "Entrega",
  "Postventa",
];

const academyCards = [
  {
    title: "Método DecoSun",
    tag: "Base",
    text: "La forma oficial de trabajar: desde la solicitud del cliente hasta la entrega y postventa.",
    icon: "🧭",
  },
  {
    title: "Preinstalación",
    tag: "Clave técnica",
    text: "La cortina se fabrica para una instalación previamente definida, no solo para una ventana.",
    icon: "📐",
  },
  {
    title: "Técnico Roller",
    tag: "Nivel 1",
    text: "Componentes, medición, instalación, telas, errores frecuentes y control de calidad.",
    icon: "🛠️",
  },
  {
    title: "Biblioteca Técnica",
    tag: "Componentes",
    text: "MiniGap, tubo 38, cadena, topes, cenefas, DUO, verticales, telas y repuestos.",
    icon: "📚",
  },
  {
    title: "Certificaciones",
    tag: "Próximo",
    text: "Rutas de avance para vendedores, técnicos, especialistas y representantes regionales.",
    icon: "🏅",
  },
  {
    title: "Motorización / Toldos / Pérgolas",
    tag: "Nivel avanzado",
    text: "Productos de mayor especialización para técnicos certificados.",
    icon: "⚙️",
  },
];

export default function Academy() {
  const [courses, setCourses] = useState([]);
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAcademy();
  }, []);

  async function loadAcademy() {
    try {
      const { data: coursesData } = await supabase
        .from("academy_courses")
        .select("*")
        .order("order_index");

      const { data: componentsData } = await supabase
        .from("academy_components")
        .select("*")
        .order("name");

      setCourses(coursesData?.length ? coursesData : fallbackCourses);
      setComponents(componentsData?.length ? componentsData : fallbackComponents);
    } catch (error) {
      console.error("Error cargando Academy:", error);
      setCourses(fallbackCourses);
      setComponents(fallbackComponents);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div style={{ padding: 32 }}>Cargando Academia DecoSun...</div>;
  }

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", padding: 28 }}>
      <section
        style={{
          background: "linear-gradient(135deg, #0f172a, #1e3a8a)",
          color: "white",
          borderRadius: 28,
          padding: 34,
          marginBottom: 28,
          boxShadow: "0 18px 45px rgba(15,23,42,0.25)",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            background: "rgba(255,255,255,0.14)",
            padding: "7px 12px",
            borderRadius: 999,
            fontSize: 13,
            marginBottom: 14,
          }}
        >
          Sistema interno de formación y certificación
        </div>

        <h1 style={{ fontSize: 40, margin: 0, letterSpacing: "-0.04em" }}>
          Academia Técnica DecoSun
        </h1>

        <p style={{ maxWidth: 820, marginTop: 14, fontSize: 17, opacity: 0.9 }}>
          Capacitación para vendedores, técnicos e instaladores regionales.
          Aquí se centraliza el estándar DecoSun: método de trabajo, uso del
          panel, preinstalación, componentes, fabricación, instalación,
          postventa y futuras certificaciones.
        </p>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {academyCards.map((card) => (
          <article
            key={card.title}
            style={{
              background: "white",
              borderRadius: 22,
              padding: 22,
              border: "1px solid #e2e8f0",
              boxShadow: "0 10px 28px rgba(15,23,42,0.06)",
            }}
          >
            <div style={{ fontSize: 34, marginBottom: 12 }}>{card.icon}</div>

            <span
              style={{
                fontSize: 12,
                background: "#eff6ff",
                color: "#1d4ed8",
                padding: "5px 10px",
                borderRadius: 999,
                fontWeight: 700,
              }}
            >
              {card.tag}
            </span>

            <h3 style={{ fontSize: 20, marginTop: 14, marginBottom: 8 }}>
              {card.title}
            </h3>

            <p style={{ color: "#475569", lineHeight: 1.5, margin: 0 }}>
              {card.text}
            </p>
          </article>
        ))}
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 26, marginBottom: 14 }}>Método DecoSun</h2>

        <div
          style={{
            background: "white",
            borderRadius: 22,
            padding: 22,
            border: "1px solid #e2e8f0",
            boxShadow: "0 10px 28px rgba(15,23,42,0.05)",
          }}
        >
          <p style={{ color: "#475569", marginTop: 0 }}>
            El flujo oficial separa la medición comercial de la
            preinstalación. La fabricación se realiza sobre la posición real de
            los mecanismos instalados.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 12,
              marginTop: 18,
            }}
          >
            {methodSteps.map((step, index) => (
              <div
                key={step}
                style={{
                  padding: 16,
                  borderRadius: 16,
                  background: index === 5 ? "#dbeafe" : "#f1f5f9",
                  border:
                    index === 5 ? "1px solid #60a5fa" : "1px solid #e2e8f0",
                  textAlign: "center",
                  fontWeight: 800,
                  color: index === 5 ? "#1d4ed8" : "#0f172a",
                }}
              >
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  Paso {index + 1}
                </div>
                {step}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 26, marginBottom: 14 }}>Rutas de formación</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 18,
          }}
        >
          {courses.map((course) => (
            <article
              key={course.id}
              style={{
                background: "white",
                borderRadius: 20,
                padding: 22,
                border: "1px solid #e2e8f0",
                boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  background: "#e0f2fe",
                  color: "#0369a1",
                  padding: "5px 10px",
                  borderRadius: 999,
                  fontWeight: 700,
                }}
              >
                {course.level}
              </span>

              <h3 style={{ fontSize: 20, marginTop: 16, marginBottom: 8 }}>
                {course.title}
              </h3>

              <p style={{ color: "#475569", lineHeight: 1.5 }}>
                {course.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 26, marginBottom: 14 }}>
          Biblioteca técnica inicial
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 18,
          }}
        >
          {components.map((component) => (
            <article
              key={component.id}
              style={{
                background: "white",
                borderRadius: 20,
                padding: 22,
                border: "1px solid #e2e8f0",
                boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  background: "#dcfce7",
                  color: "#166534",
                  padding: "5px 10px",
                  borderRadius: 999,
                  fontWeight: 700,
                }}
              >
                {component.category}
              </span>

              <h3 style={{ fontSize: 20, marginTop: 16 }}>
                {component.name}
              </h3>

              <p style={{ color: "#475569", lineHeight: 1.5 }}>
                {component.description}
              </p>

              <div style={{ marginTop: 14 }}>
                <strong>Función</strong>
                <p style={{ color: "#64748b" }}>{component.function}</p>
              </div>

              <div style={{ marginTop: 14 }}>
                <strong>Errores frecuentes</strong>
                <p style={{ color: "#64748b" }}>{component.common_errors}</p>
              </div>

              <div style={{ marginTop: 14 }}>
                <strong>Estándar DecoSun</strong>
                <p style={{ color: "#64748b" }}>
                  {component.decosun_standard}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}