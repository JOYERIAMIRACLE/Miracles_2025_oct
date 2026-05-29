import { Gem } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 rounded-2xl bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Gem className="h-8 w-8 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-slate-100 mb-2">Joyería Miracles</h1>
        <p className="text-slate-400 text-base mb-8">Estamos preparando algo especial para ti.</p>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl px-8 py-6 mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-1">Próximamente</p>
          <p className="text-sm text-slate-400">
            Nuestra tienda en línea estará disponible muy pronto. Oro, plata y joyería fina te esperan.
          </p>
        </div>

        <p className="text-xs text-slate-600">
          ¿Eres del equipo?{" "}
          <a href="/login" className="text-emerald-500 hover:text-emerald-400 transition-colors">
            Iniciar sesión
          </a>
        </p>
      </div>
    </div>
  )
}
