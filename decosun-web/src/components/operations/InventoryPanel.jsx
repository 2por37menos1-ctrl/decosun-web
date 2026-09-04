const categories = ["Telas / rollos", "Perfiles", "Mecanismos", "Motores", "Accesorios / Otros"]

export default function InventoryPanel() {
  return <>
    <div className="operations-category-grid">
      {categories.map((category) => <button type="button" key={category} className="operations-category-card">
        <strong>{category}</strong><span>Sin registros</span>
      </button>)}
    </div>
    <section className="treasury-table operations-section">
      <div className="section-heading"><div><h2>Inventario</h2><p>Stock disponible = stock físico − stock reservado.</p></div></div>
      <div className="operations-stock-head"><span>Stock físico</span><span>Stock reservado</span><span>Stock disponible</span></div>
      <div className="operations-empty"><strong>Aún no hay inventario registrado.</strong><span>La interfaz está preparada para integrar materiales, bodegas y reservas cuando exista el backend.</span></div>
    </section>
    <section className="treasury-table operations-section">
      <div className="section-heading compact"><div><h2>Rollos de tela</h2><p>Vista preparada para el control individual de remanentes.</p></div></div>
      <div className="operations-table-scroll"><table><thead><tr><th>Código</th><th>Tela</th><th>Color</th><th>Ancho</th><th>Largo inicial</th><th>Remanente</th><th>Proveedor</th><th>Bodega</th><th>Estado</th></tr></thead><tbody><tr><td colSpan="9" className="operations-table-empty">Aún no hay rollos registrados.</td></tr></tbody></table></div>
    </section>
  </>
}
