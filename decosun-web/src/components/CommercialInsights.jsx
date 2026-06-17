function money(value) {
    return `$${Number(value || 0).toLocaleString("es-CL")}`
}

function daysSince(dateString) {
    if (!dateString) return 999

    const now = new Date()
    const date = new Date(dateString)

    return Math.floor((now - date) / (1000 * 60 * 60 * 24))
}

const riskStatuses = ["agendado", "cotizado", "seguimiento"]

const recoverableReasons = [
    "sin_respuesta",
    "sin_presupuesto",
    "postergado",
]

function groupByCount(items, field, fallback = "Sin dato") {
    return items.reduce((acc, item) => {
        const key = item[field] || fallback
        acc[key] = (acc[key] || 0) + 1
        return acc
    }, {})
}

function renderGroup(title, items) {
    const entries = Object.entries(items).sort((a, b) => b[1] - a[1])

    return (
        <div className="treasury-table">
            <div className="dashboard-header">
                <h2>{title}</h2>
            </div>

            {entries.length === 0 ? (
                <p style={{ color: "#64748b" }}>Sin datos suficientes.</p>
            ) : (
                entries.map(([label, total]) => (
                    <p key={label}>
                        <strong>{total}</strong> · {label}
                    </p>
                ))
            )}
        </div>
    )
}

