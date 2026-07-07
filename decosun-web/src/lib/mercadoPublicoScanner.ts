// Security patch:
// Mercado Publico synchronization must run server-side through a Supabase Edge
// Function or backend job. Do not use service role keys, API tickets, bearer
// tokens, or Mercado Publico credentials in the Vite/browser bundle.

export async function scanMercadoPublico() {
  return {
    ok: false,
    inserted: 0,
    message:
      "La sincronizacion segura de Mercado Publico debe ejecutarse desde backend/Edge Function con credenciales protegidas.",
  }
}
