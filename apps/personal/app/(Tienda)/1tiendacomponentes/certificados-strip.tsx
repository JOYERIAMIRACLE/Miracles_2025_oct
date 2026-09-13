import { Truck, BadgeCheck, ShieldCheck, Headphones } from "lucide-react"
import type { LucideIcon } from "lucide-react"

type Beneficio = {
  Icon:   LucideIcon
  color:  string
  bg:     string
  titulo: string
  sub:    string
}

const BENEFICIOS: Beneficio[] = [
  { Icon: Truck,        color: "text-amber-500",   bg: "bg-amber-50 dark:bg-amber-950/40",   titulo: "Envío a todo México",    sub: "5-7 días hábiles"      },
  { Icon: BadgeCheck,   color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/40", titulo: "Calidad certificada",   sub: "Oro 10k y Plata .925"  },
  { Icon: ShieldCheck,  color: "text-sky-500",     bg: "bg-sky-50 dark:bg-sky-950/40",       titulo: "Compra segura",          sub: "Pago protegido"        },
  { Icon: Headphones,   color: "text-teal-500",    bg: "bg-teal-50 dark:bg-teal-950/40",     titulo: "Asesoría personalizada", sub: "Vía WhatsApp"          },
]

const CertificadosStrip = () => {
  return (
    <div className="bg-slate-50 dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
      <div className="max-w-6xl mx-auto px-6 py-5">
        <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-1 md:grid md:grid-cols-4">
          {BENEFICIOS.map((b) => (
            <div
              key={b.titulo}
              className="flex flex-col items-center text-center gap-2 min-w-[110px] md:min-w-0"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${b.bg}`}>
                <b.Icon size={18} strokeWidth={1.75} className={b.color} />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 leading-tight whitespace-nowrap">
                  {b.titulo}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                  {b.sub}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CertificadosStrip
