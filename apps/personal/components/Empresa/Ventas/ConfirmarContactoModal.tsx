"use client"

import { useMemo, useState } from "react"
import { X } from "lucide-react"
import { toast } from "sonner"
import type { ClienteEmpresa, ClientePayload } from "@/types/clienteEmpresa"
import { buscarContactosDuplicados } from "@/lib/contactos"

const inp = "w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-[#2a1b3d] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none focus:border-slate-400 dark:focus:border-slate-500"
const lbl = "block text-[11px] text-slate-500 dark:text-slate-500 mb-1"

/** Paso previo a la primera cotización de un prospecto: se confirman sus datos
    y, si ya existe un contacto con el mismo teléfono o correo, se puede usar ese. */
export function ConfirmarContactoModal({ prospecto, clientes, onConfirmar, onUsarExistente, onCerrar }: {
  prospecto: ClienteEmpresa
  clientes: ClienteEmpresa[]
  onConfirmar: (datos: Partial<ClientePayload>) => Promise<void>
  onUsarExistente: (contacto: ClienteEmpresa, datos: Partial<ClientePayload>) => Promise<void>
  onCerrar: () => void
}) {
  const [datos, setDatos] = useState({
    nombre: prospecto.nombre ?? "", telefono: prospecto.telefono ?? "",
    email: prospecto.email ?? "", direccion: prospecto.direccion ?? "",
  })
  // "confirmar" o el documentId del contacto que se está usando
  const [guardando, setGuardando] = useState<string | null>(null)
  const duplicados = useMemo(
    () => buscarContactosDuplicados(clientes, datos, prospecto.documentId),
    [clientes, datos, prospecto.documentId]
  )

  const payload = (): Partial<ClientePayload> => ({
    nombre: datos.nombre.trim(),
    telefono: datos.telefono.trim() || null,
    email: datos.email.trim() || null,
    direccion: datos.direccion.trim() || null,
  })
  async function ejecutar(clave: string, accion: () => Promise<void>) {
    if (!datos.nombre.trim()) { toast.error("El nombre es obligatorio"); return }
    setGuardando(clave)
    try { await accion() }
    catch (e) { toast.error((e as Error).message || "No se pudo guardar") }
    finally { setGuardando(null) }
  }
  const campo = (k: keyof typeof datos) => ({
    value: datos[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setDatos(d => ({ ...d, [k]: e.target.value })),
  })

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#2a1b3d] border border-slate-300 dark:border-slate-700 rounded-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Crear contacto</h2>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              Para cotizarle, este prospecto pasa a Contactos en cuanto guardes la cotización. Revisa sus datos.
            </p>
          </div>
          <button type="button" title="Cerrar" onClick={onCerrar}
            className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded hover:bg-slate-100 dark:hover:bg-[#2a1b3d] transition shrink-0"><X size={16} /></button>
        </div>

        <div>
          <label htmlFor="cc-nombre" className={lbl}>Nombre *</label>
          <input id="cc-nombre" autoFocus {...campo("nombre")} placeholder="Nombre completo" className={inp} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="cc-telefono" className={lbl}>Teléfono</label>
            <input id="cc-telefono" {...campo("telefono")} placeholder="55 0000 0000" className={inp} />
          </div>
          <div>
            <label htmlFor="cc-email" className={lbl}>Correo</label>
            <input id="cc-email" type="email" {...campo("email")} placeholder="correo@email.com" className={inp} />
          </div>
        </div>
        <div>
          <label htmlFor="cc-direccion" className={lbl}>Dirección</label>
          <input id="cc-direccion" {...campo("direccion")} placeholder="Calle, número, colonia, ciudad…" className={inp} />
        </div>

        {duplicados.length > 0 && (
          <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-3 space-y-2">
            <p className="text-xs font-medium text-violet-700 dark:text-violet-300">
              Ya existe {duplicados.length === 1 ? "un contacto" : `${duplicados.length} contactos`} con este teléfono o correo
            </p>
            {duplicados.map(c => (
              <div key={c.documentId} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-slate-800 dark:text-slate-100 truncate">{c.nombre}</p>
                  <p className="text-[11px] text-slate-500 truncate">{[c.telefono, c.email].filter(Boolean).join(" · ")}</p>
                </div>
                <button type="button" disabled={!!guardando}
                  onClick={() => ejecutar(c.documentId, () => onUsarExistente(c, payload()))}
                  className="shrink-0 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-violet-500/40 text-violet-700 dark:text-violet-300 hover:bg-violet-500/10 disabled:opacity-40 transition">
                  {guardando === c.documentId ? "Uniendo…" : "Usar este contacto"}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onCerrar}
            className="px-3 py-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg transition">
            Cancelar
          </button>
          <button type="button" disabled={!!guardando}
            onClick={() => ejecutar("confirmar", () => onConfirmar(payload()))}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white transition">
            {guardando === "confirmar" ? "Guardando…" : "Confirmar y cotizar"}
          </button>
        </div>
      </div>
    </div>
  )
}
