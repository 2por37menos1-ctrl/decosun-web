import { useAuth } from "../auth/AuthContext"

export default function Panel() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Cargando...
      </div>
    )
  }

  if (!user) {
    window.location.href = "/login"
    return null
  }

  return (
    <div className="min-h-screen bg-black text-white p-10">
      <h1 className="text-4xl font-bold mb-4">
        Panel DecoSun
      </h1>

      <div className="space-y-2 text-zinc-300">
        <p>
          Usuario: {profile?.nombre}
        </p>

        <p>
          Rol: {profile?.role}
        </p>

        <p>
          Región: {profile?.region_code}
        </p>
      </div>
    </div>
  )
}