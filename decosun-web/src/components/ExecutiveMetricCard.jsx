const statusLabels = {
  positive: "OK",
  warning: "Atencion",
  critical: "Critico",
  neutral: "Info",
}

export default function ExecutiveMetricCard({
  title,
  value,
  description,
  status = "neutral",
  indicator,
  compact = false,
}) {
  const safeStatus = statusLabels[status] ? status : "neutral"

  return (
    <article
      className={`executive-metric-card is-${safeStatus}${compact ? " is-compact" : ""}`}
    >
      <div className="executive-metric-top">
        <span className="executive-metric-status">
          {indicator || statusLabels[safeStatus]}
        </span>
      </div>

      <div>
        <p>{title}</p>
        <strong>{value}</strong>
      </div>

      {description && (
        <small>{description}</small>
      )}
    </article>
  )
}
