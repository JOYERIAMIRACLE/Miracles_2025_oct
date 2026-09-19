"use client"
import { useState } from "react"
import { Target, ShoppingBag, Wrench, FolderKanban, Check, X, Pencil } from "lucide-react"
import { toast } from "sonner"
import { Card } from "./shared"
import { saveIdentidad, useGetIdentidad } from "@/api/identidad-empresa/getIdentidad"
import type { IdentidadEmpresa } from "@/types/identidad-empresa"

type IndicadorCampo = "indicador_objetivo_mensual" | "indicador_producto" | "indicador_servicios" | "indicador_proyectos"

const fmtMonto = (n: number | null) =>
  n == null ? "—" : n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 })

const ITEMS: { campo: IndicadorCampo; label: string; icon: typeof Target }[] = [
  { campo: "indicador_objetivo_mensual", label: "Objetivo mensual", icon: Target      },
  { campo: "indicador_producto",         label: "Producto",         icon: ShoppingBag },
  { campo: "indicador_servicios",        label: "Servicios",        icon: Wrench      },
  { campo: "indicador_proyectos",        label: "Proyectos",        icon: FolderKanban },
]

/**
 * Portado de sdi-portal/components/Trabajo/portal/IndicadoresRapidos.tsx —
 * 4 tarjetas de indicador editables in-situ. sdi-portal las guarda en
 * portal-empresa vía un mutate dedicado; MDO ya tiene identidad-empresa +
 * saveIdentidad() genérico (mismo mecanismo que el resto de campos
 * editables del portal), así que este componente es autocontenido — no
 * recibe props, resuelve su propio fetch/guardado, igual que
 * HeroFondoExterno en shared.tsx. Ícono en violeta en vez de naranja
 * (regla de un solo acento).
 */
export function IndicadoresRapidos() {
  const { identidad, loading, reload } = useGetIdentidad()
  const documentId = identidad?.documentId ?? null
  const [editando, setEditando] = useState<IndicadorCampo | null>(null)
  const [valor, setValor]       = useState("")
  const [saving, setSaving]     = useState(false)

  function abrirEdicion(campo: IndicadorCampo, actual: number | null) {
    setEditando(campo)
    setValor(actual != null ? String(actual) : "")
  }

  async function guardar(campo: IndicadorCampo) {
    const num = Number(valor)
    if (valor.trim() === "" || Number.isNaN(num)) { toast.error("Monto inválido"); return }
    setSaving(true)
    try {
      await saveIdentidad(documentId, { [campo]: num })
      reload()
      setEditando(null)
      toast.success("Actualizado")
    } catch { toast.error("Error al guardar") }
    finally { setSaving(false) }
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {ITEMS.map(({ campo, label, icon: Icon }) => {
        const actual = (identidad as IdentidadEmpresa | null)?.[campo] ?? null
        const enEdicion = editando === campo
        return (
          <Card key={campo} className="!p-3.5 group">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Icon className="h-3.5 w-3.5 shrink-0 text-violet-500" />
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">{label}</p>
            </div>
            {enEdicion ? (
              <div className="flex items-center gap-1">
                <input autoFocus type="number" value={valor} onChange={e => setValor(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") guardar(campo); if (e.key === "Escape") setEditando(null) }}
                  className="w-full min-w-0 text-lg font-bold text-slate-900 dark:text-slate-100 bg-transparent outline-none border-b border-violet-300 dark:border-violet-500/50" />
                <button type="button" onClick={() => guardar(campo)} disabled={saving} title="Guardar"
                  className="p-1 text-emerald-500 hover:text-emerald-600 shrink-0 disabled:opacity-50">
                  <Check size={14} />
                </button>
                <button type="button" onClick={() => setEditando(null)} title="Cancelar"
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 shrink-0">
                  <X size={13} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-1">
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">{fmtMonto(actual)}</p>
                {!loading && (
                  <button type="button" onClick={() => abrirEdicion(campo, actual)} title={`Editar ${label}`}
                    className="p-1 text-slate-300 dark:text-slate-600 hover:text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Pencil size={12} />
                  </button>
                )}
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}
