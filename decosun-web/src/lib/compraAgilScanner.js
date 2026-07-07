export async function scanCompraAgil() {
  return {
    ok: false,
    inserted: 0,
    message:
      "Scanner frontend desactivado. La sincronizacion de Mercado Publico debe ejecutarse desde la Edge Function importar-recomendadas.",
  };
}
