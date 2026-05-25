import { useState } from "react"
import { supabase } from "../lib/supabase"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
  setError(error.message)
  setLoading(false)
  return
}

window.location.href = "/panel" 
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8"
      >
        <h1 className="text-3xl font-bold text-white mb-2">
          Acceso DecoSun
        </h1>

        <p className="text-zinc-400 mb-8">
          Plataforma comercial y seguimiento
        </p>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-zinc-800 text-white rounded-xl p-4"
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-zinc-800 text-white rounded-xl p-4"
          />
        </div>

        {error && (
          <p className="text-red-400 mt-4 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-6 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-xl p-4"
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  )
}