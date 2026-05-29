export default function StatCard({
  title,
  value
}) {
  return (
    <div className="stat-card">
      <span>{title}</span>

      <h2>{value}</h2>
    </div>
  );
}