export default function CommercialInsights({
    projects,
    archivedProjects,
}) {
    const activeOpportunities = projects.filter((project) =>
        riskStatuses.includes(project.status)
    )

    const potentialSales = activeOpportunities.reduce(
        (acc, project) => acc + Number(project.sale_value || 0),
        0
    )

    const riskyProjects = activeOpportunities.filter(
        (project) => daysSince(project.updated_at) >= 7
    )

    const riskyAmount = riskyProjects.reduce(
        (acc, project) => acc + Number(project.sale_value || 0),
        0
    )

    const lostAmount = archivedProjects.reduce(
        (acc, project) => acc + Number(project.lost_amount || 0),
        0
    )

    const recoverableProjects = archivedProjects.filter((project) =>
        recoverableReasons.includes(project.archive_reason)
    )

    const recoverableAmount = recoverableProjects.reduce(
        (acc, project) => acc + Number(project.lost_amount || 0),
        0
    )

    const lostByReason = groupByCount(
        archivedProjects,
        "archive_reason",
        "Histórico sin clasificación"
    )

    const lostByStage = groupByCount(
        archivedProjects,
        "archive_status",
        "Histórico sin etapa"
    )

    const followUpStageLoss =
        lostByStage.seguimiento || 0

    const priceLoss =
        lostByReason.precio_elevado || 0

    const totalArchived = archivedProjects.length

    const riskPercentage =
        potentialSales > 0 ? (riskyAmount / potentialSales) * 100 : 0

    const highValueRiskProjects = riskyProjects
        .filter((project) => Number(project.sale_value || 0) >= 1000000)
        .sort(
            (a, b) =>
                Number(b.sale_value || 0) - Number(a.sale_value || 0)
        )

    const executiveSummary = [
        `La venta potencial activa es de ${money(potentialSales)}.`,
        riskyProjects.length > 0
            ? `Existen ${riskyProjects.length} oportunidades en riesgo por ${money(riskyAmount)}.`
            : "No existen oportunidades críticas sin movimiento prolongado.",
        recoverableProjects.length > 0
            ? `Hay ${recoverableProjects.length} clientes recuperables por ${money(recoverableAmount)}.`
            : "No hay clientes recuperables registrados por ahora.",
    ]

    return (
        <>
            <div className="stats-grid">
                <div className="stat-card">
                    <span>Venta potencial</span>
                    <strong>{money(potentialSales)}</strong>
                </div>

                <div className="stat-card">
                    <span>Venta potencial en riesgo</span>
                    <strong>{money(riskyAmount)}</strong>
                </div>

                <div className="stat-card">
                    <span>Venta perdida</span>
                    <strong>{money(lostAmount)}</strong>
                </div>

                <div className="stat-card">
                    <span>Potencial recuperable</span>
                    <strong>{money(recoverableAmount)}</strong>
                </div>
            </div>

            <section className="treasury-table" style={{ marginBottom: "24px" }}>
                <div className="dashboard-header">
                    <div>
                        <h2>🧠 Resumen Ejecutivo</h2>
                        <p>
                            Lectura rápida del estado comercial actual.
                        </p>
                    </div>
                </div>

                <div style={{ display: "grid", gap: "10px" }}>
                    {executiveSummary.map((item) => (
                        <p key={item} style={{ margin: 0 }}>
                            {item}
                        </p>
                    ))}

                    <div
                        className="balance-box"
                        style={{ marginTop: "10px" }}
                    >
                        <span>⚠️ Riesgo comercial</span>
                        <strong>
                            {riskPercentage.toFixed(1)}%
                        </strong>
                        <p>
                            Porcentaje de la venta potencial que se encuentra
                            sin movimiento crítico.
                        </p>
                    </div>
                </div>
            </section>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns:
                        "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "20px",
                    marginBottom: "24px",
                }}
            >
                {renderGroup("¿Por qué se pierden?", lostByReason)}
                {renderGroup("¿Dónde se pierden?", lostByStage)}
            </div>

            <section className="treasury-table">
                <div className="dashboard-header">
                    <div>
                        <h2>Recomendaciones HYVE</h2>
                        <p>
                            Lectura automática basada en oportunidades activas,
                            archivadas y recuperables.
                        </p>
                    </div>
                </div>

                <div style={{ display: "grid", gap: "14px" }}>
                    {riskyProjects.length > 0 && (
                        <div className="balance-box">
                            <span>⚠️ Seguimiento urgente</span>
                            <strong>
                                {riskyProjects.length} proyectos · {money(riskyAmount)}
                            </strong>
                            <p>
                                Hay oportunidades activas con 7 días o más sin movimiento.
                                Recomendación: contactar hoy a estos clientes antes de que
                                pasen a oportunidad perdida.
                            </p>
                        </div>
                    )}

                    {totalArchived > 0 && followUpStageLoss > 0 && (
                        <div className="balance-box">
                            <span>📉 Cuello de botella comercial</span>
                            <strong>
                                {followUpStageLoss} pérdidas en seguimiento
                            </strong>
                            <p>
                                Una parte importante de las oportunidades se está perdiendo
                                después de cotizar. Recomendación: reforzar contacto entre
                                el día 3 y 7.
                            </p>
                        </div>
                    )}

                    {totalArchived > 0 && priceLoss > 0 && (
                        <div className="balance-box">
                            <span>💰 Sensibilidad al precio</span>
                            <strong>
                                {priceLoss} pérdidas por precio elevado
                            </strong>
                            <p>
                                Recomendación: revisar márgenes, descuentos permitidos,
                                costos de instalación y propuesta de valor antes de bajar
                                precios automáticamente.
                            </p>
                        </div>
                    )}

                    {recoverableProjects.length > 0 && (
                        <div className="balance-box">
                            <span>♻️ Recuperación comercial</span>
                            <strong>
                                {recoverableProjects.length} clientes · {money(recoverableAmount)}
                            </strong>
                            <p>
                                Existen clientes archivados que podrían recuperarse porque
                                quedaron como sin respuesta, sin presupuesto o postergados.
                                Recomendación: crear campaña de reactivación.
                            </p>
                        </div>
                    )}

                    {riskyProjects.length === 0 &&
                        totalArchived === 0 &&
                        recoverableProjects.length === 0 && (
                            <p style={{ color: "#64748b" }}>
                                Todavía no hay datos suficientes para generar recomendaciones.
                            </p>
                        )}
                </div>
            </section>

            <section className="treasury-table" style={{ marginTop: "24px" }}>
                <div className="dashboard-header">
                    <div>
                        <h2>🎯 Prioridades de hoy</h2>
                        <p>
                            Acciones sugeridas según riesgo, monto y recuperabilidad.
                        </p>
                    </div>
                </div>

                <div style={{ display: "grid", gap: "12px" }}>
                    {highValueRiskProjects.length > 0 && (
                        <div className="balance-box">
                            <span>🔥 Contactar oportunidades de alto valor</span>
                            <strong>
                                {highValueRiskProjects.length} proyectos sobre $1.000.000
                            </strong>
                            <p>
                                Prioriza estos clientes porque combinan monto relevante
                                y falta de movimiento comercial.
                            </p>
                        </div>
                    )}

                    {riskyProjects.length > 0 && (
                        <div className="balance-box">
                            <span>📞 Llamar clientes urgentes</span>
                            <strong>
                                {riskyProjects.length} oportunidades pendientes
                            </strong>
                            <p>
                                Contactar hoy a los proyectos con 7 días o más sin actualización.
                            </p>
                        </div>
                    )}

                    {recoverableProjects.length > 0 && (
                        <div className="balance-box">
                            <span>♻️ Preparar campaña de reactivación</span>
                            <strong>
                                {recoverableProjects.length} clientes recuperables
                            </strong>
                            <p>
                                Revisar archivados por sin respuesta, sin presupuesto
                                o postergados.
                            </p>
                        </div>
                    )}

                    {highValueRiskProjects.length === 0 &&
                        riskyProjects.length === 0 &&
                        recoverableProjects.length === 0 && (
                            <p style={{ color: "#64748b" }}>
                                No hay prioridades críticas por ahora.
                            </p>
                        )}
                </div>
            </section>
        </>
    )
}