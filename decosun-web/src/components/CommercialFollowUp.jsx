const riskStatuses = [
    "agendado",
    "cotizado",
    "seguimiento",
]

function money(value) {
    return `$${Number(value || 0).toLocaleString("es-CL")}`
}

function cleanPhone(phone) {
    const onlyNumbers = String(phone || "").replace(/\D/g, "")

    if (!onlyNumbers) return ""
    if (onlyNumbers.startsWith("56")) return onlyNumbers
    if (onlyNumbers.startsWith("9")) return `56${onlyNumbers}`

    return onlyNumbers
}

function daysSince(dateString) {
    if (!dateString) return 999

    const now = new Date()
    const date = new Date(dateString)
    return Math.floor((now - date) / (1000 * 60 * 60 * 24))
}

function openWhatsApp(project) {
    const phone = cleanPhone(project.contact_phone)

    if (!phone) {
        alert("Este proyecto no tiene teléfono registrado.")
        return
    }

    const message = encodeURIComponent(
        `Hola ${project.contact_name || ""}, soy de DecoSun. Le escribo para hacer seguimiento a su proyecto ${project.title || ""}.`
    )

    window.open(`https://wa.me/${phone}?text=${message}`, "_blank")
}

function openCall(project) {
    const phone = cleanPhone(project.contact_phone)

    if (!phone) {
        alert("Este proyecto no tiene teléfono registrado.")
        return
    }

    window.location.href = `tel:+${phone}`
}

export default function CommercialFollowUp({
    projects,
    onProjectClick,
    onArchiveProject,
}) {
    const followUpProjects = projects
        .filter((project) => riskStatuses.includes(project.status))
        .map((project) => ({
            ...project,
            days_without_movement: daysSince(project.updated_at),
        }))
        .filter((project) => project.days_without_movement >= 2)
        .sort((a, b) => b.days_without_movement - a.days_without_movement)

    const urgentProjects = followUpProjects.filter(
        (project) => project.days_without_movement >= 7
    )

    const mediumProjects = followUpProjects.filter(
        (project) =>
            project.days_without_movement >= 4 &&
            project.days_without_movement < 7
    )

    const normalProjects = followUpProjects.filter(
        (project) =>
            project.days_without_movement >= 2 &&
            project.days_without_movement < 4
    )

    function renderSection(title, description, items) {
        return (
            <section className="treasury-table" style={{ marginBottom: "24px" }}>
                <div className="dashboard-header">
                    <div>
                        <h2>{title}</h2>
                        <p>{description}</p>
                    </div>

                    <strong>{items.length}</strong>
                </div>

                {items.length === 0 ? (
                    <p style={{ color: "#64748b" }}>Sin proyectos en esta categoría.</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Estado</th>
                                <th>Monto</th>
                                <th>Días sin movimiento</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>

                        <tbody>
                            {items.map((project) => (
                                <tr key={project.id}>
                                    <td>
                                        <strong>{project.title || "Sin título"}</strong>
                                        <br />
                                        <small>{project.contact_name || project.city || ""}</small>
                                    </td>

                                    <td>{project.status}</td>

                                    <td>{money(project.sale_value)}</td>

                                    <td>
                                        <strong>{project.days_without_movement}</strong> días
                                    </td>

                                    <td>
                                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                            <button
                                                type="button"
                                                className="secondary-btn"
                                                onClick={() => onProjectClick(project)}
                                            >
                                                Abrir
                                            </button>

                                            <button
                                                type="button"
                                                className="secondary-btn"
                                                onClick={() => openWhatsApp(project)}
                                            >
                                                WhatsApp
                                            </button>

                                            <button
                                                type="button"
                                                className="secondary-btn"
                                                onClick={() => openCall(project)}
                                            >
                                                Llamar
                                            </button>

                                            {onArchiveProject && (
                                                <button
                                                    type="button"
                                                    className="secondary-btn"
                                                    onClick={() => {
                                                        const archive_reason = window.prompt(
                                                            "Motivo de archivo",
                                                            "sin_respuesta"
                                                        )

                                                        if (!archive_reason) return

                                                        onArchiveProject(project.id, {
                                                            archive_reason,
                                                            lost_amount: Number(project.sale_value || 0),
                                                            archive_notes:
                                                                "Archivado desde Seguimiento Comercial.",
                                                        })
                                                    }}
                                                >
                                                    Archivar
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>
        )
    }

    return (
        <>
            <div className="stats-grid">
                <div className="stat-card">
                    <span>Requieren seguimiento</span>
                    <strong>{followUpProjects.length}</strong>
                </div>

                <div className="stat-card">
                    <span>Venta en riesgo</span>
                    <strong>
                        {money(
                            followUpProjects.reduce(
                                (acc, project) => acc + Number(project.sale_value || 0),
                                0
                            )
                        )}
                    </strong>
                </div>

                <div className="stat-card">
                    <span>Urgentes +7 días</span>
                    <strong>{urgentProjects.length}</strong>
                </div>
            </div>

            {renderSection(
                "🔴 Requieren seguimiento urgente",
                "Proyectos sin movimiento hace 7 días o más.",
                urgentProjects
            )}

            {renderSection(
                "🟠 Revisar pronto",
                "Proyectos sin movimiento entre 4 y 6 días.",
                mediumProjects
            )}

            {renderSection(
                "🟡 Seguimiento normal",
                "Proyectos sin movimiento entre 2 y 3 días.",
                normalProjects
            )}
        </>
    )
}