import { Construction } from "lucide-react"

export function PlaceholderView({
  seccion, titulo, descripcion,
}: {
  seccion:     string
  titulo:      string
  descripcion: string
}) {
  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] gap-5">
      <div className="h-12 w-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
        <Construction className="h-6 w-6 text-slate-600" />
      </div>
      <div className="text-center max-w-xs">
        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-700 mb-2">{seccion}</p>
        <h2 className="text-base font-semibold text-slate-300">{titulo}</h2>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">{descripcion}</p>
      </div>
      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-700 border border-slate-800 px-3 py-1.5 rounded-full">
        En desarrollo
      </span>
    </div>
  )
}
