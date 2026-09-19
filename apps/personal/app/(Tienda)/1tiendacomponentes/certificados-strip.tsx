import { Truck, BadgeCheck, ShieldCheck, Headphones } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import Container from "./container"

type Beneficio = {
  Icon:   LucideIcon
  titulo: string
  sub:    string
}

// Un solo color de marca para los 4 — antes cada ícono tenía su propio color
// decorativo (violeta/verde/azul/teal) sin ningún significado semántico real.
const ICONO_COLOR_CLS = "text-violet-500"
const ICONO_BG_CLS     = "bg-violet-50 dark:bg-violet-950/40"

const BENEFICIOS: Beneficio[] = [
  { Icon: Truck,       titulo: "Envío a todo México",    sub: "5-7 días hábiles"      },
  { Icon: BadgeCheck,  titulo: "Calidad certificada",    sub: "Oro 10k y Plata .925"  },
  { Icon: ShieldCheck, titulo: "Compra segura",          sub: "Pago protegido"        },
  { Icon: Headphones,  titulo: "Asesoría personalizada", sub: "Vía WhatsApp"          },
]

const CertificadosStrip = () => {
  return (
    <div className="bg-slate-50 dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
      <Container className="py-5">
        <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-1 md:grid md:grid-cols-4">
          {BENEFICIOS.map((b) => (
            <div
              key={b.titulo}
              className="flex flex-col items-center text-center gap-2 min-w-[110px] md:min-w-0"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${ICONO_BG_CLS}`}>
                <b.Icon size={18} strokeWidth={1.75} className={ICONO_COLOR_CLS} />
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
      </Container>
    </div>
  )
}

export default CertificadosStrip
