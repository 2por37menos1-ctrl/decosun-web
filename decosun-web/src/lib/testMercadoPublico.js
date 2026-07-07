export async function testMercadoPublico() {
  return {
    ok: false,
    inserted: 0,
    message:
      "Scanner frontend desactivado. La sincronizacion segura de Mercado Publico debe ejecutarse desde backend/Edge Function con credenciales protegidas.",
  }
}
