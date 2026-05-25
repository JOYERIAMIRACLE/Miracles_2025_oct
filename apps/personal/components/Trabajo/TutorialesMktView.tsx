"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, BookOpen } from "lucide-react"

type Tutorial = {
  id: number
  titulo: string
  descripcion: string
  pasos: string[]
}

const TUTORIALES: Tutorial[] = [
  {
    id: 1,
    titulo: "Cómo publicar en redes sociales",
    descripcion: "Proceso estándar para subir contenido a las plataformas del equipo.",
    pasos: [
      "Revisar el calendario de contenido y confirmar la fecha de publicación.",
      "Descargar el arte final desde la carpeta de Drive correspondiente.",
      "Redactar el copy siguiendo el tono de marca aprobado.",
      "Programar la publicación en la herramienta de gestión (Buffer / Meta Business).",
      "Notificar al equipo en el canal de Slack una vez publicado.",
    ],
  },
  {
    id: 2,
    titulo: "Cómo crear una campaña de email",
    descripcion: "Pasos para armar y enviar una campaña de email marketing.",
    pasos: [
      "Definir el objetivo y segmento de la campaña.",
      "Redactar el asunto y el cuerpo del correo siguiendo la plantilla base.",
      "Insertar los links con UTM correctamente configurados.",
      "Enviar prueba interna y revisar en móvil y desktop.",
      "Programar el envío en la plataforma de email.",
      "Registrar la campaña en el log de acciones de marketing.",
    ],
  },
  {
    id: 3,
    titulo: "Cómo registrar un gasto de campaña",
    descripcion: "Proceso para documentar inversiones publicitarias correctamente.",
    pasos: [
      "Obtener el comprobante o factura del gasto.",
      "Ingresar a la sección 'Registro de gastos' en la app.",
      "Completar: concepto, monto, fecha y categoría.",
      "Adjuntar el comprobante en formato PDF o imagen.",
      "Guardar y confirmar que aparece en el historial.",
    ],
  },
]

export function TutorialesMktView() {
  const [abierto, setAbierto] = useState<number | null>(null)

  const toggle = (id: number) => setAbierto(prev => (prev === id ? null : id))

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-200 mb-1">Tutorial de procesos mkt</h2>
        <p className="text-sm text-slate-500">Guías paso a paso para los procesos del equipo de marketing.</p>
      </div>

      <div className="space-y-3">
        {TUTORIALES.map((t) => {
          const open = abierto === t.id
          return (
            <div
              key={t.id}
              className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden"
            >
              <button
                onClick={() => toggle(t.id)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-800/40 transition-colors"
              >
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <BookOpen className="h-4 w-4 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200">{t.titulo}</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{t.descripcion}</p>
                </div>
                <span className="text-xs text-slate-600 shrink-0 mr-2">{t.pasos.length} pasos</span>
                {open
                  ? <ChevronUp className="h-4 w-4 text-slate-500 shrink-0" />
                  : <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
                }
              </button>

              {open && (
                <div className="px-5 pb-5 pt-1 border-t border-slate-800">
                  <ol className="space-y-3 mt-3">
                    {t.pasos.map((paso, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="h-5 w-5 rounded-full bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-[10px] font-bold text-blue-400 shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-sm text-slate-300 leading-relaxed">{paso}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
