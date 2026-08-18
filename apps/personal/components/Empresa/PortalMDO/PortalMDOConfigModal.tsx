"use client"

import { X as XIcon } from "lucide-react"
import { useCurrentUser } from "@/lib/useCurrentUser"

interface Props {
  onClose: () => void
  onNavigate: (id: string, tab?: string) => void
}

export function PortalMDOConfigModal({ onClose }: Props) {
  const { user } = useCurrentUser()

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Configuración</span>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <XIcon size={16} />
          </button>
        </div>

        <div className="px-4 py-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cuenta</p>
          <p className="text-sm text-slate-800 dark:text-slate-100">{user?.username ?? "—"}</p>
          <p className="text-xs text-slate-500">{user?.email ?? ""}</p>
        </div>
      </div>
    </div>
  )
}
