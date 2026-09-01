"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Eye, EyeOff, Mail, Lock, ShoppingBag, Sparkles } from "lucide-react"
import { setToken, isTokenValid, getToken, setUserRole, getUserRole, fetchUserRole } from "@/lib/auth"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

function redirectForRole(role: string | null): string | null {
  if (!role) return null
  if (role === "authenticated") return "/portal-medallitadeoro"
  return null
}

export default function LoginPage() {
  const router = useRouter()
  const [email,        setEmail]        = useState("")
  const [password,     setPassword]     = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState("")

  useEffect(() => {
    if (isTokenValid(getToken())) {
      const dest = redirectForRole(getUserRole())
      if (dest) router.replace(dest)
    }
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res  = await fetch(`${BASE}/api/auth/local`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email, password }),
      })
      const json = await res.json()
      if (!res.ok || !json.jwt) {
        setError("Email o contraseña incorrectos")
        return
      }
      const role = await fetchUserRole(json.jwt, BASE)
      const dest  = redirectForRole(role)
      if (!dest) {
        setError("Tu cuenta no tiene acceso asignado. Contacta al administrador.")
        return
      }
      setToken(json.jwt)
      if (role) setUserRole(role)
      router.push(dest)
    } catch {
      setError("No se pudo conectar con el servidor")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dark h-dvh bg-[#0a0714] text-white flex flex-col lg:flex-row overflow-y-auto relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_20%_25%,rgba(139,92,246,0.12),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_45%_at_85%_75%,rgba(139,92,246,0.07),transparent)] pointer-events-none" />

      {/* Columna izquierda — identidad medallitadeoro, oculta en móvil */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-16 xl:px-24 relative z-10">
        <div className="flex items-center gap-3 w-fit mb-10">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-violet-600 shadow-lg shadow-violet-500/20 shrink-0">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <div className="text-left min-w-0">
            <div className="text-xl xl:text-2xl font-bold text-white leading-tight">Portal Medallitadeoro</div>
            <div className="text-sm text-white/50 leading-tight mt-0.5">Joyería Miracles</div>
          </div>
        </div>

        <div className="max-w-md">
          <p className="text-white/50 text-base leading-relaxed mb-5">
            Bienvenido al panel interno de medallitadeoro.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-white/10 bg-white/[0.03] rounded-xl p-4">
              <ShoppingBag className="h-4 w-4 text-violet-400 mb-2" />
              <p className="text-sm font-semibold text-white mb-1">Todo en un lugar</p>
              <p className="text-xs text-white/40 leading-relaxed">Comercial, cadena de suministro, marketing y finanzas, organizados por departamento.</p>
            </div>
            <div className="border border-white/10 bg-white/[0.03] rounded-xl p-4">
              <Sparkles className="h-4 w-4 text-violet-400 mb-2" />
              <p className="text-sm font-semibold text-white mb-1">Al día siempre</p>
              <p className="text-xs text-white/40 leading-relaxed">Pipeline, catálogo e indicadores en tiempo real.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Columna derecha — formulario */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:py-0 relative z-10">
        <div className="w-full max-w-sm">
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-violet-600 shadow-xl shadow-violet-500/20 shrink-0">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <div className="text-left">
              <div className="text-lg font-bold text-zinc-100 leading-tight">Portal Medallitadeoro</div>
              <div className="text-xs text-zinc-400 leading-tight mt-0.5">Joyería Miracles</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-zinc-900/70 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4 shadow-2xl shadow-black/40">
            <div className="mb-2">
              <h1 className="text-lg font-bold text-zinc-100">Iniciar sesión</h1>
              <p className="text-sm text-zinc-500 mt-0.5">Ingresa tus credenciales para continuar</p>
            </div>

            <div>
              <label htmlFor="email" className="text-xs font-medium text-zinc-400 mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                <input
                  id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com" required autoFocus autoComplete="email"
                  className="w-full h-10 rounded-lg border border-zinc-700 bg-zinc-800 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-400/50 transition-all"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="text-xs font-medium text-zinc-400 mb-1.5 block">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                <input
                  id="password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required autoComplete="current-password"
                  className="w-full h-10 rounded-lg border border-zinc-700 bg-zinc-800 pl-9 pr-10 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-400/50 transition-all"
                />
                <button
                  type="button" onClick={() => setShowPassword(p => !p)} tabIndex={-1}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="text-xs text-red-400 leading-relaxed bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full h-10 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 transition-all flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>

          <p className="text-center text-[11px] text-white/25 mt-6">
            © {new Date().getFullYear()} Joyería Miracles
          </p>
        </div>
      </div>
    </div>
  )
}
